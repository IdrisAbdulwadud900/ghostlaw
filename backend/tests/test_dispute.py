"""Tests for dispute endpoints — generate and history."""


def test_generate_dispute(client, auth_header, scan_id):
    resp = client.post(
        "/dispute/generate",
        json={
            "scan_id": scan_id,
            "tone": "firm_but_polite",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "dispute_id" in data
    assert "letter_body" in data or "subject_line" in data


def test_generate_dispute_aggressive_tone(client, auth_header, scan_id):
    resp = client.post(
        "/dispute/generate",
        json={"scan_id": scan_id, "tone": "aggressive"},
        headers=auth_header,
    )
    assert resp.status_code == 200


def test_generate_dispute_bad_scan_id(client, auth_header):
    resp = client.post(
        "/dispute/generate",
        json={"scan_id": "nonexistent", "tone": "firm_but_polite"},
        headers=auth_header,
    )
    assert resp.status_code == 404


def test_dispute_history(client, auth_header, scan_id):
    # Generate one dispute first
    client.post(
        "/dispute/generate",
        json={"scan_id": scan_id},
        headers=auth_header,
    )
    resp = client.get("/dispute/history", headers=auth_header)
    assert resp.status_code == 200
    disputes = resp.json()
    assert isinstance(disputes, list)
    assert len(disputes) >= 1


def test_dispute_get_by_id(client, auth_header, scan_id):
    gen = client.post(
        "/dispute/generate",
        json={"scan_id": scan_id},
        headers=auth_header,
    )
    dispute_id = gen.json()["dispute_id"]
    resp = client.get(f"/dispute/{dispute_id}", headers=auth_header)
    assert resp.status_code == 200
    assert resp.json()["dispute_id"] == dispute_id


def test_dispute_not_found(client, auth_header):
    resp = client.get("/dispute/nonexistent", headers=auth_header)
    assert resp.status_code == 404
