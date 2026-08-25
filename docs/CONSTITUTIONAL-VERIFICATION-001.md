# CONSTITUTIONAL-VERIFICATION-001

**Date:** 2026-08-24
**Branch:** `constitutional-trunk` @ `85c2aaff`
**Author:** Systematic invariant audit
**Status:** V1 — behavior coverage matrix established

---

## 0. Executive Summary

This document is the **behavior coverage matrix** for PING's constitutional runtime. It answers a single question: *what can this runtime prove about itself?*

**47 invariants** identified across 11 categories. **41 fully covered** by tests, **5 partially covered**, **1 structural-only** (asserted by design, no test). Coverage is strongest on mission lifecycle, namespace privacy, confidence propagation, and governance. Weakest on connector registry, AI provider interface, and serializer rejection paths.

This is the foundation. From here:
- **Phase C** (next): canonical trace contract — define what a trace record must carry
- **Phase D**: eval harness — 8 deterministic scenarios that prove invariants hold under stress
- **Phase E**: mission lifecycle review for saga-like compensation (saga files don't exist)
- **Phase F**: formal object model review
- **Phase G**: replay kernel forensic review (4 implementations)

---

## 1. Invariant Inventory

### A. Identity & Determinism (7 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-001 | Event IDs are content-derived SHA-256 of `{eventType, source, [namespace], logical_id\|payload}` — same logical event → same ID (idempotent retries) | `unified_event_runtime.js:74-83` | `test_event_spine_time_authority.js`, `test_confidence_convergence.js` |
| INV-002 | Mission IDs are deterministic: SHA-256 of `missionType:event_id`, truncated 16 hex + `ON CONFLICT DO NOTHING` prevents duplicate missions per event | `mission_runtime.js:63-83` | `test_mission_runtime_time_authority.js`, `test_durable_mission_lifecycle.js` |
| INV-003 | Canonical object IDs are content-addressed via `identityAuthority.generateFromCanonicalHash(canonicalBytes, kind)` — never invented | `canonical_object.js:98` | `test_canonical_object.js`, `test_ingest_boundary.js` |
| INV-004 | All ID generation flows through IdentityAuthority; throws on non-Buffer canonical bytes input | `runtime/kernel/authorities/identity_authority.js` | **PARTIAL** — `test_p001_p005.js:206` (contract), no direct throw-path unit test |
| INV-005 | Single canonical serializer; `CanonicalBytes.serialize()` rejects raw Buffer input; objects serialized with sorted keys, arrays ordered | `runtime/kernel/authorities/canonical_authority.js:55-57` | **PARTIAL** — exercised transitively via `test_canonical_object.js`; no direct reject-path test |
| INV-006 | No observable behavior depends on physical time — all timestamps via `constitutionalTimeAuthority`; ConstitutionalClock replay mode returns fixed `_replayTime` | `constitutional_clock.js`; shim `constitutional_time_authority.js` | YES — 15+ regression tests assert source imports it |
| INV-007 | Volatile timestamp fields stripped before logical identity derivation so retries hash identically (no Date.now() leakage into identity) | `canonicalization_service.js:34-38,89-94` | YES — `test_ingest_boundary.js` (idempotent re-ingest cases) |

### B. Canonical Object Envelope (2 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-008 | Exactly one canonical envelope; `createCanonicalObject()` requires `kind`, object `payload`, `authority` or it throws | `canonical_object.js:70-73` | `test_canonical_object.js` (13 tests) |
| INV-009 | Tamper detection: `verifyCanonicalObject()` recomputes canonical hash from payload; mismatch → `{valid:false}` | `canonical_object.js:155-165` | `test_canonical_object.js`, used by `test_canonical_object_generator.js:19` |

### C. Event Governance & Emission Spine (7 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-010 | Runtime REJECTS invalid events, never warns: non-object → `INVALID_EVENT_OBJECT`, missing type → `MISSING_EVENT_TYPE` | `event_governance.js:143-149,206-211` | `test_wave3b_p7_governance.js` |
| INV-011 | Unregistered event types rejected: `UNREGISTERED_EVENT` | `event_governance.js:151-154` | `test_wave3b_p7_governance.js`; also `unified_event_runtime.js:86-99`, `test_events_routes.js` |
| INV-012 | Authority-owner mismatch rejected: `OWNER_MISMATCH` (declared owner must equal policy owner) | `event_governance.js:156-158` | `test_wave3b_p7_governance.js` |
| INV-013 | Event registry is load-time strict: validator throws if `event_registry.json` missing, missing required fields, or event missing `event_type` | `event_validator.js:21,39,47` | `test_p040_generated_authoritative.js` (29 tests), `test_wave2_generators.js` |
| INV-014 | Persistence dedup: `INSERT ... ON CONFLICT (event_id) DO NOTHING`; rowCount distinguishes persisted vs deduplicated counters | `unified_event_runtime.js:148-158` | `test_causal_traversal.js`, `test_pipeline_bridge.js` |
| INV-015 | Correlation chain preservation: spine defaults `correlation_id = eventId`; bridge threads root correlation through missions; workers inherit triggering event's correlation_id; `causation_id = triggering event_id` at every hop | `unified_event_runtime.js:135-136`; `event_to_mission_bridge.js:121-129`; `canonical_workers.js:44-52` | `test_correlation_chain.js`, `test_commissioning.js` |
| INV-016 | Confidence is carried, not computed, by the spine; explicit value preserved exactly, inherited gets `confidence_source:'inherited'`, neither → explicit null (never fabricated to a default) | `unified_event_runtime.js:123-124,137-139`; `canonical_workers.js:53-71`; `intelligence_worker.js:38-52` | `test_confidence_spine.js`, `test_confidence_transport.js`, `test_confidence_convergence.js` (12/12 T1-T10 matrix) |

### D. Namespace / Privacy Boundary (5 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-017 | Canonical namespace format `core::<name>` \| `tenant::<id>` enforced at boundary: `NAMESPACE_RE`; invalid → throw (service) / `INVALID_NAMESPACE` (governance) | `canonicalization_service.js:30,59-61`; `event_governance.js:164-167,193-204` | `test_ingest_boundary.js`, `test_slice3a_convergence.js` (S3A-1) |
| INV-018 | Event-type-prefix namespace ownership policy: every namespace must have an owner (`NAMESPACE_OWNERS`); unknown/no-owner → `NAMESPACE_VIOLATION` | `event_governance.js:169-172,182-191` | `test_wave3b_p7_governance.js` (32/32) |
| INV-019 | The spine is the single owner of the `core::system` default — resolved exactly once in `emit()` step 3; all downstream fallbacks removed | `unified_event_runtime.js:101-106` | `test_slice3a_convergence.js` (no-duplicate-defaulting spy tests) |
| INV-020 | Privacy boundary survives worker chain: dispatch stamps `worker._event`; `BaseWorker._emit` preserves triggering namespace (both canonical and intelligence inline variants) | `worker_runtime.js:84-88`; `canonical_workers.js:35-39`; `intelligence_worker.js:27-30` | `test_phase_d_namespace.js` (D3/D4), `test_slice3a_convergence.js` |
| INV-021 | Retrieval privacy: HybridSearch structurally drops Qdrant hits whose payload namespace ≠ query namespace; KnowledgeGraph queries filter `AND namespace = $n` | `hybrid_search.js:57`; `knowledge_graph.js:156-158` | `test_knowledge_search.js` (E1 namespace-drop), `test_phase_d_namespace.js` (D1 filtering) |

### E. Priority Boundary (1 invariant)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-022 | All priorities normalize onto single canonical int scale 0–3 (0=system,1=routine,2=new-entity,3=revenue-critical) at the single ingress via `canonicalPriority()`; adapter accepts ORCA 1–10 and string scales; module is ADAPTER ONLY (no business logic rule) | `priority_boundary.js` (maps + header rule); consumed at `event_to_mission_bridge.js:134` | `test_priority_boundary.js` (33 tests), `test_priority_bridge_integration.js` (49 tests) |

### F. Evidence Authority & Retrieval (4 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-023 | EvidenceAuthority cannot exist without persistence: constructor throws unless `pool` or `eventRuntime` injected | `evidence_authority.js:30-32` | `test_evidence_authority.js` (12 tests) |
| INV-024 | Trace on every result: Qdrant hits verified by tracing `payload.source_event_id` back to a real `ping_events` row; ghost hits → `verified:false` (never silently dropped); backing-row namespace + canonical_hash must match | `evidence_authority.js:76-138` | `test_knowledge_search.js` (E1/E2 incl. ghost-hit case), `test_evidence_authority.js` |
| INV-025 | Ranking law: null confidence ranks neutral 0.5 (never fabricated upward); approved ×1.2; rejected ×0.2; fallback embeddings ×0.5; rank_score never clobbers caller's score | `evidence_authority.js:149-172` | `test_evidence_authority.js`, `test_confidence_transport.js`, `test_knowledge_search.js` (E3/F1) |
| INV-026 | Hybrid search is ADD-only (reads Qdrant/Postgres, never writes); every result carries trace shape `{canonical_hash, namespace, confidence, evidence[], verified, source}` | `hybrid_search.js:10-16,66-78` | **STRUCTURAL** — result-shape checks in `test_knowledge_search.js` |

### G. Worker Runtime & Dispatch (7 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-027 | Workers must implement `handle(event)` — abstract BaseWorker throws; registration throws if handle is not a function | `canonical_workers.js:27-29`; `intelligence_worker.js:24`; `worker_runtime.js:31-33`; `worker_port.js:90-102` | YES — `test_dormant_worker_gate.js`, `test_decision_graph.js` |
| INV-028 | Empty `eventTypes` = dormant: dormant workers match nothing (catch-all matching removed) | `worker_runtime.js:75-78` | YES — `test_dormant_worker_gate.js` (dedicated suite) |
| INV-029 | Single dispatch path: `_poll()` disabled; workers receive events only via `dispatch()` (MissionScheduler is sole dispatcher) — prevents dual-input races | `worker_runtime.js:48-56` | YES — `test_dormant_worker_gate.js`, `test_durability_invariants.js` |
| INV-030 | Worker failures propagate: dispatch catches, records failure, then **rethrows** to caller (P0-2) so scheduler can retry/fail — swallow path removed | `worker_runtime.js:91-96` | YES — `test_durable_mission_lifecycle.js`, `test_phase0_fixes.js` |
| INV-031 | Worker emission requires EventRuntime: `_emit` throws without one; non-ok emit result throws with reason | `canonical_workers.js:31-34,79-81`; `intelligence_worker.js:25-26,56` | YES — exercised in `test_phase_d_namespace.js`/`test_confidence_*`; direct throw-path in slice3a tests |
| INV-032 | AI providers must declare required interface — registration throws listing missing methods | `ai_runtime.js:30` | **PARTIAL** — no dedicated ping-runtime suite found |
| INV-033 | Connector registry: duplicate names rejected; interface compliance enforced (missing methods → throw) | `connector_registry.js:37,44` | **NO** — no test found |

### H. Mission Lifecycle State Machine (7 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-034 | Atomic claim: conditional UPDATE guards `status='created'`; claim + claimed_at + 60s lease set in same mutation; second claim rejected (rowCount 0) — assignment can't be stolen | `mission_runtime.js:106-121` | `test_durable_mission_lifecycle.js` (race case), `test_lease_renewal.js` |
| INV-035 | Forward-only transitions: start only from `assigned`; complete only from `running`; fail from `running/assigned/retry_pending` — completed/failed missions never overwritten | `mission_runtime.js:129-132,159-161,172-176` | `test_durable_mission_lifecycle.js` (double-completion + late-failure proofs), `test_durability_invariants.js` |
| INV-036 | Retry has backoff gate: `failWithRetry` sets `retry_pending`+`retry_at`, increments retries; exhaustion at `max_attempts` (default 3) → permanent `failed`; retry_pending invisible until `retry_at` elapses | `mission_runtime.js:202-239`; visibility rule in `getPending()` :306-315 | `test_durable_mission_lifecycle.js` (exhaustion + DLQ routing) |
| INV-037 | Lease renewal only touches `running/assigned` with `lease_until IS NOT NULL` — completed/failed untouched; runs BEFORE reaping each poll cycle | `mission_runtime.js:254-264` | `test_lease_renewal.js`, ordering proven in `test_lease_reaping.js` |
| INV-038 | Expired-lease reaping resets orphaned missions to `created` (available) only when `lease_until < NOW()` — never duplicates live work | `mission_runtime.js:277-298` | `test_lease_reaping.js` (4 tests) |
| INV-039 | Scheduler idempotency: missions already assigned/running are skipped on subsequent polls | `mission_scheduler.js` (skip guard) | `test_commissioning.js` (14 scenarios, deterministic replay PASS) |
| INV-040 | Trace integrity: mission trace resolves root `correlation_id` via triggering event (mission_id is a sha256 hash, never a correlation_id) and returns full ordered event chain | `mission_runtime.js:341-394` | `test_mission_trace.js` |

### I. Knowledge Promotion & Graph (3 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-041 | Observation ≠ knowledge: nodes default `status='candidate'`, `namespace` NOT NULL default `core::system`; promotion to approved(1.0)/rejected(0.2) ONLY via human approval events (`SNIPPET_APPROVED/AI_RESPONSE_ACCEPTED` vs `*_REJECTED`) | `knowledge_graph.js:33-40,76-77`; `knowledge_promoter.js:22-23,50-51` | `test_knowledge_search.js` (F1 approve/reject/notFound, F2 registry) |
| INV-042 | Promotion is ADD-only state transition keyed by `source_event_id` — node data never rewritten; optional namespace guard on update | `knowledge_graph.js:83-108` | `test_knowledge_search.js` F1 |
| INV-043 | Promoter requires a KnowledgeGraph (constructor throws otherwise); unhandled event types return no-op result rather than throwing | `knowledge_promoter.js:30-32,46-48` | `test_knowledge_search.js` |

### J. Embedding / Projection (2 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-044 | EmbeddingService requires aiRuntime; projection to Qdrant requires qdrantAdapter AND an id (canonicalObject.id or event_id) — throws otherwise | `embedding_service.js:96,198-200,237` | **PARTIAL** — exercised via `test_phase0_fixes.js` E2E chain; no direct throw-path unit suite |
| INV-045 | Dual projection owners (EmbeddingService.subscribe + ProjectionWorker) are idempotent by event_id | `embedding_service.js` subscribe(); workers/projection path | YES — `test_phase0_fixes.js` (8/8) |

### K. HTTP Boundary (2 invariants)

| ID | Invariant | Enforced at | Test |
|----|-----------|-------------|------|
| INV-046 | Every external observation crosses the canonicalization boundary ("if it wasn't canonicalized, it doesn't exist"): route validates source(string)/eventType(string)/payload(object); invalid → 400; governance/validator rejection → 422; success → 201 with envelope + `verified` flag | `routes/ingest.js`; `canonicalization_service.js:109-168` | `test_ingest_boundary.js` (24 tests) |
| INV-047 | POST /events converged onto canonical spine: routes through `eventRuntime.emit()`; missing fields throw; governance rejections surfaced with reason | `routes/events.js`; wired in `gateway_runtime.js` | `test_events_routes.js` (8 tests) |

---

## 2. Coverage Matrix

### Summary

| Category | Total | Covered | Partial | Gap |
|----------|-------|---------|---------|-----|
| Identity & Determinism | 7 | 5 | 2 | INV-004 throw path, INV-005 reject path |
| Canonical Envelope | 2 | 2 | 0 | — |
| Event Governance | 7 | 7 | 0 | — |
| Namespace / Privacy | 5 | 5 | 0 | — |
| Priority Boundary | 1 | 1 | 0 | — |
| Evidence & Retrieval | 4 | 3 | 1 | INV-026 structural only |
| Worker Runtime | 7 | 5 | 2 | INV-032 AI interface, INV-033 connector registry |
| Mission Lifecycle | 7 | 7 | 0 | — |
| Knowledge Graph | 3 | 3 | 0 | — |
| Embedding / Projection | 2 | 1 | 1 | INV-044 throw path |
| HTTP Boundary | 2 | 2 | 0 | — |
| **TOTAL** | **47** | **41** | **5** | **1 structural** |

### Coverage by Test Suite (top contributors)

| Test Suite | Assertions | Invariants Covered |
|------------|------------|-------------------|
| `test_commissioning.js` | 14 scenarios, 0 failed | INV-015, INV-039, INV-016 |
| `test_durable_mission_lifecycle.js` | ~40 | INV-034, INV-035, INV-036, INV-040 |
| `test_ingest_boundary.js` | 24 | INV-046, INV-007, INV-017, INV-003 |
| `test_knowledge_search.js` | 10 | INV-024, INV-025, INV-041, INV-042, INV-021 |
| `test_wave3b_p7_governance.js` | 32 | INV-010, INV-011, INV-012, INV-018 |
| `test_canonical_object.js` | 13 | INV-008, INV-009, INV-003 |
| `test_canonical_object_generator.js` | 21 | INV-009 |
| `test_evidence_authority.js` | 12 | INV-023, INV-024, INV-025 |
| `test_phase_d_namespace.js` | 7 | INV-020, INV-021 |
| `test_slice3a_convergence.js` | 8 | INV-017, INV-019, INV-020, INV-031 |
| `test_priority_boundary.js` | 33 | INV-022 |
| `test_priority_bridge_integration.js` | 49 | INV-022 |
| `test_p040_generated_authoritative.js` | 29 | INV-013 |
| `test_wave2_generators.js` | 39 | INV-013 |
| `test_events_routes.js` | 8 | INV-047 |
| `test_confidence_convergence.js` | 12 (T1-T10) | INV-016 |
| `test_correlation_chain.js` | 5 | INV-015 |
| `test_phase0_fixes.js` | 8 | INV-044, INV-045, INV-030 |
| `test_dormant_worker_gate.js` | 5+ | INV-027, INV-028, INV-029 |
| `test_lease_renewal.js` | 4 | INV-037 |
| `test_lease_reaping.js` | 4 | INV-038 |

---

## 3. Gap Analysis

### Fully Untested Invariants

| ID | Invariant | Severity | Remediation |
|----|-----------|----------|-------------|
| INV-033 | Connector registry duplicate/interface rejection | **MEDIUM** | Write `test_connector_registry.js` — duplicate name, missing method, successful registration |
| INV-032 | AI provider interface declaration enforcement | **LOW** | Write `test_ai_runtime.js` — missing method rejection |
| INV-004 | IdentityAuthority throw on non-Buffer input | **LOW** | Add throw-path test to existing `test_canonical_object.js` |
| INV-005 | CanonicalBytes.serialize() reject raw Buffer | **LOW** | Add reject-path test to existing `test_canonical_object.js` |
| INV-044 | EmbeddingService throw paths | **LOW** | Add throw-path tests to `test_phase0_fixes.js` or new suite |

### Structural Invariant (design-level, not testable)

| ID | Invariant | Notes |
|----|-----------|-------|
| INV-026 | Hybrid search ADD-only + trace shape | Verified by `test_knowledge_search.js` result-shape assertions; "structural" means the contract is enforced by code design (constructor injection, no write methods) rather than explicit test |

### Known Test Infrastructure Gaps

1. **No `test_connector_registry.js`** — connector registry has zero test coverage
2. **No `test_ai_runtime.js`** — AI provider registration has zero test coverage
3. **E2E chain tests don't cover Qdrant projection** — Docker-dependent, currently PENDING_LIVE_E2E
4. **No replay/lineage/witness tests** — these stages are dormant (nothing emits REPLAY_VERIFY)

---

## 4. Trace Contract (Phase C Draft)

### Current Trace Fields (production spine)

Every event emitted through `UnifiedEventRuntime` carries:

```
event_id          : string  — SHA-256 content-derived (INV-001)
event_type        : string  — governance-validated (INV-011)
source            : string  — producer identifier
timestamp         : string  — ISO-8601 via ConstitutionalTimeAuthority (INV-006)
namespace         : string  — core::<name> | tenant::<id> (INV-017)
causation_id      : string  — triggering event_id (INV-015)
correlation_id    : string  — root event_id for chain (INV-015)
payload           : object  — business data
metadata          : object  — optional enrichment
```

### Mission Lifecycle Trace Fields

```
mission_id        : string  — SHA-256 deterministic (INV-002)
mission_type      : string  — from EVENT_MISSION_MAP
status            : enum    — created→assigned→running→completed/failed/retry_pending
priority          : int     — canonical 0-3 (INV-022)
assigned_to       : string  — worker name
retries           : int     — current retry count
max_attempts      : int     — retry ceiling (default 3)
lease_until       : timestamptz — 60s sliding window (INV-037)
claimed_at        : timestamptz — when assigned
error             : text    — failure reason
result            : jsonb   — worker output
```

### Missing Fields (Phase C candidates)

| Field | Purpose | Priority |
|-------|---------|----------|
| `attempt_number` | Which retry attempt produced this result | HIGH |
| `dispatch_outcome` | `dispatched` / `skipped_capacity` / `no_worker_matched` / `dormant` | HIGH |
| `degradation_reason` | Why degraded (no worker, no model, etc.) | MEDIUM |
| `span_id` | OpenTelemetry-style trace grouping | LOW |
| `parent_span_id` | Causal parent within a single event's processing | LOW |
| `lifecycle_state` | Full mission lifecycle state at trace time | MEDIUM |
| `evaluation_score` | For future eval harness integration | LOW |

---

## 5. Eval Harness Scenarios (Phase D Draft)

Eight deterministic scenarios to prove invariants hold under stress:

### EVAL-001: Idempotent Re-Ingest
**Invariant:** INV-001, INV-007, INV-014
**Input:** Same REVIEW_RECEIVED event ingested twice
**Expected:** Second ingest returns same event_id, 0 new missions created, ping_events count unchanged

### EVAL-002: Namespace Privacy Under Chain
**Invariant:** INV-017, INV-020, INV-021
**Input:** `tenant::hpp` event → observation → claim → classification → recommendation → projection
**Expected:** All downstream events carry `tenant::hpp`; HybridSearch with `core::system` query never returns these results

### EVAL-003: Confidence Null Propagation
**Invariant:** INV-016
**Input:** Event with no confidence field → full worker chain
**Expected:** Every downstream event has `confidence: null` (never 0.5, 0.7, 0.85, or 1.0 fabricated)

### EVAL-004: Priority Canonicalization
**Invariant:** INV-022
**Input:** Mission with `priority: 'urgent'` (string scale)
**Expected:** Bridge normalizes to `3` (canonical); scheduler dispatches correctly

### EVAL-005: Governance Rejection Surfacing
**Invariant:** INV-010, INV-011, INV-012
**Input:** Event with unregistered type `FAKE_EVENT`
**Expected:** POST /events returns 422 with `code: 'UNREGISTERED_EVENT'` and reason

### EVAL-006: Mission Double-Completion Prevention
**Invariant:** INV-035
**Input:** Two concurrent `complete()` calls on same running mission
**Expected:** First succeeds, second returns `rowCount: 0` (no overwrite)

### EVAL-007: Worker Failure Propagation
**Invariant:** INV-030
**Input:** Worker throws during `handle(event)`
**Expected:** dispatch() rethrows, mission transitions to `failed` (or `retry_pending` if retries remain)

### EVAL-008: Knowledge Promotion Requires Human Approval
**Invariant:** INV-041, INV-042
**Input:** Worker emits CLAIM_GENERATED → knowledge node created as `candidate`
**Expected:** Node status remains `candidate`; only SNIPPET_APPROVED promotes to `approved` with confidence 1.0

---

## 6. Constitutional Law Compliance

| Law | Status | Evidence |
|-----|--------|----------|
| **TRUTH_LAW** | ✅ | Immutable verified events; observation ≠ knowledge (INV-041) |
| **EVENT_LAW** | ✅ | 6 event classes enforced; governance validates types (INV-010-013) |
| **IDENTITY_LAW** | ✅ | Content-derived deterministic IDs (INV-001-003, INV-007) |
| **TIME_LAW** | ✅ | All timestamps via ConstitutionalTimeAuthority (INV-006) |
| **HASH_LAW** | ✅ | Single canonical serializer (INV-005), canonical hash on objects (INV-009) |
| **NAMESPACE_LAW** | ✅ | Privacy boundary enforced at spine + retrieval (INV-017-021) |
| **PRIORITY_LAW** | ✅ | Single canonical scale 0-3 at ingress (INV-022) |
| **EVIDENCE_LAW** | ✅ | Trace on every result; ranking with null neutrality (INV-023-025) |
| **REPLAY_LAW** | ⚠️ | Structural: deterministic event IDs enable replay; replay chain dormant (no REPLAY_VERIFY emitter) |
| **CANONICAL_BOUNDARY_LAW** | ✅ | Every external observation crosses boundary (INV-046-047) |

---

## 7. Next Steps

1. **Phase C (next):** Define canonical trace contract — `attempt_number`, `dispatch_outcome`, `degradation_reason` as required fields on every mission trace
2. **Phase D:** Create `evals/constitutional-runtime/` directory with 8 EVAL-001 through EVAL-008 scenario scripts
3. **Phase E:** Review mission lifecycle for saga-like compensation (saga files don't exist — analyze existing DLQ + retry for compensation semantics)
4. **Phase F:** Formal object model — 7 incompatible representations need convergence path
5. **Phase G:** Replay kernel forensic — 4 implementations, prove compatibility with canonical event envelope
6. **Write missing tests:** `test_connector_registry.js` (INV-033), `test_ai_runtime.js` (INV-032), throw-path tests for INV-004/005/044
