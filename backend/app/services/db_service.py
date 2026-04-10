"""
GhostLaw Database Service — In-memory store for dev, Supabase for prod.
Zero cost in development. Free tier in production.
"""

import uuid
import hashlib
import secrets
from datetime import datetime, timezone
from typing import Optional, Union


def _hash_password(password: str) -> str:
    """Simple secure password hashing without bcrypt dependency issues."""
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    salt, hashed = stored.split("$", 1)
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return check.hex() == hashed


# ── In-Memory Store (dev mode, no external DB needed) ─────────
_users: dict[str, dict] = {}
_scans: dict[str, dict] = {}
_disputes: dict[str, dict] = {}
_calls: dict[str, dict] = {}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:16]


# ── Users ─────────────────────────────────────────────────────
def create_user(email: str, password: str, name: str) -> dict:
    if any(u["email"] == email for u in _users.values()):
        raise ValueError("This email is already registered — try signing in instead")
    user_id = _new_id()
    user = {
        "user_id": user_id,
        "email": email,
        "password_hash": _hash_password(password),
        "name": name,
        "created_at": _now(),
        "scans_count": 0,
        "disputes_count": 0,
        "total_saved": 0.0,
    }
    _users[user_id] = user
    return user


def find_or_create_social_user(email: str, name: str, provider: str) -> dict:
    """Find existing user by email or create a new social-auth user."""
    for user in _users.values():
        if user["email"] == email:
            return user
    # Create new user — no password for social logins
    user_id = _new_id()
    user = {
        "user_id": user_id,
        "email": email,
        "password_hash": "",
        "name": name,
        "provider": provider,
        "created_at": _now(),
        "scans_count": 0,
        "disputes_count": 0,
        "total_saved": 0.0,
    }
    _users[user_id] = user
    return user


def verify_user(email: str, password: str) -> Union[dict, None, bool]:
    """Return user dict on success, None if wrong password, False if email not found."""
    for user in _users.values():
        if user["email"] == email:
            if not user.get("password_hash"):
                return None  # social-only user, no password set
            if _verify_password(password, user["password_hash"]):
                return user
            return None  # wrong password
    return False  # email not found


def get_user(user_id: str) -> Optional[dict]:
    return _users.get(user_id)


# ── Scans ─────────────────────────────────────────────────────
def save_scan(user_id: str, scan_result: dict) -> dict:
    scan_id = _new_id()
    scan = {
        "scan_id": scan_id,
        "user_id": user_id,
        **scan_result,
        "created_at": _now(),
    }
    _scans[scan_id] = scan
    # Update user stats
    if user_id in _users:
        _users[user_id]["scans_count"] += 1
    return scan


def get_scan(scan_id: str, user_id: str) -> Optional[dict]:
    scan = _scans.get(scan_id)
    if scan and scan.get("user_id") == user_id:
        return scan
    return None


def get_user_scans(user_id: str) -> list:
    return sorted(
        [s for s in _scans.values() if s.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ── Disputes ──────────────────────────────────────────────────
def save_dispute(user_id: str, scan_id: str, dispute_data: dict) -> dict:
    dispute_id = _new_id()
    dispute = {
        "dispute_id": dispute_id,
        "scan_id": scan_id,
        "user_id": user_id,
        **dispute_data,
        "status": "draft",
        "created_at": _now(),
    }
    _disputes[dispute_id] = dispute
    if user_id in _users:
        _users[user_id]["disputes_count"] += 1
    return dispute


def get_dispute(dispute_id: str, user_id: str) -> Optional[dict]:
    dispute = _disputes.get(dispute_id)
    if dispute and dispute.get("user_id") == user_id:
        return dispute
    return None


def get_user_disputes(user_id: str) -> list:
    return sorted(
        [d for d in _disputes.values() if d.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ── Calls ─────────────────────────────────────────────────────
def save_call(user_id: str, call_data: dict) -> dict:
    call_id = _new_id()
    call = {
        "call_id": call_id,
        "user_id": user_id,
        **call_data,
        "status": "queued",
        "created_at": _now(),
    }
    _calls[call_id] = call
    return call


def get_call(call_id: str, user_id: str) -> Optional[dict]:
    call = _calls.get(call_id)
    if call and call.get("user_id") == user_id:
        return call
    return None


def get_user_calls(user_id: str) -> list:
    return sorted(
        [c for c in _calls.values() if c.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ── Dashboard ─────────────────────────────────────────────────
def get_dashboard_stats(user_id: str) -> dict:
    scans = get_user_scans(user_id)
    disputes = get_user_disputes(user_id)
    calls = get_user_calls(user_id)

    total_saved = sum(
        d.get("estimated_savings", 0) for d in disputes
    )

    recent = []
    for s in scans[:3]:
        recent.append({
            "type": "scan",
            "title": f"Scanned {s.get('document_type', 'document')}",
            "detail": s.get("summary", ""),
            "date": s["created_at"],
        })
    for d in disputes[:3]:
        recent.append({
            "type": "dispute",
            "title": f"Dispute: {d.get('subject_line', 'Letter generated')}",
            "detail": f"Potential savings: ${d.get('estimated_savings', 0):,.2f}",
            "date": d["created_at"],
        })
    recent.sort(key=lambda x: x["date"], reverse=True)

    return {
        "total_scans": len(scans),
        "total_disputes": len(disputes),
        "total_calls": len(calls),
        "total_saved": total_saved,
        "active_disputes": len([d for d in disputes if d.get("status") == "draft"]),
        "recent_activity": recent[:5],
    }
