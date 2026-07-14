from prometheus_client import Counter, Histogram, Gauge
from prometheus_client.exposition import generate_latest
import time
import os
from contextvars import ContextVar


# Context variables for correlation ID and replay ID
correlation_id_var: ContextVar[str | None] = ContextVar('correlation_id', default=None)
replay_id_var: ContextVar[str | None] = ContextVar('replay_id', default=None)


class Observability:
    """Observability metrics and tracing with correlation IDs and replay IDs"""
    
    def __init__(self):
        # Counters
        self.events_total = Counter(
            'constitutional_events_total',
            'Total number of events processed',
            ['event_type', 'event_category', 'correlation_id', 'replay_id']
        )
        self.commands_total = Counter(
            'constitutional_commands_total',
            'Total number of commands processed',
            ['command_type', 'correlation_id', 'replay_id']
        )
        self.http_requests_total = Counter(
            'constitutional_http_requests_total',
            'Total number of HTTP requests',
            ['method', 'endpoint', 'status', 'correlation_id', 'replay_id']
        )
        
        # Histograms (latency)
        self.replay_latency = Histogram(
            'constitutional_replay_latency_seconds',
            'Replay latency in seconds',
            ['replay_type', 'correlation_id', 'replay_id']
        )
        self.projection_latency = Histogram(
            'constitutional_projection_latency_seconds',
            'Projection latency in seconds',
            ['projection_name', 'correlation_id', 'replay_id']
        )
        self.api_latency = Histogram(
            'constitutional_api_latency_seconds',
            'API latency in seconds',
            ['endpoint', 'correlation_id', 'replay_id']
        )
        self.database_latency = Histogram(
            'constitutional_database_latency_seconds',
            'Database latency in seconds',
            ['operation', 'correlation_id', 'replay_id']
        )
        self.nats_latency = Histogram(
            'constitutional_nats_latency_seconds',
            'NATS latency in seconds',
            ['operation', 'correlation_id', 'replay_id']
        )
        
        # Gauges
        self.events_per_second = Gauge(
            'constitutional_events_per_second',
            'Events per second',
            ['correlation_id', 'replay_id']
        )
        self.active_replays = Gauge(
            'constitutional_active_replays',
            'Number of active replays',
            ['replay_id']
        )
        self.database_connections = Gauge(
            'constitutional_database_connections',
            'Number of database connections'
        )
    
    def _get_labels(self) -> dict[str, str]:
        """Get current correlation ID and replay ID labels"""
        correlation_id = correlation_id_var.get() or "none"
        replay_id = replay_id_var.get() or "none"
        return {"correlation_id": correlation_id, "replay_id": replay_id}
    
    def record_event(self, event_type: str, event_category: str) -> None:
        """Record an event with correlation ID and replay ID"""
        labels = self._get_labels()
        self.events_total.labels(
            event_type=event_type,
            event_category=event_category,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).inc()
    
    def record_command(self, command_type: str) -> None:
        """Record a command with correlation ID and replay ID"""
        labels = self._get_labels()
        self.commands_total.labels(
            command_type=command_type,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).inc()
    
    def record_http_request(self, method: str, endpoint: str, status: int) -> None:
        """Record an HTTP request with correlation ID and replay ID"""
        labels = self._get_labels()
        self.http_requests_total.labels(
            method=method,
            endpoint=endpoint,
            status=status,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).inc()
    
    def record_replay_latency(self, replay_type: str, latency: float) -> None:
        """Record replay latency with correlation ID and replay ID"""
        labels = self._get_labels()
        self.replay_latency.labels(
            replay_type=replay_type,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).observe(latency)
    
    def record_projection_latency(self, projection_name: str, latency: float) -> None:
        """Record projection latency with correlation ID and replay ID"""
        labels = self._get_labels()
        self.projection_latency.labels(
            projection_name=projection_name,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).observe(latency)
    
    def record_api_latency(self, endpoint: str, latency: float) -> None:
        """Record API latency with correlation ID and replay ID"""
        labels = self._get_labels()
        self.api_latency.labels(
            endpoint=endpoint,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).observe(latency)
    
    def record_database_latency(self, operation: str, latency: float) -> None:
        """Record database latency with correlation ID and replay ID"""
        labels = self._get_labels()
        self.database_latency.labels(
            operation=operation,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).observe(latency)
    
    def record_nats_latency(self, operation: str, latency: float) -> None:
        """Record NATS latency with correlation ID and replay ID"""
        labels = self._get_labels()
        self.nats_latency.labels(
            operation=operation,
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).observe(latency)
    
    def update_events_per_second(self, rate: float) -> None:
        """Update events per second gauge with correlation ID and replay ID"""
        labels = self._get_labels()
        self.events_per_second.labels(
            correlation_id=labels["correlation_id"],
            replay_id=labels["replay_id"]
        ).set(rate)
    
    def increment_active_replays(self) -> None:
        """Increment active replays gauge with replay ID"""
        replay_id = replay_id_var.get() or "none"
        self.active_replays.labels(replay_id=replay_id).inc()
    
    def decrement_active_replays(self) -> None:
        """Decrement active replays gauge with replay ID"""
        replay_id = replay_id_var.get() or "none"
        self.active_replays.labels(replay_id=replay_id).dec()
    
    def update_database_connections(self, count: int) -> None:
        """Update database connections gauge"""
        self.database_connections.set(count)
    
    def get_metrics(self) -> str:
        """Get Prometheus metrics"""
        return generate_latest()


def set_correlation_id(correlation_id: str) -> None:
    """Set the correlation ID for the current context"""
    correlation_id_var.set(correlation_id)


def set_replay_id(replay_id: str) -> None:
    """Set the replay ID for the current context"""
    replay_id_var.set(replay_id)


def get_correlation_id() -> str | None:
    """Get the current correlation ID"""
    return correlation_id_var.get()


def get_replay_id() -> str | None:
    """Get the current replay ID"""
    return replay_id_var.get()


# Global observability instance
_observability: Observability | None = None


def get_observability() -> Observability:
    """Get or create global observability instance"""
    global _observability
    if _observability is None:
        _observability = Observability()
    return _observability


class LatencyTimer:
    """Context manager for measuring latency"""
    
    def __init__(self, observability: Observability, metric_name: str, **labels):
        self.observability = observability
        self.metric_name = metric_name
        self.labels = labels
        self.start_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        latency = time.time() - self.start_time
        
        if self.metric_name == "replay":
            self.observability.record_replay_latency(
                replay_type=self.labels.get("replay_type", "unknown"),
                latency=latency,
            )
        elif self.metric_name == "projection":
            self.observability.record_projection_latency(
                projection_name=self.labels.get("projection_name", "unknown"),
                latency=latency,
            )
        elif self.metric_name == "api":
            self.observability.record_api_latency(
                endpoint=self.labels.get("endpoint", "unknown"),
                latency=latency,
            )
        elif self.metric_name == "database":
            self.observability.record_database_latency(
                operation=self.labels.get("operation", "unknown"),
                latency=latency,
            )
        elif self.metric_name == "nats":
            self.observability.record_nats_latency(
                operation=self.labels.get("operation", "unknown"),
                latency=latency,
            )
