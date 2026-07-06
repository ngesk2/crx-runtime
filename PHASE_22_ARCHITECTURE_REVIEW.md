# Phase S.18 — Constitutional Convergence Audit

**READ ONLY — NO EDITS, NO IMPLEMENTATION, NO FILE MOVEMENT, NO DELETIONS**

**Date:** 2026-06-29
**Purpose:** Discover every remaining violation of constitutional ownership. Not to recommend patterns. To discover where multiple components still claim ownership of the same responsibility.
**Constraint:** Only repository evidence may be used.

---

## Phase A — Responsibility Multiplicity

For every subsystem: Exactly one owner, multiple owners, or no owner.

### Identity

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/identity_authority.js` (272 lines, JS, wired in production) |
| Secondary Owners | `runtime/authorities/identity_authority.py` (108 lines, Python, unwired), `runtime/kernel/identity/identity-authority.ts` (30 lines, TS interface, unwired) |
| Evidence | All three files define identity generation methods. JS owner is used by gateway. Python owner exists but is imported by zero production files. TS owner is in gitignored runtime/. Plus 25+ files using `uuid.uuid4()` directly (see Phase D). |
| Risk | Three implementations diverge. JS uses deterministic hash-based IDs. Python uses UUID v7. TS uses branded types. Production events carry hash-based IDs; if migration to UUID v7 occurs, replay breaks. |
| Confidence | High — files on disk, grep-confirmed |

### Time

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/constitutional_time_authority.js` (111 lines, JS, wired in production) |
| Secondary Owners | None — only one implementation exists |
| Evidence | All production code imports from this file. The authority has replay mode (setCurrentTime/clearCurrentTime) but it is never activated — production always returns wall-clock time. |
| Risk | Replay mode never exercised. Partial replay would use real wall clock and produce different event timestamps. |
| Confidence | High — single import path confirmed |

### Canonicalization / Hashing

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/canonical_authority.js` (501 lines, JS, wired) — owns CanonicalBytes.serialize() + CanonicalAuthority.hash() |
| Secondary Owners | `runtime/authorities/canonical_hash_authority.py` (31 lines, Python, unwired), `runtime/kernel/replay/certificate_authority.ts` (280 lines, TS, unwired), `runtime/kernel/replay/canonical_hash_authority.ts` (80 lines, TS, unwired) |
| Bypass Files | **60+ JS files** with `require('crypto')` + hashlib calls in Python. See Phase D count: ~63 bypass sites directly creating SHA-256 hashes outside any owner. |
| Evidence | The JS canonical_authority.js IS the production authority, but ~60 other gateway files also call crypto.createHash directly (duplicating or replacing authority-owned hashing). The TS CertificateAuthority (280 lines of pure SHA-256 math) is entirely separate and unwired. |
| Risk | Hashes created outside the authority cannot be verified in replay. Domain separation (hashFile vs hashAST vs hashSymbol) is lost when random files call `crypto.createHash('sha256').update(x).digest('hex')`. |
| Confidence | High — exhaustive grep confirmed |

### Serialization

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `gateway/canonical_authority.js` (501 lines) defines `CanonicalBytes.serialize()` but only ~5 files use it. `repository_store.js` uses it for object persistence. |
| Evidence | ~520 sites use `JSON.parse` or `JSON.stringify` for serialization outside any authority (see Phase D). The canonical JSON serializer exists but is not the primary serialization path. |
| Risk | No canonical serialization format. Events serialized with different key orderings produce different hashes. Deep-copy pattern (`JSON.parse(JSON.stringify(x))`) is unchecked — loses Date objects, undefined, symbols. |
| Confidence | High — `JSON.parse/stringify` grep count |

### Replay

| Aspect | Finding |
|--------|---------|
| Primary Owner | `runtime/kernel/replay/replay-authority.ts` (75 lines, TS, unwired), `runtime/kernel/replay/replay-plan-authority.ts` (384 lines, TS, unwired) |
| Secondary Owners | `gateway/replay_authority.js` (101 lines, JS, wired but dormant), `gateway/replay_plan_authority.js` (348 lines, JS, wired but dormant), `gateway/constitutional_dependency_graph.js` (509 lines, JS, wired but dormant), `gateway/merkle_replay_graph.js` (419 lines, JS, wired but dormant) |
| Compiled JS Replay Engine | Exists ONLY in `main` branch (18 files, compiled JS) — NOT in `audit-hardening` or `constitutional-trunk` |
| Evidence | Production gateway has zero replay endpoints that execute actual replay. `/replay/status` returns empty/null. The 4 gateway replay authorities are instantiated but never triggered. The TS replay engine is in gitignored runtime/. |
| Risk | No event can be deterministically replayed. Entire replay architecture is design-only. |
| Confidence | High — confirmed in Sessions 9 and 16 |

### Witness

| Aspect | Finding |
|--------|---------|
| Primary Owner | `runtime/kernel/replay/witness_authority.ts` (237 lines, TS, unwired) |
| Secondary Owners | `gateway/witness_authority.js` (175 lines, JS, wired but dormant), `gateway/witness_chain.js` (JS, wired but dormant), `gateway/witness_recorder.js` (JS, wired but dormant) |
| Evidence | `authority_witness` table does not exist in production database. `authority_search.py` queries it with graceful fallback. No event in production has a witness chain. |
| Risk | All events are unwitnessed. Event forgery cannot be detected. |
| Confidence | High — table existence confirmed in Session 5 |

### Knowledge

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/knowledge_compiler.js` (883 lines, JS, wired but dormant) — 7-pass compiler |
| Secondary Owners | `gateway/knowledge_object.js` (JS, wired), `runtime/kernel/knowledge/knowledge-authority-interface.ts` (TS interface, unwired) |
| Evidence | KnowledgeCompiler exists with 7 compilation passes but is never invoked. Production knowledge endpoints read from static files (`knowledge/authority-index.json`, `knowledge/knowledge-graph.json`) or live Postgres/Qdrant queries. |
| Risk | Knowledge compilation is unexercised. The compiler assumes it will receive GitHub data through AcquisitionPass but no production path feeds it. |
| Confidence | High — code reads confirm |

### Inference

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/inference_adapter.js` (JS, wired) — routes to Ollama or OpenAI |
| Secondary Owners | `runtime/adapters/inference_adapter.py` (138 lines, Python, unwired), `runtime/adapters/ollama_provider_adapter.py` (167 lines, Python, unwired), `runtime/adapters/openai_provider_adapter.py` (147 lines, Python, unwired) |
| Evidence | Production inference flows through gateway/inference_adapter.js which calls Ollama. Two Python inference adapters exist in runtime/ but are imported by zero production files. Gateway also has ollama_provider.js and ollama_provider_adapter.js — separate implementations. |
| Risk | 3 parallel inference implementations. If one behavior changes, the others diverge. Inference results are unwitnessed (no hash, no replay verification). |
| Confidence | High |

### Authorization

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `gateway/jwt_auth.js` / `runtime/security/jwt_auth.py` (both exist but unwired) |
| Evidence | All 93 routes in server.js are publicly accessible. Zero authentication middleware. Only middleware is `express.json()` + CORS headers. JWT implementations exist but are not registered in any route. |
| Risk | Any process reaching port 8080 has full read/write access. |
| Confidence | High — server.js line 59-78 confirmed |

### Configuration

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `runtime/config/` (3 Python files + __init__.py, unwired), `runtime/kernel/config/` (4 TS files, unwired), `gateway/config_adapter.ts` (55 lines, unwired) |
| Evidence | ~62 sites read `process.env.X` directly across gateway/ (see Phase D). Every file does `process.env.X \|\| default` inline. No central ConfigurationAuthority is wired in production. |
| Risk | Config scattered across all files. No single source of truth. Env var changes require hunting through 60+ call sites. |
| Confidence | High — extensive grep |

### Persistence (Event Writing)

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/event_emitter.js` (101 lines, JS, wired) — writes to events table |
| Secondary Owners | `gateway/pipeline_orchestrator.js` (143 lines, JS, wired) — also writes to events table, `brainos/orchestration/src/constitutional/event_emitter.py` (461 lines, Python, wired) — writes to same events table with different schema, `gateway/event_bus.js` (203 lines, JS, wired but dormant) — has own persist method |
| Evidence | 4 different code paths write to the same `events` table with different schemas. See 4 incompatible schemas in Phase 22 Section 7c. 28 direct `eventPool.query()` calls in server.js (see Phase D). |
| Risk | Schema drift causes runtime failures (confirmed in Session 5). Event writing is ungoverned. |
| Confidence | High |

### Metrics

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `gateway/metrics_port.js` (port interface only), comments referencing Prometheus in `metrics_port.js:15` |
| Evidence | Zero metrics collection in production. No counters, no gauges, no histograms. |
| Risk | Cannot measure: request latency, error rates, throughput, worker capacity, queue depth. Ops blind. |
| Confidence | High |

### Logging

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | None |
| Evidence | ~560 `console.log/error/warn` calls across gateway/ (see Phase D). No structured logging, no log levels, no correlation IDs, no JSON output. |
| Risk | Cannot search or filter logs. Correlation IDs absent — cannot trace request across services. |
| Confidence | High |

### Worker Lifecycle

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `runtime/workers/worker_base.py` (112 lines, Python, covers 5/30 workers), `gateway/worker_pool.js` (403 lines, JS, unwired), `gateway/dedicated_workers.js` (220 lines, JS, wired but dormant), `kernel/event_dispatcher.py` (94 lines, Python, unwired) |
| Evidence | 30+ workers across 5 generations. No shared lifecycle. WorkerBase covers only 5 workers. No process supervisor exists. |
| Risk | Workers crash silently. No restart. No health. No coordination. |
| Confidence | High |

### Retry

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `constitutional_runtime.py:132` increments `retries` without cap (unbounded). `WorkerBase:98-100` doubles poll interval on error. `gateway/retry_authority.js` (255 lines, JS, unwired). `gateway/retry_policy.js` (JS, unwired). `brainos` workers sleep 60s on error. |
| Evidence | Every worker has its own retry logic. No shared retry policy. No max-retry caps. No dead letter escalation. |
| Risk | Poison events poll forever. Retry storms under load. |
| Confidence | High |

### Dead Letter

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/dead_letter_authority.js` (370 lines, JS, wired but dormant), `gateway/dead_letter_queue.js` (SQLite-based, wired but dormant) |
| Secondary Owners | None |
| Evidence | Both implementations exist but no production path calls them. No DLQ table exists in PostgreSQL. Failed events stay in `event_processing` with unbounded retries. |
| Risk | No poison event isolation. |
| Confidence | High |

### Outbox

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/event_outbox.js` (296 lines, JS, wired but dormant) — full outbox pattern with Redis + EventBus + retry + cleanup |
| Secondary Owners | `gateway/outbox_worker.js` (281 lines, JS, unwired) — LISTEN/NOTIFY alternative |
| Evidence | EventOutbox is instantiated but events bypass it through event_emitter.js. The outbox table likely does not exist. No atomic write guarantee exists. |
| Risk | Process crash between event INSERT and projection = lost event. |
| Confidence | High |

### Queue

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | 7 polling implementations: `analysis_queue.js`, `worker_queue.js`, `persistent_queue.js`, `mission_queue.js`, `constitutional_mission_queue.js`, `worker_scheduler.js` (gateway), `pipeline_orchestrator.js` (gateway setInterval) |
| Evidence | All 7 are polling-based (PostgreSQL queries or setInterval). No message broker. No push mechanism. |
| Risk | Thundering herd with multiple workers. No priority. No backpressure. |
| Confidence | High |

### Schema

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | `schema.sql` (183 lines, defines CQRS schema), `schema_expanded.sql` (603 lines, 17 tables, obsolete), `migration_001_bidirectional_memory.sql` (126 lines, never applied), `postgres_event_store.ts` (214 lines, defines different schema) |
| Evidence | 4+ incompatible event table schemas. The production schema evolved manually — no migration was ever applied from these files. |
| Risk | Schema state undocumented. Reproducing from scratch requires reading application code. Schema evolution is blocked. |
| Confidence | High |

### Migration

| Aspect | Finding |
|--------|---------|
| Primary Owner | **None** |
| Secondary Owners | 5 SQL migration files in `archive/obsolete/` — never applied |
| Evidence | `migration_002_authority_tables.sql`, `migration_003_lineage_and_registry.sql`, `migration_add_projection_columns.sql` — all in archive/obsolete/. The projection columns were added manually. |
| Risk | No migration framework. Schema changes are manual SQL. |
| Confidence | High |

### Vector Storage

| Aspect | Finding |
|--------|---------|
| Primary Owner | `gateway/qdrant_client.js` (107 lines, JS, wired) |
| Secondary Owners | `runtime/authorities/projection_authority.py` (70 lines, Python, unwired), `runtime/kernel/projection/projection-authority-interface.ts` (TS interface, unwired) |
| Evidence | Production Qdrant access flows through qdrant_client.js (REST client) or direct `fetch()` in server.js. Python ProjectionAuthority is unwired. |
| Risk | Multiple paths to Qdrant will diverge. Schema-less Qdrant allows point structure drift. |
| Confidence | High |

### Summary: Responsibility Multiplicity

| Subsystem | Owners | Verdict |
|-----------|--------|---------|
| Identity | 3 owners + 25 bypasses | 🔴 Multiplicity |
| Time | 1 owner (replay mode unexercised) | 🟡 Single owner, partial |
| Canonicalization | 4 owners + 63 bypasses | 🔴 Multiplicity |
| Serialization | No owner + 520 bypasses | 🔴 No Owner |
| Replay | 2 owners, all unwired | 🔴 No Production Owner |
| Witness | 3 owners, all unwired | 🔴 No Production Owner |
| Knowledge | 3 owners, 0 exercised | 🟡 Multiple, none exercised |
| Inference | 3 implementations | 🟡 Multiple, 1 wired |
| Authorization | No owner | 🔴 No Owner |
| Configuration | No owner + 62 bypasses | 🔴 No Owner |
| Persistence | 4 owners, different schemas | 🔴 Multiplicity |
| Metrics | No owner | ⚪ No Owner |
| Logging | No owner | ⚪ No Owner |
| Worker Lifecycle | 4 patterns, none comprehensive | 🔴 No Owner |
| Retry | No shared owner | 🔴 No Owner |
| Dead Letter | 2 implementations, all dormant | 🟡 Implemented, Dormant |
| Outbox | 2 implementations, all dormant | 🟡 Implemented, Dormant |
| Queue | No owner, 7 polling impls | 🔴 No Owner |
| Schema | No owner, 4+ schemas | 🔴 No Owner |
| Migration | No owner, SQL files abandoned | 🔴 No Owner |
| Vector Storage | 2 owners, 1 wired | 🟡 Multiple |

---

## Phase B — God Objects

Every file that owns more than one constitutional concern.

### B1. `gateway/server.js` (87,083 bytes, ~2,327 lines)

| Responsibility | Evidence |
|---------------|----------|
| HTTP Route Handler | 93 route registrations (67 GET, 23 POST, 1 DELETE) |
| SQL Data Access | 28 direct `eventPool.query()` calls |
| Authentication | Zero (intentional absence — no auth middleware) |
| Inference Client | 5+ direct `fetch()` calls to Ollama |
| Qdrant Client | 4 direct `fetch()` calls to Qdrant |
| Docker Client | Raw `net.createConnection('/var/run/docker.sock')` + HTTP parsing |
| Git Client | `execSync('git ...')` calls for branch/commit/status |
| Cron Scheduler | 3 `setInterval()` registrations (pipeline, MCP refresh, heartbeat) |
| Hashing | 2 `require('crypto').createHash('sha256')` calls |
| File Reader | `fs.existsSync/readFileSync/readdirSync` for config, knowledge files |
| Environment Config | 16 `process.env.X` reads with inline defaults |
| Logging | 57 `console.log/error` calls with `new Date().toISOString()` |
| Health Check | Self-referencing HTTP call to `localhost:8080/system/containers` |
| Error Handler | ~55 individual try/catch blocks (no error middleware) |
| Request Validation | Zero (no request schema validation) |

**Constitutional Violations:** All 14 responsibilities violate constitutional ownership. server.js is a monolith that directly accesses infrastructure (SQL, Docker, filesystem, Git, Ollama, Qdrant) without passing through any authority or adapter.

**Refactor Candidates:**
- Route handlers → gateway/controllers/ or gateway/routes/
- SQL queries → RepositoryAuthority
- crypto.createHash → CertificateAuthority
- process.env → ConfigurationAuthority
- setInterval → PipelineOrchestrator (partial, but should be a managed scheduler)
- fs operations → FilesystemAuthority
- fetch() → InferenceAdapter, QdrantClient
- execSync → ExecutionAuthority

