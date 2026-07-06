# RUNTIME STATE — Phase 43 Priority 0

## Infrastructure Status

### Docker — NOT RUNNING
Docker Desktop daemon is not reachable. Cannot inspect live containers, Postgres, Qdrant, or any running services.

---

## Component Classification

### 1. Docker Services

| Service | compose.yaml | compose.brain.yaml | brainos/compose | Dormant | Broken | Notes |
|---------|:-----------:|:------------------:|:---------------:|:-------:|:------:|-------|
| **postgres** | ✅ (15-alpine) | — | ✅ (18-alpine) | — | — | Two compose ecosystems using different PG versions |
| **qdrant** | ✅ | — | ✅ | — | — | Same config in both ecosystems |
| **ollama** | ✅ | — | ✅ | — | — | 5 profile overrides |
| **vault** | ✅ | — | ✅ | — | — | HashiCorp Vault dev mode |
| **mission-control** | ✅ | — | ✅ | — | — | Python FastAPI (port 8000) |
| **gateway** | ✅ | — | — | — | — | Node (port 8080) |
| **repo-runtime** | ✅ | — | ✅ | — | — | Alpine sleep infinity |
| **ui** | ✅ (next) | — | — | — | — | Dockerfile in CascadeProjects/infra |
| **digestion-worker** | ✅ (profile:dev) | — | — | ✅ | — | RSS digest worker |
| **newsletter-worker** | ✅ (profile:dev) | — | — | ✅ | — | Newsletter worker |
| **projection-worker** | ✅ | — | — | — | ✅ | **Dockerfile.projection MISSING** |
| **witness-worker** | ✅ | — | — | — | ✅ | **Dockerfile.witness MISSING** |
| **replay-worker** | ✅ | — | — | — | ✅ | **Dockerfile.replay MISSING** |
| **neo4j** | — | ✅ (profile:brain) | ✅ | ✅ | — | ZERO code connects to it |
| **temporal** | — | ✅ (profile:brain) | ✅ | ✅ | — | 8 implementation files, not wired |
| **kafka** | — | ✅ (profile:brain) | ✅ | ✅ | — | ZERO producer/consumer code |
| **zookeeper** | — | ✅ (profile:brain) | ✅ | ✅ | — | Kafka dependency |
| **duckdb** | — | ✅ (profile:brain) | ✅ | ✅ | — | No consumers |
| **opensearch** | — | ✅ (profile:brain) | ✅ | ✅ | — | No consumers |
| **tika** | — | ✅ (profile:brain) | ✅ | ✅ | — | No consumers |
| **openwebui** | — | — | ✅ | ✅ | — | In brainos compose only |

**Summary**: 15 services defined across compose ecosystems. 3 BROKEN (missing Dockerfiles). 8 DORMANT (infra defined, zero code using it). 8 ACTIVE in compose but Docker is not running.

---

### 2. PostgreSQL

**Schema**: `pg_dump.sql` (19 tables, 8,603 lines)
**Production entrypoint**: `compose.yaml` → `postgres:15-alpine` → loads `schema.sql`
**Tables with data**:

| Table | Rows | Status |
|-------|------|--------|
| observations | 7,176 | Populated |
| events | 16 | Populated (all DOCUMENT_IMPORTED) |
| artifact_registry | 15 | Populated |
| authority_objects | 15 | Populated |
| authority_lineage | 4 | Populated |
| system_metadata | 2 | Populated |
| 13 other tables | 0 | **EMPTY** |

**3 CRITICAL BLOCKERS** (Phase 41/42 findings, unfixed in schema):

| Blocker | Detail | Impact |
|---------|--------|--------|
| **CHECK constraint** | `valid_event_type` allows 28 types, NO overlap with worker-emitted types (OBSERVATION_CREATED, CLAIM_GENERATED, etc.) | Every worker INSERT silently rejected |
| **aggregate_id UUID** | Schema has `UUID NOT NULL`, workers insert string IDs (`doc_0`, `claim_9`) | All worker INSERTs rejected with type mismatch |
| **_persistEvent columns** | EventWriteAuthority uses old columns (payload, correlation_id, created_at) instead of CQRS (event_data) | Fixed in code Phase 41, not reflected in schema |

**60+ additional tables created by code at runtime** (CREATE TABLE IF NOT EXISTS). These only exist if their JS module has executed.

**Status**: **BROKEN** — schema blocks pipeline execution. 12 of 19 tables empty.

---

### 3. Redis

| Aspect | Status |
|--------|--------|
| Adapter code | ✅ `adapters/redis_adapter.js` (192 lines) |
| Compose service | ❌ **NO REDIS SERVICE** in any compose file |
| Production usage | ❌ Not used by any production code |
| BullMQ usage | ❌ `gateway/bullmq_adapter.js` requires Redis, never instantiated |

