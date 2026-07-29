"""Provider Descriptor

Provider descriptor with capability-based routing for future extensibility.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Any


class ProviderPriority(Enum):
    """Provider priority for routing"""
    PRIMARY = "primary"
    SECONDARY = "secondary"
    TERTIARY = "tertiary"


class ProviderAvailability(Enum):
    """Provider availability status"""
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    DEGRADED = "degraded"
    MAINTENANCE = "maintenance"


@dataclass(frozen=True)
class ProviderDescriptor:
    """Provider descriptor with capability-based routing
    
    Extends beyond simple string mappings to support:
    - Priority (primary, secondary, tertiary)
    - Availability status
    - Region support
    - Failover configuration
    - Cost tracking
    - Rate limit information
    """
    
    name: str  # "kit", "twilio", "resend"
    capabilities: list[str]  # ["subscriber", "broadcast", "tag", "sequence", "automation"]
    priority: ProviderPriority = ProviderPriority.PRIMARY
    availability: ProviderAvailability = ProviderAvailability.AVAILABLE
    region: str | None = None  # "us-east-1", etc.
    failover_provider: str | None = None  # Name of failover provider
    cost_per_request: float = 0.0  # Cost tracking
    rate_limit_per_minute: int = 100  # Rate limit
    metadata: dict[str, Any] | None = None  # Additional metadata
    
    def supports_capability(self, capability: str) -> bool:
        """Check if provider supports a specific capability"""
        return capability in self.capabilities
    
    def is_available(self) -> bool:
        """Check if provider is available"""
        return self.availability == ProviderAvailability.AVAILABLE
    
    def get_failover_chain(self) -> list[str]:
        """Get failover chain for this provider"""
        chain = [self.name]
        if self.failover_provider:
            chain.append(self.failover_provider)
        return chain