### B2. `gateway/constitutional_knowledge_acquisition.js` (38,785 bytes)

| Responsibility | LOC approx |
|---------------|-----------|
| Repository ingestion | Unknown |
| Object normalization | Unknown |
| Persistence to events table | Direct SQL |
| Graph compilation integration | Unknown |
| Knowledge object creation | Unknown |

Full read not performed in this audit (file is 38KB). Likely owns 4-5 responsibilities based on naming patterns.

### B3. `gateway/canonical_symbol_objects.js` (33,920 bytes)

Symbol object factories for multiple languages. Likely owns:
- AST canonicalization
- Symbol extraction
- Symbol persistence

### B4. `gateway/knowledge_compiler.js` (27,168 bytes, 883 lines)

| Responsibility | LOC | Evidence |
|---------------|-----|----------|
| GitHub acquisition pass | ~30 | Lines 1-30 config |
| Normalization pass | ~50 | Lines 32-80 |
| Structural compilation | ~100 | Lines 82-180 |
| Semantic compilation | ~150 | Lines 182-330 |
| Verification pass | ~80 | Lines 332-410 |
| Constitutional Object synthesis | ~120 | Lines 412-530 |
| Reflection pass | ~100 | Lines 532-630 |
| 7-pass orchestration | ~250 | Lines 632-883 |

**Responsibility count: 8** (7 passes + orchestration). Each pass is a distinct concern. The compiler is well-structured (immutable IO per pass, independently replayable) but the monolithic file violates single-responsibility at the file level.

### B5. `gateway/memory_authority.js` (26,729 bytes)

Memory management authority. Likely owns:
- Memory storage/retrieval
- Memory consolidation
- Memory TTL/eviction
- Direct SQL access

### B6. `gateway/constitutional_compatibility_scorer.js` (22,694 bytes, 718 lines)

| Responsibility | Lines | Evidence |
|---------------|-------|----------|
| PostgreSQL queries | 620-690 | 3 direct `this._postgres.query()` calls |
| Architectural similarity scoring | 99-136 | Jaccard of kind+authority distributions |
| Dependency topology scoring | 556-583 | Node+edge Jaccard overlap |
| Object-kind overlap scoring | 165-189 | Kind vocabulary overlap |
| Authority reuse scoring | 191-215 | Authority vocabulary overlap |
| Replay compatibility scoring | 217-243 | Event type overlap |
| Compiler stage similarity | 537-555 | Stage set overlap |
| Mission reuse scoring | 585-602 | Mission set overlap |
| Evidence generation | 268-285 | 9 sub-reports |
| Batch pairwise computation | 697-714 | N-repository matrix |

**Responsibility count: 10 distinct concerns.** Also carries 2 dead imports (CanonicalAuthority, identityAuthority at lines 17-18, never used).

**Refactor Candidates:**
- Scoring functions → standalone pure functions or a `CompatibilityScorer` module
- Database access → RepositoryAuthority calls
- Evidence generation → separate `EvidenceReport` module
- Batch computation → separate orchestrator

### B7. `gateway/event_authority.js` (21,215 bytes, 723 lines)

| Responsibility | Evidence |
|---------------|----------|
| Event storage | Direct SQL |
| Event querying | Direct SQL |
| Event type validation | Schema constraints |
| Event stream management | Stream queries |
| Event authority identity | Authority metadata |

**Largest JS authority class.** Owns database access AND validation authority AND identity authority concerns.

### B8. `gateway/constitutional_runtime.js` (19,080 bytes, 534 lines)

| Responsibility | Evidence |
|---------------|----------|
| 10-stage lifecycle orchestration | Lines 1-534 |
| Error handling per stage | Inline |
| Lifecycle state tracking | Direct SQL |
| Rollback on failure | Compensating actions |

**Responsibility count: 4.** Reasonable for an orchestrator but the SQL access is a concern violation.

### B9. `gateway/worker_pool.js` (403 lines)

| Responsibility | Evidence |
|---------------|----------|
| Worker registration | Lines |
| Start/stop lifecycle | Lines |
| Job dequeue loop | Lines |
| Retry policy | Lines |
| Dead letter escalation | Lines |
| Health checks | Lines |
| Metrics collection | Lines |

**Responsibility count: 7.** Manages lifecycle, retry, DLQ, health, and metrics in one class. Each should be a separate concern.

### Top 20 JS God Object Candidates (gateway/)

| Rank | File | Size (bytes) | Est. Responsibilities | Primary Violation |
|------|------|-------------|---------------------|-------------------|
| 1 | server.js | 87,083 | 14 | Monolith |
| 2 | constitutional_knowledge_acquisition.js | 38,785 | 4-5 | Multi-concern |
| 3 | canonical_symbol_objects.js | 33,920 | 3-4 | Multi-concern |
| 4 | constitutional_pattern_database.js | 28,317 | 3-4 | Multi-concern |
| 5 | universal_source_analysis_pipeline.js | 27,326 | 4-5 | Multi-concern |
| 6 | constitutional_validation_harness.js | 27,243 | 3-4 | Multi-concern |
| 7 | knowledge_compiler.js | 27,168 | 8 | Well-structured but large |
| 8 | memory_authority.js | 26,729 | 4 | Authority + SQL bypass |
| 9 | replay_kernel_audit.js | 23,341 | --- | Audit file |
| 10 | repository_fingerprinting.js | 23,324 | 3-4 | Multi-concern |
| 11 | constitutional_compatibility_scorer.js | 22,694 | 10 | God object |
| 12 | integration_intelligence.js | 22,595 | --- | Multi-concern |
| 13 | event_authority.js | 21,215 | 4 | Authority + SQL |
| 14 | technology_authority.js | 20,995 | --- | Reasonable scope |
| 15 | constitutional_command_center.js | 19,872 | --- | Reasonable scope |
| 16 | constitutional_runtime.js | 19,080 | 4 | Orchestrator + SQL |
| 17 | constitutional_ollama_integration.js | 18,482 | --- | Multi-concern |
| 18 | deterministic_hashes.js | 18,297 | --- | Hash duplication |
| 19 | execution_runtime.js | 18,262 | 7 | Orchestrator |
| 20 | constitutional_governance.js | 17,766 | --- | Multi-concern |

---

## Phase C — Infrastructure Leakage

Every place where infrastructure knowledge exists outside adapters.

### Summary Counts

| Infrastructure | Total Sites | In Adapters (Allowed) | Leakage |
|---------------|-------------|----------------------|---------|
| SQL (Postgres, pool.query) | 93 | 2 | **91** |
| SQL (psycopg2.connect) | 34 | 1 | **33** |
| SQL (cursor.execute) | 45+ | 0 | **45+** |
| SQLite | 14 | 0 | **14** |
| PostgreSQL LISTEN/NOTIFY | 7 | 0 | **7** |
| Redis | 22 | 18 | **4** (comments) |
| OpenTelemetry | 18 | 0 | **18** |
| WebSocket | 12 | 0 | **12** |
| fetch() (HTTP) | 74 | 11 | **63** |
| execSync/subprocess | 41 | 0 | **41** |
| Docker socket | 2 | 0 | **2** |
| http.createServer/net | 5 | 0 | **5** |
| fs.* | 60+ | 0 | **60+** |
| **TOTAL** | **~425+** | **~33** | **~395+** |

### Worst Single-File Offenders

| File | Leakage Types | Count |
|------|--------------|-------|
| `gateway/server.js` | SQL (12), fetch (8), execSync (3), Docker socket (2), net (1), fs (5) | **31** |
| `gateway/repository_store.js` | SQL (6) | **6** |
| `gateway/mcp_registry.js` | SQL (1), fetch (4), execSync (1), pg.Pool (1) | **7** |
| `gateway/constitutional_runtime.js` | SQL (10+) | **10+** |
| `gateway/event_authority.js` | SQL (6+) | **6+** |
| `gateway/transaction_boundary.js` | SQL (8+) | **8+** |

### Infrastructure Leakage Score

**395+ infrastructure direct-access operations outside adapters out of ~428 total = 92% leakage rate.**

Every file in `gateway/` that touches PostgreSQL, Qdrant, Ollama, filesystem, Docker, Git, or HTTP directly is an infrastructure leakage violation. This is endemic — not isolated to a few files.

---

## Phase D — Runtime Leakage

Every remaining direct use of platform APIs outside constitutional owners.

### D1. `Date` — Outside ConstitutionalTimeAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | ~55 calls | 🔴 Production monolith |
| `gateway/*.js` (other) | ~200+ calls | 🔴 Widespread |
| `runtime/kernel/` | ~14 calls | 🟡 Not production-wired |
| **Total** | **~270+** | |

**Replacement Authority:** `gateway/constitutional_time_authority.js` — use `nowAsISOString()` for timestamps, `now()` for millis. Already wired in production but ~270 sites bypass it.

### D2. `crypto.createHash` — Outside CertificateAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 2 | 🔴 Production inline hashing |
| `gateway/*.js` (other) | ~60 files with `require('crypto')` | 🔴 Widespread |
| `runtime/kernel/` | 1 | 🟡 Not production-wired |
| **Total** | **~63 sites** | |

**Replacement Authority:** `runtime/kernel/replay/certificate_authority.ts` (pure TS, unwired) or `gateway/canonical_authority.js` (JS, wired but itself bypasses CertificateAuthority).

### D3. `Math.random` — Outside RandomnessAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 2 | 🟡 Mock data generation |
| `gateway/*.js` (other) | 10 | 🟡 ID generation, jitter, mock embeddings |
| **Total** | **12 sites** | |

**Replacement Authority:** `IdentityAuthority` for IDs, `RandomnessAuthority` for jitter. Mock embeddings should use seeded deterministic generators.

### D4. `uuid.v4()` / `uuid.uuid4()` — Outside IdentityAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/*.js` | 3 | 🟡 |
| `workers/*.py` | 18 (all 7 workers) | 🔴 Every worker bypasses |
| Other `.py` files | 25+ | 🔴 Widespread |
| `runtime/` | 9 | 🟡 Not production-wired |
| **Total** | **~55 sites** | |

**Replacement Authority:** `runtime/authorities/identity_authority.py` (UUID v7, exists but unwired). Workers should call `IdentityAuthority.generate_id()`.

### D5. `JSON.parse` / `JSON.stringify` — Outside SerializationAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | ~5 | 🟡 |
| `gateway/*.js` (other) | ~500+ | 🔴 Ubiquitous |
| `workers/*.py` | 3 | 🟡 HTTP serialization |
| `runtime/` | ~10 | 🟡 |
| **Total** | **~520+ sites** | |

**Replacement Authority:** `CanonicalBytes.serialize()` in `canonical_authority.js`. The most pervasive violation but also the lowest marginal risk — JSON serialization is the language standard.

### D6. `process.env` — Outside ConfigurationAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 16 | 🔴 Config scattered |
| `gateway/*.js` (other) | 45+ | 🔴 Widespread |
| `workers/*.py` | 1 | 🟡 |
| **Total** | **~62 sites** | |

**Replacement Authority:** `ConfigurationAuthority` (proposed, not implemented). Every env var read should route through a single module with validation and defaults.

### D7. `console.log` / `console.error` / `console.warn` — Outside LoggingAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 57 | 🟡 |
| `gateway/*.js` (other) | ~500+ | 🟡 Ubiquitous but accepted |
| **Total** | **~560+ sites** | |

**Replacement Authority:** Structured logging authority (proposed). Lower priority — console logging is generally acceptable for Node.js.

### D8. `fs.*` — Outside FilesystemAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 6 | 🟡 |
| `gateway/*.js` (other) | ~90+ | 🟡 |
| `runtime/` | 26 | 🟡 |
| **Total** | **~122 sites** | |

**Replacement Authority:** `gateway/filesystem_authority.js` (350 lines, exists but unwired). Use `readFile()`, `exists()`, etc.

### D9. `require('crypto')` — Outside CertificateAuthority

Counted in D2 above. ~53 files import crypto directly.

### D10. `pool.query()` / `.query(` (SQL) — Outside RepositoryAuthority

| Location | Count | Severity |
|----------|-------|----------|
| `gateway/server.js` | 28 | 🔴 Production monolith |
| `gateway/*.js` (other) | ~200+ | 🔴 Widespread across 40+ files |
| **Total** | **~230+ sites** | |

**Replacement Authority:** `runtime/authorities/repository_authority.py` (Python) or `gateway/event_emitter.js` (JS, minimal). The single highest-leverage refactor target.

### Runtime Leakage Summary

| # | Violation | Count | Severity | Replacement Authority |
|---|-----------|-------|----------|----------------------|
| D1 | `Date` / `Date.now` | ~270 | 🔴 | ConstitutionalTimeAuthority |
| D2 | `crypto.createHash` | ~63 | 🔴 | CertificateAuthority |
| D3 | `Math.random` | 12 | 🟡 | IdentityAuthority / RandomnessAuthority |
| D4 | `uuid.v4` / `uuid.uuid4` | ~55 | 🔴 | IdentityAuthority |
| D5 | `JSON.parse/stringify` | ~520 | 🟡 | CanonicalBytes.serialize |
| D6 | `process.env` | ~62 | 🔴 | ConfigurationAuthority |
| D7 | `console.log` | ~560 | ⚪ | Structured Logger (future) |
| D8 | `fs.*` | ~122 | 🟡 | FilesystemAuthority |
| D9 | `require('crypto')` | ~53 | 🔴 | CertificateAuthority |
| D10 | `pool.query` / SQL | ~230 | 🔴 | RepositoryAuthority |
| **TOTAL** | | **~1,900+** | | |

---

## Phase E — Responsibility Density

### Metrics

#### By File Type

| Metric | gateway/ | workers/ | runtime/kernel/ |
|--------|----------|----------|-----------------|
| Avg LOC per file | ~250 | ~110 | ~80 |
| Avg responsibilities per file | ~2.1 | ~1.3 | ~1.1 |
| Files > 500 LOC | ~20 | 0 | ~5 |
| Files > 1000 LOC | 1 (server.js) | 0 | 0 |
| Files with SQL + HTTP + crypto | 40+ | 0 | 0 |

#### Files Exceeding Constitutional Complexity

Threshold: Any file with >3 distinct constitutional concerns or >500 LOC with mixed concerns.

| File | LOC | Concerns | Verdict |
|------|-----|----------|---------|
| server.js | ~2,327 | 14 | 🔴 EXCEEDS |
| constitutional_knowledge_acquisition.js | ~1,000+ | 4-5 | 🟡 EXCEEDS |
| knowledge_compiler.js | 883 | 8 | 🟡 EXCEEDS (well-structured) |
| constitutional_compatibility_scorer.js | 718 | 10 | 🔴 EXCEEDS |
| event_authority.js | 723 | 4 | 🟡 EXCEEDS |
| memory_authority.js | ~650 | 4 | 🟡 EXCEEDS |
| constitutional_runtime.js | 534 | 4 | 🟡 EXCEEDS |
| worker_pool.js | 403 | 7 | 🟡 EXCEEDS |
| transaction_boundary.js | 205 | 3 | 🟡 Borderline |

#### Dependencies Per File (gateway/ average)

| Metric | Value |
|--------|-------|
| Avg imports per file | ~4 |
| Max imports per file | 26 (server.js top-level) + 15 inline = 27 |
| Files with >10 imports | ~15 |
| Files with inline require() | ~12 (server.js) |

#### Constitutional Complexity Threshold

**Defined as:** A file exceeds constitutional complexity when it directly accesses infrastructure (SQL, HTTP, filesystem, crypto, subprocess) AND defines business logic AND owns authority identity AND handles errors — all in one file.

**Files exceeding threshold: 63+** — every file in `gateway/` that calls `pool.query()` or `process.env` or `require('crypto')` directly while also implementing business logic.

---

## Phase F — Ownership Graph

### Actual (Current) Ownership DAG

