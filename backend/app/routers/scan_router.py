"""Scan router — upload & analyze documents."""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
from app.services.auth_service import get_current_user
from app.services.ai_service import (
    analyze_document,
    analyze_document_text,
    DEMO_SCAN_RESULT,
)
from app.services.db_service import save_scan, get_scan, get_user_scans
from app.config import get_settings

router = APIRouter(prefix="/scan", tags=["scan"])
settings = get_settings()


@router.post("/upload")
async def scan_document(
    file: UploadFile = File(...),
    context: Optional[str] = Form(default=""),
    current_user: dict = Depends(get_current_user),
):
    """Upload a document image for AI analysis."""
    # Validate file type
    allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not supported. Use JPG, PNG, WebP, or PDF.",
        )

    # Read file
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Analyze with AI
    if settings.gemini_api_key:
        result = await analyze_document(image_bytes, file.content_type, context or "")
    else:
        # Demo mode — return realistic sample data
        result = DEMO_SCAN_RESULT.copy()

    # Save to DB
    scan = save_scan(current_user["user_id"], result)
    return scan


@router.post("/text")
async def scan_text(
    document_text: str = Form(...),
    context: Optional[str] = Form(default=""),
    current_user: dict = Depends(get_current_user),
):
    """Analyze pasted document text."""
    if len(document_text) < 20:
        raise HTTPException(status_code=400, detail="Please provide more document text.")

    if settings.gemini_api_key:
        result = await analyze_document_text(document_text, context or "")
    else:
        result = DEMO_SCAN_RESULT.copy()

    scan = save_scan(current_user["user_id"], result)
    return scan


@router.get("/history")
async def get_scan_history(current_user: dict = Depends(get_current_user)):
    """Get all scans for the current user."""
    return get_user_scans(current_user["user_id"])


@router.get("/{scan_id}")
async def get_scan_detail(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific scan result."""
    scan = get_scan(scan_id, current_user["user_id"])
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan
