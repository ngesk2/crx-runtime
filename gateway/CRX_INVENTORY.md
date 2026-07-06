# CRX Build vs Adopt Matrix

**Constitutional Runtime Architecture Inventory**

---

# Tier 0 — Constitutional IP (Never Replace)

## Constitutional Model

**Capability:** Constitutional model
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Core IP - Constitutional Runtime architecture with authorities pattern
**Repository Evidence:**
- `constitutional_runtime.js` - Single orchestration service
- `constitutional_authority.js` - Constitutional authority pattern
- Authority-based architecture throughout codebase
**Recommendation:** KEEP - This is the core differentiator

---

## Replay Law

**Capability:** Replay law
**Current Status:** EXISTS (PARTIAL)
**Build:** ✅
**Adopt:** ❌
**Notes:** Core IP - Immutable replay log with hash chain
**Repository Evidence:**
- `replay_log.js` - Immutable append-only replay log
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
**Issues:** No unified Replay Authority, not integrated with transactions
**Recommendation:** KEEP - Create unified Replay Authority, integrate with Transaction Authority

---

## Witness Law

**Capability:** Witness law
**Current Status:** EXISTS (BROKEN)
**Build:** ✅
**Adopt:** ❌
**Notes:** Core IP - Cryptographic witness generation
**Repository Evidence:**
- `witness_authority.js` - Centralized witness authority
- `witness_chain.js` - Witness chain
- `witness_generator.js` - Witness generator
- `witness_recorder.js` - Witness recorder
- `witness_registry.js` - Witness registry
- Multiple witness implementations (inference_witness, runtime_witness, etc.)
**Issues:** Depends on missing serializerAuthority, cannot be used
**Recommendation:** KEEP - Fix serializerAuthority dependency, integrate with replay

---

## Identity Law

**Capability:** Identity law
**Current Status:** EXISTS (BROKEN)
**Build:** ✅
**Adopt:** ❌
**Notes:** Core IP - Deterministic identity generation
**Repository Evidence:**
- `identity_authority.js` - Centralized identity authority
- `deterministic_id_authority.js` - Deterministic ID generation
**Issues:** Depends on missing serializerAuthority, cannot be used
**Recommendation:** KEEP - Fix serializerAuthority dependency, enforce single identity authority

---

## Canonical Serializer

**Capability:** Canonical serializer
**Current Status:** EXISTS (PARTIAL)
**Build:** ✅
**Adopt:** ❌
**Notes:** Existing - Canonical Authority provides canonical serialization
**Repository Evidence:**
- `canonical_authority.js` - Canonical serialization with CanonicalBytes
- Domain-separated hash functions (hashFile, hashAST, hashSymbol, etc.)
**Issues:** Not enforced, direct JSON.stringify() bypasses it, missing serializerAuthority
**Recommendation:** KEEP - Enforce canonical serialization, create serializerAuthority

---

## Constitutional Contracts

**Capability:** Constitutional contracts
**Current Status:** EXISTS (PARTIAL)
**Build:** ✅
**Adopt:** ❌
**Notes:** Existing - Authority pattern with constitutional contracts
**Repository Evidence:**
- 76 authority files with constitutional patterns
- Authority lifecycle (initialize, execute, witness)
- Constitutional result patterns
**Issues:** Not enforced, no unified contract interface
**Recommendation:** KEEP - Enforce constitutional contracts, create unified interface

---

# Tier 1 — Domain IP (Business Model)

## Mission

**Capability:** Mission
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Mission lifecycle and execution
**Repository Evidence:**
- `mission_authority.js` - Mission authority
- `mission_generation_service.js` - Mission generation
- `mission_execution_authority.js` - Mission execution
- `mission_queue.js` - Mission queue
- `mission_event_bus.js` - Mission events
- `mission_planner.js` - Mission planning
- `mission_generator.js` - Mission generation
- `mission_rule_authority.js` - Mission rules
**Recommendation:** KEEP - Core business logic

---

## Execution

**Capability:** Execution
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Execution graph and orchestration
**Repository Evidence:**
- `mission_execution_authority.js` - Execution authority
- `mission_execution_graph.js` - Execution graph
- `graph_persistence.js` - Graph persistence
**Recommendation:** KEEP - Core business logic

---

## Knowledge

**Capability:** Knowledge
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Knowledge objects and compilation
**Repository Evidence:**
- `knowledge_object.js` - Knowledge object
- `knowledge_compiler.js` - Knowledge compilation
- `object_registry.js` - Object registry
- `dependency_graph.js` - Dependency graph
**Recommendation:** KEEP - Core business logic

---

## Observation

