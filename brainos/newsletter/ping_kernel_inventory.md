# PHASE 1: PING KERNEL INVENTORY

**Constitutional Root:** C:\Users\nolan\PING  
**Audit Scope:** PING kernel components only  
**Brain Status:** Ignored in this phase  

---

## GATEWAY

**File:** C:\Users\nolan\PING\gateway\server.js  
**Purpose:** Express-based API gateway with model routing, constitutional event emission, and operational intelligence context services  
**Inputs:** HTTP requests (chat, autocomplete, events, context queries)  
**Outputs:** Ollama inference responses, event logs, operational intelligence data  
**Dependencies:** PostgreSQL (event store), Ollama (inference), event_emitter.js  
**Constitutional Candidate:** YES - Gateway is PING KERNEL (orchestration and event recording layer)  

---

## GATEWAY EVENT EMITTER

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Purpose:** Constitutional event logging to PostgreSQL events table  
**Inputs:** Inference requests, responses, failures  
**Outputs:** Append-only events in PostgreSQL (INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED)  
**Dependencies:** PostgreSQL pool  
**Constitutional Candidate:** YES - Event Recording Authority implementation  

---

## COMMIT SERVICE

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\server.ts  
**Purpose:** Express server for artifact commit and audit endpoints  
**Inputs:** HTTP POST /kernel/commit (artifact + lineage), HTTP GET /kernel/audit  
**Outputs:** Artifact acceptance/rejection, artifact audit results  
**Dependencies:** commit_controller.ts, audit_controller.ts  
**Constitutional Candidate:** YES - Commit Service is PING KERNEL (mutation authority)  

---

## COMMIT CONTROLLER

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\commit_controller.ts  
**Purpose:** Artifact commit API endpoint  
**Inputs:** Artifact content, lineage parents  
**Outputs:** Artifact ID (canonical hash), acceptance status  
**Dependencies:** identity_engine.ts, dag_validator.ts, artifact_store.ts, lineage_store.ts, event_log.ts  
**Constitutional Candidate:** YES - Mutation authority interface  

---

## AUDIT CONTROLLER

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\api\audit_controller.ts  
**Purpose:** Artifact audit endpoint for querying committed artifacts  
**Inputs:** HTTP GET /kernel/audit  
**Outputs:** List of artifacts (last 100)  
**Dependencies:** PostgreSQL pool  
**Constitutional Candidate:** YES - Audit/read interface for constitutional substrate  

---

## CANONICAL ENGINE

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts  
**Purpose:** Canonicalization using @crx/replay CanonicalJson  
**Inputs:** Any value  
**Outputs:** Canonical JSON string  
**Dependencies:** @crx/replay (CanonicalJson)  
**Constitutional Candidate:** YES - Identity Authority implementation (canonicalization)  

---

## IDENTITY ENGINE

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts  
**Purpose:** SHA256 hash computation for canonical identity  
**Inputs:** Any value  
**Outputs:** SHA256 hash (artifact ID)  
**Dependencies:** canonical_engine.ts, Node.js crypto  
**Constitutional Candidate:** YES - Identity Authority implementation (hash computation)  

---

## EVENT LOG

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts  
**Purpose:** Event logging to execution_events table  
**Inputs:** Event type, payload  
**Outputs:** Database insert into execution_events  
**Dependencies:** PostgreSQL pool  
**Constitutional Candidate:** YES - Event Recording Authority implementation  

---

## ARTIFACT MODEL

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\models\artifact.ts  
**Purpose:** Artifact interface definition  
**Inputs:** N/A (type definition)  
**Outputs:** N/A (type definition)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional primitive (Artifact)  

---

## ARTIFACT STORE

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts  
**Purpose:** PostgreSQL artifact storage  
**Inputs:** Artifact ID, artifact content  
**Outputs:** Database insert into artifacts table  
**Dependencies:** PostgreSQL pool  
**Constitutional Candidate:** YES - Persistence layer for constitutional artifacts  

---

