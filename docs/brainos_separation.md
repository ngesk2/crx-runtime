# BrainOS Orchestration - Separate System

## Status: Not Part of Constitutional Runtime

**Location**: `brainos/orchestration/`

**Purpose**: BrainOS is a separate orchestration system that is not integrated with the constitutional runtime.

## Components

### Projection Worker
**Location**: `brainos/orchestration/src/projection_worker.py`
- **Purpose**: Projects PostgreSQL events to Qdrant vector database
- **Implementation**: Direct PostgreSQL + Qdrant integration
- **Status**: Separate from constitutional runtime projection worker

### Constitutional Retrieval
**Location**: `brainos/orchestration/src/constitutional_retrieval.py`
- **Purpose**: Constitutional retrieval for BrainOS
- **Status**: Separate system

### Constitutional Search
**Location**: `brainos/orchestration/src/constitutional_search.py`
- **Purpose**: Constitutional search for BrainOS
- **Status**: Separate system

## Integration Status

**Current**: No integration with constitutional runtime
**Planned**: No integration planned at this time

## Constitutional Runtime Projection Worker

**Canonical Implementation**: `runtime/kernel/workers/qdrant_projection_worker.py`
- **Purpose**: Projects events to Qdrant via constitutional runtime
- **Implementation**: Uses Capability Registry, EmbeddingAuthority, constitutional events
- **Status**: Canonical projection worker for constitutional runtime

## Recommendation

**Keep Separate**: BrainOS orchestration should remain a separate system from the constitutional runtime. The constitutional runtime uses `runtime/kernel/workers/qdrant_projection_worker.py` as its canonical projection worker.

**No Integration**: Do not integrate BrainOS orchestration with the constitutional runtime at this time. Focus on completing the constitutional runtime first.

## Future Consideration

If BrainOS orchestration needs to be integrated with the constitutional runtime in the future, it should:
1. Use the constitutional runtime's projection worker
2. Register via Capability Registry
3. Create constitutional events for all operations
4. Follow constitutional authority ownership rules

Until then, BrainOS orchestration remains a separate system.
