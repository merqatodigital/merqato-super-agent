import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_ADMIN_TOKEN = "test-token-12345"


@pytest.fixture(autouse=True)
def _set_admin_token():
    os.environ["MERQATO_ADMIN_TOKEN"] = TEST_ADMIN_TOKEN
    yield
    os.environ.pop("MERQATO_ADMIN_TOKEN", None)


@pytest.fixture()
def tmp_storage(tmp_path):
    storage = tmp_path / "storage"
    os.environ["MERQATO_STORAGE_ROOT"] = str(storage)
    yield storage
    os.environ.pop("MERQATO_STORAGE_ROOT", None)


@pytest.fixture()
def client(tmp_storage):
    def _override_get_db():
        db_path = tmp_storage.parent / "test.db"
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE VIRTUAL TABLE IF NOT EXISTS document_content USING fts5(
                    document_id,
                    client_id,
                    content,
                    tokenize='porter unicode61'
                )
            """))
            conn.commit()
        TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers():
    return {"Authorization": f"Bearer {TEST_ADMIN_TOKEN}"}
