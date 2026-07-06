# Ingestion Pipeline Report — Phase 42 Tier 2A

## Pipeline Stage Inventory

### 1. Loader

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `gateway/document_ingestion.js` | Y | N | Y (standalone `__main__`) | N | Filesystem watch | Chunks → Qdrant |
| `gateway/github_ingestion.js` | Y | N | Y | Y (imports missing `event_emitter`) | GitHub API | REPOSITORY_DISCOVERED, COMMIT_CREATED |
| `gateway/github_adapter.js` | Y | N | Y | N | GitHub API | Adapter response |
| `filesystem_worker.py` (root) | Y | N | Y (CLI-only) | N | Filesystem scan | SQL file dumps |
| `runtime/ingestion/drive_ingestor.py` | Y | N | Y (untracked runtime/) | N | Google Drive | DOCUMENT_IMPORTED |
| `brainos/.../google_drive_ingestion.py` | Y | N | Y | N | Google Drive | DOCUMENT_OBSERVED |
| `repository_scanner.py` (root) | Y | N | Y (CLI-only) | N | Repo scan | REPOSITORY_FILE_* |
| `gateway/repository_discovery_authority.js` | Y | N | Y | N | GitHub API | Discovery data |
| `gateway/filesystem_authority.js` | Y | N | Y | N | Filesystem | Authority contracts |
| `gateway/file_watcher.js` | Y | N | Y | N | Filesystem watch | Watch events |

**Verdict**: 10 loader implementations. **0 running in production.**

---

### 2. Chunker

| File | Present | Running | Dormant | Broken | Method |
|------|---------|---------|---------|--------|--------|
| `gateway/semantic_chunker.js` | Y | N | Y | N | Semantic split |
| `gateway/treesitter_chunker.js` | Y | N | Y | Y (missing tree-sitter npm package) | AST-based |
| `gateway/markdown_parser.js` | Y | N | Y | N | Heading-based |
| `runtime/ingestion/chunker.py` | Y | N | Y (untracked runtime/) | N | Text split |
| `gateway/embedding_authority.js` (_chunkArtifact) | Y | N | Y | N | Inline chunk |
| `gateway/document_ingestion.js` (_chunkContent) | Y | N | Y | N | Word-based |
| `workers/observation_worker.py` (inline) | Y | N | Y (worker runtime not deployed) | N | 3-paragraph groups |

**Verdict**: 7 chunker implementations. **All dormant or broken.** The chunker observation_worker does inline paragraph-splitting — the only chunker on any pipeline path.

---

### 3. Normalizer

| File | Present | Running | Dormant | Broken |
|------|---------|---------|---------|--------|
| `runtime/temporal/temporal_normalizer.ts` | Y | N | Y | N |

**Verdict**: **No text normalizer exists.** The only "normalizer" is temporal (timestamp-related). Text normalization does not exist in any pipeline.

---

### 4. Observation Extraction

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `workers/observation_worker.py` | Y | N | Y (worker runtime not deployed) | N | DOCUMENT_IMPORTED | OBSERVATION_CREATED |
| `observation_worker.py` (root, Gen1) | Y | N | Y (CLI-only) | Y (direct SQL, old schema) | Sample dict | SQL INSERT |

**Verdict**: 2 implementations. **1 registered in dispatcher (workers/), 0 running.**

---

### 5. Claim Generation

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `workers/claim_worker.py` | Y | N | Y | N | OBSERVATION_CREATED | CLAIM_GENERATED |
| `claim_worker.py` (root, Gen1) | Y | N | Y | Y (old schema) | Sample dict | SQL INSERT |

**Verdict**: **candidate_claim_worker.py** referenced in AGENTS.md V2 remediation — **MISSING** from disk. Verification gate (candidate → claim promotion) exists only as spec.

---

### 6. Verification

| File | Present | Running | Dormant | Broken |
|------|---------|---------|---------|--------|
| `gateway/verification_authority.js` | Y | N | Y | N |
| `gateway/verification_pipeline.js` | Y | N | Y | N |
| `gateway/replay_verifier.js` | Y | N | Y | N |

**Verdict**: **No verification worker exists.** No verification handler registered in dispatcher. Claims emitted with `verified: False` placeholder. 6 verification authorities are all dormant.

---

### 7. Witness Generation

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `workers/witness_worker.py` | Y | N | Y | N | REPLAY_EXECUTED | WITNESS_CREATED |
| `gateway/witness_authority.js` | Y | Y (imported by StandardEventSchema) | N | N | Event | Witness hash |
| `gateway/witness_generator.js` | Y | N | Y | N | — | — |
| `gateway/compiler_lineage_witness.js` | Y | N | Y | N | — | — |
| `orchestration/execution/artifact_authorities.js` | Y | N (orchestration) | Y | N | — | — |

**Verdict**: **3 uncoordinated witness concepts.** JS `witness_authority.js` IS wired in StandardEventSchema for events created via `create()`. Python `witness_worker.py` creates simulated (non-crypto) witnesses. Orchestration has separate WitnessArtifact.

---

