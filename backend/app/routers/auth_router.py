"""Auth router — signup, login, social login, profile."""

import logging
import time
from typing import Any, Dict

import httpx
from jose import jwt
from fastapi import APIRouter, HTTPException
from app.models.schemas import SignupRequest, LoginRequest, SocialLoginRequest, AuthResponse, UserProfile
from app.services.db_service import create_user, verify_user, get_user, find_or_create_social_user
from app.services.auth_service import create_token, get_current_user
from app.config import get_settings
from fastapi import Depends

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


_JWKS_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
_JWKS_TTL_SECONDS = 60 * 60


def _get_provider_config(provider: str) -> Dict[str, Any]:
    provider = provider.lower()
    if provider == "google":
        return {
            "issuer": "https://accounts.google.com",
            "jwks_url": "https://www.googleapis.com/oauth2/v3/certs",
            "audience": settings.google_client_id or None,
        }
    if provider == "apple":
        return {
            "issuer": "https://appleid.apple.com",
            "jwks_url": "https://appleid.apple.com/auth/keys",
            "audience": settings.apple_client_id or None,
        }
    raise HTTPException(status_code=400, detail="Unsupported social provider")


def _fetch_jwks_cached(jwks_url: str) -> Dict[str, Any]:
    now = time.time()
    cached = _JWKS_CACHE.get(jwks_url)
    if cached and cached[0] > now:
        return cached[1]

    with httpx.Client(timeout=8.0) as client:
        resp = client.get(jwks_url)
        resp.raise_for_status()
        payload = resp.json()
    _JWKS_CACHE[jwks_url] = (now + _JWKS_TTL_SECONDS, payload)
    return payload


def _resolve_jwk(jwks: Dict[str, Any], kid: str) -> Dict[str, Any]:
    keys = jwks.get("keys", [])
    for key in keys:
        if key.get("kid") == kid:
            return key
    raise HTTPException(status_code=401, detail="Unable to validate social token key id")


def _verify_social_id_token(provider: str, id_token: str) -> Dict[str, Any]:
    config = _get_provider_config(provider)
    try:
        header = jwt.get_unverified_header(id_token)
        kid = header.get("kid")
        if not kid:
            raise HTTPException(status_code=401, detail="Invalid social token header")

        jwks = _fetch_jwks_cached(config["jwks_url"])
        key = _resolve_jwk(jwks, kid)
        audience = config.get("audience")
        options = {"verify_aud": bool(audience)}

        claims = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            issuer=config["issuer"],
            audience=audience,
            options=options,
        )
        return claims
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"Social token verification failed for {provider}: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired social token")


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
    if user is False:
        raise HTTPException(status_code=401, detail="No account found with this email. Sign up first!")
    if not isinstance(user, dict):
        raise HTTPException(status_code=401, detail="Wrong password — please try again")

    token = create_token(user["user_id"], user["email"])
    return AuthResponse(
        access_token=token,
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
    )


@router.post("/social", response_model=AuthResponse)
async def social_login(req: SocialLoginRequest):
    """Sign in with Google or Apple using verified OIDC ID token claims."""
    try:
        payload = _verify_social_id_token(req.provider, req.id_token)
        email = payload.get("email", "")
        if req.provider == "google" and payload.get("email_verified") is False:
            raise HTTPException(status_code=401, detail="Google account email is not verified")

        name = (
            payload.get("name")
            or payload.get("given_name")
            or payload.get("preferred_username")
            or "User"
        )
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
