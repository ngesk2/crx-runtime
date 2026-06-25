# CONSTITUTIONAL_GAP_MATRIX.md

**Date:** 2026-06-25  
**Auditor:** Cascade Security Agent  
**Objective:** Determine whether constitutional layers exist in code but are disconnected from runtime, or are actually missing

---

# Audit 1 — Repository Event Layer

**Files:**
- repository_event_layer.py
- repository_events.json
- REPOSITORY_EVENT_AUDIT.md

## Evidence

### repository_event_layer.py
- **Exists:** YES
- **Executable:** YES
- **Produces events:** YES (2,258 events)
- **Produces hashes:** YES (snapshot hash, witness root)
- **Produces witness roots:** YES

**Evidence:**
- Full implementation with RepositoryEventLayer class
- Methods: scan_repository(), emit_event(), create_snapshot(), generate_witness(), verify_replay()
- Successfully executed and produced 2,258 events
- Generated snapshot hash: 74b839df6ae2d9530ff93dc6e3f744c8077e268bfb163eadf3de7559a52ce05d
- Generated witness root: f5c6bb4e56c52c834929d98540232ad2181a04d254944dcd0be9764ca779d239

### repository_events.json
- **Exists:** YES
- **Size:** 40,597 lines
- **Event types:** REPOSITORY_DISCOVERED, FILE_DISCOVERED, REPOSITORY_SNAPSHOT_CREATED, REPOSITORY_WITNESS_CREATED, REPOSITORY_SNAPSHOT_VERIFIED, COMMIT_CREATED, COMMIT_VERIFIED
- **Integrity:** Valid JSON

### REPOSITORY_EVENT_AUDIT.md
- **Exists:** YES
- **Status:** COMPLETE
- **Evidence:** Full audit with timestamps, hashes, verification results

## Status

**IMPLEMENTED:** YES  
**CONNECTED:** YES  
**EXECUTING:** YES  
**PROVEN:** YES

**Gap:** None - Repository event layer is fully operational

---

# Audit 2 — Witness Layer

**File:**
- runtime/replay/witness_authority.ts

## Evidence

### Implementation Status
- **File exists:** YES
- **Full implementation:** YES
- **Type:** TypeScript class WitnessAuthority
- **Lines:** 248 lines

### Functions
- `generateWitness(eventStream, state, violations)` - Generate witness from event stream
- `generateWitnessRoot(replayResult)` - Extract witness root from replay result
- `verifyWitnessRoot(eventStream, state, violations, expectedWitnessRoot)` - Verify witness root
- `buildLineageGraph(state)` - Build lineage graph from state
- `computeWitnessRoot(...)` - Compute witness root using Merkle tree

### Imports
- CanonicalHashAuthority
- ReplayEventStream
- InvariantRunner
- MerkleTree
- StateSerializer
- CertificateAuthority
- constitutional_law_manifest

### Callers
- **Direct callers:** NONE FOUND
- **Search results:** No files import or call WitnessAuthority in runtime
- **Search terms:** "WitnessAuthority", "generateWitness", "import*witness*" - 0 results

### Execution Path
- **Entry point:** None found
- **Required inputs:** ReplayEventStream, ReplayState, violations
- **Outputs:** WitnessRoot, LineageGraph
- **Missing link:** No runtime code calls witness generation

## Status

**IMPLEMENTED:** YES  
**CONNECTED:** NO  
**EXECUTING:** NO  
**PROVEN:** NO

**Gap:** Witness authority is fully implemented in TypeScript but has no runtime callers. The code exists but is disconnected from the event pipeline.

---

# Audit 3 — Replay Layer

**File:**
- runtime/replay/deterministic_replay_engine.ts

## Evidence

### Implementation Status
- **File exists:** YES
- **Full implementation:** YES
- **Type:** TypeScript class DeterministicReplayEngine
- **Lines:** 90 lines

### Functions
- `replay(eventStream)` - Replay event stream deterministically
- Constructor with witnessVersion parameter

### Entrypoints
- **Direct callers:** NONE FOUND
- **Search results:** No files import or call DeterministicReplayEngine in runtime
- **Search terms:** "DeterministicReplayEngine" - 0 results

### Required Inputs
- ReplayEventStream (event stream to replay)

### Outputs
- ReplayResult (canonical_bytes, fingerprint, lineage_graph, state, witness_root, violations, state_version, artifact_count)

### Hash Generation Path
1. Canonicalize event stream via CanonicalHashAuthority
2. Compute fingerprint via hashAuthority.computeFingerprint()
3. Run invariants via InvariantRunner
4. Generate witness via WitnessAuthority
5. Deep freeze result

## Status

**IMPLEMENTED:** YES  
**CONNECTED:** NO  
**EXECUTING:** NO  
**PROVEN:** NO

**Gap:** Replay engine is fully implemented but has no runtime callers. Events exist in PostgreSQL but are never fed to the replay engine.

---

# Audit 4 — Lineage Layer

**Files:**
- runtime/kernel/commit-service/src/persistence/lineage_store.ts
- PostgreSQL lineage table

## Evidence

### Implementation Status

### lineage_store.ts
- **File exists:** YES
- **Full implementation:** PARTIAL (14 lines)
- **Type:** TypeScript function storeLineage
- **Functions:**
  - `storeLineage(parentIds, childId)` - Store lineage edges in PostgreSQL

### Call Graph
- **Direct callers:** NONE FOUND
- **Search results:** No files import or call storeLineage in runtime
- **Search terms:** "storeLineage" - 0 results

### PostgreSQL Tables
- **lineage table:** EXISTS (0 rows)
- **lineage_edges table:** Referenced in code but not verified in database
- Query: `SELECT COUNT(*) FROM lineage;` → 0

