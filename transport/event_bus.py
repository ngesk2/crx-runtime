from datetime import datetime
from typing import Any, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from storage.postgres.models import Event as EventModel
from storage.event_store import EventStore
from transport.nats.client import NATSClient


class EventBus:
    """
    EventBus as a projection over the canonical event log.
    
    The event log is the single source of truth. The EventBus projects
    events from the event log to NATS for downstream consumers.
    """
    
    def __init__(self, session: AsyncSession, nats_client: NATSClient):
        self.session = session
        self.event_store = EventStore(session)
        self.nats_client = nats_client
        self._last_published_sequence = 0
    
    async def project_event_to_nats(self, event: EventModel) -> None:
        """Project a single event from the event log to NATS"""
        # Convert event to dict
        event_dict = {
            "event_id": event.event_id,
            "event_type": event.event_type,
            "event_category": event.event_category,
            "payload": event.payload,
            "occurred_at": event.occurred_at.isoformat(),
            "recorded_at": event.recorded_at.isoformat(),
            "processed_at": event.processed_at.isoformat() if event.processed_at else None,
            "correlation_id": event.correlation_id,
            "causality_id": event.causality_id,
            "producer_id": event.producer_id,
            "caused_by_command_id": event.caused_by_command_id,
            "schema_version": event.schema_version,
            "global_sequence": event.global_sequence,
            "aggregate_sequence": event.aggregate_sequence,
        }
        
        # Publish to NATS
        await self.nats_client.publish_event(event_dict)
        
        # Update last published sequence
        self._last_published_sequence = event.global_sequence
    
    async def project_new_events(self) -> int:
        """
        Project all new events from the event log to NATS.
        
        This is the projection function: reads from event log (source of truth)
        and projects to NATS (derived view).
        """
        # Load events after last published sequence
        events = await self.event_store.load_stream(
            from_sequence=self._last_published_sequence + 1,
        )
        
        # Project each event to NATS
        for event in events:
            await self.project_event_to_nats(event)
        
        return len(events)
    
    async def project_from_sequence(self, from_sequence: int) -> int:
        """Project events from a specific sequence number"""
        # Load events from sequence
        events = await self.event_store.load_stream(
            from_sequence=from_sequence,
        )
        
        # Project each event to NATS
        for event in events:
            await self.project_event_to_nats(event)
        
        return len(events)
    
    async def project_all(self) -> int:
        """Project all events from the event log to NATS (full rebuild)"""
        # Load all events
        events = await self.event_store.load_all()
        
        # Project each event to NATS
        for event in events:
            await self.project_event_to_nats(event)
        
        return len(events)
    
    async def get_last_published_sequence(self) -> int:
        """Get the last published sequence number"""
        return self._last_published_sequence
    
    async def set_last_published_sequence(self, sequence: int) -> None:
        """Set the last published sequence number (for recovery)"""
        self._last_published_sequence = sequence


class OutboxProcessor:
    """
    Process outbox messages for transactional publishing.
    
    The outbox pattern ensures that event persistence and NATS publication
    are coordinated within the same transaction.
    """
    
    def __init__(self, session: AsyncSession, nats_client: NATSClient):
        self.session = session
        self.nats_client = nats_client
    
    async def process_outbox(self, batch_size: int = 100) -> int:
        """
        Process unprocessed outbox messages.
        
        This ensures that events persisted to the database are eventually
        published to NATS, even if the original transaction succeeded but
        the NATS publication failed.
        """
        from sqlalchemy import select
        from storage.postgres.models import OutboxMessage as OutboxMessageModel
        
        # Load unprocessed outbox messages
        query = (
            select(OutboxMessageModel)
            .where(OutboxMessageModel.processed == False)
            .order_by(OutboxMessageModel.created_at)
            .limit(batch_size)
        )
        
        result = await self.session.execute(query)
        messages = result.scalars().all()
        
        # Process each message
        for message in messages:
            try:
                # Publish to NATS
                await self.nats_client.publish_event(message.payload)
                
                # Mark as processed
                message.processed = True
                message.processed_at = datetime.utcnow()
                
            except Exception as e:
                # Mark as failed (could add retry logic here)
                message.processed = True
                message.processed_at = datetime.utcnow()
                # TODO: Add error tracking
        
        await self.session.commit()
        
        return len(messages)
