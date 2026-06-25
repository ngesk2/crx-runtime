# PING Sprint 02 — Constitutional Runtime Verification

## Mission

Prove the existing constitutional pipeline works from end to end.

**Status:** IN PROGRESS
**Date:** 2026-06-25
**Sprint:** 02

---

## Success Criteria

This pipeline must execute successfully:

```
Google Drive
      ↓
Drive Mirror
      ↓
Repository Scanner
      ↓
Repository Events (Postgres)
      ↓
Projection Worker
      ↓
Qdrant
      ↓
Retrieval Service
      ↓
Ollama
      ↓
Open WebUI
```

---

## Phase 1 — Infrastructure Verification

### Objective
Verify every runtime container sees the exact same repository.

### Required Checks
- repo_runtime
- mission_control
- graph_runtime
- memory_runtime
- projection_worker
- retrieval_runtime

### Verification Criteria
- [ ] Identical file count
- [ ] Identical SHA256 values
- [ ] Identical timestamps
- [ ] Identical directory structure

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 2 — Repository Scanner Verification

### Objective
Run repository scanner and verify event emission.

### Verification Criteria
- [ ] New files detected
- [ ] Modified files detected
- [ ] Deleted files detected

### Event Verification
- [ ] `REPOSITORY_FILE_DISCOVERED` events emitted
- [ ] `REPOSITORY_FILE_UPDATED` events emitted
- [ ] `REPOSITORY_FILE_DELETED` events emitted

### Event Content Verification
- [ ] aggregate_id present
- [ ] repository present
- [ ] path present
- [ ] sha256 present
- [ ] timestamp present
- [ ] event_hash present
- [ ] replay_order present

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 3 — PostgreSQL Event Store

### Objective
Verify event store integrity and replay capability.

### Verification Criteria
- [ ] Event count matches expected
- [ ] Replay order correct
- [ ] Aggregate ordering correct
- [ ] Event hashes valid
- [ ] Idempotent writes

### Reconstruction Test
- [ ] Repository state reconstructible from events only
- [ ] No filesystem access required

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 4 — Projection Worker

### Objective
Replay every repository event and verify projections.

### Metadata Projection
- [ ] repository present
- [ ] path present
- [ ] sha256 present
- [ ] modified present
- [ ] mime type present
- [ ] size present

### Purpose
Graph traversal (not semantic retrieval)

### Semantic Projection Pipeline
```
Document → Extractor → Chunker → Embedding → Qdrant
```

### Verification Criteria
- [ ] Chunk count correct
- [ ] Chunk hashes valid
- [ ] Embedding dimensions correct (768)
- [ ] Payload metadata complete
- [ ] Projection status updated

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 5 — Qdrant Verification

### Objective
Verify Qdrant collections and vector integrity.

### Verification Criteria
- [ ] Collections exist
- [ ] Vector count matches expected
- [ ] Payload contains:
  - [ ] repository
  - [ ] path
  - [ ] chunk_index
  - [ ] content_hash
  - [ ] event_id
  - [ ] event_hash
  - [ ] aggregate_id
- [ ] Metadata and semantic chunks separated

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 6 — Retrieval Runtime

### Objective
Verify retriever is the only component allowed to query Qdrant.

### Verification Criteria
- [ ] Semantic search works
- [ ] Metadata lookup works
- [ ] Authority filtering works
- [ ] Citation generation works
- [ ] Context packing works
- [ ] Context window limits respected
- [ ] Deterministic ordering verified

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 7 — Ollama Integration

### Objective
Bring Ollama online as consumer only.

### Architecture
```
Ollama → Retriever → Qdrant → Repository Projection
```

### Forbidden Operations
- [ ] No Drive API
- [ ] No filesystem access
- [ ] No repository mirror access
- [ ] No PostgreSQL queries outside replay
- [ ] No Qdrant direct access
- [ ] No agents bypassing Retriever

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 8 — Constitutional Replay Test

### Objective
Delete projections, replay from events, verify reconstruction.

### Test Steps
1. Delete Qdrant collections
2. Delete projection tables
3. Delete caches
4. Leave PostgreSQL untouched
5. Run Repository Scanner
6. Run Projection Worker
7. Run Retriever
8. Run Ollama

### Test Prompt
```
Summarize constitution.md
```

### Pass Conditions
- [ ] Correct answer
- [ ] No Drive API requests
- [ ] No filesystem scan
- [ ] No repository scan
- [ ] No PostgreSQL queries outside replay
- [ ] Everything reconstructed from constitutional events

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 9 — Observability

### Objective
Verify OpenTelemetry traces across pipeline.

### Trace Verification
- [ ] Repository Scanner traces
- [ ] Projection Worker traces
- [ ] Retriever traces
- [ ] Ollama traces

### Metrics
- [ ] Latency measured
- [ ] Throughput measured
- [ ] Embedding duration measured
- [ ] Projection duration measured
- [ ] Retrieval duration measured
- [ ] LLM duration measured

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Phase 10 — Constitutional Audit

### Objective
Produce comprehensive verification report.

### Deliverables
- [ ] Repository files discovered count
- [ ] Events created count
- [ ] Events replayed count
- [ ] Chunks created count
- [ ] Vectors created count
- [ ] Retriever tests passed
- [ ] Replay tests passed
- [ ] Ollama tests passed
- [ ] Docker verification passed
- [ ] Failure list documented
- [ ] Performance metrics documented

### Status
**BLOCKING** - Docker Desktop unavailable

### Results
```
PENDING
```

---

## Blocking Issues

### Issue 1: Docker Desktop Unavailable
**Severity:** CRITICAL
**Status:** BLOCKING
**Description:** Docker Desktop crashed after PostgreSQL process termination.

**Impact:**
- Cannot verify Docker mount consistency
- Cannot run repository scanner
- Cannot verify PostgreSQL event store
- Cannot test projection worker
- Cannot verify Qdrant
- Cannot test retrieval runtime
- Cannot integrate Ollama
- Cannot run constitutional replay test

**Resolution:** User must restart Docker Desktop

---

## Summary

**Overall Status:** BLOCKED
**Phases Completed:** 0/10
**Phases Blocked:** 10/10
**Blocking Issue:** Docker Desktop unavailable

**Next Steps:**
1. Restart Docker Desktop
2. Begin Phase 1: Infrastructure Verification
3. Execute phases sequentially
4. Document results in this file
5. Produce final constitutional audit

**No new services will be added.**
**No new runtimes will be added.**
**No architectural changes will be made.**

The platform must first prove that constitutional replay is the single source of truth.