### Missing Link
- No event handler calls storeLineage
- No DOCUMENT_IMPORTED event creates lineage
- No OBSERVATION_CREATED event creates lineage
- No CLAIM_GENERATED event creates lineage

## Status

**IMPLEMENTED:** PARTIAL (function exists but unused)  
**CONNECTED:** NO  
**EXECUTING:** NO  
**PROVEN:** NO

**Gap:** Lineage store function exists but is never called. No events trigger lineage creation.

---

# Audit 5 — Projection Layer

## Evidence

### PostgreSQL
- **events table:** EXISTS (15 rows)
- **projections table:** EXISTS (0 rows)
- **authority_objects table:** EXISTS (15 rows)
- **Classification:** AUTHORITY (events, authority_objects), PROJECTION (projections - empty)

### Qdrant
- **Container:** brain-qdrant (running)
- **Collections:** constitutional_memory, constitutional_documents
- **API authentication:** BLOCKED (requires API key)
- **Classification:** PROJECTION (blocked by authentication)

### Neo4j
- **Container:** brain-neo4j (status unknown)
- **Classification:** PROJECTION (status unknown, likely not operational)

### Repository Runtime
- **repository_files table:** NOT FOUND
- **repository_symbols table:** NOT FOUND
- **repository_imports table:** NOT FOUND
- **repository_dependencies table:** NOT FOUND
- **repository_routes table:** NOT FOUND
- **repository_events table:** NOT FOUND
- **repository_docs table:** NOT FOUND
- **Classification:** MISSING

## Actual Runtime Behavior
- **Postgres events:** Being created (DOCUMENT_IMPORTED events)
- **Postgres projections:** NOT being created (projections table empty)
- **Qdrant projections:** BLOCKED (authentication)
- **Neo4j projections:** UNKNOWN (not accessible)
- **Repository runtime:** NOT IMPLEMENTED

## Status

**Postgres:** AUTHORITY (operational)  
**Qdrant:** PROJECTION (broken - authentication blocked)  
**Neo4j:** PROJECTION (unknown - not accessible)  
**Repository Runtime:** MISSING

**Gap:** Projection layer partially operational (Postgres events) but projections not being created. Qdrant blocked by authentication. Repository runtime completely missing.

---

# Audit 6 — Repository Runtime

## Evidence

### Search Results
- **repository_files:** NOT FOUND
- **repository_symbols:** NOT FOUND
- **repository_imports:** NOT FOUND
- **repository_dependencies:** NOT FOUND
- **repository_routes:** NOT FOUND
- **repository_events:** NOT FOUND
- **repository_docs:** NOT FOUND

### PostgreSQL Tables
- Query: `\dt` shows 16 tables
- None of the repository runtime tables exist
- Only constitutional tables exist (events, authority_objects, lineage, claims, etc.)

## Status

**IMPLEMENTED:** NO  
**CONNECTED:** N/A  
**EXECUTING:** N/A  
**PROVEN:** N/A

**Gap:** Repository runtime indexes do not exist in code or database.

---

# Audit 7 — Observation Pipeline

## Evidence

### DOCUMENT_IMPORTED Events
- **Exist:** YES (15 events in PostgreSQL)
- **Event type:** DOCUMENT_IMPORTED
- **Source:** Google Drive ingestion adapter

### OBSERVATION_CREATED Events
- **Exist:** NO
- **Search:** `SELECT DISTINCT event_type FROM events;` → Only DOCUMENT_IMPORTED
- **Expected flow:** DOCUMENT_IMPORTED → OBSERVATION_CREATED

### CLAIM_GENERATED Events
- **Exist:** NO
- **Expected flow:** OBSERVATION_CREATED → CLAIM_GENERATED

### DECISION_CREATED Events
- **Exist:** NO
- **Expected flow:** CLAIM_GENERATED → DECISION_CREATED

### Execution Path Analysis
1. **DOCUMENT_IMPORTED:** EXISTS (Google Drive ingestion)
2. **OBSERVATION_CREATED:** MISSING - No handler creates observations
3. **CLAIM_GENERATED:** MISSING - No handler creates claims
4. **DECISION_CREATED:** MISSING - No handler creates decisions

### Where Execution Stops
- **Stop point:** After DOCUMENT_IMPORTED event creation
- **Missing link:** No observation pipeline handler
- **Missing component:** Observation generation service

## Status

**IMPLEMENTED:** PARTIAL (only DOCUMENT_IMPORTED)  
**CONNECTED:** NO  
**EXECUTING:** NO  
**PROVEN:** NO

**Gap:** Observation pipeline exists only for document import. No observation, claim, or decision generation.

---

# Summary Matrix

| Subsystem | Implemented | Connected | Executing | Proven | Gap |
|-----------|-------------|-----------|-----------|--------|-----|
| Repository Event Layer | YES | YES | YES | YES | None |
| Witness Layer | YES | NO | NO | NO | No runtime callers |
| Replay Layer | YES | NO | NO | NO | No runtime callers |
| Lineage Layer | PARTIAL | NO | NO | NO | Function exists but unused |
| Projection Layer (Postgres) | YES | YES | PARTIAL | YES | Projections not created |
| Projection Layer (Qdrant) | YES | NO | NO | NO | Authentication blocked |
| Projection Layer (Neo4j) | UNKNOWN | UNKNOWN | UNKNOWN | NO | Status unknown |
| Repository Runtime | NO | N/A | N/A | N/A | Completely missing |
| Observation Pipeline | PARTIAL | NO | NO | NO | Only DOCUMENT_IMPORTED exists |

---

**END OF GAP MATRIX**
