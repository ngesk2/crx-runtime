"""
Mission Queue Backend - Interface for persistent queue implementations.

This module defines the interface for mission queue backends:
- SQLite
- Redis
- NATS JetStream

Each backend implements the same interface for queue operations.
This solves the problem of losing the queue on runtime crashes.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from datetime import datetime
import asyncio

from hermes.storage.engine import StorageEngine


class MissionQueueBackend(ABC):
    """
    Abstract base class for mission queue backends.
    
    All queue implementations must implement this interface.
    """
    
    @abstractmethod
    async def enqueue(
        self,
        mission_id: str,
        priority: int = 0
    ) -> None:
        """
        Enqueue a mission.
        
        Args:
            mission_id: Mission identifier
            priority: Mission priority
        """
        pass
    
    @abstractmethod
    async def dequeue(self) -> Optional[str]:
        """
        Dequeue next mission (blocking).
        
        Returns:
            Mission ID or None if queue empty
        """
        pass
    
    @abstractmethod
    async def peek(self) -> Optional[str]:
        """
        Peek at next mission without removing.
        
        Returns:
            Mission ID or None if queue empty
        """
        pass
    
    @abstractmethod
    async def cancel(self, mission_id: str) -> bool:
        """
        Cancel a mission in queue.
        
        Args:
            mission_id: Mission identifier
        
        Returns:
            True if cancelled
        """
        pass
    
    @abstractmethod
    async def size(self) -> int:
        """Get queue size."""
        pass
    
    @abstractmethod
    async def is_empty(self) -> bool:
        """Check if queue is empty."""
        pass


class SQLiteMissionQueueBackend(MissionQueueBackend):
    """
    SQLite mission queue backend.
    
    Stores missions in SQLite database with priority ordering.
    Uses StorageEngine for connection pooling and WAL mode.
    """
    
    def __init__(self, db_path: str = "mission_queue.db", storage_engine: Optional[StorageEngine] = None):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self._initialized = False
        self._lock = asyncio.Lock()
        self._not_empty = asyncio.Condition(self._lock)
    
    async def _initialize(self) -> None:
        """Initialize database schema."""
        if self._initialized:
            return
        
        self.storage_engine.initialize()
        
        schema = """
            CREATE TABLE IF NOT EXISTS mission_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                mission_id TEXT NOT NULL UNIQUE,
                priority INTEGER NOT NULL DEFAULT 0,
                queued_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'queued'
            );
            
            CREATE INDEX IF NOT EXISTS idx_mission_id 
            ON mission_queue(mission_id);
            
            CREATE INDEX IF NOT EXISTS idx_priority 
            ON mission_queue(priority DESC, queued_at ASC);
            
            CREATE INDEX IF NOT EXISTS idx_status 
            ON mission_queue(status);
        """
        
        await self.storage_engine.execute_script(schema)
        self._initialized = True
    
    async def enqueue(
        self,
        mission_id: str,
        priority: int = 0
    ) -> None:
        """Enqueue a mission."""
        await self._initialize()
        
        async with self._lock:
            # Check if mission already in queue
            existing = await self.storage_engine.execute(
                """
                SELECT mission_id FROM mission_queue 
                WHERE mission_id = ? AND status = 'queued'
                """,
                (mission_id,),
                fetch='one'
            )
            
            if existing:
                raise ValueError(f"Mission {mission_id} already in queue")
            
            await self.storage_engine.execute(
                """
                INSERT INTO mission_queue
                (mission_id, priority, queued_at, status)
                VALUES (?, ?, ?, 'queued')
                """,
                (
                    mission_id,
                    priority,
                    datetime.utcnow().isoformat()
                ),
                fetch='none'
            )
            
            # Notify waiting dequeuers
            self._not_empty.notify()
    
    async def dequeue(self) -> Optional[str]:
        """Dequeue next mission (blocking)."""
        await self._initialize()
        
        async with self._not_empty:
            # Wait for mission to be available
            while True:
                # Try to dequeue
                row = await self.storage_engine.execute(
                    """
                    UPDATE mission_queue
                    SET status = 'processing'
                    WHERE id = (
                        SELECT id FROM mission_queue
                        WHERE status = 'queued'
                        ORDER BY priority DESC, queued_at ASC
                        LIMIT 1
                    )
                    RETURNING mission_id
                    """,
                    (),
                    fetch='one'
                )
                
                if row:
                    return row[0]
                
                # Wait for new missions
                await self._not_empty.wait()
    
    async def peek(self) -> Optional[str]:
        """Peek at next mission without removing."""
        await self._initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT mission_id
            FROM mission_queue
            WHERE status = 'queued'
            ORDER BY priority DESC, queued_at ASC
            LIMIT 1
            """,
            (),
            fetch='one'
        )
        
        if not row:
            return None
        
        return row[0]
    
    async def cancel(self, mission_id: str) -> bool:
        """Cancel a mission in queue."""
        await self._initialize()
        
        result = await self.storage_engine.execute(
            """
            DELETE FROM mission_queue
            WHERE mission_id = ? AND status = 'queued'
            """,
            (mission_id,),
            fetch='none'
        )
        
        return True
    
    async def size(self) -> int:
        """Get queue size."""
        await self._initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT COUNT(*) FROM mission_queue WHERE status = 'queued'
            """,
            (),
            fetch='one'
        )
        
        return row[0] if row else 0
    
    async def is_empty(self) -> bool:
        """Check if queue is empty."""
        return await self.size() == 0
    
    async def complete(self, mission_id: str) -> None:
        """Mark mission as completed."""
        await self._initialize()
        
        await self.storage_engine.execute(
            """
            DELETE FROM mission_queue WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='none'
        )
    
    async def fail(self, mission_id: str) -> None:
        """Mark mission as failed."""
        await self._initialize()
        
        await self.storage_engine.execute(
            """
            UPDATE mission_queue SET status = 'failed'
            WHERE mission_id = ?
            """,
            (mission_id,),
            fetch='none'
        )


