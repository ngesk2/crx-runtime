# Architectural Discovery

## Phase 0 — Repository Exploration

**Constitutional Phase A1 — Full Architectural Implementation Protocol**

---

# EXECUTIVE SUMMARY

Repository contains 200+ files implementing a constitutional runtime with authorities, services, queues, workers, and schedulers.

**Key Findings:**
- Identity Authority exists but depends on missing serializerAuthority
- Deterministic ID Authority exists
- Time Authority exists with replay support
- Canonical Authority exists (single canonical serializer)
- Replay Log exists (immutable append-only)
- Witness Authority exists (centralized)
- Event Authority exists (NATS/JetStream)
- Multiple persistence implementations (PostgreSQL, Git, EventStore)
- Transaction context exists (LifecycleContext)
- Mission Queue has transactions but publishes events outside transaction
- No Transaction Authority abstraction
- No Persistence Authority abstraction
- No Outbox pattern
- No Idempotency Manager
- No Advisory Locking

---

# RUNTIME

## Execution Model

**Entry Point:** `server.js`

**Components:**
- Express HTTP server
- PostgreSQL connection pool (eventPool)
- Constitutional Runtime orchestration
- Event Authority (NATS/JetStream)
- Object Registry
- Dependency Graph
- Replay Log
- Witness Chain

**Runtime Flow:**
```
HTTP Request → Express → Authority/Service → PostgreSQL → NATS/JetStream
```

---

## Scheduler

**Found:**
- `constitutional_autonomous_scheduler.js` - Mission selection authority
- `dependency_scheduler.js` - Dependency-based scheduling
- `runtime_event_scheduler.js` - Event-based scheduling
- `worker_scheduler.js` - Worker scheduling

**Scheduler Model:**
- Autonomous scheduler runs on interval (default 1 hour)
- Selects RFCs to enqueue as missions
- Uses constitutionalTimeAuthority for timestamps
- Uses deterministicIdAuthority for IDs

---

## Workers

**Found:**
- `background_workers.js`
- `continuous_worker_loop.js`
- `dedicated_workers.js`
- `embedding_worker.js`
- `external_repository_worker.js`
- `ollama_worker.js`
- `qdrant_worker.js`
- `worker_pool.js`
- `worker_queue.js`
- `worker_scheduler.js`
- `worker_health_monitor.js`
- `worker_lifecycle_manager.js`
- `worker_registry.js`

**Worker Model:**
- Pool-based worker execution
- Queue-based work distribution
- Health monitoring
- Lifecycle management

---

## Mission Lifecycle

**Found:**
- `mission_authority.js`
- `mission_generation_service.js`
- `mission_execution_authority.js`
- `mission_queue.js`
- `mission_event_bus.js`
- `mission_execution_graph.js`
- `mission_planner.js`
- `mission_generator.js`
- `mission_rule_authority.js`

**Mission Lifecycle:**
```
Generation → Queue → Claim → Execute → Complete
```

**Current State:**
- Mission generation: No transaction wrapper
- Mission queue: Has transaction wrapper but event publication outside transaction
- Mission execution: No transaction wrapper

---

## Event Lifecycle

**Found:**
- `event_authority.js` - NATS/JetStream based
- `event_bus.js` - In-memory event bus
- `event_emitter.js` - Event emission
- `event_outbox.js` - Outbox pattern (NEW - recently added)
- `mission_event_bus.js` - Mission-specific event bus

**Event Flow:**
```
Authority → Event Authority → NATS/JetStream → Subscribers
```

**Current State:**
- Event Authority uses NATS/JetStream for persistence
- Event Bus uses in-memory Map for subscribers
- Event Outbox exists but not integrated
- Events published directly, not through outbox pattern

---

# PERSISTENCE

## PostgreSQL Access

**Connection Pool:** `server.js` creates eventPool

**Direct PostgreSQL Usage:**
- 76 authority files with direct PostgreSQL access
- 14 service files with direct PostgreSQL access
- Multiple persistence implementations