**Capability:** Observation
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Observation and reflection
**Repository Evidence:**
- `reflection_generator.js` - Reflection generation
- `reflection_authority.js` - Reflection authority
**Recommendation:** KEEP - Core business logic

---

## Artifact

**Capability:** Artifact
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Artifact storage and retrieval
**Repository Evidence:**
- `artifact_authority.js` - Artifact authority
- `repository_store.js` - Repository store
**Recommendation:** KEEP - Core business logic

---

## Capability

**Capability:** Capability
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Capability tracking
**Repository Evidence:**
- `capability_authority.js` - Capability authority
**Recommendation:** KEEP - Core business logic

---

## Governance

**Capability:** Governance
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Governance and policy
**Repository Evidence:**
- `governance_authority.js` - Governance authority
- `policy_authority.js` - Policy authority
**Recommendation:** KEEP - Core business logic

---

## Failure

**Capability:** Failure
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Failure handling and recovery
**Repository Evidence:**
- `failure_authority.js` - Failure authority
- `retry_authority.js` - Retry authority
- `dead_letter_queue.js` - Dead letter queue
**Recommendation:** KEEP - Core business logic

---

## Policy

**Capability:** Policy
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Policy enforcement
**Repository Evidence:**
- `policy_authority.js` - Policy authority
**Recommendation:** KEEP - Core business logic

---

## Queue

**Capability:** Queue
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Mission queue and work distribution
**Repository Evidence:**
- `mission_queue.js` - Mission queue
- `worker_queue.js` - Worker queue
- `persistent_queue.js` - Persistent queue
- `analysis_queue.js` - Analysis queue
- `constitutional_mission_queue.js` - Constitutional mission queue
- `dead_letter_queue.js` - Dead letter queue
**Recommendation:** KEEP - Core business logic, hide behind QueuePort

---

## Decision

**Capability:** Decision
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Decision making
**Repository Evidence:**
- `decision_authority.js` - Decision authority
**Recommendation:** KEEP - Core business logic

---

## Recommendation

**Capability:** Recommendation
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Recommendation generation
**Repository Evidence:**
- `recommendation_authority.js` - Recommendation authority
**Recommendation:** KEEP - Core business logic

---

## Lineage

**Capability:** Lineage
**Current Status:** EXISTS
**Build:** ✅
**Adopt:** ❌
**Notes:** Proprietary - Lineage tracking
**Repository Evidence:**
- `compiler_lineage_witness.js` - Compiler lineage witness
- `lineage_authority.js` - Lineage authority
**Recommendation:** KEEP - Core business logic

---

# Tier 2 — Constitutional Ports (Interfaces)

## PersistencePort

**Port:** PersistencePort
**Existing:** NO
**Notes:** Multiple independent persistence implementations
**Repository Evidence:**
- `graph_persistence.js` - Direct PostgreSQL access
- `git_persistence_backend.js` - Git-based persistence
- `eventstore_persistence.js` - EventStore persistence
- `persistence_adapter.js` - Adapter pattern
- Direct PostgreSQL access in 76 authority files
**Recommendation:** CREATE - Create PersistencePort, hide all persistence behind it

---

## TransactionPort

**Port:** TransactionPort
**Existing:** NO
**Notes:** Direct PostgreSQL transactions in specific places
**Repository Evidence:**
- `mission_queue.js` - BEGIN/COMMIT/ROLLBACK
- `lifecycle_context.js` - Transaction context
- `transaction_boundary.js` - Transaction boundary (exists but not integrated)
**Recommendation:** CREATE - Create TransactionPort, hide all transactions behind it

---

## SchedulerPort

**Port:** SchedulerPort
**Existing:** NO
**Notes:** Custom scheduler implementation
**Repository Evidence:**
- `constitutional_autonomous_scheduler.js` - Autonomous scheduler
- `dependency_scheduler.js` - Dependency scheduler
- `runtime_event_scheduler.js` - Event scheduler
- `worker_scheduler.js` - Worker scheduler
**Recommendation:** CREATE - Create SchedulerPort, evaluate Temporal/pg-boss for implementation

---

## WorkerPort

**Port:** WorkerPort
**Existing:** NO
**Notes:** Custom worker implementation
**Repository Evidence:**
- `worker_pool.js` - Worker pool
- `worker_queue.js` - Worker queue
- `worker_scheduler.js` - Worker scheduler
- `worker_lifecycle_manager.js` - Worker lifecycle
- `worker_health_monitor.js` - Worker health
**Recommendation:** CREATE - Create WorkerPort, evaluate Temporal/pg-boss for implementation

---

## MessagingPort

