# P3 Contradiction & Convergence Ledger

**Scope:** Consolidate the live spine — ONE worker-identity decider, ONE priority scale, confidence semantics.
**Mode:** READ-ONLY audit. No code changes, no commits, no staging. Deliverable only.
**Branch:** `constitutional-convergence-v2` @ `828520ea`
**Date:** 2026-08-28

**Evidence classes used throughout:**
- `[EMPR]` — empirically proven on the live runtime (POST /ingest → full chain, per `docs/EXECUTION_EVIDENCE_LEDGER.md`)
- `[STAT]` — source-proven (exact file:line, read first-hand this session)
- `[INFE]` — inference / not yet proven

---

## 1. Executive Verdict

The live PING execution spine already has **one** worker-identity execution decider
(`WorkerRuntime.dispatch` eventType→worker.eventTypes match), **one** priority scale
(canonical int 0-3, higher = more urgent), and **one** confidence semantic
(producer-defined → carried verbatim → optional `confidence_source` provenance →
null-preserving → human-approved recompute only).

**No active contradiction exists on the live execution path.** The previously-flagged
"competing authorities" (MISSION_WORKER_MAP name-map, IntelligenceWorker dual path,
Orca priority scale) are all **dormant or labeling-only**, not live execution deciders.
The convergence risk is **misreading** them as competing deciders, not the code itself.

---

## 2. Audit A — Worker Identity Decider

### 2.1 Decision sites (all first-hand)

| # | Site | file:line | Role |
|---|------|-----------|------|
| A1 | `EVENT_MISSION_MAP` | event_to_mission_bridge.js:23-70 | Business event → `{missionType, priority}`. **`worker` field removed** (comment :18-22: "never read, removed to eliminate dead data"). |
| A2 | `MISSION_WORKER_MAP` | mission_scheduler.js:30-69 | `mission_type` → worker **name**. Used for: (a) `assigned_to` labeling (:230), (b) registered-check (:191). **NOT** the execution gate. |
| A3 | Scheduler registered-check | mission_scheduler.js:190-195 | `stats.workers[workerName]` — survives only as a pre-dispatch guard / label. |
| A4 | Event build | mission_scheduler.js:214-236 | Reconstructs `event.event_type = payload.event_type \|\| mission.mission_type` (the **original business event type**, e.g. `CLAIM_CREATED`, NOT mission_type `CLAIM_GENERATE`). Namespace from payload; confidence + correlation_id + canonical_hash threaded into metadata. |
| A5 | **ACTUAL decider** | worker_runtime.js:74-104 `dispatch()` | Iterates registered workers; matches **`worker.eventTypes.includes(event.event_type)`**. THIS is the authoritative execution-eligibility contract. |

### 2.2 Finding

Worker **execution** is decided at exactly ONE place: `WorkerRuntime.dispatch` matching the
dispatched `event.event_type` against the worker's declared `eventTypes`. Every worker
registers with an explicit `eventTypes` allowlist (`registerCanonicalWorkers` in
canonical_workers.js:705-715, e.g. replay on `['REPLAY_VERIFY','PROJECTION_CREATED']`,
witness on `['WITNESS_CREATE','REPLAY_COMPLETED']`).

`MISSION_WORKER_MAP` (A2) is a **labeling hint, not a decider**. Proof: a mission whose
A2-name maps to a worker whose `eventTypes` do not include the dispatched event returns
`null` from dispatch → scheduler **skips + fails** (`:249-256`), never completes. This is
correct P0-3 behavior — the label cannot force execution onto a non-matching worker.
`[STAT]`; the log-proven 5-stage chain and 8-worker chain ran through the real
eventType-matching path. `[EMPR]`

### 2.3 Contradiction / duplication

- **NOT a true contradiction:** `EVENT_MISSION_MAP` (no worker) + `MISSION_WORKER_MAP`
  (name label) are a 2-step composition. They do not disagree on execution because
  neither is the decider.
