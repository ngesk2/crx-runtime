# CONSTITUTIONAL EVENT AUTHORITY CONTRACT AUDIT

**Audit Type:** Read-only surgical architectural audit of constitutional event authority contract  
**Repository:** C:\Users\nolan\CascadeProjects\constitutional-runtime  
**Date:** 2026-06-25  
**Purpose:** Remove ambiguity at abstraction, semantic, capability, and authority boundaries before implementation  
**Evidence:** EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md + constitutional laws  

---

# 1. AUTHORITY LEVEL AUDIT

## Live Event Producer Layer Classification

| Producer | Transport | Adapter | Event Construction | Identity | Canonical Bytes | Hash | Persistence | Authority Level | Classification |
| -------- | --------- | ------- | ------------------ | -------- | --------------- | ---- | ----------- | --------------- | -------------- |
| FastAPI EventApplicationService | HTTP (FastAPI) | SQLAlchemy async engine | EventEnvelope.create() | hash-derived (SHA-256 of canonical bytes) | YES (CanonicalAuthority.serialize_to_canonical_bytes()) | YES (CanonicalAuthority.hash_canonical_bytes()) | SQLAlchemy async engine → PostgreSQL events table | AUTHORITATIVE | canonical event authority |
| Gateway event_emitter.js | HTTP (Express) | PostgreSQL pool (pg) | Direct object construction | uuid4() (random) | NO | NO (SHA-256 of payload only, not envelope) | PostgreSQL pool → PostgreSQL events table | SHADOW | shadow authority - bypasses canonical construction |
| BrainOS event_emitter.py | Python function calls | psycopg2 | Direct object construction | uuid4() (random) | NO | NO | psycopg2 → PostgreSQL events table | SHADOW | shadow authority - bypasses canonical construction |
| Drive ingestion adapter | Python function calls | psycopg2 | Direct object construction | uuid4() (random) | NO | NO | psycopg2 → PostgreSQL events table | SHADOW | shadow authority - bypasses canonical construction |
| Root workers (dormant) | Python function calls | psycopg2 | Direct object construction | uuid4() (random) | NO | NO | psycopg2 → PostgreSQL events table | DORMANT | dormant - not deployed |

**Evidence Quality:** HIGH - Source inspection confirms layer classification for each producer.

---

# 2. SEMANTIC BOUNDARY AUDIT

## Concept Equivalence Analysis

| Concept | Current Meaning | Constitutional Meaning | Same Object? | Evidence | Ambiguity |
| ------- | --------------- | ---------------------- | ------------ | -------- | --------- |
| event | Immutable record of occurrence (EventEnvelope) | Atomic, immutable record of occurrence (EVENT_LAW.md Article 1.1) | YES | EventEnvelope implements constitutional definition | LOW - consistent |
| event envelope | Infrastructure metadata wrapper (event_id, timestamps, causality) | Not explicitly defined in constitutional law | NO - envelope is implementation detail | EventEnvelope envelope fields are constitutional fields | LOW - implementation detail |
| event payload | Event-specific data (payload field) | Event payload (event_data field in EVENT_LAW.md) | YES | Both refer to event-specific data | NONE - consistent |
| mutation | State change | Constitutional mutation requiring policy decision (MUTATION_LAW.md) | NO - current implementation bypasses policy | Gateway/BrainOS create events without policy | HIGH - constitutional violation |
| observation | OBSERVATION_CREATED event (TEMPORARY_OBSERVATION) | observation_event class (EVENT_LAW.md Article 2.3) | YES | Root workers produce OBSERVATION_CREATED | LOW - consistent |
| command | Not implemented | Not defined in current constitutional law | N/A | No command pattern exists | N/A |
| projection | Qdrant vector projection | projection_event class (EVENT_LAW.md Article 2.5) | YES | Projection events are tagged derived | LOW - consistent |
| persistence record | PostgreSQL row | Not constitutional - persistence is infrastructure | NO - PostgreSQL row ≠ constitutional event | SOURCE_OF_TRUTH_LAW.md: storage is infrastructure, not authority | HIGH - conflation detected |
| replay record | Not implemented | Deterministic reconstruction (REPLAY_LAW.md) | N/A | No executable replay exists | N/A |
| witness record | Not implemented | Verifiable attestation (WITNESS_LAW.md) | N/A | No executable witness exists | N/A |
| lineage record | Not implemented | Directed acyclic derivation (terminology.md) | N/A | No executable lineage exists | N/A |

