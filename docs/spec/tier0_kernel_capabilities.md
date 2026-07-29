# Tier 0 — Frozen Kernel Capabilities

## Constitutional Runtime Platform

These components are frozen and will not be replaced. They form the foundation for all PING V2 features.

### Core Capabilities

#### 1. Unified Event Runtime
- **Purpose**: Single source of truth for all business operations
- **Implementation**: PostgreSQL event store with append-only log
- **Capabilities**:
  - Event creation with constitutional hashing
  - Global sequence ordering (BIGINT with database sequence)
  - Aggregate version and stream version for optimistic concurrency
  - Event replay from any checkpoint
  - Event lineage tracking
- **API Endpoints**:
  - `POST /events` - Create event
  - `GET /events` - Query events with filtering
  - `GET /events/{event_id}` - Get single event
- **Status**: ✅ Production-ready

#### 2. Mission Runtime
- **Purpose**: Execute business processes as constitutional missions
- **Implementation**: Mission engine with worker orchestration
- **Capabilities**:
  - Mission definition and execution
  - Worker registration and dispatch
  - Mission state tracking
  - Dependency resolution
- **Status**: ⚠️ Partially implemented

#### 3. Worker Runtime
- **Purpose**: Execute individual tasks within missions
- **Implementation**: Worker pool with capability-based routing
- **Capabilities**:
  - Worker registration via Capability Registry
  - Worker health monitoring
  - Worker execution with retry logic
  - Worker result aggregation
- **Status**: ✅ Capability Registry implemented, workers need wiring

#### 4. Knowledge Graph
- **Purpose**: Store and query relationships between business entities
- **Implementation**: Neo4j graph database
- **Capabilities**:
  - Node and relationship creation
  - Graph traversal queries
  - Relationship-based recommendations
  - Entity resolution
- **Status**: ⚠️ Basic implementation exists

#### 5. Replay Engine
- **Purpose**: Reconstruct state from event history
- **Implementation**: Event replay with checkpoint resumption
- **Capabilities**:
  - Replay from any global_sequence
  - Aggregate reconstruction
  - Deterministic replay verification
  - Replay fingerprint generation
- **Status**: ✅ Database sequence implemented, replay logic needs completion

#### 6. Evidence Compiler
- **Purpose**: Compile evidence for AI recommendations
- **Implementation**: Evidence aggregation from multiple sources
- **Capabilities**:
  - Evidence collection from events
  - Evidence ranking and filtering
  - Evidence presentation for AI context
- **Status**: ⚠️ Basic implementation exists

#### 7. Identity System
- **Purpose**: Uniquely identify all constitutional entities
- **Implementation**: SHA256-based identity with canonical serialization
- **Capabilities**:
  - Entity identity computation
  - Identity verification
  - Identity collision detection
- **Status**: ✅ Constitutional Authority implemented

#### 8. Lineage Tracking
- **Purpose**: Track causal relationships between events
- **Implementation**: Causality_id and correlation_id in event envelope
- **Capabilities**:
  - Event causality graph
  - Lineage queries
  - Root cause analysis
- **Status**: ✅ Event envelope supports lineage

### Infrastructure Capabilities

#### 9. Capability Registry
- **Purpose**: Central registry for all runtime capabilities
- **Implementation**: Singleton registry with health monitoring
- **Capabilities**:
  - Capability registration and discovery
  - Capability health checking
  - Capability execution routing
  - Dependency resolution
- **Status**: ✅ Implemented with PostgreSQL, Qdrant, Ollama capabilities

#### 10. Configuration Authority
- **Purpose**: Constitutional configuration management
- **Implementation**: Configuration snapshot with witness generation
- **Capabilities**:
  - Configuration loading from multiple sources
  - Configuration normalization
  - Configuration certification
  - Implementation hashing
- **Status**: ⚠️ Partially implemented

#### 11. Hash Authority
- **Purpose**: Single source of truth for all hashing operations
- **Implementation**: SHA256 with canonical serialization
- **Capabilities**:
  - String hashing
  - Bytes hashing
  - Dict hashing
  - Hash verification
- **Status**: ✅ Implemented

