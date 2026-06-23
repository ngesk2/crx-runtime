# CONSTITUTIONAL INVESTIGATION REPORT

**Document ID:** CONSTITUTIONAL-INVESTIGATION-REPORT-1.0  
**Status:** DEPLOYMENT REALITY INVESTIGATION  
**Purpose:** Determine actual constitutional authority vs code capability

---

## SECTION 0 — EXECUTIVE SUMMARY

**Investigation Scope:**
- Replay Capability vs Replay Authority
- Event Persistence vs True Event Sourcing
- Constitutional Object Runtime
- Deployment Reality
- Credential Reality
- Inference Authority

**Key Finding:**

**Code Reality ≠ Deployment Reality ≠ Constitutional Reality**

The codebase contains sophisticated replay and event-sourcing infrastructure, but production deployment does not use it.

---

## SECTION 1 — REPLAY CAPABILITY VS REPLAY AUTHORITY

### Code Reality

**Implemented:**
- ✅ DeterministicReplayEngine (runtime/replay/deterministic_replay_engine.ts)
- ✅ ReplayStateMachine (runtime/replay/replay_state_machine.ts)
- ✅ PostgresEventStore (runtime/adapters/postgres_event_store.ts)
- ✅ WitnessAuthority (runtime/replay/witness_authority.ts)
- ✅ CanonicalHashAuthority (runtime/replay/canonical_hash_authority.ts)
- ✅ ReplayVerification (runtime/replay/replay_verification.ts)

**Deployment Reality:**

**Replay Execution:**
- ❌ No calls to `replay()` in runtime/kernel/commit-service/
- ❌ No calls to `replay()` in gateway/
- ❌ No calls to `replay()` in brainos/orchestration/

**Replay Usage:**
- ✅ Used in constitutional_self_check_core.ts (self-verification only)
- ✅ Used in replay_verification.ts (verification only)
- ❌ NOT used in production commit path

**Classification:**

**Replay Capability:** IMPLEMENTED  
**Replay Authority:** NOT AUTHORITATIVE IN PRODUCTION

**Conclusion:**

Replay is a **support subsystem**, not a constitutional authority in production.

CRX can continue operating if replay is removed because replay is not used in the production commit path.

---

## SECTION 2 — EVENT PERSISTENCE VS TRUE EVENT SOURCING

### Code Reality

**Implemented:**
- ✅ PostgresEventStore with loadStream() (runtime/adapters/postgres_event_store.ts)
- ✅ execution_events table persistence (runtime/kernel/commit-service/src/events/event_log.ts)

**Deployment Reality:**

**Event Persistence:**
- ✅ commit_controller.ts writes to execution_events table
- ✅ event_log.ts persists events to PostgreSQL

**State Reconstruction:**
- ❌ No calls to PostgresEventStore.loadStream()
- ❌ No calls to ReplayStateMachine in production
- ❌ State is NOT reconstructed from events

**Actual Authority:**
- ✅ Artifacts stored directly via storeArtifact()
- ✅ Lineage established by direct database writes
- ✅ State retrieved from PostgreSQL rows, not replay

**Classification:**

**Event Persistence:** DORMANT EVENT-SOURCED CAPABILITY

**Conclusion:**

**Production Reality:** Production reads artifact tables directly, not replay reconstruction. Replay is not the operational authority in production.

**Constitutional Capability:** events → ReplayStateMachine → artifacts is fully implemented. Artifacts ARE reconstructable from events alone. CRX already possesses the minimum machinery required for event sourcing.

**Distinction:** The question is not "Can replay reconstruct state?" (Section 9 proves YES). The question is "Which authority answers reads?" (Production reads projections directly).

---

## SECTION 3 — CONSTITUTIONAL OBJECT RUNTIME

### Code Reality

**Replay-Derived Artifacts:**
- ✅ artifact_id (SHA-256 hash)
- ✅ artifact_hash (canonical hash)
- ✅ artifact_lineage (derived from events)
- ✅ Lineage depth enforcement
- ✅ Duplicate detection
- ✅ Namespace consistency