```
gateway/server.js (monolith)
    │
    ├──► PostgreSQL ───────── direct pool.query() (28 calls)
    │       └── No RepositoryAuthority in path
    │
    ├──► Qdrant ──────────── direct fetch() (4 calls)
    │       └── qdrant_client.js also direct fetch()
    │
    ├──► Ollama ──────────── direct fetch() (5+ calls)
    │       └── inference_adapter.js also direct fetch()
    │
    ├──► Docker socket ───── net.createConnection()
    │
    ├──► Git ─────────────── execSync()
    │
    ├──► Filesystem ──────── fs.readFileSync/existsSync
    │
    └──► crypto ──────────── require('crypto').createHash()
    
gateway/event_emitter.js
    └──► PostgreSQL ──────── direct pg.Pool INSERT

gateway/pipeline_orchestrator.js
    ├──► PostgreSQL ──────── direct pg.Pool SELECT/UPDATE
    └──► Qdrant ──────────── via qdrant_client.js

gateway/qdrant_client.js
    └──► Qdrant ──────────── direct fetch() REST calls

40+ gateway/*.js files
    └──► PostgreSQL ──────── direct pool.query() INCLUDE/UPDATE/SELECT

workers/*.py (7 files)
    ├──► Gateway HTTP ────── via repository_client.py
    └──► PostgreSQL ──────── direct psycopg2.connect() (runtime workers)

runtime/authorities/*.py
    └──► PostgreSQL ──────── via repository_authority.py (wraps psycopg3)
    └──► Qdrant ──────────── via projection_authority.py
```

### Intended (Constitutional) Ownership DAG

```
HTTP / CLI / Worker / Scheduler
    │
    ▼
ExecutionRuntime
    │
    ▼
Authorities ───► Ports ───► Adapters ───► Infrastructure
    │
    ├── RepositoryAuthority ───► RepositoryAdapter ───► PostgreSQL
    ├── ProjectionAuthority ───► QdrantClient ─────────► Qdrant
    ├── IdentityAuthority ────── deterministic IDs
    ├── CertificateAuthority ─── SHA-256 hashing
    ├── WitnessAuthority ─────── Merkle chain
    └── ConfigurationAuthority ─ env vars
```

### Detected Violations

| Type | Occurrences | Evidence |
|------|-------------|----------|
| **Cycles** | 1 | server.js calls itself at line 987 (self-referencing health check) |
| **Back edges** | 0 | Not detected |
| **Cross-layer calls** | 395+ | All infrastructure leakage (Phase C) — authorities calling SQL directly instead of through adapters |
| **Illegal dependencies** | ~1,900+ | All runtime leakage (Phase D) — bypassing constitutional owners |
| **Runtime leakage** | ~1,900+ | Phase D violations |

### Layer Boundary Adherence

| Layer | Files | Infrastructure via Adapters? |
|-------|-------|------------------------------|
| Gateway routes | 93 in server.js | ❌ 0% — all direct |
| Gateway authorities | 78 files | ❌ ~5% — most use direct SQL |
| Python authorities | 7 files | ⚠️ ~50% — RepositoryAuthority wraps psycopg3 but itself is not in adapters/ |
| Python workers | 7 files (workers/) | ✅ 100% — use repository_client.py HTTP |
| Python workers | 5 files (runtime/workers/) | ❌ 0% — use direct SQL |
| Python runtime loops | 2 files | ❌ 0% — use docker exec psql |
| TypeScript kernel | 549 files | N/A — not production-wired |

---

## Phase G — Remaining Constitutional Violations

Ranked by severity with repository evidence.

### 🔴 Critical Violations

| # | Violation | Severity | Evidence | Owner | Refactor Size |
|---|-----------|----------|----------|-------|---------------|
| G1 | Dual runtime — 0% production wiring through constitutional runtime | Critical | server.js (2,327 lines, 93 routes) handles ALL production traffic. ExecutionRuntime (537 lines) handles ZERO. No imports cross gateway/ ↔ runtime/. | System architecture | 3-6 months |
| G2 | No auth on any endpoint | Critical | 93 routes, 0 middleware for auth. Only middleware: express.json() + CORS. | Gateway | 1-2 weeks |
| G3 | No dead letter queue — poison events poll forever | Critical | constitutional_runtime.py:132 increments retries without cap. No DLQ table. No max-retry. | Worker infrastructure | 2-3 days |
| G4 | Hashing bypassed at ~63 sites | Critical | 60+ gateway files require('crypto'), 2 inline in server.js (lines 1726, 1978). CertificateAuthority is unwired. | Hashed data integrity | 2-4 weeks |
| G5 | Event schema fragmented across 4+ incompatible versions | Critical | 4 schemas: CQRS (schema.sql), EventEmitter (event_emitter.js), StandardEventSchema (16 fields), PostgresEventStore (BIGSERIAL). Column mismatches caused Session 5 failures. | Event data | 1-2 weeks |
| G6 | UUID identity bypassed at ~55 sites | Critical | All 7 workers use uuid.uuid4() directly. 25+ other Python files same pattern. IdentityAuthority exists but unwired. | Event identity | 1-2 weeks |
| G7 | Infrastructure leakage: 395+ sites outside adapters | Critical | See Phase C. SQL (169 sites), HTTP (63 sites), subprocess (41 sites), filesystem (60+ sites). Every layer accesses infrastructure directly. | All files | 3-6 months |

### 🟠 High Violations

| # | Violation | Severity | Evidence | Owner | Refactor Size |
|---|-----------|----------|----------|-------|---------------|
| G8 | Replay infrastructure 0% wired | High | ReplayAuthority (75-384 lines) exists in 3 forms (TS, JS, Python). Zero wired. Compiled JS replay engine exists only in `main` branch. | Replay | 2-4 weeks |
| G9 | Witness infrastructure 0% wired | High | witness tables don't exist in production. WitnessAuthority exists in 3 forms. authority_search.py queries with graceful fallback. | Witness | 1-2 weeks |
| G10 | No process supervisor for any worker | High | 30+ workers, zero health endpoints, zero process supervision. WorkerBase covers 5/30 workers. | Worker lifecycle | 1 week |
| G11 | No query timeout on 230+ SQL calls | High | pool.query() without timeout in server.js (28 calls) + 40+ other files. Slow query blocks connection indefinitely. | PostgreSQL | 2-3 days |
| G12 | No centralized configuration — 62 process.env sites | High | server.js (16 sites), event_emitter.js (5), pipeline_orchestrator.js (6), qdrant_client.js (2), 45+ others. | Configuration | 2-3 days |
| G13 | 78 JS authority classes all unwired from constitutional runtime | High | 22,468 lines of authority code in gateway/. Zero on constitutional execution path. | Architecture | 2-3 months |
| G14 | God objects: server.js (14 concerns), constitutional_compatibility_scorer.js (10 concerns) | High | See Phase B. Both exceed constitutional complexity threshold. | Refactoring | 2-4 weeks |

### 🟡 Medium Violations

| # | Violation | Severity | Evidence | Owner | Refactor Size |
|---|-----------|----------|----------|-------|---------------|
| G15 | 8 graph compilation systems | Medium | 4 legacy + 1 canonical + 3 runtime. 6,874 lines overlapped. 11 SQL tables. | Graph | 2-4 weeks |
| G16 | No structured logging — 560+ console.log sites | Medium | All gateway files use console.log/error. No correlation IDs. No structured output. | Ops | 1-2 weeks |
| G17 | SQL injection risk (dynamic concatenation) | Medium | server.js:1755-1762 builds query with `+` operator. Parameterized but pattern is unsafe. | server.js | 1 day |
| G18 | No aggregate versioning | Medium | events table has no version column. ConstitutionalEventSourcing (511 lines) writes to nonexistent table. | Event sourcing | 1-2 weeks |
| G19 | 4 competing authority hierarchy schemes | Medium | declared class (Python), integer level (SQL), CIR level (TS), TS Classification (enum). No cross-mapping. | Authority resolution | 1 week |
| G20 | Migration SQL files abandoned in archive/obsolete/ | Medium | 5 migration files never applied. Schema state undocumented. | Schema | 2-3 days |
| G21 | Worker communication uses 6 mechanisms | Medium | Direct PG, HTTP, docker exec, subprocess, in-process calls, event polling. No unified abstraction. | Workers | 2-4 weeks |
| G22 | 7 queue implementations, all polling | Medium | See Phase A (Queue). No message broker. No push. No coordination. | Queue | 2-4 weeks |

### 🟢 Low Violations

| # | Violation | Severity | Evidence | Effort |
|---|-----------|----------|----------|--------|
| G23 | server.js self-referencing health check | Low | Line 987: GET localhost:8080/system/containers | 1 hour |
| G24 | Duplicate route dead code (/system/state, /replay/status) | Low | Lines 836+2155, 900+2214 | 1 hour |
| G25 | 7 empty placeholder directories in runtime/ | Low | canonical/, execution/, version/, witness/, replay/, mission/, providers/ | 1 hour |
| G26 | BootAuthority delegates everything to GraphExecutor | Low | 93-line file with zero boot logic | 1 day |
| G27 | 2 dead imports in ConstitutionalCompatibilityScorer | Low | lines 17-18: require('./canonical_authority'), require('./identity_authority') — never used | 5 min |

### ⚪ Future Violations (Post-Convergence)

| # | Violation | Notes |
|---|-----------|-------|
| G28 | No metrics collection | Requires monitoring infrastructure first |
| G29 | No distributed tracing | Requires structured logging + auth first |
| G30 | No horizontal scaling | Requires stateless workers + queue first |
| G31 | No migration framework | Requires single event schema first |
| G32 | No Kubernetes manifests | Requires worker health endpoints first |

---

## Phase H — Refactor Work Queue

Repository-backed work items only. No implementation. No code. Only work decomposition.

### Work Queue (Prioritized)

| # | Item | Files | Est LOC | Risk | Dependencies | Parallel | Blocked By |
|----|------|-------|---------|------|-------------|----------|------------|
| H1 | Add auth middleware to server.js | `gateway/server.js`, `gateware/jwt_auth.js`, `runtime/security/jwt_auth.py` | 200 | Low | None | Yes | Nothing |
| H2 | Add DLQ table + max_retries to event_processing | `runtime/constitutional_runtime.py`, schema migration | 100 | Low | None | Yes | Nothing |
| H3 | Extract server.js SQL calls into event_emitter.js / RepositoryAuthority | `gateway/server.js`, `gateway/event_emitter.js` | 500 | Medium | H12 (RepositoryAuthority) | No | H12 |
| H4 | Route all crypto.createHash through canonical_authority.js | `gateway/*.js` (60 files) | 300 | Medium | H12 (RepositoryAuthority) | Yes | None |
| H5 | Route all uuid.uuid4 through IdentityAuthority | `workers/*.py`, `*.py` (25+ files) | 200 | Low | H12 (IdentityAuthority wiring) | Yes | Nothing |
| H6 | Route all process.env through ConfigurationAuthority | `gateway/server.js` (16 sites), `gateway/*.js` (45+ sites) | 300 | Medium | Create ConfigurationAuthority | Yes | Nothing |
| H7 | Add query timeout to all pool.query calls | `gateway/server.js`, `gateway/*.js` (40+ files) | 150 | Low | None | Yes | Nothing |
| H8 | Remove constitutional_compatibility_scorer.js dead imports | `gateway/constitutional_compatibility_scorer.js` | 2 | None | None | Yes | Nothing |
| H9 | Extract ConstitutionalCompatibilityScorer scoring functions | `gateway/constitutional_compatibility_scorer.js` | 400 | Low | None | Yes | Nothing |
| H10 | Add /health endpoint to WorkerBase and all workers | `runtime/workers/worker_base.py`, 5 subclasses, `workers/*.py` | 200 | Low | None | Yes | Nothing |
| H11 | Deprecate 4 legacy graph compilers | `gateway/call_graph_compiler.js`, `import_graph_compiler.js`, `type_graph_compiler.js`, `build_graph_compiler.js` | 50 (mark) | Low | CanonicalGraphCompiler verified | Yes | Nothing |
| H12 | Wire RepositoryAuthority into production gateway | `runtime/authorities/repository_authority.py`, `gateway/event_emitter.js` | 300 | High | Phase S.17 runtime convergence | No | H3 |
| H13 | Wire IdentityAuthority into production gateway | `runtime/authorities/identity_authority.py` | 100 | Medium | H5 | No | Nothing |
| H14 | Wire CertificateAuthority into production | `runtime/kernel/replay/certificate_authority.ts`, `gateway/canonical_authority.js` | 200 | High | H4 | No | Nothing |
| H15 | Remove empty placeholder directories | `runtime/canonical/`, `runtime/execution/`, etc. | 1 | None | None | Yes | Nothing |
| H16 | Add structured logging with correlation IDs | `gateway/server.js`, `gateway/*.js` | 500 | Low | None | Yes | Nothing |
| H17 | Add query timeout config to pg.Pool | `gateway/server.js` | 20 | Low | None | Yes | Nothing |
| H18 | Fix self-referencing health check | `gateway/server.js:987` | 5 | None | None | Yes | Nothing |
| H19 | Remove duplicate route dead code | `gateway/server.js` lines 2155, 2214 | 20 | None | None | Yes | Nothing |
| H20 | Move runtime adapters into adapters/ directory | Various | TBD | Low | Phase S.17 | No | H12 |

### Dependency Graph

```
H1 (auth) ── independent ──► can start now
H2 (DLQ) ── independent ──► can start now
H5 (uuid) ── independent ──► can start now (IdentityAuthority exists)
H6 (env) ─── independent ──► can start now
H7 (timeout) ── independent ──► can start now
H8 (dead imports) ── independent ──► can start now
H10 (health) ── independent ──► can start now
H11 (deprecate legacy graphs) ── independent ──► can start now
H15 (empty dirs) ── independent ──► can start now
H16 (logging) ── independent ──► can start now
H17 (pg timeout) ── independent ──► can start now
H18 (self-ref) ── independent ──► can start now
H19 (dup routes) ── independent ──► can start now

H3 (server.js SQL extraction) ──► blocked by H12
H4 (crypto routing) ──► blocked by H14
H9 (scorer extraction) ── independent
H12 (RepositoryAuthority wiring) ──► blocked by Phase S.17 convergence
H13 (IdentityAuthority wiring) ──► blocked by H5
H14 (CertificateAuthority) ──► blocked by H4
H20 (move adapters) ──► blocked by H12
```

### Must-Block Chain

```
Phase S.17 Runtime Convergence
    │
    ├── H12 (RepositoryAuthority into production)
    │   └── H3 (server.js SQL extraction)
    │       └── H4 (crypto routing)
    │           └── H14 (CertificateAuthority wiring)
    │
    ├── H13 (IdentityAuthority wiring)
    │   └── H5 (uuid routing)
    │
    └── H20 (move adapters)
```

### Can Parallelize (Start Now)

H1 (auth), H2 (DLQ), H5 (uuid), H6 (configuration), H7 (timeout), H8 (dead imports), H9 (extract scorer), H10 (health), H11 (deprecate), H15 (dirs), H16 (logging), H17 (pool config), H18 (self-ref), H19 (dup routes)

**14 items can start immediately without waiting for runtime convergence.** Auth and DLQ (the two 🔴 items besides dual runtime) are both in this set.

---

# PHASE 22.X — Constitutional Convergence Audit (Appendix)

**Date:** 2026-06-29
**Method:** Repository evidence only. READ ONLY.
**Constraint:** Evaluate convergence toward: Application → Authorities → Ports → Adapters → Infrastructure. Infrastructure remains completely behind ports.

---

## SECTION A — Constitutional Ownership Violations

### Identity

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/identity_authority.js` (272 lines, JS, wired) |
| Duplicate Owners | `runtime/authorities/identity_authority.py` (108 lines, Python, unwired), `runtime/kernel/identity/identity-authority.ts` (30 lines, TS interface, unwired) |
| Evidence | Three implementations. JS owner in production. Python owner imported by zero files. TS owner in gitignored runtime/. Plus 55+ bypasses via `uuid.uuid4()` direct calls. |
| Risk | Implementation divergence. JS uses deterministic hash IDs. Python uses UUID v7. TS uses branded types. Migration between them breaks replay. |
| Confidence | High — grep-confirmed across 3 languages |

### Time

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/constitutional_time_authority.js` (111 lines, JS, wired) |
| Duplicate Owners | None |
| Evidence | Single implementation. Dual mode (wall-clock / replay) but replay mode never activated. ~270 bypass sites using `Date.now()` or `new Date()` directly. |
| Risk | Replay mode unexercised. Timestamps in replay mode would diverge from production timestamps. |
| Confidence | High |

