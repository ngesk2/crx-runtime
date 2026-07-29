"""
Event Reader Interface

Provides abstraction for reading events without exposing SQLAlchemy.
Application services depend on this interface, not ORM models.
"""

from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime


class EventReader(ABC):
    """Interface for reading constitutional events."""
    
    @abstractmethod
    async def get_events(
        self,
        event_type: Optional[str] = None,
        event_category: Optional[str] = None,
        limit: int = 1000,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Get events with optional filtering.
        
        Returns list of event dictionaries with keys:
        - event_id
        - event_type
        - event_category
        - payload
        - occurred_at
        - recorded_at
        - global_sequence
        """
        pass
    
    @abstractmethod
    async def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get a single event by ID."""
        pass
    
    @abstractmethod
    async def get_events_by_type(self, event_type: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all events of a specific type."""
        pass
    
    @abstractmethod
    async def get_events_by_category(self, event_category: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get all events of a specific category."""
        pass
    
    @abstractmethod
    async def get_events_in_range(
        self,
        start_time: datetime,
        end_time: datetime,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Get events within a time range."""
        pass
    
    @abstractmethod
    async def count_events(self, event_type: Optional[str] = None) -> int:
        """Count events with optional filtering."""
        pass