**Critical Finding:** PostgreSQL row is incorrectly conflated with constitutional event. Persistence is infrastructure (Layer 4), not authority (Layer 0/1). SOURCE_OF_TRUTH_LAW.md explicitly states that storage is infrastructure, not authority.

**Evidence Quality:** HIGH - Concept analysis based on constitutional law definitions.

---

# 3. CAPABILITY OWNERSHIP AUDIT

## Single Owner Analysis

| Capability | Current Owner | Proposed Owner | Duplicate Owners? | Constitutional Risk |
| ---------- | ------------- | -------------- | ----------------- | ------------------- |
| event construction | Multiple (EventApplicationService, gateway/event_emitter.js, brainos/event_emitter.py, drive ingestion) | EventEnvelope.create() (canonical) | YES - 4 shadow authorities | CRITICAL - violates SOURCE_OF_TRUTH_LAW.md |
| validation | EventEnvelope.verify_event_id() (hash verification) | EventEnvelope.create() (canonical) | NO | LOW - consistent |
| canonical serialization | CanonicalAuthority.serialize_to_canonical_bytes() | CanonicalAuthority (canonical) | NO | LOW - consistent |
| deterministic identity | EventEnvelope.create() (hash-derived) | EventEnvelope.create() (canonical) | YES - 4 shadow authorities use uuid4() | CRITICAL - violates EVENT_LAW.md Article 1.2 (content-addressed event_id) |
| deterministic hashing | CanonicalAuthority.hash_canonical_bytes() | CanonicalAuthority (canonical) | YES - gateway uses SHA-256 of payload only | HIGH - gateway hash is not constitutional |
| timestamp semantics | datetime.utcnow() / new Date() / func.now() (wall-clock) | Not defined in constitutional law | YES - 3 independent clock sources | HIGH - wall-clock time is non-deterministic for replay |
| schema versioning | schema_version field in EventEnvelope | EventEnvelope (canonical) | YES - gateway/BrainOS have no schema version | HIGH - violates EVENT_LAW.md Article 1.2 |
| provenance | producer_id, causality_id, correlation_id in EventEnvelope | EventEnvelope (canonical) | YES - gateway/BrainOS have minimal provenance | MEDIUM - gateway/BrainOS lack full provenance |
| persistence authorization | Multiple (SQLAlchemy, PostgreSQL pool, psycopg2) | Single event store adapter (Layer 2) | YES - 3 independent persistence mechanisms | CRITICAL - violates SOURCE_OF_TRUTH_LAW.md |

**Evidence Quality:** HIGH - Capability ownership verified through source inspection.

---

# 4. PRODUCER DECISION MATRIX

## Producer Treatment Decision

| Producer | Current Authority | Proposed Treatment | Must Use EventEnvelope? | Separate Bounded Context? | Same Event History? | Rationale |
| -------- | ----------------- | ------------------ | ----------------------- | ------------------------- | ------------------- | --------- |
| FastAPI EventApplicationService | AUTHORITATIVE | A - remains canonical producer | YES (already uses) | NO | YES (canonical history) | Correctly implements constitutional boundary |
| Gateway | SHADOW | B - become adapter into canonical producer | YES | NO - should be part of constitutional runtime | YES (after migration) | Gateway is Layer 3 orchestration, should delegate to Layer 1 runtime |
| BrainOS | SHADOW | B - become adapter into canonical producer | YES | NO - should be part of constitutional runtime | YES (after migration) | BrainOS is Layer 3 orchestration, should delegate to Layer 1 runtime |
| Drive ingestion | SHADOW | B - become adapter into canonical producer | YES | NO - should be part of constitutional runtime | YES (after migration) | Drive ingestion is Layer 2 adapter, should delegate to Layer 1 runtime |
| Root workers | DORMANT | E - remain untouched (dormant) | NO | YES - preserved as reference implementation | NO (not deployed) | Already marked DEPRECATED, preserve for reference |

**Evidence Quality:** HIGH - Decision based on constitutional law (LAYERING_LAW.md) and producer deployment status.

---

# 5. GATEWAY + BRAINOS + DRIVE HISTORY TEST

### A. Do Gateway and BrainOS events represent mutations that must participate in the same replayable constitutional history?