**Production Artifacts:**
- ✅ artifact_id (SHA-256 hash via CertificateAuthority)
- ✅ artifact stored directly to PostgreSQL
- ✅ lineage from HTTP request (not replay-derived)
- ✅ DAG validation (via dag_validator.ts)

**Constitutional Object Semantics:**

**Identity:** ✅ SHA-256 hash (both replay and production)  
**Lineage:** ✅ DAG structure (both replay and production)  
**Versioning:** ❌ Not implemented in either  
**Reconstruction:** ✅ Replay can reconstruct (but not used in production)  
**Authority:** ❌ Replay not authoritative in production

**Classification:**

**Replay-Derived Artifacts:** SATISFY CONSTITUTIONAL OBJECT SEMANTICS  
**Production Artifacts:** SATISFY CONSTITUTIONAL OBJECT SEMANTICS  
**Object Runtime:** EMERGENT (unnamed, not explicitly "Layer 1 Objects")

**Conclusion:**

Replay-derived artifacts **DO** satisfy constitutional object semantics.

However, production does not use replay-derived artifacts.

Production uses direct artifact storage with lineage from HTTP request.

**Classification:** Object Runtime v0 (emergent, not explicitly named)

---

## SECTION 4 — DEPLOYMENT REALITY

### Docker Compose Analysis

**docker-compose-mission-control.yml:**
- ✅ PostgreSQL (canonical state)
- ✅ Qdrant (vector projection)
- ✅ Ollama (AI model server)
- ✅ Mission Control (API)
- ✅ OpenWebUI (presentation)
- ❌ No vLLM
- ❌ No Google Drive
- ❌ No MCP
- ❌ No replay engine

**docker-compose.yml:**
- ✅ PostgreSQL
- ✅ Qdrant
- ✅ Neo4j (knowledge graph)
- ✅ Temporal (workflow engine)
- ✅ Kafka (event streaming)
- ✅ Zookeeper (Kafka dependency)
- ✅ DuckDB (analytics)
- ✅ OpenSearch (search engine)
- ✅ Tika (document parsing)
- ✅ Ollama
- ✅ OpenWebUI
- ❌ No vLLM
- ❌ No Google Drive
- ❌ No MCP
- ❌ No replay engine

**Deployment Classification:**

**Inference:** Ollama (development-only per CEO directive)  
**Persistence:** PostgreSQL  
**Projection:** Qdrant  
**Replay:** NOT DEPLOYED  
**MCP:** NOT DEPLOYED  
**Google Drive:** NOT DEPLOYED  
**vLLM:** NOT DEPLOYED

**Conclusion:**

Production deployment uses **Ollama for inference**, **PostgreSQL for persistence**, **Qdrant for projection**.

Replay, MCP, Google Drive, and vLLM are **NOT DEPLOYED**.

---

## SECTION 5 — CREDENTIAL REALITY

### Credential State

**Google Drive:**
- ✅ GOOGLE_DRIVE_CREDENTIALS_PATH (configured)
- ✅ GOOGLE_DRIVE_TOKEN_PATH (configured)
- ❌ GOOGLE_PROJECT_ID (NOT CONFIGURED)
- ❌ GOOGLE_SERVICE_ACCOUNT_JSON (NOT CONFIGURED)
- ❌ GOOGLE_DRIVE_FOLDER_ID (NOT CONFIGURED)
- ❌ GCS_BUCKET (NOT CONFIGURED)
- **Classification:** CONFIGURED BUT INACTIVE

**Yahoo:**
- ✅ YAHOO_EMAIL (configured)
- ✅ YAHOO_APP_PASSWORD (configured)
- **Classification:** CONFIGURED

**Postgres:**
- ✅ POSTGRES_HOST (configured)
- ✅ POSTGRES_PORT (configured)
- ✅ POSTGRES_DB (configured)
- ✅ POSTGRES_USER (configured)
- ✅ POSTGRES_PASSWORD (configured)
- **Classification:** CONFIGURED

