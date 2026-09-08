# CONFIDENCE-SEMANTICS-001: Confidence Propagation Convergence

Status: SPEC (P2)
Date: 2026-08-21
Scope: Every confidence value on the live production event path

---

## 1. Semantic Model

### Canonical Value

`ping_events.metadata.confidence` — JSONB field inside the event metadata object,
persisted by UnifiedEventRuntime.emit(). Not a top-level column.

### Valid States

| State | Type | Meaning |
|-------|------|---------|
| number in [0.0, 1.0] | real | Explicitly assessed confidence |
| null | null | Known unknown — producer has not assessed confidence |
| absent (key missing) | undefined | Not set — distinct from null per JSONB semantics |

### Core Invariants

1. `null` means "not asserted." It is NOT 0.5. It is NOT 1.0. It is NOT any number.
2. `undefined` (absent key) is treated identically to `null` at every hop.
3. At no point does `null` or `undefined` become a number through propagation.
4. A numeric confidence survives all hops unchanged unless an authorized authority
   explicitly recomputes it.

### Inherited Confidence

A downstream event has "inherited confidence" when it carries forward the confidence
value from its triggering event without independent reassessment. The value is
identical to the parent's confidence. No provenance marker is needed for pure
inheritance — the event's `causation_id` already links to the source.

### Recomputed Confidence

A downstream event has "recomputed confidence" when a named authority applies a
documented formula or model to produce a new confidence value. Recomputation
REQUIRES:

- **Named authority**: which worker or authority recomputed (e.g., `ClassificationWorker`)
- **Explicit formula**: rule-based, ai-inference, approval-signal, or human-override
- **Provenance markers** in event metadata:
  - `confidence_source`: `'inherited'` | `'recomputed'` | `'boundary_default'`
  - `confidence_authority`: name of the recomputing authority (when recomputed)
  - `confidence_formula`: description of the formula (when recomputed)

### Boundary Default

