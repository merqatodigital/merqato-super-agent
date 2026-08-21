from sqlalchemy import text
from sqlalchemy.orm import Session

from app.models import Document
from app.schemas import KnowledgeEntry


def search_knowledge(db: Session, client_id: str, query: str) -> list[KnowledgeEntry]:
    if not query.strip():
        return []

    with db.bind.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT
                    dc.document_id,
                    dc.content,
                    snippet(document_content, 2, '<mark>', '</mark>', '...', 32) as snippet,
                    bm25(document_content, 1.0) as rank
                FROM document_content dc
                WHERE dc.client_id = :client_id
                AND document_content MATCH :query
                ORDER BY rank
                LIMIT 20
            """),
            {"client_id": client_id, "query": query},
        ).fetchall()

    results = []
    for row in rows:
        doc_id = row[0]
        doc = db.query(Document).filter(Document.id == doc_id, Document.client_id == client_id).first()
        if not doc:
            continue

        snippet_text = row[2] or ""
        snippet_clean = snippet_text.replace("<mark>", "").replace("</mark>", "")

        results.append(
            KnowledgeEntry(
                id=doc.id,
                client_id=doc.client_id,
                title=doc.title,
                snippet=snippet_clean,
                source=doc.file_path,
                score=abs(float(row[3])) if row[3] else 0.0,
            )
        )

    return results