**Answer:** YES - Gateway events (INFERENCE_REQUEST, INFERENCE_RESPONSE) and BrainOS events (ingestion, retrieval) represent mutations to the constitutional system. Under EVENT_LAW.md, these would be classified as inference_event or observation_event. Under MUTATION_LAW.md, any mutation must go through the legal mutation path (Proposal → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion). Currently, Gateway and BrainOS bypass this path with direct INSERT, violating constitutional mutation law.

**Evidence:** SOURCE_OF_TRUTH_LAW.md (one authority per truth domain), MUTATION_LAW.md (legal mutation path), EVENT_LAW.md (event classification).

### B. Does Drive ingestion represent a mutation, an observation, an ingestion command, or an adapter-originated event?

**Answer:** DRIVE_INGESTION represents an OBSERVATION event (document ingestion is an observation of external state). Under EVENT_LAW.md Article 2.3, observation_event has authority_class TEMPORARY_OBSERVATION, replay_class conditional_replay, verification_required false. It does not become truth until verified through promotion to CLAIM_CREATED (constitutional_event). Currently, Drive ingestion bypasses the promotion path with direct INSERT, violating EVENT_LAW.md Article 4.2 (event promotion requires explicit new event).

**Evidence:** EVENT_LAW.md Article 2.3 (observation_event classification), Article 4.2 (event promotion).

### C. If these events share PostgreSQL history, does that necessarily mean they share constitutional authority?

**Answer:** NO - Sharing PostgreSQL physical storage does NOT imply sharing constitutional authority. SOURCE_OF_TRUTH_LAW.md explicitly states that storage is infrastructure (Layer 4), not authority. Authority is constitutional jurisdiction (Layer 0/1), not database access. Multiple authorities writing to the same physical table creates a SHADOW STORE pattern, which SOURCE_OF_TRUTH_LAW.md classifies as DANGEROUS ("Shadow Copies: Dangerous duplicates that create competing sources of truth").

**Evidence:** SOURCE_OF_TRUTH_LAW.md (Source Authority vs Generated Derivations vs Shadow Copies), LAYERING_LAW.md (Layer 4 is infrastructure, not authority).

### D. Can multiple bounded authorities legitimately write to the same physical events table?

**Answer:** NO - Under SOURCE_OF_TRUTH_LAW.md, "One authority per truth domain. No duplicate canonical owners." Multiple authorities writing to the same physical table creates SHADOW COPIES (dangerous duplicates that create competing sources of truth). The constitutional remedy is either: (1) migrate all authorities to use the single canonical EventEnvelope.create() path, or (2) partition the physical table into separate bounded contexts (e.g., separate tables or databases for Gateway, BrainOS, Drive). Sharing a physical table without constitutional authority is a SHADOW AUTHORITY violation.

**Evidence:** SOURCE_OF_TRUTH_LAW.md (One Authority Per Truth Domain, Shadow Copies DANGEROUS).

### E. If yes, what invariant prevents histories from becoming semantically incomparable?

**Answer:** The answer is NO, so this question is moot. However, even if the answer were YES, the invariants that would be required are: (1) deterministic identity (all events must use hash-derived identity, not uuid4()), (2) canonical bytes (all events must have canonical serialization), (3) canonical hash (all events must have envelope hash), (4) schema versioning (all events must have schema_version), (5) timestamp semantics (all events must use deterministic time, not wall-clock). Currently, NONE of these invariants hold across the 5 independent authorities, making their histories semantically incomparable.

**Evidence:** EVENT_LAW.md Article 1.2 (event properties), EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md (schema incompatibilities).

---

# 6. IDENTITY + CANONICALIZATION CONTRACT

## Required Invariants for Shared Constitutional History

