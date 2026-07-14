"""
Storage Engine - Centralized SQLite connection management.

This module provides a centralized storage engine with:
- Connection pooling
- WAL mode for better concurrency
- Busy timeout for lock handling
- Transaction management
- Thread-safe operations

This solves the "database is locked" bottleneck when multiple services
write to SQLite concurrently.
"""

import sqlite3
import asyncio
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from threading import Lock
from dataclasses import dataclass


@dataclass
class Transaction:
    """Represents a database transaction."""
    connection: sqlite3.Connection
    committed: bool = False
    
    def commit(self) -> None:
        """Commit the transaction."""
        self.connection.commit()
        self.committed = True
    
    def rollback(self) -> None:
        """Rollback the transaction."""
        self.connection.rollback()
        self.committed = False
    
    def execute(self, sql: str, params: tuple = ()) -> sqlite3.Cursor:
        """Execute SQL within transaction."""
        return self.connection.execute(sql, params)
    
    def cursor(self) -> sqlite3.Cursor:
        """Get cursor for transaction."""
        return self.connection.cursor()


class StorageEngine:
    """
    Centralized SQLite storage engine with connection pooling.
    
    Manages SQLite connections with WAL mode, busy timeout, and transactions.
    All database operations should go through this engine.
    """
    
    def __init__(self, db_path: str, pool_size: int = 5, busy_timeout: int = 5000):
        """
        Initialize storage engine.
        
        Args:
            db_path: Path to SQLite database
            pool_size: Connection pool size
            busy_timeout: Busy timeout in milliseconds
        """
        self.db_path = db_path
        self.pool_size = pool_size
        self.busy_timeout = busy_timeout
        self._pool: List[sqlite3.Connection] = []
        self._pool_lock = Lock()
        self._initialized = False
        self._init_lock = Lock()
    
    def _ensure_initialized(self) -> None:
        """Ensure database is initialized (called internally)."""
        if self._initialized:
            return
        
        with self._init_lock:
            if self._initialized:
                return
            
            conn = self._get_connection()
            
            try:
                # Enable WAL mode for better concurrency
                conn.execute("PRAGMA journal_mode=WAL")
                conn.execute("PRAGMA synchronous=NORMAL")
                conn.execute("PRAGMA busy_timeout={}".format(self.busy_timeout))
                conn.execute("PRAGMA foreign_keys=ON")
                conn.commit()
                self._initialized = True
            finally:
                self._return_connection(conn)
    
    def initialize(self) -> None:
        """Initialize database with WAL mode and schema (deprecated - auto-initializes)."""
        self._ensure_initialized()
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get connection from pool or create new one."""
        # Auto-initialize on first connection
        self._ensure_initialized()
        
        with self._pool_lock:
            if self._pool:
                return self._pool.pop()
            
            # Create new connection
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA busy_timeout={}".format(self.busy_timeout))
            return conn
    
    def _return_connection(self, conn: sqlite3.Connection) -> None:
        """Return connection to pool."""
        with self._pool_lock:
            if len(self._pool) < self.pool_size:
                self._pool.append(conn)
            else:
                conn.close()
    
    @contextmanager
    def get_connection(self):
        """
        Context manager for getting connection.
        
        Yields a connection that is automatically returned to pool.
        """
        conn = self._get_connection()
        try:
            yield conn
        finally:
            self._return_connection(conn)
    
    @contextmanager
    def transaction(self):
        """
        Context manager for transaction.
        
        Automatically commits or rolls back.
        Uses a single connection for the entire transaction.
        
        Yields a Transaction object for cleaner API.
        """
        conn = self._get_connection()
        tx = Transaction(connection=conn)
        try:
            conn.execute("BEGIN")
            yield tx
            tx.commit()
        except Exception:
            tx.rollback()
            raise
        finally:
            self._return_connection(conn)
    
    def begin_transaction(self) -> Transaction:
        """
        Begin a transaction and return Transaction object.
        
        Returns:
            Transaction object that must be committed/rolled back manually
        """
        conn = self._get_connection()
        conn.execute("BEGIN")
        return Transaction(connection=conn)
    
    def end_transaction(self, transaction: Transaction, commit: bool = True) -> None:
        """
        End a transaction.
        
        Args:
            transaction: Transaction to end
            commit: True to commit, False to rollback
        """
        if commit:
            transaction.commit()
        else:
            transaction.rollback()
        
        self._return_connection(transaction.connection)
    
    async def begin_transaction(self) -> None:
        """Begin a transaction - deprecated, use transaction() context manager."""
        raise NotImplementedError("Use transaction() context manager instead")
    
    async def commit_transaction(self) -> None:
        """Commit a transaction - deprecated, use transaction() context manager."""
        raise NotImplementedError("Use transaction() context manager instead")
    
    async def rollback_transaction(self) -> None:
        """Rollback a transaction - deprecated, use transaction() context manager."""
        raise NotImplementedError("Use transaction() context manager instead")
    
    async def execute(self, sql: str, params: tuple = (), fetch: str = None) -> Any:
        """
        Execute SQL statement asynchronously.
        
        Args:
            sql: SQL statement
            params: Query parameters
            fetch: Fetch mode ('one', 'all', 'none')
        
        Returns:
            Query result based on fetch mode
        """
        def _execute():
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(sql, params)
                
                if fetch == 'one':
                    return cursor.fetchone()
                elif fetch == 'all':
                    return cursor.fetchall()
                elif fetch == 'none':
                    conn.commit()
                    return None
                else:
                    return cursor.lastrowid
        
        return await asyncio.get_event_loop().run_in_executor(None, _execute)
    
    async def execute_script(self, script: str) -> None:
        """
        Execute SQL script asynchronously.
        
        Args:
            script: SQL script
        """
        def _execute_script():
            with self.get_connection() as conn:
                conn.executescript(script)
                conn.commit()
        
        await asyncio.get_event_loop().run_in_executor(None, _execute_script)
    
    async def execute_many(self, sql: str, params_list: List[tuple]) -> None:
        """
        Execute SQL statement with many parameter sets asynchronously.
        
        Args:
            sql: SQL statement
            params_list: List of parameter tuples
        """
        def _execute_many():
            with self.get_connection() as conn:
                conn.executemany(sql, params_list)
                conn.commit()
        
        await asyncio.get_event_loop().run_in_executor(None, _execute_many)
    
    async def table_exists(self, table_name: str) -> bool:
        """
        Check if table exists.
        
        Args:
            table_name: Table name
        
        Returns:
            True if table exists
        """
        result = await self.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            (table_name,),
            fetch='one'
        )
        return result is not None
    
    async def create_table(self, table_name: str, schema: str) -> None:
        """
        Create table if not exists.
        
        Args:
            table_name: Table name
            schema: Table schema SQL
        """
        if not await self.table_exists(table_name):
            await self.execute_script(schema)
    
    async def close(self) -> None:
        """Close all connections in pool."""
        with self._pool_lock:
            for conn in self._pool:
                conn.close()
            self._pool.clear()
    
    def get_sync_connection(self) -> sqlite3.Connection:
        """
        Get connection for synchronous operations.
        
        Returns connection that must be manually returned.
        Use with caution - prefer async methods.
        """
        return self._get_connection()
    
    def return_sync_connection(self, conn: sqlite3.Connection) -> None:
        """
        Return connection from synchronous operations.
        
        Args:
            conn: Connection to return
        """
        self._return_connection(conn)
