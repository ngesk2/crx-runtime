"""
Event Bus - Event-driven architecture.

This service provides event emission and subscription:
- MissionQueued
- MissionStarted
- CapabilityStarted
- CapabilityCompleted
- ArtifactCreated
- MissionCompleted
- MissionFailed

Dashboards, projections, MCP, UI, logs all subscribe instead of coupling.
"""

from typing import Any, Callable, Dict, List, Optional
import asyncio
from datetime import datetime
import json

from hermes.storage.engine import StorageEngine
from hermes.infrastructure.logger import Logger, ConsoleLogger


class EventBus:
    """
    Event bus for event-driven architecture.
    
    All system events flow through this bus.
    Subscribers can listen to specific event types.
    Events are persisted to an append-only log for durability.
    """
    
    def __init__(
        self,
        db_path: str = "events.db",
        storage_engine: Optional[StorageEngine] = None,
        max_workers: int = 10,
        logger: Optional[Logger] = None
    ):
        self.storage_engine = storage_engine or StorageEngine(db_path)
        self._subscribers: Dict[str, List[Callable]] = {}
        self._initialized = False
        self._lock = asyncio.Lock()
        self._max_workers = max_workers
        self._worker_semaphore = asyncio.Semaphore(max_workers)
        self.logger = logger or ConsoleLogger()
        self._subscriber_tasks: set[asyncio.Task] = set()  # Track subscriber tasks
    
    async def _initialize(self) -> None:
        """Initialize database schema."""
        if self._initialized:
            return
        
        self.storage_engine.initialize()
        
        schema = """
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                stream_position INTEGER NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS event_checkpoints (
                consumer_id TEXT PRIMARY KEY,
                last_position INTEGER NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_event_type 
            ON events(event_type);
            
            CREATE INDEX IF NOT EXISTS idx_timestamp 
            ON events(timestamp);
            
            CREATE INDEX IF NOT EXISTS idx_stream_position 
            ON events(stream_position);
        """
        
        await self.storage_engine.execute_script(schema)
        self._initialized = True
    
    async def emit(self, event_type: str, payload: Dict[str, Any]) -> None:
        """
        Emit event to all subscribers.
        
        Args:
            event_type: Type of event
            payload: Event payload
        """
        await self._initialize()
        
        event = {
            "event_type": event_type,
            "payload": payload,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Persist to append-only log
        await self._persist_event(event)
        
        # Notify subscribers (non-blocking)
        if event_type in self._subscribers:
            for callback in self._subscribers[event_type]:
                # Create task for each subscriber with semaphore limiting
                task = asyncio.create_task(self._notify_subscriber(callback, event))
                self._subscriber_tasks.add(task)
                # Clean up completed tasks
                task.add_done_callback(lambda t: self._subscriber_tasks.discard(t))
    
    async def _notify_subscriber(self, callback: Callable, event: Dict[str, Any]) -> None:
        """Notify a single subscriber with error handling and worker limiting."""
        async with self._worker_semaphore:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event)
                else:
                    callback(event)
            except Exception as e:
                # Log error but don't block other subscribers
                self.logger.error(f"Event subscriber error: {e}", {"event": event})
    
    async def _persist_event(self, event: Dict[str, Any]) -> None:
        """Persist event to append-only log."""
        # Use atomic subquery to avoid race condition
        await self.storage_engine.execute(
            """
            INSERT INTO events (event_type, payload, timestamp, stream_position)
            VALUES (?, ?, ?, COALESCE((SELECT MAX(stream_position) FROM events), -1) + 1)
            """,
            (
                event["event_type"],
                json.dumps(event["payload"]),
                event["timestamp"]
            ),
            fetch='none'
        )
    
    def subscribe(self, event_type: str, callback: Callable) -> None:
        """
        Subscribe to event type.
        
        Args:
            event_type: Type of event to subscribe to
            callback: Callback function
        """
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        
        self._subscribers[event_type].append(callback)
    
    def unsubscribe(self, event_type: str, callback: Callable) -> None:
        """
        Unsubscribe from event type.
        
        Args:
            event_type: Type of event to unsubscribe from
            callback: Callback function
        """
        if event_type in self._subscribers:
            self._subscribers[event_type].remove(callback)
    
    async def get_history(
        self,
        event_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get event history from persistent log.
        
        Args:
            event_type: Optional event type filter
            limit: Maximum number of events to return
            offset: Offset for pagination
        
        Returns:
            List of events
        """
        await self._initialize()
        
        if event_type:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                WHERE event_type = ?
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (event_type, limit, offset),
                fetch='all'
            )
        else:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                ORDER BY id DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
                fetch='all'
            )
        
        return [
            {
                "event_type": row[0],
                "payload": json.loads(row[1]),
                "timestamp": row[2],
                "stream_position": row[3]
            }
            for row in rows
        ]
    
    async def replay_events(
        self,
        event_type: Optional[str] = None,
        from_position: Optional[int] = None,
        from_timestamp: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Replay events from persistent log using stream position.
        
        Args:
            event_type: Optional event type filter
            from_position: Optional stream position to start from
            from_timestamp: Optional timestamp to start from (deprecated, use from_position)
        
        Returns:
            List of events
        """
        await self._initialize()
        
        if event_type and from_position is not None:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                WHERE event_type = ? AND stream_position >= ?
                ORDER BY stream_position ASC
                """,
                (event_type, from_position),
                fetch='all'
            )
        elif event_type:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                WHERE event_type = ?
                ORDER BY stream_position ASC
                """,
                (event_type,),
                fetch='all'
            )
        elif from_position is not None:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                WHERE stream_position >= ?
                ORDER BY stream_position ASC
                """,
                (from_position,),
                fetch='all'
            )
        else:
            rows = await self.storage_engine.execute(
                """
                SELECT event_type, payload, timestamp, stream_position
                FROM events
                ORDER BY stream_position ASC
                """,
                (),
                fetch='all'
            )
        
        return [
            {
                "event_type": row[0],
                "payload": json.loads(row[1]),
                "timestamp": row[2],
                "stream_position": row[3]
            }
            for row in rows
        ]
    
    async def get_checkpoint(self, consumer_id: str) -> Optional[int]:
        """
        Get checkpoint for a consumer.
        
        Args:
            consumer_id: Consumer identifier
        
        Returns:
            Last processed stream position or None
        """
        await self._initialize()
        
        row = await self.storage_engine.execute(
            """
            SELECT last_position FROM event_checkpoints WHERE consumer_id = ?
            """,
            (consumer_id,),
            fetch='one'
        )
        
        return row[0] if row else None
    
    async def save_checkpoint(self, consumer_id: str, position: int) -> None:
        """
        Save checkpoint for a consumer.
        
        Args:
            consumer_id: Consumer identifier
            position: Last processed stream position
        """
        await self._initialize()
        
        await self.storage_engine.execute(
            """
            INSERT OR REPLACE INTO event_checkpoints (consumer_id, last_position)
            VALUES (?, ?)
            """,
            (consumer_id, position),
            fetch='none'
        )
    
    async def shutdown(self) -> None:
        """Shutdown event bus and wait for all subscriber tasks to complete."""
        # Wait for all subscriber tasks to complete
        if self._subscriber_tasks:
            await asyncio.gather(*self._subscriber_tasks, return_exceptions=True)
            self._subscriber_tasks.clear()
        
        # Close storage engine
        await self.storage_engine.close()


# Standard event types
class EventTypes:
    """Standard event types for Hermes runtime."""
    
    MISSION_QUEUED = "MissionQueued"
    MISSION_STARTED = "MissionStarted"
    MISSION_COMPLETED = "MissionCompleted"
    MISSION_FAILED = "MissionFailed"
    
    CAPABILITY_STARTED = "CapabilityStarted"
    CAPABILITY_COMPLETED = "CapabilityCompleted"
    
    ARTIFACT_CREATED = "ArtifactCreated"
    ARTIFACT_STORED = "ArtifactStored"
    
    LEASE_ACQUIRED = "LeaseAcquired"
    LEASE_RELEASED = "LeaseReleased"
