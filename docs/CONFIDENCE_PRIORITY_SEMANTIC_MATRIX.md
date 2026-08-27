# CONFIDENCE_PRIORITY_SEMANTIC_MATRIX

Status: SPEC (P2) — Step 8 of the Replay Convergence mandate
Date: 2026-08-21
Scope: Every confidence and priority value on the live production execution path.

Purpose: trace each semantic (confidence, priority) from its canonical authority
through adapters, persistence boundaries, and downstream consumers, classifying
every value as PRESERVED / TRANSFORMED / INCORRECTLY-RECREATED, and inventory the
residual incompatible scales. This matrix is built BEFORE any boundary fix — the
mandate's order. It documents the CURRENT (verified) state and corrects stale
prior-session claims where first-hand evidence shows convergence.

Cross-references: `docs/CONFIDENCE-SEMANTICS-001.md` (confidence propagation
contract), `ping-runtime/boundaries/priority_boundary.js` (single priority
normalization adapter), `docs/CANONICAL-TRACE-CONTRACT-001.md`.

---

## 1. Confidence — Canonical Authority

- **Canonical value location**: `ping_events.metadata.confidence` — a JSONB field
  inside the event `metadata` object, written by `UnifiedEventRuntime.emit()`.
  There is **NO dedicated `confidence` column** on `ping_events` (DDL
  `unified_event_runtime.js:44-50`: `metadata JSONB NOT NULL DEFAULT '{}'`).
- **The spine carries, never computes** (`unified_event_runtime.js:123-124,137-139`):
  `...options.metadata && options.metadata.confidence != null ? { confidence:
  options.metadata.confidence } : {}`. Absent/null confidence passes through with
  no key or `null` — never fabricated into a number.
- **Canonical authority = the producer that first assesses confidence**.
  Corrected (3-class) statement — the traced canonical live spine **transports**
  carry/inherit/null-preserving confidence, while **separate** confidence
  creation/default/recompute semantics exist at exactly three boundaries:
  1. **Canonical boundary default** — `CanonicalizationService`
     (`canonicalization_service.js:134,155`): `/ingest` caller omits confidence
     → asserts `0.5` (comment :104 "observations are not knowledge"). This is a
     deliberate creation/default at the boundary, provenance-marked. The
     envelope-level default `confidence = 1.0` (`canonical_object.js:86`) is the
     fallback only when `createCanonicalObject` is called without a value; on the
     `/ingest` path the service always supplies one, so `0.5` applies.
  2. **Local ranking fallback** — `EvidenceAuthority.rank`
     (`evidence_authority.js:161`): `confidence != null ? confidence : 0.5`.
     Local sort-only; never persists nor mutates the event/node confidence.
  3. **Promotion recompute** — `KnowledgePromoter` (human-approval signal →
     `1.0` or `0.2`). The only **recompute** authority (authorized, provenance
     recorded via `confidence_source: 'recomputed'`).
  All hops between these boundaries inherit/carry; none create, default, or
  recompute confidence on the worker chain itself.

### 1.1 Valid states (from CONFIDENCE-SEMANTICS-001 §1)

| State | Type | Meaning |
|-------|------|---------|
| number in [0.0,1.0] | real | explicitly assessed confidence |
| null | null | known unknown — not assessed |
| absent (no key) | undefined | distinct from null per JSONB |

Invariants (all re-verified against current source):
- null never becomes a number through propagation.
- numeric confidence survives unchanged unless an authorized authority recomputes.
- `||` must never be used for confidence defaults.

---

## 2. Confidence — Live Path Semantic Matrix (verified against CURRENT source)

