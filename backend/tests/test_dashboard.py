"""Tests for dashboard and health endpoints."""


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_root(client):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["app"] == "GhostLaw"
    assert "version" in data
    assert "status" in data


def test_dashboard_stats_empty(client, auth_header):
    resp = client.get("/dashboard/stats", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_scans"] == 0
    assert data["total_disputes"] == 0
    assert data["total_calls"] == 0


def test_dashboard_stats_after_scan(client, auth_header, scan_id):
    resp = client.get("/dashboard/stats", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_scans"] >= 1


def test_dashboard_unauthenticated(client):
    resp = client.get("/dashboard/stats")
    assert resp.status_code == 403
