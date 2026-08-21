from datetime import datetime

from pydantic import BaseModel


class CreateClientRequest(BaseModel):
    name: str
    plan: str = "solo"
    contact_email: str | None = None
    industry: str | None = None
    description: str | None = None
    website: str | None = None
    contact_phone: str | None = None
    operating_hours: str | None = None
    products_services: str | None = None
    brand_voice: str | None = None
    agent_name: str | None = None
    model_provider: str | None = None
    model_name: str | None = None
    hermes_profile: str | None = None


class Client(BaseModel):
    id: str
    name: str
    plan: str
    contact_email: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str
    version: str