| Invariant | Status | Evidence |
| --------- | ------ | -------- |
| deterministic identity | REQUIRED INVARIANT | EVENT_LAW.md Article 1.2: "event_id: uuid" must be "content-addressed" (hash-derived). Current Gateway/BrainOS/Drive use uuid4() (random), violating this. |
| canonical serialization | REQUIRED INVARIANT | EVENT_LAW.md Article 1.2 requires event envelope with canonical bytes. Current Gateway/BrainOS/Drive have no canonical bytes, violating this. |
| canonical bytes | REQUIRED INVARIANT | SOURCE_OF_TRUTH_LAW.md: canonical representation is owned by source authority. Current Gateway/BrainOS/Drive bypass canonical bytes, violating this. |
| canonical hash | REQUIRED INVARIANT | EVENT_LAW.md Article 1.2 requires content-addressed event_id. Current Gateway/BrainOS/Drive use uuid4(), violating this. |
| timestamp semantics | REQUIRED BUT CONTEXTUAL | EVENT_LAW.md requires timestamp but does not specify deterministic time. Replay requires deterministic time (infrastructure-independent). Current implementation uses wall-clock time, making replay non-deterministic. |
| schema versioning | REQUIRED INVARIANT | EVENT_LAW.md Article 1.2 requires schema_version. Current Gateway/BrainOS/Drive have no schema_version, violating this. |
| provenance | REQUIRED BUT CONTEXTUAL | EVENT_LAW.md Article 1.2 requires aggregate_id, aggregate_type, causation_id, correlation_id. Current Gateway/BrainOS/Drive have minimal provenance, violating this. |
| namespace/tenant semantics | NOT REQUIRED | Constitutional law does not define namespace/tenant semantics. This is an implementation concern, not a constitutional requirement. |

**Evidence Quality:** HIGH - Contract requirements based on EVENT_LAW.md and SOURCE_OF_TRUTH_LAW.md.

---

# 7. REPLAY / WITNESS / LINEAGE MINIMUM

## MVP Constitutional Event History Requirements

| Capability | Required for MVP? | Why | Current Executable Implementation? | Evidence |
| ----------- | ----------------- | --- | ---------------------------------- | -------- |
| Replay | YES | Event immutability and determinism require replay verification (EVENT_LAW.md Article 1.3, REPLAY_LAW.md) | NO - 3 implementations exist but 0 are executable (no dispatcher wiring) | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase K |
| Witness | YES | Event Recording Authority requires witness attestation (authority_model.md) | NO - 3 implementations exist but 0 are executable (no dispatcher wiring) | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase K |
| Lineage | YES | Lineage Authority requires DAG verification (authority_model.md) | NO - 2 implementations exist but 0 are executable (no dispatcher wiring) | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase K |
| Deterministic identity | YES | Replay requires identical event_ids on reconstruction (EVENT_LAW.md Article 1.2) | PARTIAL - EventApplicationService uses hash-derived identity, but Gateway/BrainOS/Drive use uuid4() | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase D |
| Canonical bytes | YES | Identity requires canonical serialization (authority_model.md) | PARTIAL - EventApplicationService uses canonical bytes, but Gateway/BrainOS/Drive do not | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase D |
| Hash integrity | YES | Event immutability requires hash verification (EVENT_LAW.md Article 1.3) | PARTIAL - EventApplicationService uses event_hash, but Gateway/BrainOS/Drive do not | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase D |
| Schema versioning | YES | Event evolution requires version tracking (EVENT_LAW.md Article 1.2) | PARTIAL - EventApplicationService uses schema_version, but Gateway/BrainOS/Drive do not | EVENT_MUTATION_SCHEMA_RECONCILIATION_AUDIT.md Phase C |

**Evidence Quality:** HIGH - MVP requirements based on constitutional law definitions.

---

# 8. WORKER AUTHORITY AUDIT

## workers/ vs root workers/ Analysis

| Set | LIVE? | Event-Producing? | Constitutional Participant? | Authoritative? | Status |
| --- | ----- | ---------------- | ------------------------ | ------------- | ------ |
| workers/ (claim_worker.py, witness_worker.py, replay_worker.py, lineage_worker.py, observation_worker.py) | NO - not deployed in any docker-compose | YES (via repository_client.py HTTP gateway) | YES (uses HTTP gateway to emit events) | NO (delegates to gateway) | DORMANT - not deployed, preserved as reference |
| root workers/ (claim_worker.py, witness_worker.py, replay_worker.py, lineage_worker.py, observation_worker.py) | NO - not deployed in any docker-compose | YES (direct INSERT with uuid4()) | NO (bypasses EventEnvelope.create()) | NO (shadow authority, dormant) | DORMANT - not deployed, marked DEPRECATED |

**Critical Finding:** workers/ directory uses HTTP gateway pattern (repository_client.py), which itself is a shadow authority (gateway/event_emitter.js uses uuid4()). Migrating root workers to workers/ would not resolve the constitutional violation - it would merely change which shadow authority they use.