**Transaction Usage:**
- `mission_queue.js:enqueueTransactional()` - Uses BEGIN/COMMIT/ROLLBACK
- `lifecycle_context.js` - Transaction context wrapper
- `constitutional_runtime.js` - Uses LifecycleContext

**Write Operations:**
- Direct `postgres.query(INSERT...)` throughout codebase
- Direct `postgres.query(UPDATE...)` throughout codebase
- Direct `postgres.query(DELETE...)` throughout codebase
- No unified transaction authority
- No unified persistence authority

---

## Persistence Implementations

**Found:**
- `graph_persistence.js` - Execution graph persistence
- `git_persistence_backend.js` - Git-based persistence
- `eventstore_persistence.js` - EventStore persistence
- `persistence_adapter.js` - Persistence adapter

**Persistence Model:**
- Multiple independent persistence backends
- No single persistence authority
- Direct PostgreSQL access in authorities and services

---

# EVENT SYSTEM

## Publishers

**Found:**
- `event_authority.js` - Event Authority publisher
- `event_bus.js` - Event bus publisher
- `event_emitter.js` - Event emitter
- `event_outbox.js` - Outbox publisher (NEW)
- `mission_event_bus.js` - Mission event bus publisher
- Direct event publication in authorities

**Event Publication Pattern:**
```
Authority → eventBus.publish(eventType, eventData) → NATS/JetStream
```

**Current State:**
- Events published directly to event bus
- Events published outside transactions
- Event outbox exists but not integrated
- No outbox pattern enforcement

---

## Subscribers

**Found:**
- Event Authority subscribes to NATS/JetStream streams
- Event Bus uses in-memory Map for subscribers
- No subscriber inventory completed

**Event Flow:**
```
NATS/JetStream → Event Authority → Subscribers
```

---

## Events

**Event Types (from event_authority.js):**
- AuthorityStarted
- AuthorityCompleted
- InferenceStarted
- InferenceCompleted
- ArtifactStored
- EmbeddingCreated
- MissionCreated
- MissionFinished
- ReplayStarted
- ReplayFinished

**Event Envelopes:**
- Custom event data per event type
- No standard event schema enforced
- No validation of event structure

---

## Event Serialization

**Found:**
- `canonical_authority.js` - Canonical serialization
- Direct JSON.stringify() in event publishers
- No single serialization authority

**Current State:**
- Canonical Authority exists but not enforced for events
- Direct JSON.stringify() used in many places
- No deterministic event serialization

---

# IDEMPOTENCY

## Request Handlers

**Found:**
- Express handlers in `server.js`
- No idempotency middleware
- No idempotency key extraction

**Command Handlers:**
- Authority methods
- Service methods
- No idempotency enforcement

---

## Retry Logic

**Found:**
- `retry_authority.js` - Retry authority
- Queue retry counts
- No idempotency-aware retry

---

## Duplicate Detection

**Found:**
- No duplicate detection mechanism
- No idempotency keys
- No database uniqueness constraints for idempotency

---

## Unique Constraints

**Found:**
- Primary keys in tables
- No idempotency-specific unique constraints
- No duplicate prevention at database level

---

# LOCKING

## Mutexes

**Found:**
- No mutex implementations found

---

## Redis Locks

**Found:**
- No Redis lock implementations found

---

## Advisory Locks

**Found:**
- `advisory_lock.js` - PostgreSQL advisory locks (NEW - recently added)
- Not integrated into existing code
- Not used by Mission, Execution, Queue, Schedule

---

## Synchronization

**Found:**
- `FOR UPDATE SKIP LOCKED` in mission_queue.js
- No other synchronization mechanisms

---

## Concurrent Writers

**Found:**
- Mission Queue uses FOR UPDATE SKIP LOCKED for claim operations
- No advisory locking for Mission aggregate
- No advisory locking for Execution aggregate
- No advisory locking for Queue aggregate
- No advisory locking for Schedule aggregate

---

# IDENTITY

## UUID Generation

**Found:**
- No random UUID generation found
- All IDs use deterministic generation

---

## Hashes

**Found:**
- `canonical_authority.js` - SHA256 hashing
- `deterministic_id_authority.js` - SHA256 hashing
- Consistent hash usage

