"""
Unit of Work - Atomic transaction coordination.

Ensures that multiple operations across different components
happen atomically: either all succeed or all roll back.

This prevents corruption where:
- Artifact exists
- Event exists
- But mission state says queued

Usage:
    async with UnitOfWork(storage_engine) as uow:
        await uow.mission_store.save(mission)
        await uow.artifact_repository.store(data, mission_id)
        await uow.event_bus.emit("ArtifactStored", {...})
        await uow.lease_manager.release(lease_id)
        # All operations committed on exit
"""

from contextlib import asynccontextmanager
from typing import Optional, Any, Dict
import asyncio

from hermes.storage.engine import StorageEngine
from hermes.runtime.mission_store import MissionStore
from hermes.runtime.artifact_repository import CanonicalArtifactRepository
from hermes.runtime.event_bus import EventBus
from hermes.execution.lease import LeaseManager


class UnitOfWork:
    """
    Unit of Work for atomic multi-component operations.
    
    Coordinates MissionStore, ArtifactRepository, EventBus, and LeaseManager
    within a single database transaction.
    """
    
    def __init__(
        self,
        storage_engine: StorageEngine,
        mission_store: MissionStore,
        artifact_repository: CanonicalArtifactRepository,
        event_bus: EventBus,
        lease_manager: LeaseManager
    ):
        self.storage_engine = storage_engine
        self.mission_store = mission_store
        self.artifact_repository = artifact_repository
        self.event_bus = event_bus
        self.lease_manager = lease_manager
        self._tx = None
        self._committed = False
    
    async def __aenter__(self):
        """Begin transaction."""
        # Use public Transaction API
        self._tx = self.storage_engine.begin_transaction()
        self._committed = False
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Commit or rollback transaction."""
        if exc_type is not None:
            # Exception occurred, rollback
            self.storage_engine.end_transaction(self._tx, commit=False)
            return False
        
        # No exception, commit
        self.storage_engine.end_transaction(self._tx, commit=True)
        self._committed = True
        return True
    
    async def save_mission(self, mission: Any) -> None:
        """Save mission within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        # Use the transaction
        from constitution.canonical_serialization import CanonicalSerializer
        serializer = CanonicalSerializer()
        
        mission_data = serializer.serialize(mission)
        
        self._tx.execute(
            """
            INSERT OR REPLACE INTO missions
            (mission_id, mission_data, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                mission.mission_id,
                mission_data,
                mission.created_at.isoformat() if hasattr(mission, 'created_at') else None,
                mission.updated_at.isoformat() if hasattr(mission, 'updated_at') else None
            )
        )
    
    async def update_mission_state(self, mission_id: str, state: str) -> None:
        """Update mission state within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        from datetime import datetime
        
        self._tx.execute(
            """
            UPDATE missions
            SET state = ?, updated_at = ?
            WHERE mission_id = ?
            """,
            (state, datetime.utcnow().isoformat(), mission_id)
        )
    
    async def store_artifact_blob(self, artifact_id: str, content: bytes) -> None:
        """Store artifact blob within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        from datetime import datetime
        
        self._tx.execute(
            """
            INSERT OR REPLACE INTO artifacts
            (artifact_id, content, created_at)
            VALUES (?, ?, ?)
            """,
            (artifact_id, content, datetime.utcnow().isoformat())
        )
    
    async def persist_event(self, event_type: str, payload: Dict[str, Any]) -> None:
        """Persist event within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        import json
        from datetime import datetime
        
        # Use atomic subquery for stream_position
        self._tx.execute(
            """
            INSERT INTO events (event_type, payload, timestamp, stream_position)
            VALUES (?, ?, ?, COALESCE((SELECT MAX(stream_position) FROM events), -1) + 1)
            """,
            (
                event_type,
                json.dumps(payload),
                datetime.utcnow().isoformat()
            )
        )
    
    async def acquire_lease(self, resource_id: str, ttl: int = 60) -> Optional[str]:
        """Acquire lease within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        import uuid
        from datetime import datetime, timedelta
        
        # Check if resource already leased
        cursor = self._tx.cursor()
        cursor.execute(
            """
            SELECT lease_id, expires_at FROM leases
            WHERE resource_id = ? AND expires_at > datetime('now')
            """,
            (resource_id,)
        )
        row = cursor.fetchone()
        
        if row:
            return None  # Already leased
        
        # Create new lease
        lease_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(seconds=ttl)
        
        self._tx.execute(
            """
            INSERT INTO leases (lease_id, resource_id, acquired_at, expires_at, ttl)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                lease_id,
                resource_id,
                datetime.utcnow().isoformat(),
                expires_at.isoformat(),
                ttl
            )
        )
        
        return lease_id
    
    async def release_lease(self, lease_id: str) -> bool:
        """Release lease within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        cursor = self._tx.cursor()
        cursor.execute(
            "DELETE FROM leases WHERE lease_id = ?",
            (lease_id,)
        )
        
        return cursor.rowcount > 0
    
    async def update_checkpoint(self, consumer_id: str, position: int) -> None:
        """Update event checkpoint within transaction."""
        if not self._tx:
            raise RuntimeError("UnitOfWork not active")
        
        self._tx.execute(
            """
            INSERT OR REPLACE INTO event_checkpoints (consumer_id, last_position)
            VALUES (?, ?)
            """,
            (consumer_id, position)
        )
    
    def is_committed(self) -> bool:
        """Check if transaction was committed."""
        return self._committed


class UnitOfWorkManager:
    """
    Manager for creating UnitOfWork instances.
    
    Provides a single entry point for coordinating components
    that share the same storage engine.
    """
    
    def __init__(
        self,
        storage_engine: StorageEngine,
        mission_store: MissionStore,
        artifact_repository: CanonicalArtifactRepository,
        event_bus: EventBus,
        lease_manager: LeaseManager
    ):
        self.storage_engine = storage_engine
        self.mission_store = mission_store
        self.artifact_repository = artifact_repository
        self.event_bus = event_bus
        self.lease_manager = lease_manager
    
    @asynccontextmanager
    async def begin(self):
        """Begin a new Unit of Work."""
        uow = UnitOfWork(
            self.storage_engine,
            self.mission_store,
            self.artifact_repository,
            self.event_bus,
            self.lease_manager
        )
        async with uow:
            yield uow
