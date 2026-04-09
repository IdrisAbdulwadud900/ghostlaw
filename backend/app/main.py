"""GhostLaw API — AI that fights every bill, contract, and phone call for you."""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import get_settings
from app.routers import auth_router, scan_router, dispute_router, call_router, dashboard_router, complaint_router

settings = get_settings()

# ── Rate Limiter ────────────────────────────────────────────
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)

app = FastAPI(
    title="GhostLaw",
    description="AI that fights every bill, contract, and phone call for you.",
    version=settings.version,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# ── CORS — restricted to known origins ──────────────────────
ALLOWED_ORIGINS = [
    "https://app-zeta-henna-93.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Allow any Vercel preview deploys
if os.environ.get("VERCEL"):
    ALLOWED_ORIGINS.append("https://*.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",  # covers preview deploys
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Input sanitization middleware ───────────────────────────
@app.middleware("http")
async def sanitize_input(request: Request, call_next):
    """Basic input size guard — reject absurdly large payloads."""
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 15 * 1024 * 1024:  # 15MB max
        return JSONResponse(status_code=413, content={"detail": "Payload too large (max 15MB)"})
    return await call_next(request)

# Register routers
app.include_router(auth_router.router)
app.include_router(scan_router.router)
app.include_router(dispute_router.router)
app.include_router(call_router.router)
app.include_router(dashboard_router.router)
app.include_router(complaint_router.router)


@app.get("/")
async def root():
    return {
        "app": "GhostLaw",
        "version": settings.version,
        "status": "running",
        "tagline": "AI that fights every bill, contract, and phone call for you.",
        "demo_mode": not bool(settings.gemini_api_key),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
