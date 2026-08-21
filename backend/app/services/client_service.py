import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import get_storage_root
from app.models import Client


def _client_root(client_id: str) -> Path:
    return get_storage_root() / "clients" / client_id


def create_client_storage(client: Client) -> None:
    root = _client_root(client.id)
    for sub in ("documents", "extracted", "knowledge"):
        (root / sub).mkdir(parents=True, exist_ok=True)

    business_profile = {
        "id": client.id,
        "name": client.name,
        "plan": client.plan,
        "contact_email": client.contact_email,
        "industry": client.industry,
        "description": client.description,
        "website": client.website,
        "contact_phone": client.contact_phone,
        "operating_hours": client.operating_hours,
        "products_services": client.products_services,
        "brand_voice": client.brand_voice,
        "agent_name": client.agent_name,
        "model_provider": client.model_provider,
        "model_name": client.model_name,
        "hermes_profile": client.hermes_profile,
    }
    (root / "business_profile.json").write_text(
        json.dumps(business_profile, indent=2, default=str),
        encoding="utf-8",
    )


def get_client_storage_path(client_id: str) -> Path:
    return _client_root(client_id)


def get_client(db: Session, client_id: str) -> Client | None:
    return db.query(Client).filter(Client.id == client_id).first()


def create_client(db: Session, name: str, **kwargs) -> Client:
    client = Client(name=name, **kwargs)
    db.add(client)
    db.commit()
    db.refresh(client)
    create_client_storage(client)
    return client