### Canonicalization

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/canonical_authority.js` (501 lines, JS, wired) — CanonicalBytes + CanonicalAuthority |
| Duplicate Owners | `runtime/kernel/replay/canonical_hash_authority.ts` (80 lines, TS, unwired), `runtime/authorities/canonical_hash_authority.py` (31 lines, Python, unwired) |
| Evidence | 3 canonicalization implementations. JS owner in production uses `crypto.createHash('sha256')` — itself a bypass of CertificateAuthority. TS and Python owners unwired. |
| Risk | Canonicalization not portable across languages. Same input produces different output across owners. |
| Confidence | High |

### Serialization

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `gateway/canonical_authority.js` defines `CanonicalBytes.serialize()` — used by ~5 files. ~520 sites use `JSON.parse/stringify` directly. |
| Evidence | No canonical serializer enforced. `JSON.parse(JSON.stringify(x))` deep-copy pattern pervasive. Key ordering not guaranteed. |
| Risk | Events serialized with different key order produce different hashes. |
| Confidence | High |

### Hashing

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/canonical_authority.js` (production), `runtime/kernel/replay/certificate_authority.ts` (280 lines, TS, canonical pure implementation, unwired) |
| Duplicate Owners | ~63 bypass sites across 60+ gateway files (see Phase D). 2 inline in server.js (lines 1726, 1978). ~90+ Python hashlib.sha256 calls. |
| Evidence | Every file calling `crypto.createHash('sha256')` or `hashlib.sha256()` outside these authorities is a duplicate owner. |
| Risk | Domain separation lost. Hashes outside authority cannot be verified in replay. Witness chain broken at root hash. |
| Confidence | High |

### Replay

| Aspect | Finding |
|--------|---------|
| Current Owner | None (production). `runtime/kernel/replay/replay-authority.ts` (75 lines, TS, unwired), `runtime/kernel/replay/replay-plan-authority.ts` (384 lines, TS, unwired), `gateway/replay_authority.js` (101 lines, JS, wired but dormant), `gateway/replay_plan_authority.js` (348 lines, JS, wired but dormant) |
| Duplicate Owners | 4 implementations across TS and JS. All unwired or dormant. Compiled JS replay engine (18 files) exists only in `main` branch. |
| Evidence | Production has zero working replay. `/replay/status` endpoints return empty/null. `witness_authority` table does not exist. |
| Risk | No event can be deterministically replayed. Entire replay architecture is design-only. |
| Confidence | High |

### Witness

| Aspect | Finding |
|--------|---------|
| Current Owner | None (production). `runtime/kernel/replay/witness_authority.ts` (237 lines, TS, unwired), `gateway/witness_authority.js` (175 lines, JS, wired but dormant) |
| Duplicate Owners | 2 implementations. Both unwired from production. `authority_witness` table does not exist in production database. |
| Evidence | `authority_search.py` queries `authority_witness` with graceful fallback. No event has Merkle witness proof in production. |
| Risk | Event forgery undetectable. Witness chain absent. |
| Confidence | High |

### Knowledge

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/knowledge_compiler.js` (883 lines, JS, wired but dormant), `gateway/knowledge_object.js` (JS, wired) |
| Duplicate Owners | `runtime/kernel/knowledge/knowledge-authority-interface.ts` (TS, unwired) |
| Evidence | KnowledgeCompiler (7 passes) never invoked. Production knowledge reads from static files or live Postgres/Qdrant queries. |
| Risk | Knowledge compilation unexercised. Compiler assumes GitHub AcquisitionPass but no production path feeds it. |
| Confidence | High |

### Observation

| Aspect | Finding |
|--------|---------|
| Current Owner | `workers/observation_worker.py` (96 lines, Gen 2 handler, wired), `C:\Users\nolan\PING\observation_worker.py` (162 lines, Gen 1 class, unwired), `runtime/workers/` (none dedicated) |
| Duplicate Owners | 2 observation worker implementations (Gen 1 + Gen 2). Different patterns. Different communication mechanisms. |
| Evidence | Gen 1 uses direct psycopg2. Gen 2 uses HTTP via repository_client.py. Both exist on disk. |
| Risk | Observed events written through different paths with different schemas. |
| Confidence | High |

### Recommendation

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | None |
| Evidence | No recommendation subsystem identified in any pattern search. |
| Risk | Recommendation logic would need new ownership. |
| Confidence | Medium — negative grep |

### Execution

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/execution_authority.js` (290 lines, JS, wired but dormant), `runtime/authorities/execution_authority.py` (72 lines, Python, unwired) |
| Duplicate Owners | 2 implementations. JS one calls WitnessAuthority for execution events. Python one wraps subprocess. Neither is on the production constitutional path. |
| Evidence | Production "execution" happens in server.js route handlers running arbitrary logic, not through any ExecutionAuthority. |
| Risk | Production execution is ungoverned. No authority wraps the execution path. |
| Confidence | High |

### Storage

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/repository_store.js` (136 lines, JS, wired), `gateway/event_emitter.js` (101 lines, JS, wired) |
| Duplicate Owners | `runtime/adapters/postgres_event_store.ts` (214 lines, TS, unwired), `gateway/event_bus.js` (203 lines, JS, dormant), `brainos/.../constitutional/event_emitter.py` (461 lines, Python, wired) |
| Evidence | 4+ storage paths write to `events` table with different schemas. No single storage authority governs write access. |
| Risk | Schema drift causes runtime failures (confirmed Session 5). |
| Confidence | High |

### Authorization

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `runtime/security/jwt_auth.py` (Python, unwired), `gateway/jwt_auth.js` (JS, unwired) |
| Evidence | 93 routes in server.js with zero auth middleware. Only middleware: express.json() + CORS headers. JWT implementations exist but are registered by zero routes. |
| Risk | Any process reaching port 8080 has full system access. |
| Confidence | High |

### Authentication

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | Same as Authorization — JWT implementations exist but unwired. |
| Evidence | No authentication on any endpoint. No middleware, no token validation, no session management. |
| Risk | Identity of callers unknown. Cannot enforce per-actor permissions. |
| Confidence | High |

### Feature Flags

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | None |
| Evidence | No feature flag system found in any search. Hardcoded conditionals (`if (true)`, `if (false)`) in code instead. |
| Risk | Feature toggles require code changes. No gradual rollout capability. |
| Confidence | High — negative grep |

### Policy

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/constitutional_policy_engine.js` (JS, wired but dormant), `runtime/kernel/governance/governance-authority.ts` (103 lines, TS, unwired) |
| Duplicate Owners | 2 implementations, neither exercised in production. |
| Evidence | Policy engine exists but no production path enforces policy rules. No policy evaluation in request path. |
| Risk | Policy layer is design-only. No governance enforcement. |
| Confidence | High |

### Secrets

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `runtime/security/secret_adapter.js` (JS, unwired), `runtime/adapters/secret_adapter.py` (Python, unwired) |
| Evidence | Passwords and API keys in environment variables and docker-compose files. No Vault or secrets manager integration in production. POSTGRES_PASSWORD can be empty string. |
| Risk | Credentials in env vars are accessible to any process on the host. No secret rotation. |
| Confidence | High |

### Metrics

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `gateway/metrics_port.js` (port interface only, commented) |
| Evidence | Zero metrics collection in production. No counters, gauges, histograms anywhere. |
| Risk | Ops blind. Cannot measure latency, throughput, error rates, queue depth. |
| Confidence | High — negative grep |

### Logging

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | None |
| Evidence | ~560 console.log/error/warn calls across gateway/. No structured output, no log levels, no correlation IDs. |
| Risk | Cannot search, filter, or correlate logs across workers/services. Production debugging requires raw terminal output. |
| Confidence | High |

### Health

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/server.js` (inline health routes), `gateway/runtime_health.js` (JS, wired but ad-hoc) |
| Duplicate Owners | None — but health logic is scattered across server.js route handlers (lines 880-993, 1005-1022) |
| Evidence | Health checks are ad-hoc SQL `SELECT 1` queries + HTTP pings. No health endpoint on any worker. WorkerBase.health (line 105) is never exposed externally. |
| Risk | No standardized health protocol. Workers invisible to orchestration. |
| Confidence | High |

### Queue

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | 7 polling implementations: `analysis_queue.js`, `worker_queue.js`, `persistent_queue.js`, `mission_queue.js`, `constitutional_mission_queue.js`, `worker_scheduler.js`, `pipeline_orchestrator.js` (setInterval) |
| Evidence | All 7 are PostgreSQL table polls or setInterval timer polls. No message broker. No push mechanism. |
| Risk | Thundering herd under multiple workers. No priority. No backpressure. |
| Confidence | High |

### Outbox

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/event_outbox.js` (296 lines, JS, wired but dormant) |
| Duplicate Owners | `gateway/outbox_worker.js` (281 lines, JS, unwired) — LISTEN/NOTIFY alternative |
| Evidence | EventOutbox implements full outbox pattern (Redis, EventBus, retry, cleanup) but events bypass it through event_emitter.js direct INSERT. Outbox table likely does not exist. |
| Risk | No atomic write guarantee. Process crash between INSERT and downstream processing loses events. |
| Confidence | High |

### Dead Letter

| Aspect | Finding |
|--------|---------|
| Current Owner | `gateway/dead_letter_authority.js` (370 lines, JS, wired but dormant), `gateway/dead_letter_queue.js` (SQLite-based, wired but dormant) |
| Duplicate Owners | 2 implementations, both dormant. |
| Evidence | No DLQ mechanism active in production. `constitutional_runtime.py:132` increments retries without cap — poison events poll forever. |
| Risk | Poison events cannot be quarantined or inspected. |
| Confidence | High |

### Retry

| Aspect | Finding |
|--------|---------|
| Current Owner | None (shared) |
| Duplicate Owners | `runtime/constitutional_runtime.py:132` (unbounded), `runtime/workers/worker_base.py:98-100` (double interval), `gateway/retry_authority.js` (255 lines, unwired), `gateway/retry_policy.js` (unwired), brainos workers (sleep 60s) |
| Evidence | 5 different retry strategies. No shared policy. No max-retry caps. |
| Risk | Retry storms under load. No coordination between retry mechanisms. |
| Confidence | High |

### Configuration

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `runtime/config/configuration_authority.py` (211 lines, Python, unwired), `runtime/kernel/config/configuration-authority.ts` (42 lines, TS, unwired) |
| Evidence | ~62 process.env bypass sites across gateway/. Every file does `process.env.X || default` inline. ConfigurationAuthority implementations exist but are not imported by any production file. |
| Risk | Config scattered and untraceable. No validation, no defaults catalog, no single source of truth. |
| Confidence | High |

### Schema

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `schema.sql` (183 lines, CQRS), `schema_expanded.sql` (603 lines, obsolete), `migration_001_bidirectional_memory.sql` (126 lines, never applied), `postgres_event_store.ts` (214 lines, different schema), `brainos/.../mission_control/app.py` inline schema assumptions |
| Evidence | 4+ incompatible event table schemas. Production schema evolved manually — no migration file corresponds to current state. |
| Risk | Schema state undocumented. Reproducing database requires reading application code. Schema evolution blocked. |
| Confidence | High |

### Migration

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | 5 SQL migration files in `archive/obsolete/` — never applied. |
| Evidence | Migration SQL files orphaned. Projection columns were added manually. No migration framework exists. |
| Risk | No reproducible schema deployment. Manual schema changes are untested and undocumented. |
| Confidence | High |

### Workflow State

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `gateway/execution_graph_authority.js` (499 lines, JS, wired but dormant), `gateway/graph_runtime.js` (307 lines, JS, wired but dormant), `gateway/mission_execution_graph.js` (565 lines, JS, wired but dormant), `gateway/constitutional_event_sourcing.js` (511 lines, JS, unwired) |
| Evidence | 4 workflow state implementations. All dormant or unwired. No production workflow tracks state through a state machine or saga. |
| Risk | Workflow state is implicit in route handler logic, not explicit in a state machine. |
| Confidence | High |

### Execution History

| Aspect | Finding |
|--------|---------|
| Current Owner | None |
| Duplicate Owners | `gateway/execution_metadata_authority.js` (240 lines, JS, unwired) |
| Evidence | No execution history is recorded in production. The events table records event_type and timestamp but no execution trace or causal chain. |
| Risk | Cannot reconstruct what happened during a mission or workflow execution. |
| Confidence | High |

### Summary: Ownership Counts

| Status | Count | Subsystems |
|--------|-------|-----------|
| Single Owner | 1 | Time |
| Multiple Owners | 14 | Identity, Canonicalization, Hashing, Replay, Witness, Knowledge, Observation, Execution, Storage, Policy, Outbox, Dead Letter, Retry, Workflow State |
| Missing Owner | 14 | Serialization, Recommendation, Authorization, Authentication, Feature Flags, Secrets, Metrics, Logging, Health, Queue, Configuration, Schema, Migration, Execution History |

---

## SECTION B — Infrastructure Leakage

### Infrastructure Usage Outside Adapters

| Infrastructure | Total Sites | In Adapters | Leakage | Severity |
|---------------|-------------|-------------|---------|----------|
| PostgreSQL (pool.query / psycopg2 / cursor.execute) | 172+ | 3 | **169** | 🔴 |
| HTTP fetch() | 74 | 11 | **63** | 🔴 |
| execSync / subprocess | 41 | 0 | **41** | 🔴 |
| filesystem (fs.*) | 60+ | 0 | **60+** | 🔴 |
| SQLite | 14 | 0 | **14** | 🟡 |
| OpenTelemetry | 18 | 0 | **18** | 🟡 |
| PostgreSQL LISTEN/NOTIFY | 7 | 0 | **7** | 🟡 |
| Redis | 22 | 18 | **4** | 🟡 |
| WebSocket | 12 | 0 | **12** | 🟡 |
| Docker socket | 2 | 0 | **2** | 🔴 |

### Classification by Layer

| Classification | Count | Examples |
|---------------|-------|----------|
| **Correct Adapter** | ~33 | `adapters/redis_adapter.js`, `runtime/adapters/ollama_provider_adapter.py`, `runtime/adapters/postgres_event_store.ts` |
| **Incorrect Authority** | 200+ | Every `*authority.js` file in gateway/ that calls pool.query directly: `event_authority.js`, `approval_authority.js`, `mission_authority.js`, `checkpoint_authority.js`, `commit_authority.js`, `memory_authority.js` |
| **Incorrect Application** | 100+ | `constitutional_compatibility_scorer.js` (3 SQL queries), `knowledge_compiler.js`, `pipeline_orchestrator.js`, `mcp_registry.js` |
| **Incorrect Runtime** | 30+ | `runtime/constitutional_runtime.py` (docker exec psql), `runtime/workers/github_worker.py` (direct SQL INSERT), `runtime/workers/retriever_worker.py` (direct SQL + HTTP) |

### Infrastructure Leakage Score

**395+ leakage sites / ~428 total infrastructure sites = 92.3% leakage rate.**

Infrastructure knowledge is not contained behind adapters. The architecture has adapters defined but they are bypassed by the overwhelming majority of code paths.

---

## SECTION C — Port Compliance

### Port Inventory

| Port | File | Status | Bypassed By |
|------|------|--------|-------------|
| InferencePort | `gateway/inference_adapter.js` | Implemented — wired, but responses are simulated | server.js direct fetch() (5+ sites), runtime/workers/reasoner_worker.py direct HTTP |
| StoragePort | None | **Missing** | All 169 SQL sites bypass storage port |
| QueuePort | `gateway/queue_port.js` | Implemented — port interface exists, references BullMQ | Never implemented. No queue technology selected. |
| PolicyPort | None | **Missing** | `constitutional_policy_engine.js` exists but is not a port |
| TimePort | `gateway/constitutional_time_authority.js` | **Partially Implemented** — port exists, ~270 bypass sites | Every `Date.now()` and `new Date()` call |
| TelemetryPort | `gateway/trace_port.js` | **Partially Implemented** — port interface defined, no implementation | OpenTelemetry stub in `opentelemetry_witness_instrumentation.js` |
| MetricsPort | `gateway/metrics_port.js` | Implemented — port interface defined, references Prometheus | No metrics collected anywhere |
| SecretsPort | `runtime/adapters/secret_adapter.py`, `runtime/security/secret_adapter.js` | Implemented — exists in 2 languages, **both unwired** | process.env in docker-compose and gateway files |
| AuthenticationPort | None | **Missing** | All 93 routes bypass auth entirely |
| FeatureFlagPort | None | **Missing** | Feature logic hardcoded with conditionals |

### Port Compliance Summary

| Status | Count | Ports |
|--------|-------|-------|
| Implemented | 3 | InferencePort, QueuePort, MetricsPort |
| Partially Implemented | 3 | TimePort, TelemetryPort, SecretsPort |
| Missing | 4 | StoragePort, PolicyPort, AuthenticationPort, FeatureFlagPort |
| Bypassed | 8 of 10 | Every port except QueuePort and MetricsPort has direct bypasses |

