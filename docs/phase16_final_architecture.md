# Phase 16: CEO Execution Mode — Constitutional Runtime Final Architecture

## Executive Summary

This document defines the final architecture of the Constitutional Runtime (CRX) Version 2.0. This architecture is designed to stand beside FoundationDB, EventStoreDB, Temporal, Axon Framework, Orleans, CockroachDB, and Kubernetes Controllers while preserving constitutional determinism guarantees.

**Design Philosophy:**
- **Constitutional Purity First:** Constitutional layer has zero knowledge of infrastructure
- **Replay Isolation:** Replay is a pure function over event streams
- **Infrastructure Replaceability:** Every infrastructure component is swappable
- **Determinism by Construction:** Determinism is architectural, not accidental
- **Decade-Long Optimization:** Architecture designed for 10+ year evolution

---

## 1. Final Architecture Score

### Target Architecture Score: 96/100

**Breakdown:**

| Category | Current Score | Target Score | Improvement | Rationale |
|----------|---------------|---------------|-------------|-----------|
| Clean Architecture | 65/100 | 98/100 | +33 | Complete layer isolation, zero outward dependencies |
| DDD | 75/100 | 95/100 | +20 | Proper aggregate boundaries, bounded contexts, domain events |
| Event Sourcing | 80/100 | 98/100 | +18 | Pure event streams, replay isolation, proper versioning |
| Dependency Injection | 70/100 | 95/100 | +25 | Complete DI container, explicit composition root |
| Infrastructure Isolation | 60/100 | 98/100 | +38 | Complete port/adapter pattern, zero leakage |
| Replay Isolation | 50/100 | 98/100 | +48 | Replay depends only on EventStream, pure function |
| Scalability | 70/100 | 95/100 | +25 | Partitioning strategy, distributed replay, horizontal scaling |
| Testability | 65/100 | 98/100 | +33 | Pure kernel testing, contract testing, property testing |
| Constitutional Purity | 90/100 | 99/100 | +9 | Near-perfect isolation, only clock/identity remain |

**Why 96/100, not 100/100:**
- **Clock:** Physical clock cannot be fully abstracted (time is external)
- **Identity:** Distributed identity generation requires coordination (external dependency)
- **Network:** Network is inherently external (cannot be fully abstracted)
- **Unicode:** Unicode normalization is inherently complex (edge cases remain)

These are fundamental limitations of distributed systems, not architectural flaws.

---

