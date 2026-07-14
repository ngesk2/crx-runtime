"""
EventStream Interface

Replay must never depend on:
- SQLAlchemy
- AsyncSession
- EventModel
- PostgreSQL
- ORM

ReplayKernel, ReplayExecutor, ReplayVerifier, ReplayWitness must depend only on EventStream.

Postgres becomes one implementation.
Future implementations: FoundationDB, Files, Memory, S3, Simulation must all satisfy the same interface.
"""

from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from constitution.models.event import EventEnvelope


class EventStream(ABC):
    """
    Abstract event stream interface.
    
    Replay depends only on this interface, not on database infrastructure.
    """

    @abstractmethod
    async def append(self, event: EventEnvelope) -> None:
        """
        Append an event to the event stream.
        
        Append-only. No updates. No deletes.
        """
        pass

    @abstractmethod
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
        pass

    @abstractmethod
    async def read_by_event_id(self, event_id: str) -> Optional[EventEnvelope]:
        """
        Read a single event by event_id.
        """
        pass

    @abstractmethod
    async def get_last_global_sequence(self) -> int:
        """
        Get the last global sequence number.
        """
        pass

    @abstractmethod
    async def get_aggregate_sequence(self, aggregate_id: str) -> int:
        """
        Get the last sequence number for a specific aggregate.
        """
        pass
