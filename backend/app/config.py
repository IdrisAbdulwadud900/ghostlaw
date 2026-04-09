import os
from dataclasses import dataclass, field
from functools import lru_cache


@dataclass
class Settings:
    app_name: str = "GhostLaw"
    version: str = "0.2.0"
    debug: bool = True

    # JWT
    jwt_secret: str = "ghostlaw-dev-secret-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 72

    # Google Gemini (FREE tier)
    gemini_api_key: str = ""

    # Supabase (FREE tier)
    supabase_url: str = ""
    supabase_key: str = ""


def get_settings() -> Settings:
    """Load settings from environment variables with defaults."""
    return Settings(
        gemini_api_key=os.environ.get("GEMINI_API_KEY", ""),
        supabase_url=os.environ.get("SUPABASE_URL", ""),
        supabase_key=os.environ.get("SUPABASE_KEY", ""),
        jwt_secret=os.environ.get("JWT_SECRET", "ghostlaw-dev-secret-change-in-prod"),
    )
