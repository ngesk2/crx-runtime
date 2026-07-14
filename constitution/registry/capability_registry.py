"""
Capability Registry - Central registry for all system capabilities.

This registry provides the canonical interface for capability discovery,
registration, and execution. Routes and missions never instantiate connectors
directly - they always go through this registry.
"""

from typing import Any, Dict, List, Optional, Protocol, runtime_checkable
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod
import inspect
from datetime import datetime


class CapabilityCategory(Enum):
    """Categories of capabilities."""
    ACQUIRE = "acquire"           # Acquire evidence from external systems
    INGEST = "ingest"             # Ingest evidence into event store
    NORMALIZE = "normalize"       # Normalize evidence to canonical form
    AUTHORIZE = "authorize"       # Authorize via constitutional authority
    EXECUTE = "execute"           # Execute actions on external systems
    TRANSFORM = "transform"       # Transform data
    VALIDATE = "validate"         # Validate inputs/outputs
    MONITOR = "monitor"           # Monitor system state
    DEPLOY = "deploy"             # Deploy infrastructure
    SCHEDULE = "schedule"         # Schedule tasks


class CapabilityState(Enum):
    """States of a capability."""
    REGISTERED = "registered"
    ACTIVE = "active"
    DEGRADED = "degraded"
    DISABLED = "disabled"


@dataclass
class CapabilityMetadata:
    """Metadata for a capability."""
    name: str
    version: str
    category: CapabilityCategory
    description: str
    author: str
    dependencies: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    requires_secrets: List[str] = field(default_factory=list)
    resource_requirements: Dict[str, Any] = field(default_factory=dict)
    state: CapabilityState = CapabilityState.REGISTERED
    registered_at: datetime = field(default_factory=datetime.utcnow)
    last_health_check: Optional[datetime] = None


@runtime_checkable
class Capability(Protocol):
    """Protocol that all capabilities must implement."""
    
    @property
    def metadata(self) -> CapabilityMetadata:
        """Return capability metadata."""
        ...
    
    async def execute(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the capability with given context."""
        ...
    
    async def health_check(self) -> bool:
        """Check if the capability is healthy."""
        ...
    
    async def initialize(self) -> None:
        """Initialize the capability."""
        ...
    
    async def shutdown(self) -> None:
        """Shutdown the capability."""
        ...


class CapabilityRegistry:
    """
    Central registry for all system capabilities.
    
    This registry provides:
    - Capability discovery
    - Capability registration
    - Capability execution
    - Health monitoring
    - Dependency resolution
    """
    
    def __init__(self):
        self._capabilities: Dict[str, Capability] = {}
        self._metadata: Dict[str, CapabilityMetadata] = {}
        self._categories: Dict[CapabilityCategory, List[str]] = {
            category: [] for category in CapabilityCategory
        }
    
    def register(self, capability: Capability) -> None:
        """Register a capability."""
        metadata = capability.metadata
        name = metadata.name
        
        if name in self._capabilities:
            raise ValueError(f"Capability {name} already registered")
        
        self._capabilities[name] = capability
        self._metadata[name] = metadata
        self._categories[metadata.category].append(name)
        
        print(f"Registered capability: {name} ({metadata.category.value})")
    
    def unregister(self, name: str) -> None:
        """Unregister a capability."""
        if name not in self._capabilities:
            raise ValueError(f"Capability {name} not found")
        
        metadata = self._metadata[name]
        self._categories[metadata.category].remove(name)
        del self._capabilities[name]
        del self._metadata[name]
        
        print(f"Unregistered capability: {name}")
    
    def get(self, name: str) -> Optional[Capability]:
        """Get a capability by name."""
        return self._capabilities.get(name)
    
    def list(self, category: Optional[CapabilityCategory] = None) -> List[str]:
        """List capability names, optionally filtered by category."""
        if category is None:
            return list(self._capabilities.keys())
        return self._categories[category].copy()
    
    def get_metadata(self, name: str) -> Optional[CapabilityMetadata]:
        """Get capability metadata."""
        return self._metadata.get(name)
    
    async def execute(self, name: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a capability by name."""
        capability = self.get(name)
        if capability is None:
            raise ValueError(f"Capability {name} not found")
        
        return await capability.execute(context)
    
    async def health_check(self, name: str) -> bool:
        """Health check a specific capability."""
        capability = self.get(name)
        if capability is None:
            return False
        
        return await capability.health_check()
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Health check all capabilities."""
        results = {}
        for name in self._capabilities:
            results[name] = await self.health_check(name)
        return results
    
    async def initialize_all(self) -> None:
        """Initialize all capabilities in dependency order."""
        # TODO: Implement topological sort for dependencies
        for name, capability in self._capabilities.items():
            try:
                await capability.initialize()
                self._metadata[name].state = CapabilityState.ACTIVE
                print(f"Initialized capability: {name}")
            except Exception as e:
                self._metadata[name].state = CapabilityState.DEGRADED
                print(f"Failed to initialize {name}: {e}")
    
    async def shutdown_all(self) -> None:
        """Shutdown all capabilities."""
        for name, capability in self._capabilities.items():
            try:
                await capability.shutdown()
                print(f"Shutdown capability: {name}")
            except Exception as e:
                print(f"Failed to shutdown {name}: {e}")
    
    def discover_by_tag(self, tag: str) -> List[str]:
        """Discover capabilities by tag."""
        return [
            name for name, metadata in self._metadata.items()
            if tag in metadata.tags
        ]
    
    def discover_by_dependency(self, dependency: str) -> List[str]:
        """Discover capabilities that require a specific dependency."""
        return [
            name for name, metadata in self._metadata.items()
            if dependency in metadata.dependencies
        ]


# Global registry instance
_global_registry: Optional[CapabilityRegistry] = None


def get_registry() -> CapabilityRegistry:
    """Get the global capability registry."""
    global _global_registry
    if _global_registry is None:
        _global_registry = CapabilityRegistry()
    return _global_registry


def register_capability(capability: Capability) -> None:
    """Register a capability with the global registry."""
    registry = get_registry()
    registry.register(capability)


def execute_capability(name: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute a capability by name (convenience function)."""
    registry = get_registry()
    return registry.execute(name, context)
