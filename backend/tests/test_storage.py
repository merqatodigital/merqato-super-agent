import json
import uuid
from pathlib import Path


def test_client_workspace_created(client, auth_headers, tmp_storage):
    resp = client.post(
        "/api/clients",
        json={"name": "Storage Test"},
        headers=auth_headers,
    )
    client_id = resp.json()["id"]
    client_dir = tmp_storage / "clients" / client_id

    assert client_dir.exists()
    assert (client_dir / "documents").is_dir()
    assert (client_dir / "extracted").is_dir()
    assert (client_dir / "knowledge").is_dir()


def test_business_profile_no_secrets(client, auth_headers, tmp_storage):
    resp = client.post(
        "/api/clients",
        json={"name": "Secret Test", "contact_email": "test@example.com"},
        headers=auth_headers,
    )
    client_id = resp.json()["id"]
    profile_path = tmp_storage / "clients" / client_id / "business_profile.json"

    assert profile_path.exists()
    data = json.loads(profile_path.read_text(encoding="utf-8"))
    assert data["name"] == "Secret Test"
    assert data["contact_email"] == "test@example.com"
    secret_keys = {"api_key", "access_token", "secret", "password", "token"}
    assert not secret_keys.intersection(data.keys())


def test_separate_storage_directories(client, auth_headers, tmp_storage):
    resp1 = client.post(
        "/api/clients",
        json={"name": "Client A"},
        headers=auth_headers,
    )
    resp2 = client.post(
        "/api/clients",
        json={"name": "Client B"},
        headers=auth_headers,
    )
    id1 = resp1.json()["id"]
    id2 = resp2.json()["id"]

    assert id1 != id2
    dir1 = tmp_storage / "clients" / id1
    dir2 = tmp_storage / "clients" / id2
    assert dir1.exists()
    assert dir2.exists()
    assert dir1 != dir2