## LINEAGE STORE

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts  
**Purpose:** PostgreSQL lineage edge storage  
**Inputs:** Parent IDs, child ID  
**Outputs:** Database inserts into lineage_edges table  
**Dependencies:** PostgreSQL pool  
**Constitutional Candidate:** YES - Persistence layer for constitutional lineage  

---

## LEDGER SCHEMA

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Purpose:** Database schema for artifacts, lineage_edges, execution_events  
**Inputs:** N/A (SQL schema)  
**Outputs:** N/A (SQL schema)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional substrate schema  

---

## DATABASE POOL

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\db.ts  
**Purpose:** PostgreSQL connection pool factory  
**Inputs:** Connection string  
**Outputs:** PostgreSQL Pool instance  
**Dependencies:** pg library  
**Constitutional Candidate:** YES - Infrastructure adapter for constitutional storage  

---

## DAG VALIDATOR

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\validation\dag_validator.ts  
**Purpose:** Lineage DAG validation (cycle detection, duplicate parent detection)  
**Inputs:** Parent IDs, child ID  
**Outputs:** Validation result (throws on violation)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Lineage Authority implementation (acyclicity enforcement)  

---

## LOGGER

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\utils\logger.ts  
**Purpose:** Pino logger instance  
**Inputs:** N/A (logger factory)  
**Outputs:** N/A (logger instance)  
**Dependencies:** pino library  
**Constitutional Candidate:** NO - Infrastructure utility (not constitutional primitive)  

---

## REPLAY KERNEL

**File:** C:\Users\nolan\PING\runtime\replay\index.ts  
**Purpose:** Pure TypeScript replay kernel exports (no infrastructure dependencies)  
**Inputs:** N/A (module exports)  
**Outputs:** CanonicalJson, CanonicalEventEnvelope, CanonicalHashAuthority, InvariantRunner, ReplayInvariants, ReplayEventStream, ReplayStateMachine, DeterministicReplayEngine, ReplayVerification, WitnessAuthority, MerkleTree  
**Dependencies:** None (pure TypeScript)  
**Constitutional Candidate:** YES - Replay Authority implementation (core constitutional primitive)  

---

## REPLAY TYPES

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Purpose:** Pure TypeScript types for deterministic replay kernel  
**Inputs:** N/A (type definitions)  
**Outputs:** Branded types (EventId, ArtifactId, WitnessLeafId), interfaces (CanonicalEventEnvelope, CanonicalBytes, Fingerprint, LineageEdge, LineageGraph, ReplayState, ArtifactState, WitnessRoot, InvariantViolation, ReplayResult, InvariantDefinition, DeterministicReplayConfig, ReplayCertificate, ExecutionArtifact, DeterministicTiming)  
**Dependencies:** None (pure TypeScript)  
**Constitutional Candidate:** YES - Constitutional primitive type system  

---

## CANONICAL JSON

**File:** C:\Users\nolan\PING\runtime\replay\canonical_json.ts  
**Purpose:** Deterministic JSON canonicalization  
**Inputs:** Any value  
**Outputs:** Canonical JSON representation  
**Dependencies:** None (pure TypeScript)  
**Constitutional Candidate:** YES - Identity Authority implementation (canonicalization)  

---

## CANONICAL EVENT ENVELOPE

**File:** C:\Users\nolan\PING\runtime\replay\canonical_event_envelope.ts  
**Purpose:** Constitutional event envelope structure  
**Inputs:** Event data  
**Outputs:** CanonicalEventEnvelope instance  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Event Recording Authority implementation  

---

## CANONICAL HASH AUTHORITY

**File:** C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts  
**Purpose:** Hash computation for constitutional identity  
**Inputs:** Content  
**Outputs:** Hash value  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Identity Authority implementation  

---

## DETERMINISTIC REPLAY ENGINE

**File:** C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts  
**Purpose:** Deterministic reconstruction from event stream  
**Inputs:** Event stream, lineage graph, identity law, policy law  
**Outputs:** Reconstructed state  
**Dependencies:** replay_types.ts, canonical_json.ts  
**Constitutional Candidate:** YES - Replay Authority implementation (core constitutional primitive)  

---

## REPLAY STATE MACHINE

