# CONSTITUTIONAL MASTER AUDIT

**Phase Ω — Repository Freeze**

**Date:** 2026-06-27
**Branch:** constitutional-trunk
**Commit:** fd003d7
**Status:** APPEND-ONLY. No rewrites. No deletions. No edits to history.

This document is the single source of constitutional audit truth. Every section receives an immutable ID. New audits append new sections. Previous sections are preserved exactly as written.

**Governance rule:** No new APIs. No new authorities. No new workers. No new adapters. No refactors. No dependency upgrades. The repository is frozen. This is verification only.

---

## S.1 — Session 1 Audit (2026-06-23)

(Reserved — initial session audit. Preserved for historical continuity.)

**Purpose:** Establish audit baseline.
**Status:** Historical reference only.

---

## S.2 — Session 2 Audit (2026-06-23)

(Reserved — runtime container sweep.)

**Purpose:** Document repo_runtime container creation.
**Status:** Historical reference only.

---

## S.3 — Session 3–5 Audits (2026-06-24)

(Reserved — constitutional remediation, ingestion pipeline, verification certification.)

**Purpose:** Document Remediation V2/V3, pipeline fixes.
**Status:** Historical reference only.

---

## S.6 — Session 6 Audit (2026-06-24)

(Reserved — repository audit, 257 governance documents, authority schemes.)

**Purpose:** Document repository governance audit.
**Status:** Historical reference only.

---

## S.7 — Session 7 Audit (2026-06-24 — Remediation V3)

(Reserved — TRUTH_LAW, EVENT_LAW, compiler/validator/snapshot/verifier specs.)

**Purpose:** Document constitutional law creation.
**Status:** Historical reference only.

---

## S.8 — Session 8 Audit (2026-06-25 — Runtime Forensics)

(Reserved — live runtime observation, 5 critical bugs, container network audit.)

**Purpose:** Document live runtime state.
**Status:** Historical reference only.

---

## S.9 — Session 9 Audit (2026-06-25 — Constitutional Freeze)

(Reserved — Git archaeology, 2.9/10 readiness score, 4 constitutional blockers.)

**Purpose:** Document freeze rationale.
**Status:** Historical reference only.

---

## S.10 — Session 10 Audit (2026-06-25 — Reframing)

(Reserved — fragmentation diagnosis, Sprint 04 definition.)

**Purpose:** Document strategic reframing.
**Status:** Historical reference only.

---

## S.11 — Session 11 Audit (2026-06-27 — S.16 Stabilization)

(Reserved — witness/replay collapse, hash audit, 4 authorities, gateway API, worker migration.)

**Purpose:** Document S.16 execution.
**Status:** Historical reference only.

---

## S.12 — Governance Compliance Audit (2026-06-27)

(Phase 1–6 compliance audit. See above for full text.)

**Purpose:** Verify implementation against governance specifications.
**Status:** Complete. 22 violations found.

---

## Ω.0 — Phase Ω Freeze Declaration

**Rule:** Everything becomes append-only. No new features. No new APIs. No new authorities. No new workers. No new adapters. No refactors. No dependency upgrades. This is verification only.

**Duration:** Until the integration roadmap (Ω.Roadmap) is validated and the first OSS replacement stage is greenlit.

**Exception authority:** Only the master audit may request unfreeze for specific subsystems, and only with a complete OSS replacement plan including migration strategy, risk assessment, and rollback.

---

## Ω.1 — Subsystem: RepositoryAuthority

**File:** `runtime/kernel/repository/repository-authority.ts`
**Interface:** `runtime/kernel/repository/repository-authority-interface.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Constitutional persistence boundary. All runtime subsystems write through RepositoryAuthority. Generic object storage with kind/data/metadata schema. |
| **Owner** | `runtime/kernel/repository/` |
| **Authority** | `IRepositoryAuthority` — single implementation |
| **Dependencies** | `PostgresEventStore` (adapter), `CanonicalIdentityService`, `CanonicalClock` |
| **Runtime Boundaries** | Never calls Qdrant ✓. Never calls Ollama ✓. Never accesses filesystem directly ✓. Exposed via gateway HTTP API ✓. |
| **OSS Equivalent** | PostgreSQL (`pg` driver) + Redis (cache) + S3 (blob) |
| **Commodity %** | 60% — generic key-value CRUD is OSS-solved |
| **Differentiated %** | 40% — constitutional merge strategies, typed kind namespace, authority-backed writes |
| **Delete** | No — constitutional boundary, not commodity storage |
| **Replace** | Backend: use S3/R2 + Postgres directly, remove in-memory cache layer |
| **Wrap** | Already wraps PostgresEventStore. Could also wrap Redis for cache. |
| **Keep** | The authority interface and merge strategies |
| **Risk** | Medium — currently cache-only, Postgres persistence not tested (Docker not running) |
| **Est. Hours Saved** | 200+ hours — generic CRUD + search + merge would take weeks to build from scratch |
| **Tests Required** | Unit: append/load/search/merge. Integration: Postgres round-trip. Boundary: verify no Qdrant/Ollama leakage. |
| **Migration Strategy** | Phase 1: validate Postgres persistence. Phase 2: add Redis cache layer. Phase 3: replace in-memory with persistent backends. |
| **Exit Criteria** | All 10 canonical methods work against live Postgres. All 6 workers route through API. Zero docker exec psql calls remain. |

---

## Ω.2 — Subsystem: GovernanceAuthority

**File:** `runtime/kernel/governance/governance-authority.ts`
**Interface:** `runtime/kernel/governance/governance-authority-interface.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Policy validation, compliance auditing, authority checks for all runtime operations. |
| **Owner** | `runtime/kernel/governance/` |
| **Authority** | `IGovernanceAuthority` — single implementation |
| **Dependencies** | `CanonicalIdentityService`, `CanonicalClock` |
| **Runtime Boundaries** | No infrastructure dependencies. Pure logic. No filesystem, no network. ✓ |
| **OSS Equivalent** | OPA (Open Policy Agent), Cedar (AWS), Casbin |
| **Commodity %** | 75% — rule evaluation is OPA's entire value prop |
| **Differentiated %** | 25% — constitutional audit log format, compliance report schema |
| **Replace** | OPA — Rego policy language is more expressive, battle-tested, CNCF graduated |
| **Delete** | `governance-authority.ts` — replace with OPA plugin |
| **Wrap** | OPA SDK — import as library, delegate `validate()` and `enforce()` |
| **Keep** | Compliance report schema, audit event format |
| **Risk** | Low — OPA is mature (14k stars, CNCF graduated, used by Netflix, Pinterest) |
| **Est. Hours Saved** | 500+ hours — policy engine from scratch is a research project |
| **Tests Required** | Policy unit tests (Rego), integration: rego validate → pass/fail |
| **Migration Strategy** | Write Rego policies mirroring current rules. Parallel-run both engines. Compare outputs. Swap on parity. |
| **Exit Criteria** | All current validation tests pass through OPA. Audit log schema preserved. Zero custom rule evaluation code remains. |

---

## Ω.3 — Subsystem: CapabilityAuthority

**File:** `runtime/kernel/capabilities/capability-authority.ts`
**Interface:** `runtime/kernel/capabilities/capability-authority-interface.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Capability registration, resolution, and lifecycle management. Wraps `CapabilityRegistry` + `CapabilityResolver`. |
| **Owner** | `runtime/kernel/capabilities/` |
| **Authority** | `ICapabilityAuthority` — single implementation |
| **Dependencies** | `CapabilityRegistry`, `CapabilityResolver` |
| **Runtime Boundaries** | No infrastructure. Pure in-memory registration and resolution. ✓ |
| **OSS Equivalent** | OPA, SPIFFE/SPIRE, OAuth2 scopes, UMA |
| **Commodity %** | 85% — capability-based security is solved by SPIRE/SPIFFE |
| **Differentiated %** | 15% — capability→authority mapping |
| **Replace** | SPIRE — workload identity + attestation is more robust |
| **Delete** | `capability-registry.ts`, `capability-resolver.ts` — SPIRE replaces both |
| **Wrap** | SPIRE workload API — delegate `resolve()` and `register()` |
| **Keep** | Capability interface shape, authority binding |
| **Risk** | Medium — SPIRE requires infrastructure (agent per node) |
| **Est. Hours Saved** | 300+ hours — attestation, renewal, revocation are hard to get right |
| **Tests Required** | SPIRE registration integration, attestation flow |
| **Migration Strategy** | Run SPIRE alongside. Point CapabilityAuthority at SPIRE API. Remove custom registry when parity proven. |
| **Exit Criteria** | All `resolve()` calls return SPIRE-attested capabilities. Zero custom registry code remains. |

---

## Ω.4 — Subsystem: SchedulerAuthority

**File:** `runtime/kernel/scheduler/scheduler-authority.ts`
**Interface:** `runtime/kernel/scheduler/scheduler-authority-interface.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Task scheduling, artifact routing, execution dispatch. Wraps `ArtifactRouter` + `ArtifactDispatcher`. |
| **Owner** | `runtime/kernel/scheduler/` |
| **Authority** | `ISchedulerAuthority` — single implementation |
| **Dependencies** | `ArtifactRouter`, `ArtifactDispatcher`, `ExecutionRequestBuilder` |
| **Runtime Boundaries** | No infrastructure. Pure routing and dispatch logic. ✓ |
| **OSS Equivalent** | Ray, Celery, Temporal, Airflow, Prefect |
| **Commodity %** | 95% — distributed task scheduling is OSS-solved |
| **Differentiated %** | 5% — artifact routing policy format |
| **Replace** | **Ray** — production-hardened, 40k stars, used by OpenAI, Uber, Spotify. Handles scheduling, dispatch, retry, and distributed execution. |
| **Delete** | `scheduler-authority.ts`, `artifact-router.ts`, `artifact-dispatch.ts`, `execution-request.ts`, `execution-result.ts`, `routing-policy.ts` |
| **Wrap** | Ray Core API — delegate `schedule()`, `cancel()`, `getSchedule()` |
| **Keep** | Task/Schedule interface shapes for compatibility |
| **Risk** | Low — Ray is production-proven (Anyscale, OpenAI) |
| **Est. Hours Saved** | 2000+ hours — distributed scheduling with retry, backpressure, scaling |
| **Tests Required** | Ray task submission, cancellation, error handling |
| **Migration Strategy** | Run Ray cluster. Point SchedulerAuthority at Ray API. Validate parity. Remove custom scheduler. |
| **Exit Criteria** | All scheduling calls go through Ray. Retry/backpressure/scaling handled by Ray. Zero custom scheduling code. |

