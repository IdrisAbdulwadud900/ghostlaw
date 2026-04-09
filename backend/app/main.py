"""
GhostLaw API — AI that fights every bill, contract, and phone call for you.
100% free to run in development. Free-tier APIs in production.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import auth_router, scan_router, dispute_router, call_router, dashboard_router, complaint_router

settings = get_settings()

app = FastAPI(
    title="GhostLaw",
    description="AI that fights every bill, contract, and phone call for you.",
    version=settings.version,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
