"""
Infrastructure Context

Infrastructure execution context containing implementation dependencies.
Separate from constitutional concerns.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any


@dataclass(frozen=True)
class InfrastructureContext:
    """
    Infrastructure execution context.
    
    Contains only implementation dependencies (clock, logger, metrics, etc.).
    Separate from constitutional concerns (policies, modes, versions).
    """
    clock: Any  # Clock interface
    logger: Any  # Logger interface
    metrics: Any  # MetricsCollector interface
    configuration: Any  # ConfigurationProvider interface
    identity_generator: Any  # IdentityGenerator interface
    
    @property
    def now(self) -> datetime:
        """Get current time from clock."""
        return self.clock.now()
    
    @property
    def generate_id(self) -> str:
        """Generate identity."""
        return self.identity_generator.generate()
    
    def log_info(self, message: str, **context):
        """Log info message."""
        self.logger.info(message, context)
    
    def log_error(self, message: str, **context):
        """Log error message."""
        self.logger.error(message, context)
    
    def log_warning(self, message: str, **context):
        """Log warning message."""
        self.logger.warning(message, context)
    
    def log_debug(self, message: str, **context):
        """Log debug message."""
        self.logger.debug(message, context)
    
    def increment_metric(self, name: str, **tags):
        """Increment metric."""
        self.metrics.increment(name, tags)
    
    def gauge_metric(self, name: str, value: float, **tags):
        """Set gauge metric."""
        self.metrics.gauge(name, value, tags)
    
    def timing_metric(self, name: str, value: float, **tags):
        """Set timing metric."""
        self.metrics.timing(name, value, tags)
