from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from storage.postgres.models import Event as EventModel, Snapshot as SnapshotModel, OutboxMessage as OutboxMessageModel
from constitution.models.event import EventEnvelope
from constitution.models.projection import Snapshot
from constitution.authority import CanonicalAuthority


class EventStore:
    """Append-only event store with hash verification"""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def append_event(self, event: EventEnvelope) -> None:
        """Append an event to the event log (append-only, no updates, no deletes)"""
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
        event_type: str | None = None,
    ) -> list[EventModel]:
        """Load events from the event log"""
        query = select(EventModel)
        
        if event_type:
            query = query.where(EventModel.event_type == event_type)
        
        query = query.order_by(EventModel.global_sequence).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def load_stream(
        self,
        aggregate_id: str | None = None,
        correlation_id: str | None = None,
        causality_id: str | None = None,
        from_sequence: int = 0,
        to_sequence: int | None = None,
    ) -> list[EventModel]:
        """Load events from a specific stream"""
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
    
    async def load_all(self) -> list[EventModel]:
        """Load all events from the event log"""
        query = select(EventModel).order_by(EventModel.global_sequence)
        result = await self.session.execute(query)
        return list(result.scalars().all())
    
    async def verify_hash(self, event_id: str) -> bool:
        """Verify that an event's hash matches its content"""
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
        
        # Use CanonicalAuthority
        authority = CanonicalAuthority()
        computed_hash = authority.hash_dict(data)
        
        return computed_hash == event.event_id
    
    async def append_snapshot(self, snapshot: Snapshot) -> None:
        """Append a snapshot (append-only, no updates, no deletes)"""
        # Check if snapshot already exists
        existing = await self.session.execute(
            select(SnapshotModel).where(SnapshotModel.snapshot_id == snapshot.snapshot_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError(f"Snapshot {snapshot.snapshot_id} already exists")
        
        # Create snapshot record
        snapshot_record = SnapshotModel(
            snapshot_id=snapshot.snapshot_id,
            projection_name=snapshot.projection_name,
            projection_version=snapshot.projection_version,
            state=snapshot.state,
            last_event_id=snapshot.last_event_id,
            last_global_sequence=snapshot.last_global_sequence,
        )
        
        self.session.add(snapshot_record)
    
    async def load_latest_snapshot(
        self,
        projection_name: str,
    ) -> SnapshotModel | None:
        """Load the latest snapshot for a projection"""
        query = (
            select(SnapshotModel)
            .where(SnapshotModel.projection_name == projection_name)
            .order_by(SnapshotModel.last_global_sequence.desc())
            .limit(1)
        )
        
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
