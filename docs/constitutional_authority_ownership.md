# Constitutional Authority Ownership

## Constitutional Runtime Components

### Authority: Constitution Authority
**Owner**: Constitution Authority
**Implementation**: `constitution/authority/constitution_authority.py`
**Purpose**: Immutable constitutional references and version management
**Constitutional Events**: Authority changes create events
**Responsibilities**:
- Constitutional version management
- Authority registry management
- Build witness computation
- Implementation hashing

---

### Authority: Hash Authority
**Owner**: Constitution Authority
**Implementation**: `constitution/authority/hash_authority.py`
**Purpose**: Constitutional hash algorithms
**Constitutional Events**: Hash algorithm changes create events
**Responsibilities**:
- SHA256 hashing
- Hash algorithm versioning
- Hash verification

---

### Authority: Canonical Serializer
**Owner**: Constitution Authority
**Implementation**: `constitution/authority/canonical_serializer.py`
**Purpose**: Canonical encoding for constitutional hashing
**Constitutional Events**: Serializer changes create events
**Responsibilities**:
- JSON canonical serialization
- Sorted key encoding
- Version management

---

### Authority: Canonical Traversal Authority
**Owner**: Constitution Authority
**Implementation**: `constitution/authority/canonical_traversal_authority.py`
**Purpose**: Object traversal for canonical serialization
**Constitutional Events**: Traversal policy changes create events
**Responsibilities**:
- Object traversal rules
- Traversal policy enforcement
- Circular reference handling

---

### Authority: Canonical Byte Authority
**Owner**: Constitution Authority
**Implementation**: `constitution/authority/canonical_byte_authority.py`
**Purpose**: Canonical bytes generation and hashing
**Constitutional Events**: Byte authority changes create events
**Responsibilities**:
- Canonical byte generation
- Byte hashing
- Byte verification

---

### Authority: Capability Registry
**Owner**: Runtime Kernel
**Implementation**: `constitution/registry/capability_registry.py`
**Purpose**: Central registry for runtime capabilities
**Constitutional Events**: Capability registration/deregistration creates events
**Responsibilities**:
- Capability registration
- Capability discovery
- Capability health monitoring
- Capability execution routing

---

### Authority: Capability Ontology
**Owner**: Runtime Kernel
**Implementation**: `runtime/knowledge/capability_ontology.py` (renamed from knowledge_graph.py)
**Purpose**: Abstract capability ontology for mission planning
**Constitutional Events**: Ontology changes create events
**Responsibilities**:
- Abstract capability definitions
- Implementation mapping
- Constraint-based selection
- Ontology path resolution

---

### Authority: Entity Graph
**Owner**: Constitution Authority
**Implementation**: `knowledge/entity_graph.py` (renamed from graph.py)
**Purpose**: Entity-relationship graph for constitutional entities
**Constitutional Events**: All entity operations create events
**Responsibilities**:
- Entity node management
- Relationship edge management
- Entity search
- Path finding

---

### Authority: Projection Validation Authority
**Owner**: Constitution Authority
**Implementation**: `authority/projection_validation_authority.py` (renamed from projection_authority.py)
**Purpose**: Constitutional decision layer for projections
**Constitutional Events**: Validation decisions create events
**Responsibilities**:
- Projection state validation
- Witness validation
- Input hash validation
- Determinism validation

---

### Authority: Projection Execution Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/authorities/projection_authority.py`
**Purpose**: Single authority for all Qdrant/vector operations
**Constitutional Events**: Execution operations create events
**Responsibilities**:
- Qdrant client management
- Collection management
- Vector search
- Embedding generation

---

### Authority: Embedding Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/authorities/embedding_authority.py`
**Purpose**: Embedding generation for semantic search
**Constitutional Events**: Embedding operations create events
**Responsibilities**:
- Model loading
- Embedding generation
- Model versioning

---

### Authority: Evidence Compiler
**Owner**: Runtime Kernel
**Implementation**: `runtime/evidence/evidence_compiler.py`
**Purpose**: Evidence compilation for AI recommendations
**Constitutional Events**: Evidence compilation creates events
**Responsibilities**:
- Evidence collection
- Evidence ranking
- Evidence filtering
- Evidence presentation

---

