"""
Mission Execution Context - Mission-specific execution context.

Extends existing ExecutionContext with mission-specific dependencies.
Carries Mission, Goal, Authority, Capability Registry, Object Registry,
CanonicalArtifact references, Event Store, Logger, Cancellation Token, Configuration.
Nothing global.
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, Any
from datetime import datetime


@dataclass(frozen=True)
class MissionExecutionContext:
    """
    Mission-specific execution context.
    
    Carries all dependencies needed for mission execution.
    Simplified version to avoid circular imports.
    """
    
    # Mission-specific data
    mission: Any
    goal: Optional[Any] = None
    
    # Registries (using Any to avoid import issues)
    capability_registry: Any = None
    object_registry: Any = None
    authority_registry: Any = None
    
    # Storage
    event_store: Optional[Any] = None
    artifact_references: Dict[str, str] = field(default_factory=dict)
    
    # Infrastructure
    infrastructure: Optional[Any] = None
    
    # Constitutional policies
    execution: Optional[Any] = None
    
    # Cancellation
    cancellation_token: Optional[str] = None
    cancelled: bool = False
    
    # Configuration
    configuration: Dict[str, Any] = field(default_factory=dict)
    
    # Metadata
    execution_id: str = ""
    started_at: datetime = field(default_factory=datetime.utcnow)
    
    def log_info(self, message: str, **context) -> None:
        """Log info message."""
        print(f"[INFO] {message}")
    
    def log_error(self, message: str, **context) -> None:
        """Log error message."""
        print(f"[ERROR] {message}")
    
    def log_warning(self, message: str, **context) -> None:
        """Log warning message."""
        print(f"[WARNING] {message}")
    
    def log_debug(self, message: str, **context) -> None:
        """Log debug message."""
        print(f"[DEBUG] {message}")