**Qdrant:**
- ✅ QDRANT_URL (configured)
- ✅ QDRANT_API_KEY (configured)
- **Classification:** CONFIGURED

**vLLM:**
- ❌ VLLM_URL (NOT CONFIGURED)
- **Classification:** NOT CONFIGURED

**Conclusion:**

Google Drive credentials are **CONFIGURED BUT INACTIVE** (missing service account and folder ID).

vLLM is **NOT CONFIGURED**.

Postgres, Qdrant, and Yahoo are **CONFIGURED**.

---

## SECTION 6 — INFERENCE AUTHORITY

### Inference Deployment

**Deployed:**
- ✅ Ollama (docker-compose-mission-control.yml, docker-compose.yml)

**Not Deployed:**
- ❌ vLLM
- ❌ OpenAI-compatible client
- ❌ Remote inference endpoints

**Inference Authority:**

**Current:** Ollama (development-only per CEO directive)  
**Target:** vLLM (OpenAI-compatible)  
**Status:** NOT IMPLEMENTED

**Conclusion:**

The actual inference authority is **Ollama**.

vLLM is **NOT DEPLOYED** and **NOT CONFIGURED**.

OpenAI-compatible client is **NOT IMPLEMENTED**.

---

## SECTION 7 — FINAL CLASSIFICATION

### Subsystem Classification

**Replay:**
- Capability: IMPLEMENTED
- Authority: NOT AUTHORITATIVE IN PRODUCTION
- Deployment: NOT DEPLOYED
- **Classification:** IMPLEMENTED BUT UNUSED

**Event Persistence:**
- Capability: IMPLEMENTED
- Authority: EVENT LOGGED (not event sourced)
- Deployment: DEPLOYED
- **Classification:** EVENT LOGGED

**Object Runtime:**
- Capability: EMERGENT
- Authority: SATISFIES SEMANTICS
- Deployment: EMERGENT
- **Classification:** OBJECT RUNTIME V0 (EMERGENT)

**Inference:**
- Capability: OLLAMA (development-only)
- Authority: OLLAMA
- Deployment: DEPLOYED
- **Classification:** OLLAMA (DEVELOPMENT-ONLY)

**MCP:**
- Capability: NOT IMPLEMENTED
- Authority: NOT APPLICABLE
- Deployment: NOT DEPLOYED
- **Classification:** NOT IMPLEMENTED

**Google Drive:**
- Capability: CONFIGURED BUT INACTIVE
- Authority: NOT APPLICABLE
- Deployment: NOT DEPLOYED
- **Classification:** CONFIGURED BUT INACTIVE

**vLLM:**
- Capability: NOT IMPLEMENTED
- Authority: NOT APPLICABLE
- Deployment: NOT DEPLOYED
- **Classification:** NOT IMPLEMENTED

---

## SECTION 8 — MOST IMPORTANT QUESTION

**Question:**

Do replay-derived artifacts already satisfy constitutional object semantics?

**Answer:**

**YES**

Replay-derived artifacts satisfy:
- ✅ Identity (SHA-256 hash)
- ✅ Lineage (DAG structure)
- ✅ Reconstruction (replay can rebuild state)
- ❌ Versioning (not implemented)

**However:**

Production does not use replay-derived artifacts.

Production uses direct artifact storage with lineage from HTTP request.

**Classification:**

Layer 1 Objects are **ALREADY EMERGING from Layer 0 replay**, but are **NOT USED IN PRODUCTION**.

---

## SECTION 9 — EVENT FUNCTIONALITY AUDIT

### Event Write Test

**Evidence:**
- event_log.ts:28-35: logEvent() inserts into execution_events table
- commit_controller.ts:38-39: artifactId computed from CertificateAuthority.sha256(canonical) (deterministic)
- commit_controller.ts:49: calls logEvent("artifact_commit", { artifactId, parentIds })
- PostgresEventStore.ts:87-92: append() uses ON CONFLICT (event_hash) DO NOTHING

