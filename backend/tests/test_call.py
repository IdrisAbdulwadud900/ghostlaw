"""Tests for call script endpoints."""


def test_request_call(client, auth_header, scan_id):
    resp = client.post(
        "/call/request",
        json={
            "scan_id": scan_id,
            "company_name": "Acme Electric Co",
            "objective": "Dispute the convenience fee",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "call_id" in data
    assert "script" in data
    script = data["script"]
    assert "opening_script" in script
    assert "key_points" in script


def test_request_call_no_scan(client, auth_header):
    """Call with a non-existent scan_id — should still work (scan is optional in logic)."""
    resp = client.post(
        "/call/request",
        json={
            "scan_id": "no_such_scan",
            "company_name": "Test Corp",
            "objective": "General inquiry",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "call_id" in data


def test_call_history(client, auth_header, scan_id):
    client.post(
        "/call/request",
        json={"scan_id": scan_id, "company_name": "Test", "objective": "Test"},
        headers=auth_header,
    )
    resp = client.get("/call/history", headers=auth_header)
    assert resp.status_code == 200
    calls = resp.json()
    assert isinstance(calls, list)
    assert len(calls) >= 1


def test_call_get_by_id(client, auth_header, scan_id):
    gen = client.post(
        "/call/request",
        json={"scan_id": scan_id, "company_name": "Test", "objective": "Test"},
        headers=auth_header,
    )
    call_id = gen.json()["call_id"]
    resp = client.get(f"/call/{call_id}", headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["call_id"] == call_id


def test_call_not_found(client, auth_header):
    resp = client.get("/call/nonexistent", headers=auth_header)
    assert resp.status_code == 404
