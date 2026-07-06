# CEO Deliverable 7: Remaining Blockers and Risk Assessment

## Infrastructure Blockers

| # | Blocker | Impact | Workaround |
|---|---------|--------|------------|
| B1 | Docker Desktop daemon not reachable | Cannot run any container stack | Manual fix scripts generated, apply when Docker available |
| B2 | crx-ollama-worker has no network | Ollama unreachable by any service | Need `docker network connect compose_brain_internal crx-ollama-worker` |
| B3 | crx-gateway isolated on wrong network | Cannot reach brain-postgres/brain-qdrant | Same network fix needed |
| B4 | 5 stopped containers | brain-ollama, brain-openwebui, brain-repo-runtime, ping-mission-control, vault | Need `docker start` (may fail due to config errors) |

## Code Blockers

| # | Blocker | Status | Fix |
|---|---------|--------|-----|
| B5 | Postgres CHECK constraint blocks worker events | **FIX SCRIPT READY** | `database/fix_pipeline_blockers.sql` |
| B6 | Postgres aggregate_id UUID rejects string IDs | **FIX SCRIPT READY** | `database/fix_pipeline_blockers.sql` |
| B7 | `_persistEvent()` column mismatch | **FIXED** (Phase 41) | Uses CQRS columns now |
| B8 | `qdrant_projection_worker.py` unwired | **DORMANT** | Needs RepoRuntime to execute; 542 lines in `runtime/kernel/workers/` |
| B9 | No worker runtime in compose.yaml | **FIXED** (Phase 43) | `worker-runtime` service + `Dockerfile.worker-runtime` created |
| B10 | PipelineOrchestrator uses SHA-256 not inference | Acceptable fallback | Deterministic embeddings are fine until Ollama is reachable |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Schema fix script needs modification for schema differences | Medium | Low | Script is simple ALTER TABLE — review and adjust |
| Worker handlers crash on first live event | Medium | Medium | All handlers have logging + error handling; worker_runtime has retry + max_retries guard |
| Qdrant projection never activates | High | Medium | `projection_worker.py` stores metadata only; `qdrant_projection_worker.py` is dormant |
| Gateway refuses worker POST (e.g., event type not in list) | Low | High | CHECK constraint fix resolves this; verify with live test |