- **Residual confusion (documentation-only):** `assigned_to` in `ping_missions` stores the
  A2 name, which may differ from the worker that actually executes if registration is
  added later. Today they coincide.

### 2.4 Recommended convergence (do NOT implement this pass)

Add a documentation contract comment: `MISSION_WORKER_MAP` is **labeling-only**; the
**authoritative worker eligibility contract is each worker's declared `eventTypes`**.
No code change required — the actual decider is already singular.

---

## 3. Audit B — Priority Scale

### 3.1 Decision sites

| # | Site | file:line | Role |
|---|------|-----------|------|
| B1 | `priority_boundary.js` `canonicalPriority()` | :67-91 | **Single ingress boundary.** Maps ANY scale → canonical int 0-3. Applied ONLY at the bridge (:134). |
| B2 | `EVENT_MISSION_MAP.priority` | bridge:23-70 | Declared priorities (currently all already int 0-3, e.g. REVIEW_RECEIVED=3, INVOICE_PAID=1, SYSTEM_HEALTH_CHECK=0). Comment: "ANY valid scale (0-3, 1-10, string)." |
| B3 | Persist | mission_runtime.js:82 | `options.priority \|\| 0` → `ping_missions.priority INT`. |
| B4 | Ordering | mission_runtime.js:311 | `getPending`: `ORDER BY priority DESC, created_at ASC` — **higher = more urgent**, consistent with scale (0=system … 3=revenue-critical). |
| B5 | Scheduler read | mission_scheduler.js:229 | Metadata `priority: mission.priority` = the **persisted int**, never recomputed from payload. |

### 3.2 Finding — canonical semantics

**Scale:** int 0-3, **higher = more urgent** (0=system maintenance, 1=routine, 2=new-entity,
3=revenue-critical). `[STAT]` canonical_priority docstring :7-11.

Unambiguous at every live hop: normalized once at the bridge (B1), persisted as int (B3),
ordered DESC (B4, higher first), read from int column (B5). No silent normalization on the
live path — the only normalized input is inbound at the bridge.

**Dormant scales all route through the same boundarary when wired:**
- Orca int 1-10 → ORCA_TO_CANONICAL table (:32-38)
- IntelligenceWorker strings ('low'…'critical') → STRING_TO_CANONICAL (:43-50)
- mission_compiler float 0-10 → quantized (:78-82)
- null/undefined → **1 (routine)** (:90)

None of these three producers is live (Orca discoverOllama:false; IntelligenceWorker
registers empty eventTypes and is skipped; mission_compiler dormant). `[STAT]` /
`[INFE]` (intelligence 25-vs-14 dispatch anecdotes are older-process artifacts, not live).

### 3.3 Contradiction

- **None on the live path.** Single scale, single meaning, single ingress.
- Noted inconsistency (static, harmless): `mission_runtime.js:34` column default is
  `priority INTEGER DEFAULT 0` while `canonicalPriority(null)` returns 1 — but the bridge
  never passes null, so `ping_missions.priority` always holds an explicit 0-3. `[STAT]`

---

## 4. Audit C — Confidence Semantics

### 4.1 Canonical trace (first-hand, all hops)

| # | Hop | file:line | Behavior |
|---|-----|-----------|----------|
| C1 | Producer (spine entry) | canonicalization_service.js:134,155 | `confidence === undefined ? 0.5 : confidence`. Observations default **0.5**. Stored in envelope + forwarded into `event.metadata.confidence`. |
| C2 | Spine | unified_event_runtime.js:123-138 | **Carries, does NOT compute.** Forwards `options.metadata.confidence` verbatim (null-safe). |
| C3 | Bridge → mission | event_to_mission_bridge.js:131 | Reads `event.metadata.confidence` into mission payload. Preserved (null stays null). |
| C4 | Worker emit | canonical_workers.js:53-71 (`BaseWorker._emit`) | Explicit `options.confidence` wins; inherited non-null → preserved + `confidence_source='inherited'`; neither → **null** (never fabricated). Object.hasOwn is the canonical check. |
| C5 | Classification | canonical_workers.js:561,568 | `upstreamConfidence ?? null`, records `confidence_source`. |
| C6 | Recommendation | canonical_workers.js:633,634 | `classification.confidence ?? null`, records `confidence_source`. |
| C7 | Projection | knowledge_graph.js:79 | Stores `options.confidence != null ? options.confidence : null` + `confidence_provenance` column (:46). |
| C8 | Promotion | knowledge_promoter.js:51 | **THE ONLY recompute:** approve→1.0, reject→0.2. Human-gated. |
| C9 | Retrieval | evidence_authority.js:159-161 | null→0.5 **local rank fallback** (neutral ranking, not stored). hybrid_search.js:70,96 carries confidence. |

