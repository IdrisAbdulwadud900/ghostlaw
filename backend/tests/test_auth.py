"""Tests for auth endpoints — signup, login, /me."""


def test_signup_success(client):
    resp = client.post("/auth/signup", json={
        "email": "new@example.com",
        "password": "StrongP4ss!",
        "name": "New User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["email"] == "new@example.com"
    assert data["name"] == "New User"
    assert "user_id" in data


def test_signup_duplicate_email(client):
    client.post("/auth/signup", json={
        "email": "dup@example.com", "password": "Pass1234!", "name": "First",
    })
    resp = client.post("/auth/signup", json={
        "email": "dup@example.com", "password": "Pass1234!", "name": "Second",
    })
    assert resp.status_code == 400
    assert "already" in resp.json()["detail"].lower()


def test_signup_short_password(client):
    resp = client.post("/auth/signup", json={
        "email": "x@x.com", "password": "hi", "name": "Name",
    })
    assert resp.status_code == 422  # validation error


def test_login_success(client):
    client.post("/auth/signup", json={
        "email": "login@example.com", "password": "Good1234!", "name": "Login",
    })
    resp = client.post("/auth/login", json={
        "email": "login@example.com", "password": "Good1234!",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/auth/signup", json={
        "email": "wrong@example.com", "password": "Good1234!", "name": "Wrong",
    })
    resp = client.post("/auth/login", json={
        "email": "wrong@example.com", "password": "bad",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client):
    resp = client.post("/auth/login", json={
        "email": "nobody@example.com", "password": "irrelevant",
    })
    assert resp.status_code == 401


def test_me_authenticated(client, auth_header):
    resp = client.get("/auth/me", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 403  # no bearer


def test_me_invalid_token(client):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer garbage"})
    assert resp.status_code == 401
