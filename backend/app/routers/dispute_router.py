"""Dispute router — generate and manage dispute letters."""

import os
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import DisputeRequest
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_dispute_letter, DEMO_DISPUTE_LETTER
from app.services.db_service import (
    get_scan,
    save_dispute,
    get_dispute,
    get_user_disputes,
)
from app.config import get_settings

router = APIRouter(prefix="/dispute", tags=["dispute"])
settings = get_settings()
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)


@router.post("/generate")
@limiter.limit("60/hour")
async def create_dispute(
    request: Request,
    req: DisputeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a dispute letter from a scan result."""
    # Get the scan
    scan = get_scan(req.scan_id, current_user["user_id"])
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Generate dispute letter with AI
    if settings.gemini_api_key:
        result = await generate_dispute_letter(
            scan_result=scan,
            issues_to_dispute=req.issues_to_dispute,
            tone=req.tone,
            custom_context=req.custom_context,
            country=req.country,
        )
    else:
        result = DEMO_DISPUTE_LETTER.copy()

    # Save dispute
    dispute = save_dispute(current_user["user_id"], req.scan_id, result)
    return dispute


@router.get("/history")
async def get_dispute_history(current_user: dict = Depends(get_current_user)):
    return get_user_disputes(current_user["user_id"])


@router.get("/{dispute_id}")
async def get_dispute_detail(
    dispute_id: str,
    current_user: dict = Depends(get_current_user),
):
    dispute = get_dispute(dispute_id, current_user["user_id"])
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return dispute
