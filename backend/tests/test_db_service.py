"""Tests for db_service internals."""

from app.services.db_service import (
    create_user, verify_user, get_user,
    save_scan, get_scan, get_user_scans,
    save_dispute, get_dispute, get_user_disputes,
    save_call, get_call, get_user_calls,
    get_dashboard_stats,
)


def test_create_and_verify_user():
    user = create_user("db@test.com", "Password1!", "DB Test")
    assert user["email"] == "db@test.com"
    assert "password_hash" in user

    verified = verify_user("db@test.com", "Password1!")
    assert isinstance(verified, dict)
    assert verified["user_id"] == user["user_id"]

    wrong = verify_user("db@test.com", "WrongPass!")
    assert wrong is None

    not_found = verify_user("nonexistent@test.com", "Whatever!")
    assert not_found is False


def test_get_user():
    user = create_user("get@test.com", "Pass1!", "Get")
    fetched = get_user(user["user_id"])
    assert fetched is not None
    assert fetched["email"] == "get@test.com"
    assert get_user("nonexistent") is None


def test_duplicate_email():
    create_user("dup@test.com", "Pass1!", "One")
    try:
        create_user("dup@test.com", "Pass2!", "Two")
        assert False, "Should have raised ValueError"
    except ValueError:
        pass


def test_scan_crud():
    user = create_user("scan@test.com", "Pass1!", "Scanner")
    uid = user["user_id"]
    scan = save_scan(uid, {"document_type": "medical_bill", "summary": "test"})
    assert "scan_id" in scan

    fetched = get_scan(scan["scan_id"], uid)
    assert fetched is not None
    assert fetched["summary"] == "test"

    # Wrong user
    assert get_scan(scan["scan_id"], "other_user") is None

    scans = get_user_scans(uid)
    assert len(scans) == 1


def test_dispute_crud():
    user = create_user("disp@test.com", "Pass1!", "Disputer")
    uid = user["user_id"]
    scan = save_scan(uid, {"document_type": "lease", "summary": "lease scan"})
    dispute = save_dispute(uid, scan["scan_id"], {"letter_body": "Dear Sir..."})
    assert "dispute_id" in dispute

    fetched = get_dispute(dispute["dispute_id"], uid)
    assert fetched is not None
    assert get_dispute(dispute["dispute_id"], "other") is None

    disputes = get_user_disputes(uid)
    assert len(disputes) == 1


def test_call_crud():
    user = create_user("call@test.com", "Pass1!", "Caller")
    uid = user["user_id"]
    call = save_call(uid, {"company_name": "Test Corp", "script": {}})
    assert "call_id" in call

    fetched = get_call(call["call_id"], uid)
    assert fetched is not None
    assert get_call(call["call_id"], "other") is None

    calls = get_user_calls(uid)
    assert len(calls) == 1


def test_dashboard_stats():
    user = create_user("dash@test.com", "Pass1!", "Dash")
    uid = user["user_id"]
    save_scan(uid, {"document_type": "other", "summary": "s"})
    save_scan(uid, {"document_type": "other", "summary": "s2"})
    save_dispute(uid, "scan1", {"estimated_savings": 100})

    stats = get_dashboard_stats(uid)
    assert stats["total_scans"] == 2
    assert stats["total_disputes"] == 1
    assert stats["total_saved"] == 100
