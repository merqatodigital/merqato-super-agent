import uuid


def test_create_client(client, auth_headers):
    resp = client.post(
        "/api/clients",
        json={"name": "Test Corp", "plan": "solo"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Test Corp"
    assert body["plan"] == "solo"
    try:
        uuid.UUID(body["id"])
    except ValueError:
        raise AssertionError(f"ID is not a UUID: {body['id']}")


def test_client_ids_are_uuid_strings(client, auth_headers):
    resp = client.post(
        "/api/clients",
        json={"name": "UUID Test"},
        headers=auth_headers,
    )
    body = resp.json()
    uuid.UUID(body["id"])


def test_response_contains_name_field(client, auth_headers):
    resp = client.post(
        "/api/clients",
        json={"name": "Name Field Test"},
        headers=auth_headers,
    )
    assert "name" in resp.json()


def test_get_client(client, auth_headers):
    create_resp = client.post(
        "/api/clients",
        json={"name": "Get Test"},
        headers=auth_headers,
    )
    client_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/clients/{client_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Get Test"
    assert get_resp.json()["id"] == client_id


def test_get_client_not_found(client, auth_headers):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/clients/{fake_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_unauthorized_create(client):
    resp = client.post("/api/clients", json={"name": "No Auth"})
    assert resp.status_code == 401


def test_wrong_token(client):
    resp = client.post(
        "/api/clients",
        json={"name": "Bad Token"},
        headers={"Authorization": "Bearer wrong-token"},
    )
    assert resp.status_code == 401


def test_invalid_request_data(client, auth_headers):
    resp = client.post("/api/clients", json={}, headers=auth_headers)
    assert resp.status_code == 422