### 4.2 Finding

Confidence is **producer-authored at the spine** (C1), **carried verbatim** through
spine/bridge/workers/projection (C2-C7), and **only ever recomputed** by explicit human
approval (C8). The AI inference path is the sole non-spine confidence author
(inference_adapter.js:140,156 hardcoded `confidence: 0.8`, provenance `model`; and
intelligence_worker.js:117-119 prefers model confidence). `[STAT]`

Null is preserved as null everywhere except the local rank fallback (C9), which does
not persist.

### 4.3 Contradiction

- **None on the live spine.** No fabrication: the only places a default appears are (a) C1
  producer default 0.5 for observations (intended — "observations are not knowledge"),
  (b) C9 neutral ranking fallback (non-persistent).
- Minor static note: `knowledge_graph.js:34` column default `confidence REAL DEFAULT 1.0`
  but every addNode INSERT supplies the value explicitly (:79), so the 1.0 default is
  unreachable in the live path. Harmless. `[STAT]`

---

## 5. Contradiction & Convergence Summary

| Area | Active contradiction on live path? | Converged owner | Residual risk |
|------|----------------------------------|-----------------|----------------|
| A: Worker identity | **NO** | `WorkerRuntime.dispatch` eventType→eventTypes | MISSION_WORKER_MAP reads as a decider — needs labeling-only doc contract |
| B: Priority | **NO** | `priority_boundary.canonicalPriority` int 0-3 (higher=urgent) | column DEFAULT 0 vs canonicalPriority(null)=1 (unreachable) |
| C: Confidence | **NO** | Spine `metadata.confidence` + `confidence_source` provenance | knowledge_graph column DEFAULT 1.0 unreachable; inference_adapter hardcodes 0.8 (model provenance) |

All three converge to exactly one canonical owner already. **No code change is required**
for correctness. The deliverables are documentation contracts so future agents do not
re-discover non-contradictions as defects.

---

## 6. Recommended follow-ups (FROZEN — await user direction)

1. **Doc-contract only:** annotate `MISSION_WORKER_MAP` as labeling-only; authoritative
   worker contract = declared `eventTypes`. (audit A)
2. **Doc-contract only:** note `ping_missions.priority` default + `canonicalPriority(null)`
   semantics are static-only; the live bridge always passes explicit 0-3. (audit B)
3. **Doc-contract only:** note `knowledge_graph.confidence` DEFAULT 1.0 is unreachable;
   inference_adapter 0.8 is model-provenance, not fabricated spine confidence. (audit C)
4. **Deferred (not P3 scope):** IntelligenceWorker duplicate-path merge; Orca execution
   wiring (`discoverOllama:false`); confidence-on-spine persistence column (union of C1-C7
   is already in `metadata`, no new column needed for the current single-owner reality).

**Do NOT implement A/B/C changes until user direction.** This pass is read-only;
the ledger is the handoff artifact.

---

## 7. Handoff

- **Canonical evidence source:** `docs/EXECUTION_EVIDENCE_LEDGER.md` (window 2026-08-27,
  live chain, provider counters, witness/trace, DB counts).
- **This ledger** now records the P3 three-audit convergence verdicts as the single
  source for worker-identity / priority / confidence semantics on the live spine.
- Any future agent auditing these three concerns should consult this ledger BEFORE
  re-deriving conclusions from scattered files.
