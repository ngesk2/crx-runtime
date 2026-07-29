"""Metric Events

Replayable metric events for constitutional metrics.

Architecture:
MetricEvent
  ↓
MetricsReducer
  ↓
ProviderMetrics

This makes metrics replayable exactly like artifacts.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any


class MetricEventType(Enum):
    """Types of metric events"""
    SUCCESS = "success"
    FAILURE = "failure"
    REQUEST = "request"


@dataclass(frozen=True)
class MetricEvent:
    """
    Immutable metric event.
    
    Represents a single metric event that can be replayed.
    
    Contains:
    - event_type (type of metric event)
    - timestamp (when the event occurred)
    - latency_ms (latency in milliseconds, for success events)
    - metadata (additional event metadata)
    """
    event_type: MetricEventType
    timestamp: datetime
    latency_ms: float | None = None
    metadata: dict[str, Any] | None = None
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary"""
        return {
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "latency_ms": self.latency_ms,
            "metadata": self.metadata,
        }


class MetricsReducer:
    """
    Reduces metric events into ProviderMetrics.
    
    Architecture:
    MetricEvent → MetricsReducer → ProviderMetrics
    
    This makes metrics replayable exactly like artifacts.
    """
    
    def __init__(self):
        self._total_requests: int = 0
        self._successful_requests: int = 0
        self._failed_requests: int = 0
        self._last_request_at: datetime | None = None
        self._last_success_at: datetime | None = None
        self._last_failure_at: datetime | None = None
        self._total_latency: float = 0.0
    
    def reduce(self, event: MetricEvent) -> None:
        """
        Reduce a metric event into metrics state.
        
        Args:
            event: Metric event to reduce
        """
        self._total_requests += 1
        self._last_request_at = event.timestamp
        
        if event.event_type == MetricEventType.SUCCESS:
            self._successful_requests += 1
            self._last_success_at = event.timestamp
            if event.latency_ms is not None:
                self._total_latency += event.latency_ms
        elif event.event_type == MetricEventType.FAILURE:
            self._failed_requests += 1
            self._last_failure_at = event.timestamp
    
    def get_metrics(self) -> dict[str, Any]:
        """
        Get current metrics state.
        
        Returns:
            Dictionary of current metrics
        """
        average_latency = 0.0
        if self._successful_requests > 0:
            average_latency = self._total_latency / self._successful_requests
        
        return {
            "total_requests": self._total_requests,
            "successful_requests": self._successful_requests,
            "failed_requests": self._failed_requests,
            "last_request_at": self._last_request_at.isoformat() if self._last_request_at else None,
            "last_success_at": self._last_success_at.isoformat() if self._last_success_at else None,
            "last_failure_at": self._last_failure_at.isoformat() if self._last_failure_at else None,
            "average_latency_ms": average_latency,
        }
    
    def get_success_rate(self) -> float:
        """Calculate success rate"""
        if self._total_requests == 0:
            return 1.0
        return self._successful_requests / self._total_requests
    
    def reset(self) -> None:
        """Reset metrics state"""
        self._total_requests = 0
        self._successful_requests = 0
        self._failed_requests = 0
        self._last_request_at = None
        self._last_success_at = None
        self._last_failure_at = None
        self._total_latency = 0.0
    
    @classmethod
    def replay_events(cls, events: list[MetricEvent]) -> dict[str, Any]:
        """
        Replay metric events to reconstruct metrics state.
        
        Args:
            events: List of metric events to replay
        
        Returns:
            Reconstructed metrics state
        """
        reducer = cls()
        for event in events:
            reducer.reduce(event)
        return reducer.get_metrics()
