"""
Lease Manager - Single process lease management.

No distributed coordination. Single process lease.

Responsibilities:
- Acquire
- Release
- Heartbeat
- Persist leases to survive crashes
"""

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional
import asyncio
import uuid

from hermes.storage.engine import StorageEngine


@dataclass
class Lease:
    """Single process lease."""
    lease_id: str
    resource_id: str
    acquired_at: datetime
    expires_at: datetime
    ttl: int


class LeaseManager:
    """
    Single process lease manager with persistence.
    
    Uses StorageEngine for connection pooling and WAL mode.
    Leases persist across runtime restarts to prevent duplicate execution.
    """
    
    def __init__(self, db_path: str = "leases.db", storage_engine: Optional[StorageEngine] = None):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self._leases: dict[str, Lease] = {}
        self._lock = asyncio.Lock()
        self._initialized = False
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._heartbeat_interval = 10  # Check every 10 seconds
    
    async def _initialize(self) -> None:
        """Initialize database schema and load existing leases."""
        if self._initialized:
            return
        
        self.storage_engine.initialize()
        
        schema = """
            CREATE TABLE IF NOT EXISTS leases (
                lease_id TEXT PRIMARY KEY,
                resource_id TEXT NOT NULL,
                acquired_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                ttl INTEGER NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_resource_id 
            ON leases(resource_id);
            
            CREATE INDEX IF NOT EXISTS idx_expires_at 
            ON leases(expires_at);
        """
        
        await self.storage_engine.execute_script(schema)
        
        # Load existing leases
        await self._load_leases()
        
        self._initialized = True
    
    async def _load_leases(self) -> None:
        """Load existing leases from storage."""
        rows = await self.storage_engine.execute(
            """
            SELECT lease_id, resource_id, acquired_at, expires_at, ttl
            FROM leases
            WHERE expires_at > datetime('now')
            """,
            (),
            fetch='all'
        )
        
        for row in rows:
            lease = Lease(
                lease_id=row[0],
                resource_id=row[1],
                acquired_at=datetime.fromisoformat(row[2]),
                expires_at=datetime.fromisoformat(row[3]),
                ttl=row[4]
            )
            self._leases[lease.lease_id] = lease
    
    async def acquire(
        self,
        resource_id: str,
        ttl: int = 60
    ) -> Optional[Lease]:
        """
        Acquire a lease on a resource.
        
        Returns None if resource already leased.
        """
        await self._initialize()
        
        async with self._lock:
            # Check if resource already leased
            for lease in self._leases.values():
                if lease.resource_id == resource_id:
                    if lease.expires_at > datetime.utcnow():
                        return None  # Resource already leased
                    else:
                        # Lease expired, remove it
                        del self._leases[lease.lease_id]
                        await self._delete_lease(lease.lease_id)
            
            # Create new lease
            lease_id = str(uuid.uuid4())
            lease = Lease(
                lease_id=lease_id,
                resource_id=resource_id,
                acquired_at=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(seconds=ttl),
                ttl=ttl
            )
            
            self._leases[lease_id] = lease
            await self._persist_lease(lease)
            return lease
    
    async def renew(self, lease_id: str, ttl: int = 60) -> bool:
        """
        Renew a lease.
        
        Returns False if lease not found or expired.
        """
        await self._initialize()
        
        async with self._lock:
            lease = self._leases.get(lease_id)
            if not lease:
                return False
            
            if lease.expires_at < datetime.utcnow():
                # Lease expired
                del self._leases[lease_id]
                await self._delete_lease(lease_id)
                return False
            
            # Renew lease
            lease.expires_at = datetime.utcnow() + timedelta(seconds=ttl)
            await self._persist_lease(lease)
            return True
    
    async def release(self, lease_id: str) -> bool:
        """
        Release a lease.
        
        Returns False if lease not found.
        """
        await self._initialize()
        
        async with self._lock:
            if lease_id not in self._leases:
                return False
            
            del self._leases[lease_id]
            await self._delete_lease(lease_id)
            return True
    
    async def heartbeat(self, lease_id: str) -> bool:
        """
        Heartbeat to keep lease alive.
        
        Equivalent to renew with original TTL.
        """
        lease = self._leases.get(lease_id)
        if not lease:
            return False
        
        return await self.renew(lease_id, lease.ttl)
    
    async def get_lease(self, lease_id: str) -> Optional[Lease]:
        """Get lease by ID."""
        return self._leases.get(lease_id)
    
    async def cleanup_expired(self) -> int:
        """Clean up expired leases. Returns count of leases removed."""
        await self._initialize()
        
        async with self._lock:
            now = datetime.utcnow()
            expired = [
                lease_id for lease_id, lease in self._leases.items()
                if lease.expires_at < now
            ]
            
            for lease_id in expired:
                del self._leases[lease_id]
                await self._delete_lease(lease_id)
            
            return len(expired)
    
    async def _heartbeat_loop(self) -> None:
        """Background loop to clean up expired leases."""
        while True:
            try:
                await asyncio.sleep(self._heartbeat_interval)
                await self.cleanup_expired()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Lease heartbeat error: {e}")
    
    async def start_heartbeat(self) -> None:
        """Start the heartbeat background task."""
        if self._heartbeat_task is None or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
    
    async def stop_heartbeat(self) -> None:
        """Stop the heartbeat background task."""
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
    
    async def _persist_lease(self, lease: Lease) -> None:
        """Persist lease to storage."""
        await self.storage_engine.execute(
            """
            INSERT OR REPLACE INTO leases
            (lease_id, resource_id, acquired_at, expires_at, ttl)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                lease.lease_id,
                lease.resource_id,
                lease.acquired_at.isoformat(),
                lease.expires_at.isoformat(),
                lease.ttl
            ),
            fetch='none'
        )
    
    async def _delete_lease(self, lease_id: str) -> None:
        """Delete lease from storage."""
        await self.storage_engine.execute(
            """
            DELETE FROM leases WHERE lease_id = ?
            """,
            (lease_id,),
            fetch='none'
        )