**Question: Can I commit artifact A twice and get the same event identity?**
- artifactId is deterministic (SHA-256 of canonical artifact)
- PostgresEventStore deduplicates by event_hash
- Answer: Same event identity, no duplicate events

**Classification: WORKING**

---

### Event Read Test

**Evidence:**
- PostgresEventStore.ts:106-118: loadStream() loads all events ORDER BY event_id ASC
- PostgresEventStore.ts:123-138: loadRange() loads events by range ORDER BY event_id ASC
- ReplayEventStream.ts:84-86: getEventById() returns event by ID
- ReplayEventStream.ts:91-93: getEventsByType() filters by type
- ReplayEventStream.ts:98-100: getEventsByActor() filters by actor
- ReplayEventStream.ts:105-136: getLineageChain() traverses parent references

**Classification: WORKING**

---

### Replay Reconstruction Test

**Evidence:**
- DeterministicReplayEngine.ts:46: Creates fresh ReplayStateMachine for each replay
- ReplayStateMachine.ts:72-74: getState() returns deepFreeze(immutableCopy())
- ReplayStateMachine.ts:266-284: immutableCopy() creates new Map/Set copies
- CanonicalJson.ts:27-28: Canonicalization is deterministic (RFC-8785)
- DeterministicReplayEngine.ts:86: Returns deepFreeze(result) to prevent post-certification mutation

**Classification: WORKING**

---

### Projection Regeneration Test

**Evidence:**
- ReplayStateMachine.ts:105-219: handleArtifactCommit() derives artifacts from events
- ReplayStateMachine.ts:211-215: Stores artifact_id, artifact_hash, artifact_lineage in state
- PostgresEventStore.ts:106-118: loadStream() can load all events from database
- ReplayStateMachine.ts:217-218: Tracks event_to_artifact_map for lineage resolution

**Question: Can artifacts be regenerated from events alone?**
- ReplayStateMachine derives all artifact state from events
- PostgresEventStore can load complete event stream
- Answer: Yes

**Classification: WORKING**

---

### Event Loss Test

**Evidence:**
- ReplayStateMachine.ts:158-163: Duplicate event_id detection throws duplicateEventId error
- ReplayStateMachine.ts:195-199: Parent existence validation throws parentNotFound error
- ReplayStateMachine.ts:186-189: Parent event not found throws parentEventNotFound error
- GraphValidator.ts:22-32: Cycle detection throws LINEAGE_CYCLE_DETECTED
- GraphValidator.ts:34-44: Orphan detection throws LINEAGE_ORPHAN_DETECTED

**Question: Does replay detect corruption?**
- Missing lineage: parent existence validation (line 195)
- Broken chain: orphan detection (line 34)
- Cycle detection: GraphValidator (line 22)
- Hash mismatch: not explicitly implemented in replay
- Event tampering: not detected
- Event deletion inside chain: not detected

**Constitutional Gap:** verifyHash() exists in PostgresEventStore.verifyHash() but replay never calls it. Replay trusts CanonicalEventEnvelope(payload) without proving payload hash == stored hash. Replay can detect graph corruption but not payload corruption.

**Classification: PARTIALLY WORKING** (detects graph corruption, missing payload integrity verification)

---

### Event Ordering Test

**Evidence:**
- PostgresEventStore.ts:110: ORDER BY event_id ASC (assumes database order is canonical)
- ReplayEventStream.ts:70: this.events = [...events] (preserves input order)
- DeterministicReplayEngine.ts:49-52: Processes events in order from eventStream.getEvents()
- Evidence gap: No explicit re-canonicalization if events arrive out of order
- Evidence gap: No timestamp-based ordering validation

**Question: Does replay re-canonicalize ordering?**
- Replay processes events in the order they are provided
- PostgresEventStore orders by event_id (database-assigned)
- Answer: No explicit re-canonicalization