**Port:** MessagingPort
**Existing:** PARTIAL
**Notes:** NATS/JetStream used directly
**Repository Evidence:**
- `event_authority.js` - NATS/JetStream integration
- `event_bus.js` - In-memory event bus
**Recommendation:** CREATE - Create MessagingPort, hide NATS/JetStream behind it

---

## LockPort

**Port:** LockPort
**Existing:** PARTIAL
**Notes:** Advisory locks exist but not integrated
**Repository Evidence:**
- `advisory_lock.js` - PostgreSQL advisory locks
- `FOR UPDATE SKIP LOCKED` in mission_queue.js
**Recommendation:** CREATE - Create LockPort, hide all locking behind it

---

## ReplayStorePort

**Port:** ReplayStorePort
**Existing:** NO
**Notes:** Replay log uses PostgreSQL directly
**Repository Evidence:**
- `replay_log.js` - Direct PostgreSQL access
**Recommendation:** CREATE - Create ReplayStorePort, hide replay storage behind it

---

## MetricsPort

**Port:** MetricsPort
**Existing:** NO
**Notes:** No metrics collection
**Repository Evidence:**
- No metrics implementation found
**Recommendation:** CREATE - Create MetricsPort, adopt Prometheus for implementation

---

## TracePort

**Port:** TracePort
**Existing:** NO
**Notes:** No distributed tracing
**Repository Evidence:**
- No tracing implementation found
**Recommendation:** CREATE - Create TracePort, adopt OpenTelemetry for implementation

---

## SecretsPort

**Port:** SecretsPort
**Existing:** NO
**Notes:** Environment variables used
**Repository Evidence:**
- Environment variables in server.js
**Recommendation:** CREATE - Create SecretsPort, adopt Vault if needed

---

## StoragePort

**Port:** StoragePort
**Existing:** NO
**Notes:** Direct PostgreSQL access
**Repository Evidence:**
- Direct PostgreSQL access in 76 authority files
**Recommendation:** CREATE - Create StoragePort, hide all storage behind it

---

# Tier 3 — Commodity Runtime

## PostgreSQL

**Capability:** PostgreSQL
**Existing:** ✅
**Candidate:** KEEP
**Notes:** Primary database, well-established
**Repository Evidence:**
- PostgreSQL pool in server.js
- Used throughout codebase
**Recommendation:** KEEP - Hide behind PersistencePort

---

## Ollama

**Capability:** Ollama
**Existing:** ✅
**Candidate:** KEEP
**Notes:** Inference runtime
**Repository Evidence:**
- `inference_adapter.js` - Ollama integration
- `ollama_worker.js` - Ollama worker
**Recommendation:** KEEP - Hide behind InferencePort

---

## Prometheus

**Capability:** Prometheus
**Existing:** ❌
**Candidate:** ADOPT
**Notes:** Industry standard metrics
**Repository Evidence:**
- No metrics implementation
**Recommendation:** ADOPT - Create MetricsPort, use Prometheus for implementation

---

## Grafana

**Capability:** Grafana
**Existing:** ❌
**Candidate:** ADOPT
**Notes:** Industry standard visualization
**Repository Evidence:**
- No visualization implementation
**Recommendation:** ADOPT - Use with Prometheus for dashboards

---

## OpenTelemetry

**Capability:** OpenTelemetry
**Existing:** ❌
**Candidate:** ADOPT
**Notes:** Industry standard tracing
**Repository Evidence:**
- No tracing implementation
**Recommendation:** ADOPT - Create TracePort, use OpenTelemetry for implementation

---

## Vault

**Capability:** Vault
**Existing:** ❌
**Candidate:** ADOPT
**Notes:** Industry standard secrets management
**Repository Evidence:**
- Environment variables used
**Recommendation:** ADOPT - Create SecretsPort, use Vault if needed

---

## MinIO

**Capability:** MinIO
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** S3-compatible object storage
**Repository Evidence:**
- No object storage implementation
**Recommendation:** EVALUATE - Create StoragePort, evaluate MinIO for artifact storage

---

## Temporal

**Capability:** Temporal
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** Workflow engine for scheduling
**Repository Evidence:**
- Custom scheduler implementation
- Custom worker implementation
**Recommendation:** EVALUATE - Create SchedulerPort and WorkerPort, evaluate Temporal for implementation

---

## pg-boss

**Capability:** pg-boss
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** PostgreSQL-based job queue
**Repository Evidence:**
- Custom queue implementation
**Recommendation:** EVALUATE - Create QueuePort, evaluate pg-boss for implementation

---

## NATS

**Capability:** NATS
**Existing:** ✅
**Candidate:** KEEP
**Notes:** Messaging system
**Repository Evidence:**
- `event_authority.js` - NATS/JetStream integration
**Recommendation:** KEEP - Hide behind MessagingPort

