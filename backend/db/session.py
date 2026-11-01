from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.core.config import settings
import logging
import socket

logger = logging.getLogger(__name__)

Base = declarative_base()

def is_port_reachable(host: str = "127.0.0.1", port: int = 5432) -> bool:
    """Instant socket test (1ms) to verify database connectivity without hanging."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def get_engine():
    db_url = settings.DATABASE_URL
    if "postgresql" in db_url:
        if is_port_reachable("127.0.0.1", 5432):
            try:
                return create_engine(db_url, pool_pre_ping=True)
            except Exception as e:
                logger.warning(f"PostgreSQL connection failed ({e}). Falling back to SQLite.")
        else:
            logger.info("PostgreSQL service is offline on port 5432. Using local fail-safe SQLite database.")
        
        return create_engine(
            "sqlite:///./campussync.db",
            connect_args={"check_same_thread": False}
        )
    elif "sqlite" in db_url:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    return create_engine(db_url)

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Auto-create tables for seamless development & demo execution
try:
    import backend.models
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(f"Metadata table creation notice: {e}")

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