**Status**: **DORMANT** — adapter exists, no infrastructure. BullMQ dependency exists but never activated.

---

### 4. Qdrant

| Collection | Points | Status |
|-----------|--------|--------|
| constitutional_documents | 5 | Partially filled (from Phase 12 pipeline) |
| constitutional_memory | 0 | Empty |
| test_vectors | 0 | Empty (test collection) |
| tier2_operational | 0 | Empty (created by projection_worker) |
| tier3_working | 0 | Empty (created by projection_worker) |
| documents (ad-hoc) | 0 | Created by document_ingestion.js |
| conversations (ad-hoc) | 0 | Created by conversation_memory.js |

**All collections**: 768 dimensions, Cosine distance.

**Projection Workers**:
- `runtime/kernel/workers/qdrant_projection_worker.py` (542L) — full projection with embedding + filtering — **DORMANT**
- `brainos/.../projection_worker.py` (266L) — simpler alternative — **DORMANT**
- `workers/projection_worker.py` (113L) — registered in pipeline, **does NOT write to Qdrant** (stores projection record only)

**Write paths**:
- 7 paths have Postgres source before Qdrant write (properly derived)
- 4 paths write directly to Qdrant without Postgres (Qdrant IS authoritative):
  - `gateway/document_ingestion.js:299` — filesystem chunks
  - `gateway/conversation_memory.js:229` — conversations
  - vault indexing workers (2 files)

**Read paths**:
- 4 read paths verify Qdrant results against Postgres (properly derived)
- 8 read paths trust Qdrant as source of truth (no Postgres verification)

**Status**: **PARTIALLY ACTIVE** — `constitutional_documents` has 5 points. 2 collections empty. 2 authoritative collections (no Postgres source). 8 unverified read paths.

---

### 5. Neo4j

| Aspect | Status |
|--------|--------|
| Compose service | ✅ `neo4j:5.15-community` in compose.brain.yaml + brainos compose |
| Ports | 7474 (HTTP) + 7687 (Bolt) |
| Code connections | **ZERO** — no neo4j driver import in any Python or JS file |
| Network isolation | brain_internal bridge (profile: brain only) |

**Status**: **ORPHAN INFRASTRUCTURE** — compose service exists, zero code uses it.

---

### 6. Ollama

| Aspect | Status |
|--------|--------|
| Compose service | ✅ `ollama/ollama:latest` in 5 compose files |
| Port | 11434 |
| Models | qwen2.5-coder:7b, qwen2.5-coder:14b |
| Code files | 17 files identified |
| Production-wired | Only `routes/ollama.js` (66L) — POST /chat, GET /models, POST /autocomplete |
| Inference adapter | `gateway/inference_adapter.js` (186L) — intended single inference authority — **DORMANT** |
| Python workers | Connect via Ollama HTTP directly (not through inference_adapter) |

**Connection to workers**: Workers connect directly to Ollama HTTP (`OLLAMA_BASE_URL`), bypassing `inference_adapter.js`. No LiteLLM in the path.

**Status**: **ACTIVE** (compose service) + **DORMANT** (16 of 17 code files never execute).

---

### 7. LiteLLM

| Aspect | Status |
|--------|--------|
| Code | **ABSENT** — zero files match `*litellm*` |
| Compose service | **ABSENT** |
| Design docs | ✅ Referenced in `COMPUTE_BROKER_DESIGN.md` and `OLLAMA_ROUTING_CERTIFICATION.md` as "not present" |

**Status**: **MISSING** — exists only in design documents.

---

### 8. Gateway

| Aspect | Status |
|--------|--------|
| Production entry point | `gateway/server.js` (76 lines) — creates its own pg.Pool, mounts routes directly |
| Bootstrap/main.js | **NOT production** — exists but `server.js` does not use it |
| Bootstrap/wiring.js | **NOT production** — legacy DI container, not used |
| GatewayRuntime | **NOT production** — gateway_runtime.js not called by server.js |
| Routes | 93 routes in monolith (server.js phase) → now refactored to ~76 lines |

**Routes actually handled**:
- `/events` — POST (pipeline), GET, GET /recent, GET /stats, GET /unprocessed, POST /processed, POST /failed
- `/health` — health check
- `/api/v1/repository` — objects CRUD
- `/context` — context endpoints
- `/system` — system info
- `/api/v1/ollama` — Ollama proxy

**Dependencies**:
- `pg.Pool` — direct SQL access
- `RepositoryStore` — generic object storage
- `EventReadAuthority` — event queries
- `RepositoryClient` — imported by Python workers

