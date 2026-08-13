import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# DATABASE_URL is required. The application will not start without it.
# ---------------------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Set it to a PostgreSQL connection string, e.g.: "
        "postgresql://user:pass@host:port/dbname"
    )

# ---------------------------------------------------------------------------
# Engine configuration for PostgreSQL (Supabase or self-hosted)
# ---------------------------------------------------------------------------
engine_kwargs = {
    "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
    "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "20")),
    "pool_timeout": int(os.getenv("DB_POOL_TIMEOUT", "30")),
    "pool_pre_ping": True,  # Detect stale connections before using them
}

# Supabase pooler (port 6543) uses pgbouncer in transaction mode.
# Append sslmode=require if not already specified in the URL.
if "sslmode" not in DATABASE_URL:
    separator = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_database_connection():
    """
    Verify that the database is reachable at startup.
    Called from main.py during application initialization.
    Raises RuntimeError if the connection fails.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection verified successfully.")
    except Exception as e:
        raise RuntimeError(
            f"Failed to connect to database. Check DATABASE_URL. Error: {e}"
        ) from e
