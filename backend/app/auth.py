"""Session-based authentication using HttpOnly cookies.

No bearer tokens. No secrets in the browser.
"""

import hashlib
import hmac
import os
import secrets
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from typing import Optional

from fastapi import Cookie, HTTPException, Request, status

_SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def _get_session_secret() -> str:
    return os.environ.get("MERQATO_SESSION_SECRET", "")


# ---------------------------------------------------------------------------
# Password hashing  (PBKDF2-SHA256 – no extra dependencies)
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, hex_hash = stored.split("$", 1)
    except ValueError:
        return False
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 260_000)
    return hmac.compare_digest(dk.hex(), hex_hash)


# ---------------------------------------------------------------------------
# Session tokens  (HMAC-SHA256 signed, HttpOnly cookie)
# ---------------------------------------------------------------------------

def _sign(payload: str) -> str:
    return hmac.new(_get_session_secret().encode(), payload.encode(), "sha256").hexdigest()


def create_session_token(client_id: str) -> str:
    exp = int(time.time()) + _SESSION_MAX_AGE
    payload = f"{client_id}:{exp}"
    sig = _sign(payload)
    return urlsafe_b64encode(f"{payload}:{sig}".encode()).decode()


def _parse_session_token(token: str) -> Optional[str]:
    """Return client_id if valid, else None."""
    if not _get_session_secret():
        return None
    try:
        raw = urlsafe_b64decode(token.encode()).decode()
        payload, sig = raw.rsplit(":", 1)
        if not hmac.compare_digest(_sign(payload), sig):
            return None
        client_id, exp_str = payload.split(":", 1)
        if int(exp_str) < time.time():
            return None
        return client_id
    except Exception:
        return None


# ---------------------------------------------------------------------------
# FastAPI dependencies
# ---------------------------------------------------------------------------

async def require_session(
    request: Request,
    session: Optional[str] = Cookie(default=None, alias="session"),
) -> str:
    """Validate session cookie. Returns client_id. Raises 401 on failure."""
    if not _get_session_secret():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Session secret not configured (set MERQATO_SESSION_SECRET)",
        )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    client_id = _parse_session_token(session)
    if client_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
        )
    request.state.client_id = client_id
    return client_id


def ensure_client_access(session_client_id: str, target_client_id: str, db) -> None:
    """Allow the instance administrator or the owner of the customer workspace."""
    if session_client_id == target_client_id:
        return

    from app.models import Client

    administrator = (
        db.query(Client)
        .filter(Client.password_hash.is_not(None))
        .order_by(Client.created_at.asc())
        .first()
    )
    if administrator is not None and administrator.id == session_client_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this customer workspace",
    )
