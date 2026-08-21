from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import require_admin
from app.database import get_db
from app.schemas import DocumentResponse
from app.services import document_service, client_service

router = APIRouter(prefix="/api/clients/{client_id}/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    client_id: str,
    file: UploadFile,
    title: str | None = Form(None),
    db: Session = Depends(get_db),
    _token: str = Depends(require_admin),
):
    client = client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    if not file.filename:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Filename is required")

    content = await file.read()
    valid, error = document_service.validate_file(file.filename, len(content))
    if not valid:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=error)

    doc = document_service.upload_document(db, client_id, file.filename, content, title)
    return doc


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    client_id: str,
    db: Session = Depends(get_db),
    _token: str = Depends(require_admin),
):
    client = client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    return document_service.list_documents(db, client_id)
