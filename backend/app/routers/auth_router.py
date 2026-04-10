"""Auth router — signup, login, social login, profile."""

import json
import base64
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import SignupRequest, LoginRequest, SocialLoginRequest, AuthResponse, UserProfile
from app.services.db_service import create_user, verify_user, get_user, find_or_create_social_user
from app.services.auth_service import create_token, get_current_user
from fastapi import Depends

logger = logging.getLogger(__name__)

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
    if user is None:
        raise HTTPException(status_code=401, detail="Wrong password — please try again")
    if user is False:
        raise HTTPException(status_code=401, detail="No account found with this email. Sign up first!")

    token = create_token(user["user_id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
    )


@router.post("/social", response_model=AuthResponse)
async def social_login(req: SocialLoginRequest):
    """Sign in with Google or Apple — decode the ID token to get user info."""
    try:
        # Decode the JWT payload (middle segment) without verification.
        # In production you'd verify the signature against Google/Apple public keys.
        parts = req.id_token.split(".")
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Invalid token format")
        # Add padding for base64
        payload_b64 = parts[1] + "==" * (4 - len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))

        email = payload.get("email", "")
        name = payload.get("name", "") or payload.get("given_name", "User")
        if not email:
            raise HTTPException(status_code=400, detail="Token missing email claim")

        user = find_or_create_social_user(email, name, req.provider)
        token = create_token(user["user_id"], user["email"])
        return AuthResponse(
            access_token=token,
            user_id=user["user_id"],
            email=user["email"],
            name=user["name"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Social login failed: {e}")
        raise HTTPException(status_code=400, detail=f"Social login failed: {str(e)[:100]}")


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
