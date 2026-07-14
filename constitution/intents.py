"""
Constitutional Intents

Intent objects for infrastructure operations.
Kernel emits intents, adapters execute them.
"""

from dataclasses import dataclass
from typing import Any
from constitution.models.event import EventEnvelope


@dataclass(frozen=True)
class PersistenceIntent:
    """
    Intent to persist events.
    
    Constitutional artifact - infrastructure adapter executes this intent.
    """
    events: list[EventEnvelope]
    metadata: dict[str, Any]
    
    def __post_init__(self):
        if not self.events:
            raise ValueError("PersistenceIntent must contain at least one event")


@dataclass(frozen=True)
class PublicationIntent:
    """
    Intent to publish events.
    
    Constitutional artifact - infrastructure adapter executes this intent.
    """
    events: list[EventEnvelope]
    topics: list[str]
    metadata: dict[str, Any]
    
    def __post_init__(self):
        if not self.events:
            raise ValueError("PublicationIntent must contain at least one event")
        if len(self.events) != len(self.topics):
            raise ValueError("PublicationIntent must have one topic per event")