**Status**: **ACTIVE** — gateway code exists and is structured for service-based routing but is not running (Docker down).

---

### 9. Worker Runtime

| Runtime | File | Polls | Dispatch | Status |
|---------|------|-------|----------|--------|
| A. HTTP polling | `workers/worker_runtime.py` | `/events/unprocessed` via HTTP | EventDispatcher.dispatch() | **ACTIVE CODE** — not deployed |
| B. Direct PG | `constitutional_runtime.py` | events table `WHERE processed_at IS NULL` | In-process handler dict | **DORMANT** — hardcoded PG config |
| C. Docker exec | `runtime/constitutional_runtime.py` | docker exec psql | EventDispatcher | **DORMANT** — requires Docker socket |

**Workers registered in dispatcher** (via `kernel/event_dispatcher.py`):

| Worker | File | Consumes | Produces | Handler |
|--------|------|----------|----------|---------|
| observation_worker | `workers/observation_worker.py` | DOCUMENT_IMPORTED | OBSERVATION_CREATED | `handle_document_imported()` |
| claim_worker | `workers/claim_worker.py` | OBSERVATION_CREATED | CLAIM_GENERATED | `handle_observation_created()` |
| replay_worker | `workers/replay_worker.py` | CLAIM_GENERATED | REPLAY_EXECUTED | `handle_claim_generated()` |
| witness_worker | `workers/witness_worker.py` | REPLAY_EXECUTED | WITNESS_CREATED | `handle_replay_executed()` |
| lineage_worker | `workers/lineage_worker.py` | WITNESS_CREATED | LINEAGE_CREATED | `handle_witness_created()` |
| projection_worker | `workers/projection_worker.py` | LINEAGE_CREATED | PROJECTION_CREATED | `handle_lineage_created()` |

**Docker compose**: NO worker-runtime service in any compose file. 3 worker services in compose.yaml (`projection-worker`, `witness-worker`, `replay-worker`) have **missing Dockerfiles**.

**Status**: **ACTIVE CODE, NOT DEPLOYED** — structurally complete pipeline. Zero production execution.

---

### 10. Constitutional Compiler

| Compiler | Lines | Production | Status |
|----------|-------|-----------|--------|
| `gateway/knowledge_compiler.js` | 889 | ❌ | DORMANT — 7-pass, never called |
| `gateway/canonical_graph_compiler.js` | 561 | ❌ | DORMANT — nodes/edges/roots/Merkle |
| `gateway/schema_compiler.js` | 126 | ❌ | DORMANT — SourceDTO → CanonicalIR |
| `gateway/adapter_compiler_v2.js` | 348 | ❌ | DORMANT — 11-stage pipeline |
| `gateway/compiler_authority.js` | 122 | ❌ | DORMANT — ConstitutionalObject creation |
| `gateway/compiler_lineage_authority.js` | 49 | ❌ | DORMANT |
| `gateway/compiler_lineage_witness.js` | 109 | ❌ | DORMANT |
| `orchestration/knowledge_compiler.js` | 223 | ✅ (orchestration) | EXERCISED — separate system |

**Total dormant compiler code**: ~2,800 lines across 8 files.

**Status**: **ALL DORMANT** — zero compiler code reaches production.

---

### 11. Repository Runtime

| Component | File | Status |
|-----------|------|--------|
| RepositoryClient | `workers/repository_client.py` | ACTIVE (imported by 6 workers) |
| RepositoryStore | `gateway/repository_store.js` | ACTIVE (wired in bootstrap) |
| EventRepository | `gateway/event_repository.js` | ACTIVE (wired in bootstrap) |
| Repository Routes | `routes/repository.js` | ACTIVE (mounted in gateway) |
| GitHubAdapter | `gateway/github_adapter.js` | DORMANT |
| GitHubIngestion | `gateway/github_ingestion.js` | BROKEN (missing import) |
| FilesystemAuthority | `gateway/filesystem_authority.js` | DORMANT |
| FileWatcher | `gateway/file_watcher.js` | DORMANT |
| RepositoryScanner | `repository_scanner.py` | DORMANT |
| RepositoryIndexer | **MISSING** | NOT FOUND |
| DriveIngestor | `runtime/ingestion/drive_ingestor.py` | UNREACHABLE |
| RepositoryAuthority (JS) | `gateway/repository_authority.js` | DORMANT |
| RepositoryAuthority (Python) | `runtime/authorities/repository_authority.py` | UNREACHABLE |
| SnapshotRepository | `gateway/snapshot_repository.js` | DORMANT |

