"""
Event-Sourced Architecture - Events as source of truth.

Instead of:
MissionStore → Events

Flip it:
Events → Mission projections → Artifact projections → Search projections

Corruption recovery:
Delete projections → Replay events → Everything rebuilds automatically.
"""

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List, Callable
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod


@dataclass
class Event:
    """Domain event."""
    event_id: str
    event_type: str
    payload: Dict[str, Any]
    timestamp: str
    stream_position: int
    metadata: Dict[str, Any]


class ProjectionStore:
    """
    Storage for projections.
    
    Projections are read-only views built from events.
    """
    
    def __init__(self, db_path: str = "runtime/event_sourcing/projections.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize_db()
    
    def _initialize_db(self) -> None:
        """Initialize database schema."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        # Mission projections
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mission_projections (
                mission_id TEXT PRIMARY KEY,
                state TEXT,
                created_at TEXT,
                updated_at TEXT,
                completed_at TEXT,
                failed_at TEXT,
                error_message TEXT,
                last_event_position INTEGER,
                payload TEXT
            )
        """)
        
        # Artifact projections
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS artifact_projections (
                artifact_id TEXT PRIMARY KEY,
                mission_id TEXT,
                content_type TEXT,
                size_bytes INTEGER,
                created_at TEXT,
                last_event_position INTEGER,
                metadata TEXT
            )
        """)
        
        # Search projections (for fast queries)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS search_projections (
                doc_id TEXT PRIMARY KEY,
                doc_type TEXT,
                title TEXT,
                content TEXT,
                tags TEXT,
                created_at TEXT,
                last_event_position INTEGER
            )
        """)
        
        # Projection checkpoint (tracks last processed event)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projection_checkpoint (
                projection_name TEXT PRIMARY KEY,
                last_event_position INTEGER DEFAULT 0,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_mission_state ON mission_projections(state)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_artifact_mission ON artifact_projections(mission_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_search_type ON search_projections(doc_type)")
        
        conn.commit()
        conn.close()
    
    def get_checkpoint(self, projection_name: str) -> int:
        """Get last processed event position for projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT last_event_position FROM projection_checkpoint
            WHERE projection_name = ?
        """, (projection_name,))
        
        row = cursor.fetchone()
        conn.close()
        
        return row[0] if row else 0
    
    def set_checkpoint(self, projection_name: str, position: int) -> None:
        """Set last processed event position for projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO projection_checkpoint
            (projection_name, last_event_position, updated_at)
            VALUES (?, ?, ?)
        """, (projection_name, position, datetime.now(timezone.utc).isoformat()))
        
        conn.commit()
        conn.close()
    
    def upsert_mission_projection(self, mission_id: str, projection: Dict[str, Any]) -> None:
        """Upsert mission projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO mission_projections
            (mission_id, state, created_at, updated_at, completed_at, failed_at, error_message, last_event_position, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            mission_id,
            projection.get("state"),
            projection.get("created_at"),
            projection.get("updated_at"),
            projection.get("completed_at"),
            projection.get("failed_at"),
            projection.get("error_message"),
            projection.get("last_event_position"),
            json.dumps(projection.get("payload", {}))
        ))
        
        conn.commit()
        conn.close()
    
    def get_mission_projection(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get mission projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT mission_id, state, created_at, updated_at, completed_at, failed_at, error_message, last_event_position, payload
            FROM mission_projections
            WHERE mission_id = ?
        """, (mission_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "mission_id": row[0],
                "state": row[1],
                "created_at": row[2],
                "updated_at": row[3],
                "completed_at": row[4],
                "failed_at": row[5],
                "error_message": row[6],
                "last_event_position": row[7],
                "payload": json.loads(row[8])
            }
        return None
    
    def upsert_artifact_projection(self, artifact_id: str, projection: Dict[str, Any]) -> None:
        """Upsert artifact projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO artifact_projections
            (artifact_id, mission_id, content_type, size_bytes, created_at, last_event_position, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            artifact_id,
            projection.get("mission_id"),
            projection.get("content_type"),
            projection.get("size_bytes"),
            projection.get("created_at"),
            projection.get("last_event_position"),
            json.dumps(projection.get("metadata", {}))
        ))
        
        conn.commit()
        conn.close()
    
    def get_artifact_projection(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get artifact projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT artifact_id, mission_id, content_type, size_bytes, created_at, last_event_position, metadata
            FROM artifact_projections
            WHERE artifact_id = ?
        """, (artifact_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {
                "artifact_id": row[0],
                "mission_id": row[1],
                "content_type": row[2],
                "size_bytes": row[3],
                "created_at": row[4],
                "last_event_position": row[5],
                "metadata": json.loads(row[6])
            }
        return None
    
    def upsert_search_projection(self, doc_id: str, projection: Dict[str, Any]) -> None:
        """Upsert search projection."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO search_projections
            (doc_id, doc_type, title, content, tags, created_at, last_event_position)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            doc_id,
            projection.get("doc_type"),
            projection.get("title"),
            projection.get("content"),
            json.dumps(projection.get("tags", [])),
            projection.get("created_at"),
            projection.get("last_event_position")
        ))
        
        conn.commit()
        conn.close()
    
    def delete_projection(self, projection_name: str) -> None:
        """Delete a projection (for recovery)."""
        conn = sqlite3.connect(str(self.db_path))
        cursor = conn.cursor()
        
        if projection_name == "missions":
            cursor.execute("DELETE FROM mission_projections")
            cursor.execute("DELETE FROM projection_checkpoint WHERE projection_name = 'missions'")
        elif projection_name == "artifacts":
            cursor.execute("DELETE FROM artifact_projections")
            cursor.execute("DELETE FROM projection_checkpoint WHERE projection_name = 'artifacts'")
        elif projection_name == "search":
            cursor.execute("DELETE FROM search_projections")
            cursor.execute("DELETE FROM projection_checkpoint WHERE projection_name = 'search'")
        elif projection_name == "all":
            cursor.execute("DELETE FROM mission_projections")
            cursor.execute("DELETE FROM artifact_projections")
            cursor.execute("DELETE FROM search_projections")
            cursor.execute("DELETE FROM projection_checkpoint")
        
        conn.commit()
        conn.close()


class EventReader:
    """
    Reads events from the event store.
    """
    
    def __init__(self, event_db_path: str = "hermes/storage/events.db"):
        self.event_db_path = Path(event_db_path)
    
    def get_events_since(self, position: int, limit: int = 1000) -> List[Event]:
        """Get events since given position."""
        if not self.event_db_path.exists():
            return []
        
        conn = sqlite3.connect(str(self.event_db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT event_id, event_type, payload, timestamp, stream_position
            FROM events
            WHERE stream_position > ?
            ORDER BY stream_position ASC
            LIMIT ?
        """, (position, limit))
        
        events = []
        for row in cursor.fetchall():
            events.append(Event(
                event_id=row[0],
                event_type=row[1],
                payload=json.loads(row[2]),
                timestamp=row[3],
                stream_position=row[4],
                metadata={}
            ))
        
        conn.close()
        return events
    
    def get_all_events(self) -> List[Event]:
        """Get all events (for full replay)."""
        if not self.event_db_path.exists():
            return []
        
        conn = sqlite3.connect(str(self.event_db_path))
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT event_id, event_type, payload, timestamp, stream_position
            FROM events
            ORDER BY stream_position ASC
        """)
        
        events = []
        for row in cursor.fetchall():
            events.append(Event(
                event_id=row[0],
                event_type=row[1],
                payload=json.loads(row[2]),
                timestamp=row[3],
                stream_position=row[4],
                metadata={}
            ))
        
        conn.close()
        return events


class ProjectionBuilder(ABC):
    """
    Base class for projection builders.
    """
    
    def __init__(self, projection_store: ProjectionStore, projection_name: str):
        self.projection_store = projection_store
        self.projection_name = projection_name
        self._event_handlers: Dict[str, Callable] = {}
        self._register_handlers()
    
    @abstractmethod
    def _register_handlers(self) -> None:
        """Register event handlers."""
        pass
    
    def register_handler(self, event_type: str, handler: Callable) -> None:
        """Register an event handler."""
        self._event_handlers[event_type] = handler
    
    def process_event(self, event: Event) -> None:
        """Process a single event."""
        handler = self._event_handlers.get(event.event_type)
        if handler:
            handler(event)
    
    def rebuild(self, events: List[Event]) -> None:
        """Rebuild projection from events."""
        # Delete existing projection
        self.projection_store.delete_projection(self.projection_name)
        
        # Process all events
        for event in events:
            self.process_event(event)
        
        # Update checkpoint
        if events:
            last_position = events[-1].stream_position
            self.projection_store.set_checkpoint(self.projection_name, last_position)
    
    def update(self, events: List[Event]) -> None:
        """Update projection with new events."""
        last_position = self.projection_store.get_checkpoint(self.projection_name)
        
        for event in events:
            if event.stream_position > last_position:
                self.process_event(event)
                last_position = event.stream_position
        
        self.projection_store.set_checkpoint(self.projection_name, last_position)


class MissionProjectionBuilder(ProjectionBuilder):
    """
    Builds mission projections from events.
    """
    
    def __init__(self, projection_store: ProjectionStore):
        super().__init__(projection_store, "missions")
        self._missions: Dict[str, Dict[str, Any]] = {}
    
    def _register_handlers(self) -> None:
        """Register mission event handlers."""
        self.register_handler("MissionCreated", self._handle_mission_created)
        self.register_handler("MissionStarted", self._handle_mission_started)
        self.register_handler("MissionCompleted", self._handle_mission_completed)
        self.register_handler("MissionFailed", self._handle_mission_failed)
    
    def _handle_mission_created(self, event: Event) -> None:
        """Handle MissionCreated event."""
        mission_id = event.payload.get("mission_id")
        self._missions[mission_id] = {
            "mission_id": mission_id,
            "state": "created",
            "created_at": event.timestamp,
            "updated_at": event.timestamp,
            "payload": event.payload,
            "last_event_position": event.stream_position
        }
        self.projection_store.upsert_mission_projection(mission_id, self._missions[mission_id])
    
    def _handle_mission_started(self, event: Event) -> None:
        """Handle MissionStarted event."""
        mission_id = event.payload.get("mission_id")
        if mission_id in self._missions:
            self._missions[mission_id]["state"] = "running"
            self._missions[mission_id]["updated_at"] = event.timestamp
            self._missions[mission_id]["last_event_position"] = event.stream_position
            self.projection_store.upsert_mission_projection(mission_id, self._missions[mission_id])
    
    def _handle_mission_completed(self, event: Event) -> None:
        """Handle MissionCompleted event."""
        mission_id = event.payload.get("mission_id")
        if mission_id in self._missions:
            self._missions[mission_id]["state"] = "completed"
            self._missions[mission_id]["updated_at"] = event.timestamp
            self._missions[mission_id]["completed_at"] = event.timestamp
            self._missions[mission_id]["last_event_position"] = event.stream_position
            self.projection_store.upsert_mission_projection(mission_id, self._missions[mission_id])
    
    def _handle_mission_failed(self, event: Event) -> None:
        """Handle MissionFailed event."""
        mission_id = event.payload.get("mission_id")
        if mission_id in self._missions:
            self._missions[mission_id]["state"] = "failed"
            self._missions[mission_id]["updated_at"] = event.timestamp
            self._missions[mission_id]["failed_at"] = event.timestamp
            self._missions[mission_id]["error_message"] = event.payload.get("error")
            self._missions[mission_id]["last_event_position"] = event.stream_position
            self.projection_store.upsert_mission_projection(mission_id, self._missions[mission_id])


class ArtifactProjectionBuilder(ProjectionBuilder):
    """
    Builds artifact projections from events.
    """
    
    def __init__(self, projection_store: ProjectionStore):
        super().__init__(projection_store, "artifacts")
    
    def _register_handlers(self) -> None:
        """Register artifact event handlers."""
        self.register_handler("ArtifactStored", self._handle_artifact_stored)
    
    def _handle_artifact_stored(self, event: Event) -> None:
        """Handle ArtifactStored event."""
        artifact_id = event.payload.get("artifact_id")
        projection = {
            "artifact_id": artifact_id,
            "mission_id": event.payload.get("mission_id"),
            "content_type": event.payload.get("content_type"),
            "size_bytes": event.payload.get("size_bytes", 0),
            "created_at": event.timestamp,
            "last_event_position": event.stream_position,
            "metadata": event.payload.get("metadata", {})
        }
        self.projection_store.upsert_artifact_projection(artifact_id, projection)


class SearchProjectionBuilder(ProjectionBuilder):
    """
    Builds search projections from events.
    """
    
    def __init__(self, projection_store: ProjectionStore):
        super().__init__(projection_store, "search")
    
    def _register_handlers(self) -> None:
        """Register search event handlers."""
        self.register_handler("MissionCreated", self._handle_mission_created)
        self.register_handler("ArtifactStored", self._handle_artifact_stored)
    
    def _handle_mission_created(self, event: Event) -> None:
        """Handle MissionCreated event for search."""
        mission_id = event.payload.get("mission_id")
        projection = {
            "doc_id": f"mission_{mission_id}",
            "doc_type": "mission",
            "title": event.payload.get("title", mission_id),
            "content": event.payload.get("description", ""),
            "tags": [],
            "created_at": event.timestamp,
            "last_event_position": event.stream_position
        }
        self.projection_store.upsert_search_projection(projection["doc_id"], projection)
    
    def _handle_artifact_stored(self, event: Event) -> None:
        """Handle ArtifactStored event for search."""
        artifact_id = event.payload.get("artifact_id")
        projection = {
            "doc_id": f"artifact_{artifact_id}",
            "doc_type": "artifact",
            "title": artifact_id,
            "content": event.payload.get("content_type", ""),
            "tags": event.payload.get("tags", []),
            "created_at": event.timestamp,
            "last_event_position": event.stream_position
        }
        self.projection_store.upsert_search_projection(projection["doc_id"], projection)


class ProjectionManager:
    """
    Manages all projections.
    
    Coordinates building and updating projections from events.
    """
    
    def __init__(self, event_db_path: str = "hermes/storage/events.db"):
        self.event_reader = EventReader(event_db_path)
        self.projection_store = ProjectionStore()
        
        self.mission_builder = MissionProjectionBuilder(self.projection_store)
        self.artifact_builder = ArtifactProjectionBuilder(self.projection_store)
        self.search_builder = SearchProjectionBuilder(self.projection_store)
        
        self._builders = [
            self.mission_builder,
            self.artifact_builder,
            self.search_builder
        ]
    
    def rebuild_all(self) -> None:
        """Rebuild all projections from scratch."""
        events = self.event_reader.get_all_events()
        
        for builder in self._builders:
            builder.rebuild(events)
    
    def update_all(self) -> None:
        """Update all projections with new events."""
        events = self.event_reader.get_events_since(0)
        
        for builder in self._builders:
            builder.update(events)
    
    def get_mission(self, mission_id: str) -> Optional[Dict[str, Any]]:
        """Get mission from projection."""
        return self.projection_store.get_mission_projection(mission_id)
    
    def get_artifact(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        """Get artifact from projection."""
        return self.projection_store.get_artifact_projection(artifact_id)
    
    def search(self, query: str, doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Search projections."""
        conn = sqlite3.connect(str(self.projection_store.db_path))
        cursor = conn.cursor()
        
        if doc_type:
            cursor.execute("""
                SELECT doc_id, doc_type, title, content, tags, created_at
                FROM search_projections
                WHERE doc_type = ?
                AND (title LIKE ? OR content LIKE ?)
                ORDER BY created_at DESC
                LIMIT 100
            """, (doc_type, f"%{query}%", f"%{query}%"))
        else:
            cursor.execute("""
                SELECT doc_id, doc_type, title, content, tags, created_at
                FROM search_projections
                WHERE title LIKE ? OR content LIKE ?
                ORDER BY created_at DESC
                LIMIT 100
            """, (f"%{query}%", f"%{query}%"))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                "doc_id": row[0],
                "doc_type": row[1],
                "title": row[2],
                "content": row[3],
                "tags": json.loads(row[4]),
                "created_at": row[5]
            })
        
        conn.close()
        return results
    
    def recover_corruption(self) -> None:
        """
        Recover from corruption by rebuilding projections.
        
        This is the key benefit of event sourcing:
        Delete projections → Replay events → Everything rebuilds.
        """
        self.projection_store.delete_projection("all")
        self.rebuild_all()
