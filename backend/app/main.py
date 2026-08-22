from contextlib import asynccontextmanager
from os import environ

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import require_session
from app.database import init_db
from app.routes.clients import router as clients_router
from app.routes.documents import router as documents_router
from app.routes.knowledge import router as knowledge_router
from app.schemas import HealthResponse, LoginRequest, SetupRequest


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _ensure_password_column()
    yield


def _ensure_password_column():
    """Add password_hash column to clients table if missing (SQLite)."""
    from app.database import engine
    with engine.connect() as conn:
        cols = [row[1] for row in conn.execute(
            __import__("sqlalchemy").text("PRAGMA table_info(clients)")
        )]
        if "password_hash" not in cols:
            conn.execute(__import__("sqlalchemy").text(
                "ALTER TABLE clients ADD COLUMN password_hash VARCHAR(512)"
            ))
            conn.commit()


app = FastAPI(title="MERQATO Super Agent API", version="0.1.0-draft", lifespan=lifespan)

# ---------------------------------------------------------------------------
# CORS – allow the Vercel frontend to send cookies
# ---------------------------------------------------------------------------
_origins = environ.get("CORS_ORIGINS", "").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from app.routes.chat import router as chat_router

app.include_router(clients_router)
app.include_router(documents_router)
app.include_router(knowledge_router)
app.include_router(chat_router)


# ---------------------------------------------------------------------------
# Health (public – no auth required)
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse, tags=["health"])
def health():
    return HealthResponse(status="ok", version="0.1.0-draft")


# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------
from datetime import datetime, timezone

from fastapi import Depends, Response
from sqlalchemy.orm import Session

from app.auth import create_session_token, hash_password, verify_password
from app.database import get_db
from app.models import Client


@app.get("/api/setup/status")
def setup_status(db: Session = Depends(get_db)):
    """Check whether an initial admin account exists. Public endpoint."""
    return {"needs_setup": not db.query(Client).first()}


@app.post("/api/setup")
def setup(body: SetupRequest, db: Session = Depends(get_db)):
    """Create the first admin account. Fails if any client already exists."""
    if db.query(Client).first():
        return JSONResponse(
            status_code=409,
            content={"detail": "Instance already initialised"},
        )
    client = Client(
        name=body.name,
        contact_email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"ok": True, "client_id": client.id}


@app.post("/api/auth/login")
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """Authenticate and set an HttpOnly session cookie."""
    client = db.query(Client).filter(Client.contact_email == body.email).first()
    if not client or not client.password_hash:
        return JSONResponse(status_code=401, content={"detail": "Invalid credentials"})
    if not verify_password(body.password, client.password_hash):
        return JSONResponse(status_code=401, content={"detail": "Invalid credentials"})

    token = create_session_token(client.id)
    response.set_cookie(
        key="session",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return {"ok": True, "client_id": client.id}


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("session", path="/")
    return {"ok": True}


@app.get("/api/auth/me")
def auth_me(client_id: str = Depends(require_session)):
    """Return the current session's client_id."""
    return {"client_id": client_id}