---

## IDs

**Found:**
- `identity_authority.js` - Centralized identity authority
- `deterministic_id_authority.js` - Deterministic ID generation
- Mission IDs, Execution IDs, Artifact IDs, etc.

**ID Generation Pattern:**
```
IdentityAuthority.generateId(type, data) → type_hash
DeterministicIdAuthority.generateId(bytes) → obj-hash
```

**Current State:**
- Identity Authority exists but depends on missing serializerAuthority
- Deterministic ID Authority exists
- No single identity authority enforced across codebase
- Multiple authorities generate IDs independently

---

## Deterministic Identity

**Found:**
- `deterministic_id_authority.js` - Deterministic from canonical bytes
- `identity_authority.js` - Deterministic from canonical data
- Canonical Authority provides canonical serialization

**Current State:**
- Deterministic identity exists
- Not enforced across all ID generation
- Some authorities may still generate IDs independently

---

# TIME

## Date.now()

**Found:**
- No direct Date.now() usage found
- All time usage goes through constitutionalTimeAuthority

---

## new Date()

**Found:**
- Database DEFAULT NOW() in table schemas
- new Date() in constitutionalTimeAuthority.nowAsDate()
- Limited direct usage

---

## performance.now()

**Found:**
- No performance.now() usage found

---

## Timestamps

**Found:**
- `constitutional_time_authority.js` - Single time authority
- Supports replay mode (setCurrentTime, clearCurrentTime)
- Used throughout codebase

**Current State:**
- Single time authority exists
- Replay mode supported
- Not all timestamp usage goes through authority (database DEFAULT NOW())

---

## Current Authority Over Time

**Found:**
- constitutionalTimeAuthority is the single time authority
- Supports replay mode
- Used by most authorities
- Database DEFAULT NOW() bypasses authority

---

# REPLAY

## Replay Logic

**Found:**
- `replay_log.js` - Immutable replay log
- `replay_engine.js` - Replay engine
- `replay_executor.js` - Replay executor
- `replay_pipeline.js` - Replay pipeline
- `replay_transcript.js` - Replay transcript
- `replay_recorder.js` - Replay recorder
- `replay_recorder_authority.js` - Replay recorder authority
- `replay_validator_authority.js` - Replay validator
- `replay_verifier.js` - Replay verifier
- `replay_canonicalizer_authority.js` - Replay canonicalizer
- `replay_determinism_authority.js` - Replay determinism
- `transcript_only_replay_engine.js` - Transcript-only replay
- `end_to_end_replay_test.js` - End-to-end replay test

---

## Transcript Generation

**Found:**
- `replay_transcript.js` - Transcript generation
- `transcript_authority.js` - Transcript authority

---

## Reconstruction

**Found:**
- Replay log provides reconstruction
- Transcript provides reconstruction
- No unified reconstruction authority

---

## Witness Generation

**Found:**
- `witness_authority.js` - Centralized witness authority
- `witness_chain.js` - Witness chain
- `witness_generator.js` - Witness generator
- `witness_recorder.js` - Witness recorder
- `witness_registry.js` - Witness registry
- Multiple witness implementations (inference_witness, runtime_witness, etc.)

---

## Current Replay Guarantees

**Found:**
- Immutable replay log with hash chain
- Witness generation after replay
- Canonical serialization
- Deterministic ID generation
- Time authority with replay mode

**Current State:**
- Replay infrastructure exists
- Not integrated with transaction boundaries
- Not integrated with outbox pattern
- No replay authority abstraction

---

# CONSTITUTIONAL AUTHORITIES INVENTORY

## Layer 0A: Foundation Authorities

### Identity Authority
- **File:** `identity_authority.js`
- **Status:** EXISTS
- **Dependency:** serializerAuthority (MISSING)
- **Usage:** Not enforced across codebase

### Canonical Authority
- **File:** `canonical_authority.js`
- **Status:** EXISTS
- **Dependency:** None
- **Usage:** Used by many authorities but not enforced