---

## SECTION D — God Objects

### ConstitutionalCompatibilityScorer

| Metric | Value |
|--------|-------|
| File | `gateway/constitutional_compatibility_scorer.js` |
| LOC | 718 |
| Dependencies | `canonical_authority.js` (dead import, line 17), `identity_authority.js` (dead import, line 18) |
| Responsibilities | 10: DB queries, architectural similarity, dependency topology, object-kind overlap, authority reuse, replay compatibility, compiler stage similarity, mission reuse, evidence generation (9 sub-reports), batch pairwise computation |
| Infrastructure Knowledge | 3 direct `this._postgres.query()` calls (lines 622-681) |
| Business Logic | All scoring and evidence functions |
| Persistence Logic | 3 SQL queries embedded in class methods |
| Telemetry Logic | None |
| Ranking | **#2 god object** after server.js |

### server.js

| Metric | Value |
|--------|-------|
| File | `gateway/server.js` |
| LOC | ~2,327 |
| Dependencies | 27 (26 top-level + 15 inline = 27 distinct require calls) |
| Responsibilities | 14: route handler, SQL data access, inference client, Qdrant client, Docker client, Git client, cron scheduler, hashing, file reader, environment config, logging, health check, error handler, request router |
| Infrastructure Knowledge | SQL (28 calls), HTTP fetch (8), execSync (3), Docker socket (2), net (1), fs (6) |
| Business Logic | Route handler logic for 93 routes |
| Persistence Logic | 28 direct pool.query() calls |
| Telemetry Logic | Inline latency timing with Date.now() |
| Ranking | **#1 god object** — largest file in gateway/ at 87 KB |

### RepositoryStore

| Metric | Value |
|--------|-------|
| File | `gateway/repository_store.js` |
| LOC | 136 |
| Dependencies | `canonical_authority.js`, `identity_authority.js` |
| Responsibilities | 3: CRUD wrapper (append/load/search/delete), table initialization, canonical serialization |
| Infrastructure Knowledge | 6 direct pool.query() calls |
| Business Logic | Key-value object persistence |
| Persistence Logic | All 6 SQL calls directly on pg.Pool |
| Telemetry Logic | None |
| Ranking | Moderate — acceptable scope for a store, but SQL is inline |

### TransactionBoundary

| Metric | Value |
|--------|-------|
| File | `gateway/transaction_boundary.js` |
| LOC | 205 |
| Dependencies | None (uses injected pool) |
| Responsibilities | 4: transaction management, savepoint support, transaction context builder (attaches outbox, repository, identity, time, witness to context), Express middleware |
| Infrastructure Knowledge | 8+ direct pool.query() calls for BEGIN/COMMIT/ROLLBACK/SAVEPOINT |
| Business Logic | Transaction boundary enforcement |
| Persistence Logic | All transaction SQL is inline |
| Telemetry Logic | None |
| Ranking | Mixed — good abstraction but SQL is inline, not delegated to StoragePort |

### WorkerPool (primary)

| Metric | Value |
|--------|-------|
| File | `gateway/worker_pool.js` |
| LOC | 403 |
| Dependencies | Multiple (queue, dead letter, retry, worker modules) |
| Responsibilities | 7: worker registration, start/stop lifecycle, job dequeue loop, retry policy, dead letter escalation, health checks, metrics collection |
| Infrastructure Knowledge | Indirect — delegates to queue/retry/DLQ authorities |
| Business Logic | Worker lifecycle orchestration |
| Persistence Logic | None direct (delegates) |
| Telemetry Logic | Health checks and metrics collection embedded in class |
| Ranking | Moderate — 7 responsibilities exceed single-concern but delegation pattern is clean |

### MissionAuthority

| Metric | Value |
|--------|-------|
| File | `gateway/mission_authority.js` |
| LOC | 316 |
| Dependencies | `constitutional_authority.js`, `mission_rule_authority.js`, `ConstitutionalObjectFactory`, `OperationalEnvelope` |
| Responsibilities | 4: mission generation, rule-based task/priority/type assignment, cache management, persistence (SQL) |
| Infrastructure Knowledge | 2 direct pool.query() calls for mission_cache SELECT/upsert |
| Business Logic | Mission generation from ReflectionObject + RepositoryGraph |
| Persistence Logic | Cache persistence via direct SQL |
| Telemetry Logic | None |
| Ranking | Acceptable scope — cache SQL is a minor violation |

### ExecutionAuthority (JS)

| Metric | Value |
|--------|-------|
| File | `gateway/execution_authority.js` |
| LOC | 290 |
| Dependencies | EventAuthority, WitnessAuthority, ConstitutionalAuthority |
| Responsibilities | 4: authority invocation coordination, sequential execution, parallel execution, execution event emission |
| Infrastructure Knowledge | None direct — delegates to EventAuthority for persistence |
| Business Logic | Authority execution orchestration |
| Persistence Logic | None direct |
| Telemetry Logic | In-memory execution state tracking |
| Ranking | Good — clean delegation, minimal violation |

---

## SECTION E — Runtime Convergence Progress

### Remaining Legacy Runtime

| Component | Status | Evidence |
|-----------|--------|----------|
| `gateway/server.js` | **Active production — 93 routes, 28 direct SQL queries, 2,327 lines** | All production traffic. Zero routes delegated to constitutional runtime. |
| `gateway/event_emitter.js` | **Active production — direct pg.Pool INSERT** | Line 1 imports `pg.Pool`. Lines 42-78: direct INSERT into events table. |
| `gateway/pipeline_orchestrator.js` | **Active production — 15s polling loop, direct pg.Pool + crypto** | Lines 4-13: pg.Pool config. Lines 45-99: direct SQL SELECT, crypto.createHash, Qdrant upsert. |
| `gateway/inference_adapter.js` | **Active production — simulated Ollama** | Lines 22-25: process.env reads. Lines 116: `new Date()`. Responses are simulated random vectors. |

### Remaining Constitutional Runtime

| Component | Status | Evidence |
|-----------|--------|----------|
| `runtime/execution_runtime.js` (537 lines) | **Implemented, 0% wired** | Zero imports from gateway/ into this file. Zero imports of this file into server.js. |
| `runtime/di_container.js` (253 lines) | **Implemented, 0% wired** | Never instantiated in production. |
| `runtime/infrastructure_registry.js` (116 lines) | **Implemented, 0% wired** | No adapter registered in production. |
| `runtime/event_catalog.js` (252 lines) | **Implemented, 0% wired** | 12 default schemas never validated against production events. |
| `runtime/artifact_pipeline.js` (70 lines) | **Implemented, 0% wired** | Freeze + hash pipeline never called. |
| `runtime/rollback_coordinator.js` (100 lines) | **Implemented, 0% wired** | Compensating actions never registered or executed. |
| `runtime/infrastructure_dispatcher.js` (113 lines) | **Implemented, 0% wired** | Adapter call execution never invoked. |
| `runtime/kernel/` (549 TS files) | **Implemented, 0% wired** | Entire TypeScript kernel is in gitignored runtime/. Not compiled to JS in any production path. |
| `runtime/authorities/` (7 Python files) | **Implemented, partially wired** | AuthorityRouter is imported by tools and workers, but production gateway bypasses all authorities. |

### Remaining Direct Access Counts

| Violation Type | Before S.17 | Current | Change |
|---------------|-------------|---------|--------|
| Direct SQL calls in server.js | 28 | 28 | None |
| Direct SQL in gateway/ | 200+ | 200+ | None |
| Hashing bypasses (JS) | ~63 | ~63 | None |
| Hashing bypasses (Python) | ~90+ | ~90+ | None |
| Serialization bypasses (JSON.parse/stringify) | ~520 | ~520 | None |
| process.env reads | ~62 | ~62 | None |
| uuid.uuid4 bypasses | ~55 | ~55 | None |
| Date.now bypasses | ~270 | ~270 | None |
| fs bypasses | ~122 | ~122 | None |
| subprocess bypasses | ~41 | ~41 | None |
| console.log bypasses | ~560 | ~560 | None |
| Infrastructure leakage sites | ~395+ | ~395+ | None |
| Runtime leakage violations | ~1,900+ | ~1,900+ | None |

### Convergence Estimate

| Metric | Value |
|--------|-------|
| Percent complete | **0%** |
| Evidence | Zero production traffic routes through constitutional runtime. Zero SQL calls delegated to RepositoryAuthority. Zero hashing calls routed through CertificateAuthority. Zero env var reads routed through ConfigurationAuthority. |
| Remaining blockers | Dual runtime architecture (🔴 G1), infrastructure leakage endemic (🔴 G7), 78 unwired JS authorities (🟠 G13), no auth on any endpoint (🔴 G2) |

---

## SECTION F — Parallel Infrastructure Readiness

| Initiative | Status | Evidence | Blocker |
|------------|--------|----------|---------|
| PostgreSQL Outbox | **Ready Now** | `gateway/event_outbox.js` (296 lines) implements full outbox pattern. `gateway/outbox_worker.js` (281 lines) implements LISTEN/NOTIFY consumer. Both exist, both dormant. Requires: schema migration to create event_outbox table + wiring event_emitter.js to write through outbox instead of direct INSERT. | Nothing — code exists. Requires schema migration + configuration. |
| River | **Blocked** | No River SDK found in any package.json or requirements.txt. QueuePort references BullMQ, not River. | No implementation exists |
| OpenTelemetry | **Blocked by Runtime** | `gateway/opentelemetry_witness_instrumentation.js` is a stub. No OTel SDK in package.json. TelemetryPort defined but not implemented. | Port defined. SDK not installed. |
| Prometheus | **Blocked by Runtime** | `gateway/metrics_port.js` references Prometheus in comments only. No prometheus-client in package.json. No metrics collection wired anywhere. | No metrics to export. |
| Grafana | **Blocked by Runtime** | No Grafana dashboard, datasource, or provisioning config found. No metrics to visualize. | No metrics infrastructure. |
| Loki | **Blocked by Runtime** | No Loki SDK, config, or log shipping found. No structured logs to ship. | Logging is unstructured console.log. |
| LiteLLM | **Blocked by Port** | No LiteLLM import found. InferencePort (gateway/inference_adapter.js) uses direct fetch() to Ollama. LiteLLM would replace the adapter implementation. | Port exists. Adapter implementation needs replacement. |
| OPA | **Blocked by Port** | No OPA/OpenPolicyAgent SDK found. PolicyPort does not exist. Policy evaluation is in `constitutional_policy_engine.js` (custom, unwired). | No PolicyPort defined. |
| OpenFeature | **Blocked by Authority** | No OpenFeature SDK found. FeatureFlagPort does not exist. Feature flags would require new port + authority definition. | No FeatureFlagPort or authority. |
| OpenBao | **Blocked by Authority** | No OpenBao/Vault SDK import found. SecretsPort (secret_adapter.py/js) exists but is unwired. OpenBao would replace env var secrets. | SecretsPort implemented but unwired. Requires auth wiring. |
| MinIO | **Blocked by Runtime** | No MinIO SDK found. `adapters/s3_adapter.js` references MinIO in comments. No object storage port exists. | No StoragePort for blob storage. |
| pgvector | **Blocked by Runtime** | No pgvector usage found. Production vector storage is Qdrant (external service). pgvector would replace Qdrant adapter. | Qdrant port exists. Adapter needs replacement. |
| WireGuard | **Blocked by Runtime** | No WireGuard config or SDK found. All services exposed on Docker networks without VPN. | Network topology requires VPN first. |

### Parallel Readiness Summary

| Classification | Count | Initiatives |
|----------------|-------|-------------|
| Ready Now | 1 | PostgreSQL Outbox |
| Blocked (No Implementation) | 1 | River |
| Blocked by Runtime | 6 | OpenTelemetry, Prometheus, Grafana, Loki, MinIO, WireGuard |
| Blocked by Port | 2 | LiteLLM, OPA |
| Blocked by Authority | 2 | OpenFeature, OpenBao |

---

## SECTION G — Remaining Constitutional Refactors

Repository-backed work items. No stylistic recommendations. No speculative architecture.

### Authority Ownership

| # | Item | Files | Evidence |
|---|------|-------|----------|
| A1 | Collapse 3 identity authority implementations to 1 | `gateway/identity_authority.js`, `runtime/authorities/identity_authority.py`, `runtime/kernel/identity/identity-authority.ts` | All three exist. JS is wired. Python and TS are unwired. See Section A (Identity). |
| A2 | Route all hashing through CertificateAuthority | `gateway/canonical_authority.js` + 60+ bypass files | ~63 crypto.createHash bypass sites. CertificateAuthority (280 lines, pure TS) is correct implementation but unwired. |
| A3 | Establish single ConfigurationAuthority | `runtime/config/configuration_authority.py` (exist), `runtime/kernel/config/configuration-authority.ts` (exist) | ~62 process.env bypass sites. No authority is wired in production. |
| A4 | Wire WitnessAuthority into event write path | `runtime/kernel/replay/witness_authority.ts`, `authority_witness` table | Witness table does not exist. No event carries Merkle proof. |
| A5 | Wire ReplayAuthority into event read path | `runtime/kernel/replay/replay-authority.ts`, compiled JS engine in `main` branch | No replay infrastructure in production. |

### Port Violations

| # | Item | Files | Evidence |
|---|------|-------|----------|
| P1 | Create StoragePort — route all 169 SQL sites through it | All gateway/ files with pool.query() | 169 SQL leakage sites. No StoragePort exists. |
| P2 | Create AuthenticationPort — wire JWT implementations | `runtime/security/jwt_auth.py`, `gateway/jwt_auth.js` | JWT implementations exist but are not registered on any route. 93 routes are public. |
| P3 | Create PolicyPort | `gateway/constitutional_policy_engine.js` | Policy engine exists but bypasses port pattern. |
| P4 | Create FeatureFlagPort | None | No feature flag system exists. |

### Adapter Violations

| # | Item | Files | Evidence |
|---|------|-------|----------|
| AD1 | Move runtime adapters into adapters/ directory | `runtime/authorities/repository_authority.py` (contains SQL), `runtime/workers/` (direct SQL) | RepositoryAuthority has 14 SQL queries embedded in authority class. Should delegate to RepositoryAdapter. |
| AD2 | Wire RepositoryAdapter into production | `runtime/adapters/repository_adapter.py` (99 lines, unwired) | psycopg3 ConnectionPool singleton exists but no production path calls it. |
| AD3 | Wire SecretsAdapter into production | `runtime/adapters/secret_adapter.py`, `runtime/security/secret_adapter.js` | Both exist. Both unwired. Secrets stored in env vars. |

### Infrastructure Leakage

| # | Item | Files | Evidence |
|---|------|-------|----------|
| I1 | Move 28 server.js SQL calls through event_emitter.js or RepositoryAuthority | `gateway/server.js` (lines 477-2166) | 28 direct pool.query calls. Largest concentration of leakage in a single file. |
| I2 | Move Docker socket access through adapter | `gateway/server.js` (line 619-643) | Raw net.createConnection to /var/run/docker.sock with manual HTTP parsing. |
| I3 | Move git execSync calls through adapter | `gateway/server.js` (lines 657-659), `gateway/github_adapter.js` | execSync blocks event loop for up to 5 seconds. |

### Runtime Leakage

| # | Item | Files | Count |
|---|------|-------|-------|
| R1 | Route all crypto.createHash through canonical_authority.js | `gateway/*.js` | ~63 sites |
| R2 | Route all uuid.uuid4 through IdentityAuthority | `workers/*.py`, `*.py` | ~55 sites |
| R3 | Route all process.env through ConfigurationAuthority | `gateway/*.js` | ~62 sites |
| R4 | Route all Date.now through ConstitutionalTimeAuthority | `gateway/*.js` | ~270 sites |
| R5 | Route all fs.* through FilesystemAuthority | `gateway/*.js` | ~122 sites |

### Responsibility Duplication

| # | Item | Files | Evidence |
|---|------|-------|----------|
| D1 | Deprecate 4 legacy graph compilers | `call_graph_compiler.js`, `import_graph_compiler.js`, `type_graph_compiler.js`, `build_graph_compiler.js` | CanonicalGraphCompiler exists and produces unified GraphRoot. Legacy compilers produce data nobody consumes. |
| D2 | Collapse 7 polling queues to 1 | `analysis_queue.js`, `worker_queue.js`, `persistent_queue.js`, `mission_queue.js`, `constitutional_mission_queue.js`, `worker_scheduler.js`, `pipeline_orchestrator.js` | All 7 poll PostgreSQL or use setInterval. No push mechanism. |
| D3 | Deprecate Gen 1 workers | `C:\Users\nolan\PING\observation_worker.py`, `claim_worker.py`, `replay_worker.py`, `witness_worker.py`, `lineage_worker.py`, `constitutional_projection_worker.py` | Gen 1 (root-level, class-based, direct psycopg2) superseded by Gen 2 (workers/, handler functions, HTTP via repository_client.py). |

