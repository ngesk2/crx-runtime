# PHASE 3: AUTHORITY DISCOVERY

**Audit Scope:** Search for identity, object, artifact, entity, event, ledger, replay, snapshot, state, canonical, evidence, lineage, hash, registry implementations across the ecosystem  
**Constitutional Root:** PING (C:\Users\nolan\PING)  

---

## IDENTITY AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts  
**Purpose:** SHA256 hash computation for canonical identity  
**Implementation:** `computeCanonicalHash(input: any): string`  
**Dependencies:** canonical_engine.ts, Node.js crypto  
**Constitutional Status:** YES - Identity Authority implementation  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts  
**Purpose:** Canonicalization using @crx/replay CanonicalJson  
**Implementation:** `canonicalize(value: unknown): string`  
**Dependencies:** @crx/replay  
**Constitutional Status:** YES - Identity Authority implementation (canonicalization)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts  
**Purpose:** Hash computation for constitutional identity  
**Implementation:** Hash authority for replay kernel  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Identity Authority implementation  

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Purpose:** Branded types for constitutional identity separation  
**Implementation:** EventId, ArtifactId, WitnessLeafId branded types with type guards  
**Dependencies:** None (pure TypeScript)  
**Constitutional Status:** YES - Constitutional primitive type system  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Objects table with content_hash field  
**Implementation:** PostgreSQL objects table with content_hash VARCHAR(64)  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own identity authority  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Purpose:** SQLite database with message_id as identity  
**Implementation:** newsletters table with message_id TEXT UNIQUE  
**Dependencies:** SQLite  
**Constitutional Status:** NO - Application-level identity (not constitutional)  

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Purpose:** SQLite database with url as identity  
**Implementation:** articles table with url TEXT UNIQUE  
**Dependencies:** SQLite  
**Constitutional Status:** NO - Application-level identity (not constitutional)  

---

## OBJECT AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\models\artifact.ts  
**Purpose:** Artifact interface definition  
**Implementation:** Artifact interface with artifact_type and content  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional primitive (Artifact)  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Objects table for object storage  
**Implementation:** PostgreSQL objects table with object_id, content_hash, lineage_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own object authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Expanded objects table with additional fields  
**Implementation:** PostgreSQL objects table with version, metadata, archived_at, deleted_at  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own object authority  

---

## ARTIFACT AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\models\artifact.ts  
**Purpose:** Artifact interface definition  
**Implementation:** Artifact interface with artifact_type and content  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional primitive (Artifact)  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\artifact_store.ts  
**Purpose:** PostgreSQL artifact storage  
**Implementation:** storeArtifact(id, artifact) inserts into artifacts table  
**Dependencies:** PostgreSQL pool  
**Constitutional Status:** YES - Persistence layer for constitutional artifacts  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Purpose:** Database schema for artifacts  
**Implementation:** artifacts table with artifact_id, artifact_type, content  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional substrate schema  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Artifact lineage table  
**Implementation:** artifact_lineage table with artifact_id, parent_artifact_id, origin_artifact_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own artifact authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Artifact registry table  
**Implementation:** artifact_registry table with artifact_id, artifact_type, artifact_name  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own artifact authority  

---

## EVENT AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Purpose:** Constitutional event logging to PostgreSQL events table  
**Implementation:** emitInferenceRequest, emitInferenceResponse, emitInferenceFailed  
**Dependencies:** PostgreSQL pool  
**Constitutional Status:** YES - Event Recording Authority implementation  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\events\event_log.ts  
**Purpose:** Event logging to execution_events table  
**Implementation:** logEvent(type, payload) inserts into execution_events  
**Dependencies:** PostgreSQL pool  
**Constitutional Status:** YES - Event Recording Authority implementation  

**File:** C:\Users\nolan\PING\database\events.sql  
**Purpose:** Event Authority Schema (append-only events table)  
**Implementation:** events table with append-only triggers  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional substrate schema (Event Recording Authority)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_event_envelope.ts  
**Purpose:** Constitutional event envelope structure  
**Implementation:** CanonicalEventEnvelope interface  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Event Recording Authority implementation  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\src\constitutional\event_emitter.py  
**Purpose:** Event emission to PostgreSQL events table  
**Implementation:** emit_event(stream, event_type, payload) inserts into events  
**Dependencies:** psycopg2  
**Constitutional Status:** DUPLICATE - Brain should not have its own event authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Events table for event sourcing  
**Implementation:** PostgreSQL events table with event_id, event_type, aggregate_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own event authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Expanded events table with additional fields  
**Implementation:** PostgreSQL events table with deleted_at, causation_id, correlation_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own event authority  

