"""
Mission Store - Centralized mission storage with serialization.

This module provides a MissionStore that owns all serialization logic.
The queue backend stores only mission_id, making it serialization-agnostic.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
import asyncio

from hermes.runtime.mission_factory import Mission, MissionFactory
from hermes.runtime.serializer import MissionSerializer
from hermes.storage.engine import StorageEngine


class MissionStore:
    """
    Centralized mission storage with serialization ownership.
    
    The queue backend stores only mission_id.
    This store handles all mission serialization/deserialization.
    """
    
    def __init__(self, db_path: str = "missions.db", storage_engine: Optional[StorageEngine] = None):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self.factory = MissionFactory()
        self.serializer = MissionSerializer()
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize database schema."""
        if self._initialized:
            return
        
        self.storage_engine.initialize()
        
        schema = """
            CREATE TABLE IF NOT EXISTS missions (
                mission_id TEXT PRIMARY KEY,
                serialized_data TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_created_at 
            ON missions(created_at);
            
            CREATE INDEX IF NOT EXISTS idx_updated_at 
            ON missions(updated_at);
        """
        
        await self.storage_engine.execute_script(schema)
        self._initialized = True
    
    async def save(self, mission: Mission) -> None:
        """
        Save mission to storage.
        
        Args:
            mission: Mission object
        """
        await self.initialize()
        
        serialized = self.serializer.serialize(mission)
        import json
        
        await self.storage_engine.execute(
            """
            INSERT OR REPLACE INTO missions
            (mission_id, serialized_data, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                mission.mission_id,
                json.dumps(serialized),
                mission.created_at.isoformat() if mission.created_at else datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ),
            fetch='none'
        )
    
    async def load(self, mission_id: str) -> Optional[Mission]:
        """
        Load mission from storage.
        
        Args:
            mission_id: Mission identifier
        
        Returns:
            Mission object or None if not found
        """
        await self.initialize()
        
        import json
        
        row = await self.storage_engine.execute(
            """
            SELECT serialized_data FROM missions WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='one'
        )
        
        if not row:
            return None
        
        serialized = json.loads(row[0])
        return self.factory.reconstruct(serialized)
    
    async def delete(self, mission_id: str) -> bool:
        """
        Delete mission from storage.
        
        Args:
            mission_id: Mission identifier
        
        Returns:
            True if deleted
        """
        await self.initialize()
        
        await self.storage_engine.execute(
            """
            DELETE FROM missions WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='none'
        )
        return True
    
    async def list_all(self, limit: int = 100, offset: int = 0) -> List[Mission]:
        """
        List all missions.
        
        Args:
            limit: Maximum number of missions to return
            offset: Offset for pagination
        
        Returns:
            List of Mission objects
        """
        await self.initialize()
        
        import json
        
        rows = await self.storage_engine.execute(
            """
            SELECT serialized_data FROM missions
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
            fetch='all'
        )
        
        missions = []
        for row in rows:
            serialized = json.loads(row[0])
            mission = self.factory.reconstruct(serialized)
            missions.append(mission)
        
        return missions
    
    async def list_by_capability(self, capability: str, limit: int = 100) -> List[Mission]:
        """
        List missions by capability.
        
        Args:
            capability: Capability identifier
            limit: Maximum number of missions to return
        
        Returns:
            List of Mission objects
        """
        await self.initialize()
        
        import json
        
        rows = await self.storage_engine.execute(
            """
            SELECT serialized_data FROM missions
            WHERE serialized_data LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (f'%"capability": "{capability}"%', limit),
            fetch='all'
        )
        
        missions = []
        for row in rows:
            serialized = json.loads(row[0])
            mission = self.factory.reconstruct(serialized)
            missions.append(mission)
        
        return missions
    
    async def count(self) -> int:
        """Get total mission count."""
        await self.initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT COUNT(*) FROM missions
            """,
            (),
            fetch='one'
        )
        
        return row[0] if row else 0
    
    async def exists(self, mission_id: str) -> bool:
        """
        Check if mission exists.
        
        Args:
            mission_id: Mission identifier
        
        Returns:
            True if mission exists
        """
        await self.initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT 1 FROM missions WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='one'
        )
        
        return row is not None
    
    async def update(self, mission: Mission) -> None:
        """
        Update mission in storage.
        
        Args:
            mission: Mission object
        """
        await self.initialize()
        
        serialized = self.serializer.serialize(mission)
        import json
        
        await self.storage_engine.execute(
            """
            UPDATE missions
            SET serialized_data = ?, updated_at = ?
            WHERE mission_id = ?
            """,
            (
                json.dumps(serialized),
                datetime.utcnow().isoformat(),
                mission.mission_id
            ),
            fetch='none'
        )