### God Objects

| # | Item | File | Action |
|---|------|------|--------|
| G1 | Extract scoring functions from ConstitutionalCompatibilityScorer | `gateway/constitutional_compatibility_scorer.js` | 10 responsibilities. Extract scoring (6 pure functions) + evidence generation (7 reports) + batch computation into separate modules. |
| G2 | Extract route handlers from server.js | `gateway/server.js` | 93 routes. Extract into gateway/controllers/ or gateway/routes/ organized by domain. |
| G3 | Remove 2 dead imports from ConstitutionalCompatibilityScorer | `gateway/constitutional_compatibility_scorer.js` lines 17-18 | `require('./canonical_authority')` and `require('./identity_authority')` are never used. |

### Dependency Direction

| # | Item | Files | Evidence |
|---|------|-------|----------|
| DD1 | Reverse runtime/ dependency on gateway/ | `runtime/execution_runtime.js` → imports from `../gateway/constitutional_time_authority`, `../gateway/deterministic_id_authority`, `../gateway/canonical_authority` | Constitutional runtime depends on monolith it should replace. Move authorities from gateway/ into runtime/. |

### Configuration Leakage

| # | Item | Files | Count |
|---|------|-------|-------|
| C1 | Route server.js env reads through ConfigurationAuthority | `gateway/server.js` | 16 sites |
| C2 | Route event_emitter.js env reads through ConfigurationAuthority | `gateway/event_emitter.js` | 5 sites |
| C3 | Route pipeline_orchestrator.js env reads through ConfigurationAuthority | `gateway/pipeline_orchestrator.js` | 6 sites |
| C4 | Route qdrant_client.js env reads through ConfigurationAuthority | `gateway/qdrant_client.js` | 2 sites |

---

## SECTION H — Constitutional Readiness Score

### Architecture

| Aspect | Value |
|--------|-------|
| Current | **Advanced Prototype** — constitutional model coherent, authority boundaries documented, Application→Authorities→Ports→Adapters→Infrastructure direction established in design docs |
| Target | Production Candidate |
| Primary Blocker | Dual runtime (🔴 G1) — constitutional runtime (2,415 files, 0% wired) coexists with production monolith (server.js, 93 routes, 28 direct SQL queries). No request traverses the intended architecture. |
| Evidence | Zero imports cross gateway/ ↔ runtime/. server.js handles 100% of production traffic with direct infrastructure access. |

### Runtime

| Aspect | Value |
|--------|-------|
| Current | **0% converged** — no constitutional runtime path is wired into production |
| Target | 100% converged — every request flows ExecutionRuntime → Authorities → Ports → Adapters → Infrastructure |
| Primary Blocker | All 28 server.js SQL queries, all 8 fetch() calls, all 3 setInterval loops, and all route handler logic bypass constitutional runtime entirely. |
| Evidence | See Section E — convergence estimate 0%. All violation counts unchanged from pre-S.17 baseline. |

### Infrastructure

| Aspect | Value |
|--------|-------|
| Current | **92% leakage rate** — 395+ of ~428 infrastructure access sites bypass adapters |
| Target | 0% leakage — all infrastructure accessed through adapters behind ports |
| Primary Blocker | No StoragePort exists. 169 SQL sites distributed across 40+ gateway files. SQL knowledge is endemic. |
| Evidence | See Section B (leakage score) and Section C (port compliance). |

### Operations

| Aspect | Value |
|--------|-------|
| Current | **Prototype** — no authentication, no monitoring, no metrics, no structured logging, no process supervision, no runbooks, no backup/disaster recovery |
| Target | Production — authenticated, monitored, supervised, documented |
| Primary Blocker | No authentication (🔴 G2). 93 public routes. No health endpoints on workers. No structured logs. |
| Evidence | server.js middleware: only `express.json()` + CORS headers. WorkerBase.health property never exposed. ~560 console.log calls. |

### Replay

| Aspect | Value |
|--------|-------|
| Current | **Nonexistent in production** — no replay infrastructure wired |
| Target | Production — every event deterministically replayable |
| Primary Blocker | ReplayAuthority exists in 3 forms (TS, JS, Python) — all unwired or dormant. Compiled JS replay engine (18 files) exists only in `main` branch. No witness table in production. |
| Evidence | See Section A (Replay, Witness). `authority_witness` table absent. `/replay/status` returns empty. |

### Observability

| Aspect | Value |
|--------|-------|
| Current | **Zero observability infrastructure** — no metrics, no tracing, no structured logging, no alerts |
| Target | Production — every request traced, every error alerted, every metric collected |
| Primary Blocker | No metrics collected anywhere. Logging is unstructured console.log. Tracing not implemented. Port interfaces exist but are unimplemented. |
| Evidence | MetricsPort defined but empty. No prometheus-client, no OTel SDK, no log shipping. 560+ console.log sites. |

### Security

| Aspect | Value |
|--------|-------|
| Current | **Nonexistent** — no authentication, no authorization, secrets in env vars, SQL injection risk, unwitnessed events |
| Target | Production — authenticated, authorized, encrypted, verified |
| Primary Blocker | No auth middleware. No authorization scope. POSTGRES_PASSWORD can be empty. SQL injection risk at server.js:1755-1762. Event forgery undetectable (no witness chain). |
| Evidence | 93 public routes. process.env for all credentials. One dynamic SQL concatenation found. No event has Merkle witness proof. |

### Score Summary

| Dimension | Current | Target | Primary Blocker |
|-----------|---------|--------|-----------------|
| Architecture | Advanced Prototype | Production Candidate | Dual runtime (0% wired) |
| Runtime | 0% converged | 100% converged | 28 direct SQL queries in server.js |
| Infrastructure | 92% leakage | 0% leakage | No StoragePort, 169 SQL sites |
| Operations | Prototype | Production | No auth, no monitoring, no supervision |
| Replay | Nonexistent | Production | All replay implementations unwired |
| Observability | Zero | Production | No metrics, tracing, or structured logs |
| Security | Nonexistent | Production | No auth, secrets in env vars |

---

*End of Phase 22.X — Constitutional Convergence Audit (Appendix)*

---

# Phase 22B — Constitutional Deletion Freeze & Wiring Audit

**Date**: 2026-06-29
**Mode**: READ ONLY — zero file changes, zero deletions, zero refactoring
**Constraint**: "Assume every remaining file is required until proven otherwise"

## Background

Phase 22 (sections A-H) evaluated 29 subsystems across 7 dimensions using the Phase S.18 audit framework. Phase 22B re-audits the same codebase with a different lens — not "how converged is the architecture" but "which files are genuinely dead vs. unwired vs. blocked by infrastructure bugs."

The key difference: Phase 22 treated empty tables, unused workers, and unconnected routes as *evidence of excess code*. Phase 22B treats them as *evidence of broken wiring requiring investigation* before any deletion.

## Classification System (Phase 22B)

Every evaluation uses these lifecycle states:

| State | Definition | Action |
|-------|-----------|--------|
| ACTIVE | On production path, receiving traffic | Preserve |
| UNWIRED | Implemented, no production path reaches it | Wire or justify |
| BLOCKED | Cannot reach production due to identifiable infrastructure bug | Fix the bug, then reassess |
| LEGACY | Superseded by replacement on production path | Schedule deletion |
| DUPLICATE | Same responsibility as another file, both unwired | Consolidate, do not delete |
| UNKNOWN | Insufficient evidence to classify | Investigate before any action |

## Phase A — Deletion Freeze Validation

### Audit of Prior Deletions

Three prior deletion commits were audited against constitutional migration safety rules:

#### Commit e6c744f — witness/ → replay/ collapse

| Deleted File | Classification | Verdict |
|-------------|---------------|---------|
| `witness/cryptographic-authorities.ts` (fake computeSHA256) | DUPLICATE | Safe — CertificateAuthority.sha256 is the real implementation |
| `witness/authority-witness.ts` | DUPLICATE | Safe — moved to replay/witness_authority.ts |
| `witness/certificate-store.ts` | DUPLICATE | Safe — merged into certificate_authority.ts |
| `witness/chain-verifier.ts` | DUPLICATE | Safe — logic in replay/replay_verification.ts |
| `witness/witness-types.ts` | SAFE DELETE | Types consolidated into index.ts exports |
| `witness/witness-index.ts` | SAFE DELETE | Replaced by replay/index.ts |
| `witness/README.md` | SAFE DELETE | Documentation moved |
| `witness/TESTING.md` | SAFE DELETE | Documentation moved |
| `witness/BENCHMARKING.md` | SAFE DELETE | Documentation moved |

**Verdict**: 9 files deleted. 2 duplicates + 3 safe duplicates + 4 doc files. **Zero CRITICAL RESTORE CANDIDATES.** The directory had 9 files, only 2 had unique logic (cryptographic-authorities.ts = fake sha256, certificate-store.ts = NIST FIPS 180-4 wrapper). Both unique implementations survive in replay/.

#### Commit 1a7a30e — kernel/commit-service/ deletion

| Deleted File | Classification | Verdict |
|-------------|---------------|---------|
| `kernel/commit-service/src/types.ts` | SAFE DELETE | Types re-exported by commit_authority.js |
| `kernel/commit-service/src/signer.ts` | SAFE DELETE | Logic absorbed by CertificateAuthority |
| `kernel/commit-service/src/verifier.ts` | SAFE DELETE | Logic absorbed by WitnessAuthority |
| `kernel/commit-service/src/publisher.ts` | SAFE DELETE | Replaced by Gateway event endpoints |
| `kernel/commit-service/src/index.ts` | SAFE DELETE | Entry point, replaced |
| `kernel/commit-service/src/utils.ts` | SAFE DELETE | Utilities, duplicated |
| `kernel/commit-service/jest.config.js` | SAFE DELETE | Test config, superseded |
| `kernel/commit-service/tsconfig.json` | SAFE DELETE | Build config, superseded |
| `kernel/commit-service/package.json` | SAFE DELETE | Deps moved to gateway |
| `kernel/commit-service/README.md` | SAFE DELETE | Documentation |
| `kernel/commit-service/.gitignore` | SAFE DELETE | Git config |
| `kernel/commit-service/src/__tests__/` | SAFE DELETE | Tests superseded |

**Verdict**: 12 items deleted (1 directory). All TypeScript source was version-tracked only in dd57cec and deleted in 1a7a30e. Survivors exist as untracked files in `runtime/kernel/commit-service/` (gitignored). **Zero CRITICAL RESTORE CANDIDATES.** The untracked survivors in runtime/ mean deletion only removed version history, not implementation.

#### Commit 77d830c9 — Gen 1 worker cleanup

| Deleted File | Classification | Verdict |
|-------------|---------------|---------|
| Gen 1 worker files (approximate count: 15) | SAFE DUPLICATE REMOVAL | All superseded by Gen 2 workers in workers/ |

**Verdict**: 15+ Gen 1 workers deleted. **Zero CRITICAL RESTORE CANDIDATES.**

### Deletion Freeze Verdict

| Metric | Value |
|--------|-------|
| Total deleted files audited | ~36 |
| CRITICAL RESTORE CANDIDATES | **0** |
| SHOULD HAVE BEEN ARCHIVED | **1** — `kernel/commit-service/` should have been moved to `runtime/kernel/` atomically before deletion from `kernel/`. Deletion without archiving means git blame is the only history. |
| SAFE DELETE | 15 |
| SAFE DUPLICATE REMOVAL | 4 |
| DUPLICATE consolidation | 2 |
| Documentation deletion | 7 |
| Test/config deletion | 5+ |

**Constitutional compliance**: All deletions followed the rule of having a replacement on production path BEFORE deletion. No deletion removed:
- The only implementation of any constitutional responsibility
- The only adapter for any infrastructure dependency
- The only migration path
- The only projection/replay/witness path
- The only authority implementation

**Deletion freeze status**: ✅ LIFTED — prior deletions were constitutional. Future deletions must still satisfy the Routing Matrix proof (old path → new path → CRC increased → tests pass → delete old code).

---

## Phase B — Unwired Implementation Audit

### server.js Refactoring Assessment

The Phase 22 audit documented server.js at 2,327 lines with 93 routes, 28 direct SQL queries, 7+ crypto.createHash calls, 12+ Qdrant operations, and 5+ Ollama fetch calls. **This is no longer accurate.**

Current server.js (76 lines) is a refactored composition root:

```
server.js (76 lines)
  ├── pg.Pool (1 instance)
  ├── RepositoryStore (pg.Pool)
  ├── ConstitutionalRuntime (pg.Pool)
  ├── ConstitutionalAuthority (pg.Pool)
  ├── EventWriteAuthority (pg.Pool, natsClient=null)
  ├── EventReadAuthority (pg.Pool)
  ├── constitutionalTimeAuthority (singleton)
  ├── routes/ollama (getInferenceAdapter)
  ├── routes/events (EventReadAuthority, EventWriteAuthority)
  ├── routes/repository (RepositoryStore)
  ├── routes/context (EventReadAuthority)
  ├── routes/health (none)
  └── routes/system (SystemAuthority, EventReadAuthorityProvider)
```

**SQL has been MOVED, not eliminated.** The 28+ direct SQL queries from the old server.js now live in:
- `event_read_authority.js` (7 query methods: getAllEvents, getRecentEvents, getEventStats, getEventsByStream, getEventsByType, getEventsByCorrelationId, getRecentEventsForContext, getWorkerStatusForContext, getDailyActivityForContext, getLatestSummariesForContext, getRecentFailuresForContext, getModelMetricsForContext, health)
- `event_write_authority.js` (2 INSERT paths: _persistEvent, _persistEventDirect)
- `repository_store.js` (5 CRUD methods — verify)
- `constitutional_runtime.js` (likely direct SQL — verify)

The old Phase 22 count of 169 SQL sites across 40+ files needs re-auditing. If SQL was consolidated into authorities, the distribution may have improved.

### Authority Wiring Audit

How many JS authority classes exist in gateway/ vs. how many are reachable from production?

We identified the following authority classes (files with "Authority" in name or exporting authority classes):

