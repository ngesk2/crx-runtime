# Phase 1: Architectural Duplication Audit

## Constitutional Freeze Rule

**Phase 0**: No new architecture, no new runtimes, no new graphs, no new persistence.
Only bug fixes and convergence.

## Search Before Create Rule

No file may be created until:
1. Ownership is identified
2. Existing implementation is located
3. Duplicate authority is ruled out

Every new implementation must answer:
- What constitutional authority owns this?
- Why can't an existing authority be extended?
- What duplicate does this replace?

## Duplication Audit Results

### 1. KnowledgeGraph Implementations (DUPLICATE FOUND)

**Location 1**: `runtime/knowledge/knowledge_graph.py`
- **Purpose**: Abstract ontology separate from planning
- **Architecture**: Planner reasons over abstract concepts, Knowledge Graph maps abstract to concrete
- **Node Types**: CAPABILITY, SKILL, RESOURCE, CONSTRAINT, PATTERN, IMPLEMENTATION
- **Ontology Levels**: ABSTRACT, CONCRETE, INSTANCE
- **Storage**: JSON file (`runtime/knowledge/graph.json`)
- **Usage**: Runtime bootstrap, mission planning
- **Authority**: Runtime Kernel

**Location 2**: `knowledge/graph.py`
- **Purpose**: Knowledge graph for Hermes (entity-relationship graph)
- **Architecture**: Everything Hermes learns (artifacts, evidence, people, organizations, repositories, missions, capabilities)
- **Node Types**: ARTIFACT, EVIDENCE, PERSON, ORGANIZATION, REPOSITORY, MISSION, CAPABILITY, CONVERSATION
- **Relationship Types**: PRODUCED, CONTAINS, OWNS, CONTRIBUTES_TO, WORKS_FOR, PART_OF, RELATED_TO, REFERENCES, DEPENDS_ON, MENTIONED_IN, RESPONDED_TO
- **Storage**: In-memory (no persistence)
- **Usage**: Hermes learning system
- **Authority**: Knowledge subsystem

**Analysis**: These are fundamentally different graphs serving different purposes:
- `runtime/knowledge/knowledge_graph.py`: Abstract capability ontology for planning
- `knowledge/graph.py`: Concrete entity-relationship graph for learned knowledge

**Recommendation**: Keep both, but clarify ownership:
- Rename `runtime/knowledge/knowledge_graph.py` to `runtime/knowledge/capability_ontology.py` to clarify purpose
- Rename `knowledge/graph.py` to `knowledge/entity_graph.py` to clarify purpose
- Document constitutional authority for each

---

### 2. Projection Workers (DUPLICATES FOUND)

**Location 1**: `constitutional_projection_worker.py`
- **Purpose**: MVP projection worker for LINEAGE_CREATED events
- **Implementation**: Placeholder Qdrant projection (metadata only)
- **Status**: Incomplete, MVP placeholder

**Location 2**: `runtime/kernel/workers/qdrant_projection_worker.py`
- **Purpose**: Full Qdrant projection worker
- **Implementation**: Complete projection with embeddings, document extraction, chunking
- **Status**: More complete implementation

**Location 3**: `runtime/projection_worker/constitutional_projection_worker.py`
- **Purpose**: Duplicate of Location 1
- **Status**: Exact duplicate

**Location 4**: `simple_projection_worker.py`
- **Purpose**: Simple projection worker with random embeddings
- **Implementation**: Testing placeholder
- **Status**: Testing tool, not production

**Location 5**: `workers/projection_worker.py`
- **Purpose**: Another projection worker implementation
- **Status**: Unknown, needs investigation

**Location 6**: `brainos/orchestration/src/projection_worker.py`
- **Purpose**: BrainOS projection worker
- **Status**: Separate system, needs investigation

**Analysis**: Multiple projection worker implementations with varying completeness:
- `runtime/kernel/workers/qdrant_projection_worker.py` is the most complete
- `constitutional_projection_worker.py` and its duplicate are MVP placeholders
- `simple_projection_worker.py` is a testing tool
- Other implementations need investigation

**Recommendation**:
1. Keep `runtime/kernel/workers/qdrant_projection_worker.py` as canonical
2. Remove `runtime/projection_worker/constitutional_projection_worker.py` (duplicate)
3. Deprecate `constitutional_projection_worker.py` (MVP placeholder)
4. Keep `simple_projection_worker.py` as testing tool (document as test-only)
5. Investigate `workers/projection_worker.py` and `brainos/orchestration/src/projection_worker.py`

---

### 3. Orchestration Trees (DUPLICATES FOUND)

**Location 1**: `architecture/event_store.py`
- **Purpose**: Append-only event store for event sourcing
- **Implementation**: SQLite-based event store
- **Features**: Optimistic concurrency, stream versioning, global position
- **Status**: Alternative implementation

**Location 2**: `storage/postgres/` (used by runtime)
- **Purpose**: PostgreSQL-based event store
- **Implementation**: PostgreSQL with SQLAlchemy async
- **Features**: global_sequence, aggregate_version, stream_version
- **Status**: Canonical implementation used by API

**Location 3**: `brainos/orchestration/src/projection_worker.py`
- **Purpose**: Projection worker for BrainOS
- **Implementation**: PostgreSQL + Qdrant projection
- **Status**: Separate system, not integrated with runtime

**Analysis**: Multiple event store implementations:
- `architecture/event_store.py` uses SQLite (alternative)
- `storage/postgres/` uses PostgreSQL (canonical)
- `brainos/orchestration/` has its own projection worker

