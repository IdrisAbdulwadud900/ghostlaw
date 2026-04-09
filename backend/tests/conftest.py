"""
Shared test fixtures for GhostLaw backend tests.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.db_service import _users, _scans, _disputes, _calls


@pytest.fixture(autouse=True)
def _clean_db():
    """Clear in-memory stores before each test."""
    _users.clear()
    _scans.clear()
    _disputes.clear()
    _calls.clear()
    yield
    _users.clear()
    _scans.clear()
    _disputes.clear()
    _calls.clear()


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_header(client: TestClient):
    """Signup a fresh user and return an Authorization header dict."""
    resp = client.post("/auth/signup", json={
        "email": "test@example.com",
        "password": "Pass1234!",
        "name": "Test User",
    })
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def scan_id(client: TestClient, auth_header: dict):
    """Create a scan via /scan/text and return the scan_id."""
    resp = client.post(
        "/scan/text",
        data={
            "document_text": "Your electricity bill: service charge $120, delivery charge $85, "
                             "regulatory fee $9.99, convenience fee $4.99 (new), paper statement fee $2.50.",
            "context": "electric bill",
        },
        headers=auth_header,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["scan_id"]