| Hop | Producer | confidence handling | Source | Classification |
|-----|----------|--------------------|--------|----------------|
| 0 | POST /ingest caller | user-supplied or undefined | external | input |
| 1 | CanonicalizationService | `0.5` if undefined else user; `boundary_default` | intentional assertion | TRANSFORMED (asserted, provenance-marked) — boundary creation class; envelope fallback `1.0` (`canonical_object.js:86`) only if service passes nothing |
| 2 | UnifiedEventRuntime.emit | carries `options.metadata.confidence` | spine carries | PRESERVED |
| 3 | EventToMissionBridge | `event.metadata.confidence ?? null` | transport | PRESERVED |
| 4 | MissionScheduler | `payload.confidence ?? null` | transport | PRESERVED |
| 5 | BaseWorker._emit | `explicit wins; else inherited ?? null` + `confidence_source` | canonical rule (`canonical_workers.js:53-70`) | PRESERVED |
| 6a | ClassificationWorker | `upstreamConfidence ?? null`, `confidence_source:'inherited'` (`:541-542`) | NO recomputation | PRESERVED (PATCH 3A APPLIED) |
| 6b | RecommendationWorker | `classification.confidence ?? null`, `'inherited'` (`:606-607`) | NO recomputation | PRESERVED (PATCH 3B APPLIED) |
| 6c | IntelligenceWorker inline _emit | preserves `this._event?.metadata?.confidence` | (Slice 3A fix) | PRESERVED (Category 1 closed) |
| 7 | Graph projection | `event.metadata.confidence ?? null` (PATCH 2B) | no fabrication | PRESERVED |
| 8 | knowledge_graph.addNode | `options.confidence != null ? options.confidence : null` (`knowledge_graph.js:76+`) | no inflation | PRESERVED (PATCH 2A APPLIED) |
| 9 | EvidenceAuthority.rank | preserves null in `confidence`; neutral multiplier only for sort | no inflation | PRESERVED (PATCH 2C APPLIED) |
| 10 | KnowledgePromoter | human signal → `1.0`/`0.2`; provenance recorded | SON recommendation + approval | RECOMPUTED (authorized, only site) |

**Verdict on confidence transport**: every hop from spine to projection (hops 2-8)
is PRESERVED — **carry/inherit/null-preserving**. There is **no confidence
recomputation or fabrication on the live worker chain** — prior-session
"6a/6b/6c/7/8/9 fabrication" findings are all CLOSED by verified patches.
Corrected scope note: confidence **creation/default/recompute** is NOT absent —
it exists at exactly three boundaries (hop 1 CanonicalizationService boundary
default `0.5`/envelope `1.0`, EvidenceAuthority local rank fallback `0.5` [non-
persisting], KnowledgePromoter recompute `1.0`/`0.2`). The verdict applies to
**transport on the traced canonical live spine** — it does **not** claim
repository-wide absence of confidence computation, only that computation is
restricted to those three named boundaries.

### 2.1 Residual confidence gaps (honest inventory)

1. **Semantic meaning is not formalized across the observation/derived boundary.**
   A `0.85` on an `OBSERVATION_CREATED` (the event happened) and a `0.85` on a
   `RECOMMENDATION_CREATED` (the recommendation is good) share one numeric field
   but mean different things. No `confidence_boundary` adapter exists (unlike
   priority). This is a SEMANTIC gap, not a transport bug — the value is preserved
   correctly; its interpretation per-event-class is undefined by contract.
2. **`ping_events` keeps confidence inside JSONB metadata** (no dedicated column)
   while `knowledge_nodes` has a dedicated `confidence` + `confidence_provenance`
   column pair. Cross-store query consistency (events vs knowledge graph) requires
   `metadata->>'confidence'`. Not a correctness bug; an observability/query cost.
3. **IntelligenceWorker's AI-recompute path** is the one place a future recomputed
   confidence could appear. It is currently dormant (AI analysis disabled /
   Ollama unreachable). When activated it MUST record `confidence_source:
   'recomputed'`, `confidence_authority`, `confidence_formula` per CONFIDENCE-
   SEMANTICS-001 §3C — not yet exercised, so no active violation.

---

## 3. Priority — Canonical Authority

- **Canonical value column**: `ping_missions.priority INTEGER DEFAULT 0`
  (`mission_runtime.js:34`), with `idx_pm_priority ON ping_missions(priority DESC)`
  (`:50`). The scheduler sorts `ORDER BY priority DESC, created_at ASC` (`:311`).
- **Canonical scale**: **int 0-3** (0=system, 1=routine, 2=new-entity,
  3=revenue-critical).
- **Single ingress boundary**: `canonicalPriority()` in
  `ping-runtime/boundaries/priority_boundary.js` — an ADAPTER ONLY (maps values,
  no business logic). Called at exactly one site: `event_to_mission_bridge.js:134`
  `priority: canonicalPriority(mapping.priority)`.

### 3.1 Scale reconciliation (the formerly-claimed "4 incompatible scales")

Prior sessions claimed 4 incompatible priority scales live simultaneously
(bridge 0-3, Orca 1-10, string high/normal, computed p3-p9). Verified current
state: **ALL enter through the single `canonicalPriority` boundary** and are
normalized to canonical 0-3 at `event_to_mission_bridge.js:134` before the
mission INSERT. They are no longer "incompatible" — they are TRANSFORMED at the
single ingress.

**Explicit per-scale semantics** (from `priority_boundary.js:67-91`,
`canonicalPriority()`):

