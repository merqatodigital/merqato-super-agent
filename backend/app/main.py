from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.database import init_db
from app.routes.clients import router as clients_router
from app.routes.documents import router as documents_router
from app.routes.knowledge import router as knowledge_router
from app.schemas import HealthResponse


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="MERQATO Super Agent API", version="0.1.0-draft", lifespan=lifespan)

from app.routes.chat import router as chat_router

app.include_router(clients_router)
app.include_router(documents_router)
app.include_router(knowledge_router)
app.include_router(chat_router)


@app.get("/health", response_model=HealthResponse, tags=["health"])
def health():
    return HealthResponse(status="ok", version="0.1.0-draft")
