"""RepositoryAdapter — single database connection pool for runtime.

Architecture:
  Tool/Worker → RepositoryAdapter.get_connection() → psycopg3 ConnectionPool
  ALL database connections route through this adapter.
  No file outside runtime/adapters/ creates database connections.
"""

import os
from typing import Optional, Any
from contextlib import contextmanager
from psycopg import Connection, connect
from psycopg_pool import ConnectionPool
from runtime.config import config


class RepositoryAdapter:
    """Single authority for database connections via psycopg3 ConnectionPool."""

    _instance: Optional['RepositoryAdapter'] = None

    def __init__(self):
        self._pool: Optional[ConnectionPool] = None

    @classmethod
    def get_instance(cls) -> 'RepositoryAdapter':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _ensure_pool(self):
        if self._pool is None:
            cfg = config().get_postgres_config()
            conninfo = (
                f"host={cfg.get('host', 'localhost')} "
                f"port={int(cfg.get('port', 5432))} "
                f"dbname={cfg.get('database', 'crx_runtime')} "
                f"user={cfg.get('user', 'postgres')} "
                f"password={cfg.get('password', '')}"
            )
            self._pool = ConnectionPool(
                conninfo=conninfo,
                min_size=1,
                max_size=10,
                open=True,
            )

    @contextmanager
    def get_connection(self) -> Connection:
        self._ensure_pool()
        conn = self._pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)

    @contextmanager
    def get_cursor(self):
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                yield cur

    def close(self):
        if self._pool:
            self._pool.close()
            self._pool = None


class _PoolConnection:
    """Wrapper that returns a psycopg3 connection to the pool on close()."""

    def __init__(self, pool, conn):
        self._pool = pool
        self._conn = conn

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def close(self):
        if self._pool and self._conn and not self._conn.closed:
            self._pool.putconn(self._conn)
        self._pool = None
        self._conn = None


def get_repository_connection():
    """Return a connection from the pool. Calls to close() return it to the pool."""
    adapter = RepositoryAdapter.get_instance()
    adapter._ensure_pool()
    conn = adapter._pool.getconn()
    return _PoolConnection(adapter._pool, conn)


def get_repository_cursor():
    return RepositoryAdapter.get_instance().get_cursor()