**Status**: 4 ACTIVE, 8 DORMANT, 1 BROKEN, 2 UNREACHABLE, 1 MISSING.

---

### 12. Event Dispatcher

| Dispatcher | File | Handlers | Production | Status |
|-----------|------|----------|-----------|--------|
| Python kernel | `kernel/event_dispatcher.py` | 6 registered (complete chain) | ❌ | DORMANT |
| Gateway ReducerRegistry | `runtime/reducer_registry.js` | 0 registered | ❌ | EMPTY |
| Gateway Constitutional | `constitutional_dispatcher.js` | 7 hardcoded | ❌ | DORMANT |

**Status**: **DORMANT** — 3 dispatchers, none wired in production. The Python kernel has the only complete handler chain.

---

### 13. Event Fabric

| Component | File | Production | Status |
|-----------|------|-----------|--------|
| StandardEventSchema | `gateway/standard_event_schema.js` | ❌ | DORMANT (needs bootstrap) |
| EventRepository | `gateway/event_repository.js` | ❌ | DORMANT (needs bootstrap) |
| EventReadAuthority | `gateway/event_read_authority.js` | ❌ | DORMANT (needs bootstrap) |
| EventWriteAuthority | `gateway/event_write_authority.js` | ❌ | DORMANT (NATS unavail) |
| EventBus | `gateway/event_bus.js` | ❌ | DORMANT |
| Orchestration EventQueue | `orchestration/execution/event_queue.js` | ✅ (orchestration) | EXERCISED |

**4 independent event pipeline systems** (no interoperation):
1. Python kernel pipeline — HTTP events → gateway → repository_events
2. Orchestration fabric — in-memory + filesystem
3. Gateway bootstrap — ConstitutionalExecutionPipeline (wired but never called)
4. Production server.js — direct SQL queries (the only path ever used)

**Status**: **FRAGMENTED** — 4 systems, zero interoperation. Constitutional path (system 3) is structurally complete but never reaches production.

---

### 14. Replay Engine

| Implementation | Files | Lines | Production | Status |
|---------------|-------|-------|-----------|--------|
| Gateway JS authorities | ~15 files | ~2,900 | ❌ | ALL DORMANT |
| Runtime TS kernel | ~11 files | ~1,000+ | ❌ | UNTRACKED (gitignored) |
| Python replay_worker | 1 file | 98 | ❌ | DORMANT (stub) |

**What replay does**: Witness verification + state reconstruction via transcript. 8-step plan with 7-witness verification pipeline.

**Status**: **ALL DORMANT** — ~30 files, ~4,000+ lines. Zero replay operations have ever executed.

---

## Overall Classification

| Component | Compose | Code | Production | Operational |
|-----------|:-------:|:----:|:----------:|:-----------:|
| **Docker** | ✅ | — | — | ❌ (daemon down) |
| **PostgreSQL** | ✅ | ✅ | ❌ | ❌ (schema blocks pipeline) |
| **Redis** | ❌ | ✅ | ❌ | ❌ (no infrastructure) |
| **Qdrant** | ✅ | ✅ | ❌ | ❌ (daemon down) |
| **Neo4j** | ✅ | ❌ | ❌ | ❌ (orphan infra) |
| **Ollama** | ✅ | ✅ | ❌ (routes only) | ❌ (daemon down) |
| **LiteLLM** | ❌ | ❌ | ❌ | ❌ (absent) |
| **Gateway** | ✅ | ✅ | ✅ | ❌ (daemon down) |
| **Worker Runtime** | ❌ (no service) | ✅ | ❌ | ❌ (not deployed) |
| **Compiler** | ❌ | ✅ | ❌ | ❌ (all dormant) |
| **Repository Runtime** | ✅ | ✅ | ❌ | ❌ (daemon down) |
| **Event Dispatcher** | ❌ | ✅ | ❌ | ❌ (not wired) |
| **Event Fabric** | ❌ | ✅ | ❌ | ❌ (fragmented) |
| **Replay Engine** | ❌ | ✅ | ❌ | ❌ (all dormant) |

**Constitutional Execution Coverage**: **0%** — zero requests route through constitutional authorities.

**Readiness Score**: **2/10** — Infrastructure defined, code implemented, but no constitutional execution path is operational.

### Immediate Blockers (not infrastructure)
1. PostgreSQL CHECK constraint blocks all worker event types
2. `aggregate_id UUID NOT NULL` rejects worker string IDs
3. 3 missing Dockerfiles for projection/witness/replay workers
4. No worker-runtime service in docker-compose
5. Gateway bootstrap not connected to production entry point
6. ReducerRegistry and ProjectionRegistry empty (0 handlers)
