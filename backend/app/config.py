import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import List


@dataclass
class Settings:
    app_name: str = "GhostLaw"
    version: str = "0.2.0"
    env: str = "development"
    debug: bool = True

    # JWT
    jwt_secret: str = "ghostlaw-dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    # Google Gemini (FREE tier)
    gemini_api_key: str = ""

    # Social auth
    google_client_id: str = ""
    apple_client_id: str = ""

    # Supabase (FREE tier)
    supabase_url: str = ""
    supabase_key: str = ""

    # Frontend origins
    cors_origins: List[str] = field(default_factory=lambda: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ])


def get_settings() -> Settings:
    """Load settings from environment variables with defaults."""
    env = os.environ.get("APP_ENV", os.environ.get("ENV", "development")).lower()
    debug = os.environ.get("DEBUG", "true").lower() in ("1", "true", "yes", "on")
    if env in ("production", "prod"):
        debug = False

    jwt_secret = os.environ.get("JWT_SECRET", "")
    if env in ("production", "prod") and len(jwt_secret.strip()) < 32:
        raise RuntimeError("JWT_SECRET must be set and at least 32 characters in production")

    cors_origins_raw = os.environ.get("CORS_ORIGINS", "")
    cors_origins = [o.strip() for o in cors_origins_raw.split(",") if o.strip()] or [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    return Settings(
        env=env,
        debug=debug,
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        google_client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
        apple_client_id=os.environ.get("APPLE_CLIENT_ID", ""),
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_key=os.environ.get("SUPABASE_KEY", ""),
        jwt_secret=jwt_secret or "ghostlaw-dev-secret-change-in-prod",
        cors_origins=cors_origins,
    )
