import os
from contextlib import asynccontextmanager
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./merqato.db"
    model_config = {"env_prefix": "MERQATO_", "env_file": ".env", "extra": "ignore"}


settings = Settings()


def get_storage_root() -> Path:
    return Path(os.environ.get("MERQATO_STORAGE_ROOT", "storage"))
