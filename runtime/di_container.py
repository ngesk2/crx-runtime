"""
Dependency Injection Container

Constitutional Runtime DI container that constructs all dependencies once
and provides them to downstream components. Eliminates global getters and
service-locator style dependencies.
"""

from typing import Optional
from dataclasses import dataclass

from constitution.authority import CanonicalAuthority
from storage.event_store import EventStore
from storage.postgres.database import get_session
from constitution.registry.capability_registry import CapabilityRegistry
from runtime.oracle.oracle import Oracle
from runtime.evidence.evidence_compiler import EvidenceCompiler
from runtime.event_sourcing.projections import ProjectionStore
from storage.repositories.postgres_event_reader import PostgresEventReader
from storage.repositories.event_reader import EventReader
from runtime.replay.replay_verifier import ReplayVerifier


@dataclass
class RuntimeContainer:
    """
    Constitutional Runtime dependency container.
    
    This is the composition root that constructs all dependencies once.
    Everything downstream receives interfaces from this container.
    """
    
    # Storage
    event_reader: EventReader  # Event reader interface
    
    # Registry
    capability_registry: CapabilityRegistry
    
    # Oracle
    oracle: Oracle
    
    # Evidence
    evidence_compiler: EvidenceCompiler
    
    # Projections
    projection_store: ProjectionStore
    
    # Projection pipeline
    projection_pipeline: Optional[object] = None  # Will be set if TypeScript pipeline is used
    
    # Replay
    replay_verifier: ReplayVerifier
    
    @classmethod
    async def create(cls) -> "RuntimeContainer":
        """Create and initialize the runtime container."""
        # Construct constitutional authorities
        canonical_authority = CanonicalAuthority()
        
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
        
        # Initialize replay verifier with event reader
        replay_verifier = ReplayVerifier(canonical_authority, event_reader)
        
        return cls(
            event_reader=event_reader,
            capability_registry=capability_registry,
            oracle=oracle,
            evidence_compiler=evidence_compiler,
            projection_store=projection_store,
            replay_verifier=replay_verifier,
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
