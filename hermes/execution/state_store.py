"""
Mission State Store - Persistent Mission lifecycle.

Responsibilities:
- Persistent Mission lifecycle (Created, Queued, Running, Completed, Failed, Cancelled)
- Must survive restart
- SQLite acceptable
- Repository pattern preferred
"""

from typing import Optional, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import asyncio

from hermes.storage.engine import StorageEngine


class MissionLifecycleState(Enum):
    """Mission lifecycle states."""
    CREATED = "created"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class MissionState:
    """Persistent mission state."""
    mission_id: str
    lifecycle: MissionLifecycleState
    created_at: datetime
    updated_at: datetime
    result: Optional[dict] = None
    error: Optional[str] = None
    lease_id: Optional[str] = None


class MissionStateStore:
    """
    Persistent mission state store using SQLite.
    
    Repository pattern for mission lifecycle persistence.
    Uses StorageEngine for connection pooling and WAL mode.
    """
    
    def __init__(self, db_path: str = "hermes_missions.db", storage_engine: Optional[StorageEngine] = None):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize database schema."""
        if self._initialized:
            return
        
        self.storage_engine.initialize()
        
        schema = """
            CREATE TABLE IF NOT EXISTS mission_states (
                mission_id TEXT PRIMARY KEY,
                lifecycle TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                result TEXT,
                error TEXT,
                lease_id TEXT
            );
            
            CREATE INDEX IF NOT EXISTS idx_lifecycle 
            ON mission_states(lifecycle);
            
            CREATE INDEX IF NOT EXISTS idx_updated_at 
            ON mission_states(updated_at);
        """
        
        await self.storage_engine.execute_script(schema)
        self._initialized = True
    
    async def save(self, state: MissionState) -> None:
        """Save mission state."""
        import json
        
        await self.storage_engine.execute(
            """
            INSERT OR REPLACE INTO mission_states
            (mission_id, lifecycle, created_at, updated_at, result, error, lease_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                state.mission_id,
                state.lifecycle.value,
                state.created_at.isoformat(),
                state.updated_at.isoformat(),
                json.dumps(state.result) if state.result else None,
                state.error,
                state.lease_id
            ),
            fetch='none'
        )
    
    async def load(self, mission_id: str) -> Optional[MissionState]:
        """Load mission state."""
        import json
        
        row = await self.storage_engine.execute(
            """
            SELECT mission_id, lifecycle, created_at, updated_at, result, error, lease_id
            FROM mission_states
            WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='one'
        )
        
        if not row:
            return None
        
        return MissionState(
            mission_id=row[0],
            lifecycle=MissionLifecycleState(row[1]),
            created_at=datetime.fromisoformat(row[2]),
            updated_at=datetime.fromisoformat(row[3]),
            result=json.loads(row[4]) if row[4] else None,
            error=row[5],
            lease_id=row[6]
        )
    
    async def update_lifecycle(
        self,
        mission_id: str,
        lifecycle: MissionLifecycleState,
        result: Optional[dict] = None,
        error: Optional[str] = None,
        lease_id: Optional[str] = None
    ) -> None:
        """Update mission lifecycle state."""
        import json
        
        await self.storage_engine.execute(
            """
            UPDATE mission_states
            SET lifecycle = ?, updated_at = ?, result = ?, error = ?, lease_id = ?
            WHERE mission_id = ?
            """,
            (
                lifecycle.value,
                datetime.utcnow().isoformat(),
                json.dumps(result) if result else None,
                error,
                lease_id,
                mission_id
            ),
            fetch='none'
        )
    
    async def list_by_lifecycle(self, lifecycle: MissionLifecycleState) -> List[MissionState]:
        """List missions by lifecycle state."""
        import json
        
        rows = await self.storage_engine.execute(
            """
            SELECT mission_id, lifecycle, created_at, updated_at, result, error, lease_id
            FROM mission_states
            WHERE lifecycle = ?
            ORDER BY created_at DESC
            """,
            (lifecycle.value,),
            fetch='all'
        )
        
        return [
            MissionState(
                mission_id=row[0],
                lifecycle=MissionLifecycleState(row[1]),
                created_at=datetime.fromisoformat(row[2]),
                updated_at=datetime.fromisoformat(row[3]),
                result=json.loads(row[4]) if row[4] else None,
                error=row[5],
                lease_id=row[6]
            )
            for row in rows
        ]
    
    async def delete(self, mission_id: str) -> bool:
        """Delete mission state."""
        result = await self.storage_engine.execute(
            """
            DELETE FROM mission_states
            WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='none'
        )
        return True