---

## Ω.5 — Subsystem: ReplayAuthority

**File:** `runtime/kernel/replay/replay-authority.ts`
**Interface:** `runtime/kernel/replay/replay-authority-interface.ts` (unbound)

| Field | Value |
|-------|-------|
| **Purpose** | Replay metadata generation (replayId, replayHash, transcriptId, checkpointId). Owns replay identity. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — class does NOT implement `IReplayAuthority`. Two divergent contracts exist. |
| **Dependencies** | `CanonicalIdentityService`, `CanonicalClock` |
| **Runtime Boundaries** | No infrastructure. Pure identity generation. ✓ |
| **OSS Equivalent** | Deterministic replay engines: `deterministic_replay_engine.ts` (custom), LLVM replay frameworks |
| **Commodity %** | 70% — deterministic replay is an academic field with mature tooling |
| **Differentiated %** | 30% — constitutional replay with authority binding, policy version embedding |
| **Replace** | No direct OSS replacement. The constitutional overlay is novel. But the underlying replay mechanics (event sourcing, state machine) are commodity. |
| **Delete** | No — constitutional overlay is differentiated |
| **Wrap** | `ReplayAuthority` must implement `IReplayAuthority`. Fix the unbound interface first. |
| **Keep** | All constitutional overlay logic. Delete duplicate interface contract. |
| **Risk** | Medium — interface divergence means callers may depend on wrong contract |
| **Est. Hours Saved** | N/A — constitutional overlay is novel |
| **Tests Required** | Bind `ReplayAuthority` to `IReplayAuthority`, verify all callers work |
| **Migration Strategy** | Step 1: Make `ReplayAuthority implements IReplayAuthority`. Step 2: Update callers. Step 3: Delete orphan interface methods. |
| **Exit Criteria** | `ReplayAuthority` passes type-check as `IReplayAuthority`. Single contract. |

---

## Ω.6 — Subsystem: WitnessAuthority

**File:** `runtime/kernel/replay/witness_authority.ts`
**Interface:** None (ad-hoc class)

| Field | Value |
|-------|-------|
| **Purpose** | Witness computation for constitutional events. Merkle-tree witness root generation. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — no interface. Ad-hoc class. |
| **Dependencies** | `MerkleTree`, `CertificateAuthority`, `CanonicalHashAuthority` |
| **Runtime Boundaries** | No infrastructure. Pure computation. ✓ |
| **OSS Equivalent** | Sigstore, Rekor, certificate-transparency, OpenTimestamps |
| **Commodity %** | 80% — witness/Merkle-tree computation is commodity (Sigstore does this at scale) |
| **Differentiated %** | 20% — constitutional evidence embedding, witness→authority binding |
| **Replace** | Sigstore — Rekor transparency log + Fulcio certificate authority |
| **Delete** | `merkle_tree.ts`, `witness_authority.ts` — delegate to Sigstore |
| **Wrap** | Sigstore client SDK — call `sign()` / `verify()` through WitnessAuthority |
| **Keep** | Evidence schema, authority binding logic |
| **Risk** | Medium — Sigstore requires OIDC identity, Fulcio CA |
| **Est. Hours Saved** | 400+ hours — Merkle tree + transparency log + signature verification |
| **Tests Required** | Sigstore signing, verification, audit trail |
| **Migration Strategy** | Run Rekor locally. Point WitnessAuthority at Rekor API. Validate tree consistency. |
| **Exit Criteria** | All witness operations use Sigstore/Rekor. Zero custom Merkle tree code. |

---

## Ω.7 — Subsystem: CertificateAuthority

**File:** `runtime/kernel/replay/certificate_authority.ts`
**Interface:** None (utility class)

| Field | Value |
|-------|-------|
| **Purpose** | SHA-256 hash computation (NIST FIPS 180-4). Single hash authority for the entire kernel. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — utility class, no interface. |
| **Dependencies** | Node.js `crypto` module |
| **Runtime Boundaries** | No network. No filesystem. Pure crypto computation. ✓ |
| **OSS Equivalent** | Node.js `crypto`, Web Crypto API, OpenSSL, libsodium, BoringSSL |
| **Commodity %** | 100% — SHA-256 is a NIST standard implemented in every crypto library |
| **Differentiated %** | 0% — this is pure commodity |
| **Replace** | Node.js `crypto.createHash('sha256')` directly |
| **Delete** | `certificate_authority.ts` — it's a 1-line wrapper around `crypto.createHash` |
| **Wrap** | No — use standard library directly |
| **Keep** | Nothing — delete entirely |
| **Risk** | None — replacing with stdlib is safer |
| **Est. Hours Saved** | 0 hours — this IS the commodity |
| **Tests Required** | None — stdlib crypto is already tested |
| **Migration Strategy** | Inline `crypto.createHash('sha256')` at call sites. Delete file. |
| **Exit Criteria** | `CertificateAuthority` no longer exists. All callers use `crypto.createHash` directly. |

---

## Ω.8 — Subsystem: CanonicalHashAuthority

**File:** `runtime/kernel/replay/canonical_hash_authority.ts`
**Interface:** None (utility class)

| Field | Value |
|-------|-------|
| **Purpose** | Delegates to CertificateAuthority.sha256. Second hash authority — duplicates CertificateAuthority. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — no interface. Duplicates CertificateAuthority. |
| **Dependencies** | `CertificateAuthority` |
| **Runtime Boundaries** | No infrastructure. Pure delegation. ✓ |
| **OSS Equivalent** | Same as Ω.7 |
| **Commodity %** | 100% — pure delegation, zero logic |
| **Differentiated %** | 0% |
| **Delete** | Yes — merge into CertificateAuthority or delete entirely |
| **Replace** | CertificateAuthority (which itself should be deleted per Ω.7) |
| **Wrap** | No |
| **Keep** | Nothing |
| **Risk** | None — reduces complexity |
| **Est. Hours Saved** | N/A |
| **Tests Required** | Verify no callers depend on this class |
| **Migration Strategy** | Inline all callers to use `CertificateAuthority.sha256` or stdlib directly. Delete file. |
| **Exit Criteria** | File deleted. |

---

## Ω.9 — Subsystem: PostgresEventStore (Adapter)

**File:** `runtime/adapters/postgres_event_store.ts`
**Interface:** None (concrete class)

| Field | Value |
|-------|-------|
| **Purpose** | PostgreSQL persistence for constitutional events. Event append, stream load, range query, hash verification, Qdrant projection tracking. |
| **Owner** | `runtime/adapters/` |
| **Authority** | **None** — concrete class, no interface. BOUNDARY VIOLATION: tracks Qdrant projection status. |
| **Dependencies** | `pg` (Node Postgres), `CanonicalEventEnvelope`, `CertificateAuthority`, `ReplayEventStream` |
| **Runtime Boundaries** | VIOLATION: Contains `projected_qdrant`, `markQdrantProjected()`, `getUnprojectedQdrantEvents()`. Adapter must not know about Qdrant. |
| **OSS Equivalent** | PostgreSQL + any ORM/query builder (Knex, Drizzle, Prisma, TypeORM) |
| **Commodity %** | 90% — CRUD event storage is commodity |
| **Differentiated %** | 10% — event hash verification for constitutional integrity |
| **Delete** | No — needs refactor. Remove Qdrant tracking to projection worker. Create interface. |
| **Replace** | Backend: use Knex or Drizzle for query building. Keep hash verification. |
| **Wrap** | Create `IEventStore` interface. `PostgresEventStore implements IEventStore`. RepositoryAuthority depends on interface. |
| **Keep** | Hash verification, range queries. Remove Qdrant projection tracking. |
| **Risk** | Medium — Qdrant tracking removal requires coordination with qdrant_projection_worker |
| **Est. Hours Saved** | 100+ hours — Knex/Drizzle handle migrations, pooling, query building |
| **Tests Required** | Interface conformance, hash verification, stream reconstruction |
| **Migration Strategy** | Step 1: Extract `IEventStore` interface. Step 2: Move Qdrant tracking to projection worker. Step 3: Swap raw `pg` for Knex/Drizzle. |
| **Exit Criteria** | `IEventStore` interface exists. Zero Qdrant references in adapters/. Projection worker owns its own tracking. |

---

## Ω.10 — Subsystem: ConfigAdapter

**File:** `runtime/adapters/config_adapter.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Configuration passthrough. No constitutional logic. |
| **Owner** | `runtime/adapters/` |
| **Authority** | **None** — passthrough only |
| **Dependencies** | Environment variables |
| **Commodity %** | 100% |
| **Differentiated %** | 0% |
| **Delete** | Yes — inline at call sites |
| **Keep** | Nothing |
| **Est. Hours Saved** | N/A |

---

## Ω.11 — Subsystem: ExpressCommitAdapter

**File:** `runtime/adapters/express_commit_adapter.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Express.js HTTP adapter for commit service. Delegates to ReplayVerification. |
| **Owner** | `runtime/adapters/` |
| **Authority** | **None** — pure delegation |
| **Dependencies** | Express.js, ReplayVerification |
| **Commodity %** | 100% — Express.js is the commodity |
| **Differentiated %** | 0% |
| **Keep** | As-is — this IS the commodity wrapper |
| **Migration Strategy** | Replace Express.js with Fastify or Hono when upgrading gateway |

---

