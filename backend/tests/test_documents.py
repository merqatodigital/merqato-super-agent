import io
import uuid


def _create_client(client, auth_cookie, name="Test Client"):
    resp = client.post(
        "/api/clients",
        json={"name": name, "plan": "solo"},
        
    )
    return resp.json()["id"]


def _upload_file(client, auth_cookie, client_id, filename, content, title=None):
    files = {"file": (filename, io.BytesIO(content), "application/octet-stream")}
    data = {}
    if title:
        data["title"] = title
    return client.post(
        f"/api/clients/{client_id}/documents",
        files=files,
        data=data,
        
    )


def test_upload_text_document(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    content = b"This is a test document with some content about MERQATO."
    resp = _upload_file(client, auth_cookie, client_id, "test.txt", content, "Test Doc")
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Test Doc"
    assert body["mime_type"] == "text/plain"
    assert body["file_size"] == len(content)
    assert body["extraction_status"] == "completed"
    uuid.UUID(body["id"])


def test_upload_markdown_document(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    content = b"# Title\n\nThis is markdown content about AI agents."
    resp = _upload_file(client, auth_cookie, client_id, "readme.md", content, "README")
    assert resp.status_code == 201
    body = resp.json()
    assert body["mime_type"] == "text/markdown"
    assert body["extraction_status"] == "completed"


def test_upload_csv_document(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    content = b"name,industry\nAcme Corp,Technology\nBeta Inc,Finance"
    resp = _upload_file(client, auth_cookie, client_id, "data.csv", content, "CSV Data")
    assert resp.status_code == 201
    body = resp.json()
    assert body["mime_type"] == "text/csv"
    assert body["extraction_status"] == "completed"


def test_text_extraction_stores_file(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    content = b"Extracted text content for testing."
    resp = _upload_file(client, auth_cookie, client_id, "extract.txt", content)
    doc_id = resp.json()["id"]
    extracted_path = tmp_storage / "clients" / client_id / "extracted" / f"{doc_id}.txt"
    assert extracted_path.exists()
    assert extracted_path.read_text(encoding="utf-8") == "Extracted text content for testing."


def test_search_returns_results(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    content = b"The quick brown fox jumps over the lazy dog near the river bank."
    _upload_file(client, auth_cookie, client_id, "fox.txt", content, "Fox Story")
    resp = client.get(
        f"/api/clients/{client_id}/knowledge/search?q=fox",
        
    )
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) >= 1
    assert results[0]["title"] == "Fox Story"
    assert results[0]["client_id"] == client_id


def test_search_scoped_to_client(client, auth_cookie, tmp_storage):
    client1 = _create_client(client, auth_cookie, "Client 1")
    client2 = _create_client(client, auth_cookie, "Client 2")
    _upload_file(client, auth_cookie, client1, "a.txt", b"Alpha document about dogs.", "Alpha")
    _upload_file(client, auth_cookie, client2, "b.txt", b"Beta document about cats.", "Beta")
    resp1 = client.get(f"/api/clients/{client1}/knowledge/search?q=dogs", cookies=auth_cookie)
    resp2 = client.get(f"/api/clients/{client2}/knowledge/search?q=dogs", cookies=auth_cookie)
    assert len(resp1.json()) >= 1
    assert len(resp2.json()) == 0


def test_unsupported_file_rejection(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    resp = _upload_file(client, auth_cookie, client_id, "bad.exe", b"malware")
    assert resp.status_code == 422
    assert "Unsupported file type" in resp.json()["detail"]


def test_oversized_file_rejection(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    big_content = b"x" * (50 * 1024 * 1024 + 1)
    resp = _upload_file(client, auth_cookie, client_id, "huge.txt", big_content)
    assert resp.status_code == 422
    assert "File too large" in resp.json()["detail"]


def test_upload_missing_client(client, auth_cookie):
    fake_id = str(uuid.uuid4())
    resp = _upload_file(client, auth_cookie, fake_id, "test.txt", b"content")
    assert resp.status_code == 404


def test_search_missing_client(client, auth_cookie):
    fake_id = str(uuid.uuid4())
    resp = client.get(f"/api/clients/{fake_id}/knowledge/search?q=test", cookies=auth_cookie)
    assert resp.status_code == 404


def test_list_documents(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    _upload_file(client, auth_cookie, client_id, "doc1.txt", b"First doc", "Doc 1")
    _upload_file(client, auth_cookie, client_id, "doc2.txt", b"Second doc", "Doc 2")
    resp = client.get(f"/api/clients/{client_id}/documents", cookies=auth_cookie)
    assert resp.status_code == 200
    docs = resp.json()
    assert len(docs) == 2
    titles = {d["title"] for d in docs}
    assert "Doc 1" in titles
    assert "Doc 2" in titles


def test_upload_no_auth(client):
    resp = client.post(
        "/api/clients/fake/documents",
        files={"file": ("test.txt", io.BytesIO(b"content"), "text/plain")},
    )
    assert resp.status_code == 401


def test_search_no_auth(client):
    resp = client.get("/api/clients/fake/knowledge/search?q=test")
    assert resp.status_code == 401


def test_document_id_is_uuid(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    resp = _upload_file(client, auth_cookie, client_id, "uuid.txt", b"content")
    doc_id = resp.json()["id"]
    uuid.UUID(doc_id)


def test_separate_client_documents(client, auth_cookie, tmp_storage):
    c1 = _create_client(client, auth_cookie, "A")
    c2 = _create_client(client, auth_cookie, "B")
    _upload_file(client, auth_cookie, c1, "a.txt", b"Doc A content")
    _upload_file(client, auth_cookie, c2, "b.txt", b"Doc B content")
    docs1 = client.get(f"/api/clients/{c1}/documents", cookies=auth_cookie).json()
    docs2 = client.get(f"/api/clients/{c2}/documents", cookies=auth_cookie).json()
    assert len(docs1) == 1
    assert len(docs2) == 1
    assert docs1[0]["client_id"] == c1
    assert docs2[0]["client_id"] == c2


def test_search_empty_query(client, auth_cookie, tmp_storage):
    client_id = _create_client(client, auth_cookie)
    resp = client.get(f"/api/clients/{client_id}/knowledge/search?q=", cookies=auth_cookie)
    assert resp.status_code == 422


def test_health_still_works(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_client_still_works(client, auth_cookie):
    resp = client.post(
        "/api/clients",
        json={"name": "Phase1 Test", "plan": "solo"},
        
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Phase1 Test"


def test_get_client_still_works(client, auth_cookie):
    create_resp = client.post(
        "/api/clients",
        json={"name": "Get Test"},
        
    )
    client_id = create_resp.json()["id"]
    get_resp = client.get(f"/api/clients/{client_id}", cookies=auth_cookie)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Get Test"