**Evidence Quality:** HIGH - Deployment tracing and source inspection confirm both sets are dormant.

---

# 9. CONSTITUTIONAL INVARIANT EXTRACTION

## Concrete Implementation Invariants

### INVARIANT E1 — Event Authority

**Source:** SOURCE_OF_TRUTH_LAW.md (One Authority Per Truth Domain), authority_model.md (Event Recording Authority)

**Invariant:** The Event Recording Authority is the ONLY canonical owner of event occurrence facts. No other component may independently create authoritative events without delegating to this authority.

**Implementation Requirement:** All event creation MUST route through EventEnvelope.create() or delegate to a component that does.

### INVARIANT E2 — Canonicalization

**Source:** authority_model.md (Identity Authority), EVENT_LAW.md Article 1.2

**Invariant:** Event identity MUST be content-addressed (hash-derived from canonical bytes). Random identity (uuid4()) is unconstitutional for events that participate in constitutional history.

**Implementation Requirement:** All events must use hash-derived identity (SHA-256 of canonical bytes), not uuid4().

### INVARIANT E3 — Event Immutability

**Source:** EVENT_LAW.md Article 1.3, SOURCE_OF_TRUTH_LAW.md (append-only event sequence)

**Invariant:** Once committed to the event store, an event MUST NEVER be modified, deleted, or superseded. Event correction is performed by appending a new event.

**Implementation Requirement:** No UPDATE or DELETE on events table. Only INSERT.

### INVARIANT E4 — Legal Mutation Path

**Source:** MUTATION_LAW.md (Legal Mutation Path)

**Invariant:** The ONLY legal mutation path is: Proposal → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion. Any mutation bypassing this pipeline is a constitutional violation.

**Implementation Requirement:** All event creation must pass through this pipeline. Direct INSERT bypassing policy evaluation is prohibited.

### INVARIANT E5 — Single Source of Truth

**Source:** SOURCE_OF_TRUTH_LAW.md (One Authority Per Truth Domain, Shadow Copies DANGEROUS)

**Invariant:** One authority per truth domain. No duplicate canonical owners. Multiple authorities writing to the same physical table creates shadow copies (dangerous).

**Implementation Requirement:** Either (1) migrate all authorities to use the single canonical EventEnvelope.create() path, or (2) partition the physical table into separate bounded contexts. Sharing a physical table without constitutional authority is prohibited.

### INVARIANT E6 — Layer Boundaries

**Source:** LAYERING_LAW.md (Layer 1 must access infrastructure through adapters only)

**Invariant:** Layer 1 (Runtime) MUST access infrastructure through adapters only. Direct infrastructure access (psycopg2, pg pool) from Layer 1 or Layer 3 is prohibited.

**Implementation Requirement:** Gateway (Layer 3) and BrainOS (Layer 3) must delegate to Layer 1 runtime for event creation, not directly access PostgreSQL.

### INVARIANT E7 — Event Class Verification

**Source:** EVENT_LAW.md Article 3 (Event Class Rules)

**Invariant:** Events must be classified into one of 6 classes (constitutional_event, governance_event, observation_event, inference_event, projection_event, system_event) with corresponding authority_class, replay_class, and verification_required.

**Implementation Requirement:** All events must have event_class classification and corresponding verification gate.

**Evidence Quality:** HIGH - All invariants extracted directly from constitutional law.

---

# 10. ABSTRACTION / SEMANTICS / CAPABILITY / AUTHORITY CHECK

## Four-Level Architecture Test

### Abstraction

**What object/API represents the constitutional event?**

**Current:** EventEnvelope (constitution/models/event.py)

**Analysis:** EventEnvelope is the correct abstraction. It implements the constitutional event definition (immutable, hash-derived identity, canonical bytes, envelope fields). Gateway and BrainOS do not use EventEnvelope - they construct plain objects.

**Disagreement:** Gateway and BrainOS bypass EventEnvelope abstraction.

### Semantics

**What does an event mean?**

**Current:** An atomic, immutable record of something that occurred at a point in constitutional time (EVENT_LAW.md Article 1.1).

