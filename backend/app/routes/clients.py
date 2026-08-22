from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import ensure_client_access, require_session
from app.database import get_db
from app.schemas import Client, CreateClientRequest
from app.services import client_service

router = APIRouter(prefix="/api/clients", tags=["clients"])


@router.post("", response_model=Client, status_code=status.HTTP_201_CREATED)
def create_client(
    body: CreateClientRequest,
    db: Session = Depends(get_db),
    _token: str = Depends(require_session),
):
    client = client_service.create_client(db, name=body.name, **body.model_dump(exclude={"name"}))
    return client


@router.get("/{client_id}", response_model=Client)
def get_client(
    client_id: str,
    db: Session = Depends(get_db),
    _token: str = Depends(require_session),
):
    client = client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    ensure_client_access(_token, client_id, db)
    return client
