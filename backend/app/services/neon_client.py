"""
backend/app/services/neon_client.py

Neon PostgreSQL connection pool — replaces supabase_client.py.
Provides a psycopg2 ThreadedConnectionPool singleton for the regime system.
"""

import os
import logging
from typing import Optional
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager

logger = logging.getLogger(__name__)

_connection_pool: Optional[pool.ThreadedConnectionPool] = None


def get_connection_pool() -> pool.ThreadedConnectionPool:
    """Get or create the connection pool singleton."""
    global _connection_pool

    if _connection_pool is None:
        database_url = os.getenv("NEON_DATABASE_URL")
        if not database_url:
            raise ValueError(
                "NEON_DATABASE_URL environment variable must be set. "
                "Get it from https://console.neon.tech → your project → Connection Details."
            )

        _connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=database_url,
            sslmode="require",
        )
        logger.info("[Neon] Connection pool initialized (min=1, max=10)")

    return _connection_pool


@contextmanager
def get_connection():
    """Context manager: borrow a connection, return it when done."""
    conn_pool = get_connection_pool()
    conn = conn_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn_pool.putconn(conn)


@contextmanager
def get_cursor():
    """Context manager: borrow a connection and return a cursor."""
    with get_connection() as conn:
        cursor = conn.cursor()
        try:
            yield cursor
        finally:
            cursor.close()


def execute_query(sql: str, params=None):
    """Execute a query and return all rows as a list of dicts."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            if cursor.description:
                columns = [desc[0] for desc in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []


def execute_one(sql: str, params=None):
    """Execute a query and return a single row as a dict."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            if cursor.description:
                row = cursor.fetchone()
                if row:
                    columns = [desc[0] for desc in cursor.description]
                    return dict(zip(columns, row))
            return None


def execute_write(sql: str, params=None):
    """Execute INSERT/UPDATE/DELETE. Returns rowcount."""
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(sql, params)
            return cursor.rowcount


def reset_connection_pool():
    """Close and reset the pool (for testing)."""
    global _connection_pool
    if _connection_pool:
        _connection_pool.closeall()
    _connection_pool = None
    logger.info("[Neon] Connection pool reset")
