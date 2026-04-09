"""Tests for complaint endpoints."""


def test_generate_complaint(client, auth_header, scan_id):
    resp = client.post(
        "/complaint/generate",
        json={
            "scan_id": scan_id,
            "agency": "cfpb",
            "company_name": "Evil Corp",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "complaint_text" in data
    assert "filing_steps" in data


def test_generate_complaint_fcc(client, auth_header, scan_id):
    resp = client.post(
        "/complaint/generate",
        json={"scan_id": scan_id, "agency": "fcc"},
        headers=auth_header,
    )
    assert resp.status_code == 200


def test_generate_complaint_state_ag(client, auth_header, scan_id):
    resp = client.post(
        "/complaint/generate",
        json={"scan_id": scan_id, "agency": "state_ag", "state": "CA"},
        headers=auth_header,
    )
    assert resp.status_code == 200


def test_generate_complaint_bad_scan(client, auth_header):
    resp = client.post(
        "/complaint/generate",
        json={"scan_id": "nonexistent", "agency": "cfpb"},
        headers=auth_header,
    )
    assert resp.status_code == 404
