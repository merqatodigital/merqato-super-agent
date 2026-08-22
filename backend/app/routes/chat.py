"""Backend chat routes.

Provides the SSE streaming chat endpoint that bridges the frontend
to the Hermes Agent runtime.
"""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.models import Client, ChatSession, ChatMessage
from app.hermes.runtime import (
    check_openrouter_key,
    check_ollama_status,
    create_customer_profile,
    stream_chat,
    get_profile_dir,
)
from app.services import client_service

router = APIRouter(prefix="/api", tags=["chat"])

# Chat request/response models
class ChatRequest(BaseModel):
    client_id: str
    message: str
    model: str | None = None
    session_id: str | None = None

class ChatResponse(BaseModel):
    id: str
    client_id: str
    session_id: str
    message: str
    role: str
    created_at: datetime

class ModelInfo(BaseModel):
    id: str
    name: str
    provider: str
    source: str
    free: bool
    context_length: int
    prompt_per_m: float
    completion_per_m: float
    description: str

# In-memory store for chat sessions (in production, use Redis or similar)
_active_sessions: dict[str, Any] = {}


def _get_client_profile(client: Client) -> str:
    """Get the Hermes profile name for a client."""
    # Use hermes_profile if set, otherwise derive from client_id
    if client.hermes_profile:
        return client.hermes_profile
    return f"customer-{client.id}"


def _ensure_client_profile_exists(client: Client, db: Session) -> str:
    """Ensure a Hermes profile exists for the client. Create if needed."""
    profile_name = _get_client_profile(client)
    profile_dir = get_profile_dir(profile_name)
    
    if not profile_dir.exists():
        # Create the profile
        api_key = None
        # In production, retrieve stored API key from secure storage
        # For now, the profile is created without API key and must be configured separately
        
        model_provider = client.model_provider or "openrouter"
        model_name = client.model_name or "anthropic/claude-sonnet-4"
        
        create_customer_profile(
            client_id=client.id,
            customer_name=client.name,
            api_key=api_key,
            model_provider=model_provider,
            model_name=model_name,
        )
        
        # Update the client record with the profile name
        client.hermes_profile = profile_name
        db.commit()
    
    return profile_name


@router.post("/chat/stream")
async def stream_chat_endpoint(
    request: Request,
    client_id: str,
    message: str,
    model: str | None = None,
    session_id: str | None = None,
    db: Session = Depends(get_db),
    _token: str = Depends(require_admin),
):
    """Stream a chat response from Hermes for a customer.
    
    This endpoint receives a message from the frontend and streams
    the Hermes Agent response back via Server-Sent Events (SSE).
    
    The customer's Hermes profile is used to execute the chat.
    """
    # Get or create the client
    client = client_service.get_client(db, client_id)
    if not client:
        # If client doesn't exist in our DB, create a minimal one
        # In production, this should be done through proper onboarding
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Ensure the Hermes profile exists for this client
    profile_name = _ensure_client_profile_exists(client, db)
    
    # Generate session ID if not provided
    if not session_id:
        session_id = str(uuid4())
    
    # Store session metadata
    chat_session = ChatSession(
        id=session_id,
        client_id=client_id,
        started_at=datetime.now(timezone.utc),
    )
    db.add(chat_session)
    db.commit()
    
    # Create a streaming response that yields SSE events
    async def event_generator():
        try:
            # Stream the chat response
            for chunk in stream_chat(profile_name, [{"role": "user", "content": message}], model=model):
                # Yield as SSE event
                yield f"data: {chunk}"
                yield "\n\n"
            
            # Mark session as complete
            yield f"data: [DONE]"
            yield "\n\n"
            
        except Exception as e:
            yield f"data: ERROR:{e}"
            yield "\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/chat/{client_id}")
