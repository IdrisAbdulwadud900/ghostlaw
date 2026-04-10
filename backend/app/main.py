"""GhostLaw API — AI that fights every bill, contract, and phone call for you."""

import os
import uuid
import asyncio
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import get_settings
from app.routers import auth_router, scan_router, dispute_router, call_router, dashboard_router, complaint_router, privacy_router

settings = get_settings()
logger = logging.getLogger(__name__)

# ── Rate Limiter ────────────────────────────────────────────
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)

# ── Concurrency guard (protects Gemini free-tier from stampede) ───
MAX_CONCURRENT = int(os.environ.get("MAX_CONCURRENT_REQUESTS", "50"))
_semaphore = asyncio.Semaphore(MAX_CONCURRENT)

app = FastAPI(
    title="GhostLaw",
    description="AI that fights every bill, contract, and phone call for you.",
    version=settings.version,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# ── CORS — restricted to known origins ──────────────────────
ALLOWED_ORIGINS = settings.cors_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Input sanitization + concurrency middleware ─────────────
@app.middleware("http")
async def sanitize_input(request: Request, call_next):
    """Input size guard, request tracing, and concurrency limiter."""
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    request.state.request_id = request_id

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 15 * 1024 * 1024:  # 15MB max
        return JSONResponse(
            status_code=413,
            headers={"X-Request-ID": request_id},
            content={"detail": "Payload too large (max 15MB)", "request_id": request_id},
        )

    # Shed load when too many requests are in-flight
    if _semaphore.locked():
        logger.warning("Concurrency limit reached — shedding load", extra={"request_id": request_id})
        return JSONResponse(
            status_code=503,
            headers={"X-Request-ID": request_id, "Retry-After": "5"},
            content={"detail": "Server busy — please retry in a few seconds", "request_id": request_id},
        )

    try:
        async with _semaphore:
            response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as e:
        logger.exception("Unhandled request error", extra={"request_id": request_id, "path": request.url.path})
        return JSONResponse(
            status_code=500,
            headers={"X-Request-ID": request_id},
            content={"detail": "Internal server error", "request_id": request_id},
        )

# Register routers
app.include_router(auth_router.router)
app.include_router(scan_router.router)
app.include_router(dispute_router.router)
app.include_router(call_router.router)
app.include_router(dashboard_router.router)
app.include_router(complaint_router.router)
app.include_router(privacy_router.router)


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