### Authority: Event Store
**Owner**: Runtime Kernel
**Implementation**: `storage/postgres/database.py` + `storage/postgres/models.py`
**Purpose**: Append-only event store for event sourcing
**Constitutional Events**: All event persistence creates events
**Responsibilities**:
- Event persistence
- Global sequence management
- Aggregate versioning
- Stream versioning

---

### Authority: Replay Engine
**Owner**: Runtime Kernel
**Implementation**: `runtime/kernel/replay/` (to be completed)
**Purpose**: Event replay for state reconstruction
**Constitutional Events**: Replay operations create events
**Responsibilities**:
- Event replay
- State reconstruction
- Replay verification
- Replay fingerprint generation

---

### Authority: Projection Worker
**Owner**: Runtime Kernel
**Implementation**: `runtime/kernel/workers/qdrant_projection_worker.py`
**Purpose**: Event projection to Qdrant vector database
**Constitutional Events**: Projection operations create events
**Responsibilities**:
- Event projection
- Embedding generation
- Qdrant upsert
- Projection checkpointing

---

### Authority: Mission Runtime
**Owner**: Runtime Kernel
**Implementation**: `runtime/kernel/mission/` (to be completed)
**Purpose**: Mission execution and orchestration
**Constitutional Events**: Mission operations create events
**Responsibilities**:
- Mission execution
- Worker orchestration
- Dependency resolution
- Mission state tracking

---

### Authority: Worker Runtime
**Owner**: Runtime Kernel
**Implementation**: `runtime/kernel/workers/` (to be completed)
**Purpose**: Worker execution and management
**Constitutional Events**: Worker operations create events
**Responsibilities**:
- Worker registration
- Worker execution
- Worker health monitoring
- Worker result aggregation

---

### Authority: Configuration Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/configuration_authority.py`
**Purpose**: Configuration management and certification
**Constitutional Events**: Configuration changes create events
**Responsibilities**:
- Configuration loading
- Configuration normalization
- Configuration certification
- Implementation hashing

---

### Authority: Implementation Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/implementation_authority.py`
**Purpose**: Implementation hashing and certification
**Constitutional Events**: Implementation changes create events
**Responsibilities**:
- Implementation hashing
- Implementation certification
- Build witness generation

---

### Authority: Witness Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/witness_authority.py`
**Purpose**: Witness generation for constitutional verification
**Constitutional Events**: Witness generation creates events
**Responsibilities**:
- Witness generation
- Witness verification
- Witness certification

---

## Constitutional Authority Rules

### Search Before Create
No file may be created until:
1. Ownership is identified
2. Existing implementation is located
3. Duplicate authority is ruled out

### Authority Ownership
Every constitutional component must have a clear authority owner:
- **Constitution Authority**: Owns immutable constitutional references
- **Runtime Kernel**: Owns runtime execution and state

### Constitutional Events
All authority operations must create constitutional events:
- Authority changes create events
- State changes create events
- Execution operations create events

### Single Authority per Subsystem
Each constitutional subsystem has exactly one canonical authority:
- One hash authority
- One serializer authority
- One projection validation authority
- One projection execution authority
- One capability registry
- One event store
- One replay engine

---

## Deprecated Components

### SQLite Event Store
**Location**: `architecture/event_store.py.deprecated`
**Status**: Deprecated - not used by constitutional runtime
**Reason**: PostgreSQL event store is canonical

### Duplicate Projection Worker
**Location**: `constitutional_projection_worker.py.deprecated`
**Status**: Deprecated - MVP placeholder
**Reason**: `runtime/kernel/workers/qdrant_projection_worker.py` is canonical

### Duplicate Bootstrap
**Location**: `runtime/runtime_bootstrap.py` (removed)
**Status**: Removed - duplicate composition root
**Reason**: `runtime/bootstrap.py` is canonical

---

## Separate Systems

### BrainOS Orchestration
**Location**: `brainos/orchestration/`
**Status**: Separate system - not part of constitutional runtime
**Documentation**: `docs/brainos_separation.md`
**Reason**: Separate orchestration system with its own projection worker

---

## Next Steps

1. Complete Phase 1.7: Document constitutional authority for each component ✅ COMPLETED
2. Move to Phase 2: Complete Backend Convergence
3. Begin Phase 2.1: Event Store placeholder removal
