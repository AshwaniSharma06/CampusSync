import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load from backend/.env or root .env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusSync API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database (defaults to local SQLite for instant, zero-setup resilience)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campussync.db")
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    # Gemini API for RAG
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    GEMINI_TIMEOUT_SECONDS: float = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30.0"))

    class Config:
        case_sensitive = True

settings = Settings()
