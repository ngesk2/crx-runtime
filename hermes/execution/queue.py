"""
Mission Queue - Simple FIFO queue for mission submission.

No threading yet. Simple FIFO implementation.
Uses pluggable backend for persistence.
"""

from typing import Optional
from dataclasses import dataclass
from datetime import datetime
from collections import deque
import asyncio

from hermes.execution.queue_backend import MissionQueueBackend, SQLiteMissionQueueBackend


@dataclass
class QueuedMission:
    """Mission in queue with metadata."""
    mission_id: str
    mission_data: dict
    queued_at: datetime
    priority: int = 0


class MissionQueue:
    """
    Mission queue with pluggable backend.
    
    Uses backend for persistence to survive runtime crashes.
    Defaults to SQLite backend for production use.
    """
    
    def __init__(self, backend: Optional[MissionQueueBackend] = None):
        self.backend = backend or SQLiteMissionQueueBackend()
        self._lock = asyncio.Lock()
    
    async def enqueue(
        self,
        mission_id: str,
        mission_data: dict = None,
        priority: int = 0
    ) -> None:
        """Enqueue a mission."""
        # Ignore mission_data - queue only stores mission_id
        await self.backend.enqueue(mission_id, priority)
    
    async def dequeue(self) -> Optional[QueuedMission]:
        """Dequeue next mission (FIFO)."""
        mission_id = await self.backend.dequeue()
        
        if not mission_id:
            return None
        
        return QueuedMission(
            mission_id=mission_id,
            mission_data={},  # Empty - data loaded from MissionStore
            queued_at=datetime.utcnow(),
            priority=0
        )
    
    async def peek(self) -> Optional[QueuedMission]:
        """Peek at next mission without removing."""
        mission_id = await self.backend.peek()
        
        if not mission_id:
            return None
        
        return QueuedMission(
            mission_id=mission_id,
            mission_data={},  # Empty - data loaded from MissionStore
            queued_at=datetime.utcnow(),
            priority=0
        )
    
    async def cancel(self, mission_id: str) -> bool:
        """Cancel a mission in queue."""
        return await self.backend.cancel(mission_id)
    
    async def size(self) -> int:
        """Get queue size."""
        return await self.backend.size()
    
    async def is_empty(self) -> bool:
        """Check if queue is empty."""
        return await self.backend.is_empty()
    
    async def complete(self, mission_id: str) -> None:
        """Mark mission as completed."""
        if hasattr(self.backend, 'complete'):
            await self.backend.complete(mission_id)
    
    async def fail(self, mission_id: str) -> None:
        """Mark mission as failed."""
        if hasattr(self.backend, 'fail'):
            await self.backend.fail(mission_id)
