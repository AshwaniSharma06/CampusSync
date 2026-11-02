import os
import sys
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

# Configure CORS for local development and live production deployments (Vercel, Render, Railway)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Allow custom frontend URL from environment if provided
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.pages\.dev|https://.*\.railway\.app|https://.*\.onrender\.com|http://localhost:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    # Support both "backend.main:app" and "main:app" depending on working directory
    module_name = "backend.main:app" if "backend" not in os.path.basename(os.getcwd()) else "main:app"
    uvicorn.run(module_name, host="0.0.0.0", port=port, reload=False)