### Applications

**File:** C:\Users\nolan\CascadeProjects\crx-newsletter-brain\database.py  
**Purpose:** Application-level event emission via Brain constitutional module  
**Implementation:** Imports from brain: `from src.constitutional import emit_newsletter_created, emit_digest_generated`  
**Dependencies:** Brain constitutional module  
**Constitutional Status:** NO - Application using Brain's duplicate event authority  

**File:** C:\Users\nolan\CascadeProjects\crx-digestion-worker\database.py  
**Purpose:** Application-level event emission via Brain constitutional module  
**Implementation:** Imports from brain: `from src.constitutional import emit_article_created, emit_article_processing_failed`  
**Dependencies:** Brain constitutional module  
**Constitutional Status:** NO - Application using Brain's duplicate event authority  

---

## LINEAGE AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\lineage_store.ts  
**Purpose:** PostgreSQL lineage edge storage  
**Implementation:** storeLineage(parentIds, childId) inserts into lineage_edges  
**Dependencies:** PostgreSQL pool  
**Constitutional Status:** YES - Persistence layer for constitutional lineage  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\validation\dag_validator.ts  
**Purpose:** Lineage DAG validation (cycle detection, duplicate parent detection)  
**Implementation:** validateLineage(parentIds, childId) throws on violation  
**Dependencies:** None  
**Constitutional Status:** YES - Lineage Authority implementation (acyclicity enforcement)  

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Purpose:** Database schema for lineage_edges  
**Implementation:** lineage_edges table with parent_id, child_id  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional substrate schema  

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Purpose:** Lineage types for constitutional lineage  
**Implementation:** LineageEdge, LineageGraph interfaces  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional primitive type system  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Lineage table for object lineage  
**Implementation:** PostgreSQL lineage table with lineage_id, root_object_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own lineage authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Expanded lineage table with artifact lineage  
**Implementation:** PostgreSQL artifact_lineage table with artifact_id, parent_artifact_id  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own lineage authority  

---

## CANONICAL AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\canonical_engine.ts  
**Purpose:** Canonicalization using @crx/replay CanonicalJson  
**Implementation:** canonicalize(value: unknown): string  
**Dependencies:** @crx/replay  
**Constitutional Status:** YES - Identity Authority implementation (canonicalization)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_json.ts  
**Purpose:** Deterministic JSON canonicalization  
**Implementation:** CanonicalJson.canonicalize(value)  
**Dependencies:** None (pure TypeScript)  
**Constitutional Status:** YES - Identity Authority implementation (canonicalization)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_event_envelope.ts  
**Purpose:** Constitutional event envelope structure  
**Implementation:** CanonicalEventEnvelope interface with canonical bytes  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Event Recording Authority implementation  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Canonical documents table  
**Implementation:** PostgreSQL canonical_documents table with canonicalization_rules  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own canonical authority  

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\CANONICAL_SERIALIZATION.md  
**Purpose:** Documentation for canonical serialization  
**Implementation:** Documentation only  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own canonical authority documentation  

---

## HASH AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\engines\identity_engine.ts  
**Purpose:** SHA256 hash computation for canonical identity  
**Implementation:** computeCanonicalHash(input: any): string using Node.js crypto  
**Dependencies:** canonical_engine.ts, Node.js crypto  
**Constitutional Status:** YES - Identity Authority implementation (hash computation)  

**File:** C:\Users\nolan\PING\runtime\replay\canonical_hash_authority.ts  
**Purpose:** Hash computation for constitutional identity  
**Implementation:** Hash authority for replay kernel  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Identity Authority implementation  

**File:** C:\Users\nolan\PING\gateway\event_emitter.js  
**Purpose:** Hash computation for request/response tracking  
**Implementation:** hashString(content) using SHA256  
**Dependencies:** Node.js crypto  
**Constitutional Status:** YES - Identity Authority implementation (hash computation)  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\HASH_AUTHORITY.md  
**Purpose:** Documentation for hash authority  
**Implementation:** Documentation only  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own hash authority documentation  

---

## REPLAY AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts  
**Purpose:** Deterministic reconstruction from event stream  
**Implementation:** DeterministicReplayEngine class  
**Dependencies:** replay_types.ts, canonical_json.ts  
**Constitutional Status:** YES - Replay Authority implementation (core constitutional primitive)  