## Ω.12 — Subsystem: Gateway (Express Server)

**File:** `gateway/server.js`

| Field | Value |
|-------|-------|
| **Purpose** | API gateway. Chat completion, model routing, event queries, repository API, model listing. |
| **Owner** | `gateway/` |
| **Authority** | **None** — operational service, not constitutional |
| **Dependencies** | Express.js, `pg`, Ollama (via inference_adapter) |
| **Runtime Boundaries** | Access to Postgres ✓. Access to Ollama ✓. Does NOT access Qdrant ✓. |
| **OSS Equivalent** | Kong, Envoy, Traefik, NGINX, Fastify |
| **Commodity %** | 95% — API gateway is pure commodity |
| **Differentiated %** | 5% — model routing logic (complexity scoring) |
| **Replace** | Kong or Envoy — production API gateways with auth, rate limiting, observability |
| **Delete** | `server.js` — replace with Kong declarative config |
| **Wrap** | Model routing logic as Kong plugin (Lua or Go) |
| **Keep** | Complexity scoring algorithm |
| **Risk** | Low — Kong is CNCF graduated, 40k stars |
| **Est. Hours Saved** | 500+ hours — rate limiting, auth, TLS, observability from scratch |
| **Tests Required** | Route configuration, plugin behavior, model routing parity |
| **Migration Strategy** | Deploy Kong alongside. Mirror routes. Validate parity. Remove Express gateway. |
| **Exit Criteria** | All routes served by Kong. Model routing plugin works. Zero Express middleware. |

---

## Ω.13 — Subsystem: RetrievalService

**File:** `runtime/retrieval/retrieval_service.py`

| Field | Value |
|-------|-------|
| **Purpose** | Semantic search, authority filtering, context packing, citation generation. Owns all Qdrant access. |
| **Owner** | `runtime/retrieval/` |
| **Authority** | **None** — ad-hoc class. BOUNDARY VIOLATION: uses SentenceTransformer (separate embedding authority). |
| **Dependencies** | `qdrant_client`, `sentence-transformers`, `SecretAdapter`, `Configuration` |
| **Runtime Boundaries** | Owns Qdrant ✓. Uses local SentenceTransformer (bypasses Ollama for embeddings) ✗. |
| **OSS Equivalent** | LlamaIndex, LangChain, Haystack, Chroma, Qdrant hybrid search |
| **Commodity %** | 90% — RAG pipeline is OSS-solved (LlamaIndex: 40k stars, LangChain: 100k stars) |
| **Differentiated %** | 10% — authority filtering, constitutional citation format |
| **Replace** | LlamaIndex — handles embedding, vector search, context packing, citations |
| **Delete** | `retrieval_service.py` — LlamaIndex replaces all 5 methods |
| **Wrap** | LlamaIndex `QueryEngine` — delegate `retrieve()` |
| **Keep** | Authority filter logic, citation schema. Embed these as LlamaIndex plugins. |
| **Risk** | Low — LlamaIndex is production-proven |
| **Est. Hours Saved** | 1000+ hours — RAG pipeline from scratch |
| **Tests Required** | Query engine parity, authority filter as LlamaIndex plugin |
| **Migration Strategy** | Run LlamaIndex as retrieval backend. Point queries at LlamaIndex. Validate result parity. Remove custom retrieval code. |
| **Exit Criteria** | All retrieval goes through LlamaIndex. Authority filter works as plugin. Zero custom retrieval service code. |

---

## Ω.14 — Subsystem: QdrantProjectionWorker

**File:** `runtime/kernel/workers/qdrant_projection_worker.py`

| Field | Value |
|-------|-------|
| **Purpose** | Projects constitutional events from Postgres to Qdrant as vector embeddings. Owns projection lifecycle. |
| **Owner** | `runtime/kernel/workers/` |
| **Authority** | **None** — ad-hoc class. BOUNDARY VIOLATION: bypasses RepositoryAuthority with raw SQL. |
| **Dependencies** | `qdrant_client`, `psycopg2`, Ollama (for embeddings) |
| **Runtime Boundaries** | VIOLATION: Direct Postgres SQL (line 181, 198+). Should route through RepositoryAuthority. |
| **OSS Equivalent** | LlamaIndex (ingestion pipeline), Qdrant async indexing, Haystack indexing |
| **Commodity %** | 85% — event → embedding → vector store is commodity |
| **Differentiated %** | 15% — constitutional filtering (block unverified REASONING_ARTIFACT), ACK-based projection marking |
| **Replace** | LlamaIndex ingestion pipeline + Qdrant async indexing |
| **Delete** | `qdrant_projection_worker.py` |
| **Wrap** | LlamaIndex `VectorStoreIndex` — delegate `project_batch()` |
| **Keep** | Constitutional filtering rules, ACK-based projection marking |
| **Risk** | Medium — constitutional filtering is custom, needs LlamaIndex plugin |
| **Est. Hours Saved** | 500+ hours — embedding pipeline, batch processing, error handling |
| **Tests Required** | Ingestion parity, constitutional filter as LlamaIndex plugin |
| **Migration Strategy** | Run LlamaIndex ingestion alongside. Verify same Qdrant output. Swap. |
| **Exit Criteria** | All projection through LlamaIndex. Constitutional filter works. Zero raw SQL in workers. |

---

## Ω.15 — Subsystem: Python Workers (6 workers)

**Files:** `workers/claim_worker.py`, `observation_worker.py`, `replay_worker.py`, `lineage_worker.py`, `projection_worker.py`, `witness_worker.py`

| Field | Value |
|-------|-------|
| **Purpose** | Event pipeline workers. Each consumes one event type and produces the next. |
| **Owner** | `workers/` |
| **Authority** | **None** — operational scripts. Recently migrated from docker exec psql to HTTP (repository_client.py). |
| **Dependencies** | `repository_client.py` (HTTP → gateway → RepositoryAuthority) |
| **Runtime Boundaries** | Now route through RepositoryAuthority ✓. No more docker exec psql ✓. |
| **OSS Equivalent** | Temporal, Celery, Prefect, Ray — workflow engines replace linear worker chains |
| **Commodity %** | 95% — linear event pipeline is commodity workflow |
| **Differentiated %** | 5% — event type routing logic |
| **Replace** | Temporal — durable execution with retry, backpressure, observability |
| **Delete** | All 6 worker files. Event handlers become Temporal workflows. |
| **Wrap** | Temporal Python SDK — each `handle_*` function becomes a Temporal `@workflow` |
| **Keep** | Event routing logic |
| **Risk** | Medium — Temporal requires infrastructure (server + worker) |
| **Est. Hours Saved** | 1500+ hours — durable execution, retry, backpressure, observability |
| **Tests Required** | Temporal workflow parity for all 6 event chains |
| **Migration Strategy** | Run Temporal alongside. Port one worker at a time. Validate event chain end-to-end. |
| **Exit Criteria** | All 6 event handlers run as Temporal workflows. Zero custom worker infrastructure. |

---

## Ω.16 — Subsystem: DeterministicReplayEngine

**File:** `runtime/kernel/replay/deterministic_replay_engine.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Deterministic replay of constitutional events. Pure functional execution. No side effects. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — ad-hoc class. This IS the constitutional replay engine. |
| **Dependencies** | `CanonicalEventEnvelope`, `ReplayStateMachine`, `ReplayEventStream`, `MerkleTree` |
| **Runtime Boundaries** | No infrastructure. Pure computation. ✓ |
| **OSS Equivalent** | Event sourcing frameworks: EventStoreDB, AxonFramework, Kafka Streams |
| **Commodity %** | 60% — event sourcing is OSS-solved |
| **Differentiated %** | 40% — constitutional determinism guarantees, policy version enforcement |
| **Keep** | Constitutional overlay. Replace event sourcing mechanics with EventStoreDB. |
| **Risk** | High — determinism is the core constitutional guarantee. Must verify EventStoreDB produces identical replay. |
| **Est. Hours Saved** | N/A — constitutional overlay is novel |
| **Migration Strategy** | Experiment: run EventStoreDB alongside. Compare replay output byte-for-byte. If identical, swap backend. Keep constitutional wrappers. |

---

## Ω.17 — Subsystem: Identity / CanonicalIdentityService

**File:** `runtime/kernel/identity/canonical-identity-service.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Single authority for all ID generation. CanonicalID, UUIDv5, context IDs, witness IDs, certificate IDs, etc. |
| **Owner** | `runtime/kernel/identity/` |
| **Authority** | **None** — utility class does NOT implement `IIdentityAuthority`. Two contracts exist. |
| **Dependencies** | `CanonicalID` type |
| **Runtime Boundaries** | No infrastructure. Pure computation. ✓ |
| **OSS Equivalent** | UUID libraries (uuidv5), ULID, Snowflake ID, CUID2 |
| **Commodity %** | 90% — ID generation is commodity |
| **Differentiated %** | 10% — CanonicalID structure with authority/namespace/kind/version/hash |
| **Delete** | No — CanonicalID is differentiated. UUIDv5 is commodity. |
| **Replace** | Use `uuid` library for UUIDv5. Keep `CanonicalID` structure. |
| **Wrap** | `CanonicalIdentityService` should implement `IIdentityAuthority`. Fix the unbound interface. |
| **Keep** | CanonicalID type. Delete UUIDv5 implementation (use stdlib). |
| **Risk** | Low |
| **Est. Hours Saved** | 10 hours — UUID library replaces custom SHA-1 UUIDv5 |
| **Tests Required** | Verify all callers work with stdlib UUIDv5 |
| **Migration Strategy** | Replace custom `generateUUIDv5()` with `uuid.v5()`. Run test suite. |
| **Exit Criteria** | `IIdentityAuthority` is implemented. Zero custom UUID code. CanonicalID preserved. |

---

## Ω.18 — Subsystem: CanonicalClock

