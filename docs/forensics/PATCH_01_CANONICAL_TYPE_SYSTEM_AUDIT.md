# PATCH 01 — Canonical Type System Audit

**Date:** 2026-06-26
**Patch:** 01 - Canonical Type System
**Status:** IN PROGRESS
**Purpose:** Verify that every existing concept fits into one of the ten canonical object families.

---

## Canonical Object Families

1. **CanonicalObject** (Base)
2. **Source** (Discovery)
3. **Artifact** (Acquisition)
4. **Evidence** (Parsing)
5. **Relationship** (Relationship)
6. **Knowledge** (Compilation)
7. **Assessment** (Assessment)
8. **Capability** (Capability)
9. **Plan** (Planning)
10. **Projection** (Projection)
11. **Certificate** (Replay)

---

## CanonicalObject Base Class

**Fields:**
- `id` - CanonicalID (Authority, Namespace, Kind, Version, Hash)
- `kind` - Object type
- `version` - Object version
- `authority` - Authority that created the object
- `parents` - Parent object IDs
- `lineage` - Lineage chain
- `provenance` - Source provenance
- `timestamps` - Creation and modification timestamps
- `hash` - Content hash
- `schema_version` - Schema version used

---

## Existing Repository Objects Audit

### runtime/cognitive/models.py

**Objects Found:**
1. **AuthorityResolution**
   - Fields: highest_authority, authority_class, authority_chain, supersession_chain, verification
   - Current Type: Runtime data structure
   - Canonical Type: **Assessment** (opinion about authority)
   - Mapping: AuthorityResolution → Assessment

2. **ContextPack**
   - Fields: question, highest_authority, authority_chain, lineage, supporting_documents, supporting_claims, contradictions, citations, witness_roots, confidence, graph_expansion, repository_symbols, repository_relationships
   - Current Type: Runtime data structure
   - Canonical Type: **Plan** (executable intent for answering questions)
   - Mapping: ContextPack → Plan

3. **WorkerTask**
   - Fields: task_id, worker, objective, constraints, context, created_at
   - Current Type: Runtime data structure
   - Canonical Type: **Plan** (executable intent)
   - Mapping: WorkerTask → Plan

4. **WorkerResponse**
   - Fields: task_id, worker, findings, confidence, error, metadata
   - Current Type: Runtime data structure
   - Canonical Type: **Assessment** (opinion about task execution)
   - Mapping: WorkerResponse → Assessment

5. **ReasoningPlan**
   - Fields: plan_id, question, steps, worker_assignments, status, created_at
   - Current Type: Runtime data structure
   - Canonical Type: **Plan** (executable intent)
   - Mapping: ReasoningPlan → Plan

**Status:** All objects map to canonical types. No multiple inheritance. No ambiguous ownership.

---

### workers/observation_worker.py

**Objects Found:**
1. **Document** (from DOCUMENT_IMPORTED event)
   - Fields: content, source
   - Current Type: Event data
   - Canonical Type: **Artifact** (acquired bytes)
   - Mapping: Document → Artifact

2. **Observation** (from OBSERVATION_CREATED event)
   - Fields: document_id, chunk_index, chunk_text, chunk_id, source
   - Current Type: Event data
   - Canonical Type: **Evidence** (factual extraction from Artifact)
   - Mapping: Observation → Evidence

**Status:** All objects map to canonical types. No multiple inheritance. No ambiguous ownership.

---

### workers/claim_worker.py

**Objects Found:**
1. **Claim** (from CLAIM_GENERATED event)
   - Fields: document_id, chunk_id, claim_text, claim_index, confidence, verified
   - Current Type: Event data
   - Canonical Type: **Knowledge** (compiled from Evidence)
   - Mapping: Claim → Knowledge

**Note:** Claim contains confidence field, which should be separated into Assessment object.

**Status:** Object maps to canonical type, but requires separation of confidence into Assessment.

---

### workers/replay_worker.py

**Objects Found:**
1. **ReplayResult** (from REPLAY_EXECUTED event)
   - Fields: claim_id, replay_success, replay_timestamp, state_snapshot, verification_status
   - Current Type: Event data
   - Canonical Type: **Certificate** (replay certificate)
   - Mapping: ReplayResult → Certificate

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### workers/witness_worker.py

**Objects Found:**
1. **Witness** (from WITNESS_CREATED event)
   - Current Type: Event data
   - Canonical Type: **Certificate** (witness certificate)
   - Mapping: Witness → Certificate

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### workers/lineage_worker.py

**Objects Found:**
1. **Lineage** (from LINEAGE_CREATED event)
   - Current Type: Event data
   - Canonical Type: **Relationship** (lineage is a relationship)
   - Mapping: Lineage → Relationship

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### workers/projection_worker.py

**Objects Found:**
1. **Projection** (from PROJECTION_CREATED event)
   - Current Type: Event data
   - Canonical Type: **Projection** (reproducible projection)
   - Mapping: Projection → Projection

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### repository_scanner.py

**Objects Found:**
1. **Repository** (scanned repository)
   - Current Type: Scanned data
   - Canonical Type: **Source** (where information originates)
   - Mapping: Repository → Source

2. **File** (scanned file)
   - Current Type: Scanned data
   - Canonical Type: **Artifact** (acquired bytes)
   - Mapping: File → Artifact

**Status:** All objects map to canonical types. No multiple inheritance. No ambiguous ownership.

---

### repository_event_layer.py

**Objects Found:**
1. **RepositoryEvent** (repository change event)
   - Current Type: Event data
   - Canonical Type: **Source** (repository change)
   - Mapping: RepositoryEvent → Source

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### runtime/ingestion/drive_ingestor.py

