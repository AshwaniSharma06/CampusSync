from sqlalchemy import create_engine, event
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
    # Normalize legacy postgres:// URI for SQLAlchemy 2.0
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    if "postgresql" in db_url:
        is_local = "127.0.0.1" in db_url or "localhost" in db_url
        if is_local:
            if is_port_reachable("127.0.0.1", 5432):
                try:
                    return create_engine(db_url, pool_pre_ping=True)
                except Exception as e:
                    logger.warning(f"Local PostgreSQL connection failed ({e}). Falling back to SQLite.")
            else:
                logger.info("Local PostgreSQL offline on port 5432. Using fail-safe SQLite.")
            return create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
        else:
            # Managed remote cloud database (e.g. Supabase, Render PostgreSQL, Neon)
            try:
                eng = create_engine(db_url, pool_pre_ping=True)
                with eng.connect() as conn:
                    pass
                return eng
            except Exception as e:
                logger.warning(f"Remote PostgreSQL connection failed ({e}). Falling back to SQLite.")
                return create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})

    elif "sqlite" in db_url:
        # If relative SQLite URL, resolve relative to project root so it never splits
        if "sqlite:///./" in db_url or db_url == "sqlite:///campussync.db":
            from backend.core.config import ROOT_DIR
            canonical_db = (ROOT_DIR / "campussync.db").resolve()
            db_url = f"sqlite:///{canonical_db.as_posix()}"
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
    return create_engine(db_url)

engine = get_engine()

# Configure SQLite concurrency, WAL journal mode, and busy timeout for multi-client & scraping safety
if engine.dialect.name == "sqlite":
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA foreign_keys=ON")
        except Exception as err:
            logger.warning(f"Failed to set SQLite PRAGMA: {err}")
        finally:
            cursor.close()

    # Apply immediately to ensure the database file enables WAL journal mode on startup
    try:
        with engine.connect() as conn:
            mode = conn.exec_driver_sql("PRAGMA journal_mode=WAL;").scalar()
            logger.info(f"SQLite PRAGMA journal_mode set to: {mode}")
    except Exception as err:
        logger.warning(f"Could not initialize SQLite WAL journal mode: {err}")

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