---

## Kafka

**Capability:** Kafka
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** Alternative messaging system
**Repository Evidence:**
- NATS already used
**Recommendation:** EVALUATE - Only if NATS insufficient

---

## OpenSearch

**Capability:** OpenSearch
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** Search and analytics
**Repository Evidence:**
- No search implementation
**Recommendation:** EVALUATE - If search/analytics needed

---

## Neo4j

**Capability:** Neo4j
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** Graph database
**Repository Evidence:**
- Dependency graph exists
**Recommendation:** EVALUATE - If graph queries needed

---

## OPA

**Capability:** OPA
**Existing:** ❌
**Candidate:** EVALUATE
**Notes:** Policy as code
**Repository Evidence:**
- Policy authority exists
**Recommendation:** EVALUATE - If policy complexity grows

---

# CRX Build vs Adopt Matrix

| Capability | Current | Constitutional? | Commodity? | Replace? | Recommendation |
|------------|---------|-----------------|------------|----------|----------------|
| Witness | Existing | ✅ | ❌ | No | KEEP - Fix serializerAuthority |
| Replay | Existing | ✅ | ❌ | No | KEEP - Create unified authority |
| Identity | Existing | ✅ | ❌ | No | KEEP - Fix serializerAuthority |
| Canonical Serializer | Existing | ✅ | ❌ | No | KEEP - Enforce, create serializerAuthority |
| Constitutional Contracts | Existing | ✅ | ❌ | No | KEEP - Enforce, create unified interface |
| Mission | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Execution | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Knowledge | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Observation | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Artifact | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Capability | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Governance | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Failure | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Policy | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Queue | Existing | ✅ | ❌ | No | KEEP - Hide behind QueuePort |
| Decision | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Recommendation | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Lineage | Existing | ✅ | ❌ | No | KEEP - Core business logic |
| Transactions | PostgreSQL | ❌ | ✅ | Maybe | Hide behind TransactionPort |
| Persistence | PostgreSQL | ❌ | ✅ | Maybe | Hide behind PersistencePort |
| Scheduling | Custom | ❌ | ✅ | Yes | Create SchedulerPort, evaluate Temporal/pg-boss |
| Workers | Custom | ❌ | ✅ | Yes | Create WorkerPort, evaluate Temporal/pg-boss |
| Messaging | NATS | ❌ | ✅ | No | Keep, hide behind MessagingPort |
| Metrics | Missing | ❌ | ✅ | Yes | Create MetricsPort, adopt Prometheus |
| Tracing | Missing | ❌ | ✅ | Yes | Create TracePort, adopt OpenTelemetry |
| Secrets | Custom/env | ❌ | ✅ | Yes | Create SecretsPort, adopt Vault if needed |
| Storage | PostgreSQL | ❌ | ✅ | Maybe | Create StoragePort, evaluate MinIO |

---

# Integration Priority

## Tier 0 Integration (Immediate)

1. **Create serializerAuthority** - Unblock Identity and Witness Authorities
2. **Fix Identity Authority** - Remove serializerAuthority dependency or create it
3. **Fix Witness Authority** - Remove serializerAuthority dependency or create it
4. **Enforce Canonical Serialization** - Remove direct JSON.stringify()
5. **Create Unified Replay Authority** - Consolidate replay components

## Tier 2 Integration (High Priority)

1. **Create PersistencePort** - Hide all persistence behind port
2. **Create TransactionPort** - Hide all transactions behind port
3. **Create LockPort** - Hide all locking behind port
4. **Create ReplayStorePort** - Hide replay storage behind port

## Tier 2 Integration (Medium Priority)

1. **Create SchedulerPort** - Evaluate Temporal/pg-boss
2. **Create WorkerPort** - Evaluate Temporal/pg-boss
3. **Create MessagingPort** - Hide NATS behind port
4. **Create QueuePort** - Evaluate pg-boss

## Tier 3 Integration (Low Priority)

1. **Create MetricsPort** - Adopt Prometheus
2. **Create TracePort** - Adopt OpenTelemetry
3. **Create SecretsPort** - Adopt Vault if needed
4. **Create StoragePort** - Evaluate MinIO

---

# Summary

**Constitutional IP (Keep):** 6 capabilities - All core differentiators
**Domain IP (Keep):** 13 capabilities - All proprietary business logic
**Constitutional Ports (Create):** 11 ports - All need to be created
**Commodity Runtime (Adopt):** 8 capabilities - Industry standard tools
**Commodity Runtime (Evaluate):** 5 capabilities - Need evaluation

**Biggest Opportunity:** Replace custom infrastructure (scheduling, workers, metrics, tracing) with mature components behind constitutional ports.