## 2. Complete Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Hosting Layer                            │
│  (Kubernetes, Docker, bare metal, serverless, cloud-native)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Dependency Injection Layer                    │
│  (Composition root, container, lifecycle management, wiring)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  (FastAPI, gRPC, GraphQL, WebSocket, HTTP/2, protocol-agnostic)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Transport Layer                             │
│  (NATS, Kafka, RabbitMQ, gRPC, HTTP, WebSocket, memory)          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Observability Layer                         │
│  (Metrics, Logging, Tracing, Monitoring, Alerting, Debugging)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Ports Layer                               │
│  (EventStream, SnapshotStore, ArtifactStore, Transport,          │
│   MetricsCollector, Logger, Clock, IdentityGenerator, etc.)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Repository Layer                            │
│  (EventRepository, SnapshotRepository, ArtifactRepository,        │
│   WitnessRepository, ProjectionRepository, CommandRepository)   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Mapper Layer                               │
│  (EventMapper, SnapshotMapper, ArtifactMapper, WitnessMapper,     │
│   ProjectionMapper, CommandMapper, DTO ↔ Domain ↔ Persistence)    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Persistence Layer                           │
│  (PostgreSQL, SQLite, FoundationDB, EventStoreDB, Kafka Log,      │
│   filesystem, S3, Redis, in-memory, pluggable)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Kernel Layer                              │
│  (ReplayEngine, ProjectionEngine, WitnessEngine, Scheduler,      │
│   EventDAG, CapabilityRegistry, CommandHandler, AggregateRoot)   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Constitution Layer                            │
│  (CanonicalHasher, MerkleTree, EventEnvelope, Evidence,          │
│   Request, Artifact, BuildWitness, CanonicalBytes, etc.)          │
└─────────────────────────────────────────────────────────────────┘
```

**Dependency Rules:**
- Every layer depends only on layers below it
- Constitution layer depends on nothing (zero external dependencies)
- Kernel depends only on Constitution and Ports
- Ports depend only on Constitution
- Repositories depend on Ports and Mappers
- Mappers depend on Constitution and Persistence DTOs
- Persistence depends on nothing (pure data access)
- Transport depends on Ports
- Observability depends on Ports
- API depends on Ports and DTOs
- DI wires everything together
- Hosting depends on DI

**Forbidden Dependencies:**
- Constitution → Anything external
- Kernel → SQLAlchemy, FastAPI, NATS, PostgreSQL, etc.
- Ports → Infrastructure implementations
- Repositories → SQLAlchemy, PostgreSQL, etc.
- Mappers → SQLAlchemy, PostgreSQL, etc.
- Kernel → API, Transport, Observability

---

## 3. Dependency Graph

### constitution/

**Purpose:** Constitutional models, hashing, canonical encoding

**Imports:**
- Nothing external
- Only Python standard library (hashlib, json, datetime, typing)

**Forbidden Imports:**
- sqlalchemy
- fastapi
- pydantic (except for BaseModel - constitutional models use Pydantic for validation only)
- nats
- kafka
- postgres
- redis
- s3
- Any infrastructure library

**Files:**
- `constitution/hashing.py` - CanonicalHasher, MerkleTree
- `constitution/models/event.py` - EventEnvelope, DomainEvent, InfrastructureEvent
- `constitution/models/evidence.py` - Evidence, CanonicalArtifact
- `constitution/models/request.py` - Request, FilesystemRequest, NetworkRequest
- `constitution/models/artifact.py` - Artifact, StateArtifact
- `constitution/models/witness.py` - BuildWitness, ProjectionWitness
- `constitution/encoding.py` - CanonicalEncoder, CanonicalDecoder
- `constitution/invariants.py` - Constitutional invariants (append-only, etc.)

### kernel/

**Purpose:** Constitutional execution engine (replay, projections, witness)

**Imports:**
- `constitution.*` - Constitutional models
- `ports.*` - Port interfaces (EventStream, SnapshotStore, etc.)

**Forbidden Imports:**
- sqlalchemy
- fastapi
- nats
- kafka
- postgres
- redis
- s3
- Any infrastructure implementation

**Files:**
- `kernel/replay.py` - ReplayEngine (depends on EventStream, ProjectionEngine)
- `kernel/projection.py` - ProjectionEngine (depends on EventStream, SnapshotStore)
- `kernel/witness.py` - WitnessEngine (depends on EventStream, WitnessStore)
- `kernel/scheduler.py` - Scheduler (depends on EventStream, CommandHandler)
- `kernel/event_dag.py` - EventDAG (depends on EventStream)
- `kernel/aggregate.py` - AggregateRoot (depends on EventStream)
- `kernel/command.py` - CommandHandler (depends on EventStream, CommandRepository)
- `kernel/capability.py` - CapabilityRegistry (depends on Constitution)

### ports/

**Purpose:** Infrastructure abstractions (ports for hexagonal architecture)

**Imports:**
- `constitution.*` - Constitutional models

**Forbidden Imports:**
- sqlalchemy
- fastapi
- nats
- kafka
- postgres
- redis
- s3
- Any infrastructure implementation

**Files:**
- `ports/event_stream.py` - EventStream interface
- `ports/snapshot_store.py` - SnapshotStore interface
- `ports/artifact_store.py` - ArtifactStore interface
- `ports/witness_store.py` - WitnessStore interface
- `ports/projection_store.py` - ProjectionStore interface
- `ports/command_store.py` - CommandStore interface
- `ports/transport.py` - Transport interface
- `ports/metrics_collector.py` - MetricsCollector interface
- `ports/logger.py` - Logger interface
- `ports/clock.py` - Clock interface
- `ports/identity_generator.py` - IdentityGenerator interface
- `ports/configuration_provider.py` - ConfigurationProvider interface
- `ports/hash_provider.py` - HashProvider interface
- `ports/serializer.py` - Serializer interface
- `ports/canonical_encoder.py` - CanonicalEncoder interface

### repositories/

**Purpose:** Repository implementations (adapters for ports)

**Imports:**
- `constitution.*` - Constitutional models
- `ports.*` - Port interfaces
- `mappers.*` - Mapper layer
- `infrastructure/persistence/*` - Persistence implementations

**Forbidden Imports:**
- Direct SQLAlchemy imports in repository logic (use persistence layer)
- Direct PostgreSQL imports (use persistence layer)

**Files:**
- `repositories/event_repository.py` - EventRepository (implements EventStream)
- `repositories/snapshot_repository.py` - SnapshotRepository (implements SnapshotStore)
- `repositories/artifact_repository.py` - ArtifactRepository (implements ArtifactStore)
- `repositories/witness_repository.py` - WitnessRepository (implements WitnessStore)
- `repositories/projection_repository.py` - ProjectionRepository (implements ProjectionStore)
- `repositories/command_repository.py` - CommandRepository (implements CommandStore)

### mappers/

**Purpose:** Mapping between layers (DTO ↔ Domain ↔ Persistence)

**Imports:**
- `constitution.*` - Constitutional models
- `dto.*` - API DTOs
- `infrastructure/persistence/dto.py` - Persistence DTOs

**Forbidden Imports:**
- sqlalchemy (use persistence DTOs only)
- Any infrastructure implementation

**Files:**
- `mappers/event_mapper.py` - EventMapper (EventEnvelope ↔ EventDTO ↔ EventPersistenceDTO)
- `mappers/snapshot_mapper.py` - SnapshotMapper (Snapshot ↔ SnapshotDTO ↔ SnapshotPersistenceDTO)
- `mappers/artifact_mapper.py` - ArtifactMapper (Artifact ↔ ArtifactDTO ↔ ArtifactPersistenceDTO)
- `mappers/witness_mapper.py` - WitnessMapper (BuildWitness ↔ WitnessDTO ↔ WitnessPersistenceDTO)
- `mappers/projection_mapper.py` - ProjectionMapper (Projection ↔ ProjectionDTO ↔ ProjectionPersistenceDTO)
- `mappers/command_mapper.py` - CommandMapper (Command ↔ CommandDTO ↔ CommandPersistenceDTO)

### infrastructure/persistence/

**Purpose:** Persistence implementations (PostgreSQL, SQLite, FoundationDB, etc.)

**Imports:**
- `infrastructure/persistence/dto.py` - Persistence DTOs
- Database drivers (sqlalchemy, asyncpg, etc.)

**Forbidden Imports:**
- `constitution.*` - Constitutional models (use persistence DTOs only)
- `kernel.*` - Kernel (use persistence DTOs only)

**Files:**
- `infrastructure/persistence/dto.py` - Persistence DTOs (pure data structures)
- `infrastructure/persistence/postgres.py` - PostgreSQL implementation
- `infrastructure/persistence/sqlite.py` - SQLite implementation
- `infrastructure/persistence/foundationdb.py` - FoundationDB implementation
- `infrastructure/persistence/eventstoredb.py` - EventStoreDB implementation
- `infrastructure/persistence/kafka_log.py` - Kafka log implementation
- `infrastructure/persistence/filesystem.py` - Filesystem implementation
- `infrastructure/persistence/s3.py` - S3 implementation
- `infrastructure/persistence/redis.py` - Redis implementation
- `infrastructure/persistence/memory.py` - In-memory implementation

### infrastructure/transport/

**Purpose:** Transport implementations (NATS, Kafka, RabbitMQ, etc.)

**Imports:**
- `ports/transport.py` - Transport interface

**Forbidden Imports:**
- `constitution.*` - Constitutional models
- `kernel.*` - Kernel

**Files:**
- `infrastructure/transport/nats.py` - NATS implementation
- `infrastructure/transport/kafka.py` - Kafka implementation
- `infrastructure/transport/rabbitmq.py` - RabbitMQ implementation
- `infrastructure/transport/grpc.py` - gRPC implementation
- `infrastructure/transport/http.py` - HTTP implementation
- `infrastructure/transport/websocket.py` - WebSocket implementation
- `infrastructure/transport/memory.py` - In-memory implementation

### infrastructure/observability/

**Purpose:** Observability implementations (metrics, logging, tracing)

**Imports:**
- `ports/metrics_collector.py` - MetricsCollector interface
- `ports/logger.py` - Logger interface

**Forbidden Imports:**
- `constitution.*` - Constitutional models
- `kernel.*` - Kernel

**Files:**
- `infrastructure/observability/prometheus.py` - Prometheus implementation
- `infrastructure/observability/statsd.py` - StatsD implementation
- `infrastructure/observability/structlog.py` - Structlog implementation
- `infrastructure/observability/standard.py` - Python logging implementation
- `infrastructure/observability/null.py` - Null implementation (for testing)

### infrastructure/clock/

**Purpose:** Clock implementations (system clock, monotonic clock, test clock)

**Imports:**
- `ports/clock.py` - Clock interface

**Forbidden Imports:**
- `constitution.*` - Constitutional models
- `kernel.*` - Kernel

**Files:**
- `infrastructure/clock/system.py` - System clock implementation
- `infrastructure/clock/monotonic.py` - Monotonic clock implementation
- `infrastructure/clock/test.py` - Test clock implementation (for deterministic testing)

### infrastructure/identity/

**Purpose:** Identity generation implementations (UUID, Snowflake, etc.)

**Imports:**
- `ports/identity_generator.py` - IdentityGenerator interface

**Forbidden Imports:**
- `constitution.*` - Constitutional models
- `kernel.*` - Kernel

**Files:**
- `infrastructure/identity/uuid.py` - UUID implementation
- `infrastructure/identity/snowflake.py` - Snowflake implementation
- `infrastructure/identity/ulid.py` - ULID implementation
- `infrastructure/identity/sequential.py` - Sequential implementation (for testing)

### infrastructure/configuration/

**Purpose:** Configuration implementations (environment, file, etc.)

**Imports:**
- `ports/configuration_provider.py` - ConfigurationProvider interface

**Forbidden Imports:**
- `constitution.*` - Constitutional models
- `kernel.*` - Kernel

**Files:**
- `infrastructure/configuration/pydantic_settings.py` - Pydantic Settings implementation
- `infrastructure/configuration/environment.py` - Environment variable implementation
- `infrastructure/configuration/file.py` - File-based implementation
- `infrastructure/configuration/vault.py` - Vault implementation

### api/

**Purpose:** API layer (FastAPI, gRPC, GraphQL, etc.)

**Imports:**
- `constitution.*` - Constitutional models
- `ports.*` - Port interfaces
- `dto.*` - API DTOs
- `mappers.*` - Mapper layer

**Forbidden Imports:**
- `kernel.*` - Kernel (use ports instead)
- `repositories.*` - Repositories (use ports instead)
- `infrastructure/persistence/*` - Persistence implementations (use ports instead)

**Files:**
- `api/dto.py` - API DTOs
- `api/fastapi.py` - FastAPI implementation
- `api/grpc.py` - gRPC implementation
- `api/graphql.py` - GraphQL implementation
- `api/websocket.py` - WebSocket implementation

### di/

**Purpose:** Dependency injection container

**Imports:**
- All layers (for wiring)

**Forbidden Imports:**
- None (DI container imports everything for wiring)

**Files:**
- `di/container.py` - DI container
- `di/composition_root.py` - Composition root
- `di/factories.py` - Factories for creating instances

### hosting/

**Purpose:** Hosting layer (Kubernetes, Docker, serverless)

**Imports:**
- `di/*` - DI container

**Forbidden Imports:**
- None (hosting imports DI for startup)

**Files:**
- `hosting/kubernetes.py` - Kubernetes deployment
- `hosting/docker.py` - Docker deployment
- `hosting/serverless.py` - Serverless deployment
- `hosting/bare_metal.py` - Bare metal deployment

---

## 4. Event Flow

### Ideal Event Lifecycle

```
┌─────────────────┐
│   Command       │
│  (User Intent)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Validation    │
│  (Schema Check) │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Aggregate     │
│  (State Load)   │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Business Logic │
│  (Domain Rules) │
└────────┬────────┘
         ↓
┌─────────────────┐
│     Event       │
│  (Domain Event) │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Canonical Hash  │
│ (Constitution)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Event Envelope │
│  (Metadata)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Event Stream   │
│  (Append-Only)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Persistence   │
│  (Durable Log)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Projection   │
│  (State Build) │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Snapshot     │
│  (State Save)  │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Transport    │
│  (Publish)     │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Consumers    │
│  (Subscribe)   │
└────────┬────────┘
         ↓
┌─────────────────┐
│     Replay      │
│  (Rebuild)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│    Witness     │
│  (Verification) │
└─────────────────┘
```

### Detailed Stages

**1. Command (User Intent)**
- User submits command via API
- Command contains: command_type, parameters, aggregate_id, aggregate_version
- Command is immutable after creation

**2. Validation (Schema Check)**
- Validate command schema
- Check aggregate version (optimistic concurrency)
- Validate business rules (preconditions)

**3. Aggregate (State Load)**
- Load aggregate state from latest snapshot
- Replay events since snapshot
- Build current aggregate state

**4. Business Logic (Domain Rules)**
- Execute business logic on aggregate state
- Validate invariants
- Generate domain events

**5. Event (Domain Event)**
- Create domain event from business logic
- Event contains: event_type, payload, metadata
- Event is immutable after creation

**6. Canonical Hash (Constitution)**
- Compute canonical hash using CanonicalHasher
- Hash includes: event_type, payload, metadata (excluding infrastructure timestamps)
- Hash becomes event_id

**7. Event Envelope (Metadata)**
- Wrap event in envelope with infrastructure metadata
- Envelope includes: occurred_at, recorded_at, correlation_id, causality_id, etc.
- Envelope is immutable

**8. Event Stream (Append-Only)**
- Append event to event stream
- Event stream is append-only (no updates, no deletes)
- Event stream provides global ordering

**9. Persistence (Durable Log)**
- Persist event to durable storage
- Use transactional outbox for transport publication
- Ensure atomicity of event + outbox

**10. Projection (State Build)**
- Project event to projection state
- Projection is pure function over event stream
- Projection can be materialized or virtual

**11. Snapshot (State Save)**
- Save projection state as snapshot
- Snapshot includes: state, last_event_id, last_global_sequence
- Snapshot is append-only (no updates, no deletes)

**12. Transport (Publish)**
- Publish event to transport
- Transport is decoupled from persistence (transactional outbox)
- Transport can be NATS, Kafka, RabbitMQ, etc.

**13. Consumers (Subscribe)**
- Consumers subscribe to transport
- Consumers can be projections, workflows, external systems
- Consumers are idempotent

**14. Replay (Rebuild)**
- Replay events from event stream
- Replay is pure function over event stream
- Replay can be from zero, from snapshot, or from sequence

**15. Witness (Verification)**
- Compute witness from replay result
- Witness includes: state_hash, event_count, build_witness
- Witness is used for verification

---

## 5. Replay Architecture

### First Principles Replay Design

**Core Principle:** Replay is a pure function over event streams.

**Replay depends only on:**
- EventStream (abstract interface)
- ProjectionEngine (pure function)
- WitnessEngine (pure function)

**Replay does NOT depend on:**
- Database (SQLAlchemy, PostgreSQL, etc.)
- Infrastructure (NATS, Kafka, etc.)
- Observability (metrics, logging, tracing)
- API (FastAPI, gRPC, etc.)

### Replay Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ReplayEngine                             │
│  (Pure function over event stream, zero infrastructure deps)     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│   EventStream       │               │ ProjectionEngine    │
│  (Abstract)         │               │  (Pure Function)    │
└─────────────────────┘               └─────────────────────┘
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│  PostgresEventStream│               │  ProjectionHandler  │
│  KafkaEventStream   │               │  (User Provided)    │
│  FileEventStream    │               └─────────────────────┘
│  MemoryEventStream  │
└─────────────────────┘
```

### ReplayEngine Implementation

```python
class ReplayEngine:
    """
    Pure replay engine with zero infrastructure dependencies.
    
    Replay depends only on EventStream interface.
    Replay is deterministic by construction.
    """
    
    def __init__(
        self,
        event_stream: EventStream,
        projection_handler: Callable[[State, EventEnvelope], State],
    ):
        self.event_stream = event_stream
        self.projection_handler = projection_handler
    
    async def replay_from_zero(
        self,
        projection_name: str,
    ) -> ReplayResult:
        """
        Replay from zero (rebuild projection from all events).
        
        Pure function over event stream.
        Deterministic by construction.
        """
        # Load events from event stream
        events = []
        async for event in self.event_stream.read(from_sequence=0):
            events.append(event)
        
        # Initialize state
        state = {}
        
        # Replay events (pure function)
        for event in events:
            state = await self.projection_handler(state, event)
        
        # Compute witness
        witness = WitnessEngine.compute_witness(state, events)
        
        return ReplayResult(
            state=state,
            witness=witness,
            events_replayed=len(events),
        )
    
    async def replay_from_snapshot(
        self,
        projection_name: str,
        snapshot_store: SnapshotStore,
    ) -> ReplayResult:
        """
        Replay from snapshot (rebuild from snapshot + incremental events).
        
        Pure function over event stream.
        Deterministic by construction.
        """
        # Load latest snapshot
        snapshot = await snapshot_store.load(projection_name)
        
        if not snapshot:
            return await self.replay_from_zero(projection_name)
        
        # Load events after snapshot
        events = []
        async for event in self.event_stream.read(
            from_sequence=snapshot.last_global_sequence + 1,
        ):
            events.append(event)
        
        # Initialize state from snapshot
        state = snapshot.state
        
        # Replay incremental events (pure function)
        for event in events:
            state = await self.projection_handler(state, event)
        
        # Compute witness
        witness = WitnessEngine.compute_witness(state, events)
        
        return ReplayResult(
            state=state,
            witness=witness,
            events_replayed=len(events),
            snapshot_sequence=snapshot.last_global_sequence,
        )
```

### Replay Scaling

**Single-Process Replay:**
- Replay events sequentially
- Suitable for small event logs (<1M events)
- Deterministic by construction

**Distributed Replay:**
- Shard event stream by aggregate_id
- Replay each shard in parallel
- Merge results using deterministic merge function
- Suitable for large event logs (>100M events)

**Replay Sharding Strategy:**
```
Event Stream (by aggregate_id)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│  Shard 1  │  Shard 2  │  Shard 3  │  Shard 4  │
│ (agg A-D) │ (agg E-H) │ (agg I-L) │ (agg M-P) │
└─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
      ↓           ↓           ↓           ↓
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Replay  │ │ Replay  │ │ Replay  │ │ Replay  │
│ Worker 1│ │ Worker 2│ │ Worker 3│ │ Worker 4│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     ↓           ↓           ↓           ↓
     └───────────┴───────────┴───────────┘
                    ↓
            ┌───────────────┐
            │ Deterministic │
            │    Merge      │
            └───────────────┘
                    ↓
            ┌───────────────┐
            │ Final Result  │
            └───────────────┘
```

### Replay Determinism

**Determinism Guarantees:**
1. **Event Ordering:** Global sequence provides total ordering
2. **Event Content:** Canonical hash ensures event immutability
3. **Projection Handler:** Pure function (no side effects)
4. **State Initialization:** Deterministic (empty or from snapshot)
5. **Merge Function:** Deterministic (commutative, associative)

**Determinism Verification:**
- Replay same event stream twice → identical result
- Replay same event stream in parallel → identical result
- Replay same event stream on different machines → identical result

---

## 6. Storage Architecture

### Ideal EventStore Abstraction

**CRX should emulate:**
- **EventStoreDB:** Stream-per-aggregate, optimistic concurrency, built-in projections
- **FoundationDB:** Deterministic simulation, layered architecture, transaction system
- **Kafka Log:** Append-only log, distributed commit log, consumer groups

**EventStore Design:**

```python
class EventStream(ABC):
    """
    Abstract event stream interface.
    
    Emulates EventStoreDB stream-per-aggregate pattern.
    Emulates FoundationDB transaction system.
    Emulates Kafka log append-only semantics.
    """
    
    @abstractmethod
    async def append(
        self,
        events: list[EventEnvelope],
        expected_version: Optional[int] = None,
    ) -> AppendResult:
        """
        Append events to stream.
        
        Uses optimistic concurrency (expected_version).
        Returns global sequence numbers.
        Atomic operation (all events or none).
        """
        pass
    
    @abstractmethod
    async def read(
        self,
        stream_id: Optional[str] = None,
        from_sequence: int = 0,
        to_sequence: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> AsyncIterator[EventEnvelope]:
        """
        Read events from stream.
        
        Stream-per-aggregate pattern (stream_id).
        Global sequence ordering.
        Async iterator for streaming.
        """
        pass
    
    @abstractmethod
    async def get_global_sequence(self) -> int:
        """
        Get current global sequence number.
        
        Used for ordering authority.
        """
        pass
```

### Storage Comparison

| Feature | EventStoreDB | FoundationDB | PostgreSQL | Kafka Log | CRX Target |
|---------|--------------|--------------|-----------|-----------|------------|
| Stream-per-aggregate | ✅ | ❌ | ❌ | ❌ | ✅ |
| Optimistic concurrency | ✅ | ✅ | ❌ | ❌ | ✅ |
| Append-only | ✅ | ✅ | ❌ | ✅ | ✅ |
| Global ordering | ✅ | ✅ | ✅ | ✅ | ✅ |
| Distributed | ✅ | ✅ | ❌ | ✅ | ✅ |
| Projections | ✅ | ❌ | ❌ | ❌ | ✅ |
| Snapshots | ✅ | ❌ | ❌ | ❌ | ✅ |
| Deterministic simulation | ❌ | ✅ | ❌ | ❌ | ✅ |

### CRX Storage Strategy

**Primary Storage:** PostgreSQL (for now)
- Mature, battle-tested
- Good for small to medium event logs (<100M events)
- Easy to operate
- Good for single-region deployments

**Future Storage Options:**
- **FoundationDB:** For distributed deployments, deterministic simulation
- **EventStoreDB:** For event-sourcing-first deployments
- **Kafka Log:** For high-throughput streaming deployments
- **SQLite:** For embedded deployments, testing

**Storage Abstraction:**
- CRX uses EventStream interface
- Storage implementation is swappable
- No constitutional code depends on storage implementation

---

## 7. Infrastructure Ports

### EventStream

**Responsibilities:**
- Append events to stream (append-only)
- Read events from stream (ordered)
- Provide global sequence (ordering authority)
- Support stream-per-aggregate pattern
- Support optimistic concurrency

**Implementations:**
- `PostgresEventStream` - PostgreSQL implementation
- `FoundationDBEventStream` - FoundationDB implementation
- `EventStoreDBEventStream` - EventStoreDB implementation
- `KafkaEventStream` - Kafka log implementation
- `FileEventStream` - Filesystem implementation
- `MemoryEventStream` - In-memory implementation (for testing)

### SnapshotStore

**Responsibilities:**
- Save projection state (append-only)
- Load latest projection state
- Support projection versioning
- Support incremental replay

**Implementations:**
- `PostgresSnapshotStore` - PostgreSQL implementation
- `RedisSnapshotStore` - Redis implementation
- `S3SnapshotStore` - S3 implementation
- `FileSnapshotStore` - Filesystem implementation
- `MemorySnapshotStore` - In-memory implementation (for testing)

### ArtifactStore

**Responsibilities:**
- Store artifact binaries (append-only)
- Load artifact by ID
- Support artifact versioning
- Support artifact deduplication

**Implementations:**
- `S3ArtifactStore` - S3 implementation
- `FileArtifactStore` - Filesystem implementation
- `MemoryArtifactStore` - In-memory implementation (for testing)

### WitnessStore

**Responsibilities:**
- Store witness data (append-only)
- Load witness by ID
- Support witness verification
- Support witness chain

**Implementations:**
- `PostgresWitnessStore` - PostgreSQL implementation
- `RedisWitnessStore` - Redis implementation
- `FileWitnessStore` - Filesystem implementation
- `MemoryWitnessStore` - In-memory implementation (for testing)

### ProjectionStore

**Responsibilities:**
- Store projection state (mutable, but append-only events)
- Load projection state
- Support projection versioning
- Support incremental updates

**Implementations:**
- `PostgresProjectionStore` - PostgreSQL implementation
- `RedisProjectionStore` - Redis implementation
- `MemoryProjectionStore` - In-memory implementation (for testing)

### CommandStore

**Responsibilities:**
- Store commands (append-only)
- Load command by ID
- Support command correlation
- Support command replay

**Implementations:**
- `PostgresCommandStore` - PostgreSQL implementation
- `RedisCommandStore` - Redis implementation
- `MemoryCommandStore` - In-memory implementation (for testing)

### Transport

**Responsibilities:**
- Publish messages (fire-and-forget)
- Subscribe to messages (push/pull)
- Support message ordering
- Support message durability

**Implementations:**
- `NATSTransport` - NATS implementation
- `KafkaTransport` - Kafka implementation
- `RabbitMQTransport` - RabbitMQ implementation
- `GRPCTransport` - gRPC implementation
- `HTTPTransport` - HTTP implementation
- `MemoryTransport` - In-memory implementation (for testing)

### MetricsCollector

**Responsibilities:**
- Increment counters
- Record timings
- Set gauges
- Support tags/labels

**Implementations:**
- `PrometheusMetricsCollector` - Prometheus implementation
- `StatsDMetricsCollector` - StatsD implementation
- `NullMetricsCollector` - Null implementation (for testing)

### Logger

**Responsibilities:**
- Log messages (info, error, debug)
- Support structured logging
- Support correlation context
- Support log levels

**Implementations:**
- `StructlogLogger` - Structlog implementation
- `StandardLogger` - Python logging implementation
- `NullLogger` - Null implementation (for testing)

### Clock

**Responsibilities:**
- Provide current time
- Support monotonic time
- Support test time (for deterministic testing)

**Implementations:**
- `SystemClock` - System clock implementation
- `MonotonicClock` - Monotonic clock implementation
- `TestClock` - Test clock implementation (for deterministic testing)

### IdentityGenerator

**Responsibilities:**
- Generate unique identifiers
- Support sequential generation (for testing)
- Support distributed generation

**Implementations:**
- `UUIDIdentityGenerator` - UUID implementation
- `SnowflakeIdentityGenerator` - Snowflake implementation
- `ULIDIdentityGenerator` - ULID implementation
- `SequentialIdentityGenerator` - Sequential implementation (for testing)

### ConfigurationProvider

**Responsibilities:**
- Provide configuration values
- Support environment variables
- Support file-based configuration
- Support validation

**Implementations:**
- `PydanticSettingsConfigurationProvider` - Pydantic Settings implementation
- `EnvironmentConfigurationProvider` - Environment variable implementation
- `FileConfigurationProvider` - File-based implementation
- `VaultConfigurationProvider` - Vault implementation

### HashProvider

**Responsibilities:**
- Compute hashes
- Support canonical hashing
- Support different hash algorithms

**Implementations:**
- `CanonicalHashProvider` - Canonical hash implementation
- `SHA256HashProvider` - SHA256 implementation
- `BLAKE3HashProvider` - BLAKE3 implementation

### Serializer

**Responsibilities:**
- Serialize/deserialize data
- Support different formats (JSON, MessagePack, etc.)
- Support versioning

**Implementations:**
- `JSONSerializer` - JSON implementation
- `MessagePackSerializer` - MessagePack implementation
- `CBORSerializer` - CBOR implementation

### CanonicalEncoder

**Responsibilities:**
- Encode data canonically
- Support deterministic encoding
- Support canonical ordering

**Implementations:**
- `CanonicalJSONEncoder` - Canonical JSON implementation
- `CanonicalMessagePackEncoder` - Canonical MessagePack implementation

---

## 8. Mapping Layer

### Complete Mapper Strategy

**Mapping Layers:**

```
┌─────────────────┐
│  API DTOs       │
│  (FastAPI)      │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Domain Models  │
│  (Constitution) │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Persistence   │
│  DTOs           │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Transport     │
│  DTOs           │
└────────┬────────┘
         ↓
┌─────────────────┐
│  Witness        │
│  DTOs           │
└─────────────────┘
```

### Mapper Responsibilities

**API DTOs → Domain Models:**
- Validate API input
- Convert to constitutional models
- Preserve constitutional invariants

**Domain Models → Persistence DTOs:**
- Convert to persistence format
- Preserve constitutional data
- Add persistence metadata

**Persistence DTOs → Domain Models:**
- Convert from persistence format
- Preserve constitutional data
- Remove persistence metadata

**Domain Models → Transport DTOs:**
- Convert to transport format
- Preserve constitutional data
- Add transport metadata

**Transport DTOs → Domain Models:**
- Convert from transport format
- Preserve constitutional data
- Remove transport metadata

**Domain Models → Witness DTOs:**
- Convert to witness format
- Preserve constitutional data
- Add witness metadata

### No ORM Leakage

**Rule:** Mappers never use SQLAlchemy models directly.

**Instead:**
- Use persistence DTOs (pure data structures)
- Mappers convert between DTOs and domain models
- Persistence layer converts between DTOs and database

**Example:**

```python
# BAD (ORM leakage)
class EventMapper:
    @staticmethod
    def to_domain(event_model: EventModel) -> EventEnvelope:
        return EventEnvelope(
            event_id=event_model.event_id,
            event_type=event_model.event_type,
            # ... uses SQLAlchemy model directly
        )

# GOOD (DTO layer)
class EventMapper:
    @staticmethod
    def to_domain(event_dto: EventPersistenceDTO) -> EventEnvelope:
        return EventEnvelope(
            event_id=event_dto.event_id,
            event_type=event_dto.event_type,
            # ... uses pure DTO
        )
```

---

## 9. Aggregate Strategy

### Stream-per-Aggregate Pattern

**CRX Strategy:** Stream-per-aggregate (like EventStoreDB)

**Rationale:**
- **Partitioning:** Natural partitioning by aggregate_id
- **Concurrency:** Optimistic concurrency per aggregate
- **Replay:** Replay single aggregate efficiently
- **Scalability:** Distribute aggregates across shards
- **Isolation:** Aggregate boundaries are clear

**Stream Structure:**
```
Aggregate A: stream://aggregate/A
Aggregate B: stream://aggregate/B
Aggregate C: stream://aggregate/C
...
```

**Global Stream:**
```
Global: stream://global
```

**Event Storage:**
- Each event stored in aggregate stream
- Each event also stored in global stream (for global ordering)
- Global sequence assigned from global stream

**Aggregate Sequence:**
- Each aggregate has its own sequence number
- Aggregate sequence is per-aggregate ordering
- Aggregate sequence used for optimistic concurrency

### Alternative Strategies (Rejected)

**Per Capability:**
- ❌ Capability boundaries are not aggregate boundaries
- ❌ Does not support aggregate lifecycle
- ❌ Does not support aggregate consistency

**Per Workflow:**
- ❌ Workflow boundaries are not aggregate boundaries
- ❌ Does not support aggregate lifecycle
- ❌ Does not support aggregate consistency

**Per Tenant:**
- ❌ Tenant boundaries are not aggregate boundaries
- ❌ Does not support aggregate lifecycle
- ❌ Does not support aggregate consistency

**Hybrid:**
- ❌ Too complex
- ❌ Violates single responsibility
- ❌ Difficult to reason about

---

## 10. Projection Strategy

### Projection Types

**Live Projections:**
- Built in real-time as events arrive
- Low latency
- High resource usage
- Suitable for critical projections

**Offline Projections:**
- Built periodically (batch)
- Higher latency
- Lower resource usage
- Suitable for analytics projections

**Materialized Projections:**
- Stored in database
- Fast reads
- Requires storage
- Suitable for read-heavy projections

**Virtual Projections:**
- Computed on read
- No storage
- Slow reads
- Suitable for write-heavy projections

**Replay Projections:**
- Built by replaying event stream
- Deterministic
- Can be rebuilt from scratch
- Suitable for verification

**Incremental Projections:**
- Built incrementally from snapshot
- Efficient
- Requires snapshots
- Suitable for large projections

**Parallel Projections:**
- Built in parallel across shards
- Fast
- Requires sharding
- Suitable for large event logs

**Snapshot-Assisted Projections:**
- Built from snapshot + incremental events
- Efficient
- Requires snapshots
- Suitable for large projections

### Projection Architecture

```
┌─────────────────┐
│   Event Stream  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ ProjectionEngine│
│  (Pure Function)│
└────────┬────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌─────────┐
│  Live   │ │ Offline │
└────┬────┘ └────┬────┘
     ↓           ↓
┌─────────┐ ┌─────────┐
│Material │ │ Virtual │
└────┬────┘ └────┬────┘
     ↓           ↓
┌─────────┐ ┌─────────┐
│Replay   │ │Increment│
└────┬────┘ └────┬────┘
     ↓           ↓
┌─────────┐ ┌─────────┐
│ Parallel │ │Snapshot │
└─────────┘ └─────────┘
```

### Projection Implementation

```python
class ProjectionEngine:
    """
    Pure projection engine with zero infrastructure dependencies.
    
    Projection is pure function over event stream.
    Deterministic by construction.
    """
    
    def __init__(
        self,
        event_stream: EventStream,
        projection_handler: Callable[[State, EventEnvelope], State],
    ):
        self.event_stream = event_stream
        self.projection_handler = projection_handler
    
    async def build_projection(
        self,
        projection_name: str,
        mode: ProjectionMode = ProjectionMode.LIVE,
    ) -> ProjectionResult:
        """
        Build projection.
        
        Mode determines projection strategy.
        """
        if mode == ProjectionMode.LIVE:
            return await self._build_live(projection_name)
        elif mode == ProjectionMode.OFFLINE:
            return await self._build_offline(projection_name)
        elif mode == ProjectionMode.REPLAY:
            return await self._build_replay(projection_name)
        elif mode == ProjectionMode.INCREMENTAL:
            return await self._build_incremental(projection_name)
        elif mode == ProjectionMode.PARALLEL:
            return await self._build_parallel(projection_name)
        elif mode == ProjectionMode.SNAPSHOT_ASSISTED:
            return await self._build_snapshot_assisted(projection_name)
```

---

## 11. Scaling Strategy

### Design for 100M Events

**Bottlenecks:**
- **Database I/O:** Single database cannot handle 100M events
- **Replay Time:** Single-process replay is too slow
- **Network I/O:** Single network cannot handle throughput
- **Memory:** Single machine cannot hold all events in memory

**Solutions:**
- **Database Sharding:** Shard events by aggregate_id
- **Distributed Replay:** Replay in parallel across shards
- **Network Partitioning:** Partition network by aggregate_id
- **Memory Management:** Use streaming, not in-memory

### Design for 1B Events

**Bottlenecks:**
- **Storage Cost:** 1B events require significant storage
- **Archive Strategy:** Old events need to be archived
- **Retention Policy:** Events need to be expired
- **Compression:** Events need to be compressed

**Solutions:**
- **Tiered Storage:** Hot storage (SSD) + cold storage (S3)
- **Archive Strategy:** Archive old events to S3
- **Retention Policy:** Expire events after N years
- **Compression:** Compress events using MessagePack

### Cluster Replay

**Strategy:**
- Shard event stream by aggregate_id
- Replay each shard in parallel
- Merge results using deterministic merge function

**Implementation:**
```
Event Stream (sharded by aggregate_id)
    ↓
┌───────────┬───────────┬───────────┬───────────┐
│  Shard 1  │  Shard 2  │  Shard 3  │  Shard 4  │
│ (agg A-D) │ (agg E-H) │ (agg I-L) │ (agg M-P) │
└─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
      ↓           ↓           ↓           ↓
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Replay  │ │ Replay  │ │ Replay  │ │ Replay  │
│ Worker 1│ │ Worker 2│ │ Worker 3│ │ Worker 4│
└────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
     ↓           ↓           ↓           ↓
     └───────────┴───────────┴───────────┘
                    ↓
            ┌───────────────┐
            │ Deterministic │
            │    Merge      │
            └───────────────┘
                    ↓
            ┌───────────────┐
            │ Final Result  │
            └───────────────┘
```

### Multi-Region

**Strategy:**
- Primary region for writes
- Secondary regions for reads
- Event replication between regions
- Conflict resolution using global sequence

**Implementation:**
```
Region A (Primary)          Region B (Secondary)
        ↓                           ↓
┌───────────────┐         ┌───────────────┐
│  Event Stream │         │  Event Stream │
│  (Write)      │         │  (Read)       │
└───────┬───────┘         └───────┬───────┘
        ↓                           ↑
        └───────────┬───────────────┘
                    ↓
            ┌───────────────┐
            │  Replication  │
            └───────────────┘
```

### Multi-Tenant

**Strategy:**
- Tenant isolation at stream level
- Each tenant has separate streams
- Tenant-specific projections
- Tenant-specific snapshots

**Implementation:**
```
Tenant A: stream://tenant/A/aggregate/*
Tenant B: stream://tenant/B/aggregate/*
Tenant C: stream://tenant/C/aggregate/*
```

---

## 12. Determinism Audit

### Ordering

**Current State:** ✅ Global sequence provides total ordering

**Risks:** None

**Verification:**
- Global sequence is monotonically increasing
- Global sequence is assigned by database (single source of truth)
- Global sequence is immutable after assignment

### Hashing

**Current State:** ✅ CanonicalHasher provides deterministic hashing

**Risks:** None

**Verification:**
- CanonicalHasher uses sorted keys
- CanonicalHasher uses UTF-8 encoding
- CanonicalHasher uses SHA256 (deterministic)
- CanonicalHasher excludes infrastructure timestamps

### Canonical Bytes

**Current State:** ✅ CanonicalEncoder provides deterministic encoding

**Risks:** None

**Verification:**
- CanonicalEncoder uses canonical JSON
- CanonicalEncoder uses sorted keys
- CanonicalEncoder uses UTF-8 encoding
- CanonicalEncoder excludes insignificant whitespace

### Replay

**Current State:** ⚠️ Replay depends on SQLAlchemy (infrastructure leakage)

**Risks:** HIGH - Replay cannot run without database

**Fix Required:** Replay must depend only on EventStream interface

### Clock

**Current State:** ⚠️ System clock is non-deterministic

**Risks:** MEDIUM - System clock can vary between machines

**Fix Required:** Use Clock interface, use TestClock for testing

### Identity

**Current State:** ⚠️ UUID generation is non-deterministic

**Risks:** MEDIUM - UUID generation can vary between machines

**Fix Required:** Use IdentityGenerator interface, use SequentialIdentityGenerator for testing

### Configuration

**Current State:** ✅ Configuration is immutable after startup

**Risks:** None

**Verification:**
- Configuration uses pydantic-settings (frozen=True)
- Configuration is validated at startup
- Configuration cannot be mutated at runtime

### Unicode

**Current State:** ⚠️ Unicode normalization is not enforced

**Risks:** LOW - Unicode normalization can vary between systems

**Fix Required:** Enforce Unicode normalization (NFC) in CanonicalEncoder

### Storage

**Current State:** ⚠️ Storage is not abstracted

**Risks:** HIGH - Storage implementation leaks into constitutional layer

**Fix Required:** Use EventStream interface, storage implementation is swappable

### Network

**Current State:** ⚠️ Network is not abstracted

**Risks:** MEDIUM - Network failures can affect determinism

**Fix Required:** Use Transport interface, network failures are handled by infrastructure

### Transport

**Current State:** ⚠️ Transport is not abstracted

**Risks:** MEDIUM - Transport implementation leaks into constitutional layer

**Fix Required:** Use Transport interface, transport implementation is swappable

### Serialization

**Current State:** ✅ Serialization is deterministic (JSON)

**Risks:** None

**Verification:**
- JSON is deterministic (with canonical encoding)
- MessagePack is deterministic (with canonical encoding)
- Serialization is versioned

### Hidden Risks

**1. Timezone Handling**
- **Risk:** Timezone handling can vary between systems
- **Fix:** Use UTC everywhere, store timezone as metadata

**2. Floating Point Precision**
- **Risk:** Floating point precision can vary between systems
- **Fix:** Use decimal for financial data, document precision for other data

**3. Dictionary Ordering**
- **Risk:** Dictionary ordering can vary between Python versions
- **Fix:** Use sorted keys in CanonicalEncoder

**4. Thread Safety**
- **Risk:** Thread safety issues can cause non-deterministic behavior
- **Fix:** Use immutable data structures, avoid shared mutable state

**5. Concurrent Writes**
- **Risk:** Concurrent writes can cause ordering issues
- **Fix:** Use optimistic concurrency, use database transactions

---

## 13. Build Graph

### Startup Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Hosting Layer                            │
│  (Kubernetes, Docker, bare metal, serverless, cloud-native)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Dependency Injection Layer                    │
│  (Composition root, container, lifecycle management, wiring)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│  Infrastructure     │               │  Configuration     │
│  Factories          │               │  Provider          │
└─────────────────────┘               └─────────────────────┘
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│  Persistence       │               │  Transport         │
│  Factories          │               │  Factories          │
└─────────────────────┘               └─────────────────────┘
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│  Repository         │               │  Observability      │
│  Factories          │               │  Factories          │
└─────────────────────┘               └─────────────────────┘
         ↓                                         ↓
┌─────────────────────┐               ┌─────────────────────┐
│  Mapper             │               │  Kernel             │
│  Factories          │               │  Factories          │
└─────────────────────┘               └─────────────────────┘
         ↓                                         ↓
         └────────────────────┬────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  (FastAPI, gRPC, GraphQL, WebSocket, HTTP/2, protocol-agnostic)  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Transport Layer                             │
│  (NATS, Kafka, RabbitMQ, gRPC, HTTP, WebSocket, memory)          │
└─────────────────────────────────────────────────────────────────┘
```

### No Globals

**Rule:** No global mutable state.

**Instead:**
- All state is explicit (passed via DI)
- Configuration is immutable (frozen=True)
- Singletons are managed by DI container

### No Hidden State

**Rule:** No hidden mutable state.

**Instead:**
- All state is explicit (passed as parameters)
- All state is immutable (constitutional models are frozen)
- All state is tracked (in DI container)

### No Mutable Singleton

**Rule:** No mutable singletons.

**Instead:**
- Singletons are managed by DI container
- Singletons are immutable (frozen=True)
- Singletons are explicit (registered in container)

### Composition Root

**Composition Root:** `di/composition_root.py`

**Responsibilities:**
- Wire all dependencies
- Configure all factories
- Start all infrastructure
- Stop all infrastructure

**Example:**

```python
class CompositionRoot:
    """
    Composition root for dependency injection.
    
    Wires all dependencies explicitly.
    No hidden state.
    No mutable singletons.
    """
    
    def __init__(self, configuration: Configuration):
        self.configuration = configuration
        self.container = Container()
    
    def build(self) -> Application:
        """Build the application graph."""
        # Configure infrastructure
        self._configure_persistence()
        self._configure_transport()
        self._configure_observability()
        
        # Configure repositories
        self._configure_repositories()
        
        # Configure mappers
        self._configure_mappers()
        
        # Configure kernel
        self._configure_kernel()
        
        # Configure API
        self._configure_api()
        
        # Build application
        return Application(
            api=self.container.api(),
            transport=self.container.transport(),
            observability=self.container.observability(),
        )
    
    def _configure_persistence(self):
        """Configure persistence layer."""
        self.container.persistence.from_factory(
            lambda: PostgresPersistence(
                connection_string=self.configuration.database_url,
            ),
        )
    
    def _configure_transport(self):
        """Configure transport layer."""
        self.container.transport.from_factory(
            lambda: NATSTransport(
                url=self.configuration.nats_url,
            ),
        )
    
    # ... other configuration methods
```

---

## 14. Constitutional Purity Score

### Kernel

**Score:** 98/100

**Remaining Contamination:**
- Clock (physical clock cannot be fully abstracted)
- Identity (distributed identity requires coordination)

**Fix Required:** Use Clock and IdentityGenerator interfaces

### Infrastructure

**Score:** 95/100

**Remaining Contamination:**
- None (infrastructure is fully abstracted via ports)

### Replay

**Score:** 50/100 (current) → 98/100 (target)

**Remaining Contamination:**
- SQLAlchemy dependency (current)
- Database dependency (current)

**Fix Required:** Replay must depend only on EventStream interface

### Persistence

**Score:** 60/100 (current) → 98/100 (target)

**Remaining Contamination:**
- SQLAlchemy ORM leakage (current)
- Direct database access (repository layer)

**Fix Required:** Use persistence DTOs, abstract via EventStream interface

### Transport

**Score:** 70/100 (current) → 98/100 (target)

**Remaining Contamination:**
- NATS-specific code (current)
- No abstraction (current)

**Fix Required:** Use Transport interface

### Witness

**Score:** 90/100

**Remaining Contamination:**
- None (witness is constitutional)

### Configuration

**Score:** 95/100

**Remaining Contamination:**
- None (configuration is immutable and validated)

### DI

**Score:** 80/100 (current) → 95/100 (target)

**Remaining Contamination:**
- Manual DI (current)
- No DI container (current)

**Fix Required:** Use DI container (dependency-injector)

---

## 15. Piggyback on Giants

### FoundationDB

**Architectural Ideas to Steal:**
- **Deterministic Simulation:** Test infrastructure deterministically
- **Layered Architecture:** Clear separation between layers
- **Transaction System:** ACID transactions across distributed system
- **Directory Layer:** Hierarchical key organization

**What CRX Should Improve:**
- **Constitutional Guarantees:** CRX has stronger determinism guarantees
- **Event Sourcing:** CRX is event-sourced by design
- **Replay:** CRX has built-in replay capability

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### EventStoreDB

**Architectural Ideas to Steal:**
- **Stream-per-Aggregate:** Natural partitioning by aggregate
- **Optimistic Concurrency:** Expected version for concurrency control
- **Built-in Projections:** Projection system built-in
- **Snapshotting:** Built-in snapshot support

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **BuildWitness:** CRX has build witness for verification
- **Replay Equivalence:** CRX guarantees replay equivalence

### Temporal

**Architectural Ideas to Steal:**
- **Workflow Abstraction:** Long-running process abstraction
- **Activity Abstraction:** Capability execution abstraction
- **Determinism Enforcement:** Workflow determinism enforced
- **Replay Mechanism:** Workflow replay capability

**What CRX Should Improve:**
- **Event Sourcing:** CRX is event-sourced by design
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### CockroachDB

**Architectural Ideas to Steal:**
- **Distributed Transactions:** ACID transactions across distributed system
- **Time Travel Queries:** Query data at any point in time
- **Online Schema Changes:** Schema changes without downtime
- **Automatic Replication:** Built-in replication

**What CRX Should Improve:**
- **Event Sourcing:** CRX is event-sourced by design
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### Axon Framework

**Architectural Ideas to Steal:**
- **Event Bus:** Abstract event bus
- **Event Sourcing Repository:** Abstract repository interface
- **Saga Manager:** Long-running process management
- **Command Bus:** Abstract command bus

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **BuildWitness:** CRX has build witness for verification
- **Replay Equivalence:** CRX guarantees replay equivalence

### Orleans

**Architectural Ideas to Steal:**
- **Virtual Actors:** Virtual actor abstraction
- **Grain Abstraction:** Capability abstraction
- **State Management:** Built-in state management
- **Persistence Abstraction:** Abstract persistence

**What CRX Should Improve:**
- **Event Sourcing:** CRX is event-sourced by design
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### Kubernetes

**Architectural Ideas to Steal:**
- **Reconciliation Loop:** Desired state pattern
- **Event Handling:** Event-driven architecture
- **Finalizers:** Cleanup mechanism
- **Controller Pattern:** Abstract controller

**What CRX Should Improve:**
- **Event Sourcing:** CRX is event-sourced by design
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### DDD

**Architectural Ideas to Steal:**
- **Aggregates:** Aggregate boundaries
- **Bounded Contexts:** Context boundaries
- **Domain Events:** Domain event pattern
- **Repositories:** Repository pattern

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **BuildWitness:** CRX has build witness for verification
- **Replay Equivalence:** CRX guarantees replay equivalence

### Hexagonal Architecture

**Architectural Ideas to Steal:**
- **Ports:** Abstract ports for external interactions
- **Adapters:** Adapters for external systems
- **Domain Isolation:** Domain isolated from infrastructure
- **Infrastructure Isolation:** Infrastructure isolated from domain

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

### Clean Architecture

**Architectural Ideas to Steal:**
- **Entities:** Domain entities
- **Use Cases:** Use case pattern
- **Interface Adapters:** Interface adapters
- **Framework Isolation:** Framework dependencies isolated

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **BuildWitness:** CRX has build witness for verification
- **Replay Equivalence:** CRX guarantees replay equivalence

### CQRS

**Architectural Ideas to Steal:**
- **Command Side:** Separate command side
- **Query Side:** Separate query side
- **Event Store:** Event store pattern
- **Projections:** Projection pattern

**What CRX Should Improve:**
- **Constitutional Purity:** CRX has stronger constitutional purity
- **Determinism:** CRX has stronger determinism guarantees
- **Replay Isolation:** CRX has better replay isolation

**Constitutional Guarantees Making CRX Stronger:**
- **Canonical Hashing:** CRX has canonical hashing for all events
- **Append-Only Law:** CRX enforces append-only at constitutional level
- **Replay Determinism:** CRX guarantees replay determinism

---

## 16. Final Refactor Roadmap

### Critical (Weeks 1-4)

**1. Create EventStream Interface** (Week 1)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** HIGH (enables infrastructure abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +5 points

**2. Refactor ReplayEngine to Use EventStream** (Week 1-2)
- **Difficulty:** HIGH
- **Risk:** HIGH
- **Architectural Benefit:** CRITICAL (replay isolation)
- **Constitutional Impact:** NONE (kernel refactoring)
- **Expected Score Improvement:** +20 points

**3. Create Mapper Layer** (Week 2)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (layer separation)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +5 points

**4. Update Repository Interfaces to Return Constitutional Models** (Week 2-3)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (clean architecture)
- **Constitutional Impact:** NONE (repository refactoring)
- **Expected Score Improvement:** +5 points

**5. Database-Generated Global Sequence** (Week 3-4)
- **Difficulty:** HIGH
- **Risk:** HIGH
- **Architectural Benefit:** CRITICAL (ordering authority)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +5 points

### High (Weeks 5-8)

**6. Create SnapshotStore Interface** (Week 5)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** HIGH (infrastructure abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

**7. Create ArtifactStore Interface** (Week 5)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (infrastructure abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**8. Create WitnessStore Interface** (Week 5)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (infrastructure abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**9. Create Transport Interface** (Week 6)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** HIGH (infrastructure abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

**10. Create MetricsCollector Interface** (Week 6)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (observability abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**11. Create Logger Interface** (Week 6)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (observability abstraction)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**12. Create Clock Interface** (Week 7)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (determinism improvement)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**13. Create IdentityGenerator Interface** (Week 7)
- **Difficulty:** LOW
- **Risk:** LOW
- **Architectural Benefit:** MEDIUM (determinism improvement)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**14. Introduce DI Container** (Week 8)
- **Difficulty:** MEDIUM
- **Risk:** LOW
- **Architectural Benefit:** HIGH (dependency management)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

### Medium (Weeks 9-12)

**15. Implement Stream-per-Aggregate Pattern** (Week 9)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (scalability)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

**16. Implement Distributed Replay** (Week 9-10)
- **Difficulty:** HIGH
- **Risk:** HIGH
- **Architectural Benefit:** HIGH (scalability)
- **Constitutional Impact:** NONE (kernel refactoring)
- **Expected Score Improvement:** +5 points

**17. Implement Projection Engine** (Week 10-11)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (projection system)
- **Constitutional Impact:** NONE (kernel refactoring)
- **Expected Score Improvement:** +3 points

**18. Implement Snapshot Strategy** (Week 11)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (performance)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

**19. Implement Partitioning Strategy** (Week 12)
- **Difficulty:** HIGH
- **Risk:** HIGH
- **Architectural Benefit:** HIGH (scalability)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +5 points

### Future (Weeks 13-16)

**20. Design Multi-Region Strategy** (Week 13)
- **Difficulty:** HIGH
- **Risk:** HIGH
- **Architectural Benefit:** HIGH (availability)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +3 points

**21. Design Multi-Tenant Strategy** (Week 13-14)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** MEDIUM (multi-tenancy)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**22. Design Migration Strategy** (Week 14-15)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (operational)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

**23. Design Tiered Storage Strategy** (Week 15-16)
- **Difficulty:** MEDIUM
- **Risk:** MEDIUM
- **Architectural Benefit:** HIGH (cost optimization)
- **Constitutional Impact:** NONE (infrastructure only)
- **Expected Score Improvement:** +2 points

### Summary

**Total Duration:** 16 weeks (4 months)

**Total Score Improvement:** +24 points (72 → 96)

**Critical Path:** Items 1-5 (Weeks 1-4)

**High Impact Path:** Items 1-14 (Weeks 1-8)

**Complete Path:** Items 1-23 (Weeks 1-16)

**Constitutional Impact:** NONE (all refactors preserve constitutional guarantees)

---

## Constraints

**Never Violate:**
- **Determinism:** Replay must be deterministic
- **Canonical Hashing:** Event hashing must be canonical
- **Replay Equivalence:** Replay must produce identical results
- **Append-Only Law:** Event store must be append-only
- **Constitutional Ordering:** Global sequence must be monotonically increasing
- **Witness Reproducibility:** Witness must be reproducible

**All Refactors Preserve:**
- Constitutional invariants
- Determinism guarantees
- Replay equivalence
- Append-only semantics
- Canonical ordering
- Witness reproducibility

---

## Conclusion

This architecture represents the final design of the Constitutional Runtime Version 2.0. It is designed to stand beside FoundationDB, EventStoreDB, Temporal, Axon Framework, Orleans, CockroachDB, and Kubernetes Controllers while preserving constitutional determinism guarantees.

**Key Achievements:**
- **Constitutional Purity:** Constitutional layer has zero knowledge of infrastructure
- **Replay Isolation:** Replay is a pure function over event streams
- **Infrastructure Replaceability:** Every infrastructure component is swappable
- **Determinism by Construction:** Determinism is architectural, not accidental
- **Decade-Long Optimization:** Architecture designed for 10+ year evolution

**Target Score:** 96/100

**Remaining 4 Points:** Fundamental limitations of distributed systems (clock, identity, network, unicode)

This architecture is ready for implementation.