**File:** C:\Users\nolan\PING\runtime\replay\replay_state_machine.ts  
**Purpose:** State machine for replay execution  
**Inputs:** Events, configuration  
**Outputs:** Replay state  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Replay Authority implementation  

---

## REPLAY VERIFICATION

**File:** C:\Users\nolan\PING\runtime\replay\replay_verification.ts  
**Purpose:** Replay integrity verification  
**Inputs:** Replay result, invariants  
**Outputs:** Verification result  
**Dependencies:** replay_types.ts, invariant_runner.ts  
**Constitutional Candidate:** YES - Replay Authority implementation (verification)  

---

## INVARIANT RUNNER

**File:** C:\Users\nolan\PING\runtime\replay\invariant_runner.ts  
**Purpose:** Invariant checking during replay  
**Inputs:** State, invariants  
**Outputs:** Invariant violations  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Replay Authority implementation (invariant enforcement)  

---

## REPLAY INVARIANTS

**File:** C:\Users\nolan\PING\runtime\replay\replay_invariants.ts  
**Purpose:** Constitutional invariant definitions  
**Inputs:** N/A (invariant definitions)  
**Outputs:** N/A (invariant definitions)  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Constitutional law (invariants)  

---

## WITNESS AUTHORITY

**File:** C:\Users\nolan\PING\runtime\replay\witness_authority.ts  
**Purpose:** Witness computation and verification  
**Inputs:** Replay state  
**Outputs:** Witness root  
**Dependencies:** replay_types.ts, merkle_tree.ts  
**Constitutional Candidate:** YES - Witness Authority implementation (derived from Identity + Replay)  

---

## MERKLE TREE

**File:** C:\Users\nolan\PING\runtime\replay\merkle_tree.ts  
**Purpose:** Merkle tree computation for witness proofs  
**Inputs:** Leaf values  
**Outputs:** Merkle root, proofs  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** YES - Witness Authority implementation (data structure)  

---

## CONFIG ADAPTER

**File:** C:\Users\nolan\PING\runtime\adapters\config_adapter.ts  
**Purpose:** Infrastructure adapter for configuration injection  
**Inputs:** Environment variables  
**Outputs:** DeterministicReplayConfig  
**Dependencies:** replay_types.ts  
**Constitutional Candidate:** NO - Infrastructure adapter (not constitutional primitive)  

---

## POSTGRES EVENT STORE ADAPTER

**File:** C:\Users\nolan\PING\runtime\adapters\postgres_event_store.ts  
**Purpose:** Infrastructure adapter for PostgreSQL event storage  
**Inputs:** CanonicalEventEnvelope  
**Outputs:** Database storage  
**Dependencies:** replay/ (canonicalization)  
**Constitutional Candidate:** NO - Infrastructure adapter (not constitutional primitive)  

---

## EXPRESS COMMIT ADAPTER

**File:** C:\Users\nolan\PING\runtime\adapters\express_commit_adapter.ts  
**Purpose:** Infrastructure adapter for Express HTTP interface  
**Inputs:** HTTP requests  
**Outputs:** Commit service calls  
**Dependencies:** commit-service  
**Constitutional Candidate:** NO - Infrastructure adapter (not constitutional primitive)  

---

## CONSTITUTIONAL DOCUMENTS

**File:** C:\Users\nolan\PING\constitution\layer0_kernel.md  
**Purpose:** Frozen constitutional authority for Layer 0 kernel definition  
**Inputs:** N/A (constitutional law)  
**Outputs:** N/A (constitutional law)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional law (authoritative)  

---

## AUTHORITY MODEL

**File:** C:\Users\nolan\PING\constitution\authority_model.md  
**Purpose:** Frozen constitutional authority for authority jurisdiction and ownership  
**Inputs:** N/A (constitutional law)  
**Outputs:** N/A (constitutional law)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional law (authoritative)  

---

## OTHER CONSTITUTIONAL DOCUMENTS

**Files:** C:\Users\nolan\PING\constitution\*.md  
**Purpose:** Various constitutional laws (invariant_law.md, layering_law.md, mutation_law.md, replay_law.md, retrieval_law.md, source_of_truth_law.md, witness_law.md, terminology.md)  
**Inputs:** N/A (constitutional law)  
**Outputs:** N/A (constitutional law)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional law (authoritative)  