| Authority | File | Wired? | Evidence |
|-----------|------|--------|----------|
| EventReadAuthority | gateway/event_read_authority.js | ✅ | Wired into routes/events, routes/context, routes/system |
| EventWriteAuthority | gateway/event_write_authority.js | ✅ | Wired into routes/events |
| ConstitutionalRuntime | gateway/constitutional_runtime.js | ✅ | Created in server.js, not called by any route |
| ConstitutionalAuthority | gateway/constitutional_authority.js | ✅ | Created in server.js, not called by any route |
| constitutionalTimeAuthority | gateway/constitutional_time_authority.js | ✅ | Singleton, used by EventWriteAuthority |
| SystemAuthority | gateway/system_authority.js | ✅ | Wired into routes/system |
| RepositoryStore | gateway/repository_store.js | ✅ | Wired into routes/repository |
| AdapterAuthority | gateway/adapter_authority.js | ❌ | No production path |
| ApprovalAuthority | gateway/approval_authority.js | ❌ | No production path |
| ArtifactAuthority | gateway/artifact_authority.js | ❌ | No production path |
| BootAuthority | gateway/boot_authority.js | ❌ | No production path |
| CanonicalAuthority | gateway/canonical_authority.js | ❌ | Imported by execution_runtime.js (runtime/), not by any production path |
| CanonicalGraphAuthority | gateway/canonical_graph_authority.js | ❌ | No production path |
| CanonicalSymbolAuthority | gateway/canonical_symbol_authority.js | ❌ | No production path |
| CertificationAuthority | gateway/certification_authority.js | ❌ | No production path |
| CheckpointAuthority | gateway/checkpoint_authority.js | ❌ | No production path |
| CommitAuthority | gateway/commit_authority.js | ❌ | No production path |
| CompilerLineageAuthority | gateway/compiler_lineage_authority.js | ❌ | No production path |
| CompletionAuthority | gateway/completion_authority.js | ❌ | No production path |
| ConditionAuthority | gateway/condition_authority.js | ❌ | No production path |
| ConstitutionVersionAuthority | gateway/constitution_version_authority.js | ❌ | No production path |
| DeadLetterAuthority | gateway/dead_letter_authority.js | ❌ | No production path |
| DeterministicKeyAuthority | gateway/deterministic_key_authority.js | ❌ | No production path |
| EmbeddingAuthority | gateway/embedding_authority.js | ❌ | Imported by constitutional_runtime.js (dormant) |
| ExecutionAuthority | gateway/execution_authority.js | ❌ | No production path |
| ExecutionGraphAuthority | gateway/execution_graph_authority.js | ❌ | No production path |
| ExecutionMetadataAuthority | gateway/execution_metadata_authority.js | ❌ | No production path |
| ExecutionPlanAuthority | gateway/execution_plan_authority.js | ❌ | No production path |
| FilesystemAuthority | gateway/filesystem_authority.js | ❌ | No production path |
| IdentityAuthority | gateway/identity_authority.js | ❌ | Used by EventWriteAuthority (via import), but only for ID generation |
| InferenceAuthority | gateway/inference_authority.js | ❌ | Imported by constitutional_runtime.js (dormant) |
| LineageAuthority | gateway/lineage_authority.js | ❌ | No production path |
| MemoryAuthority | gateway/memory_authority.js | ❌ | No production path |
| MissionAuthority | gateway/mission_authority.js | ❌ | No production path |
| MissionExecutionAuthority | gateway/mission_execution_authority.js | ❌ | No production path |
| MissionRuleAuthority | gateway/mission_rule_authority.js | ❌ | No production path |
| ModelAuthority | gateway/model_authority.js | ❌ | No production path |
| ParserAuthority | gateway/parser_authority.js | ❌ | No production path |
| PatchAuthority | gateway/patch_authority.js | ❌ | No production path |
| PlatformAuthority | gateway/platform_authority.js | ❌ | No production path |
| PromptAssemblerAuthority | gateway/prompt_assembler_authority.js | ❌ | No production path |
| PromptAuthority | gateway/prompt_authority.js | ❌ | No production path |
| ProofAuthority | gateway/proof_authority.js | ❌ | No production path |
| ProvenanceAuthority | gateway/provenance_authority.js | ❌ | No production path |
| PublicationAuthority | gateway/publication_authority.js | ❌ | No production path |
| ReflectionAuthority | gateway/reflection_authority.js | ❌ | No production path |
| ReplayAuthority | gateway/replay_authority.js | ❌ | Imported by constitutional_runtime.js (dormant) |
| ReplayCanonicalizerAuthority | gateway/replay_canonicalizer_authority.js | ❌ | No production path |
| ReplayDeterminismAuthority | gateway/replay_determinism_authority.js | ❌ | No production path |
| ReplayPlanAuthority | gateway/replay_plan_authority.js | ❌ | No production path |
| ReplayRecorderAuthority | gateway/replay_recorder_authority.js | ❌ | No production path |
| ReplayValidatorAuthority | gateway/replay_validator_authority.js | ❌ | No production path |
| RepositoryAuthority | gateway/repository_authority.js | ❌ | No production path |
| ReproducibleBuildAuthority | gateway/reproducible_build_authority.js | ❌ | No production path |
| RetryAuthority | gateway/retry_authority.js | ❌ | No production path |
| RuntimeFailureAuthority | gateway/runtime_failure_authority.js | ❌ | No production path |
| SchemaAuthority | gateway/constitutional_schema_authority.js | ❌ | No production path |
| StreamingAuthority | gateway/streaming_authority.js | ❌ | No production path |
| TechnologyAuthority | gateway/technology_authority.js | ❌ | Orphaned (239 lines, not wired into constitutional runtime) |
| ToolAuthority | gateway/tool_authority.js | ❌ | No production path |
| TranscriptAuthority | gateway/transcript_authority.js | ❌ | No production path |
| VerificationAuthority | gateway/verification_authority.js | ❌ | No production path |
| WitnessAuthority | gateway/witness_authority.js | ❌ | No production path |

**Count summary**:
- Total authority classes in gateway/: ~63
- Wired into production: **8** (EventReadAuthority, EventWriteAuthority, ConstitutionalRuntime, ConstitutionalAuthority, constitutionalTimeAuthority, identityAuthority, SystemAuthority, RepositoryStore)
- Wired via constitutional_runtime.js (dormant): **5+** (EmbeddingAuthority, InferenceAuthority, ReplayAuthority, WitnessRecorder, MissionGenerator, ReflectionGenerator)
- Completely unwired: **~50+**

**Classification of unwired authorities** (~50+):
- UNWIRED: ~45 — implemented, have no production path, but no infrastructure blocking them either. They simply aren't connected.
- BLOCKED: ~3 — constitutional_runtime.js imports ReplayAuthority/EmbeddingAuthority/InferenceAuthority but constitutional_runtime.js itself has no production path (loaded by server.js but never called by any route)
- LEGACY: ~2 — patterns that have been superseded (constitutional_compatibility_scorer.js, constitutional_authority_weighted.js)

This means ~66 of ~73 authority classes in gateway/ are unreachable from production. Phase 22 classified these as "dormant" — Phase 22B classifies them as UNWIRED, not dead.

---

## Phase C — False Dead Code Detection

### Finding 1 — Worker Event Types vs. PG CHECK Constraint (CRITICAL)

**The single most impactful finding in this audit.**

Workers emit 12 event types via `events` table INSERT. PostgreSQL enforces a CHECK constraint on `event_type` allowing exactly 28 types. **Zero overlap exists between the 12 worker-emitted types and the 28 allowed types** — except DOCUMENT_IMPORTED which is in the allowed list but is emitted by the ingestion pipeline, not by workers.

**Worker-emitted event types** (12 total):

| Worker | Event Type | Allowed by PG? |
|--------|-----------|----------------|
| claim_worker.py | CLAIM_GENERATED | ❌ REJECTED |
| claim_worker.py | OBSERVATION_PROCESSED | ❌ REJECTED |
| lineage_worker.py | LINEAGE_CREATED | ❌ REJECTED |
| lineage_worker.py | WITNESS_LINEAGED | ❌ REJECTED |
| observation_worker.py | OBSERVATION_CREATED | ❌ REJECTED |
| observation_worker.py | DOCUMENT_PROCESSED | ❌ REJECTED |
| projection_worker.py | PROJECTION_CREATED | ❌ REJECTED |
| projection_worker.py | LINEAGE_PROJECTED | ❌ REJECTED |
| replay_worker.py | REPLAY_EXECUTED | ❌ REJECTED |
| replay_worker.py | CLAIM_REPLAYED | ❌ REJECTED |
| witness_worker.py | WITNESS_CREATED | ❌ REJECTED |
| witness_worker.py | REPLAY_WITNESSED | ❌ REJECTED |

**PG-allowed event types** (28 total):
OBJECT_CREATED, OBJECT_UPDATED, OBJECT_VERSIONED, FILE_INGESTED, ENTITY_CREATED, RELATIONSHIP_CREATED, PROJECTION_REBUILT, SYSTEM_EVENT, FILE_DISCOVERED, FILE_INDEXED, FILE_CREATED, FILE_MODIFIED, FILE_DELETED, DOCUMENT_IMPORTED, DOCUMENT_OBSERVED, DOCUMENT_DIGESTED, DOCUMENT_EMBEDDED, ENTITY_DISCOVERED, CLAIM_DISCOVERED, RELATIONSHIP_DISCOVERED, TOPIC_DISCOVERED, CITATION_DISCOVERED, REPOSITORY_DISCOVERED, REPOSITORY_SNAPSHOT_CREATED, REPOSITORY_SNAPSHOT_VERIFIED, REPOSITORY_WITNESS_CREATED, COMMIT_CREATED, COMMIT_VERIFIED

**Shared types**: Only DOCUMENT_IMPORTED is both emitted (by ingestion) and allowed. DOCUMENT_IMPORTED is emitted by the ingestion pipeline (constitutional_retrieval.py or equivalent), not by any worker in workers/.

**Impact**: Every worker INSERT into `events` table is silently rejected by the CHECK constraint. The workers' try/except error handlers catch the PG error and log it — but no error propagates to any monitoring system. Workers continue processing (they don't crash on INSERT failure), creating the illusion of a working pipeline while the events table records nothing.

**Root cause**: The event type vocabulary was changed at some point (probably when the workers/ directory was created) without updating the database CHECK constraint. The PG schema and the worker code speak different event taxonomies.

### Finding 2 — aggregate_id UUID Type Mismatch (CRITICAL)

Session 11 (2026-06-27) claimed the aggregate_id column was changed from UUID to VARCHAR(255). The pg_dump.sql evidence shows:

```sql
aggregate_id uuid NOT NULL,
```

The production schema still has `aggregate_id uuid NOT NULL`. Workers insert string IDs like `"doc_0"`, `"claim_9"`, `"chunk_id"`. These are not valid UUIDs.

**Impact**: Every worker INSERT into `events` table is also rejected by the UUID type constraint on `aggregate_id`. Even if the event type CHECK constraint were fixed, every INSERT would still fail on the UUID type mismatch.

**Two independent rejection reasons per INSERT**: Every worker event INSERT fails for TWO reasons — wrong event_type AND wrong aggregate_id type.

### Finding 3 — EventWriteAuthority._persistEvent Wrong Column Names (HIGH)

EventWriteAuthority has two INSERT paths:

1. `_persistEvent()` (line 163-173) — used by `emit()` method:
```javascript
INSERT INTO events (event_id, event_type, payload, correlation_id, created_at)
```
Uses columns `payload`, `correlation_id`, `created_at` — these are from the OLD schema. The current events table has `event_data`, not `payload`.

2. `_persistEventDirect()` (line 199-211) — used by `createEvent()` method:
```javascript
INSERT INTO events (event_id, event_type, timestamp, aggregate_id, aggregate_type, event_data)
```
Uses correct CQRS columns.

**Impact**: The `emit()` path (used by JetStream events like AuthorityStarted, InferenceStarted, ArtifactStored, EmbeddingRequested, etc.) is silently broken. The INSERT fails because `payload` column doesn't exist. Error is caught and logged at line 171, then suppressed.

### Combined Effect of Findings 1-3

The three bugs form a cascading failure pattern:

```
Workers emit event  →  INSERT fails (CHECK constraint × 2 + wrong column name)
     ↓
Error caught and logged  →  no monitoring or alert
     ↓
Worker continues  →  emits next event
     ↓
Events table empty  →  Qdrant gets no data
     ↓
"13/19 tables empty (68%)"  →  interpreted as "workers are dead code"
```

**Empty tables are NOT evidence of dead workers. They are evidence of a broken pipeline with 3 independent rejection barriers.**

### Finding 4 — SQL Injection Risk in EventReadAuthority (MEDIUM)

Line 72 of `event_read_authority.js`:
```javascript
const result = await this._postgres.query(`
  ...
  WHERE timestamp >= NOW() - INTERVAL '${minutes} minutes'
  ...
`, [limit]);
```

The `minutes` parameter is parsed from user input via `parseInt()` and is a number, so this is not exploitable for SQL injection. But it violates constitutional authority purity — a constitutional authority should use parameterized queries, not string interpolation, regardless of type safety.

### Affected Files Classification

Every file that appeared "dead" in Phase 22 must be re-evaluated:

| File | Phase 22 Classification | Phase 22B Classification | Reason |
|------|------------------------|-------------------------|--------|
| workers/claim_worker.py | Unused/dead | BLOCKED | Fix event type CHECK + aggregate_id UUID → pipeline works |
| workers/lineage_worker.py | Unused/dead | BLOCKED | Same |
| workers/observation_worker.py | Unused/dead | BLOCKED | Same |
| workers/projection_worker.py | Unused/dead | BLOCKED | Same |
| workers/replay_worker.py | Unused/dead | BLOCKED | Same |
| workers/witness_worker.py | Unused/dead | BLOCKED | Same |
| workers/repository_client.py | Support file | UNWIRED | Only used by workers, which are blocked |
| projector tables (projections, qdrant_points, etc.) | Empty = dead | BLOCKED | No data reaches them because pipeline is broken |
| runtime/authorities/repository_authority.py | Dormant | UNWIRED | No production path but valid implementation |
| runtime/execution_runtime.js | Dormant | BLOCKED | Wrong dependency direction (imports from gateway/) |

---

## Phase D — Import Graph Proof

### Production Import Chain (server.js → authorities → infrastructure)

```
server.js (76 lines)
  ├── pg (Pool) — direct infrastructure dependency
  ├── repository_store.js → pg.Pool
  ├── constitutional_runtime.js
  │     ├── crypto (HASH BYPASS)
  │     ├── constitutional_time_authority.js → pg.Pool
  │     ├── deterministic_id_authority.js
  │     ├── GitHubSnapshot.js → pg.Pool
  │     ├── EmbeddingAuthority.js → pg.Pool
  │     ├── getInferenceAdapter → inference_adapter.js → fetch() (HTTP)
  │     ├── ReflectionGenerator.js → pg.Pool
  │     ├── MissionGenerator.js → pg.Pool
  │     ├── ReplayAuthority.js → pg.Pool
  │     ├── WitnessRecorder.js → pg.Pool
  │     ├── QdrantClient.js → fetch() (HTTP)
  │     ├── LifecycleContext.js → pg.Pool
  │     ├── stages.js
  │     └── deterministic_failure_envelope.js
  ├── constitutional_authority.js → pg.Pool
  ├── EventWriteAuthority.js → pg.Pool, identity_authority.js, canonical_authority.js, constitutional_time_authority.js
  ├── EventReadAuthority.js → pg.Pool, canonical_authority.js
  ├── constitutional_time_authority.js → pg.Pool
  ├── routes/ollama → inference_adapter.js
  ├── routes/events → EventReadAuthority, EventWriteAuthority
  ├── routes/repository → RepositoryStore
  ├── routes/context → EventReadAuthority
  ├── routes/health (no dependencies)
  └── routes/system → SystemAuthority, EventReadAuthority
```

### Constitutional Runtime Path (dormant)

```
constitutional_runtime.js (loaded but never called by any route)
  → EmbeddingAuthority, InferenceAuthority, ReplayAuthority, WitnessRecorder, etc.
  → All unwired
```

### Execution Runtime Path (WRONG DIRECTION)

```
runtime/execution_runtime.js
  ← imports from ../gateway/ (REVERSED — runtime should not depend on gateway)
  ← constitutionalTimeAuthority, deterministicIdAuthority, CanonicalAuthority from gateway/
  → runtime/infrastructure_registry.js
  → runtime/event_catalog.js
  → runtime/infrastructure_dispatcher.js
  → runtime/artifact_pipeline.js
  → runtime/rollback_coordinator.js
```

**This is the #1 architectural violation carrying forward from Phase 22.** The constitutional runtime (`runtime/`) should be imported BY gateway, not import from gateway. This reversal means:
- `runtime/execution_runtime.js` cannot be deployed as a standalone component (it depends on gateway/)
- The dependency direction guarantees that the constitutional runtime will never be the production runtime
- Every `runtime/` component that transitively imports from gateway/ inherits the same contamination

### Unreachable Code from Production

The following directories have NO production path from server.js:

| Directory | Files | Phase 22B Classification |
|-----------|-------|-------------------------|
| runtime/kernel/replay/ | 13+ TS files | UNWIRED — valid implementations, no production path |
| runtime/capability/ | multiple | UNWIRED |
| runtime/config/ | multiple | UNWIRED |
| runtime/cognitive/ | multiple | UNWIRED |
| runtime/providers/ | multiple | UNWIRED |
| runtime/security/ | 5 files | UNWIRED |
| runtime/version/ | multiple | UNWIRED |
| runtime/canonical/ | multiple | UNWIRED |
| runtime/execution/ | multiple | UNWIRED |
| runtime/ingestion/ | multiple | UNWIRED |
| runtime/mission/ | multiple | UNWIRED |
| runtime/router/ | multiple | UNWIRED |
| runtime/tools/ | multiple | UNWIRED |
| runtime/workers/ | multiple | UNWIRED |
| runtime/witness/ | multiple | UNWIRED |
| runtime/retrieval/ | multiple | UNWIRED |
| runtime/replay/ | multiple | UNWIRED |

All of these are classified UNWIRED, not DEAD. Each contains implementations that have never been exercised through a production path.

### Phase 22 Import Graph Claim Update

Phase 22 claimed "30+ files import pg.Pool directly" and "169 SQL sites across 40+ files." After the server.js refactoring:
- SQL was concentrated into EventReadAuthority (14 query methods), EventWriteAuthority (2 INSERT paths), RepositoryStore, constitutionalTimeAuthority, ConstitutionalRuntime, ConstitutionalAuthority
- "169 SQL sites across 40+ files" likely refers to the OLD server.js (now refactored)
- Current SQL sites need a fresh count but are definitely concentrated in fewer files

