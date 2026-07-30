"""
Event Reader Interface

Provides abstraction for reading events without exposing SQLAlchemy.
Application services depend on this interface, not ORM models.
"""

from typing import List, Optional
from abc import ABC, abstractmethod
from datetime import datetime
from dataclasses import dataclass


@dataclass
class CanonicalEvent:
    """Constitutional event representation - persistence-agnostic."""
    event_id: str
    event_type: str
    event_category: str
    schema_version: str
    aggregate_sequence: int
    aggregate_version: int
    stream_version: int
    payload: dict
    event_hash: str
    occurred_at: Optional[datetime] = None
    recorded_at: Optional[datetime] = None
    global_sequence: Optional[int] = None


class EventReader(ABC):
    """Interface for reading constitutional events."""
    
    @abstractmethod
    async def get_events(
        self,
        event_type: Optional[str] = None,
        event_category: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[CanonicalEvent]:
        """
        Get events with optional filtering.
        
        Returns list of CanonicalEvent objects.
        """
        pass
    
    @abstractmethod
    async def get_event_by_id(self, event_id: str) -> Optional[CanonicalEvent]:
        """Get a single event by ID."""
        pass
    
    @abstractmethod
    async def get_events_by_type(self, event_type: str, limit: int = 1000) -> List[CanonicalEvent]:
        """Get all events of a specific type."""
        pass
    
    @abstractmethod
    async def get_events_by_category(self, event_category: str, limit: int = 1000) -> List[CanonicalEvent]:
        """Get all events of a specific category."""
        pass
    
    @abstractmethod
    async def get_events_in_range(
        self,
        start_time: datetime,
        end_time: datetime,
        limit: int = 1000,
    ) -> List[CanonicalEvent]:
        """Get events within a time range."""
        pass
    
    @abstractmethod
    async def count_events(self, event_type: Optional[str] = None) -> int:
        """Count events with optional filtering."""
        pass
    
    @abstractmethod
    async def load_all(self) -> List[CanonicalEvent]:
        """Load all events in global sequence order."""
        pass