---

## EVENTS SCHEMA

**File:** C:\Users\nolan\PING\database\events.sql  
**Purpose:** Event Authority Schema (append-only events table)  
**Inputs:** N/A (SQL schema)  
**Outputs:** N/A (SQL schema)  
**Dependencies:** None  
**Constitutional Candidate:** YES - Constitutional substrate schema (Event Recording Authority)  

---

## OPERATIONAL INTELLIGENCE SCHEMA

**File:** C:\Users\nolan\PING\database\operational_intelligence.sql  
**Purpose:** Operational Intelligence Layer (dashboard queries, worker monitoring, model performance, failure tracking, daily digest, dead letter queue, knowledge metrics, runtime context services)  
**Inputs:** N/A (SQL schema)  
**Outputs:** N/A (SQL schema)  
**Dependencies:** events.sql  
**Constitutional Candidate:** NO - Operational intelligence (not constitutional primitive)  

---

## WORKER CONFIGURATIONS

**Files:** C:\Users\nolan\PING\workers\*.yaml  
**Purpose:** Worker configuration files (gateway-worker.yaml, ollama-worker.yaml, artifact-worker.yaml, research-worker.yaml, graph-worker.yaml)  
**Inputs:** N/A (YAML configuration)  
**Outputs:** N/A (YAML configuration)  
**Dependencies:** None  
**Constitutional Candidate:** NO - Application/worker configuration (not constitutional primitive)  

---

## SUMMARY

**PING KERNEL COMPONENTS (Constitutional Candidates):**

1. **Gateway** - Orchestration and event recording layer
2. **Event Emitter** - Event Recording Authority implementation
3. **Commit Service** - Mutation authority
4. **Commit Controller** - Mutation authority interface
5. **Audit Controller** - Audit/read interface
6. **Canonical Engine** - Identity Authority (canonicalization)
7. **Identity Engine** - Identity Authority (hash computation)
8. **Event Log** - Event Recording Authority implementation
9. **Artifact Model** - Constitutional primitive (Artifact)
10. **Artifact Store** - Persistence layer for artifacts
11. **Lineage Store** - Persistence layer for lineage
12. **Ledger Schema** - Constitutional substrate schema
13. **Database Pool** - Infrastructure adapter for storage
14. **DAG Validator** - Lineage Authority (acyclicity enforcement)
15. **Replay Kernel** - Replay Authority implementation
16. **Replay Types** - Constitutional primitive type system
17. **Canonical JSON** - Identity Authority (canonicalization)
18. **Canonical Event Envelope** - Event Recording Authority
19. **Canonical Hash Authority** - Identity Authority
20. **Deterministic Replay Engine** - Replay Authority (core)
21. **Replay State Machine** - Replay Authority
22. **Replay Verification** - Replay Authority (verification)
23. **Invariant Runner** - Replay Authority (invariant enforcement)
24. **Replay Invariants** - Constitutional law (invariants)
25. **Witness Authority** - Witness Authority implementation
26. **Merkle Tree** - Witness Authority (data structure)
27. **Constitutional Documents** - Constitutional law (authoritative)
28. **Events Schema** - Constitutional substrate schema

**NON-CONSTITUTIONAL COMPONENTS:**

1. **Logger** - Infrastructure utility
2. **Config Adapter** - Infrastructure adapter
3. **Postgres Event Store Adapter** - Infrastructure adapter
4. **Express Commit Adapter** - Infrastructure adapter
5. **Operational Intelligence Schema** - Operational intelligence
6. **Worker Configurations** - Application/worker configuration

**Answer:** What constitutional primitives already exist inside PING?
- Identity Authority (canonicalization, hash computation)
- Lineage Authority (DAG validation, persistence)
- Event Recording Authority (append-only events, event logging)
- Replay Authority (deterministic reconstruction, verification, invariants)
- Witness Authority (Merkle tree, witness computation)
- Policy Authority (constitutional documents)
- State Authority (derived from replay)
- Constitutional substrate (PostgreSQL schemas)
- Constitutional type system (branded types, interfaces)