**File:** C:\Users\nolan\PING\runtime\replay\replay_state_machine.ts  
**Purpose:** State machine for replay execution  
**Implementation:** ReplayStateMachine class  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Replay Authority implementation  

**File:** C:\Users\nolan\PING\runtime\replay\replay_verification.ts  
**Purpose:** Replay integrity verification  
**Implementation:** ReplayVerification class  
**Dependencies:** replay_types.ts, invariant_runner.ts  
**Constitutional Status:** YES - Replay Authority implementation (verification)  

**File:** C:\Users\nolan\PING\runtime\replay\invariant_runner.ts  
**Purpose:** Invariant checking during replay  
**Implementation:** InvariantRunner class  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Replay Authority implementation (invariant enforcement)  

**File:** C:\Users\nolan\PING\runtime\replay\replay_invariants.ts  
**Purpose:** Constitutional invariant definitions  
**Implementation:** Invariant definitions  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Constitutional law (invariants)  

**File:** C:\Users\nolan\PING\runtime\replay\replay_event_stream.ts  
**Purpose:** Event stream for replay  
**Implementation:** ReplayEventStream class  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Replay Authority implementation  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Replay runs table for replay tracking  
**Implementation:** PostgreSQL replay_runs table with replay_id, replay_mode  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own replay authority  

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\REPLAY_ARCHITECTURE.md  
**Purpose:** Documentation for replay architecture  
**Implementation:** Documentation only  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own replay authority documentation  

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\REPLAY_LAW.md  
**Purpose:** Documentation for replay law  
**Implementation:** Documentation only  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own replay authority documentation  

---

## STATE AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\replay\replay_types.ts  
**Purpose:** State types for constitutional state  
**Implementation:** ReplayState, ArtifactState interfaces  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional primitive type system  

**File:** C:\Users\nolan\PING\runtime\replay\deterministic_replay_engine.ts  
**Purpose:** State reconstruction from events  
**Implementation:** Deterministic reconstruction of state  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Replay Authority implementation (state reconstruction)  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Projections table for derived state  
**Implementation:** PostgreSQL projections table with projection_data  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own state authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Projection registry for projection management  
**Implementation:** PostgreSQL projection_registry table with projection_schema  
**Dependencies:** PostgreSQL  
**Constitutional Status:** DUPLICATE - Brain should not have its own state authority  

**File:** C:\Users\nolan\CascadeProjects\brain\docs\architecture\STATE_TRANSITION_LAW.md  
**Purpose:** Documentation for state transition law  
**Implementation:** Documentation only  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own state authority documentation  

---

## ENTITY AUTHORITY

### PING Implementation

**None** - PING does not have entity authority (entities are application-level concepts)

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Entities table for entity storage  
**Implementation:** PostgreSQL entities table with entity_id, entity_type, entity_name  
**Dependencies:** PostgreSQL  
**Constitutional Status:** NO - Entity authority is application-level, not constitutional  

---

## REGISTRY AUTHORITY

### PING Implementation

**None** - PING does not have registry authority (registries are application-level concepts)

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Artifact registry for artifact tracking  
**Implementation:** PostgreSQL artifact_registry table with artifact_id, artifact_type  
**Dependencies:** PostgreSQL  
**Constitutional Status:** NO - Registry authority is application-level, not constitutional  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Projection registry for projection management  
**Implementation:** PostgreSQL projection_registry table with projection_schema  
**Dependencies:** PostgreSQL  
**Constitutional Status:** NO - Registry authority is application-level, not constitutional  

---

## SNAPSHOT AUTHORITY

### PING Implementation

**None** - PING does not have snapshot authority (snapshots are application-level concepts)

### Brain Implementation

**None** - No snapshot authority found in Brain

---

## EVIDENCE AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\replay\witness_authority.ts  
**Purpose:** Witness computation and verification  
**Implementation:** WitnessAuthority class  
**Dependencies:** replay_types.ts, merkle_tree.ts  
**Constitutional Status:** YES - Witness Authority implementation (derived from Identity + Replay)  

**File:** C:\Users\nolan\PING\runtime\replay\merkle_tree.ts  
**Purpose:** Merkle tree computation for witness proofs  
**Implementation:** MerkleTree class  
**Dependencies:** replay_types.ts  
**Constitutional Status:** YES - Witness Authority implementation (data structure)  

### Brain Implementation

**None** - No evidence/witness authority found in Brain

---

## LEDGER AUTHORITY

### PING Implementation

