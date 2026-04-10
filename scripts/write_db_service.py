"""Helper script to write db_service.py — run once then delete."""
import pathlib

TARGET = pathlib.Path(__file__).resolve().parent.parent / "backend" / "app" / "services" / "db_service.py"

CONTENT = r'''"""
GhostLaw Database Service — Supabase for production, in-memory fallback for dev/testing.
When SUPABASE_URL + SUPABASE_KEY are set, all data persists across deploys.
Otherwise, falls back to in-memory dicts (data lost on restart).
"""

import os
import uuid
import hashlib
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, Union

logger = logging.getLogger(__name__)


# ── Password Hashing ──────────────────────────────────────────

def _hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return f"{salt}${hashed.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    if not stored:
        return False
    parts = stored.split("$", 1)
    if len(parts) != 2:
        return False
    salt, hashed = parts
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000)
    return check.hex() == hashed


# ── Helpers ───────────────────────────────────────────────────

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return uuid.uuid4().hex[:16]


# ── Supabase Init ─────────────────────────────────────────────
_supabase = None
_SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
_SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if _SUPABASE_URL and _SUPABASE_KEY:
    try:
        from supabase import create_client
        _supabase = create_client(_SUPABASE_URL, _SUPABASE_KEY)
        logger.info("Supabase connected — data will persist across deploys")
    except Exception as e:
        logger.warning(f"Supabase init failed, using in-memory fallback: {e}")
        _supabase = None
else:
    logger.info("No SUPABASE_URL/SUPABASE_KEY — using in-memory store")


# ── In-Memory Fallback ────────────────────────────────────────
_users: dict[str, dict] = {}
_scans: dict[str, dict] = {}
_disputes: dict[str, dict] = {}
_calls: dict[str, dict] = {}


# ═══════════════════════════════════════════════════════════════
#  USERS
# ═══════════════════════════════════════════════════════════════

def create_user(email: str, password: str, name: str) -> dict:
    """Create a new user. Raises ValueError if email already exists."""
    if _supabase:
        try:
            existing = _supabase.table("users").select("user_id").eq("email", email).execute()
            if existing.data:
                raise ValueError("This email is already registered — try signing in instead")
            user_id = _new_id()
            user = {
                "user_id": user_id,
                "email": email,
                "password_hash": _hash_password(password),
                "name": name,
                "provider": "",
                "created_at": _now(),
                "scans_count": 0,
                "disputes_count": 0,
                "total_saved": 0.0,
            }
            _supabase.table("users").insert(user).execute()
            return user
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Supabase create_user failed: {e}")
            raise

    # In-memory fallback
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
    if _supabase:
        try:
            existing = _supabase.table("users").select("*").eq("email", email).execute()
            if existing.data:
                return existing.data[0]
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
            _supabase.table("users").insert(user).execute()
            return user
        except Exception as e:
            logger.error(f"Supabase find_or_create_social_user failed: {e}")
            raise

    # In-memory fallback
    for user in _users.values():
        if user["email"] == email:
            return user
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
    if _supabase:
        try:
            result = _supabase.table("users").select("*").eq("email", email).execute()
            if not result.data:
                return False  # email not found
            user = result.data[0]
            if not user.get("password_hash"):
                return None  # social-only user, no password set
            if _verify_password(password, user["password_hash"]):
                return user
            return None  # wrong password
        except Exception as e:
            logger.error(f"Supabase verify_user failed: {e}")
            return False

    # In-memory fallback
    for user in _users.values():
        if user["email"] == email:
            if not user.get("password_hash"):
                return None
            if _verify_password(password, user["password_hash"]):
                return user
            return None
    return False


def get_user(user_id: str) -> Optional[dict]:
    if _supabase:
        try:
            result = _supabase.table("users").select("*").eq("user_id", user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Supabase get_user failed: {e}")
            return None
    return _users.get(user_id)


# ═══════════════════════════════════════════════════════════════
#  SCANS
# ═══════════════════════════════════════════════════════════════

def save_scan(user_id: str, scan_result: dict) -> dict:
    scan_id = _new_id()
    scan = {
        "scan_id": scan_id,
        "user_id": user_id,
        **scan_result,
        "created_at": _now(),
    }
    if _supabase:
        try:
            _supabase.table("scans").insert({
                "scan_id": scan_id,
                "user_id": user_id,
                "data": scan,
                "created_at": scan["created_at"],
            }).execute()
            _increment_user_field(user_id, "scans_count")
        except Exception as e:
            logger.error(f"Supabase save_scan failed: {e}")
            raise
    else:
        _scans[scan_id] = scan
        if user_id in _users:
            _users[user_id]["scans_count"] += 1
    return scan


def get_scan(scan_id: str, user_id: str) -> Optional[dict]:
    if _supabase:
        try:
            result = _supabase.table("scans").select("data").eq("scan_id", scan_id).eq("user_id", user_id).execute()
            return result.data[0]["data"] if result.data else None
        except Exception as e:
            logger.error(f"Supabase get_scan failed: {e}")
            return None
    scan = _scans.get(scan_id)
    if scan and scan.get("user_id") == user_id:
        return scan
    return None


def get_user_scans(user_id: str) -> list:
    if _supabase:
        try:
            result = _supabase.table("scans").select("data").eq("user_id", user_id).order("created_at", desc=True).execute()
            return [r["data"] for r in result.data]
        except Exception as e:
            logger.error(f"Supabase get_user_scans failed: {e}")
            return []
    return sorted(
        [s for s in _scans.values() if s.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ═══════════════════════════════════════════════════════════════
#  DISPUTES
# ═══════════════════════════════════════════════════════════════

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
    if _supabase:
        try:
            _supabase.table("disputes").insert({
                "dispute_id": dispute_id,
                "scan_id": scan_id,
                "user_id": user_id,
                "data": dispute,
                "status": "draft",
                "created_at": dispute["created_at"],
            }).execute()
            _increment_user_field(user_id, "disputes_count")
        except Exception as e:
            logger.error(f"Supabase save_dispute failed: {e}")
            raise
    else:
        _disputes[dispute_id] = dispute
        if user_id in _users:
            _users[user_id]["disputes_count"] += 1
    return dispute


def get_dispute(dispute_id: str, user_id: str) -> Optional[dict]:
    if _supabase:
        try:
            result = _supabase.table("disputes").select("data").eq("dispute_id", dispute_id).eq("user_id", user_id).execute()
            return result.data[0]["data"] if result.data else None
        except Exception as e:
            logger.error(f"Supabase get_dispute failed: {e}")
            return None
    dispute = _disputes.get(dispute_id)
    if dispute and dispute.get("user_id") == user_id:
        return dispute
    return None


def get_user_disputes(user_id: str) -> list:
    if _supabase:
        try:
            result = _supabase.table("disputes").select("data").eq("user_id", user_id).order("created_at", desc=True).execute()
            return [r["data"] for r in result.data]
        except Exception as e:
            logger.error(f"Supabase get_user_disputes failed: {e}")
            return []
    return sorted(
        [d for d in _disputes.values() if d.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ═══════════════════════════════════════════════════════════════
#  CALLS
# ═══════════════════════════════════════════════════════════════

def save_call(user_id: str, call_data: dict) -> dict:
    call_id = _new_id()
    call = {
        "call_id": call_id,
        "user_id": user_id,
        **call_data,
        "status": "queued",
        "created_at": _now(),
    }
    if _supabase:
        try:
            _supabase.table("calls").insert({
                "call_id": call_id,
                "user_id": user_id,
                "data": call,
                "status": "queued",
                "created_at": call["created_at"],
            }).execute()
        except Exception as e:
            logger.error(f"Supabase save_call failed: {e}")
            raise
    else:
        _calls[call_id] = call
    return call


def get_call(call_id: str, user_id: str) -> Optional[dict]:
    if _supabase:
        try:
            result = _supabase.table("calls").select("data").eq("call_id", call_id).eq("user_id", user_id).execute()
            return result.data[0]["data"] if result.data else None
        except Exception as e:
            logger.error(f"Supabase get_call failed: {e}")
            return None
    call = _calls.get(call_id)
    if call and call.get("user_id") == user_id:
        return call
    return None


def get_user_calls(user_id: str) -> list:
    if _supabase:
        try:
            result = _supabase.table("calls").select("data").eq("user_id", user_id).order("created_at", desc=True).execute()
            return [r["data"] for r in result.data]
        except Exception as e:
            logger.error(f"Supabase get_user_calls failed: {e}")
            return []
    return sorted(
        [c for c in _calls.values() if c.get("user_id") == user_id],
        key=lambda x: x["created_at"],
        reverse=True,
    )


# ═══════════════════════════════════════════════════════════════
#  DASHBOARD STATS
# ═══════════════════════════════════════════════════════════════

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


# ═══════════════════════════════════════════════════════════════
#  INTERNAL HELPERS
# ═══════════════════════════════════════════════════════════════

def _increment_user_field(user_id: str, field: str):
    """Best-effort increment of a user counter field in Supabase."""
    if not _supabase:
        return
    try:
        result = _supabase.table("users").select(field).eq("user_id", user_id).execute()
        if result.data:
            current = result.data[0].get(field) or 0
            _supabase.table("users").update({field: current + 1}).eq("user_id", user_id).execute()
    except Exception as e:
        logger.warning(f"Failed to increment {field} for {user_id}: {e}")
'''

TARGET.write_text(CONTENT)
print(f"Wrote {len(CONTENT)} chars to {TARGET}")