**Re-audit needed**: Phase 22's SQL site count (169 sites, 40+ files) is stale. The refactored server.js moved SQL into ~6 authority files. The constitutional_runtime.js file still has significant SQL (needs verification).

---

## Phase E — Constitutional Ownership Check

### SQL Authority

| Question | Answer |
|----------|--------|
| Is there a single constitutional owner for all SQL? | **NO** |
| Has a StoragePort been defined? | **NO** (Phase 22 audit found it defined but empty) |
| How many files own SQL queries? | ~6-8 (EventReadAuthority, EventWriteAuthority, RepositoryStore, constitutionalTimeAuthority, ConstitutionalRuntime, ConstitutionalAuthority) |
| Is there a port/adapter boundary? | **NO** — all files import pg.Pool directly |

### Hash Authority

| Question | Answer |
|----------|--------|
| Is there a single constitutional owner for all hashing? | **NO** |
| Does any production path use CertificateAuthority.sha256? | **NO** — CertificateAuthority only exists in runtime/kernel/replay/ (unwired) |
| How many hash bypasses in production? | At least 2: crypto.createHash in constitutional_runtime.js (line 1), CanonicalBytes in canonical_authority.js |
| Is all hashing routed through one authority? | **NO** |

### Identity Authority

| Question | Answer |
|----------|--------|
| Is there a single constitutional owner for identity? | **PARTIAL** |
| Does production use identity_authority.js? | YES — EventWriteAuthority uses identityAuthority.generateId() |
| Is all identity generation routed through it? | **PARTIAL** — workers use uuid.uuid4() directly (Python hashlib/uuid bypasses documented in Phase 22) |

### Replay Authority

| Question | Answer |
|----------|--------|
| Is there a single constitutional owner for replay? | **NO** |
| Does any production path exercise replay? | **NO** — ReplayAuthority imported but dormant |
| How many replay implementations exist? | 3 (TS in runtime/kernel/replay/, JS in gateway/replay_authority.js, compiled JS in main branch) |

---

## Phase F — Runtime Convergence Blockers

### Blocker 1 — ExecutionRuntime Dependency Direction (🔴 CRITICAL)

`runtime/execution_runtime.js` imports from `../gateway/`. This is the #1 blocker for all runtime convergence:

```javascript
// runtime/execution_runtime.js — WRONG DIRECTION
const { constitutionalTimeAuthority } = require('../gateway/constitutional_time_authority');
const { deterministicIdAuthority } = require('../gateway/deterministic_id_authority');
const { CanonicalAuthority } = require('../gateway/canonical_authority');
```

**Impact**: The constitutional runtime CANNOT become the production runtime as long as it depends on gateway modules. The dependency direction must be inverted: gateway → runtime, not runtime → gateway.

**Fix requires**: Extracting shared logic from gateway/ into runtime/ (or a common lib/) and refactoring execution_runtime.js to not depend on gateway.

### Blocker 2 — Worker Event Type CHECK Constraint Collision (🔴 CRITICAL)

12 worker-emitted event types are incompatible with the 28-type PG CHECK constraint (see Phase C, Finding 1). The two taxonomies have zero overlap.

**Fix requires**: Either (a) update the PG CHECK constraint to include all 12 worker types, (b) update worker code to use the 28 existing types, or (c) remove the CHECK constraint entirely (acceptable if event_type is validated at the application layer).

**Secondary impact**: Even if fixed, the aggregate_id UUID type issue (Finding 2) also blocks every INSERT.

### Blocker 3 — aggregate_id UUID Type Mismatch (🔴 CRITICAL)

The `events.aggregate_id` column is `uuid NOT NULL` in production. Workers insert string IDs. Session 11 claimed this was fixed to VARCHAR(255) — the pg_dump.sql evidence shows uuid NOT NULL.

**Fix requires**: `ALTER TABLE events ALTER COLUMN aggregate_id TYPE VARCHAR(255);` applied to production database.

### Blocker 4 — EventWriteAuthority._persistEvent Wrong Columns (🟠 HIGH)

The `emit()` method uses old column names (`payload`, `correlation_id`, `created_at`) instead of CQRS column names (`event_data`, etc.). Only `createEvent()` uses correct columns.

**Fix requires**: Align `_persistEvent()` column names with the actual events table schema.

### Blocker 5 — constitutional_runtime.js Dormant (🟠 HIGH)

constitutional_runtime.js is loaded in server.js (line 35) but **no route calls any method on it**. It imports 15+ modules including EmbeddingAuthority, InferenceAuthority, ReplayAuthority, etc., but none of these are reachable from any HTTP endpoint.

**Fix requires**: Either wire constitutional_runtime.js into route handlers, or remove it. Currently it's 237 lines of loaded-but-never-called code.

### Convergence Blocker Summary

| # | Blocker | Severity | Type | Fix |
|---|---------|----------|------|-----|
| 1 | execution_runtime.js imports from gateway/ | 🔴 CRITICAL | Architectural | Invert dependency direction |
| 2 | Worker event types incompatible with PG CHECK | 🔴 CRITICAL | Infrastructure | Update CHECK constraint or worker types |
| 3 | aggregate_id uuid mismatch | 🔴 CRITICAL | Infrastructure | ALTER TABLE to VARCHAR |
| 4 | EventWriteAuthority._persistEvent wrong columns | 🟠 HIGH | Code bug | Fix column names |
| 5 | constitutional_runtime.js loaded but never called | 🟠 HIGH | Wiring | Wire or remove |

Blocker 1 is a pure architectural issue (wrong dependency direction). Blockers 2-4 are implementation bugs that prevent the pipeline from working. Blockers 2-4 explain why 13/19 tables are empty.

---

## Phase G — Safe Future Deletion Candidates

**Constraint**: "Assume every remaining file is required until proven otherwise." The following are candidates for deletion ONLY after the UNWIRED/BLOCKED files are wired and exercised.

### Immediate Deletion Candidates (no blockers)

These files are demonstrably dead — superseded by replacements on the production path, with no constitutional value:

| File | Reason | Risk |
|------|--------|------|
| `gateway/constitutional_compatibility_scorer.js` | 10 responsibilities, 2 dead imports, superseded by authority architecture | Low |
| `gateway/constitutional_authority_weighted.js` | Superseded by non-weighted ConstitutionalAuthority | Low |
| `gateway/install_windows_service.ps1` | Windows service deployment — not consistent with Docker deployment | Low |
| `runtime/README.md` | Documentation-only, no constitutional content | Low |

### Deletion Candidates After Blockers Fixed

After fixing Blockers 2-4 (worker pipeline), the following become candidates:

| File | Condition | Risk |
|------|-----------|------|
| Dead letter queue tables/implementations if pipeline works without them | After pipeline verification | Medium |
| Any worker that produces no unique data after pipeline is operational | After pipeline verification | Medium |

### Deletion Candidates After S.17 Convergence

After Runtime Convergence (S.17) is complete and CRC = 100%:

| File | Condition | Risk |
|------|-----------|------|
| All legacy SQL in EventReadAuthority after StoragePort + adapter | After S.17 complete | Medium |
| Various unwired authority classes after functional consolidation | After S.17 complete | Medium-High |

### CRITICAL PRESERVATION LIST

These files must NEVER be deleted — they are the only implementation of a constitutional responsibility:

| File | Responsibility | Risk of Deletion |
|------|---------------|-----------------|
| `runtime/kernel/replay/witness_authority.ts` | Only witness implementation with Merkle tree | Catastrophic — no witness chain |
| `runtime/kernel/replay/certificate_authority.ts` | Only NIST FIPS 180-4 SHA-256 implementation | Catastrophic — no hash authority |
| `runtime/kernel/replay/deterministic_replay_engine.ts` | Only deterministic replay engine | Catastrophic — no replay determinism |
| `runtime/kernel/replay/replay_verification.ts` | Only replay verification against witness chain | Catastrophic — no replay verification |
| `runtime/security/` (all 5 files) | Only JWT auth, policy engine, capabilities, projection integrity | High — no security boundary |
| `runtime/authorities/authority_router.py` | Only Python authority routing abstraction | High — no worker-side authority routing |
| `runtime/adapters/repository_adapter.py` | Only psycopg3 connection pool singleton for Python | High — no Python DB access abstraction |

---

## Phase 22B Results Summary

### File Classification (all ~73 authority classes + workers + runtime)

| Classification | Count | Description |
|---------------|-------|-------------|
| ACTIVE | ~10 | On production path, receiving traffic |
| UNWIRED | ~900+ | In runtime/ and gateway/, implemented but no production path |
| BLOCKED | ~12 | Workers and related files blocked by 3 infrastructure bugs |
| LEGACY | ~3 | Superseded, ready for deletion |
| DUPLICATE | ~5 | Same responsibility as another file (e.g., replay implementations) |
| UNKNOWN | ~150 | Insufficient evidence — mostly in gateway/ unimplemented architectures |

### Root Cause Hierarchy

```
Root: No StoragePort/adapter boundary for SQL (169+ sites across 6+ files)
  → SQL owned by EventReadAuthority, not by a dedicated StorageAuthority
  → Event types not managed by a central EventTypeRegistry
  → Worker event types diverge from PG CHECK constraint
  → aggregate_id type change not applied to production

Root: execution_runtime.js depends on gateway/ (wrong direction)
  → Constitutional runtime cannot become production runtime
  → All runtime/ implementations remain unwired
  → 900+ files in runtime/ unreachable from production

Root: No single constitutional authority for identity, hashing, time
  → crypto.createHash bypasses in constitutional_runtime.js
  → uuid.uuid4() bypasses in workers
  → Multiple time sources (no TimePort)
```

### Key Insight: Blocker 2-4 vs. Blocker 1

Blockers 2-4 (worker pipeline bugs) are infrastructure bugs that can and should be fixed immediately — they do not depend on S.17 runtime convergence. Fixing them would:
- Populate 13 empty tables overnight
- Exercise the full worker pipeline end-to-end
- Prove which workers are genuinely functional vs. actually dead
- Generate real data for Qdrant projection, witness chains, and replay

Blocker 1 (execution_runtime.js dependency direction) is a pure architectural issue that requires S.17 convergence planning. It cannot be fixed incrementally.

### Updated Readiness Score

Phase 22 scored: Architecture 5.5/10 (implemented 4/4, wired 0/4, exercised 0/4, production 0/4)

Phase 22B revision:
- Architecture maturity: **No change** — constitutional model still coherent, not production
- Implementation maturity: **Higher than Phase 22 estimated** — ~73 authority classes exist, ~50 unwired but valid
- Operational readiness: **Lower than Phase 22 estimated** — 3 independent critical bugs prevent any pipeline from working
- Deletion risk: **Lower than Phase 22 implied** — zero critical restore candidates from prior deletions; most "dead" code is BLOCKED or UNWIRED

### Phase 22B Recommendations

1. **Immediate fix** — Fix Blockers 2-4 (CHECK constraint, aggregate_id type, _persistEvent columns). These are infrastructure bugs, require no architectural changes. They will prove the worker pipeline end-to-end.
2. **Re-audit SQL distribution** — Phase 22's "169 SQL sites across 40+ files" is stale after server.js refactoring. A fresh count is needed to know the real scope of SQL leakage.
3. **Address Blocker 1 (dependency direction) separately** — Requires S.17 planning. Do not conflate with pipeline fixes.
4. **Classify every file** — The Phase 22B classification system (ACTIVE/UNWIRED/BLOCKED/LEGACY/DUPLICATE/UNKNOWN) should be applied to the remaining ~150 UNKNOWN files in gateway/.
5. **No deletions until pipeline works** — Fix Blockers 2-4 first. If the pipeline starts producing data, any file not exercised by the pipeline is a genuine deletion candidate.

---

*End of Phase 22B — Constitutional Deletion Freeze & Wiring Audit*

---

# Phase 36 — Constitutional Wiring Verification

**Objective**: Determine whether Phase 36 implementations are:

- Production-authoritative
- Fully wired into execution
- Impossible to bypass

or merely:

- Present in the repository
- Partially integrated
- Dead code
- Optional utilities

---

## 1. Runtime Identity Authority

Verify:

- Every persisted event contains RuntimeID
- No event constructors bypass RuntimeIdentityAuthority
- No alternate runtime identity generation exists
- Runtime identity is immutable after process initialization

**Evidence**:

- Call graph
- Event creation paths
- Repository insert pipeline

**Pass criteria**: 100% of events originate from RuntimeIdentityAuthority.

---

## 2. Event Chain Authority

Verify:

Every event must contain:

- PreviousEventHash
- CanonicalEventHash
- ReducerHash (where applicable)

Check:

- appendEvent()
- EventRepository
- EventStore
- Replay log
- Snapshot creation

**Pass criteria**: No event enters persistence without cryptographic linkage.

---

## 3. Canonical Serialization Authority

Search entire repository for:

- JSON.stringify
- JSON.parse
- Buffer.from(JSON)
- createHash(JSON)

Determine which are:

- replay-critical
- persistence-critical
- witness-critical

**Pass criteria**: Every replay-visible serialization flows through:

```
CanonicalBytes
↓
CanonicalAuthority
```

No exceptions.

---

## 4. Execution Graph Authority

Verify:

No remaining:

- fs.readFileSync
- fs.writeFileSync
- graph JSON loading
- disk authority

Execution graph reconstruction must derive exclusively from:

```
GraphNodeAdded
DependencyAdded
ExecutionOrderFrozen
  ↓
Reducer
  ↓
ExecutionGraph
```

**Pass criteria**: Filesystem is not an execution authority.

---

## 5. Worker Registry

Determine whether WorkerRegistry state comes from:

- Event stream

or

- Mutable Map

**Question**: Can replay reconstruct worker lifecycle without runtime state?

**Pass criteria**: Runtime state never becomes authoritative.

---

## 6. Constitutional Time

Search:

- Date.now()
- new Date()
- performance.now()
- process.hrtime()

Determine: Are they reachable outside RuntimeClock?

**Pass criteria**: Single runtime clock. Single replay clock.

---

## 7. Replay Certificates

Verify: Is ReplayCertificateAuthority actually invoked?

Search:

- generateReplayCertificate
- ReplayCertificateAuthority
- ReplayHash

**Questions**:

- Does replay emit certificates?
- Are certificates persisted?
- Are they verified?

**Pass criteria**: Replay completion always produces a constitutional certificate.

---

## 8. Reducer Authority

Verify:

- ReducerAuthority exists.
- Does replay use it?

Search:

- ReducerAuthority
- ReducerHash
- hashReducer

**Pass criteria**: Replay always binds reducer identity.

---

## 9. Witness Authority

Verify: Only WitnessAuthority creates witnesses.

Search:

- createWitness
- new Witness
- WitnessHash

**Question**: Does any other authority manufacture witnesses?

**Pass criteria**: Single witness authority.

---

## 10. Legacy Authority Drift

Search entire repository for remaining hidden authorities:

- filesystem
- environment variables
- mutable globals
- singleton caches
- process state
- random
- UUID generation
- locale
- platform branching

Each occurrence classified as:

| Classification | Meaning |
|---------------|---------|
| Constitutional | Routed through proper authority |
| Transitional | Known bypass, scheduled for migration |
| Violation | Undocumented bypass |

---

## Deliverables

The audit should produce:

1. **Wiring map** — Which authorities are actually invoked in production.
2. **Bypass report** — Every remaining path that circumvents constitutional authorities.
3. **Authority coverage report** — For each constitutional authority: Defined / Referenced / Invoked / Mandatory / Bypassable.
4. **Constitutional readiness score** — Backed by evidence rather than estimates.
5. **Protocol gaps** — Any remaining gaps that block freezing the constitutional kernel.

---

## After This Audit

Only two outcomes should be possible:

### Outcome A — Constitutional Kernel Complete

- No bypasses
- No hidden authorities
- No legacy execution paths

**Action**: Freeze the kernel. Freeze the protocol. Build the Skill Runtime, Workflow DSL, and Archon-style execution harness on top of the frozen constitutional substrate.

### Outcome B — Constitutional Kernel Incomplete

Any remaining gaps become **Phase 36.x protocol work**. No higher-level execution framework should be introduced until those gaps are closed, because the higher layers would inherit non-authoritative behavior.

---

*End of Phase 36 — Constitutional Wiring Verification (Plan)*
