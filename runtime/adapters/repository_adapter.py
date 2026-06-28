"""RepositoryAdapter — single database connection authority for runtime.

Architecture:
  Tool/Worker → RepositoryAdapter.get_connection() → psycopg2
  ALL database connections route through this adapter.
  No file outside runtime/adapters/ or runtime/repository/ creates psycopg2 connections.
"""

import os
import psycopg2
import psycopg2.extras
from typing import Optional, Dict, Any
from runtime.config.configuration_authority import ConfigurationAuthority


class RepositoryAdapter:
    """Single authority for database connections."""

    _instance: Optional['RepositoryAdapter'] = None

    def __init__(self):
        self._conn: Optional[psycopg2.connection] = None

    @classmethod
    def get_instance(cls) -> 'RepositoryAdapter':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_connection(self) -> psycopg2.connection:
        if self._conn is None or self._conn.closed:
            cfg = ConfigurationAuthority.current().get_postgres_config()
            self._conn = psycopg2.connect(
                host=cfg.get('host', 'localhost'),
                port=int(cfg.get('port', 5432)),
                database=cfg.get('database', 'crx_runtime'),
                user=cfg.get('user', 'postgres'),
                password=cfg.get('password', ''),
            )
            self._conn.autocommit = True
        return self._conn

    def get_cursor(self, cursor_factory=None):
        conn = self.get_connection()
        return conn.cursor(cursor_factory=cursor_factory)

    def close(self):
        if self._conn and not self._conn.closed:
            self._conn.close()
        self._conn = None


def get_repository_connection() -> psycopg2.connection:
    return RepositoryAdapter.get_instance().get_connection()


def get_repository_cursor(cursor_factory=None):
    return RepositoryAdapter.get_instance().get_cursor(cursor_factory)