**File:** C:\Users\nolan\PING\runtime\kernel\commit-service\src\persistence\ledger_schema.sql  
**Purpose:** Database schema for artifacts, lineage_edges, execution_events  
**Implementation:** PostgreSQL schema for constitutional ledger  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional substrate schema  

**File:** C:\Users\nolan\PING\database\events.sql  
**Purpose:** Event Authority Schema (append-only events table)  
**Implementation:** PostgreSQL events table with append-only triggers  
**Dependencies:** None  
**Constitutional Status:** YES - Constitutional substrate schema (Event Recording Authority)  

### Brain Implementation

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema.sql  
**Purpose:** Canonical state schema for objects, events, lineage  
**Implementation:** PostgreSQL schema for canonical state  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own ledger authority  

**File:** C:\Users\nolan\CascadeProjects\brain\constitutional\canonical_state\schema_expanded.sql  
**Purpose:** Expanded canonical state schema  
**Implementation:** PostgreSQL schema with additional tables  
**Dependencies:** None  
**Constitutional Status:** DUPLICATE - Brain should not have its own ledger authority  

---

## SUMMARY

### CONSTITUTIONAL AUTHORITIES (PING - Correct Location)

1. **Identity Authority** - identity_engine.ts, canonical_engine.ts, canonical_hash_authority.ts, replay_types.ts
2. **Lineage Authority** - lineage_store.ts, dag_validator.ts, ledger_schema.sql, replay_types.ts
3. **Event Recording Authority** - event_emitter.js, event_log.ts, events.sql, canonical_event_envelope.ts
4. **Replay Authority** - deterministic_replay_engine.ts, replay_state_machine.ts, replay_verification.ts, invariant_runner.ts, replay_invariants.ts, replay_event_stream.ts
5. **Witness Authority** - witness_authority.ts, merkle_tree.ts
6. **Canonical Authority** - canonical_engine.ts, canonical_json.ts, canonical_event_envelope.ts
7. **Hash Authority** - identity_engine.ts, canonical_hash_authority.ts, event_emitter.js
8. **State Authority** - replay_types.ts, deterministic_replay_engine.ts
9. **Ledger Authority** - ledger_schema.sql, events.sql

### DUPLICATE AUTHORITIES (Brain - Should Be Removed)

1. **Event Recording Authority** - src/constitutional/event_emitter.py (DUPLICATE of PING's event_emitter.js)
2. **Object Authority** - constitutional/canonical_state/schema.sql objects table (DUPLICATE)
3. **Artifact Authority** - constitutional/canonical_state/schema_expanded.sql artifact_lineage, artifact_registry (DUPLICATE)
4. **Lineage Authority** - constitutional/canonical_state/schema.sql lineage table (DUPLICATE)
5. **Canonical Authority** - constitutional/canonical_state/schema_expanded.sql canonical_documents table (DUPLICATE)
6. **Replay Authority** - constitutional/canonical_state/schema_expanded.sql replay_runs table (DUPLICATE)
7. **State Authority** - constitutional/canonical_state/schema.sql projections table (DUPLICATE)
8. **Ledger Authority** - constitutional/canonical_state/schema.sql, schema_expanded.sql (DUPLICATE of PING's events.sql)

### APPLICATION-LEVEL (Not Constitutional)

1. **Entity Authority** - Brain's entities table (application-level, not constitutional)
2. **Registry Authority** - Brain's artifact_registry, projection_registry tables (application-level, not constitutional)
3. **Application State** - crx-newsletter-brain's newsletters.db (application-level, not constitutional)
4. **Application State** - crx-digestion-worker's knowledge.db (application-level, not constitutional)

### ANSWER

**What constitutional authorities exist?**
- PING has all constitutional authorities: Identity, Lineage, Event Recording, Replay, Witness, Canonical, Hash, State, Ledger
- Brain has duplicate implementations of most constitutional authorities
- Applications have application-level state (entities, registries) that are not constitutional

**Where are they located?**
- PING (C:\Users\nolan\PING) - Correct location for constitutional authorities
- Brain (C:\Users\nolan\CascadeProjects\brain) - Duplicate implementations that should be removed
- Applications (crx-newsletter-brain, crx-digestion-worker) - Application-level state only

**What needs to be consolidated?**
- Brain's event_emitter.py should be removed (applications should use PING's event_emitter.js)
- Brain's canonical_state schemas should be removed (applications should use PING's events.sql)
- Applications should import from PING, not from Brain
- Brain should focus on Brain-specific functionality (knowledge, memory, retrieval), not constitutional primitives
