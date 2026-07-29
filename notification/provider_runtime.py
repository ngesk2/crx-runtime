"""Provider Runtime

Split into immutable descriptor and mutable runtime state.

Architecture:
ProviderDescriptor (immutable)
  ↓
ProviderRuntimeState (mutable)
  ↓
ProviderRuntimeView (combined view)

This separation ensures replay doesn't accidentally include runtime state.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from notification.capability_resolver import CapabilityId
from notification.provider_descriptor import ProviderDescriptor, ProviderAvailability, ProviderPriority


@dataclass(frozen=True)
class ProviderMetrics:
    """
    Immutable metrics snapshot for provider runtime.
    
    Replay likes immutable state - metrics are snapshots, not mutable counters.
    """
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    last_request_at: datetime | None = None
    last_success_at: datetime | None = None
    last_failure_at: datetime | None = None
    average_latency_ms: float = 0.0
    
    def get_success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_requests == 0:
            return 1.0
        return self.successful_requests / self.total_requests


class MetricsRecorder:
    """
    Records metric events and produces immutable metric snapshots.
    
    Architecture:
    MetricsRecorder
      ↓
      record_success()
      ↓
      new ProviderMetrics
    
    This ensures replay can reconstruct metrics from event history.
    """
    
    def __init__(self, initial_metrics: ProviderMetrics = ProviderMetrics()):
        self._current_metrics = initial_metrics
    
    def record_success(self, latency_ms: float) -> ProviderMetrics:
        """
        Record a successful request and return new metrics snapshot.
        
        Returns new immutable ProviderMetrics instead of mutating state.
        """
        new_total = self._current_metrics.total_requests + 1
        new_successful = self._current_metrics.successful_requests + 1
        now = datetime.utcnow()
        
        # Update average latency
        if new_total > 0:
            new_average = (
                (self._current_metrics.average_latency_ms * (new_total - 1) + latency_ms) /
                new_total
            )
        else:
            new_average = latency_ms
        
        new_metrics = ProviderMetrics(
            total_requests=new_total,
            successful_requests=new_successful,
            failed_requests=self._current_metrics.failed_requests,
            last_request_at=now,
            last_success_at=now,
            last_failure_at=self._current_metrics.last_failure_at,
            average_latency_ms=new_average,
        )
        
        self._current_metrics = new_metrics
        return new_metrics
    
    def record_failure(self) -> ProviderMetrics:
        """
        Record a failed request and return new metrics snapshot.
        
        Returns new immutable ProviderMetrics instead of mutating state.
        """
        new_total = self._current_metrics.total_requests + 1
        new_failed = self._current_metrics.failed_requests + 1
        now = datetime.utcnow()
        
        new_metrics = ProviderMetrics(
            total_requests=new_total,
            successful_requests=self._current_metrics.successful_requests,
            failed_requests=new_failed,
            last_request_at=now,
            last_success_at=self._current_metrics.last_success_at,
            last_failure_at=now,
            average_latency_ms=self._current_metrics.average_latency_ms,
        )
        
        self._current_metrics = new_metrics
        return new_metrics
    
    def get_current_metrics(self) -> ProviderMetrics:
        """Get current metrics snapshot"""
        return self._current_metrics


@dataclass
class ProviderRuntimeState:
    """
    Mutable runtime state for provider.
    
    Contains:
    - Metrics recorder (produces immutable snapshots)
    - Current availability (mutable)
    
    This is separate from ProviderDescriptor (immutable) to ensure
    replay doesn't accidentally include runtime state.
    """
    metrics_recorder: MetricsRecorder = field(default_factory=MetricsRecorder)
    current_availability: ProviderAvailability = ProviderAvailability.AVAILABLE
    
    @property
    def metrics(self) -> ProviderMetrics:
        """Get current metrics snapshot (immutable)"""
        return self.metrics_recorder.get_current_metrics()
    
    def record_success(self, latency_ms: float) -> ProviderMetrics:
        """Record a successful request and return new metrics snapshot"""
        return self.metrics_recorder.record_success(latency_ms)
    
    def record_failure(self) -> ProviderMetrics:
        """Record a failed request and return new metrics snapshot"""
        return self.metrics_recorder.record_failure()
    
    def get_success_rate(self) -> float:
        """Calculate success rate"""
        return self.metrics.get_success_rate()
    
    def update_availability(self, availability: ProviderAvailability) -> None:
        """Update availability status (mutable)"""
        self.current_availability = availability


@dataclass
class ProviderRuntimeView:
    """
    Combined view of immutable descriptor and mutable runtime state.
    
    Provides a unified interface while maintaining separation of concerns.
    """
    descriptor: ProviderDescriptor
    adapter: "NotificationProvider"
    state: ProviderRuntimeState = field(default_factory=ProviderRuntimeState)
    
    @property
    def name(self) -> str:
        return self.descriptor.name
    
    @property
    def capabilities(self) -> list[CapabilityId]:
        """Get capabilities as CapabilityId objects"""
        return [CapabilityId(value=cap) for cap in self.descriptor.capabilities]
    
    @property
    def availability(self) -> ProviderAvailability:
        """Get current availability (from mutable state)"""
        return self.state.current_availability
    
    @property
    def priority(self) -> ProviderPriority:
        return self.descriptor.priority
    
    @property
    def metrics(self) -> ProviderMetrics:
        """Get metrics (from mutable state)"""
        return self.state.metrics
    
    def is_available(self) -> bool:
        """Check if provider is available"""
        return self.state.current_availability == ProviderAvailability.AVAILABLE
    
    def supports_capability(self, capability_id: CapabilityId) -> bool:
        """Check if provider supports a specific capability"""
        return capability_id.value in self.descriptor.capabilities
    
    def record_success(self, latency_ms: float) -> None:
        """Record a successful request (delegates to state)"""
        self.state.record_success(latency_ms)
    
    def record_failure(self) -> None:
        """Record a failed request (delegates to state)"""
        self.state.record_failure()
    
    def get_success_rate(self) -> float:
        """Calculate success rate (delegates to state)"""
        return self.state.get_success_rate()
    
    def update_availability(self, availability: ProviderAvailability) -> None:
        """Update availability status (delegates to state)"""
        self.state.update_availability(availability)