async def chat_endpoint(
    client_id: str,
    request: ChatRequest,
    db: Session = Depends(get_db),
    _token: str = Depends(require_admin),
):
    """Execute a chat query and return the complete response.
    
    This is a non-streaming endpoint for simple queries.
    For streaming, use /api/chat/stream.
    """
    client = client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    profile_name = _ensure_client_profile_exists(client, db)
    
    messages = [{"role": "user", "content": request.message}]
    if request.session_id:
        # Retrieve conversation history for this session
        session_msgs = db.query(ChatMessage).filter(
            ChatMessage.session_id == request.session_id
        ).order_by(ChatMessage.created_at).all()
        for msg in session_msgs:
            messages.append({"role": msg.role, "content": msg.content})
    
    # Execute chat
    full_response = ""
    for chunk in stream_chat(profile_name, messages, model=request.model):
        full_response += chunk
    
    # Save the conversation
    chat_session = ChatSession(
        id=request.session_id or str(uuid4()),
        client_id=client_id,
        started_at=datetime.now(timezone.utc),
    )
    db.add(chat_session)
    
    user_msg = ChatMessage(
        id=str(uuid4()),
        session_id=chat_session.id,
        role="user",
        content=request.message,
        created_at=datetime.now(timezone.utc),
    )
    assistant_msg = ChatMessage(
        id=str(uuid4()),
        session_id=chat_session.id,
        role="assistant",
        content=full_response,
        created_at=datetime.now(timezone.utc),
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    
    return {
        "response": full_response,
        "session_id": chat_session.id,
        "model": request.model,
    }


@router.get("/hermes/status")
async def hermes_status(
    client_id: str | None = None,
    db: Session = Depends(get_db),
    _token: str = Depends(require_admin),
):
    """Get the Hermes agent runtime status.
    
    Returns whether Hermes is available and, if a client_id is provided,
    the status of that client's Hermes profile.
    """
    from app.hermes.runtime import get_profile_dir
    
    status_info = {
        "running": True,
        "version": "0.20.0",
        "note": "Hermes Agent v0.20.0 available",
    }
    
    if client_id:
        client = client_service.get_client(db, client_id)
        if client:
            profile_name = _get_client_profile(client)
            profile_dir = get_profile_dir(profile_name)
            status_info["profile"] = profile_name
            status_info["profile_exists"] = profile_dir.exists()
            status_info["distribution_version"] = "0.1.0"
        else:
            status_info["profile"] = None
            status_info["profile_exists"] = False
    
    return status_info


@router.get("/models/openrouter")
async def list_openrouter_models():
    """List available OpenRouter models.
    
    This is a direct call to OpenRouter's API - in production this should
    be cached and served from the backend.
    """
    from app.hermes.runtime import check_openrouter_key
    import requests
    
    try:
        resp = requests.get("https://openrouter.ai/api/v1/models", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            models = []
            for model in data.get("data", []):
                models.append(ModelInfo(
                    id=model.get("id", ""),
                    name=model.get("name", model.get("id", "")),
                    provider=model.get("organization", "openrouter"),
                    source="openrouter",
                    free=model.get("pricing", {}).get("prompt", "0") == "0",
                    context_length=model.get("context_length", 0),
                    prompt_per_m=float(model.get("pricing", {}).get("prompt", "0") or 0),
                    completion_per_m=float(model.get("pricing", {}).get("completion", "0") or 0),
                    description=model.get("description", ""),
                ))
            return {"models": [m.model_dump() for m in models]}
    except Exception as e:
        return {"error": str(e), "models": []}
    
    return {"models": []}


@router.get("/models/ollama")
async def list_ollama_models(base_url: str = "http://localhost:11434"):
    """List available Ollama models."""
    from app.hermes.runtime import check_ollama_status
    
    status = check_ollama_status(base_url)
    if status["available"]:
        models = [
            ModelInfo(
                id=f"ollama/{m['name']}",
                name=m["name"],
                provider="ollama",
                source="ollama",
                free=True,
                context_length=0,
                prompt_per_m=0,
                completion_per_m=0,
                description=f"Local model ({m['name']})",
            )
            for m in status["models"]
        ]
        return {"models": [m.model_dump() for m in models]}
    
    return {"models": [], "error": "Ollama not available"}


@router.post("/models/ollama/verify")
async def verify_ollama_connection(base_url: str):
    """Verify Ollama connection and return status."""
    from app.hermes.runtime import check_ollama_status
    
    status = check_ollama_status(base_url)
    return status


@router.post("/openai/verify")
async def verify_openrouter_key_endpoint(api_key: str):
    """Verify an OpenRouter API key."""
    result = check_openrouter_key(api_key)
    return result
