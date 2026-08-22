import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

TEST_SESSION_SECRET = "test-secret-for-unit-tests-32chars!!"


@pytest.fixture(autouse=True)
def _set_session_secret():
    os.environ["MERQATO_SESSION_SECRET"] = TEST_SESSION_SECRET
    yield
    os.environ.pop("MERQATO_SESSION_SECRET", None)


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


def _create_test_session(c: TestClient, client_id: str) -> str:
    """Create a valid session token for testing."""
    from app.auth import create_session_token
    return create_session_token(client_id)


@pytest.fixture()
def auth_cookie(client):
    """Create a test client via /api/setup, then set session cookie on the client instance."""
    resp = client.post("/api/setup", json={
        "email": "test@example.com",
        "password": "testpass123",
        "name": "Test Admin",
    })
    assert resp.status_code == 200
    cid = resp.json()["client_id"]
    token = _create_test_session(client, cid)
    client.cookies.set("session", token)
    return {"session": token}
