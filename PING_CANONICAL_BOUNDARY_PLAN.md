# PING Canonical Boundary — Implementation Plan

**Status:** APPROVED FOR PLANNING — no code changes yet
**Date:** 2026-07-31
**Directive:** Continue Improving Local Intelligence (No Half-Finished Features)

This plan implements one law, one boundary, and one pipeline. It creates **zero parallel implementations**. Every step either wires an existing component, finishes a half-built one, or fixes a broken wire.

---

## 0. Constitutional Law (new, single instance)

**File:** `constitution/CANONICAL_BOUNDARY_LAW.md`

> **Law: Canonical Boundary** — Every observation, command, artifact, decision, memory, plan, or external event MUST cross the Canonicalization Boundary before it may participate in the PING ecosystem.

Corollaries (enforced):
- No subsystem owns its own event schema.
- No subsystem writes directly to Neo4j.
- No subsystem writes directly to Qdrant.
- No subsystem invents IDs.
- No subsystem bypasses namespace assignment.
- No subsystem bypasses constitutional validation.
- "If it wasn't canonicalized, it doesn't exist."

This is the constitutional anchor for all downstream work. Written first, referenced by every component.

---

## 1. Audit Evidence (read-only, completed 2026-07-30)

Three parallel read-only audits were executed. Full findings recorded in the session log. Key facts that constrain this plan:

### 1.1 Input sources (12 audited)
**0 of 12 have a working producer on the live path.**
- MISSING (8): keyboard, clipboard, Advanced Paste, Run, terminal, browser, voice, runtime logs
- PARTIAL (4): file watchers (implemented, dormant), git commits (emitter wired, capture unwired), planner (implemented, not wired), editor edits (no extension)
- `/ingest` boundary: **does not exist.** Only vestige is `POST /api/ingest` in orphaned `gateway/api_controller.js:82` (placeholder handler).

### 1.2 Pipeline stages (12 audited)
- WIRED (2/12): event spine (`UnifiedEventRuntime`), event bridge (`EventBridge`)
- PARTIAL (3): worker chain, AI runtime, suggestion
- EXISTS-UNWIRED (1): `canonical_object.js` (3 dormant callers, no HTTP path)
- STUB (2): `POST /ingest` (missing), Qdrant writer (`qdrant_integration.js` = TODO)
- INSTANTIATED-DEAD (1): `Neo4jAdapter` (zero consumers)
- HTTP-ONLY, SCHEMA-BLIND (1): KnowledgeGraph
- MISSING (2): evidence authority, ingest route
- The pipeline **structurally terminates at `ping_events`** — embed/vector/evidence/retrieval are not connected.

### 1.3 Confirmed broken wires
1. **`CLAIM_CREATED` / `REPLAY_COMPLETED` rejected by governance.** Workers emit them (`canonical_workers.js:102,171`); registry has `CLAIM_GENERATED` (`event_generator.js:243`) and `REPLAY_EXECUTED` (`:244`). Chain breaks at claim.
2. **Ollama dead DNS.** `OllamaProvider` defaults to `http://ping-ollama:11434` (`ollama_provider.js:15`); the working Ollama is `localhost:11434`. `INFERENCE_BASE_URL` unset.
3. **Zero embeddings produced.** No code path calls `aiRuntime.embed()`. `ping-runtime/embeddings/word_salad_embedder.js` does not exist (audit-claimed; not on disk).
4. **Qdrant writer is a TODO stub.** `qdrant_integration.js` (406 L): `_processNextItem` TODO (`:281`), `_generateEmbedding` seeded-random 1536-dim (`:291-301`), `_storeEmbedding` TODO (`:310-313`), `searchSimilar` TODO (`:383-387`). Zero importers.
5. **KnowledgeGraph write-orphaned.** Live PG store, HTTP-only writes, no namespace column (`knowledge_nodes`/`knowledge_edges`).
6. **No namespace column** on `ping_events`, `knowledge_nodes`, `knowledge_edges`.
7. **Health checks cover 4 surfaces only** — no Qdrant/Ollama/worker/queue/knowledge checks (`gateway_runtime.js:568-586`).

