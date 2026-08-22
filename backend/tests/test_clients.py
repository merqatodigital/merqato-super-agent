import uuid


def test_create_client(client, auth_cookie):
    resp = client.post(
        "/api/clients",
        json={"name": "Test Corp", "plan": "solo"},
        
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Test Corp"
    assert body["plan"] == "solo"
    try:
        uuid.UUID(body["id"])
    except ValueError:
        raise AssertionError(f"ID is not a UUID: {body['id']}")


def test_client_ids_are_uuid_strings(client, auth_cookie):
    resp = client.post(
        "/api/clients",
        json={"name": "UUID Test"},
        
    )
    body = resp.json()
    uuid.UUID(body["id"])


def test_response_contains_name_field(client, auth_cookie):
    resp = client.post(
        "/api/clients",
        json={"name": "Name Field Test"},
        
    )
    assert "name" in resp.json()


def test_get_client(client, auth_cookie):
    create_resp = client.post(
        "/api/clients",
        json={"name": "Get Test"},
        
    )
    client_id = create_resp.json()["id"]

    get_resp = client.get(f"/api/clients/{client_id}", cookies=auth_cookie)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Get Test"
    assert get_resp.json()["id"] == client_id


def test_get_client_not_found(client, auth_cookie):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/clients/{fake_id}", cookies=auth_cookie)
    assert resp.status_code == 404


def test_unauthenticated_create(client):
    resp = client.post("/api/clients", json={"name": "No Auth"})
    assert resp.status_code == 401


def test_invalid_session_cookie(client):
    resp = client.post(
        "/api/clients",
        json={"name": "Bad Token"},
        cookies={"session": "totally-bogus-token"},
    )
    assert resp.status_code == 401


def test_invalid_request_data(client, auth_cookie):
    resp = client.post("/api/clients", json={}, cookies=auth_cookie)
    assert resp.status_code == 422