| Scale | Mapping rule | Ordering-preserved? | Tie behavior | Missing/invalid | Dormant-producer live risk |
|-------|--------------|--------------------|--------------|-----------------|----------------------------|
| canonical int 0-3 | identity `:69-71` | **YES** (monotonic identity) | none introduced | out-of-range int → falls through | — (is the live input) |
| Orca int 1-10 | `{1,2}→0,{3,4}→1,{5,6}→2,{7..10}→3` `:32-38,74-76` | **PARTIAL** (monotonic non-decreasing, 10→4 buckets) | **collapse** (e.g. 7 vs 10 both→3) | int outside 1-10 → `?? 1` routine | **LOW/none** — producer dormant (Orca engine.js not wired to bridge map) |
| string | `{low:0, normal:1, medium:2, high/critical/urgent:3}` `:43-50,85-87` | **PARTIAL** (intent-monotonic, but high/critical/urgent collapse→3) | **collapse** (high/critical/urgent identical) | unknown string → routine `1`; case-folded `toLowerCase()` | **LOW/none for ordering** — the string PRODUCERS are LIVE (ClassificationWorker+RecommendationWorker) but execution-inert: the bridge never feeds their payload strings to `canonicalPriority()` (uses static map int only), so the branch is bypassed and can never affect `ping_missions.priority`/sort. (IntelligenceWorker's separate string path is dormant.) |
| computed float 0-10 | `Math.floor(raw/2.5)` → `0,1,2,3` `:79-82` | **PARTIAL** (monotonic, quantized at 2.5 width) | **collapse** (within-bucket ties) | NaN/out-of-range → falls through to `1` | **LOW/none** — producer dormant (mission_compiler not wired to bridge) |

**Missing/invalid/ordering summary**: `canonicalPriority()` **silently defaults
any null/undefined/unrecognized value to `1` (routine)** — `:89-91`. The
scheduler's only tie-break is `created_at ASC` (secondary sort key
`mission_runtime.js:311`); none of the non-canonical scales contribute an
intra-bucket ordering, so all scale collapses surface as `created_at`-ordered
ties. **Important**: on the **live traced path** (`event_to_mission_bridge.js:134`
with the static `EVENT_MISSION_MAP.mapping.priority`), the value passed to
`canonicalPriority` is **already canonical int 0-3**, so the adapter exercises the
**identity branch only** (`:69-71`). The Orca/string/float mapping branches are
**present but unexercised at the boundary** — the tables/converters exist and are
correct, but the live bridge never feeds those scales into `canonicalPriority()`.
For the string branch specifically, its **producers are LIVE** (ClassificationWorker
+ RecommendationWorker emit `'urgent'|'high'|'medium'|'normal'` into canonical
payloads) but the string is **execution-order-inert**: it is stranded in the
mission payload and never reaches the boundary (the bridge reads only the static
`EVENT_MISSION_MAP` int at `:134`). There is NO live risk to `ping_missions.priority`
or scheduler ordering; a future consumer that reads `recommendation.priority`
expecting canonical 0-3 would be misled (documented in §3.3, not a live divergence).

### 3.2 Priority — live path matrix

| Hop | Producer | priority handling | Source | Classification |
|-----|----------|-------------------|--------|----------------|
| 0 | EVENT_MISSION_MAP | declared map value (any scale) | `event_to_mission_bridge.js:25-69` | input |
| 1 | bridge createMission | `canonicalPriority(mapping.priority)` | boundary adapter `:134` | TRANSFORMED→canonical 0-3 |
| 2 | mission_runtime INSERT | `options.priority || 0` into `INTEGER` col | canonical | PRESERVED |
| 3 | scheduler getPending | `ORDER BY priority DESC, created_at ASC` | authoritative sort | PRESERVED |
| 4 | MissionScheduler dispatch | payload.event_type used for routing; priority is metadata | dispatch | PRESERVED (priority not dispatch key) |

**Verdict on priority**: CONVERGED. One canonical scale, one normalization
boundary, one sort. The `priority_boundary.js` adapter is the single conversion
point and contains zero business logic.

### 3.3 Residual priority gaps (honest inventory)

