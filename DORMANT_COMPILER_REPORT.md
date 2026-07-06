# Dormant Compiler Report — Phase 42 Tier 2C

## Stage Audit

### 1. Observation Compiler

**File**: `workers/observation_worker.py` (96 lines)  
**Status**: **DORMANT**  
- Registered in `kernel/event_dispatcher.py:82` for `DOCUMENT_IMPORTED`
- Emits `OBSERVATION_CREATED` via `repository_client.emit_event()` → HTTP POST
- Does inline paragraph-group chunking (3 paragraphs per group)
- **Not deployed** — worker_runtime.py has no docker-compose service

**To wire**: Deploy worker_runtime.py container. Verify HTTP emission to gateway succeeds.

---

### 2. Claim Compiler

**File**: `workers/claim_worker.py` (104 lines)  
**Status**: **DORMANT** (with **MISSING** verification gate)
- Registered for `OBSERVATION_CREATED`
- Emits `CLAIM_GENERATED` with hardcoded confidence 0.7, `verified: False`
- Extracts claim sentences via regex, filters by claim keywords
- `workers/candidate_claim_worker.py` — referenced in AGENTS.md V2 remediation but **MISSING from disk**
- Verification gate (promote CANDIDATE_CLAIM_CREATED → CLAIM_CREATED) exists only as spec

**To wire**: Deploy worker. The `CANDIDATE_CLAIM_CREATED → CLAIM_CREATED` verification gate does not exist as code.

---

### 3. Verification Compiler

**Files**:
- `gateway/verification_authority.js` (291 lines)
- `gateway/verification_pipeline.js` (56 lines)

**Status**: **BROKEN**
- Code exists and partially wired: `ConstitutionalExecutionPipeline.execute()` calls `this._verificationPipeline.verify()`
- The pipeline IS instantiated in `bootstrap/main.js` — verification runs on API-triggered events
- **No verification worker** exists — no handler in dispatcher for any verification step
- Worker-pipeline events (OBSERVATION_CREATED → CLAIM_GENERATED → etc.) have NO verification step
- KnowledgeCompiler `VerificationPass` (7-pass compiler line ~550) is **DORMANT** — KnowledgeCompiler is never called

**To wire**: Verification IS already partially wired for the API path. The worker pipeline has no verification consumer to wire to.

---

### 4. Witness Compiler

**Files** (3 implementations):
- `workers/witness_worker.py` (115 lines) — Python, emits `WITNESS_CREATED`
- `gateway/compiler_lineage_witness.js` (109 lines) — JS, compiler upgrade lineage
- `orchestration/execution/artifact_authorities.js` — `WitnessArtifact` class

**Status**: **DORMANT** (with **UNCOORDINATED** implementations)
- Python worker registered for `REPLAY_EXECUTED`, never deployed
- JS `witness_authority.js` IS used by `StandardEventSchema.create()` — applies witness hash to events created via that path
- Python worker creates simulated witness (`f"sig_{uuid[:8]}"`) — no real crypto
- Orchestration WitnessArtifact is separate — exists in fabric, not pipeline
- **3 uncoordinated witness concepts**: JS crypto witness (wired), Python simulated witness (dormant), orchestration WitnessArtifact (exercised in separate system)

**To wire**: Python witness_worker produces non-cryptographic witnesses — should use the JS witness authority pattern instead. Consolidate to one witness concept.

---

### 5. Lineage Compiler

**Files**:
- `workers/lineage_worker.py` (118 lines)
- `gateway/compiler_lineage_authority.js` (49 lines)

**Status**: **DORMANT**
- Python worker registered for `WITNESS_CREATED`, never deployed
- Stores 2 repository objects per event: `'witness'` and `'authority_lineage'`
- JS `compiler_lineage_authority.js` delegates to `ReplayAuthority.verifyCompilerUpgrade()` — for compiler version tracking, NOT event lineage

**To wire**: Two distinct lineage concepts (event chain lineage vs compiler upgrade lineage) — no coordination. The Python lineage_worker is the event lineage path but requires deployment.

---

### 6. Projection Compiler

**Files**:
- `workers/projection_worker.py` (113 lines)
- `runtime/kernel/workers/qdrant_projection_worker.py` (untracked)
- `runtime/workers/projection_worker.py` (untracked)
- `constitutional_projection_worker.py` (root, 162 lines)

