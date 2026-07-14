"""
Repository interfaces for data access abstraction.

Phase 15 Item 4: Introduce Repository Interfaces - EventRepository, PostgresRepository abstraction.

This is infrastructure only - no constitutional code changes.
"""

from abc import ABC, abstractmethod
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from storage.postgres.models import Event as EventModel, Snapshot as SnapshotModel
from constitution.models.event import EventEnvelope
from constitution.models.projection import Snapshot


class EventRepository(ABC):
    """
    Abstract event repository interface.
    
    Constitutional: This interface preserves constitutional semantics (append-only, ordering).
    Implementation is infrastructure-specific.
    """
    
    @abstractmethod
    async def append_event(self, event: EventEnvelope) -> None:
        """Append an event to the event log (append-only, no updates, no deletes)"""
        pass
    
    @abstractmethod
    async def load_events(
        self,
        limit: int = 100,
        offset: int = 0,
        event_type: Optional[str] = None,
    ) -> List[EventModel]:
        """Load events from the event log"""
        pass
    
    @abstractmethod
    async def load_stream(
        self,
        aggregate_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        causality_id: Optional[str] = None,
        from_sequence: int = 0,
        to_sequence: Optional[int] = None,
    ) -> List[EventModel]:
        """Load events from a specific stream"""
        pass
    
    @abstractmethod
    async def load_all(self) -> List[EventModel]:
        """Load all events from the event log"""
        pass
    
    @abstractmethod
    async def verify_hash(self, event_id: str) -> bool:
        """Verify that an event's hash matches its content"""
        pass


class PostgresEventRepository(EventRepository):
    """
    PostgreSQL implementation of EventRepository.
    
    Infrastructure only - no constitutional code changes.
    """
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def append_event(self, event: EventEnvelope) -> None:
        """Append an event to the event log (append-only, no updates, no deletes)"""
        from sqlalchemy import select
        from storage.postgres.models import OutboxMessage as OutboxMessageModel
        
        # Check if event already exists
        existing = await self.session.execute(
            select(EventModel).where(EventModel.event_id == event.event_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Event {event.event_id} already exists")
        
        # Create event record
        event_record = EventModel(
            event_id=event.event_id,
            event_type=event.event_type,
            event_category=event.event_category,
            payload=event.payload,
            occurred_at=event.occurred_at,
            recorded_at=event.recorded_at,
            processed_at=event.processed_at,
            correlation_id=event.correlation_id,
            causality_id=event.causality_id,
            producer_id=event.producer_id,
            caused_by_command_id=event.caused_by_command_id,
            schema_version=event.schema_version,
            global_sequence=event.global_sequence,
            aggregate_sequence=event.aggregate_sequence,
            event_hash=event.event_id,  # For now, same as event_id
        )
        
        self.session.add(event_record)
        
        # Add to outbox for NATS publication (transactional outbox pattern)
        outbox_record = OutboxMessageModel(
            topic=f"constitutional.events.{event.event_type}",
            payload=event.model_dump(mode='json'),
            correlation_id=event.correlation_id,
        )
        self.session.add(outbox_record)
    
    async def load_events(
        self,
        limit: int = 100,
        offset: int = 0,
        event_type: Optional[str] = None,
    ) -> List[EventModel]:
        """Load events from the event log"""
        from sqlalchemy import select
        
        query = select(EventModel)
        
        if event_type:
            query = query.where(EventModel.event_type == event_type)
        
        query = query.order_by(EventModel.global_sequence).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def load_stream(
        self,
        aggregate_id: Optional[str] = None,
        correlation_id: Optional[str] = None,
        causality_id: Optional[str] = None,
        from_sequence: int = 0,
        to_sequence: Optional[int] = None,
    ) -> List[EventModel]:
        """Load events from a specific stream"""
        from sqlalchemy import select
        
        query = select(EventModel).where(EventModel.global_sequence >= from_sequence)
        
        if aggregate_id:
            # For now, we'll filter by causality_id which points to aggregate
            query = query.where(EventModel.causality_id == aggregate_id)
        
        if correlation_id:
            query = query.where(EventModel.correlation_id == correlation_id)
        
        if causality_id:
            query = query.where(EventModel.causality_id == causality_id)
        
        if to_sequence:
            query = query.where(EventModel.global_sequence <= to_sequence)
        
        query = query.order_by(EventModel.global_sequence)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def load_all(self) -> List[EventModel]:
        """Load all events from the event log"""
        from sqlalchemy import select
        
        query = select(EventModel).order_by(EventModel.global_sequence)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def verify_hash(self, event_id: str) -> bool:
        """Verify that an event's hash matches its content"""
        from sqlalchemy import select
        from constitution.hashing import CanonicalHasher
        
        event = await self.session.execute(
            select(EventModel).where(EventModel.event_id == event_id)
        )
        event = event.scalar_one_or_none()
        
        if not event:
            return False
        
        # Recompute hash from event data
        data = {
            'event_type': event.event_type,
            'event_category': event.event_category,
            'occurred_at': event.occurred_at.isoformat(),
            'recorded_at': event.recorded_at.isoformat(),
            'processed_at': event.processed_at.isoformat() if event.processed_at else None,
            'correlation_id': event.correlation_id,
            'causality_id': event.causality_id,
            'producer_id': event.producer_id,
            'caused_by_command_id': event.caused_by_command_id,
            'schema_version': event.schema_version,
            'global_sequence': event.global_sequence,
            'aggregate_sequence': event.aggregate_sequence,
            'payload': event.payload,
        }
        
        # Use CanonicalHasher
        computed_hash = CanonicalHasher.hash_dict(data)
        
        return computed_hash == event.event_id
