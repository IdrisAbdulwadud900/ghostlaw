"""Tests for scan endpoints — text and upload."""


def test_scan_text_success(client, auth_header):
    resp = client.post(
        "/scan/text",
        data={
            "document_text": "Monthly internet bill: service $79.99, router rental $14.99, "
                             "network maintenance fee $6.50, convenience fee $4.99.",
            "context": "internet bill",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "scan_id" in data
    assert "summary" in data
    assert "issues_found" in data
    assert isinstance(data["issues_found"], list)


def test_scan_text_too_short(client, auth_header):
    resp = client.post(
        "/scan/text",
        data={"document_text": "short"},
        headers=auth_header,
    )
    assert resp.status_code == 400


def test_scan_text_unauthenticated(client):
    resp = client.post(
        "/scan/text",
        data={"document_text": "A long enough document text for testing purposes here."},
    )
    assert resp.status_code == 403


def test_scan_history(client, auth_header, scan_id):
    resp = client.get("/scan/history", headers=auth_header)
    assert resp.status_code == 200
    scans = resp.json()
    assert isinstance(scans, list)
    assert len(scans) >= 1
    assert any(s["scan_id"] == scan_id for s in scans)


def test_scan_get_by_id(client, auth_header, scan_id):
    resp = client.get(f"/scan/{scan_id}", headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["scan_id"] == scan_id


def test_scan_get_not_found(client, auth_header):
    resp = client.get("/scan/nonexistent", headers=auth_header)
    assert resp.status_code == 404


def test_scan_upload_wrong_type(client, auth_header):
    from io import BytesIO
    bad_file = BytesIO(b"not an image")
    resp = client.post(
        "/scan/upload",
        files={"file": ("test.txt", bad_file, "text/plain")},
        headers=auth_header,
    )
    assert resp.status_code == 400
    assert "not supported" in resp.json()["detail"].lower()