The ingestion boundary applies `confidence: 0.5` when a producer omits confidence.
This is an INTENTIONAL ASSERTION, not a convenience default. The semantic meaning
is: "an observation from an external producer is not yet knowledge; its certainty
is 0.5 until the pipeline assesses it." This is stored as `confidence_source:
'boundary_default'` in event metadata.

The boundary default is applied at exactly one site:
`CanonicalizationService.canonicalizeAndEmit()` line 155.

### Ranking Behavior for Unknown Confidence

When a result has `confidence: null` (unknown), the ranking algorithm treats it
as neutral (multiplier 0.5) — below any explicit confidence assessment but above
rejected results. This is distinct from `confidence: 1.0` (fully certain) which
would rank higher. The `rank_score` output is numeric for sorting; the
`confidence` field on the result preserves the original null/numeric value.

### Explicit Prohibitions

1. **No silent fabrication**: `null`/`undefined` must NEVER become a number.
2. **No truth inflation**: `null` MUST NOT become `1.0` (knowledge_graph.addNode bug).
3. **No conditional fallback**: `||` operator MUST NOT be used for confidence defaults.
   Use explicit null checks: `value != null ? value : null`.
4. **No inherited recomputation**: a worker MUST NOT claim to recompute confidence
   by just copying the parent value with a different authority label.
5. **No dual-use defaults**: a single fallback value (e.g., `0.5`) MUST NOT serve
   both as "boundary assertion" and "legacy compatibility" without explicit labeling.

---

## 2. Live Path Confidence Matrix

| Hop | Producer | confidence | Source | Bug? |
|-----|----------|-----------|--------|------|
| 0 | POST /ingest caller | user-supplied or undefined | external | No |
| 1 | CanonicalizationService | 0.5 if undefined else user | boundary-default | No (intentional) |
| 2 | UnifiedEventRuntime.emit | carries options.metadata.confidence | spine | No |
| 3 | EventToMissionBridge | event.metadata.confidence or null | preserved | No |
| 4 | MissionScheduler | payload.confidence or null | preserved | No |
| 5 | BaseWorker._emit | options.confidence or parent metadata | preserved | No |
| 6a | ClassificationWorker | 0.85 (hardcoded) | FABRICATED | YES — Category 3 |
| 6b | RecommendationWorker | classification.confidence \|\| 0.7 | inherited-or-fabricated | YES — Category 3 |
| 6c | IntelligenceWorker inline _emit | DROPPED (no confidence logic) | lost | YES — Category 1 |
| 6d | IntelligenceWorker.classification | aiAnalysis?.confidence \|\| 0.85 | FABRICATED | YES — Category 3 |
| 7 | Graph Projection | event.metadata.confidence or 0.5 | inherited-or-fabricated | YES — Category 2 |
| 8 | knowledge_graph.addNode | options.confidence or 1.0 | inherited-or-inflated | YES — Category 2 |
| 9 | EvidenceAuthority.rank | result.confidence or 1.0 | inherited-or-inflated | YES — Category 2 |

---

## 3. Patch Plan (Ordered by Category)

### PATCH 1 — Transport Only (no producer semantics changed)

**PATCH 1A: IntelligenceWorker inline _emit (confidence drop)**
File: `ping-runtime/workers/intelligence_worker.js:38`
Current: `{ ...options, namespace, correlation_id }` — confidence not preserved.
Fix: add confidence preservation matching canonical BaseWorker._emit pattern.

**PATCH 1B: Verify bridge/scheduler transport**
Confirm that EventToMissionBridge and MissionScheduler already preserve null vs
numeric confidence without coercion. (Verified: both use `!= null` checks. No
patch needed — proof-only.)

**PATCH 1C: Verify BaseWorker._emit override semantics**
Confirm that explicit `options.confidence` wins over inherited `this._event?.metadata?.confidence`.
(Verified: line 56-58 already implements this. No patch needed — proof-only.)

### PATCH 2 — Null/Unknown Preservation (eliminate truth inflation)

**PATCH 2A: knowledge_graph.addNode (truth inflation)**
File: `ping-runtime/knowledge/knowledge_graph.js:76`
Current: `options.confidence || 1.0` — null becomes 1.0 (perfect knowledge).
Fix: `options.confidence != null ? options.confidence : null`
Status: APPLIED.

**PATCH 2B: Gateway graph projection (fabrication)**
File: `gateway/bootstrap/gateway_runtime.js:597`
Current: `event.metadata?.confidence != null ? event.metadata.confidence : 0.5`
Fix: `event.metadata?.confidence != null ? event.metadata.confidence : null`
Status: APPLIED.

**PATCH 2C: EvidenceAuthority.rank (truth inflation)**
File: `ping-runtime/evidence/evidence_authority.js:151`
Current: `typeof result.confidence === 'number' ? result.confidence : 1.0`
Fix: preserve null in `confidence` field; use `effectiveConfidence` (neutral 1.0)
for ranking when null. Result carries `confidence: null` (not `1.0`).
Status: APPLIED.

### PATCH 3 — Authorized Recomputation (requires authority semantics)

These patches are APPLIED ONLY AFTER the authority semantics in Section 1 are
established. Each patch must record provenance.

**PATCH 3A: ClassificationWorker (fabrication)**
File: `ping-runtime/workers/canonical_workers.js:333`
Current: `confidence: 0.85` (hardcoded).
Classification does not change the certainty that an event happened. The
observation's confidence IS the classification's confidence. Replace with
inherited confidence from `event.metadata?.confidence`.
Provenance: `confidence_source: 'inherited'` (no recomputation at this hop).

**PATCH 3B: RecommendationWorker (fabrication)**
File: `ping-runtime/workers/canonical_workers.js:397`
Current: `classification.confidence || 0.7` — fallback fabricates 0.7.
Pure propagation from classification. Replace with `classification.confidence`.
Null propagation: if classification has null confidence, recommendation inherits null.
Provenance: `confidence_source: 'inherited'`.

**PATCH 3C: IntelligenceWorker.classification.confidence (fabrication)**
File: `ping-runtime/workers/intelligence_worker.js:102`
Current: `aiAnalysis?.confidence || 0.85` — fabricates 0.85 when AI unavailable.
On the live path, AI analysis is disabled (Ollama unreachable from pipeline).
When active: inherit from `event.metadata?.confidence`. If AI analysis provides
a confidence value, that IS an authorized recomputation and must record:
`confidence_source: 'recomputed'`, `confidence_authority: 'IntelligenceWorker'`,
`confidence_formula: 'ai-inference'`.

**PATCH 3D: EvidenceAuthority — ranking semantics (already applied in 2C)**
The ranking behavior is defined in Section 1: null confidence → neutral multiplier
(1.0) without promotion. The result preserves `confidence: null`. This is the
defined behavior, not a fallback.

---

## 4. Test Plan

### Confidence Convergence Test Matrix

| # | Test | Proves |
|---|------|--------|
| T1 | POST /ingest with confidence 0.3 → ping_events.metadata.confidence = 0.3 | Explicit ingest survives to root |
| T2 | POST /ingest without confidence → ping_events.metadata.confidence = 0.5, confidence_source = 'boundary_default' | Boundary default is distinguishable |
| T3 | E2E chain with confidence 0.3 → ALL 8 downstream events carry 0.3 | Numeric confidence survives all hops |
| T4 | E2E chain with no confidence → null propagation (not 0.5/0.7/0.85/1.0) | null survives all hops |
| T5 | IntelligenceWorker._emit now preserves confidence | Category 1 transport fix proven |
| T6 | Explicit worker override wins over inheritance | BaseWorker override semantics correct |
| T7 | Graph projection receives canonical event value | Projection does not fabricate |
| T8 | knowledge_graph.addNode: null → null (not 1.0) | No truth inflation |
| T9 | EvidenceAuthority.rank: null confidence → neutral rank, not 1.0 | Ranking behavior correct |
| T10 | Any recomputed confidence records authority/source/provenance | Provenance markers present |

### Live Postgres E2E

1. Start Docker, gateway with correct env
2. POST /ingest with explicit confidence 0.3 → trace full chain
3. POST /ingest with no confidence → trace full chain
4. Query entire correlation group → print hop-by-hop table:
   `event_type | event_id | causation_id | correlation_id | confidence | confidence_source`

### Regression

Run full test suite after each PATCH category. Zero regressions required.

---

## 5. Not Patched (Correct Behavior)

- **CanonicalizationService boundary default 0.5**: intentional assertion.
  "observations are not knowledge." Documented, provenance-marked.
- **BaseWorker._emit propagation**: already correct (override wins, else inherited).
- **UnifiedEventRuntime spine**: already correct (carries, does not compute).
- **EventToMissionBridge / MissionScheduler**: already correct (preserves or null).
- **KnowledgePromoter**: authorized recomputation (human approval → 1.0 or 0.2).
  This is the ONLY site that legitimately produces 1.0 from a non-1.0 input.
