"""Dashboard router — stats and activity."""

from fastapi import APIRouter, Depends
from app.services.auth_service import get_current_user
from app.services.db_service import get_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
async def dashboard_stats(current_user: dict = Depends(get_current_user)):
    return get_dashboard_stats(current_user["user_id"])
