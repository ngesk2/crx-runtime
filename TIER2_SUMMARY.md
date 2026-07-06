# Tier 2 Summary — Phase 42

## Completed Phases

| Phase | Report | Scope |
|-------|--------|-------|
| 2A | INGESTION_PIPELINE_REPORT.md | All 13 ingestion pipeline stages inventoried |
| 2B | REPOSITORY_RUNTIME_REPORT.md | All 25 repository runtime components classified |
| 2C | DORMANT_COMPILER_REPORT.md | 10 compiler/artifact stages audited |
| 2D | EVENT_FLOW_REPORT.md | Complete DOCUMENT_IMPORTED consumer chain traced |
| 2E | PROJECTION_AUTHORITY_REPORT.md | All Qdrant write/read paths, authority classification |

## Key Findings

### 1. The Complete Constitutional Ingestion Pipeline Exists — 100% Dormant

Every stage from DOCUMENT_IMPORTED to PROJECTION_CREATED is implemented in the Python kernel dispatcher (`kernel/event_dispatcher.py`). All 6 workers are registered with correct handler mappings. **Zero stages execute in production** because no container runs `worker_runtime.py`.

### 2. Gateway Pipeline Is Write-Only

The production gateway (`bootstrap/main.js` → `ConstitutionalExecutionPipeline`) persists events to `repository_events` but has:
- **0 registered reducers** in ReducerRegistry
- **0 registered projectors** in ProjectionRegistry
- No downstream processing beyond verification and storage

All events that flow through the production HTTP endpoint are stored and verified but never processed further.

### 3. 3 Independent Dispatch Systems, None Fully Connected

| System | Handlers | Status |
|--------|----------|--------|
| Python `kernel/event_dispatcher.py` | 6 (complete chain) | DORMANT (no runtime) |
| JS `reducer_registry.js` | 0 | ACTIVE BUT EMPTY |
| JS `constitutional_dispatcher.js` | 7 hardcoded | DORMANT (no callers) |

### 4. Qdrant Is Authorities for 2 Collections, Derived for Others

- **Authoritative**: `conversations` (no Postgres source), `checkpoints` (embeddings only)
- **Partially authoritative**: `documents` (filesystem writes bypass Postgres)
- **Derived**: `constitutional_memory`, `constitutional_documents` (Postgres source exists for event-pipeline paths)
- **8 read paths** trust Qdrant without Postgres verification
- **retrieval_service.py authority_filter is circular** — checks self-attested `_verified` field in Qdrant payload

### 5. ~7,000 Lines of Compiler/Artifact/Object Code Is Dormant

Includes 8 general compilers (2,800 lines), 5 gateway artifact implementations (1,500 lines), and relationship synthesis (500 lines). None of this code is reachable from production.

### 6. No Text Normalizer, No RepositoryIndexer, No Verification Worker

These stages do not exist anywhere in the codebase — not even as dormant implementations.

## Existing Constitutional Ingestion Stages

| Stage | Present | Running | Dormant | Missing |
|-------|---------|---------|---------|---------|
| Loader | ✅ | ❌ | ✅ | — |
| Chunker | ✅ | ❌ | ✅ | — |
| Normalizer | ❌ | ❌ | ❌ | ✅ (text) |
| Observation | ✅ | ❌ | ✅ | — |
| Claim | ✅ | ❌ | ✅ (gate MISSING) | — |
| Verification | ✅ | ❌ | ✅ (API path partial) | — |
| Witness | ✅ | ❌ | ✅ (JS auth wired) | — |
| Lineage | ✅ | ❌ | ✅ | — |
| Projection | ✅ | ❌ | ✅ | — |
| Embedding | ✅ | ❌ | ✅ | — |
| event_processing | ✅ | ✅ | — | — |
| Exactly-once | ✅ | ✅ (Tier 1 repair) | — | — |

## Missing Stages

1. **Text Normalizer** — no text normalization exists anywhere
2. **RepositoryIndexer** — no indexer component exists anywhere
3. **Verification Worker** — no handler in dispatcher; `verified: False` is a placeholder
4. **candidate_claim_worker** — referenced in AGENTS.md, not on disk
5. **pipeline_orchestrator.js** — the only production Qdrant writer, now missing from disk
6. **Vault → Postgres event** — vault indexing writes directly to Qdrant without Postgres event

## Broken Wiring

| Issue | Impact | File |
|-------|--------|------|
| No worker runtime container | Entire pipeline dormant | docker-compose.yml |
| ReducerRegistry has 0 handlers | Gateway events do nothing downstream | `gateway/runtime/reducer_registry.js` |
| ProjectionRegistry has 0 projectors | Pipeline never projects | `gateway/runtime/projection_registry.js` |
| GitHubIngestion imports missing `event_emitter` | GitHub ingestion crashes on load | `gateway/github_ingestion.js` |
| `events` table CHECK constraint blocks downstream types | 6 event types silently rejected | `pg_dump.sql` |
| `document_ingestion.js` writes Qdrant without Postgres | Qdrant is authoritative for documents | `gateway/document_ingestion.js` |
| `conversation_memory.js` writes Qdrant without Postgres | Qdrant is authoritative for conversations | `gateway/conversation_memory.js` |
| `projection_worker.py` does not write to Qdrant | Projection stage is a stub | `workers/projection_worker.py` |
| `artifact_type_registry.js` has `row.words` typo | Runtime error if called | `gateway/artifact_type_registry.js:49` |

## Minimal Wiring Repairs Applied (Tier 1)

| Repair | File | Status |
|--------|------|--------|
| Object.freeze + parent_event_id in StandardEventSchema | `gateway/standard_event_schema.js` | ✅ |
| event_processing table (durable tracking) | `gateway/event_repository.js` | ✅ |
| Transaction client in appendEvent() | `gateway/event_repository.js` | ✅ |
| markProcessed/markFailed/getUnprocessedEvents | `gateway/event_read_authority.js` | ✅ |
| /events/processed, /events/failed, /events/unprocessed routes | `gateway/routes/events.js` | ✅ |
| worker_runtime.py uses /events/unprocessed (durable, no in-memory) | `workers/worker_runtime.py` | ✅ |

## Remaining Blockers Before Live Validation

| Blocker | Severity | Fix Required |
|---------|----------|-------------|
| No docker-compose worker service | CRITICAL | Add `worker` service in docker-compose.yml |
| ReducerRegistry empty | HIGH | Register document processing handlers |
| ProjectionRegistry empty | HIGH | Register Qdrant projection handler |
| Events table CHECK constraint | MEDIUM | Add 6 missing event types to CHECK constraint (or remove it for `repository_events`) |
| No running Docker stack | CRITICAL | Docker Desktop must be running for any validation |
| Y: Qdrant not populated | Should already work | `constitutional_retrieval.py` writes both Postgres + Qdrant |

## Tier 3 Recommendations

Do NOT begin Tier 3 until:
1. Docker stack is running
2. A `worker` container is added to docker-compose.yml that runs `python3 workers/worker_runtime.py`
3. One DOCUMENT_IMPORTED event is traced through the complete chain end-to-end
