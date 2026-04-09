"""Call Ghost router — AI phone call management."""

import os
from fastapi import APIRouter, HTTPException, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.models.schemas import CallRequest, CallResult
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_call_script
from app.services.db_service import (
    get_scan,
    get_dispute,
    save_call,
    get_call,
    get_user_calls,
)
from app.config import get_settings

router = APIRouter(prefix="/call", tags=["call"])
settings = get_settings()
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)


@router.post("/request")
@limiter.limit("10/hour")
async def request_call(
    request: Request,
    req: CallRequest,
    current_user: dict = Depends(get_current_user),
):
    """Request an AI ghost call. Generates a call script and strategy."""
    # Get related scan if provided
    scan = None
    if req.scan_id:
        scan = get_scan(req.scan_id, current_user["user_id"])

    dispute = None
    if req.dispute_id:
        dispute = get_dispute(req.dispute_id, current_user["user_id"])

    # Generate call script
    if settings.gemini_api_key:
        script = await generate_call_script(
            scan_result=scan or {},
            dispute_letter=dispute,
            company_name=req.company_name,
            objective=req.objective,
            country=req.country,
        )
    else:
        script = {
            "opening_script": f"Hello, I'm calling about my account. I need to speak with someone in your billing disputes department regarding overcharges on my recent {scan.get('document_type', 'bill') if scan else 'bill'}.",
            "key_points": [
                "Reference the specific overcharges identified in our analysis",
                "Cite the No Surprises Act and state consumer protection laws",
                "Request supervisor if the first representative cannot help",
                "Ask for a reference number for every promise made",
            ],
            "negotiation_tactics": [
                "Start with the largest issue first",
                "Mention you've already prepared a formal dispute letter",
                "Reference regulatory complaints as a next step",
                "Be firm but polite — kill them with kindness",
            ],
            "escalation_phrases": [
                "I'd like to speak with a supervisor, please",
                "I've documented these overcharges and am prepared to file complaints with the state AG",
                "I'm requesting this call be recorded for quality assurance",
            ],
            "laws_to_cite": [
                "No Surprises Act (2022)",
                "Fair Debt Collection Practices Act",
                "State Consumer Protection Act",
            ],
            "target_outcome": f"Full adjustment of disputed charges (save ${scan.get('total_potential_savings', 0):,.2f})" if scan else "Full resolution of the issue",
            "fallback_outcome": "50% reduction of disputed charges + payment plan",
            "red_flags": [
                "If they threaten collections — they can't during active disputes",
                "If they refuse to provide a supervisor — ask for their employee ID",
                "If they claim the charges are correct — ask for itemized proof",
            ],
            "closing_script": "Can you please provide me with a confirmation number and send written confirmation of this agreement to my email?",
            "estimated_call_duration": "15-30 minutes",
            "difficulty_rating": "medium",
        }

    # Save call record
    call_data = {
        "scan_id": req.scan_id,
        "dispute_id": req.dispute_id,
        "company_name": req.company_name,
        "phone_number": req.phone_number,
        "objective": req.objective,
        "script": script,
        "status": "script_ready",
    }
    call = save_call(current_user["user_id"], call_data)
    return call


@router.get("/history")
async def get_call_history(current_user: dict = Depends(get_current_user)):
    return get_user_calls(current_user["user_id"])


@router.get("/{call_id}")
async def get_call_detail(
    call_id: str,
    current_user: dict = Depends(get_current_user),
):
    call = get_call(call_id, current_user["user_id"])
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call
