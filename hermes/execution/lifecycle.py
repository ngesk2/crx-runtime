"""
Runtime State - Runtime lifecycle management.

Responsibilities:
- runtime lifecycle (starting, running, stopping, stopped)
- health
- uptime
- mission count
- active lease
"""

from enum import Enum
from datetime import datetime
from dataclasses import dataclass
from typing import Optional


class RuntimeLifecycle(Enum):
    """Runtime lifecycle states."""
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"


@dataclass
class RuntimeState:
    """
    Runtime state management.
    
    Tracks runtime lifecycle, health, uptime, mission count, and active lease.
    """
    
    lifecycle: RuntimeLifecycle = RuntimeLifecycle.STOPPED
    started_at: Optional[datetime] = None
    stopped_at: Optional[datetime] = None
    uptime_seconds: float = 0.0
    mission_count: int = 0
    active_lease: Optional[str] = None
    healthy: bool = True
    error_message: Optional[str] = None
    
    def start(self) -> None:
        """Mark runtime as starting."""
        self.lifecycle = RuntimeLifecycle.STARTING
        self.started_at = datetime.utcnow()
    
    def running(self) -> None:
        """Mark runtime as running."""
        self.lifecycle = RuntimeLifecycle.RUNNING
        self.healthy = True
    
    def stopping(self) -> None:
        """Mark runtime as stopping."""
        self.lifecycle = RuntimeLifecycle.STOPPING
    
    def stop(self) -> None:
        """Mark runtime as stopped."""
        self.lifecycle = RuntimeLifecycle.STOPPED
        self.stopped_at = datetime.utcnow()
        if self.started_at:
            self.uptime_seconds = (self.stopped_at - self.started_at).total_seconds()
    
    def set_lease(self, lease_id: str) -> None:
        """Set active lease."""
        self.active_lease = lease_id
    
    def clear_lease(self) -> None:
        """Clear active lease."""
        self.active_lease = None
    
    def increment_mission_count(self) -> None:
        """Increment mission count."""
        self.mission_count += 1
    
    def set_unhealthy(self, error: str) -> None:
        """Mark runtime as unhealthy."""
        self.healthy = False
        self.error_message = error
    
    def set_healthy(self) -> None:
        """Mark runtime as healthy."""
        self.healthy = True
        self.error_message = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "lifecycle": self.lifecycle.value,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "stopped_at": self.stopped_at.isoformat() if self.stopped_at else None,
            "uptime_seconds": self.uptime_seconds,
            "mission_count": self.mission_count,
            "active_lease": self.active_lease,
            "healthy": self.healthy,
            "error_message": self.error_message,
        }
