"""
RuntimeBootstrap - Sole composition root for constitutional runtime.

This is the ONLY place where dependencies are constructed.
Every subsystem receives dependencies through constructor injection.
Nothing reaches into globals.
Nothing instantiates services internally.

Architecture:
RuntimeBootstrap (composition root)
  ↓
  wires all dependencies
  ↓
  ConstitutionAuthority (immutable constitutional references)
  ↓
  EventStore
  ↓
  ReplayEngine
  ↓
  CapabilityRegistry
  ↓
  ProjectionWorker
  ↓
  KnowledgeGraph
  ↓
  EvidenceCompiler
  ↓
  ExecutionPipeline
  ↓
  WorkflowEngine
  ↓
  MissionEngine
  ↓
  EmbeddingAuthority
  ↓
  InferenceAuthority
  ↓
  Qdrant
  ↓
  PostgreSQL
  ↓
  WebRetrieval
  ↓
  ConfigurationAuthority
"""

from typing import Optional
from dataclasses import dataclass
from constitution.authority import ConstitutionAuthority, ConstitutionVersion
from constitution.registry.capability_registry import CapabilityRegistry, get_registry
from storage.postgres.database import engine
from runtime.authorities.embedding_authority import EmbeddingAuthority
from runtime.evidence.evidence_compiler import EvidenceCompiler
from runtime.event_sourcing.projections import ProjectionStore
from runtime.knowledge.capability_ontology import KnowledgeGraph, get_knowledge_graph


@dataclass
class RuntimeDependencies:
    """
    All runtime dependencies wired by RuntimeBootstrap.

    This is the single source of truth for dependency wiring.
    """
    constitution_authority: ConstitutionAuthority
    capability_registry: CapabilityRegistry
    embedding_authority: EmbeddingAuthority
    evidence_compiler: EvidenceCompiler
    projection_store: ProjectionStore
    knowledge_graph: KnowledgeGraph
    postgres_engine: object  # SQLAlchemy engine
    projection_worker: object  # QdrantProjectionWorker

    # Future dependencies to wire:
    # replay_engine: ReplayEngine
    # execution_pipeline: ExecutionPipeline
    # workflow_engine: WorkflowEngine
    # mission_engine: MissionEngine
    # inference_authority: InferenceAuthority
    # qdrant_client: QdrantClient
    # web_retrieval: WebRetrieval


class RuntimeBootstrap:
    """
    Sole composition root for constitutional runtime.
    
    RuntimeBootstrap owns dependency wiring.
    Nothing else performs dependency construction.
    """

    def __init__(self):
        self._dependencies: Optional[RuntimeDependencies] = None

    async def bootstrap(self) -> RuntimeDependencies:
        """
        Bootstrap the entire runtime.
        
        This is the single entry point for runtime initialization.
        All dependencies are wired here and only here.
        """
        if self._dependencies is not None:
            return self._dependencies

        # Step 1: Create constitutional authorities (immutable root)
        constitution_authority = ConstitutionAuthority(
            version=ConstitutionVersion.v1(),
        )

        # Step 2: Create capability registry (runtime bus)
        capability_registry = get_registry()

        # Step 3: Register core capabilities
        await self._register_capabilities(capability_registry)

        # Step 4: Create embedding authority
        embedding_authority = EmbeddingAuthority()

        # Step 5: Create evidence compiler
        evidence_compiler = EvidenceCompiler()

        # Step 6: Create projection store
        projection_store = ProjectionStore()

        # Step 7: Get knowledge graph singleton
        knowledge_graph = get_knowledge_graph()

        # Step 8: Wire PostgreSQL engine
        postgres_engine = engine

        # Step 9: Wire projection worker
        from runtime.kernel.workers.qdrant_projection_worker import QdrantProjectionWorker
        projection_worker = QdrantProjectionWorker()
        # projection_worker.initialize()  # Initialize when needed (requires sync init)

        # Step 10: Store dependencies
        self._dependencies = RuntimeDependencies(
            constitution_authority=constitution_authority,
            capability_registry=capability_registry,
            embedding_authority=embedding_authority,
            evidence_compiler=evidence_compiler,
            projection_store=projection_store,
            knowledge_graph=knowledge_graph,
            postgres_engine=postgres_engine,
            projection_worker=projection_worker,
        )

        return self._dependencies

    async def _register_capabilities(self, registry: CapabilityRegistry) -> None:
        """Register all runtime capabilities."""
        # Register PostgreSQL capability
        from runtime.capabilities.postgres_capability import PostgresCapability
        postgres_capability = PostgresCapability()
        registry.register(postgres_capability)
        await postgres_capability.initialize()

        # Register Qdrant capability
        from runtime.capabilities.qdrant_capability import QdrantCapability
        qdrant_capability = QdrantCapability(url="http://localhost:6333")
        registry.register(qdrant_capability)
        await qdrant_capability.initialize()

        # Register Ollama capability
        from runtime.capabilities.ollama_capability import OllamaCapability
        ollama_capability = OllamaCapability(url="http://localhost:11434")
        registry.register(ollama_capability)
        await ollama_capability.initialize()

        # Future: Register more capabilities
        # - Filesystem capability
        # - Git capability
        # - Docker capability
        # - Web retrieval capability
        # - Projection capability
        # - Replay capability

    async def shutdown(self) -> None:
        """Shutdown the runtime."""
        if self._dependencies:
            await self._dependencies.capability_registry.shutdown_all()
            await self._dependencies.postgres_engine.dispose()
            self._dependencies = None

    def get_dependencies(self) -> RuntimeDependencies:
        """Get runtime dependencies (must call bootstrap first)."""
        if self._dependencies is None:
            raise RuntimeError("Runtime not bootstrapped. Call bootstrap() first.")
        return self._dependencies


# Global bootstrap instance (for backward compatibility)
_bootstrap: Optional[RuntimeBootstrap] = None


async def get_bootstrap() -> RuntimeBootstrap:
    """Get the global bootstrap instance."""
    global _bootstrap
    if _bootstrap is None:
        _bootstrap = RuntimeBootstrap()
    return _bootstrap


async def bootstrap_runtime() -> RuntimeDependencies:
    """Bootstrap the runtime and return dependencies."""
    bootstrap = await get_bootstrap()
    return await bootstrap.bootstrap()


async def shutdown_runtime() -> None:
    """Shutdown the runtime."""
    global _bootstrap
    if _bootstrap:
        await _bootstrap.shutdown()
        _bootstrap = None
