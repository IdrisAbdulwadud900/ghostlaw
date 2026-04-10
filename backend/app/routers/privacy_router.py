"""Privacy router — NDPA-style export and delete account/data endpoints."""

from fastapi import APIRouter, Depends, HTTPException

from app.services.auth_service import get_current_user
from app.services.db_service import export_user_bundle, delete_user_data

router = APIRouter(prefix="/privacy", tags=["privacy"])


@router.get("/export")
async def export_my_data(current_user: dict = Depends(get_current_user)):
    payload = export_user_bundle(current_user["user_id"])
    if not payload:
        raise HTTPException(status_code=404, detail="User not found")
    return payload


@router.delete("/delete")
async def delete_my_account(current_user: dict = Depends(get_current_user)):
    ok = delete_user_data(current_user["user_id"])
    if not ok:
        raise HTTPException(status_code=500, detail="Could not delete account data")
    return {
        "deleted": True,
        "message": "Your account and associated data were deleted.",
    }