### 1.4 Dead/duplicate inventory (relevant to pipeline)
| Concern | File(s) | Classification | Action |
|---|---|---|---|
| Inference | `gateway/inference_adapter.js` (184), `inference_authority.js` (381), `inference_service.js` (12) | DUPLICATE (live path = `ping-runtime/ai/*`) | Archive; route `routes/ollama.js` through AI Runtime |
| Inference | `gateway/routes/ollama.js` (71) | HALF-BUILT — calls `inferenceAdapter.inference()` which doesn't exist → TypeError on every request | Fix to route via `aiRuntime` |
| Qdrant writer | `gateway/qdrant_integration.js` (406) | DEAD (0 importers, 3 TODOs) | Archive; new writer built against `ping-runtime/search/qdrant_adapter.js` |
| Qdrant | `gateway/qdrant_client.js` (107) | LIVE (10+ importers, most dormant) | Keep (dormant consumers migrate) |
| Qdrant harness | `qdrant_bootstrap.js` (283), `end_to_end_verifier.js` (524) | DEAD (test-only) | Move to `test/` |
| Knowledge producers | `knowledge_objects.js` (627), `knowledge_runtime.js`, `relationship_objects.js`, `prompt_objects.js`, `github_constitutional_objects.js` | DEAD (harness-only) | Archive |
| Envelope producers | `artifact_authority.js` (135), `pipeline_witness.js` (448), `replay_certificate_authority.js` (212), `temporal_authority.js` (387), `inference_witness.js` (237) | DEAD/DORMANT | Migrate when revived; do not touch now |
| Workers | Python fleet (`workers/*.py`, `kernel/event_dispatcher.py`, `Dockerfile.worker-runtime`, compose `worker-runtime`) | DUPLICATE, DORMANT (Docker down) | Keep dormant; JS fleet is canonical |
| Bootstrap | `gateway/bootstrap/main.js` (24) | OBSOLETE — `process.exit(1)` stub | Delete |
| Event read | `gateway/event_read_authority.js` vs `runtime/kernel/event_read_authority.js` | DUPLICATE pair | Merge; keep gateway copy |
| Mission planner | `gateway/mission_planner.js` (355) | DEAD (0 importers) | Archive |

**Rule applied throughout:** nothing is deleted before a working replacement is wired (Behavior Preservation Gate). Deletion is the last step.

---

## 2. Architecture (the one reality)

```
Producers (adapters, never business logic)
  PowerToys Run plugin · Hermes Runtime · VS Code ext · Cursor plugin
  Git hook adapter · Browser adapter · Voice transcription · External REST APIs
  Future AI agents · terminal · clipboard · logs · planner
        │
        ▼
  ── INGESTION ADAPTERS ──            (observe external systems, normalize input only)
        │
        ▼
  ── CANONICALIZATION BOUNDARY ──     POST /ingest  ← THE public ABI
        │  canonical_object.js envelope + CIR event
        ▼
  Constitutional Validation           EventValidator + EventGovernance
        ▼
  Identity / Namespace                identityAuthority + namespace enforcement
        ▼
  Embedding + Semantic Index          AI Runtime (nomic-embed-text) → QdrantAdapter
        ▼
  Knowledge Graph                     KnowledgeGraph (Postgres, namespaced) [+ Neo4j later]
        ▼
  Event Bus / Runtime                 UnifiedEventRuntime (ping_events) → workers → missions
        ▼
  Planner / Oracle / Hermes           (consumers — consume canonical events only)
        ▼
  Suggestions / Search / APIs
```

**Layer responsibilities (no overlap):**

| Layer | Responsibility |
|---|---|
| **Adapters** | Observe external systems, normalize input. Never business logic. |
| **Canonicalizer** | Convert all inputs into a single Canonical Object: IDs, timestamps, namespaces, provenance, confidence. |
| **Constitution** | Validate invariants, permissions, policies. |
| **Knowledge Pipeline** | Embeddings, graph relationships, metadata persistence, events. |
| **Consumers** | Hermes, planners, search, autocomplete, analytics, dashboards, APIs — canonical events only. |

