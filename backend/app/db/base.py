"""
Database Base Module
Provides database connection dependencies for FastAPI
"""

import os
from typing import AsyncGenerator
from urllib.parse import quote_plus, urlparse
from databases import Database
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment - construct from Supabase if needed
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
    SUPABASE_DB_NAME = os.getenv("SUPABASE_DB_NAME", "postgres")
    SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT", "5432")
    SUPABASE_DB_POOLER_HOST = os.getenv("SUPABASE_DB_POOLER_HOST")
    SUPABASE_DB_POOLER_PORT = os.getenv("SUPABASE_DB_POOLER_PORT", "6543")
    SUPABASE_DB_SSLMODE = os.getenv("SUPABASE_DB_SSLMODE", "require")

    if not SUPABASE_DB_PASSWORD:
        raise ValueError("SUPABASE_DB_PASSWORD must be set in .env")

    encoded_password = quote_plus(SUPABASE_DB_PASSWORD)
    # Debug: show that encoding happened (masked)
    print(f"🔑 Password encoding: raw={len(SUPABASE_DB_PASSWORD)} chars, encoded={len(encoded_password)} chars, has_percent={'%' in encoded_password}")

    # Prefer explicit DB host/user if provided (most reliable)
    if SUPABASE_DB_HOST and SUPABASE_DB_USER:
        DATABASE_URL = (
            f"postgresql://{SUPABASE_DB_USER}:{encoded_password}"
            f"@{SUPABASE_DB_HOST}:{SUPABASE_DB_PORT}/{SUPABASE_DB_NAME}"
            f"?sslmode={SUPABASE_DB_SSLMODE}"
        )
    elif "supabase.co" in SUPABASE_URL:
        project_id = SUPABASE_URL.split("//")[1].split(".")[0]

        # Use pooler host if provided, otherwise fall back to default Supabase pooler
        pooler_host = SUPABASE_DB_POOLER_HOST or "aws-0-ap-south-1.pooler.supabase.com"
        pooler_user = f"postgres.{project_id}"
        DATABASE_URL = (
            f"postgresql://{pooler_user}:{encoded_password}"
            f"@{pooler_host}:{SUPABASE_DB_POOLER_PORT}/{SUPABASE_DB_NAME}"
            f"?sslmode={SUPABASE_DB_SSLMODE}"
        )
    else:
        raise ValueError("DATABASE_URL or SUPABASE_URL must be set in .env")

def _log_db_target(db_url: str) -> None:
    """Log sanitized DB target (no password) to help diagnose connection issues."""
    try:
        parsed = urlparse(db_url)
        username = parsed.username or ""
        hostname = parsed.hostname or ""
        port = parsed.port or ""
        database_name = (parsed.path or "").lstrip("/")
        sslmode = ""
        if parsed.query:
            for kv in parsed.query.split("&"):
                if kv.startswith("sslmode="):
                    sslmode = kv.split("=", 1)[1]
                    break
        print(
            "🔎 DB target:",
            f"user={username}",
            f"host={hostname}",
            f"port={port}",
            f"db={database_name}",
            f"sslmode={sslmode or 'default'}",
        )
    except Exception:
        print("🔎 DB target: unable to parse DATABASE_URL")


if DATABASE_URL:
    _log_db_target(DATABASE_URL)

# Initialize database connection
database = Database(DATABASE_URL)


async def get_db() -> AsyncGenerator:
    """
    FastAPI dependency that provides database connection
    
    Usage in routes:
    ```python
    @router.get("/example")
    async def example_route(db = Depends(get_db)):
        result = await db.fetch_one("SELECT * FROM table")
    ```
    """
    if not database.is_connected:
        await database.connect()
    
    try:
        yield database
    finally:
        # Keep connection alive for reuse
        pass


async def startup_db():
    """Connect to database on application startup"""
    try:
        if DATABASE_URL and not database.is_connected:
            await database.connect()
            print("✅ Database connected")
    except Exception as e:
        print(f"⚠️  Database connection failed: {str(e)}")
        print("   Farm geometry endpoints will not work until database is configured")


async def shutdown_db():
    """Disconnect from database on application shutdown"""
    try:
        if database.is_connected:
            await database.disconnect()
            print("✅ Database disconnected")
    except Exception:
        pass


async def get_db_connection():
    """
    Get a database connection (alias for compatibility with product recommendations)
    
    Returns the database instance after ensuring it's connected.
    """
    if not database.is_connected:
        await database.connect()
    return database