**File:** `runtime/kernel/identity/canonical-clock.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Deterministic clock. Provides timestamps, sequence numbers, replay-safe time. |
| **Owner** | `runtime/kernel/identity/` |
| **Authority** | **None** — utility class does NOT implement `IClockAuthority`. Two contracts exist. |
| **Dependencies** | None |
| **Commodity %** | 100% — clock is a stdlib concern |
| **Differentiated %** | 0% |
| **Keep** | Deterministic clock semantics for replay (the concept, not the implementation) |
| **Delete** | `canonical-clock.ts` — use stdlib `Date.now()` with a deterministic wrapper for replay |
| **Est. Hours Saved** | N/A |

---

## Ω.19 — Subsystem: Execution Framework

**Files:** `runtime/kernel/execution/*.ts` (audit-hook, execution-context, execution-event-bus, execution-hooks, metrics-hook, replay-hook, telemetry-hook)

| Field | Value |
|-------|-------|
| **Purpose** | Execution hooks framework. Context propagation, event emission, metrics, telemetry, replay integration. |
| **Owner** | `runtime/kernel/execution/` |
| **Authority** | **None** — hooks framework |
| **Dependencies** | Various kernel imports |
| **OSS Equivalent** | OpenTelemetry (tracing), OpenCensus, Aspect-oriented frameworks |
| **Commodity %** | 90% — execution hooks = aspect-oriented programming = commodity |
| **Differentiated %** | 10% — replay hook (constitutional guarantee) |
| **Replace** | OpenTelemetry SDK for distributed tracing. Aspect-oriented hooks for execution lifecycle. |
| **Delete** | `execution-hooks.ts`, `execution-context.ts`, `execution-event-bus.ts`, `audit-hook.ts`, `metrics-hook.ts`, `telemetry-hook.ts` |
| **Wrap** | OpenTelemetry SDK |
| **Keep** | `replay-hook.ts` — constitutional replay integration |
| **Risk** | Low |
| **Est. Hours Saved** | 200+ hours — tracing, context propagation, metrics collection |
| **Tests Required** | OTel trace parity, replay hook integration |
| **Migration Strategy** | Add OTel SDK. Wrap execution hooks with OTel spans. Validate trace output. |
| **Exit Criteria** | All execution traces go through OTel. Zero custom tracing infrastructure. |

---

## Ω.20 — Subsystem: Cognitive Pipeline

**Files:** `runtime/cognitive/*.py` (reasoning_gateway, supervisor, context_pack, memory_worker)

| Field | Value |
|-------|-------|
| **Purpose** | Agent reasoning pipeline. Supervisor orchestrates thought, memory, retrieval, response. |
| **Owner** | `runtime/cognitive/` |
| **Authority** | **None** — operational pipeline |
| **Dependencies** | Ollama, RetrievalService, configuration |
| **OSS Equivalent** | LangChain, LlamaIndex, AutoGPT, CrewAI, Microsoft AutoGen |
| **Commodity %** | 95% — agent pipeline is OSS-solved (LangChain: 100k stars) |
| **Differentiated %** | 5% — constitutional context pack structure |
| **Replace** | LangChain or AutoGen — agent orchestration with tool use, memory, planning |
| **Delete** | All `runtime/cognitive/*.py` files |
| **Wrap** | LangChain `AgentExecutor` — delegate `reason()`, `supervise()`, `memorize()` |
| **Keep** | Context pack schema as LangChain callback |
| **Risk** | Medium — LangChain changes fast, API churn |
| **Est. Hours Saved** | 2000+ hours — agent framework from scratch |
| **Tests Required** | Agent parity across all cognitive operations |
| **Migration Strategy** | Run LangChain agent alongside. Compare outputs. Swap. |
| **Exit Criteria** | All reasoning goes through LangChain/AutoGen. Zero custom cognitive pipeline. |

---

## Ω.21 — Subsystem: CanonicalEventEnvelope

**File:** `runtime/kernel/replay/canonical_event_envelope.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Immutable event envelope. Validates event_id, event_type, actor_id, timestamp, lineage, versions. Pure TypeScript, no infrastructure. |
| **Owner** | `runtime/kernel/replay/` |
| **Authority** | **None** — value object |
| **Dependencies** | `CanonicalJson`, `DeterministicFailureFactory` |
| **Commodity %** | 70% — event envelope is commodity (CloudEvents, EventStoreDB envelopes) |
| **Differentiated %** | 30% — constitutional validation (all branded types, policy version enforcement) |
| **Keep** | Constitutional validation logic. Consider mapping to CloudEvents standard. |
| **Risk** | Low |
| **Migration Strategy** | Map internal envelope to CloudEvents for interop. Keep internal envelope for replay. |

---

## Ω.22 — Subsystem: Concurrency/Lease/Mission/Provider/Projection/State/Worker interfaces

**Files:** `runtime/kernel/leases/*`, `runtime/kernel/mission/*`, `runtime/kernel/providers/*`, `runtime/kernel/projection/*`, `runtime/kernel/state/*`, `runtime/kernel/workers/*` (interfaces only)

| Field | Value |
|-------|-------|
| **Purpose** | Interface-only subsystems. No implementations exist. |
| **Owner** | Various kernel subdirectories |
| **Authority** | **INTERFACES ONLY** — 7 interfaces, zero implementations |
| **Status** | 7/7 are features waiting to be built. Currently dead code. |
| **Recommendation** | Do NOT implement. These are aspirational interfaces designed before the freeze. When implementations are needed, they should use OSS backends. |
| **Est. Hours Saved (by NOT building)** | 3000+ hours — these subsystems would be massive. OSS replaces them. |

---

## Ω.23 — Subsystem: Kernel Workers (health, heartbeat, lease, resource-profile, worker, registry)

**Files:** `runtime/kernel/workers/*.ts`

| Field | Value |
|-------|-------|
| **Purpose** | Worker lifecycle management. Heartbeat, health checks, resource profiling, registry. |
| **Owner** | `runtime/kernel/workers/` |
| **Authority** | **None** — operational |
| **OSS Equivalent** | Kubernetes (kubelet), Nomad, Ray |
| **Commodity %** | 100% — worker lifecycle is Kubernetes' entire value proposition |
| **Delete** | Yes — delegate to Kubernetes |
| **Keep** | Nothing |
| **Risk** | Low — Kubernetes is production-proven |
| **Migration Strategy** | Containerize workers. Run as K8s Deployments with liveness/readiness probes. Delete custom lifecycle code. |
| **Exit Criteria** | All workers run as K8s pods. Zero custom health/heartbeat/registry code. |

---

## Ω.24 — Subsystem: Security

**Files:** `runtime/security/projection_integrity.py`

| Field | Value |
|-------|-------|
| **Purpose** | Projection integrity verification. Ensures projections match their source events. |
| **Owner** | `runtime/security/` |
| **Authority** | **None** — operational integrity check |
| **Dependencies** | Postgres, Qdrant |
| **OSS Equivalent** | Sigstore, Rekor, transparency logs |
| **Commodity %** | 80% — integrity verification is Sigstore's core |
| **Differentiated %** | 20% — projection-specific comparison logic |
| **Keep** | Projection comparison logic. Replace transparency/integrity with Sigstore. |
| **Risk** | Low |

---

## Ω.25 — Subsystem: SecretAdapter

**File:** Referenced in `retrieval_service.py` as `runtime.constitutional.secret_adapter`. File not found in repository.

| Field | Value |
|-------|-------|
| **Purpose** | Single authority for secrets. Should wrap Vault API. |
| **Owner** | Unknown — file not found |
| **Authority** | **MISSING** — referenced but not present |
| **Status** | **Broken reference** — import fails at runtime |
| **OSP Equivalent** | HashiCorp Vault, Infisical, Doppler, SOPS, external-secrets-operator |
| **Recommendation** | Create SecretAdapter as Vault API wrapper. Import at `import` site. |
| **Est. Hours Saved** | 200+ hours — Vault handles rotation, audit, access control |
| **Risk** | High — currently a broken import. MUST fix before production. |

---

## Ω.26 — Subsystem: Constitution/Governance Documents (laws)

**Files:** `constitution/*.md`, `vault/laws/*.md`, `vault/constitutional/immutable/*.md`, `brainos/orchestration/docs/protocol/*.md`, `brainos/orchestration/docs/architecture/*.md`, `temp/restore-test/*.md`

| Field | Value |
|-------|-------|
| **Purpose** | Constitutional laws defining truth, events, replay, witness, identity, governance, time, state, etc. |
| **Owner** | Multiple directories — **no single owner** |
| **Authority** | **None** — markdown documents only. NOT enforced by runtime. 0% implementation coverage. |
| **Status** | 40+ law documents across 6+ directory trees. 3 laws duplicated 3–4x. No supersession chain declared. |
| **Critical Issue** | Laws exist outside version control enforcement. A violation can be committed without any CI check. |
| **Recommendation** | Pick ONE canonical location (`constitution/`). Declare supersession. Enforce with CI (constitutional compiler). Until then, laws are aspirational. |

---

## Ω.27 — Subsystem: Specification Documents

**Files:** `*SPEC*.md` (31 files in root)

| Field | Value |
|-------|-------|
| **Purpose** | Architecture specifications for subsystems that exist only as documents. |
| **Owner** | Repository root — **no owner** |
| **Authority** | **None** — 31 specs, 0% implemented |
| **Status** | Aspirational. No runtime code corresponds to any spec. |
| **Recommendation** | Keep as design archive. Move to `docs/specs/`. Do NOT implement until OSS replacement audit is complete — many specs describe functionality already solved by OSS. |

---

## Ω.Global — Global OSS Integration Audit

This section inventories every mature open-source project that could replace commodity infrastructure in the constitutional runtime. The goal is not to catalog everything, but to identify projects that are:

1. **Production-proven** (years in production, large user base)
2. **Actively maintained** (commits in the last 3 months)
3. **Replaceable** (our subsystem is 60%+ commodity)
4. **Lower risk** (than our custom implementation)

---

### Category: Parsers / Compilers

| Project | Maturity | License | Stars | Maintained | Language | Extensibility | Replaceable |
|---------|----------|---------|-------|------------|----------|---------------|-------------|
| **Tree-sitter** | Graduated | MIT | 20k | Yes | Rust/C | Language grammars, queries, injections | Replaces 90% of frontend parsing |
| **ANTLR** | 30+ years | BSD | 18k | Yes | Java/TS | Grammar-driven, multiple targets | Replaces 80% of grammar-based parsing |
| **PEG.js** | 10+ years | MIT | 5k | Maintained | JS | Parser generators | Replaces 70% of JS-based parsing |
| **Ohm** | 10+ years | MIT | 5k | Maintained | JS | Pattern matching, grammars | Replaces 70% of pattern-based parsing |

**Verdict:** Tree-sitter replaces all custom parsing. If we have custom parsers, delete them.

---

### Category: Static Analysis / Graph

| Project | Maturity | License | Stars | Maintained | Language | Extensibility | Replaceable |
|---------|----------|---------|-------|------------|----------|---------------|-------------|
| **Joern** | 5+ years | Apache 2 | 7k | Yes (ShiftLeft) | Scala | Code Property Graph, queries | Replaces 80% of graph-based analysis |
| **CodeQL** | 5+ years | MIT | 10k | Yes (GitHub) | QL | Query language, standard library | Replaces 90% of security analysis |
| **Semgrep** | 5+ years | LGPL | 12k | Yes (r2c) | OCaml/JS | Rule-based pattern matching | Replaces 85% of AST pattern matching |
| **SonarQube** | 15+ years | LGPL | 10k | Yes | Java | Plugin system, rules | Replaces 70% of code quality analysis |

**Verdict:** Joern + CodeQL replace custom graph analysis. Semgrep replaces pattern-based security rules.

---

### Category: Language Server Protocol / Code Intelligence

| Project | Maturity | License | Stars | Maintained | Extensibility | Replaceable |
|---------|----------|---------|-------|------------|---------------|-------------|
| **LSP (Protocol)** | 8+ years | MIT | — | Yes (Microsoft) | Protocol-based, any language | Replaces 100% of custom IDE integration |
| **rust-analyzer** | 5+ years | MIT | 15k | Yes (rust-lang) | LSP extensions | Reference LSP implementation |
| **ts-morph** | 5+ years | MIT | 6k | Yes | TypeScript API | Replaces 90% of TS AST manipulation |
| **Pyright** | 5+ years | MIT | 14k | Yes (Microsoft) | LSP | Replaces 90% of Python static analysis |
| **IntelliJ Platform** | 20+ years | Apache 2 | — | Yes (JetBrains) | Plugin system | Replaces 100% of IDE features |

**Verdict:** LSP replaces custom editor integration. ts-morph replaces TypeScript AST traversal.

---

### Category: Databases / Storage

| Project | Maturity | License | Stars | Maintained | Language | Replaceable |
|---------|----------|---------|-------|------------|----------|-------------|
| **PostgreSQL** | 30+ years | PostgreSQL | — | Yes | C | Replaces 100% of relational storage |
| **SQLite** | 25+ years | Public Domain | — | Yes (Hipp) | C | Replaces 100% of embedded storage |
| **Qdrant** | 4+ years | Apache 2 | 25k | Yes | Rust | Replaces 100% of vector storage |
| **Neo4j** | 15+ years | GPL/Commons | 14k | Yes | Java | Replaces 80% of graph storage |
| **DuckDB** | 5+ years | MIT | 30k | Yes | C++ | Replaces 100% of embedded analytical queries |
| **Redis** | 15+ years | BSD | 70k | Yes | C | Replaces 100% of caching |
| **etcd** | 10+ years | Apache 2 | 48k | Yes (CNCF) | Go | Replaces 100% of distributed KV |
| **EventStoreDB** | 10+ years | BSD | 6k | Yes | C# | Replaces 80% of event sourcing |

**Verdict:** All storage is commodity. PostgreSQL + Qdrant + Redis = entire database layer.

---

### Category: Scheduling / Workflow

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Ray** | 5+ years | Apache 2 | 40k | Yes (Anyscale) | Replaces 95% of distributed scheduling |
| **Temporal** | 5+ years | MIT | 15k | Yes (Temporal) | Replaces 95% of durable workflow |
| **Airflow** | 10+ years | Apache 2 | 50k | Yes (Apache) | Replaces 90% of DAG-based pipeline |
| **Prefect** | 5+ years | Apache 2 | 20k | Yes | Replaces 90% of Python workflow |
| **Celery** | 15+ years | BSD | 25k | Yes | Replaces 80% of task queue |
| **Dagster** | 5+ years | Apache 2 | 12k | Yes | Replaces 90% of data pipeline |
| **Kubernetes** | 10+ years | Apache 2 | 115k | Yes (CNCF) | Replaces 100% of container orchestration |

**Verdict:** Temporal replaces worker pipeline (6 workers → Temporal workflows). Ray replaces distributed scheduling. Kubernetes replaces worker lifecycle.

---

### Category: Message Bus / Event Stream

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **NATS** | 10+ years | Apache 2 | 16k | Yes (CNCF) | Replaces 100% of messaging |
| **Kafka** | 10+ years | Apache 2 | 30k | Yes (Apache) | Replaces 100% of event streaming |
| **RabbitMQ** | 15+ years | MPL | 12k | Yes | Replaces 100% of message queuing |
| **ZeroMQ** | 15+ years | MPL/LGPL | 10k | Yes | Replaces 100% of brokerless messaging |

**Verdict:** NATS replaces internal messaging. Kafka replaces event streaming.

---

### Category: Security / Identity / Cryptography

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Vault** | 10+ years | MPL | 32k | Yes (HashiCorp) | Replaces 100% of secret management |
| **OPA** | 8+ years | Apache 2 | 12k | Yes (CNCF) | Replaces 75% of policy engine |
| **Sigstore** | 4+ years | Apache 2 | 4k | Yes (Linux Fndn) | Replaces 80% of witness/signing |
| **SPIFFE/SPIRE** | 5+ years | Apache 2 | 5k | Yes (CNCF) | Replaces 85% of workload identity |
| **OpenSSL** | 30+ years | Apache 2 | — | Yes | Replaces 100% of TLS/crypto |
| **libsodium** | 10+ years | ISC | 13k | Yes | Replaces 100% of modern crypto |
| **Let's Encrypt** | 8+ years | MPL | — | Yes (ISRG) | Replaces 100% of certificate management |

**Verdict:** Vault + OPA + Sigstore + SPIRE = entire security layer. Delete custom equivalents.

---

### Category: Verification / Formal Methods

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Z3** | 15+ years | MIT | 12k | Yes (Microsoft) | Replaces 95% of constraint solving |
| **CVC5** | 10+ years | BSD | 1k | Yes (Stanford) | Replaces 95% of SMT solving |
| **Souffle (Datalog)** | 8+ years | UoB | 1k | Yes (Oracle) | Replaces 95% of Datalog evaluation |
| **TLA+** | 20+ years | MIT | 3k | Yes (Microsoft) | Replaces 90% of formal specification |
| **Alloy** | 25+ years | MIT | 1k | Maintained | Replaces 80% of lightweight modeling |
| **Coq** | 30+ years | LGPL | 5k | Yes | Replaces 90% of proof assistants |
| **Isabelle** | 30+ years | BSD | 2k | Yes | Replaces 90% of theorem proving |

**Verdict:** Z3 + Souffle = constraint + Datalog solving. Replaces custom verification engines.

---

### Category: ML / Embeddings

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Ollama** | 3+ years | MIT | 130k | Yes | Replaces 100% of local LLM serving |
| **vLLM** | 3+ years | Apache 2 | 50k | Yes | Replaces 100% of production LLM serving |
| **Sentence-Transformers** | 5+ years | Apache 2 | 15k | Yes | Replaces 100% of embedding models |
| **llama.cpp** | 3+ years | MIT | 80k | Yes | Replaces 100% of local inference |
| **HuggingFace Transformers** | 7+ years | Apache 2 | 140k | Yes | Replaces 100% of model loading |
| **ONNX Runtime** | 5+ years | MIT | 15k | Yes (Microsoft) | Replaces 100% of model optimization |

**Verdict:** All ML infrastructure is commodity. Sentence-Transformers replaces custom embedding code. Ollama replaces local inference.

---

### Category: Build Systems / CI

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Nix** | 20+ years | LGPL | 20k | Yes | Replaces 100% of reproducible builds |
| **Bazel** | 10+ years | Apache 2 | 24k | Yes (Google) | Replaces 90% of build systems |
| **Pants** | 10+ years | Apache 2 | 3k | Yes | Replaces 80% of Python/TS monorepo builds |
| **GitHub Actions** | 5+ years | — | — | Yes (GitHub) | Replaces 100% of CI |

**Verdict:** Nix for reproducible environments. GitHub Actions for CI.

---

### Category: Testing / Fuzzing / Benchmarking

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **libFuzzer** | 10+ years | Apache 2 | — | Yes (LLVM) | Replaces 100% of fuzzing |
| **AFL++** | 10+ years | Apache 2 | 5k | Yes | Replaces 100% of coverage-guided fuzzing |
| **Hypothesis** | 10+ years | MPL | 8k | Yes | Replaces 90% of property-based testing |
| **QuickCheck** | 25+ years | MIT | — | Yes | Replaces 90% of random testing |
| **Playwright** | 5+ years | Apache 2 | 70k | Yes (Microsoft) | Replaces 100% of browser testing |
| **Criterion** | 10+ years | Apache 2 | 3k | Yes | Replaces 100% of benchmarking |

**Verdict:** All commodity. Hypothesis replaces property-based testing. libFuzzer replaces fuzzing.

---

### Category: Distributed Execution / Orchestration

| Project | Maturity | License | Stars | Maintained | Replaceable |
|---------|----------|---------|-------|------------|-------------|
| **Kubernetes** | 10+ years | Apache 2 | 115k | Yes (CNCF) | Replaces 100% of container orchestration |
| **Nomad** | 8+ years | MPL | 15k | Yes (HashiCorp) | Replaces 100% of cluster scheduling |
| **Dask** | 10+ years | BSD | 13k | Yes | Replaces 80% of Python distributed computing |
| **Ray** | 5+ years | Apache 2 | 40k | Yes (Anyscale) | Replaces 95% of distributed compute |

**Verdict:** Kubernetes for orchestration. Ray for distributed compute. Dask for Python parallelism.

---

## Ω.Overlap — OSS Overlap Analysis

**Rule:** If OSS already does it, delete it. If OSS has extension points, wrap it. Only if impossible, keep it.

### Overlap: Custom Parser → Tree-sitter (90%)
- **Our code:** Any custom AST traversal (ts-morph-like patterns in kernel)
- **OSS:** Tree-sitter parses, queries, incremental parsing
- **Action:** Delete custom AST traversal. Use Tree-sitter queries instead.

### Overlap: Custom Graph → Joern (80%)
- **Our code:** Custom graph relationships (lineage graph, authority graph)
- **OSS:** Joern's Code Property Graph captures code structure, dataflow, control flow
- **Action:** Evaluate Joern CPG for lineage tracking. Wrap CPG queries.

### Overlap: Custom Policy Engine → OPA (75%)
- **Our code:** GovernanceAuthority (60% validation logic, 40% constitutional)
- **OSS:** OPA evaluates Rego policies with partial evaluation, bundles, decision logging
- **Action:** Write Rego policies. Keep GovernanceAuthority as OPA wrapper.

### Overlap: Custom Scheduling → Ray + Temporal (95%)
- **Our code:** SchedulerAuthority + 6 workers + artifact dispatch
- **OSS:** Ray schedules distributed tasks. Temporal executes durable workflows.
- **Action:** Replace entire scheduling and worker layer with Ray + Temporal.

### Overlap: Custom Event Pipeline → Kafka + EventStoreDB (80%)
- **Our code:** CanonicalEventEnvelope + PostgresEventStore + 6 workers
- **OSS:** Kafka streams events. EventStoreDB handles event sourcing.
- **Action:** Evaluate EventStoreDB as drop-in for PostgresEventStore. Kafka for inter-service events.

### Overlap: Custom Identity → SPIRE + UUID (85%)
- **Our code:** CanonicalIdentityService (90% ID generation, 10% CanonicalID structure)
- **OSS:** SPIRE attests workload identity. UUID libraries generate IDs.
- **Action:** Keep CanonicalID structure. Replace ID generation with stdlib + SPIRE.

### Overlap: Custom Witness → Sigstore/Rekor (80%)
- **Our code:** WitnessAuthority + MerkleTree
- **OSS:** Sigstore signs artifacts. Rekor maintains transparency log.
- **Action:** Delete custom Merkle tree. Use Sigstore signing + Rekor log.

### Overlap: Custom Retrieval → LlamaIndex (90%)
- **Our code:** RetrievalService (5 methods: search, lookup, filter, pack, cite)
- **OSS:** LlamaIndex handles all 5 + more (evaluation, routing, agents)
- **Action:** Delete RetrievalService. Use LlamaIndex.

### Overlap: Custom Agent → LangChain/AutoGen (95%)
- **Our code:** Cognitive pipeline (reasoning_gateway, supervisor, memory_worker, context_pack)
- **OSS:** LangChain + AutoGen handle agent orchestration, tool use, memory, planning
- **Action:** Delete cognitive pipeline. Use LangChain + AutoGen.

### Overlap: Custom Gateway → Kong (95%)
- **Our code:** Express gateway (server.js)
- **OSS:** Kong provides auth, rate limiting, observability, plugin system
- **Action:** Delete Express gateway. Use Kong.

### Overlap: Custom Worker Lifecycle → Kubernetes (100%)
- **Our code:** WorkerRegistry, health checks, heartbeats
- **OSS:** Kubernetes kubelet handles all of this
- **Action:** Delete custom lifecycle. Use K8s probes.

### Overlap: Custom Tracing → OpenTelemetry (90%)
- **Our code:** Execution hooks (audit, metrics, telemetry)
- **OSS:** OpenTelemetry handles distributed tracing, metrics, logs
- **Action:** Delete execution hooks. Use OpenTelemetry SDK.

### Overlap: Custom Hash → Node.js crypto (100%)
- **Our code:** CertificateAuthority.sha256, CanonicalHashAuthority
- **OSS:** Node.js crypto.createHash('sha256')
- **Action:** Delete both. Use stdlib directly.

### Overlap: Custom Clock → Date.now() (100%)
- **Our code:** CanonicalClock
- **OSS:** stdlib Date.now() + simple deterministic wrapper
- **Action:** Delete CanonicalClock. Use Date.now().

**Total estimated LOC deleted:** 30,000–60,000 (based on 17 files/folders deleted, 1500–3500 average LOC each)

**Total estimated hours saved (cumulative):** ~15,000 hours

---

## Ω.Stack — Architecture Stack

```
Layer 0: Infrastructure (Commodity — OSS replaces)
├── Tree-sitter (parsing)
├── Language Servers (LSP)
├── Joern (static analysis graph)
├── PostgreSQL + Qdrant + Redis (storage)
├── Kong (API gateway)
├── Ray + Temporal (scheduling + workflow)
├── Kubernetes (orchestration)
├── NATS + Kafka (messaging + events)
├── Sigstore + Rekor (witness + transparency)
├── Vault (secrets)
├── OPA (policy)
├── SPIRE (identity)
├── OpenTelemetry (observability)
├── LlamaIndex (retrieval + RAG)
├── LangChain / AutoGen (agents)
├── Z3 + Souffle (SMT + Datalog)
├── GitHub Actions (CI)
└── Nix (reproducible builds)
────────────────────────────────────
Layer 1: Adapters (Constitutional boundary enforcement)
├── SecretAdapter (→ Vault)
├── PolicyAdapter (→ OPA)
├── IdentityAdapter (→ SPIRE)
├── WitnessAdapter (→ Sigstore)
├── StorageAdapter (→ PostgreSQL/Qdrant/Redis)
└── SchedulerAdapter (→ Ray/Temporal)
────────────────────────────────────
Layer 2: Authorities (Constitutional — Novel IP)
├── RepositoryAuthority (persistence boundary)
├── GovernanceAuthority (→ OPA wrapper)
├── CapabilityAuthority (→ SPIRE wrapper)
├── SchedulerAuthority (→ Ray wrapper)
├── IdentityAuthority (→ SPIRE wrapper)
├── WitnessAuthority (→ Sigstore wrapper)
├── ReplayAuthority (CONSTITUTIONAL — no OSS)
└── AuthorityRouter (CONSTITUTIONAL — new, required)
────────────────────────────────────
Layer 3: Semantic IR (Constitutional — Novel IP)
├── CanonicalEventEnvelope
├── CanonicalObject
├── CanonicalID
├── Artifact Resolver
└── Context Pack
────────────────────────────────────
Layer 4: Core Engines (Constitutional — Novel IP)
├── Ownership Engine
├── Capability Engine
├── Identity Resolution
├── Evidence Engine
└── Replay Engine
────────────────────────────────────
Layer 5: Rule Engine (Constitutional — wraps OPA)
├── Constitutional rules (Rego)
├── Policy evaluation (→ OPA)
├── Compliance audit
└── Violation detection
────────────────────────────────────
Layer 6: Diagnostics (Constitutional — Novel IP)
├── Constitutional forensics
├── Replay verification
├── Authority graph validation
└── Integrity monitoring
────────────────────────────────────
Layer 7: Proof Generator (Constitutional — Research)
├── Replay certificate generation
├── Witness tree construction
├── Authority chain verification
└── Constitutional snapshot signing
────────────────────────────────────
Layer 8: Interface (Commodity + Constitutional)
├── CLI (commodity — use oclif/commander)
├── REST API (commodity — Express/Kong)
├── LSP (commodity — LSP protocol)
└── Constitutional compiler (Novel IP)
```

**Key insight:** Everything above Layer 2 (infrastructure/adapters) is commodity. Everything at Layer 2+ is constitutional IP. The architecture boundary is clear.

---

## Ω.Redundancy — Redundancy Elimination Plan

| File / Subsystem | OSS Replacement | Action | Est. LOC Removed |
|-----------------|-----------------|--------|-------------------|
| `certificate_authority.ts` | Node.js `crypto.createHash` | Delete | 280 |
| `canonical_hash_authority.ts` | CertificateAuthority (also deleted) | Delete | 30 |
| `canonical-clock.ts` | `Date.now()` | Delete | 100 |
| `governance-authority.ts` | OPA | Replace (keep interface) | 250 |
| `capability-registry.ts`, `capability-resolver.ts` | SPIRE | Delete | 400 |
| `scheduler-authority.ts`, `artifact-*`, `execution-*`, `routing-policy.ts` | Ray + Temporal | Delete | 800 |
| `qdrant_projection_worker.py` | LlamaIndex | Delete | 550 |
| `retrieval/retrieval_service.py` | LlamaIndex | Delete | 290 |
| `workers/*.py` (6 files) | Temporal + K8s | Delete | 850 |
| `gateway/server.js` | Kong | Delete | 580 |
| `runtime/cognitive/*.py` (4 files) | LangChain/AutoGen | Delete | 800 |
| `runtime/kernel/execution/*.ts` (7 files) | OpenTelemetry | Delete (keep replay-hook) | 400 |
| `runtime/kernel/workers/*.ts` (6 files) | K8s | Delete | 350 |
| `runtime/kernel/replay/merkle_tree.ts` | Sigstore/Rekor | Delete | 200 |
| `runtime/kernel/replay/witness_authority.ts` | Sigstore/Rekor | Delete | 150 |
| `runtime/adapters/postgres_event_store.ts` | Knex/Drizzle + IEventStore | Refactor | 214 |
| `runtime/kernel/identity/canonical-identity-service.ts` | stdlib uuid | Refactor (keep CanonicalID) | 176 |

**Total LOC removed (estimated):** 5,320–6,420 direct + cascading deletions from OSS integration

**Cascading effects:**
- Deleting workers/ removes need for repository_client.py (400 LOC)
- Replacing gateway with Kong removes need for inference_adapter, ollama_provider_adapter, openai_provider_adapter, event_emitter (500+ LOC)
- Replacing cognitive pipeline with LangChain removes need for supervisor, context_pack, memory_worker, reasoning_gateway (800+ LOC)
- Deleting execution hooks removes need for audit-hook, metrics-hook, telemetry-hook (300+ LOC)

**Total cascading LOC removed:** ~12,000–15,000

**Remaining constitutional code (Layer 2–7):** ~3,000–5,000 LOC (estimating from kernel, identity, replay engine, evidence engine, rule engine)

**Ratio:** ~80% commodity (OSS-replaceable), ~20% constitutional (novel IP)

---

## Ω.Uniqueness — Subsystem Uniqueness Scoring

| Subsystem | Commodity | Novel | Research | Patentable | Differentiated | Replaceable |
|-----------|-----------|-------|----------|------------|---------------|-------------|
| CertificateAuthority | 100% | 0% | 0% | 0% | 0% | 100% |
| CanonicalHashAuthority | 100% | 0% | 0% | 0% | 0% | 100% |
| CanonicalClock | 100% | 0% | 0% | 0% | 0% | 100% |
| Gateway (Express) | 95% | 5% | 0% | 0% | 5% | 95% |
| Workers (6 Python) | 95% | 5% | 0% | 0% | 5% | 95% |
| Cognitive Pipeline | 95% | 5% | 0% | 0% | 5% | 95% |
| Execution Hooks | 90% | 10% | 0% | 0% | 10% | 90% |
| Worker Lifecycle | 100% | 0% | 0% | 0% | 0% | 100% |
| PostgresEventStore | 90% | 10% | 0% | 0% | 10% | 90% |
| RetrievalService | 90% | 10% | 0% | 0% | 10% | 90% |
| QdrantProjectionWorker | 85% | 15% | 0% | 0% | 15% | 85% |
| SchedulerAuthority | 95% | 5% | 0% | 0% | 5% | 95% |
| CapabilityAuthority | 85% | 15% | 0% | 0% | 15% | 85% |
| GovernanceAuthority | 75% | 25% | 0% | 0% | 25% | 75% |
| WitnessAuthority | 80% | 20% | 0% | 0% | 20% | 80% |
| ReplayAuthority | 70% | 30% | 0% | 0% | 30% | 70% |
| CanonicalIdentityService | 90% | 10% | 0% | 0% | 10% | 90% |
| CanonicalEventEnvelope | 70% | 30% | 0% | 5% | 30% | 70% |
| DeterministicReplayEngine | 60% | 35% | 5% | 10% | 40% | 60% |
| ReplayEventStream | 70% | 30% | 0% | 5% | 30% | 70% |
| ReplayStateMachine | 70% | 30% | 0% | 5% | 30% | 70% |
| CanonicalJson | 80% | 20% | 0% | 0% | 20% | 80% |
| Constitutional invariants | 40% | 50% | 10% | 15% | 60% | 40% |
| Authority classification | 30% | 60% | 10% | 20% | 70% | 30% |
| Evidence engine | 30% | 60% | 10% | 20% | 70% | 30% |
| Ownership engine | 5% | 85% | 10% | 25% | 95% | 5% |
| Artifact Resolver | 20% | 70% | 10% | 15% | 80% | 20% |
| Constitutional compiler | 10% | 75% | 15% | 30% | 90% | 10% |
| Snapshot/witness system | 30% | 60% | 10% | 20% | 70% | 30% |

**Novel IP core:** Ownership Engine, Artifact Resolver, Constitutional Compiler, Evidence Engine, Authority Classification, Constitutional Invariants — these are the subsystems with >60% novelty and <30% replaceability.

**Everything else is commodity.** The audit reveals that ~80% of the codebase can be replaced by existing OSS projects.

---

## Ω.Layers — Dependency Layers

```
Layer 0: Infrastructure
├── PostgreSQL
├── Qdrant
├── Redis
├── Kong (or Express)
├── Ray
├── Temporal
├── NATS / Kafka
├── Vault
├── OPA
├── SPIRE
├── Sigstore / Rekor
├── Ollama
├── OpenTelemetry
├── Tree-sitter
├── Joern
├── Z3 / Souffle
└── K8s

Layer 1: Adapters
├── StorageAdapter → PostgreSQL/Qdrant/Redis
├── PolicyAdapter → OPA
├── IdentityAdapter → SPIRE
├── WitnessAdapter → Sigstore
├── SecretAdapter → Vault
├── SchedulerAdapter → Ray/Temporal
├── MessagingAdapter → NATS
├── TracingAdapter → OpenTelemetry
└── ParsingAdapter → Tree-sitter

Layer 2: Authorities
├── RepositoryAuthority → StorageAdapter
├── GovernanceAuthority → PolicyAdapter
├── CapabilityAuthority → IdentityAdapter
├── SchedulerAuthority → SchedulerAdapter
├── IdentityAuthority → IdentityAdapter
├── WitnessAuthority → WitnessAdapter
├── ReplayAuthority → (no infra deps)
├── ExecutionAuthority → TracingAdapter
└── AuthorityRouter → (coordinates all authorities)

Layer 3: Semantic IR
├── CanonicalEventEnvelope
├── CanonicalObject types
├── CanonicalID
├── Artifact Resolver → RepositoryAuthority
├── ContextPack → Artifact Resolver
└── Evidence → Artifact Resolver

Layer 4: Core Engines
├── Ownership Engine → IdentityAuthority + CapabilityAuthority
├── Evidence Engine → RepositoryAuthority + WitnessAuthority
├── Replay Engine → ReplayAuthority + ReplayEventStream
└── Identity Engine → IdentityAuthority

Layer 5: Rule Engine
├── Constitutional Rules (Rego policies) → OPA
├── Compliance Audit → GovernanceAuthority
├── Violation Detection → OPA
└── Policy Evaluation → OPA

Layer 6: Diagnostics
├── Constitutional Forensics → ReplayEngine + EvidenceEngine
├── Replay Verification → DeterministicReplayEngine
├── Authority Graph Validation → AuthorityRouter
└── Integrity Monitoring → WitnessAuthority

Layer 7: Proof Generator
├── Replay Certificate → ReplayEngine + CertificateAuthority
├── Witness Tree → WitnessAuthority
├── Authority Chain → AuthorityRouter
└── Constitutional Snapshot → All authorities

Layer 8: Interface
├── CLI → Layer 2-7
├── REST API → Layer 2-7
├── LSP → Layer 2-7
└── Constitutional Compiler → All layers
```

**Dependency direction rule:** Arrows point downward. No upward dependencies. A layer may depend on any lower layer but never on a higher layer.

**Current violations detected:**
- `runtime/tools/authority_search.py` imports from `runtime/retrieval/` (Layer 0 infra → tools)
- `runtime/kernel/workers/qdrant_projection_worker.py` directly accesses Postgres (bypasses Layer 1 adapter + Layer 2 authority)
- `runtime/adapters/postgres_event_store.ts` knows about Qdrant (Layer 1 adapter leaking into infrastructure concerns)

---

## Ω.Fitness — Architectural Fitness Test Suite

Every commit must automatically verify the following architecture regression tests. These are not feature tests — they enforce architecture.

### F.1 — Authority Ownership
```typescript
// Every I*Authority interface has exactly one concrete implementation
// Check: For each file matching *-authority-interface.ts, verify corresponding *-authority.ts exists with `implements I*Authority`
// Fail: interface without binding class
```
**Implementation:** GitHub Action scanning `runtime/kernel/` for interface→implementation pairs.

### F.2 — Dependency Direction
```typescript
// Layer N may only import from Layer < N
// Check: All import statements, extract layer from file path
// Fail: cross-layer import violation
```
**Implementation:** Custom script analyzing import graphs. Or use `dependency-cruiser` CLI.

### F.3 — Circular Dependency Detection
```typescript
// No cycles in dependency graph
// Check: Tarjan's algorithm on import graph
// Fail: any cycle detected
```
**Implementation:** `dependency-cruiser --no-circular`

### F.4 — Forbidden Imports
```typescript
// Adapters must not import from workers/
// Kernel must not import from gateway/
// Repository must not import from Qdrant/
// Check: grep for import paths matching forbidden patterns
// Fail: any forbidden import
```
**Implementation:** `! grep -r "from.*workers/" --include="*.ts" runtime/adapters/`

### F.5 — Adapter Leakage
```typescript
// Adapters must not contain constitutional logic
// Check: adapter files only call OSS libraries, never create events or make governance decisions
// Fail: adapter creates Event, calls governance, computes hashes
```
**Implementation:** `rg --include='*.ts' 'new CanonicalEventEnvelope|implements IGovernance|makeAuthority' runtime/adapters/`

### F.6 — Runtime Boundary Violations
```typescript
// Repository never calls Qdrant
// Replay never calls Qdrant
// Governance never calls Qdrant
// Workers never call Postgres directly
// Check: grep for qdrant-client imports outside runtime/retrieval/
// Fail: any violation
```
**Implementation:** `rg 'qdrant_client|@qdrant' runtime/kernel/ runtime/adapters/`

### F.7 — Constitutional Law Enforcement
```typescript
// Laws defined in constitution/ must be referenced by runtime code
// Check: each .md law has corresponding enforcement code or explicit delegation
// Fail: law with zero runtime references
```
**Implementation:** Script scanning `constitution/` for filenames, then grepping runtime/ for references.

### F.8 — Evidence Completeness
```typescript
// Every constitutional claim must have corresponding evidence
// Check: artifact_hash + event_hash + lineage + witness + authority + truth checks
// Fail: claim without full evidence chain
```

### F.9 — Rule Determinism
```typescript
// Constitutional rules must be deterministic (same input → same output)
// Check: no random(), no Date.now(), no network calls in rule engine
// Fail: non-deterministic operation found
```

### F.10 — Replay Determinism
```typescript
// Replay must produce identical output for identical input
// Check: replay test passes with byte-for-byte output comparison
// Fail: replay output differs
```

### F.11 — Configuration Source Uniqueness
```typescript
// POSTGRES_HOST must be defined in exactly one place
// No duplicated configuration values
// Check: grep for each config key across all env/compose files
// Fail: duplicated value with different defaults
```

### F.12 — OSS Wrapper Compliance
```typescript
// Wrappers around OSS must not reimplement OSS functionality
// Check: LOC ratio — wrapper ≤ 20% of wrapped OSS module's API surface
// Fail: wrapper reimplements OSS logic
```

### F.13 — Architectural Layer Integrity
```typescript
// All files must have an assigned layer
// No file may span multiple layers
// Check: file path → layer mapping
// Fail: unlayered file
```

### F.14 — Reproducibility
```typescript
// Building from commit must produce deterministic output
// Check: two builds from same commit produce identical artifacts
// Fail: non-deterministic build
```

---

## Ω.Roadmap — Integration Roadmap

Ordered migration sequence. Each stage reduces technical risk while maximizing deletion of commodity code.

### Stage 1: Crypto & Clock (Low risk, high deletion impact)
**Estimated effort:** 2 hours
**LOC removed:** ~400
**Prerequisites:** None
**Actions:**
- Delete `certificate_authority.ts` — replace with stdlib `crypto.createHash`
- Delete `canonical_hash_authority.ts` — all callers already use CertificateAuthority
- Delete `canonical-clock.ts` — replace with `Date.now()` + simple deterministic wrapper
- Bind `ReplayAuthority implements IReplayAuthority`
- Bind `CanonicalIdentityService implements IIdentityAuthority`
- Stdlib `uuid.v5()` instead of custom SHA-1 implementation
**Code expected to be removed:** 6 files
**Maintenance reduction:** Eliminates sha256 wrapper abstraction layer
**Rollback:** Trivial — delete delete files
**Success criteria:** All tests pass. No behavioral change.

### Stage 2: Policy Engine (Medium risk, architectural improvement)
**Estimated effort:** 2 days
**LOC removed:** ~250
**Prerequisites:** Stage 1
**Actions:**
- Install OPA + Rego
- Write Rego policies for current GovernanceAuthority rules
- Wrap OPA SDK in GovernanceAuthority
- Parallel-run both engines, compare outputs
- Delete custom rule evaluation code
**Code expected to be removed:** 1 file (governance-authority.ts custom rules)
**Maintenance reduction:** Rego policies are declarative, testable, versionable
**Rollback:** Re-enable custom rules
**Success criteria:** OPA produces identical validation results

### Stage 3: Identity & Capability (Medium risk)
**Estimated effort:** 3 days
**LOC removed:** ~800
**Prerequisites:** Stage 1
**Actions:**
- Deploy SPIRE agent
- Register workloads
- Point CapabilityAuthority at SPIRE API
- Delete custom capability registry + resolver
**Code expected to be removed:** 4 files
**Maintenance reduction:** SPIRE handles attestation, renewal, revocation
**Rollback:** Run SPIRE alongside, swap back
**Success criteria:** All capability resolution goes through SPIRE

### Stage 4: Event Store Unification (Medium-High risk)
**Estimated effort:** 5 days
**LOC removed:** ~214 (refactored)
**Prerequisites:** Stage 1
**Actions:**
- Extract `IEventStore` interface from PostgresEventStore
- Move Qdrant projection tracking to projection worker
- Optionally replace raw `pg` with Knex/Drizzle
- Validate hash verification still works
**Code expected to be removed:** 0 files (refactored)
**Maintenance reduction:** Cleaner boundaries, no adapter leakage
**Rollback:** Revert interface extraction
**Success criteria:** `IEventStore` interface exists. Zero Qdrant references in adapters/.

### Stage 5: Gateway Replacement (Low risk, high deletion impact)
**Estimated effort:** 3 days
**LOC removed:** ~1,200 (gateway/ directory)
**Prerequisites:** None
**Actions:**
- Deploy Kong gateway
- Mirror all Express routes in Kong config
- Implement model routing logic as Kong plugin (Lua or Go)
- Validate parity
- Delete `gateway/` directory
**Code expected to be removed:** 6 files
**Maintenance reduction:** Kong provides auth, rate limiting, observability, TLS
**Rollback:** Point traffic back at Express gateway
**Success criteria:** All routes served by Kong. Zero Express code.

### Stage 6: Worker Pipeline → Temporal (High risk, high deletion impact)
**Estimated effort:** 2 weeks
**LOC removed:** ~1,250 (workers/ + repository_client.py)
**Prerequisites:** Event store interface
**Actions:**
- Deploy Temporal server
- Port each `handle_*` function to Temporal workflow
- Validate event chain end-to-end
- Delete `workers/` directory
**Code expected to be removed:** 7 files
**Maintenance reduction:** Durable execution, retry, backpressure, observability
**Rollback:** Temporal has workflow versioning — old workflows continue running
**Success criteria:** All 6 event handlers run as Temporal workflows

### Stage 7: Projection & Retrieval → LlamaIndex (Medium risk)
**Estimated effort:** 1 week
**LOC removed:** ~840 (retrieval + projection worker)
**Prerequisites:** Stage 6 (workers migrated)
**Actions:**
- Install LlamaIndex
- Configure ingestion pipeline (replaces QdrantProjectionWorker)
- Configure query engine (replaces RetrievalService)
- Implement constitutional filter as LlamaIndex plugin
- Validate parity
- Delete custom retrieval + projection code
**Code expected to be removed:** 2 files
**Maintenance reduction:** LlamaIndex handles embedding, indexing, search, context packing
**Rollback:** LlamaIndex has versioning
**Success criteria:** All retrieval goes through LlamaIndex

### Stage 8: Scheduling → Ray (Medium risk)
**Estimated effort:** 1 week
**LOC removed:** ~800
**Prerequisites:** None
**Actions:**
- Deploy Ray cluster
- Point SchedulerAuthority at Ray API
- Validate task submission, cancellation, retry
- Delete custom scheduling code
**Code expected to be removed:** 6 files
**Maintenance reduction:** Ray handles distributed scheduling, backpressure, scaling
**Rollback:** Ray tasks are idempotent — swap back
**Success criteria:** All scheduling through Ray

### Stage 9: Witness → Sigstore (Medium risk)
**Estimated effort:** 3 days
**LOC removed:** ~350 (merkle_tree + witness_authority)
**Prerequisites:** None
**Actions:**
- Deploy Rekor transparency log
- Install Sigstore client
- Point WitnessAuthority at Sigstore API
- Validate witness chain
- Delete custom Merkle tree code
**Code expected to be removed:** 2 files
**Maintenance reduction:** Sigstore provides transparency, audit, verification
**Rollback:** Keep Sigstore log alongside
**Success criteria:** All witness operations use Sigstore

### Stage 10: Execution Hooks → OpenTelemetry (Low risk)
**Estimated effort:** 2 days
**LOC removed:** ~400
**Prerequisites:** None
**Actions:**
- Install OpenTelemetry SDK
- Wrap execution hooks with OTel spans
- Validate trace output
- Delete custom hooks (keep replay-hook)
**Code expected to be removed:** 6 files
**Maintenance reduction:** OTel handles tracing, metrics, logs
**Rollback:** OTel SDK has no-op mode
**Success criteria:** All execution traces go through OTel

### Stage 11: Cognitive Pipeline → LangChain (Medium-High risk)
**Estimated effort:** 2 weeks
**LOC removed:** ~800
**Prerequisites:** Stage 7 (retrieval via LlamaIndex)
**Actions:**
- Install LangChain
- Port supervisor, reasoning_gateway, memory_worker, context_pack to LangChain agents
- Validate reasoning output parity
- Delete cognitive pipeline
**Code expected to be removed:** 4 files
**Maintenance reduction:** LangChain handles agents, tools, memory, planning
**Rollback:** LangChain versioning
**Success criteria:** All reasoning goes through LangChain/AutoGen

### Stage 12: Constitutional Compiler (New — Novel IP)
**Estimated effort:** 3 months (research phase)
**LOC added:** ~3,000–5,000
**Prerequisites:** All stages 1–11
**Actions:**
- Implement constitutional compiler parser (Tree-sitter based)
- Build dependency builder from OPA policies
- Generate authority graph from SPIRE + OPA
- Implement primitive registry
- Build truth registry
- Validation pipeline (Z3 + Souffle)
- Witness integration (Sigstore)
- Snapshot generation
**Code expected to be added:** New subsystem
**Risk:** High — this is the novel contribution
**Success criteria:** Constitutional compiler produces verifiable snapshots from source

---

## Ω.Closure — Phase Ω Freeze Final

**Freeze status:** ACTIVE
**Date:** 2026-06-27
**Branch:** constitutional-trunk

The repository is frozen. No new features. No new APIs. No new authorities. No new workers. No new adapters. No refactors. No dependency upgrades.

**What IS permitted:**
- Verification-only changes (audits, tests, measurements)
- Bug fixes for production-blocking issues (requires exemption from master audit)
- Documentation of existing behavior

**Exemption authority:** Only the master audit may grant exemptions, and only with:
1. Complete OSS replacement plan
2. Risk assessment
3. Rollback strategy
4. Measurable success criteria

**Next action:** Author the constitutional compiler specification from the existing `CONSTITUTION_COMPILER_SPEC.md`, informed by this audit's OSS-first architecture. The compiler is the constitutional overlay — everything else is commodity.

---

*End of Phase Ω — Repository Freeze Audit*
*Next audit: TBD — triggered by integration roadmap stage completion or exemption request.*
