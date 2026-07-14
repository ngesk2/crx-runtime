"""
PostgreSQL EventStream Implementation

Implements EventStream interface for PostgreSQL.
Replay depends only on EventStream interface, not on database infrastructure.
"""

from typing import AsyncIterator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from kernel.replay.event_stream import EventStream
from constitution.models.event import EventEnvelope
from storage.postgres.models import Event as EventModel


class PostgresEventStream(EventStream):
    """
    PostgreSQL implementation of EventStream interface.
    
    Replay depends on EventStream interface, not on this implementation.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def append(self, event: EventEnvelope) -> None:
        """
        Append an event to the event stream.
        
        Append-only. No updates. No deletes.
        """
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

    async def read(
        self,
        from_sequence: Optional[int] = None,
        to_sequence: Optional[int] = None,
        aggregate_id: Optional[str] = None,
        event_type: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[EventEnvelope]:
        """
        Read events from the event stream.
        
        Returns events in global_sequence order.
        """
        query = select(EventModel)
        
        if from_sequence is not None:
            query = query.where(EventModel.global_sequence >= from_sequence)
        
        if to_sequence is not None:
            query = query.where(EventModel.global_sequence <= to_sequence)
        
        if aggregate_id is not None:
            query = query.where(EventModel.causality_id == aggregate_id)
        
        if event_type is not None:
            query = query.where(EventModel.event_type == event_type)
        
        query = query.order_by(EventModel.global_sequence)
        
        if limit is not None:
            query = query.limit(limit)
        
        result = await self.session.execute(query)
        events = result.scalars().all()
        
        for event_model in events:
            # Convert EventModel to EventEnvelope
            event = EventEnvelope(
                event_id=event_model.event_id,
                event_type=event_model.event_type,
                event_category=event_model.event_category,  # type: ignore
                payload=event_model.payload,
                occurred_at=event_model.occurred_at,
                recorded_at=event_model.recorded_at,
                processed_at=event_model.processed_at,
                correlation_id=event_model.correlation_id,
                causality_id=event_model.causality_id,
                producer_id=event_model.producer_id,
                caused_by_command_id=event_model.caused_by_command_id,
                schema_version=event_model.schema_version,
                global_sequence=event_model.global_sequence,
                aggregate_sequence=event_model.aggregate_sequence,
            )
            yield event

    async def read_by_event_id(self, event_id: str) -> Optional[EventEnvelope]:
        """
        Read a single event by event_id.
        """
        result = await self.session.execute(
            select(EventModel).where(EventModel.event_id == event_id)
        )
        event_model = result.scalar_one_or_none()
        
        if not event_model:
            return None
        
        return EventEnvelope(
            event_id=event_model.event_id,
            event_type=event_model.event_type,
            event_category=event_model.event_category,  # type: ignore
            payload=event_model.payload,
            occurred_at=event_model.occurred_at,
            recorded_at=event_model.recorded_at,
            processed_at=event_model.processed_at,
            correlation_id=event_model.correlation_id,
            causality_id=event_model.causality_id,
            producer_id=event_model.producer_id,
            caused_by_command_id=event_model.caused_by_command_id,
            schema_version=event_model.schema_version,
            global_sequence=event_model.global_sequence,
            aggregate_sequence=event_model.aggregate_sequence,
        )

    async def get_last_global_sequence(self) -> int:
        """
        Get the last global sequence number.
        """
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(func.max(EventModel.global_sequence))
        )
        last_sequence = result.scalar()
        
        return last_sequence if last_sequence is not None else 0

    async def get_aggregate_sequence(self, aggregate_id: str) -> int:
        """
        Get the last sequence number for a specific aggregate.
        """
        from sqlalchemy import func
        
        result = await self.session.execute(
            select(func.max(EventModel.aggregate_sequence)).where(
                EventModel.causality_id == aggregate_id
            )
        )
        last_sequence = result.scalar()
        
        return last_sequence if last_sequence is not None else 0
