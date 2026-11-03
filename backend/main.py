import os
import sys
from pathlib import Path

# Bootstrap sys.path so 'backend.*' imports succeed whether invoked from root or backend/ directory
_CURRENT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _CURRENT_DIR.parent
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))
if str(_CURRENT_DIR) not in sys.path:
    sys.path.insert(1, str(_CURRENT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.core.config import settings
from backend.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CampusSync Student Portal (Engineering College Ajmer)",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS: strict explicit allowlist in production; localhost enabled in development
cors_origins = []
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    cors_origins.extend([o.strip().rstrip("/") for o in allowed_origins_env.split(",") if o.strip()])

frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

is_production = settings.APP_ENV == "production"

if not is_production:
    dev_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:4173",
    ]
    for o in dev_origins:
        if o not in cors_origins:
            cors_origins.append(o)
else:
    if not cors_origins:
        cors_origins.append("https://campussync.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if not is_production else None,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

class HealthResponse(BaseModel):
    status: str
    message: str
    version: str

@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint confirming service availability with documentation links.
    """
    return {
        "status": "online",
        "service": "CampusSync API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint to verify the backend is running.
    """
    return HealthResponse(
        status="ok",
        message="CampusSync FastAPI backend is operational.",
        version=settings.VERSION
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

from backend.services.scheduler import CampusSyncScraperScheduler
from backend.services.vector_service import ensure_chroma_initialized
from backend.db.session import SessionLocal

@app.on_event("startup")
async def startup_event():
    """Initializes vector store and starts the automated 3-hour website scraping scheduler."""
    # 1. Safe ChromaDB startup verification (idempotent, skips if already populated)
    db = SessionLocal()
    try:
        ensure_chroma_initialized(db)
    finally:
        db.close()

    # 2. Automated 3-Hour Scraper Scheduler
    scheduler = CampusSyncScraperScheduler.get_instance()
    await scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Safely terminates automated scraping tasks on application shutdown."""
    scheduler = CampusSyncScraperScheduler.get_instance()
    await scheduler.shutdown()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting CampusSync FastAPI server on http://127.0.0.1:{port} ...")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
