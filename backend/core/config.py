import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# BASE_DIR is .../backend, ROOT_DIR is .../CampusSync-Frontend
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent

# Load from backend/.env first, then root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(ROOT_DIR / ".env")

# Canonical SQLite database file at project root
DEFAULT_DB_FILE = (ROOT_DIR / "campussync.db").resolve()
DEFAULT_SQLITE_URL = f"sqlite:///{DEFAULT_DB_FILE.as_posix()}"

raw_db_url = os.getenv("DATABASE_URL", "")
if not raw_db_url or "sqlite:///./" in raw_db_url or raw_db_url == "sqlite:///campussync.db":
    RESOLVED_DATABASE_URL = DEFAULT_SQLITE_URL
else:
    RESOLVED_DATABASE_URL = raw_db_url

class Settings(BaseSettings):
    PROJECT_NAME: str = "CampusSync API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment & Debug
    APP_ENV: str = os.getenv("APP_ENV", os.getenv("ENVIRONMENT", "development")).lower()
    DEBUG: bool = os.getenv("DEBUG", "false" if os.getenv("APP_ENV", "").lower() == "production" else "true").lower() in ("true", "1", "yes")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")

    # Database (defaults to canonical absolute SQLite path for resilience across any working dir)
    DATABASE_URL: str = RESOLVED_DATABASE_URL
    
    # Authentication
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-for-dev")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    # Gemini API for RAG
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    GEMINI_TIMEOUT_SECONDS: float = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "30.0"))

    # Vector Database (ChromaDB Persistence)
    CHROMA_PERSIST_DIRECTORY: str = os.getenv(
        "CHROMA_PERSIST_DIRECTORY",
        str((BASE_DIR / "data" / "chromadb").resolve())
    )
    CHROMA_COLLECTION_NAME: str = "campussync_rag"
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "6"))
    RAG_RELEVANCE_THRESHOLD: float = float(os.getenv("RAG_RELEVANCE_THRESHOLD", "0.70"))

    # Automated Scraper Configuration (Phase 7 - 3-Hour Scraping System)
    SCRAPER_ENABLED: bool = os.getenv("SCRAPER_ENABLED", "true").lower() in ("true", "1", "yes")
    SCRAPER_INTERVAL_MINUTES: int = int(os.getenv("SCRAPER_INTERVAL_MINUTES", "180"))
    SCRAPER_RATE_LIMIT_DELAY: float = float(os.getenv("SCRAPER_RATE_LIMIT_DELAY", "0.5"))
    SCRAPER_MAX_PAGES_PER_RUN: int = int(os.getenv("SCRAPER_MAX_PAGES_PER_RUN", "50"))

    class Config:
        case_sensitive = True

settings = Settings()

# Validate production security constraints
if settings.APP_ENV == "production":
    insecure_keys = ["super-secret-key-for-dev", "secret", "change-me", "your-secret-key", "dev-secret"]
    if not settings.SECRET_KEY or settings.SECRET_KEY in insecure_keys or len(settings.SECRET_KEY) < 32:
        raise RuntimeError(
            "[Security Enforcement] Insecure production configuration: SECRET_KEY must be explicitly configured "
            "with a secure random key of at least 32 characters in production (e.g. openssl rand -hex 32). "
            "Refusing to boot with default development secret."
        )
    settings.DEBUG = False