**Constitutional Gap:** Authority currently depends on database insertion order (event_id ASC) instead of canonical replay order. Constitutional target: "same causal history → same replay ordering → same canonical state". Current implementation: storage order, not causal order. Those are not guaranteed to be identical forever.

**Classification: PARTIALLY WORKING** (depends on database ordering, not canonical causal order)

---

### Event → Object Emergence Test

**Evidence:**
- ReplayStateMachine.ts:211-215: Artifact state includes artifact_id, artifact_hash, artifact_lineage
- ReplayStateMachine.ts:179-202: Lineage normalization (event IDs → artifact IDs)
- GraphValidator.ts:62-81: Cycle detection with deterministic traversal
- GraphValidator.ts:134-148: Orphan detection validates parent existence
- WitnessAuthority.ts:81-108: buildLineageGraph() derives lineage from state
- WitnessAuthority.ts:94-100: Lineage edges include parent_id, child_id, edge_type: 'derivation'

**Question: Do replay-derived artifacts satisfy constitutional object semantics?**
- Identity: ✅ artifact_id (SHA-256)
- Lineage: ✅ artifact_lineage (DAG structure)
- History: ✅ event_to_artifact_map (event-to-artifact tracking)
- State: ✅ artifacts Map (complete state)
- Answer: Yes

**Classification: WORKING**

---

### Event Functionality Summary

1. **Event Write Test:** WORKING
2. **Event Read Test:** WORKING
3. **Replay Reconstruction Test:** WORKING
4. **Projection Regeneration Test:** WORKING
5. **Event Loss Test:** PARTIALLY WORKING (detects graph corruption, missing payload integrity verification)
6. **Event Ordering Test:** PARTIALLY WORKING (depends on database ordering, not canonical causal order)
7. **Event → Object Emergence Test:** WORKING

---

## SECTION 10 — REMAINING CONSTITUTIONAL DEFECTS

### Defect 1: Payload Hash Integrity Not Verified

**Evidence:**
- PostgresEventStore.verifyHash() exists but replay never calls it
- Replay trusts CanonicalEventEnvelope(payload) without proving payload hash == stored hash
- Replay can detect graph corruption but not payload corruption

**Constitutional Impact:** Event tampering and hash mismatch are not detected during replay.

**Required Fix:** Replay must verify payload hash integrity during event loading.

---

### Defect 2: Replay Ordering Depends on Database Ordering

**Evidence:**
- PostgresEventStore uses ORDER BY event_id ASC
- Constitutional target: "same causal history → same replay ordering → same canonical state"
- Current implementation: storage order, not causal order
- Storage order ≠ causal order guaranteed forever

**Constitutional Impact:** Replay ordering is not constitutionally sovereign. Authority depends on database insertion order instead of canonical causal order.

**Required Fix:** Replay must use canonical causal ordering (timestamp-based or event sequence) instead of database insertion order.

---

### Defect 3: Production Authority Reads Projections Directly

**Evidence:**
- Production reads artifact tables directly, not replay reconstruction
- Replay is not the operational authority in production
- Section 9 proved artifacts ARE reconstructible from events, but production doesn't use this capability

**Constitutional Impact:** Events are not the operational authority in production. The system has dormant event-sourced capability but uses direct projection reads.

**Required Fix:** Production must read from replay reconstruction, not direct projection tables.

---

### Authority Determination

**Current State:**
- Events can reconstruct state (Section 9 proved YES)
- Production reads projections directly
- Replay ordering depends on database
- Replay does not verify payload integrity

**Constitutional Question:** Which authority answers reads?

**Current Answer:** Artifacts (projections)

**Constitutional Target:** Events

**Gap:** Production authority still reads projections directly despite event-sourced capability being implemented.

---

**Document ID:** CONSTITUTIONAL-INVESTIGATION-REPORT-1.0  
**Status:** DEPLOYMENT REALITY INVESTIGATION  
**Key Finding:** Code Reality ≠ Deployment Reality ≠ Constitutional Reality