class RedisMissionQueueBackend(MissionQueueBackend):
    """
    Redis mission queue backend.
    
    Stores missions in Redis lists with priority support.
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self._client = None
        self._initialized = False
    
    async def _initialize(self) -> None:
        """Initialize Redis client."""
        if self._initialized:
            return
        
        try:
            import redis.asyncio as redis
            self._client = await redis.from_url(self.redis_url)
            await self._client.ping()
            self._initialized = True
        except ImportError:
            raise ImportError("redis package required for Redis backend. Install with: pip install redis")
    
    async def enqueue(
        self,
        mission_id: str,
        priority: int = 0
    ) -> None:
        """Enqueue a mission."""
        await self._initialize()
        
        # Store mission data
        import json
        
        await self._client.hset(
            f"mission:{mission_id}",
            mapping={
                "priority": priority,
                "queued_at": datetime.utcnow().isoformat()
            }
        )
        
        # Add to priority queue (sorted set)
        await self._client.zadd(
            "mission_queue",
            {mission_id: priority}
        )
    
    async def dequeue(self) -> Optional[str]:
        """Dequeue next mission (blocking)."""
        await self._initialize()
        
        # Get highest priority mission
        result = await self._client.bzpopmax("mission_queue", timeout=1)
        
        if not result:
            return None
        
        mission_id = result[1].decode('utf-8')
        
        # Clean up
        await self._client.delete(f"mission:{mission_id}")
        
        return mission_id
    
    async def peek(self) -> Optional[str]:
        """Peek at next mission without removing."""
        await self._initialize()
        
        result = await self._client.zrange("mission_queue", -1, -1, withscores=True)
        
        if not result:
            return None
        
        return result[0][0].decode('utf-8')
    
    async def cancel(self, mission_id: str) -> bool:
        """Cancel a mission in queue."""
        await self._initialize()
        
        await self._client.zrem("mission_queue", mission_id)
        await self._client.delete(f"mission:{mission_id}")
        
        return True
    
    async def size(self) -> int:
        """Get queue size."""
        await self._initialize()
        
        return await self._client.zcard("mission_queue")
    
    async def is_empty(self) -> bool:
        """Check if queue is empty."""
        return await self.size() == 0


class JetStreamMissionQueueBackend(MissionQueueBackend):
    """
    NATS JetStream mission queue backend.
    
    Stores missions in NATS JetStream for distributed queue.
    """
    
    def __init__(self, nats_url: str = "nats://localhost:4222", stream_name: str = "missions"):
        self.nats_url = nats_url
        self.stream_name = stream_name
        self._nc = None
        self._js = None
        self._initialized = False
    
    async def _initialize(self) -> None:
        """Initialize NATS JetStream client."""
        if self._initialized:
            return
        
        try:
            import nats
            self._nc = await nats.connect(self.nats_url)
            self._js = self._nc.jetstream()
            
            # Create stream if not exists
            try:
                await self._js.add_stream(
                    name=self.stream_name,
                    subjects=[f"{self.stream_name}.>"],
                    storage="file",
                    max_age=86400  # 24 hours
                )
            except:
                pass  # Stream already exists
            
            self._initialized = True
        except ImportError:
            raise ImportError("nats package required for JetStream backend. Install with: pip install nats")
    
    async def enqueue(
        self,
        mission_id: str,
        priority: int = 0
    ) -> None:
        """Enqueue a mission."""
        await self._initialize()
        
        import json
        
        payload = json.dumps({
            "mission_id": mission_id,
            "priority": priority,
            "queued_at": datetime.utcnow().isoformat()
        })
        
        await self._js.publish(
            f"{self.stream_name}.{priority}",
            payload.encode('utf-8')
        )
    
    async def dequeue(self) -> Optional[str]:
        """Dequeue next mission (blocking)."""
        await self._initialize()
        
        # Subscribe to all priorities
        sub = await self._js.pull_subscribe(f"{self.stream_name}.>", "missions")
        
        messages = await sub.fetch(1, timeout=1)
        
        if not messages:
            await sub.unsubscribe()
            return None
        
        msg = messages[0]
        await msg.ack()
        await sub.unsubscribe()
        
        import json
        
        data = json.loads(msg.data.decode('utf-8'))
        
        return data["mission_id"]
    
    async def peek(self) -> Optional[str]:
        """Peek at next mission without removing."""
        # JetStream doesn't support peek easily
        # This is a simplified implementation
        return None
    
    async def cancel(self, mission_id: str) -> bool:
        """Cancel a mission in queue."""
        # JetStream doesn't support cancel by mission_id easily
        # This would require tracking message IDs
        return False
    
    async def size(self) -> int:
        """Get queue size."""
        await self._initialize()
        
        stream_info = await self._js.stream_info(self.stream_name)
        return stream_info.state.messages
    
    async def is_empty(self) -> bool:
        """Check if queue is empty."""
        return await self.size() == 0