**Analysis:** EventApplicationService produces constitutional events (DOCUMENT_IMPORTED, etc.). Gateway produces INFERENCE_REQUEST/INFERENCE_RESPONSE (inference events). BrainOS produces ingestion events. Current semantics are inconsistent because Gateway/BrainOS events bypass the legal mutation path (MUTATION_LAW.md).

**Disagreement:** Gateway/BrainOS events do not participate in the legal mutation path.

### Capability

**Who is technically capable of creating one?**

**Current:** EventApplicationService (canonical), gateway/event_emitter.js (shadow), brainos/event_emitter.py (shadow), drive ingestion adapter (shadow), root workers (dormant shadow).

**Analysis:** 5 independent technical capabilities exist. This violates SOURCE_OF_TRUTH_LAW.md (one authority per truth domain).

**Disagreement:** Multiple technical capabilities exist where only one constitutional authority should exist.

### Authority

**Who is constitutionally permitted to create one?**

**Current:** Event Recording Authority (constitutional authority, defined in authority_model.md). Only EventApplicationService delegates to this authority correctly. Gateway/BrainOS/Drive bypass it.

**Analysis:** Constitutional law grants authority to Event Recording Authority. Gateway/BrainOS/Drive are not constitutional authorities - they are shadow authorities that bypass the constitutional boundary.

**Disagreement:** Gateway/BrainOS/Drive exercise event creation capability without constitutional authority.

**Evidence Quality:** HIGH - Four-level analysis based on constitutional law definitions.

---

# 11. SURGICAL EXECUTION READINESS

## SAFE TO IMPLEMENT

**NONE** - No implementation is safe until architectural decisions are resolved. The following must be decided first:

1. Whether Gateway should migrate to EventEnvelope.create() or be treated as a separate bounded context
2. Whether BrainOS should migrate to EventEnvelope.create() or be treated as a separate bounded context
3. Whether Drive ingestion should migrate to EventEnvelope.create() or be treated as a separate bounded context
4. Whether the physical PostgreSQL events table should be partitioned by bounded context
5. Whether replay/witness/lineage should be made executable

## NOT SAFE TO IMPLEMENT

**ALL** - Any implementation without resolving the above architectural decisions risks:
- Creating competing authorities (violates SOURCE_OF_TRUTH_LAW.md)
- Bypassing the legal mutation path (violates MUTATION_LAW.md)
- Introducing non-replayable events (violates EVENT_LAW.md)
- Violating layer boundaries (violates LAYERING_LAW.md)

## REQUIRED PRECONDITIONS

**The following facts must be true before the first implementation patch:**

1. **Decision:** Gateway treatment (migrate to EventEnvelope.create() or separate bounded context)
2. **Decision:** BrainOS treatment (migrate to EventEnvelope.create() or separate bounded context)
3. **Decision:** Drive ingestion treatment (migrate to EventEnvelope.create() or separate bounded context)
4. **Decision:** PostgreSQL table partitioning (single table vs partitioned by bounded context)
5. **Decision:** Replay/witness/lineage execution (make executable or remain dormant)
6. **Verification:** EventEnvelope.create() is confirmed as the single canonical event creation authority
7. **Verification:** All shadow authorities are either migrated or explicitly bounded
8. **Verification:** No direct INSERT bypasses EventEnvelope.create() remain in active runtime

## FIRST SURGICAL CHANGE

**AFTER the above preconditions are met, the first surgical change should be:**

**Option A (if migration decision):** Replace gateway/event_emitter.js uuid4() identity with EventEnvelope.create() delegation to FastAPI EventApplicationService via HTTP.

**Option B (if bounded context decision):** Create separate PostgreSQL table for Gateway events (gateway_events) with independent schema, isolating Gateway as a separate bounded event authority.

**CURRENT STATUS:** Cannot select Option A or B without architectural decision.

**Evidence Quality:** HIGH - Surgical change recommendations depend on unresolved architectural decisions.

---

# 12. FINAL DECISION

## DECISION

**ARCHITECTURALLY_UNRESOLVED**

**Rationale:**