**Observation ≠ Knowledge:**
```
External System → Observation → Canonical Object → Validation → Knowledge Candidate
    → Embedding → [Qdrant / Neo4j / PostgreSQL / Event Bus]
```
Raw observations stay separate from durable knowledge. Nothing becomes permanent knowledge without explicit approval.

---

## 3. Implementation Phases

Each phase has: exact files, exact wiring, tests, exit criteria. Phases are ordered by dependency — later phases depend on earlier ones. No phase creates a parallel implementation.

---

### Phase A — Canonical Boundary (foundation)

**Goal:** The one `POST /ingest` boundary that every producer uses. It binds three existing components (`canonical_object.js`, `UnifiedEventRuntime`, `EventValidator`/`EventGovernance`) — no new architecture.

#### A.1 The law
- **CREATE** `constitution/CANONICAL_BOUNDARY_LAW.md` — text from Section 0.

#### A.2 The boundary route
- **CREATE** `gateway/routes/ingest.js` — `createIngestRoutes(services)` returning an Express router.
  - `POST /ingest` — request body: `{ source, eventType, payload, namespace?, confidence?, tags?, evidence?: [eventId...], metadata? }`
  - Step 1 — **validate**: `eventValidator` + `eventGovernance` (reuse existing instances from `services`).
  - Step 2 — **canonicalize**: `createCanonicalObject({ kind: eventType, payload, authority: source, options: { namespace, confidence, metadata, source_id } })` from `gateway/canonical_object.js`.
  - Step 3 — **emit**: `unifiedEventRuntime.emit(eventType, source, payload, { causation_id, correlation_id, metadata: { canonical_hash, object_id, namespace } })`.
  - Step 4 — **respond**: `{ status:'ok', event_id, canonical_hash, object_id, namespace }`.
  - Idempotency: deterministic event ID (SHA-256 of `{eventType, source, payload}`) → `ON CONFLICT DO NOTHING` → duplicate POSTs are no-ops.
  - **Namespace enforcement:** if `namespace` omitted → default `core::owner`; if provided → validated against allowlist (`core::system`, `core::owner`, `tenant::<id>`). HPP producer keys scoped to `tenant::hpp` only.

#### A.3 Wiring
- **MODIFY** `gateway/bootstrap/gateway_runtime.js`:
  - Import `createIngestRoutes`.
  - Add to `services` (in `Object.assign`): the boundary's dependencies are already in services — `unifiedEventRuntime`, `eventValidator`, `eventGovernance`, `canonical_object` (new import).
  - Mount in `_mountRoutes`: `this._app.use('/ingest', createIngestRoutes(services))` — placed inside the `if (hasPG)` block (needs pool-backed event runtime) with a degraded-mode 503 stub.

#### A.4 Tests
- **CREATE** `gateway/test_ingest_boundary.js` — mock pool + real `EventValidator`/`EventGovernance` + real `canonical_object.js`:
  - Valid observation → 200, returns `event_id` + `canonical_hash`.
  - Invalid event type → 400/error, nothing persisted.
  - Duplicate POST → same `event_id`, no second row (`ON CONFLICT DO NOTHING`).
  - Namespace default (`core::owner`), explicit `tenant::hpp`, invalid namespace rejected.
  - Envelope verification: `verifyCanonicalObject(result.object)` → valid.

**Exit criteria:** `POST /ingest` is reachable, canonicalizes via `canonical_object.js`, emits through `UnifiedEventRuntime`, idempotent, namespace-enforced. Test suite green.

---

### Phase B — Repair broken wires (unblock existing workers)

**Goal:** Make the already-wired chain actually flow. Zero new architecture; fixes only.