### 8. Lineage

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `workers/lineage_worker.py` | Y | N | Y | N | WITNESS_CREATED | LINEAGE_CREATED |
| `gateway/compiler_lineage_authority.js` | Y | N | Y | N | — | — |

**Verdict**: workers/lineage_worker.py registered and complete but never deployed.

---

### 9. Projection

| File | Present | Running | Dormant | Broken | Input | Output |
|------|---------|---------|---------|--------|-------|--------|
| `workers/projection_worker.py` | Y | N | Y | N | LINEAGE_CREATED | PROJECTION_CREATED |
| `runtime/kernel/workers/qdrant_projection_worker.py` | Y | N | Y (untracked) | N | Postgres events | Qdrant upsert |
| `gateway/pipeline_orchestrator.js` | — (MISSING) | formerly | — | — | Postgres | Qdrant |

**Verdict**: **workers/projection_worker.py** is a stub — stores a "projection" record in repository, does NOT write to Qdrant. `qdrant_projection_worker.py` is the real Qdrant writer but is untracked/unwired. **gateway/pipeline_orchestrator.js** — the only path that actually produced Qdrant data — is **no longer on disk**.

---

### 10. Embedding

| File | Present | Running | Dormant | Broken |
|------|---------|---------|---------|--------|
| `gateway/embedding_provider.js` | Y | N | Y | N |
| `gateway/embedding_authority.js` | Y | N | Y | N |
| `runtime/authorities/embedding_authority.py` | Y | N | Y (untracked) | N |
| `gateway/document_ingestion.js` (_embedChunks) | Y | N | Y | N |

**Verdict**: **3 different embedding strategies** (SHA-256 deterministic, nomic-embed-text via Ollama, inference adapter). **All dormant.** No embedding executes in production.

---

### 11. Event Emission (all paths)

| Path | Destination | Present | Running | Dormant | Broken |
|------|------------|---------|---------|---------|--------|
| HTTP POST /events via repository_client.py | `repository_events` table | Y | N | Y | N |
| event_emitter.js import (github_ingestion) | MISSING MODULE | N | N | N | Y |
| Direct psycopg2 INSERT (brainos, scanner, drive) | `events` table | Y | N | Y | Y (CHECK constraint) |

**Verdict**: 6 workers use consistent HTTP emission pattern. github_ingestion.js has broken import. 3 direct-SQL paths bypass gateway.

---

### 12. Dispatcher

| Dispatcher | File | Status | Handlers |
|-----------|------|--------|----------|
| Python kernel | `kernel/event_dispatcher.py` | DORMANT (not deployed) | 6 registered: DOCUMENT_IMPORTED, OBSERVATION_CREATED, CLAIM_GENERATED, REPLAY_EXECUTED, WITNESS_CREATED, LINEAGE_CREATED |
| Gateway ReducerRegistry | `gateway/runtime/reducer_registry.js` | ACTIVE but EMPTY | 0 registered |
| Gateway ConstitutionalDispatcher | `gateway/constitutional_dispatcher.js` | DORMANT | 7 hardcoded |

**Verdict**: **Python kernel has the only complete pipeline** — all 6 handlers wired. JS gateway has dispatchers with zero handlers.

---

### 13. Worker Subscription

| Worker | File | Registered For | Status |
|--------|------|---------------|--------|
| observation_worker | `workers/observation_worker.py` | DOCUMENT_IMPORTED | DORMANT |
| claim_worker | `workers/claim_worker.py` | OBSERVATION_CREATED | DORMANT |
| replay_worker | `workers/replay_worker.py` | CLAIM_GENERATED | DORMANT |
| witness_worker | `workers/witness_worker.py` | REPLAY_EXECUTED | DORMANT |
| lineage_worker | `workers/lineage_worker.py` | WITNESS_CREATED | DORMANT |
| projection_worker | `workers/projection_worker.py` | LINEAGE_CREATED | DORMANT |

**Verdict**: All 6 registered, **none running.** Worker runtime not deployed.

---

## Summary

| Stage | Implementations | Production | Status |
|-------|----------------|-----------|--------|
| Loader | 10 | 0 running | DORMANT |
| Chunker | 7 | 0 running | DORMANT |
| Normalizer | 1 (temporal only) | 0 | MISSING (text) |
| Observation | 2 | 0 | DORMANT |
| Claim | 2 | 0 | DORMANT (+ candidate_claim_worker MISSING) |
| Verification | 6 | 0 | DORMANT (+ no verification worker) |
| Witness | 5 | 1 (JS authority) | SPLIT |
| Lineage | 2 | 0 | DORMANT |
| Projection | 8 | 0 | DORMANT (+ pipeline_orchestrator MISSING) |
| Embedding | 4 | 0 | DORMANT |
| Event Emission | 7 paths | 0 | DORMANT (+ 1 BROKEN import) |
| Dispatcher | 3 | 1 but empty | BROKEN |
| Worker Subscription | 6 workers | 0 | DORMANT |

**Overall**: **Pipeline is structurally complete in Python kernel but 100% dormant.** Zero stages execute in production. The JS gateway has infrastructure but zero registered handlers.

**Root cause**: Docker containers for worker_runtime.py do not exist. No cron/scheduler starts the worker loop.
