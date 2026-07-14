"""
Runtime Context

Immutable execution context containing all runtime dependencies.
Every handler receives (ctx, event) instead of individual parameters.

Composes ExecutionContext (constitutional) and InfrastructureContext (implementation).
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from constitution.authority import CanonicalAuthority
from runtime.execution_context import ExecutionContext
from runtime.infrastructure_context import InfrastructureContext


@dataclass(frozen=True)
class RuntimeContext:
    """
    Immutable execution context containing all runtime dependencies.
    
    Every handler receives (ctx, event) instead of individual parameters.
    Composes ExecutionContext (constitutional) and InfrastructureContext (implementation).
    """
    execution: ExecutionContext
    infrastructure: InfrastructureContext
    constitutional_authority: CanonicalAuthority
    
    # Convenience properties for backward compatibility
    @property
    def clock(self) -> Any:
        """Get clock from infrastructure context."""
        return self.infrastructure.clock
    
    @property
    def logger(self) -> Any:
        """Get logger from infrastructure context."""
        return self.infrastructure.logger
    
    @property
    def metrics(self) -> Any:
        """Get metrics from infrastructure context."""
        return self.infrastructure.metrics
    
    @property
    def configuration(self) -> Any:
        """Get configuration from infrastructure context."""
        return self.infrastructure.configuration
    
    @property
    def identity_generator(self) -> Any:
        """Get identity generator from infrastructure context."""
        return self.infrastructure.identity_generator
    
    # Constitutional policies
    @property
    def replay_mode(self):
        """Get replay mode from execution context."""
        return self.execution.replay_mode
    
    @property
    def execution_id(self) -> str:
        """Get execution ID from execution context."""
        return self.execution.execution_id
    
    @property
    def determinism_mode(self):
        """Get determinism mode from execution context."""
        return self.execution.determinism_mode
    
    @property
    def replay_epoch(self) -> int:
        """Get replay epoch from execution context."""
        return self.execution.replay_epoch
    
    @property
    def authority_version(self) -> str:
        """Get authority version from execution context."""
        return self.execution.authority_version
    
    @property
    def kernel_version(self) -> str:
        """Get kernel version from execution context."""
        return self.execution.kernel_version
    
    @property
    def witness_version(self) -> str:
        """Get witness version from execution context."""
        return self.execution.witness_version
    
    @property
    def failure_policy(self):
        """Get failure policy from execution context."""
        return self.execution.failure_policy
    
    @property
    def clock_policy(self):
        """Get clock policy from execution context."""
        return self.execution.clock_policy
    
    @property
    def hash_policy(self):
        """Get hash policy from execution context."""
        return self.execution.hash_policy
    
    @property
    def encoding_policy(self):
        """Get encoding policy from execution context."""
        return self.execution.encoding_policy
    
    # Convenience methods from infrastructure context
    @property
    def now(self) -> datetime:
        """Get current time from clock."""
        return self.infrastructure.now
    
    @property
    def generate_id(self) -> str:
        """Generate identity."""
        return self.infrastructure.generate_id
    
    def log_info(self, message: str, **context):
        """Log info message."""
        self.infrastructure.log_info(message, **context)
    
    def log_error(self, message: str, **context):
        """Log error message."""
        self.infrastructure.log_error(message, **context)
    
    def log_warning(self, message: str, **context):
        """Log warning message."""
        self.infrastructure.log_warning(message, **context)
    
    def log_debug(self, message: str, **context):
        """Log debug message."""
        self.infrastructure.log_debug(message, **context)
    
    def increment_metric(self, name: str, **tags):
        """Increment metric."""
        self.infrastructure.increment_metric(name, **tags)
    
    def gauge_metric(self, name: str, value: float, **tags):
        """Set gauge metric."""
        self.infrastructure.gauge_metric(name, value, **tags)
    
    def timing_metric(self, name: str, value: float, **tags):
        """Set timing metric."""
        self.infrastructure.timing_metric(name, value, **tags)