**Status**: **DORMANT**
- `workers/projection_worker.py` registered for `LINEAGE_CREATED` — stores projection OBJECT in repository (does NOT write to Qdrant)
- `runtime/kernel/workers/qdrant_projection_worker.py` does actual Qdrant writes — but is untracked and unwired
- `gateway/pipeline_orchestrator.js` — the ONLY path that actually produced Qdrant data (21 points) — **MISSING from disk**

**To wire**: The Python projection_worker stores projection records but does not write to Qdrant. The real Qdrant writer (`qdrant_projection_worker.py`) needs to be wired to either the dispatcher chain or the REST pipeline.

---

### 7. General Compilers (2,800+ lines — ALL DORMANT)

| Compiler | Lines | Purpose | Status |
|----------|-------|---------|--------|
| `gateway/compiler_authority.js` | 122 | ConstitutionalObject creation | DORMANT |
| `gateway/compiler_lineage_authority.js` | 49 | Compiler lineage delegator | DORMANT |
| `gateway/compiler_lineage_witness.js` | 109 | Compiler lineage witness | DORMANT |
| `gateway/schema_compiler.js` | 126 | Source → DTO → CanonicalIR → ConstitutionalObject | DORMANT |
| `gateway/adapter_compiler_v2.js` | 348 | 12-phase adapter compilation | DORMANT |
| `gateway/canonical_graph_compiler.js` | 561 | Full graph compiler (nodes, edges, roots, Merkle trees) | DORMANT |
| `gateway/graph_schema.js` | 356 | GraphSchema + GraphCompiler | DORMANT |
| `gateway/knowledge_compiler.js` | 889 | 7-pass compiler | DORMANT |
| `orchestration/knowledge_compiler.js` | 223 | Module graph scanner | EXERCISED (orchestration) |
| `orchestration/execution/mission_compiler.js` | 210 | Intelligence graph → missions | EXERCISED (orchestration) |

**Verdict**: 8/10 compilers are **DORMANT** (zero calling code). 2 are exercised only by the orchestration fabric, which is a separate system from the event pipeline.

---

### 8. Artifact Synthesis

**Files**:
- `gateway/artifact_authority.js` (192L) — DORMANT
- `gateway/artifact_builder.js` (224L) — DORMANT
- `gateway/artifact_type_registry.js` (480L) — DORMANT (has typo bug: `row.words` instead of `row.rows`)
- `gateway/artifact_repository_port.js` (112L) — DORMANT
- `orchestration/execution/artifact_authorities.js` (329L) — EXERCISED (orchestration only)

**Verdict**: **SPLIT** — Gateway artifact implementations (1,000+ lines) all DORMANT. Orchestration implementations exercised but in separate system.

---

### 9. Object Synthesis

- `gateway/repository_store.js` (123L) — **ACTIVE** (REST API)
- `gateway/knowledge_compiler.js` ConstitutionalObjectSynthesisPass — **DORMANT**
- `gateway/compiler_authority.js` `createConstitutionalObject()` — **DORMANT**

**Verdict**: **PARTIALLY WIRED** — RepositoryStore is production-active for REST API calls. Event-driven object synthesis does not exist in production.

---

### 10. Relationship Synthesis

**Multiple implementations**:
- `canonical_graph_compiler.js` `createGraphEdge()` (line 109)
- `knowledge_compiler.js` StructuralCompilationPass._buildRelationships() (line 388)
- `compiler_authority.js` `compilationPolicy.buildRelationships()` (line 74)
- `workers/lineage_worker.py` `repository_client.store_object('authority_lineage', ...)`

**Verdict**: **DORMANT** — 3+ relationship concepts, zero production paths. No `graph_edges` or equivalent table exists in Postgres.

---

## Summary

| Stage | Status | ~Lines | Production |
|-------|--------|--------|-----------|
| Observation Compiler | DORMANT | 96 | 0% |
| Claim Compiler | DORMANT (+ MISSING verification gate) | 104 | 0% |
| Verification Compiler | BROKEN | 347 | partial (API path only) |
| Witness Compiler | DORMANT (3 uncoordinated impls) | ~350 | JS authority wired in schema |
| Lineage Compiler | DORMANT | 167 | 0% |
| Projection Compiler | DORMANT | ~275 | 0% |
| General Compilers | DORMANT | 2,800+ | 0% |
| Artifact Synthesis | SPLIT | 1,500+ | 0% gateway / exercised orchestration |
| Object Synthesis | PARTIAL | ~400 | REST-only; event-driven 0% |
| Relationship Synthesis | DORMANT | ~500 | 0% |

**Total dormant code**: ~6,500+ lines of compiler/artifact/object/relationship code that never executes in production.
