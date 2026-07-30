"""
PostgreSQL Event Reader Implementation

Implements EventReader interface using SQLAlchemy.
This is the only place that knows about SQLAlchemy models.
"""

from typing import List, Optional
from datetime import datetime
from sqlalchemy import select

from storage.repositories.event_reader import EventReader, CanonicalEvent
from storage.postgres.database import get_session
from storage.postgres.models import Event as EventModel


class PostgresEventReader(EventReader):
    """PostgreSQL implementation of EventReader."""
    
    async def get_events(
        self,
        event_type: Optional[str] = None,
        event_category: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[CanonicalEvent]:
        """Get events with optional filtering."""
        async with get_session() as session:
            query = select(EventModel).order_by(EventModel.global_sequence)
            
            if event_type:
                query = query.where(EventModel.event_type == event_type)
            
            if event_category:
                query = query.where(EventModel.event_category == event_category)
            
            query = query.offset(offset).limit(limit)
            
            result = await session.execute(query)
            event_records = result.scalars().all()
            
            return [
                CanonicalEvent(
                    event_id=event.event_id,
                    event_type=event.event_type,
                    event_category=event.event_category,
                    schema_version=event.schema_version,
                    aggregate_sequence=event.aggregate_sequence,
                    aggregate_version=event.aggregate_version,
                    stream_version=event.stream_version,
                    payload=event.decoded_payload_cache,
                    event_hash=event.event_hash,
                    occurred_at=event.occurred_at,
                    recorded_at=event.recorded_at,
                    global_sequence=event.global_sequence,
                )
                for event in event_records
            ]
    
    async def get_event_by_id(self, event_id: str) -> Optional[CanonicalEvent]:
        """Get a single event by ID."""
        async with get_session() as session:
            result = await session.execute(
                select(EventModel).where(EventModel.event_id == event_id)
            )
            event = result.scalar_one_or_none()
            
            if not event:
                return None
            
            return CanonicalEvent(
                event_id=event.event_id,
                event_type=event.event_type,
                event_category=event.event_category,
                schema_version=event.schema_version,
                aggregate_sequence=event.aggregate_sequence,
                aggregate_version=event.aggregate_version,
                stream_version=event.stream_version,
                payload=event.decoded_payload_cache,
                event_hash=event.event_hash,
                occurred_at=event.occurred_at,
                recorded_at=event.recorded_at,
                global_sequence=event.global_sequence,
            )
    
    async def get_events_by_type(self, event_type: str, limit: int = 1000) -> List[CanonicalEvent]:
        """Get all events of a specific type."""
        return await self.get_events(event_type=event_type, limit=limit)
    
    async def get_events_by_category(self, event_category: str, limit: int = 1000) -> List[CanonicalEvent]:
        """Get all events of a specific category."""
        return await self.get_events(event_category=event_category, limit=limit)
    
    async def get_events_in_range(
        self,
        start_time: datetime,
        end_time: datetime,
        limit: int = 1000,
    ) -> List[CanonicalEvent]:
        """Get events within a time range."""
        async with get_session() as session:
            query = select(EventModel).where(
                EventModel.occurred_at >= start_time,
                EventModel.occurred_at <= end_time,
            ).order_by(EventModel.global_sequence).limit(limit)
            
            result = await session.execute(query)
            event_records = result.scalars().all()
            
            return [
                CanonicalEvent(
                    event_id=event.event_id,
                    event_type=event.event_type,
                    event_category=event.event_category,
                    schema_version=event.schema_version,
                    aggregate_sequence=event.aggregate_sequence,
                    aggregate_version=event.aggregate_version,
                    stream_version=event.stream_version,
                    payload=event.decoded_payload_cache,
                    event_hash=event.event_hash,
                    occurred_at=event.occurred_at,
                    recorded_at=event.recorded_at,
                    global_sequence=event.global_sequence,
                )
                for event in event_records
            ]
    
    async def count_events(self, event_type: Optional[str] = None) -> int:
        """Count events with optional filtering."""
        async with get_session() as session:
            from sqlalchemy import func
            
            query = select(func.count()).select_from(EventModel)
            
            if event_type:
                query = query.where(EventModel.event_type == event_type)
            
            result = await session.execute(query)
            return result.scalar() or 0
    
    async def load_all(self) -> List[CanonicalEvent]:
        """Load all events in global sequence order."""
        async with get_session() as session:
            result = await session.execute(
                select(EventModel).order_by(EventModel.global_sequence)
            )
            event_records = result.scalars().all()
            
            return [
                CanonicalEvent(
                    event_id=event.event_id,
                    event_type=event.event_type,
                    event_category=event.event_category,
                    schema_version=event.schema_version,
                    aggregate_sequence=event.aggregate_sequence,
                    aggregate_version=event.aggregate_version,
                    stream_version=event.stream_version,
                    payload=event.decoded_payload_cache,
                    event_hash=event.event_hash,
                    occurred_at=event.occurred_at,
                    recorded_at=event.recorded_at,
                    global_sequence=event.global_sequence,
                )
                for event in event_records
            ]