#### 12. Canonical Serializer
- **Purpose**: Deterministic serialization for constitutional hashing
- **Implementation**: JSON with sorted keys and consistent encoding
- **Capabilities**:
  - Dict serialization
  - List serialization
  - Primitive type serialization
  - Custom type handling
- **Status**: ✅ Implemented

#### 13. Embedding Authority
- **Purpose**: Generate embeddings for semantic search
- **Implementation**: Sentence transformers with model loading
- **Capabilities**:
  - Text embedding generation
  - Model loading and caching
  - Embedding dimension management
- **Status**: ⚠️ Basic implementation exists

#### 14. Qdrant Integration
- **Purpose**: Vector database for semantic search
- **Implementation**: Qdrant client with collection management
- **Capabilities**:
  - Collection creation and management
  - Point upsert and deletion
  - Vector search
  - Collection health monitoring
- **Status**: ✅ Capability implemented, projection worker needs wiring

#### 15. PostgreSQL Integration
- **Purpose**: Relational database for event storage
- **Implementation**: SQLAlchemy async engine with connection pooling
- **Capabilities**:
  - Event persistence
  - Query execution
  - Transaction management
  - Health monitoring
- **Status**: ✅ Implemented

#### 16. Ollama Integration
- **Purpose**: Local LLM inference
- **Implementation**: Ollama client with model management
- **Capabilities**:
  - Chat completion
  - Embedding generation
  - Model listing
  - Health monitoring
- **Status**: ⚠️ Capability stub implemented, full integration needed

### API Capabilities

#### 17. Health Endpoints
- `GET /health` - System health check
- `GET /ready` - Readiness check
- **Status**: ✅ Implemented

#### 18. Event Endpoints
- `POST /events` - Create event
- `GET /events` - Query events
- `GET /events/{event_id}` - Get single event
- **Status**: ✅ Implemented

#### 19. Command Endpoints
- `POST /commands` - Create command
- `GET /commands` - Query commands
- **Status**: ✅ Implemented

#### 20. Projection Endpoints
- `GET /projections` - Query projections
- `GET /projections/{projection_id}` - Get single projection
- **Status**: ⚠️ Basic implementation exists

## Frozen Components Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Unified Event Runtime | ✅ | Production-ready with global_sequence |
| Mission Runtime | ⚠️ | Partially implemented |
| Worker Runtime | ⚠️ | Registry ready, workers need wiring |
| Knowledge Graph | ⚠️ | Basic implementation |
| Replay Engine | ⚠️ | Database ready, replay logic incomplete |
| Evidence Compiler | ⚠️ | Basic implementation |
| Identity System | ✅ | Constitutional Authority ready |
| Lineage Tracking | ✅ | Event envelope supports lineage |
| Capability Registry | ✅ | Implemented with 3 capabilities |
| Configuration Authority | ⚠️ | Partially implemented |
| Hash Authority | ✅ | Implemented |
| Canonical Serializer | ✅ | Implemented |
| Embedding Authority | ⚠️ | Basic implementation |
| Qdrant Integration | ✅ | Capability ready |
| PostgreSQL Integration | ✅ | Implemented |
| Ollama Integration | ⚠️ | Stub implemented |

## API Endpoints Summary

| Endpoint | Method | Status |
|----------|--------|--------|
| /health | GET | ✅ |
| /ready | GET | ✅ |
| /events | POST | ✅ |
| /events | GET | ✅ |
| /events/{event_id} | GET | ✅ |
| /commands | POST | ✅ |
| /commands | GET | ✅ |
| /projections | GET | ⚠️ |
| /projections/{projection_id} | GET | ⚠️ |

## Next Steps

1. Complete Mission Runtime implementation
2. Wire all workers into Capability Registry
3. Complete Replay Engine logic
4. Enhance Knowledge Graph queries
5. Complete Evidence Compiler
6. Full Ollama integration
7. Add projection endpoints

## Notes

- All frozen components use constitutional hashing via CanonicalAuthority
- All events are stored with global_sequence for append-only ordering
- All capabilities register via CapabilityRegistry for health monitoring
- All API endpoints use FastAPI with async SQLAlchemy
- Database uses PostgreSQL with BIGINT global_sequence
- Vector search uses Qdrant with 768-dimension embeddings
- LLM inference uses Ollama with local models