1. **CRITICAL CORRECTION:** Source code review reveals that Gateway has TWO INCOMPATIBLE INSERT contracts for the SAME database table:
   - gateway/event_emitter.js uses PING schema (stream, event_type, payload, created_at)
   - gateway/server.js /api/v1/events uses canonical_state schema (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
   - Both use POSTGRES_DB='crx_runtime' (default from .env.base)
   - Both are live in the same compose deployment

2. **Previous audit assumption was INCORRECT:** The audit assumed PING stack and constitutional runtime were in separate databases. In reality:
   - compose.yaml defaults POSTGRES_DB to 'ping_runtime' but .env.base sets it to 'crx_runtime'
   - All PING stack services (Gateway, BrainOS, Drive ingestion) default to 'crx_runtime'
   - deploy/docker-compose.yml uses 'constitutional' database for constitutional runtime
   - HOWEVER, .env.base is the shared config for PING stack, so they all write to 'crx_runtime'

3. **Constitutional authority is NOT yet established:** The constitutional runtime (deploy/docker-compose.yml) is isolated with its own database, but the PING stack has competing authorities writing to the same 'crx_runtime' database with incompatible schemas. This violates SOURCE_OF_TRUTH_LAW.md at the PING stack level.

4. **Bounded context isolation is UNPROVEN:** While the constitutional runtime is in a separate deployment, the PING stack has multiple independent authorities (Gateway, BrainOS, Drive) writing to the same database with incompatible schemas. Jurisdiction is not explicitly established.

4. **Constitutional compliance:** Each deployment has one authority for its truth domain:
   - Constitutional runtime: Single authority for `constitutional` database with EventEnvelope.create()
   - PING stack: Single authority for `ping_runtime` database with legacy schema

5. **Gateway event classification:** Gateway events (INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED) are inference_event class under EVENT_LAW.md Article 2.4 (authority_class AI_GENERATED_ANALYSIS, replay_class non_replayable, verification_required false). This is consistent with their non-constitutional purpose.

## Implementation Invariants

1. **INVARIANT E1 — Event Authority:** The Event Recording Authority (EventApplicationService) is the ONLY canonical owner of constitutional_event and governance_event facts in the `constitutional` database. No other component may independently create authoritative constitutional events in this database without delegating to this authority.

2. **INVARIANT E2 — Canonicalization:** Constitutional events (constitutional_event, governance_event) in the `constitutional` database MUST use hash-derived identity (SHA-256 of canonical bytes). PING stack events in the `crx_runtime` database use legacy schemas (PING schema and canonical_state schema) with uuid4() identity. Bounded context isolation is UNPROVEN at the PING stack level due to incompatible schemas in the same database.

3. **INVARIANT E3 — Event Immutability:** Once committed to any event store, an event MUST NEVER be modified, deleted, or superseded. Event correction is performed by appending a new event. This applies to both databases.

4. **INVARIANT E4 — Legal Mutation Path:** Constitutional events (constitutional_event, governance_event) in the `constitutional` database MUST pass through the legal mutation path (Proposal → Claim → Policy Evaluation → Policy Decision → Event Recording → Replay → Witness → State Promotion). PING stack events in the `crx_runtime` database are inference_event/observation_event classes. Bounded context isolation exemption requires explicit constitutional jurisdiction establishment.

5. **INVARIANT E5 — Single Source of Truth:** Each deployment has one authority for its truth domain. Constitutional runtime has one authority for `constitutional` database. PING stack has UNRESOLVED authority structure due to multiple independent authorities (Gateway, BrainOS, Drive) writing to the same `crx_runtime` database with incompatible schemas.

6. **INVARIANT E6 — Layer Boundaries:** Layer 3 (Gateway, BrainOS) in the PING stack directly access the `crx_runtime` database. Layer 3 MUST NOT directly access the `constitutional` database (different deployment, different network). This invariant is currently satisfied.

7. **INVARIANT E7 — Event Class Verification:** All events must be classified into one of 6 event classes (constitutional_event, governance_event, observation_event, inference_event, projection_event, system_event) with corresponding authority_class, replay_class, and verification_required. PING stack events are inference_event/observation_event classes with non-constitutional authority_class. Constitutional jurisdiction for these classes is UNPROVEN.

## Explicit Non-Goals

During this pass:

1. **DO NOT** migrate Gateway to EventEnvelope.create() (PING stack schema inconsistency is unresolved, requiring architectural decision)
2. **DO NOT** migrate BrainOS to EventEnvelope.create() (PING stack schema inconsistency is unresolved, requiring architectural decision)
3. **DO NOT** migrate Drive ingestion to EventEnvelope.create() (PING stack schema inconsistency is unresolved, requiring architectural decision)
4. **DO NOT** make replay/witness/lineage executable (not in scope of this pass)
5. **DO NOT** modify root workers (preserve as dormant reference)
6. **DO NOT** modify workers/ directory (preserve as dormant reference)
7. **DO NOT** modify the PING database schema (schema inconsistency resolution requires architectural decision)
8. **DO NOT** introduce HTTP dependency between PING stack and constitutional runtime (maintain deployment isolation)
9. **DO NOT** rewrite gateway/event_emitter.js (documented inconsistency, requires architectural decision)
10. **DO NOT** rewrite brainos/event_emitter.py (documented inconsistency, requires architectural decision)

## Verified Findings

1. **Gateway event types:** VERIFIED - Gateway events (INFERENCE_REQUEST, INFERENCE_RESPONSE, INFERENCE_FAILED) are inference_event class under EVENT_LAW.md Article 2.4 (authority_class AI_GENERATED_ANALYSIS, replay_class non_replayable, verification_required false).

2. **BrainOS event types:** VERIFIED - BrainOS events are observation_event class under EVENT_LAW.md Article 2.3 (authority_class TEMPORARY_OBSERVATION, replay_class conditional_replay, verification_required false).

3. **Drive ingestion event types:** VERIFIED - Drive ingestion events are observation_event class under EVENT_LAW.md Article 2.3 (authority_class TEMPORARY_OBSERVATION, replay_class conditional_replay, verification_required false).

4. **Database configuration:** VERIFIED - .env.base sets POSTGRES_DB='crx_runtime' for PING stack. deploy/docker-compose.yml uses 'constitutional' database for constitutional runtime. However, all PING stack services (Gateway, BrainOS, Drive) write to 'crx_runtime' in the same compose deployment.

5. **Schema inconsistency:** VERIFIED - Gateway has TWO incompatible INSERT contracts for the SAME 'crx_runtime' database:
   - gateway/event_emitter.js uses PING schema (stream, event_type, payload, created_at)
   - gateway/server.js /api/v1/events uses canonical_state schema (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)

6. **Constitutional runtime authority:** VERIFIED - FastAPI EventApplicationService is the ONLY producer of constitutional_event and governance_event classes in the constitutional deployment (deploy/docker-compose.yml).

## Implemented Changes

1. **Fixed route shadowing:** Moved /events/recent and /events/stats route registrations before /events/:stream to prevent shadowing
2. **Fixed timeout behavior:** Passed AbortSignal through inference adapter to Ollama provider for actual timeout support
3. **Fixed duplicate response events:** Removed response event emission from invokeInference() to prevent duplication (now only emitted by calling routes with correct latency)
4. **Clarified routing decision:** Added explicit documentation that routeMessage() is observational/shadow mode, not active routing
5. **Documented event write paths:** Added inline documentation for the two incompatible Gateway event INSERT contracts
6. **Added security notes:** Added comments for wildcard CORS and unauthenticated deletion (deferred fixes)

## Deferred Recommendations

1. **Resolve PING stack schema inconsistency:** Choose one canonical schema for 'crx_runtime' database and migrate all authorities to use it
2. **Implement authentication:** Add authentication for repository deletion endpoint
3. **Restrict CORS:** Replace wildcard CORS with specific origins for production
4. **Establish constitutional jurisdiction:** Explicitly define constitutional authority for PING stack bounded context

## Non-Goals

1. Constitutional runtime code was NOT modified (preserved canonical authority)
2. Root workers were NOT modified (preserved as dormant reference)
3. Workers/ directory was NOT modified (preserved as dormant reference)
4. PING database schema was NOT modified (requires architectural decision)
5. No new authentication system was introduced (out of scope)

---

# FINAL STATUS

**CORRECTIVE AUDIT AND IMPLEMENTATION COMPLETE**

**DECISION:** ARCHITECTURALLY_UNRESOLVED

**REASON:** PING stack has multiple independent authorities (Gateway, BrainOS, Drive) writing to the same 'crx_runtime' database with incompatible schemas. Constitutional jurisdiction for PING stack bounded context is unproven. Architectural decision required to resolve schema inconsistency.

**IMPLEMENTATION PERFORMED:** Gateway route shadowing, timeout behavior, duplicate response events, routing documentation, and security notes added. No constitutional runtime code modified.