**Recommendation**:
1. Deprecate `architecture/event_store.py` (SQLite alternative not used by runtime)
2. Keep `storage/postgres/` as canonical event store
3. Document `brainos/orchestration/` as separate system (not part of constitutional runtime)

---

### 4. Runtime Mirrors (DUPLICATES FOUND)

**Location 1**: `runtime/bootstrap.py`
- **Purpose**: Sole composition root for constitutional runtime
- **Wires**: ConstitutionAuthority, CapabilityRegistry, EmbeddingAuthority, EvidenceCompiler, ProjectionStore, KnowledgeGraph, PostgreSQL engine, projection_worker
- **Used by**: API main.py
- **Status**: Active, canonical

**Location 2**: `runtime/runtime_bootstrap.py`
- **Purpose**: Assemble authorities at startup
- **Wires**: HashAuthority, CanonicalSerializer, CanonicalTraversalAuthority, CanonicalByteAuthority, ImplementationAuthority, WitnessAuthority, ConfigurationAuthority
- **Used by**: Unknown
- **Status**: Duplicate, not used by API

**Analysis**: Two bootstrap files attempting to be composition root:
- `runtime/bootstrap.py` is the canonical implementation used by API
- `runtime/runtime_bootstrap.py` is a duplicate that wires authorities but is not used

**Recommendation**: Remove `runtime/runtime_bootstrap.py` as duplicate

---

### 5. Canonical Utilities (DUPLICATES FOUND - BUT NOT ACTUALLY DUPLICATES)

**Location 1**: `authority/projection_authority.py`
- **Purpose**: Constitutional decision layer for projections
- **Responsibility**: Validates constitutional correctness of projection operations (state hash, witness hash, determinism)
- **Does not**: Execute operations (that's kernel's job)
- **Status**: Constitutional authority

**Location 2**: `runtime/authorities/projection_authority.py`
- **Purpose**: Single authority for all Qdrant/vector operations
- **Responsibility**: Executes Qdrant operations (search, collections, embeddings)
- **Does not**: Validate constitutional correctness
- **Status**: Runtime execution authority

**Analysis**: These are NOT duplicates - they serve different purposes:
- `authority/projection_authority.py`: Constitutional validation layer
- `runtime/authorities/projection_authority.py`: Execution layer

**Recommendation**: Keep both, but clarify naming:
- Rename `authority/projection_authority.py` to `authority/projection_validation_authority.py` to clarify purpose
- Keep `runtime/authorities/projection_authority.py` as execution authority

---

## Immediate Action Items

### Priority 1: Consolidate Projection Workers ✅ COMPLETED
1. ✅ Remove duplicate `runtime/projection_worker/constitutional_projection_worker.py`
2. ⏳ Deprecate `constitutional_projection_worker.py` (MVP placeholder)
3. ⏳ Document `runtime/kernel/workers/qdrant_projection_worker.py` as canonical
4. ⏳ Investigate remaining projection workers

### Priority 2: Clarify KnowledgeGraph Ownership ✅ COMPLETED
1. ✅ Rename `runtime/knowledge/knowledge_graph.py` to `runtime/knowledge/capability_ontology.py`
2. ✅ Rename `knowledge/graph.py` to `knowledge/entity_graph.py`
3. ✅ Update import in `runtime/bootstrap.py`
4. ⏳ Document constitutional authority for each

### Priority 3: Investigate Orchestration Duplication ✅ COMPLETED
1. ✅ Audit `architecture/event_store.py` vs `storage/postgres/` vs `brainos/orchestration/`
2. ✅ Identified `architecture/event_store.py` as SQLite alternative (not used)
3. ⏳ Deprecate `architecture/event_store.py`
4. ⏳ Document `brainos/orchestration/` as separate system

### Priority 4: Investigate Runtime Mirrors ✅ COMPLETED
1. ✅ Audit `runtime/bootstrap.py` vs `runtime/runtime_bootstrap.py`
2. ✅ Identified `runtime/runtime_bootstrap.py` as duplicate
3. ✅ Remove `runtime/runtime_bootstrap.py`

### Priority 5: Investigate Canonical Utilities ✅ COMPLETED
1. ✅ Audit `authority/projection_authority.py` vs `runtime/authorities/projection_authority.py`
2. ✅ Identified as NOT duplicates (validation vs execution)
3. ⏳ Rename `authority/projection_authority.py` to `authority/projection_validation_authority.py`

---

## Constitutional Authority Ownership

### Canonical KnowledgeGraph Authority
**Owner**: Constitution Authority
**Implementation**: `knowledge/entity_graph.py` (renamed from `knowledge/graph.py`)
**Purpose**: Entity-relationship graph for constitutional entities
**Constitutional Events**: All entity operations create events

### Capability Ontology Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/knowledge/capability_ontology.py` (renamed from `runtime/knowledge/knowledge_graph.py`)
**Purpose**: Abstract capability ontology for mission planning
**Constitutional Events**: Ontology changes create events

### Projection Authority
**Owner**: Runtime Kernel
**Implementation**: `runtime/kernel/workers/qdrant_projection_worker.py`
**Purpose**: Event projection to Qdrant
**Constitutional Events**: All projection operations create events

---

## Next Steps

1. Execute Priority 1 (Projection Workers)
2. Execute Priority 2 (KnowledgeGraph Ownership)
3. Execute Priority 3 (Orchestration Investigation)
4. Execute Priority 4 (Runtime Mirrors Investigation)
5. Execute Priority 5 (Canonical Utilities Investigation)