#### B.1 Register missing event types
- **MODIFY** `gateway/generated/event_generator.js` `_productionEvents()`:
  - The workers emit `CLAIM_CREATED` (`canonical_workers.js:102`) and `REPLAY_COMPLETED` (`:171`). Registry has `CLAIM_GENERATED` and `REPLAY_EXECUTED`.
  - **Decision:** rename the registered entries to match the emitted types? NO — the emission side is authoritative (worker contract). **Add** `CLAIM_CREATED` and `REPLAY_COMPLETED` as registered types with correct `authority_owner`/`event_class` (inference/system respectively). Keep `CLAIM_GENERATED`/`REPLAY_EXECUTED` for compatibility with old SQL CHECK types (they're in the generator, don't break them).
  - Source of truth is the generator (`event_registry.json` is generated output — the generator's `_productionEvents()` is the canonical list per gateway/AGENTS.md "2026-07-27" session log).
- **REGENERATE** `gateway/generated/event_registry.json` (run the generator, not manual JSON edit).
- **VERIFY** `EventValidator` now accepts both emitted types.

#### B.2 Fix Ollama reachability
- **MODIFY** `ping-runtime/ai/ollama_provider.js:15`: change default from `http://ping-ollama:11434` to `process.env.INFERENCE_BASE_URL || 'http://localhost:11434'`.
- Config-only; env `INFERENCE_BASE_URL` still overrides. No new provider, no duplicate.

#### B.3 Fix the broken `/api/v1/ollama` route
- **MODIFY** `gateway/routes/ollama.js:19` — replace `inferenceAdapter.inference(...)` (does not exist → TypeError) with routing through `aiRuntime.chat(...)`. This is a **fix**, not a new route (the route group already exists).
- Alternatively delete the route group if `/ai` covers it — but fix-first is safer (Behavior Preservation Gate).

#### B.4 Health checks for the pipeline
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` `_mountRoutes` — register additional health checks (following existing pattern at `:568-586`):
  - `qdrant` → `qdrantAdapter.health()`
  - `ollama` → `ollamaProvider.health()`
  - `worker_runtime` → `workerRuntime.getStats()`
  - `event_runtime` → `unifiedEventRuntime.getStats()`
  - `knowledge_graph` → `knowledgeGraph.getStats()`
- No new subsystem — these are read-only health probes over existing services.

#### B.5 Tests
- **MODIFY** existing pipeline tests if they assert the old registry contents; add assertions that `CLAIM_CREATED`/`REPLAY_COMPLETED` validate.
- Run full suite; expect the previously-failing claim/replay chain steps to now pass.

**Exit criteria:** the worker chain (observation → claim → classification → recommendation → projection → replay → witness → lineage) emits all downstream events without governance rejection. `/ai/health` reports Ollama healthy. `/health` reports Qdrant/Ollama/workers/knowledge status.

---

### Phase C — Embedding + projection (finish the half-built writer)

**Goal:** Vectors actually flow to Qdrant. The existing `ping-runtime/search/qdrant_adapter.js` (768-d, live, instantiated at boot) is the Qdrant path. `gateway/qdrant_integration.js` is a dead TODO stub — **archive it, do not finish it** (it was never on the live path).

#### C.1 Embedding service (the missing link)
- **CREATE** `ping-runtime/embeddings/embedding_service.js` — `EmbeddingService`:
  - `embed(text, { model })` → delegates to `aiRuntime.embed()` (provider `ollama`, model `nomic-embed-text`, 768-d).
  - `projectToQdrant(canonicalObject)` → builds point `{ id: canonicalObject.id, vector, payload: { kind, namespace, canonical_hash, source_event_id, text } }` and calls `qdrantAdapter.upsert('knowledge', [point])`.
  - `ensureIndex()` → `qdrantAdapter.ensureCollection('knowledge', 768)`.
  - Deterministic fallback: if Ollama is down, generate a deterministic seeded vector (SHA-256 seed) so the pipeline never silently halts — **but tag payload with `embedding: 'fallback'`** so retrieval can down-rank it. (This replaces the deleted `word_salad_embedder.js`; it is a NEW named single instance, not a duplicate.)
- **CREATE** `gateway/qdrant_integration.js` is **archived** — the new service replaces it entirely.

#### C.2 Wire into the event path
- **MODIFY** `ping-runtime/workers/canonical_workers.js`:
  - `ProjectionWorker` (`:132`) — after emitting `PROJECTION_CREATED`, call `embeddingService.projectToQdrant()` with the canonicalized event payload. This is the projection worker's *purpose* (currently it emits but writes nothing).
  - Inject `embeddingService` into `registerCanonicalWorkers` options.
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` — construct `EmbeddingService({ aiRuntime, qdrantAdapter })`, pass to `registerCanonicalWorkers`.

#### C.3 Tests
- **CREATE** `ping-runtime/embeddings/test_embedding_service.js` (or gateway test if conventions require):
  - `ensureIndex` creates collection (mock fetch).
  - `projectToQdrant` upserts with canonical object ID + namespace payload.
  - Deterministic fallback path produces stable vector + `embedding: 'fallback'` tag.
  - Ollama path produces 768-d vector (mock `aiRuntime.embed`).
- **MODIFY** `test_commissioning.js` / pipeline tests to assert Qdrant upsert calls during projection.

**Exit criteria:** a canonical observation → worker chain → `PROJECTION_CREATED` → Qdrant point (768-d, namespaced payload). Qdrant collection exists. End-to-end vector flow proven in tests.

---

### Phase D — Knowledge graph writes (finish the orphaned store)

**Goal:** Workers write to KnowledgeGraph (currently HTTP-only). No new store — extend the live one.

#### D.1 Namespace column (needed for Phase 7)
- **MODIFY** `ping-runtime/knowledge/knowledge_graph.js` `initialize()` — add `namespace VARCHAR(255) DEFAULT 'core::owner'` to `knowledge_nodes` and `knowledge_edges` (DDL with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern so existing DBs migrate).
- **MODIFY** `ping-runtime/events/unified_event_runtime.js` `initialize()` — add `namespace VARCHAR(255) DEFAULT 'core::owner'` to `ping_events`.
- **MODIFY** `addNode`/`addEdge`/`queryNodes` to accept/filter `namespace`.
- **MODIFY** `unified_event_runtime.js` `emit()` to accept `options.namespace` and persist it (default `core::owner`).

#### D.2 Worker → graph wiring
- **MODIFY** `ping-runtime/workers/canonical_workers.js`:
  - `ObservationWorker` — upsert a knowledge node (`node_type: 'observation'`, label = event type, data = payload, namespace = event namespace) and link edges to `evidence` event IDs when present.
  - `LineageWorker` — write `derives_from` edges between knowledge nodes.
  - Inject `knowledgeGraph` into `registerCanonicalWorkers` options.
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` — pass `knowledgeGraph` to `registerCanonicalWorkers`.

#### D.3 Tests
- **MODIFY** pipeline tests — after observation/lineage processing, assert `knowledge_nodes`/`knowledge_edges` rows exist with correct namespace.
- **CREATE** namespace-filter test — `queryNodes({ namespace })` returns only that namespace.

**Exit criteria:** worker chain populates the namespaced knowledge graph automatically. No manual HTTP POSTs needed for observations.

---

### Phase E — Evidence + retrieval (constitutional retrieval)

**Goal:** Retrieval returns verifiable results. Evidence is aggregated, not fabricated.

#### E.1 EvidenceAuthority (the one missing stage)
- **CREATE** `ping-runtime/evidence/evidence_authority.js` — `EvidenceAuthority`:
  - `accumulate(sourceEventIds)` → resolves a canonical object's supporting events from `ping_events` (verify event chain via `event_id` hashes).
  - `verify(canonicalObject)` → recompute hash via `verifyCanonicalObject` + check lineage + namespace consistency.
  - `rank(results)` → order by confidence × provenance × approval state; down-rank `embedding: 'fallback'`.
  - Hash-chain semantics per `RETRIEVAL_INTELLIGENCE_REPORT.md` law #1 (trace on every result) and #7 (ADD-only).

#### E.2 Retrieval endpoint
- **MODIFY** `gateway/routes/knowledge.js` (or add to `gateway/routes/search.js` if one exists — check; do NOT create a new route group if a search group exists):
  - `POST /knowledge/search` — hybrid: Qdrant similarity (`qdrantAdapter.search`) + Postgres evidence (`evidenceAuthority.verify` on each hit) + knowledge graph context.
  - Every result carries: `{ canonical_hash, namespace, confidence, evidence: [...eventIds], verified: bool, source }`.
  - Namespace required in query; filtered to requester's grants.
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` — construct `EvidenceAuthority({ pool, eventRuntime, canonicalObjectVerifier })`, pass to routes.

#### E.3 Tests
- **CREATE** `ping-runtime/evidence/test_evidence_authority.js` — accumulate, verify (valid/tampered), rank (fallback down-ranked), namespace consistency.
- **CREATE** hybrid retrieval test — mock Qdrant + PG rows → results carry evidence + verified flag.

**Exit criteria:** search returns results with evidence chains and verification status. No unverifiable result is presented as truth.

---

### Phase F — Observation → Knowledge pipeline (approval-gated)

**Goal:** Nothing becomes permanent knowledge automatically. Explicit approval only.

#### F.1 Approval event types
- **MODIFY** `gateway/generated/event_generator.js` `_productionEvents()` — add `SNIPPET_APPROVED`, `SNIPPET_REJECTED`, `AI_RESPONSE_ACCEPTED`, `AI_RESPONSE_REJECTED` (event_class `knowledge`). REGENERATE registry.

#### F.2 Approval flow
- **CREATE** `ping-runtime/knowledge/knowledge_promoter.js` — `KnowledgePromoter`:
  - On `SNIPPET_APPROVED`/`AI_RESPONSE_ACCEPTED`: promote the referenced observation to `knowledge_nodes` with `confidence: 1.0`, `authority: 'human_approval'`, namespace preserved.
  - On reject: write negative signal to `data.rejected` on the observation node (feeds ranking).
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` — subscribe promoter to event runtime via `unifiedEventRuntime.on(...)`.
- **MODIFY** `canonical_workers.js` — the existing RecommendationWorker (`:321`) surfaces approval-worthy candidates (no new worker).

#### F.3 Tests
- **CREATE** `ping-runtime/knowledge/test_knowledge_promoter.js` — approved observation becomes knowledge node (confidence 1.0, human_approval); rejected observation stays evidence-only.

**Exit criteria:** approval events promote observations to knowledge; rejects influence ranking; nothing auto-promotes.

---

### Phase G — Namespace separation (Phase 7)

**Goal:** Strict boundaries. No tenant may observe another. Shared knowledge only via explicit promotion into core.

- **MODIFY** `ping-runtime/events/unified_event_runtime.js` — namespace validation at emit (allowlist; producer capability scoping).
- **MODIFY** `ping-runtime/knowledge/knowledge_graph.js` — namespace filter mandatory on all reads (`queryNodes`, `getNeighborhood`).
- **MODIFY** `ping-runtime/search/qdrant_adapter.js` — search payload filter by namespace (payload already carries namespace from Phase C).
- **CREATE** `ping-runtime/security/namespace_authority.js` — `NamespaceAuthority`: `resolve(producerKey)` → allowed namespaces; `authorize(namespace, producerKey)` → bool; `guard(ns)` middleware for routes. Single instance (first `runtime/security` namespace collision check — there IS a `runtime/security/` package in git history; if `NamespaceAuthority` collides, name it `CanonicalNamespaceAuthority` — see Constraints §4.4).
- **MODIFY** `gateway/routes/ingest.js` — enforce via `NamespaceAuthority` (Phase A hook).

**Exit criteria:** tenant data structurally cannot contaminate core; owner knowledge never leaks into tenant answers; cross-namespace read is impossible through any public route.

---

### Phase H — Producers (adapters; Phase 1 + 2 completion)

**Goal:** Input sources feed `/ingest`. All are thin adapters. None have internal understanding of PING.

#### H.1 In-repo producers (highest value, zero external tooling)
- **CREATE** `ping-runtime/producers/clipboard_producer.js` — host-side clipboard watcher (Node `child_process` → `powershell Get-Clipboard` poll, or a PowerShell companion script). Emits `CLIPBOARD_COPIED` → `POST /ingest`.
- **CREATE** `ping-runtime/producers/git_producer.js` — git watcher: `git log --after` polling → `GIT_COMMIT_CREATED` → `POST /ingest` (reuses `business_emitters.js` `githubCommit()` emitter shape; no duplicate).
- **CREATE** `ping-runtime/producers/log_producer.js` — runtime log tail → `SYSTEM_LOG_OBSERVED` → `POST /ingest`.
- **MODIFY** `gateway/routes/ingest.js` — register these event types in `event_generator.js` `_productionEvents()` (`CLIPBOARD_COPIED`, `GIT_COMMIT_CREATED` already exists? — check; `SYSTEM_LOG_OBSERVED` new). REGENERATE registry.

#### H.2 PowerToys bridge (Phase 4)
- **CREATE** host-side `powertoys/ping-bridge-plugin/` — C# PowerToys Run plugin (fork of `Darkdriller/PowerToys-Run-LocalLLm`, MIT):
  - `ping <text>` → `POST /ingest` (LAUNCHER_QUERY)
  - `snip <text>` → `GET /knowledge/search` → copy result → `SNIPPET_APPROVED`
  - `accepted` → `AI_RESPONSE_ACCEPTED`
  - No internal PING model — HTTP JSON only.
- Documented in plan; built in a later implementation slice (host component, not in-repo).

#### H.3 Deferred producers (documented, not built now)
- Hermes (external host at `C:\Users\nolan\AppData\Local\hermes\hermes-agent\`) — bridge reads its mission outputs → `/ingest`. No direct store access.
- Browser extension, voice transcription, terminal history (PSReadLine), Advanced Paste telemetry, IDE extensions (autocomplete, Phase I).

**Exit criteria:** at least 3 in-repo producers (clipboard, git, logs) POST through `/ingest`; a PowerShell smoke test proves end-to-end: `Invoke-RestMethod -Uri http://localhost:8080/ingest` → event visible in `/mc/inbox` → worker chain → Qdrant → knowledge graph.

---

### Phase I — Autocomplete (Phase 5; NOT an IME)

**Goal:** An intelligent completion engine. Suggestions prioritized by (in order): frequently typed, PING code patterns, architectural terminology, constitutional vocabulary, repeated commands, recent conversations, repo context, git branch, active mission, current file.

- **CREATE** `gateway/routes/autocomplete.js` — completion endpoint (or extend existing `routes/ollama.js` `/api/v1/autocomplete` if it's the same concern — check first).
  - Context assembly: recent snippets (knowledge graph), repo files (canonical File objects), active mission, git branch.
  - Generation: local Ollama `qwen2.5-coder:14b` via `aiRuntime.chat`.
  - Rerank: `EvidenceAuthority.rank`.
- **CREATE** editor extension (later slice) — VS Code/Cursor InlineCompletion provider speaking the OpenAI-compatible endpoint. **Never an IME** (no text-input interception).

**Exit criteria:** completion endpoint returns context-aware suggestions with evidence; a test proves ranking prioritizes frequent + repo-relevant terms.

---

### Phase J — Self-healing + metrics (Phases 8 + 10)

**Goal:** Detect broken writers, dead queues, missing embeddings, disconnected graph nodes, failed Ollama calls, stale indexes. Emit constitutional events on failure. Never silently ignore.

#### J.1 Self-healing
- **MODIFY** `gateway/bootstrap/gateway_runtime.js` — extend health checks (Phase B) into a periodic pipeline monitor:
  - Check queue depth (unprocessed `ping_events`), embedding latency, Qdrant collection size, Ollama health, knowledge graph connectivity (orphan edges).
  - On failure: emit `SYSTEM_HEALTH_CHECK`-class event with failure detail (existing event type) — never silent.
  - Safe auto-repair: re-create missing Qdrant collection, retry failed Ollama calls, mark dead queue entries. Anything else → constitutional event.
- No new subsystem — a monitor loop over existing services.

#### J.2 Metrics
- **CREATE** `ping-runtime/telemetry/pipeline_metrics.js` — counters: autocomplete acceptance rate, retrieval accuracy, embedding latency, ingestion latency, duplicate reduction, graph connectivity, suggestion usefulness, knowledge reuse, search precision, constitutional compliance. Exposed at `/ops/pipeline` (extend `routes/ops.js` — existing route group).
- **MODIFY** existing probe points to emit/report metrics.

**Exit criteria:** `/ops/pipeline` returns all 10 metrics; failures produce events, not silence.

---

## 4. Constraints & Rules (binding)

1. **No duplicates.** Every new file in this plan is a named, defined single instance (ingest route, EmbeddingService, EvidenceAuthority, KnowledgePromoter, NamespaceAuthority, pipeline monitor). If a component already exists with the same purpose, we extend it — we never write a parallel.
2. **Never handwrite what exists.** Reuse: `canonical_object.js`, `UnifiedEventRuntime`, `EventValidator`, `EventGovernance`, `QdrantAdapter`, `aiRuntime`/`OllamaProvider`, `KnowledgeGraph`, `EventBridge`, `canonical_workers.js`, `business_emitters.js`, `event_generator.js`.
3. **Behavior Preservation Gate.** No deletion before a working replacement is wired and tested. Deletion is the last step.
4. **Naming collisions checked before every CREATE.** Before creating `NamespaceAuthority`, verify `runtime/security/` doesn't already define it (git history shows a `runtime/security` package exists). Collision rule: if a name exists with the same purpose → extend; if a name exists with different purpose → choose a distinct name (`CanonicalNamespaceAuthority`).
5. **`event_generator.js` is the source of truth for event types.** `event_registry.json` is generated output. Never edit the JSON directly.
6. **Adapters never become business logic.** Producers translate external input into `POST /ingest` JSON. They hold no PING schema, no IDs, no validation logic.
7. **No new storage.** Postgres (existing tables + additive columns), Qdrant (existing collection semantics via `QdrantAdapter`), Ollama (existing provider). Neo4j remains dormant — activated only under a documented trigger.
8. **Everything observable.** Each stage returns/emits status. Nothing silently fails.
9. **CRC discipline.** Every PR answers: CRC before/after (per gateway/AGENTS.md). These phases increase CRC because `/ingest` and downstream routing go through constitutional components (`canonical_object.js`, `UnifiedEventRuntime`, authorities) rather than direct SQL.

---

## 5. Phase order and dependencies

```
A (boundary) ──→ B (broken wires) ──→ C (embedding) ──→ D (graph writes)
                                              │              │
                                              └──────┬───────┘
                                                     ▼
                                              E (evidence/retrieval)
                                                     │
                                              F (knowledge promotion) ← approval events
                                                     │
                                              G (namespace enforcement — gates all)
                                                     │
                                              H (producers) → I (autocomplete) → J (self-healing/metrics)
```

**Slicing recommendation (each slice independently testable, no half-finished features):**
- **Slice 1:** Phase A + B + C + D → "canonical observation to namespaced Qdrant point + knowledge node, no governance rejections, Ollama reachable." This is the first end-to-end working slice.
- **Slice 2:** Phase E + F → retrieval with evidence + approval-gated knowledge.
- **Slice 3:** Phase G + H → namespace enforcement + producers.
- **Slice 4:** Phase I + J → autocomplete + self-healing + metrics.

## 6. Exit criteria for the overall mission

1. One `POST /ingest` boundary; every producer uses it; no subsystem bypasses canonicalization.
2. Worker chain emits without governance rejection; vectors flow to Qdrant; knowledge graph populates automatically.
3. Retrieval returns evidence-verified, namespaced results.
4. Nothing becomes permanent knowledge without explicit approval.
5. Namespaces are structurally enforced at every layer.
6. Self-healing detects and reports every failure via constitutional events.
7. 10 success metrics tracked and improving.
8. Zero parallel implementations added.

**Constitutional law — one reality:** "If it wasn't canonicalized, it doesn't exist."
