from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.core.config import settings
from backend.api.v1 import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CampusSync Student Portal",
    version=settings.VERSION
)

# Configure CORS for the React application
origins = [
    "http://localhost:5173", # Default Vite React dev server port
    "http://localhost:3000", # Alternative dev server port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint to verify the backend is running.
    """
    return HealthResponse(
        status="ok",
        message="CampusSync FastAPI backend is operational."
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