1. **RecommendationWorker emits a STRING priority** (`canonical_workers.js:605`
   `priority: classification.priority || 'normal'`). Full first-hand trace
   (all 8 mechanical questions answered): (Q1) YES ClassificationWorker emits
   `classification.priority` via `_prioritize()` (canonical_workers.js:540,
   embedded in the classification object :535-549). (Q2) STRING domain only —
   `'urgent'|'high'|'medium'|'normal'` (default 'normal'); never int 0-3, never
   null. (Q3) RecommendationWorker reads `payload.classification || {}`
   (:595) and propagates it (`recommendation.priority = classification.priority
   || 'normal'` :605 → inside `recommendation` → RECOMMENDATION_CREATED
   :611-613; also colors `reason` :634-636). (Q4) **LIVE-reachable — YES**: both
   workers are in the live 8-worker chain; `REVIEW_RECEIVED` path yields a real
   string. (Q5) Propagates into the emitted canonical payload. (Q6) **Does NOT
   reach `canonicalPriority()`** — mission ordering uses the static
   `mapping.priority` int at bridge :134; the string is stranded in the payload.
   (Q7) Consumers: only canonical_workers.js reason text (:635-636) + the
   `recommendation.priority` payload; no downstream scheduling/ordering consumer
   (`intelligence_worker.js:126,138` reads its own AI priority — dormant).
   (Q8) **Classification: live string producers, execution-order-INERT** — both
   producers (ClassificationWorker, RecommendationWorker) are on the live path and
   emit the string into canonical payloads, **but it is insulated from ordering**:
   mission priority comes only from the static
   EVENT_MISSION_MAP → `canonicalPriority` int, never the payload string. The
   string scale is thus **live-in-payload / inert-in-execution** (NOT a dormant
   producer, NOT a live ordering divergence). It will mislead any future
   consumer that reads `recommendation.priority` expecting canonical 0-3, and
   violates the single-scale invariant at the payload surface even though the
   executive sort is unaffected.
2. **No consumer-exhaustive proof that every mission type routes through the
   boundary**: the boundary is exercised for all LIVE map rows. Orca's own
   priority is computed in a dormant path (`engine.js`) and only if that path is
   ever wired to createMission must it use `canonicalPriority` too (it is not
   wired today; documented, not a live violation).
3. **SYSTEM_AUDIT/SYSTEM_HEALTH_CHECK dormant routing gap** — documented in
   MISSION_LIFECYCLE_AND_ROUTING.md; not a priority-scale issue.

---

## 4. Canonical Authority → Adapter → Boundary Summary

| Semantic | Canonical authority | Adapter/boundary | Persistence | Downstream |
|----------|--------------------|------------------|-------------|------------|
| confidence | producer that first assesses; KnowledgePromoter is the only recompute authority | none needed (single continuous numeric scale, inherited) | `ping_events.metadata` JSONB (`metadata->>'confidence'`); `knowledge_nodes.confidence` column | EvidenceAuthority.rank, knowledge graph, promotion |
| priority | EVENT_MISSION_MAP → canonicalPriority | `ping-runtime/boundaries/priority_boundary.js` (adapter only) | `ping_missions.priority INTEGER` | scheduler `ORDER BY priority DESC` |

---

## 5. Corrected prior-session claims

| Prior claim | Current first-hand verdict |
|-------------|---------------------------|
| "8+ incompatible confidence sites recomputed at every hop" | CLOSED — all worker-chain hops now inherit; Classification/Recommendation no longer fabricate 0.85/0.7. Corrected scope: confidence creation/default/recompute still exists, but only at three named boundaries (CanonicalizationService boundary default, EvidenceAuthority local-rank fallback, KnowledgePromoter recompute) — not on the transport chain. |
| "4 incompatible priority scales live simultaneously" | CLOSED — all scales normalize through `canonicalPriority` at the single bridge ingress. |
| "confidence dropped at spine / no confidence column" | PARTIALLY CORRECT — spine has no dedicated column (JSONB metadata only), but confidence IS carried and persisted in metadata; workers no longer drop it. |
| "IntelligenceWorker drops namespace + confidence" | namespace fixed in Slice 3A; confidence preserved via inline `_emit` inheritance fix. |

---

## 6. Recommendation (no fix until approved; mandate order preserved)

1. **Formalize confidence semantics per event class** (observation vs derived).
   Introduce a `confidence_boundary` adapter mirroring `priority_boundary.js`
   (adapter only) ONLY IF a second confidence scale ever enters. Today confidence
   is single-scale; the gap is documentation of per-class meaning, not a fix.
2. **Correct the inert RecommendationWorker string priority** (`:605`) to canonical
   int or remove it from the record — small, but touches a worker; awaits approval.
3. **Document `metadata->>'confidence'` as the cross-store query path** for events
   vs knowledge graph consistency (observability cost, no code change).

Nothing in Sections 2-3 requires a production patch for correctness today. The
live path preserves both semantics correctly. Residual items are semantic/doc/
inert-consistency gaps, not transport or fabrication defects.