**Objects Found:**
1. **GoogleDriveFile** (ingested file)
   - Current Type: Ingested data
   - Canonical Type: **Artifact** (acquired bytes)
   - Mapping: GoogleDriveFile → Artifact

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### runtime/replay/deterministic_replay_engine.ts

**Objects Found:**
1. **ReplayResult** (TypeScript)
   - Fields: canonical_bytes, fingerprint, lineage_graph, state, witness_root, violations
   - Current Type: TypeScript object
   - Canonical Type: **Certificate** (replay certificate)
   - Mapping: ReplayResult → Certificate

2. **ReplayEventStream** (TypeScript)
   - Current Type: TypeScript object
   - Canonical Type: **Evidence** (event stream is evidence)
   - Mapping: ReplayEventStream → Evidence

**Status:** All objects map to canonical types. No multiple inheritance. No ambiguous ownership.

---

### runtime/tools/graph_expand.py

**Objects Found:**
1. **Graph** (expanded graph)
   - Current Type: Runtime data structure
   - Canonical Type: **Projection** (graph is a projection of Knowledge and Relationship)
   - Mapping: Graph → Projection

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### runtime/tools/repository_relationships.py

**Objects Found:**
1. **Relationships** (repository relationships)
   - Current Type: Runtime data structure
   - Canonical Type: **Relationship** (factual relationships)
   - Mapping: Relationships → Relationship

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

### runtime/security/projection_integrity.py

**Objects Found:**
1. **ProjectionIntegrity** (projection verification)
   - Current Type: Runtime data structure
   - Canonical Type: **Assessment** (opinion about projection integrity)
   - Mapping: ProjectionIntegrity → Assessment

**Status:** Object maps to canonical type. No multiple inheritance. No ambiguous ownership.

---

## Success Criteria Verification

### Criterion 1: Every object in the repository maps to exactly one canonical type

**Status:** PASS

**Evidence:**
- All 20+ objects audited map to exactly one canonical type
- No objects require multiple canonical types
- No ambiguous mappings

---

### Criterion 2: No object requires multiple inheritance or ambiguous ownership

**Status:** PASS

**Evidence:**
- All objects inherit from exactly one canonical type
- No multiple inheritance required
- No ambiguous ownership

---

### Criterion 3: Every compiler stage emits only one canonical object family

**Status:** FAIL

**Evidence:**
- Current implementation emits events, not canonical objects
- Workers emit event_data (bespoke JSON), not typed canonical objects
- No compiler stages defined in current implementation
- Current stages: DOCUMENT_IMPORTED → OBSERVATION_CREATED → CLAIM_GENERATED → REPLAY_EXECUTED → WITNESS_CREATED → LINEAGE_CREATED → PROJECTION_CREATED
- These are event types, not compiler stages emitting canonical objects

**Required Mapping:**
- Discovery → Source
- Acquisition → Artifact
- Parsing → Evidence
- Relationship → Relationship
- Compilation → Knowledge
- Assessment → Assessment
- Capability → Capability
- Planning → Plan
- Projection → Projection
- Replay → Certificate

**Deviation:** Current implementation uses event-based pipeline, not compiler stages emitting canonical objects.

---

### Criterion 4: Every runtime component consumes canonical objects rather than bespoke JSON structures

**Status:** FAIL

**Evidence:**
- Runtime components consume event_data (bespoke JSON)
- Workers consume event.event_data (Dict[str, Any])
- No typed canonical object consumption
- runtime/cognitive/models.py uses dataclasses, but not canonical objects
- No CanonicalObject base class in runtime

**Deviation:** Runtime components consume bespoke JSON, not canonical objects.

---

### Criterion 5: Every future feature can be expressed by extending these types instead of introducing a new top-level category

**Status:** PASS

**Evidence:**
- All existing objects map to canonical types
- No new top-level categories required for existing features
- Canonical types are extensible (inherit from CanonicalObject)
- Graphs are Projections (not new category)
- Reports are Certificates or Assessments (not new category)

---

## Deviations Summary

### Deviation 1: Claim contains confidence field

**Location:** workers/claim_worker.py

**Issue:** Claim (Knowledge) contains confidence field, which should be in Assessment.

**Severity:** C2 (Implementation debt)

**Fix:** Separate confidence into Assessment object. Knowledge Object contains Evidence, Identity, Relationships. Assessment Object contains Confidence, Trust, Freshness, Risk, Conflicts.

---

### Deviation 2: Current implementation uses event-based pipeline, not compiler stages

**Location:** All workers/, runtime/

**Issue:** Workers emit event_data (bespoke JSON), not canonical objects. No compiler stages defined.

**Severity:** C1 (Canonical layer missing)

**Fix:** Implement compiler stages that emit canonical objects. Replace event-based pipeline with compiler-based pipeline.

---

### Deviation 3: Runtime components consume bespoke JSON, not canonical objects

**Location:** runtime/

**Issue:** Runtime components consume event.event_data (Dict[str, Any]), not typed canonical objects.

**Severity:** C1 (Canonical layer missing)

**Fix:** Implement CanonicalObject base class. Modify runtime components to consume canonical objects.

---

## Overall Status

**Criterion 1:** PASS
**Criterion 2:** PASS
**Criterion 3:** FAIL
**Criterion 4:** FAIL
**Criterion 5:** PASS

**Overall:** PARTIAL

**Conclusion:** Every existing object maps to exactly one canonical type. No multiple inheritance or ambiguous ownership required. However, the current implementation uses event-based pipeline with bespoke JSON, not compiler stages emitting canonical objects. Runtime components consume bespoke JSON, not canonical objects.

**Recommendation:** The canonical type system is well-defined and all existing objects map correctly. The next step is to implement the compiler stages and canonical object consumption in runtime components.

---

**Report Generated:** 2026-06-26
**Patch:** 01 - Canonical Type System