### Deterministic ID Authority
- **File:** `deterministic_id_authority.js`
- **Status:** EXISTS
- **Dependency:** None
- **Usage:** Used by many authorities

### Time Authority
- **File:** `constitutional_time_authority.js`
- **Status:** EXISTS
- **Dependency:** None
- **Usage:** Used by most authorities

---

## Layer 0B: Infrastructure Authorities

### Persistence Authority
- **Status:** MISSING
- **Current State:** Multiple independent persistence implementations
- **Blocker:** No single persistence authority

### Transaction Authority
- **Status:** MISSING
- **Current State:** Direct PostgreSQL transactions in specific places
- **Blocker:** No transaction authority abstraction

### Replay Authority
- **Status:** MISSING
- **Current State:** Multiple replay components, no unified authority
- **Blocker:** No replay authority abstraction

### Witness Authority
- **File:** `witness_authority.js`
- **Status:** EXISTS
- **Dependency:** serializerAuthority (MISSING)
- **Usage:** Centralized but not enforced

---

## Layer 1: Constitutional Guarantees

### Standard Event Schema
- **File:** `standard_event_schema.js`
- **Status:** EXISTS (recently updated)
- **Dependency:** None
- **Usage:** Not enforced across event publishers

### Transaction Boundary
- **File:** `transaction_boundary.js`
- **Status:** EXISTS (recently added)
- **Dependency:** None
- **Usage:** Not integrated into existing code

### Advisory Lock
- **File:** `advisory_lock.js`
- **Status:** EXISTS (recently added)
- **Dependency:** None
- **Usage:** Not integrated into existing code

---

## Layer 2: Operational Guarantees

### Transactional Outbox
- **File:** `event_outbox.js`
- **Status:** EXISTS (recently updated)
- **Dependency:** StandardEventSchema, TransactionBoundary
- **Usage:** Not integrated into existing code

### Idempotency Manager
- **File:** `idempotency_manager.js`
- **Status:** EXISTS (recently updated)
- **Dependency:** TransactionBoundary
- **Usage:** Not integrated into existing code

---

## Layer 3: Write Authorities

### Mission Write Authority
- **Status:** MISSING
- **Current State:** mission_authority.js, mission_generation_service.js
- **Blocker:** No unified write authority

### Execution Write Authority
- **Status:** MISSING
- **Current State:** mission_execution_authority.js
- **Blocker:** No unified write authority

### Queue Write Authority
- **Status:** MISSING
- **Current State:** mission_queue.js
- **Blocker:** No unified write authority

### Scheduler Write Authority
- **Status:** MISSING
- **Current State:** constitutional_autonomous_scheduler.js
- **Blocker:** No unified write authority

---

## Layer 4: Verification

### Regression Suite
- **Status:** MISSING
- **Current State:** No constitutional regression tests
- **Blocker:** No regression suite

---

# CRITICAL FINDINGS

## Missing Dependencies

1. **serializerAuthority** - Referenced by identity_authority.js but file does not exist
2. **Persistence Authority** - No single persistence authority
3. **Transaction Authority** - No transaction authority abstraction
4. **Replay Authority** - No unified replay authority

## Constitutional Violations

1. **Multiple Persistence Implementations** - No single persistence authority
2. **Direct PostgreSQL Access** - No transaction authority
3. **Events Outside Transactions** - No outbox pattern enforcement
4. **No Idempotency** - No idempotency manager integration
5. **No Advisory Locking** - No single writer enforcement
6. **Missing serializerAuthority** - Identity Authority dependency missing

## Integration Gaps

1. **Transaction Boundary** - Exists but not integrated
2. **Event Outbox** - Exists but not integrated
3. **Idempotency Manager** - Exists but not integrated
4. **Advisory Lock** - Exists but not integrated
5. **Standard Event Schema** - Exists but not enforced

---

# NEXT STEPS

## Phase 1: Constitutional Model Discovery

Derive actual constitutional dependency graph from repository evidence.

## Phase 2: Constitutional Law Validation

Audit repository against constitutional laws.

## Phase 3: Implementation Plan

Produce implementation order with explicit prerequisites.
