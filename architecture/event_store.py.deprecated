"""
Event Store Implementation.

Append-only event store for event sourcing.
Events become canonical truth.
Current runtime state becomes derived projections.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime, timezone
from enum import Enum
import json
import sqlite3
import uuid
from pathlib import Path

from architecture.canonical_events import CanonicalEvent, EventType, EventStream


class EventStoreError(Exception):
    """Base exception for event store errors."""
    pass


class ConcurrencyError(EventStoreError):
    """Raised when there's a concurrency conflict."""
    pass


@dataclass
class EventMetadata:
    """Metadata for stored events."""
    event_id: str
    stream_id: str
    stream_version: int
    global_position: int
    occurred_at: str
    event_type: str


class EventStore:
    """
    Append-only event store.
    
    Events are immutable and append-only.
    Supports optimistic concurrency control.
    """
    
    def __init__(self, db_path: str = "architecture/events/event_store.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Initialize the event store database."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    stream_id TEXT NOT NULL,
                    stream_version INTEGER NOT NULL,
                    global_position INTEGER NOT NULL,
                    event_type TEXT NOT NULL,
                    aggregate_id TEXT NOT NULL,
                    aggregate_type TEXT NOT NULL,
                    event_version TEXT NOT NULL,
                    occurred_at TEXT NOT NULL,
                    occurred_by TEXT NOT NULL,
                    data TEXT NOT NULL,
                    metadata TEXT NOT NULL,
                    causation_id TEXT,
                    correlation_id TEXT,
                    created_at TEXT NOT NULL,
                    UNIQUE(stream_id, stream_version)
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS streams (
                    stream_id TEXT PRIMARY KEY,
                    aggregate_id TEXT NOT NULL,
                    aggregate_type TEXT NOT NULL,
                    current_version INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_stream_id 
                ON events(stream_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_aggregate_id 
                ON events(aggregate_id)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_event_type 
                ON events(event_type)
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_events_global_position 
                ON events(global_position)
            """)
    
    def append_event(
        self,
        event: CanonicalEvent,
        expected_version: Optional[int] = None
    ) -> EventMetadata:
        """
        Append an event to the store.
        
        Args:
            event: Event to append
            expected_version: Expected stream version for optimistic concurrency
        
        Returns:
            Event metadata
        """
        stream_id = f"{event.aggregate_type}:{event.aggregate_id}"
        
        with sqlite3.connect(self.db_path) as conn:
            # Get current stream version
            cursor = conn.execute(
                "SELECT current_version FROM streams WHERE stream_id = ?",
                (stream_id,)
            )
            row = cursor.fetchone()
            
            if row:
                current_version = row[0]
            else:
                current_version = 0
                # Create stream
                conn.execute("""
                    INSERT INTO streams (stream_id, aggregate_id, aggregate_type, current_version, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    stream_id,
                    event.aggregate_id,
                    event.aggregate_type,
                    0,
                    datetime.now(timezone.utc).isoformat(),
                    datetime.now(timezone.utc).isoformat()
                ))
            
            # Check optimistic concurrency
            if expected_version is not None and current_version != expected_version:
                raise ConcurrencyError(
                    f"Expected version {expected_version}, but stream is at version {current_version}"
                )
            
            # Get next global position
            cursor = conn.execute("SELECT MAX(global_position) FROM events")
            row = cursor.fetchone()
            global_position = (row[0] + 1) if row[0] else 1
            
            # Insert event
            new_version = current_version + 1
            conn.execute("""
                INSERT INTO events (
                    event_id, stream_id, stream_version, global_position,
                    event_type, aggregate_id, aggregate_type, event_version,
                    occurred_at, occurred_by, data, metadata,
                    causation_id, correlation_id, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                event.event_id,
                stream_id,
                new_version,
                global_position,
                event.event_type.value,
                event.aggregate_id,
                event.aggregate_type,
                event.event_version,
                event.occurred_at,
                event.occurred_by,
                json.dumps(event.data),
                json.dumps(event.metadata),
                event.causation_id,
                event.correlation_id,
                datetime.now(timezone.utc).isoformat()
            ))
            
            # Update stream version
            conn.execute("""
                UPDATE streams SET current_version = ?, updated_at = ?
                WHERE stream_id = ?
            """, (new_version, datetime.now(timezone.utc).isoformat(), stream_id))
            
            conn.commit()
            
            return EventMetadata(
                event_id=event.event_id,
                stream_id=stream_id,
                stream_version=new_version,
                global_position=global_position,
                occurred_at=event.occurred_at,
                event_type=event.event_type.value
            )
    
    def append_events(
        self,
        events: List[CanonicalEvent],
        expected_version: Optional[int] = None
    ) -> List[EventMetadata]:
        """
        Append multiple events atomically.
        
        Args:
            events: Events to append
            expected_version: Expected stream version for optimistic concurrency
        
        Returns:
            List of event metadata
        """
        metadata_list = []
        
        with sqlite3.connect(self.db_path) as conn:
            try:
                # Begin transaction
                conn.execute("BEGIN TRANSACTION")
                
                for event in events:
                    stream_id = f"{event.aggregate_type}:{event.aggregate_id}"
                    
                    # Get current stream version
                    cursor = conn.execute(
                        "SELECT current_version FROM streams WHERE stream_id = ?",
                        (stream_id,)
                    )
                    row = cursor.fetchone()
                    
                    if row:
                        current_version = row[0]
                    else:
                        current_version = 0
                        # Create stream
                        conn.execute("""
                            INSERT INTO streams (stream_id, aggregate_id, aggregate_type, current_version, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?)
                        """, (
                            stream_id,
                            event.aggregate_id,
                            event.aggregate_type,
                            0,
                            datetime.now(timezone.utc).isoformat(),
                            datetime.now(timezone.utc).isoformat()
                        ))
                    
                    # Check optimistic concurrency (only on first event)
                    if expected_version is not None and event == events[0] and current_version != expected_version:
                        raise ConcurrencyError(
                            f"Expected version {expected_version}, but stream is at version {current_version}"
                        )
                    
                    # Get next global position
                    cursor = conn.execute("SELECT MAX(global_position) FROM events")
                    row = cursor.fetchone()
                    global_position = (row[0] + 1) if row[0] else 1
                    
                    # Insert event
                    new_version = current_version + 1
                    conn.execute("""
                        INSERT INTO events (
                            event_id, stream_id, stream_version, global_position,
                            event_type, aggregate_id, aggregate_type, event_version,
                            occurred_at, occurred_by, data, metadata,
                            causation_id, correlation_id, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        event.event_id,
                        stream_id,
                        new_version,
                        global_position,
                        event.event_type.value,
                        event.aggregate_id,
                        event.aggregate_type,
                        event.event_version,
                        event.occurred_at,
                        event.occurred_by,
                        json.dumps(event.data),
                        json.dumps(event.metadata),
                        event.causation_id,
                        event.correlation_id,
                        datetime.now(timezone.utc).isoformat()
                    ))
                    
                    # Update stream version
                    conn.execute("""
                        UPDATE streams SET current_version = ?, updated_at = ?
                        WHERE stream_id = ?
                    """, (new_version, datetime.now(timezone.utc).isoformat(), stream_id))
                    
                    metadata_list.append(EventMetadata(
                        event_id=event.event_id,
                        stream_id=stream_id,
                        stream_version=new_version,
                        global_position=global_position,
                        occurred_at=event.occurred_at,
                        event_type=event.event_type.value
                    ))
                    
                    current_version = new_version
                
                conn.commit()
            except Exception as e:
                conn.rollback()
                raise e
        
        return metadata_list
    
    def get_stream(
        self,
        aggregate_id: str,
        aggregate_type: str,
        from_version: Optional[int] = None,
        to_version: Optional[int] = None
    ) -> EventStream:
        """
        Get an event stream for an aggregate.
        
        Args:
            aggregate_id: Aggregate ID
            aggregate_type: Aggregate type
            from_version: Start version (inclusive)
            to_version: End version (inclusive)
        
        Returns:
            Event stream
        """
        stream_id = f"{aggregate_type}:{aggregate_id}"
        stream = EventStream(aggregate_id, aggregate_type)
        
        with sqlite3.connect(self.db_path) as conn:
            query = """
                SELECT event_id, event_type, aggregate_id, aggregate_type, event_version,
                       occurred_at, occurred_by, data, metadata, causation_id, correlation_id
                FROM events
                WHERE stream_id = ?
            """
            params = [stream_id]
            
            if from_version is not None:
                query += " AND stream_version >= ?"
                params.append(from_version)
            
            if to_version is not None:
                query += " AND stream_version <= ?"
                params.append(to_version)
            
            query += " ORDER BY stream_version ASC"
            
            cursor = conn.execute(query, params)
            
            for row in cursor.fetchall():
                event = CanonicalEvent(
                    event_id=row[0],
                    event_type=EventType(row[1]),
                    aggregate_id=row[2],
                    aggregate_type=row[3],
                    event_version=row[4],
                    occurred_at=row[5],
                    occurred_by=row[6],
                    data=json.loads(row[7]),
                    metadata=json.loads(row[8]),
                    causation_id=row[9],
                    correlation_id=row[10]
                )
                stream.append(event)
        
        return stream
    
    def get_events_by_type(
        self,
        event_type: EventType,
        limit: Optional[int] = None
    ) -> List[CanonicalEvent]:
        """
        Get events of a specific type.
        
        Args:
            event_type: Event type
            limit: Maximum number of events to return
        
        Returns:
            List of events
        """
        events = []
        
        with sqlite3.connect(self.db_path) as conn:
            query = """
                SELECT event_id, event_type, aggregate_id, aggregate_type, event_version,
                       occurred_at, occurred_by, data, metadata, causation_id, correlation_id
                FROM events
                WHERE event_type = ?
                ORDER BY global_position ASC
            """
            params = [event_type.value]
            
            if limit:
                query += " LIMIT ?"
                params.append(limit)
            
            cursor = conn.execute(query, params)
            
            for row in cursor.fetchall():
                event = CanonicalEvent(
                    event_id=row[0],
                    event_type=EventType(row[1]),
                    aggregate_id=row[2],
                    aggregate_type=row[3],
                    event_version=row[4],
                    occurred_at=row[5],
                    occurred_by=row[6],
                    data=json.loads(row[7]),
                    metadata=json.loads(row[8]),
                    causation_id=row[9],
                    correlation_id=row[10]
                )
                events.append(event)
        
        return events
    
    def get_events_by_correlation(self, correlation_id: str) -> List[CanonicalEvent]:
        """
        Get events by correlation ID.
        
        Args:
            correlation_id: Correlation ID
        
        Returns:
            List of events
        """
        events = []
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("""
                SELECT event_id, event_type, aggregate_id, aggregate_type, event_version,
                       occurred_at, occurred_by, data, metadata, causation_id, correlation_id
                FROM events
                WHERE correlation_id = ?
                ORDER BY global_position ASC
            """, (correlation_id,))
            
            for row in cursor.fetchall():
                event = CanonicalEvent(
                    event_id=row[0],
                    event_type=EventType(row[1]),
                    aggregate_id=row[2],
                    aggregate_type=row[3],
                    event_version=row[4],
                    occurred_at=row[5],
                    occurred_by=row[6],
                    data=json.loads(row[7]),
                    metadata=json.loads(row[8]),
                    causation_id=row[9],
                    correlation_id=row[10]
                )
                events.append(event)
        
        return events
    
    def get_stream_version(self, aggregate_id: str, aggregate_type: str) -> int:
        """
        Get the current version of a stream.
        
        Args:
            aggregate_id: Aggregate ID
            aggregate_type: Aggregate type
        
        Returns:
            Current stream version
        """
        stream_id = f"{aggregate_type}:{aggregate_id}"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "SELECT current_version FROM streams WHERE stream_id = ?",
                (stream_id,)
            )
            row = cursor.fetchone()
            
            if row:
                return row[0]
            else:
                return 0
    
    def subscribe(
        self,
        event_types: Optional[List[EventType]] = None,
        from_position: Optional[int] = None,
        callback: Optional[Callable[[CanonicalEvent], None]] = None
    ) -> 'EventSubscription':
        """
        Subscribe to events.
        
        Args:
            event_types: Event types to subscribe to (None = all)
            from_position: Start position (None = beginning)
            callback: Callback function for events
        
        Returns:
            Event subscription
        """
        return EventSubscription(
            event_store=self,
            event_types=event_types,
            from_position=from_position,
            callback=callback
        )


class EventSubscription:
    """
    Subscription to event store events.
    """
    
    def __init__(
        self,
        event_store: EventStore,
        event_types: Optional[List[EventType]] = None,
        from_position: Optional[int] = None,
        callback: Optional[Callable[[CanonicalEvent], None]] = None
    ):
        self.event_store = event_store
        self.event_types = event_types
        self.from_position = from_position
        self.callback = callback
        self._last_position = from_position or 0
    
    def poll(self) -> List[CanonicalEvent]:
        """
        Poll for new events.
        
        Returns:
            List of new events
        """
        events = []
        
        with sqlite3.connect(self.event_store.db_path) as conn:
            query = """
                SELECT event_id, event_type, aggregate_id, aggregate_type, event_version,
                       occurred_at, occurred_by, data, metadata, causation_id, correlation_id
                FROM events
                WHERE global_position > ?
            """
            params = [self._last_position]
            
            if self.event_types:
                event_type_values = [et.value for et in self.event_types]
                placeholders = ",".join(["?"] * len(event_type_values))
                query += f" AND event_type IN ({placeholders})"
                params.extend(event_type_values)
            
            query += " ORDER BY global_position ASC"
            
            cursor = conn.execute(query, params)
            
            for row in cursor.fetchall():
                event = CanonicalEvent(
                    event_id=row[0],
                    event_type=EventType(row[1]),
                    aggregate_id=row[2],
                    aggregate_type=row[3],
                    event_version=row[4],
                    occurred_at=row[5],
                    occurred_by=row[6],
                    data=json.loads(row[7]),
                    metadata=json.loads(row[8]),
                    causation_id=row[9],
                    correlation_id=row[10]
                )
                events.append(event)
                
                # Update last position
                cursor = conn.execute(
                    "SELECT global_position FROM events WHERE event_id = ?",
                    (event.event_id,)
                )
                pos_row = cursor.fetchone()
                if pos_row:
                    self._last_position = pos_row[0]
        
        # Call callback if provided
        if self.callback:
            for event in events:
                self.callback(event)
        
        return events


# Singleton instance
_event_store = EventStore()


def get_event_store() -> EventStore:
    """Get the singleton event store."""
    return _event_store
