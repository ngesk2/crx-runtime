"""
Dependency Injection Container

Constitutional Runtime DI container that constructs all dependencies once
and provides them to downstream components. Eliminates global getters and
service-locator style dependencies.
"""

from typing import Optional
from dataclasses import dataclass

from constitution.authority.canonical import CanonicalAuthority
from storage.event_store import EventStore
from storage.postgres.database import get_session
from constitution.registry.capability_registry import CapabilityRegistry
from runtime.oracle.oracle import Oracle
from runtime.evidence.evidence_compiler import EvidenceCompiler
from runtime.event_sourcing.projections import ProjectionStore
from storage.repositories.postgres_event_reader import PostgresEventReader
from storage.repositories.event_reader import EventReader


@dataclass
class RuntimeContainer:
    """
    Constitutional Runtime dependency container.
    
    This is the composition root that constructs all dependencies once.
    Everything downstream receives interfaces from this container.
    """
    
    # Constitutional authorities
    canonical_authority: CanonicalAuthority
    
    # Storage
    event_store_factory: callable  # Factory to create EventStore with session
    event_reader: EventReader  # Event reader interface
    
    # Registry
    capability_registry: CapabilityRegistry
    
    # Oracle
    oracle: Oracle
    
    # Evidence
    evidence_compiler: EvidenceCompiler
    
    # Projections
    projection_store: ProjectionStore
    
    @classmethod
    async def create(cls) -> "RuntimeContainer":
        """Create and initialize the runtime container."""
        # Construct constitutional authorities
        canonical_authority = CanonicalAuthority()
        
        # Create event store factory (requires session per request)
        def event_store_factory():
            from storage.event_store import EventStore
            # This will be called with a session when needed
            return lambda session: EventStore(session)
        
        # Initialize capability registry
        capability_registry = CapabilityRegistry()
        await capability_registry.initialize()
        
        # Initialize Oracle
        oracle = Oracle()
        
        # Initialize evidence compiler
        evidence_compiler = EvidenceCompiler()
        
        # Initialize projection store
        projection_store = ProjectionStore()
        
        # Initialize event reader
        event_reader = PostgresEventReader()
        
        return cls(
            canonical_authority=canonical_authority,
            event_store_factory=event_store_factory,
            event_reader=event_reader,
            capability_registry=capability_registry,
            oracle=oracle,
            evidence_compiler=evidence_compiler,
            projection_store=projection_store,
        )
    
    async def shutdown(self) -> None:
        """Shutdown the runtime container and cleanup resources."""
        await self.capability_registry.shutdown()


# Global container instance (will be replaced by proper DI in production)
_container: Optional[RuntimeContainer] = None


async def get_container() -> RuntimeContainer:
    """Get the global runtime container instance."""
    global _container
    if _container is None:
        _container = await RuntimeContainer.create()
    return _container


async def shutdown_container() -> None:
    """Shutdown the global runtime container."""
    global _container
    if _container is not None:
        await _container.shutdown()
        _container = None
