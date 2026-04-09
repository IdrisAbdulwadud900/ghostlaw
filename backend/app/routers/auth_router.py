"""Auth router — signup, login, profile."""

from fastapi import APIRouter, HTTPException
from app.models.schemas import SignupRequest, LoginRequest, AuthResponse, UserProfile
from app.services.db_service import create_user, verify_user, get_user
from app.services.auth_service import create_token, get_current_user
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    try:
        user = create_user(req.email, req.password, req.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_token(user["user_id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
    )


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    user = verify_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["user_id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
    )


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    user = get_user(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        created_at=user["created_at"],
        scans_count=user["scans_count"],
        disputes_count=user["disputes_count"],
        total_saved=user["total_saved"],
    )
