"""
PostgreSQL Event Reader Implementation

Implements EventReader interface using SQLAlchemy.
This is the only place that knows about SQLAlchemy models.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select

from storage.repositories.event_reader import EventReader
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
    ) -> List[Dict[str, Any]]:
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
                {
                    "event_id": event.event_id,
                    "event_type": event.event_type,
                    "event_category": event.event_category,
                    "payload": event.decoded_payload_cache,
                    "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
                    "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
                    "global_sequence": event.global_sequence,
                }
                for event in event_records
            ]
    
    async def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get a single event by ID."""
        async with get_session() as session:
            result = await session.execute(
                select(EventModel).where(EventModel.event_id == event_id)
            )
            event = result.scalar_one_or_none()
            
            if not event:
                return None
            
            return {
                "event_id": event.event_id,
                "event_type": event.event_type,
                "event_category": event.event_category,
                "payload": event.decoded_payload_cache,
                "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
                "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
                "global_sequence": event.global_sequence,
            }
    
    async def get_events_by_type(self, event_type: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all events of a specific type."""
        return await self.get_events(event_type=event_type, limit=limit)
    
    async def get_events_by_category(self, event_category: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all events of a specific category."""
        return await self.get_events(event_category=event_category, limit=limit)
    
    async def get_events_in_range(
        self,
        start_time: datetime,
        end_time: datetime,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Get events within a time range."""
        async with get_session() as session:
            query = select(EventModel).where(
                EventModel.occurred_at >= start_time,
                EventModel.occurred_at <= end_time,
            ).order_by(EventModel.global_sequence).limit(limit)
            
            result = await session.execute(query)
            event_records = result.scalars().all()
            
            return [
                {
                    "event_id": event.event_id,
                    "event_type": event.event_type,
                    "event_category": event.event_category,
                    "payload": event.decoded_payload_cache,
                    "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
                    "recorded_at": event.recorded_at.isoformat() if event.recorded_at else None,
                    "global_sequence": event.global_sequence,
                }
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
