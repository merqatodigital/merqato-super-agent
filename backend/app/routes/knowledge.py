from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth import require_session
from app.database import get_db
from app.schemas import KnowledgeEntry
from app.services import knowledge_service, client_service

router = APIRouter(prefix="/api/clients/{client_id}/knowledge", tags=["knowledge"])


@router.get("/search", response_model=list[KnowledgeEntry])
def search_knowledge(
    client_id: str,
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    _token: str = Depends(require_session),
):
    client = client_service.get_client(db, client_id)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    return knowledge_service.search_knowledge(db, client_id, q)
