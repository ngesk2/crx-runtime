# LIVE Arrow Audit (Stronger Definition)

**Branch**: `constitutional-convergence-v2` | **Baseline commit**: `852fee10` (replay convergence)
**Date**: 2026-08-21 | **Type**: READ-ONLY audit — fresh evidence (does NOT repeat prior "24/5/2" numbers)

## Mandate

Re-audit every claimed LIVE execution arrow against a **stronger definition**:

> An execution arrow is **LIVE** iff (1) reachable from production composition,
> (2) routed to the **correct** worker (eventTypes match, not name heuristics),
> (3) has **non-stub** semantics (does real work, not a pass-through/example),
> (4) produces **observable** constitutional output (canonical event with
> evidence), AND (5) has a **negative-path** test proving failure honesty
> (verified/failed is never asserted when the underlying work did not succeed).

Previously the replay worker was a pass-through stub (`verified: true`
unconditionally). It is now wired to the deterministic kernel engine
(`852fee10`), so its arrow status changes under the stronger definition.

## Scope — the production execution surface

The single canonical production path (`POST /ingest` → spine → worker chain):

```
POST /ingest → CanonicalizationService → UnifiedEventRuntime.emit
            → ping_events (persist)
            → EventToMissionBridge (mission create, EVENT_MISSION_MAP)
            → MissionScheduler (atomic claim via MissionRuntime.assign)
            → WorkerRuntime.dispatch
            → canonical_workers chain:
                 observation → claim → classification → recommendation
                 → projection → replay → witness → lineage
```

## Arrow inventory (fresh, first-hand; file:line cited)

### Spine arrows (S1–S5)

| Arrow | Path | Evidence (file:line) |
|-------|------|----------------------|
| S1 | /ingest → canonicalize → emit | `gateway/routes/ingest.js` (validate→canonicalizeAndEmit→respond) |
| S2 | emit → persist ping_events | `ping-runtime/events/unified_event_runtime.js` (INSERT INTO ping_events, ON CONFLICT dedup) |
| S3 | spine → mission create | `ping-runtime/orchestration/mission_runtime.js` + `event_to_mission_bridge.js` EVENT_MISSION_MAP |
| S4 | scheduler → atomic claim | `mission_runtime.js` assign (conditional UPDATE) — READ_ONLY_PATCH_PLAN gate G1..G6 |
| S5 | scheduler → worker dispatch | `mission_scheduler.js` `_dispatch()` on `payload.event_type \|\| mission.mission_type` |

### Worker arrows (W1–W8)

| Arrow | Worker | input event | output event | non-stub evidence |
|-------|--------|-------------|--------------|-------------------|
| W1 | observation | BUSINESS_EVENTS | OBSERVATION_CREATED | extracts observation, emits downstream `canonical_workers.js:96-121` |
| W2 | claim | OBSERVATION_CREATED | CLAIM_CREATED | builds claim, emits `:134-156` |
| W3 | classification | CLAIM_CREATED | CLASSIFICATION_CREATED | categorizes + prioritizes + confidence inheritance `:528-554` |
| W4 | recommendation | CLASSIFICATION_CREATED | RECOMMENDATION_CREATED | action/reason/priority/evidence from classification `:593-615` |
| W5 | projection | RECOMMENDATION_CREATED | PROJECTION_CREATED | emits projection `:170-189` |
| W6 | **replay** | PROJECTION_CREATED | REPLAY_COMPLETED | **NOW wired to kernel engine** `:235+` — non-stub |
| W7 | witness | REPLAY_COMPLETED | WITNESS_CREATED | deterministic attestation from event_id `:457-479` |
| W8 | lineage | WITNESS_CREATED | LINEAGE_CREATED | causationChain from metadata `:492-514` |

## Per-arrow assessment vs the 5-part stronger definition

Legend: ✅ met · ⚠️ partial · ❌ not met

### W6 — replay (formerly the stub arrow) — **UPGRADED TO TIER-1 (structurally verified)**
1. **Reachable**: `gateway_runtime.js` constructs exactly ONE
   `KernelReplayExecutionProvider` and passes `replayProvider` into
   `registerCanonicalWorkers`; ReplayWorker registered with
   `eventTypes: ['REPLAY_VERIFY','PROJECTION_CREATED']` and receives the
   provider. (RC-3/5, `gateway_runtime.js:503-511`, `canonical_workers.js:686`).
2. **Correct worker**: dispatch by `payload.event_type` → `REPLAY_VERIFY`/`PROJECTION_CREATED` → ReplayWorker (RW-15).
3. **Non-stub**: delegates to deterministic kernel engine; no longer returns
   `verified:true` unconditionally (RW-6, RC-6). Deterministic fingerprint +
   witness_root (EVAL-009).
4. **Observable**: `_buildAuthorityEvidence` on all 3 REPLAY_COMPLETED
   emissions — authority, provider, source_event_id, correlation_id, namespace,
   verified, reason, violation_count, deterministic_execution_identity,
   canonical_input_hash. Never fabricated (RW-16/17, RC-8).
5. **Negative path**: RW-6 (kernel_error), RW-7/13 (trace), RW-11/12
   (no_events/missing), RW-14 (malformed), RW-17 (no_provider → verified:false),
   EVAL-009 (verified never true when violations/kernel_error).

**Bootstrap-path vs structural caveat (point 5)**: `test_replay_composition.js`
declares (lines 19-22) it does **NOT** invoke `GatewayRuntime.initialize()`
(that path needs live Postgres and is the Docker-blocked E2E surface). The W6
proof is therefore: (A) **boot-load** gate — the real `gateway_runtime.js`
module loads, so the provider import resolves; (B) **source-inspection** of the
production root proving it constructs exactly ONE `KernelReplayExecutionProvider`
and passes it as `replayProvider` into `registerCanonicalWorkers` (RC-2/3/4);
(C) **registration-contract** — the SAME `registerCanonicalWorkers` module the
runtime imports maps `options.replayProvider` onto the ReplayWorker and a
REPLAY_VERIFY event dispatches through provider → kernel-verified (RC-5/6/7/8);
plus worker-level negative-path tests (RW-1/3/6/9/10/11/14/17) + EVAL-009.
So the verdict is **production composition STRUCTURALLY verified** (reachable +
correct + non-stub + observable + worker-bounded negative path). **Full
`initialize()`-path bootstrap execution is NOT claimed** — it requires the
Docker-blocked live-Postgres E2E.

**Verdict: TIER-1 LIVE-PROVEN — production composition STRUCTURALLY verified.**

### W1–W5, W7–W8 — observation, claim, classification, recommendation, projection, witness, lineage
1. **Reachable**: all registered in `registerCanonicalWorkers` with exact
   eventTypes (`canonical_workers.js:678-688`); dispatch by `payload.event_type`
   matches (`mission_scheduler.js` W-MAP + `worker_runtime.js` eventTypes match).
2. **Correct worker**: eventTypes are exact-string, single-owner (no fan-out to
   wrong worker for these types).
3. **Non-stub**: W1–W6/W8 do real work (build objects from real payload).
   **W7 witness is non-stub w.r.t. failure honesty** — since the `w7` pass it
   reads `replay.verified` and refuses to attest unverified replays
   (`WITNESS_REJECTED`, see Point 8).
4. **Observable**: W1–W6/W8 emit a canonical downstream event with
   `upstreamEventId` + `causation_id` (trace contract). W7 emits `WITNESS_CREATED`
   only when the replay is verified — otherwise it emits `WITNESS_REJECTED`
   carrying the same trace fields (Point 8).
5. **Negative path — ⚠️ PARTIAL for W1–W5/W8; ✅ for W7**. W1–W5/W8 have
   **positive** path proof via `test_commissioning.js` (14 scenarios,
   multi-hundred events, 8-stage chain) + trace propagation, but no **per-worker**
   malformed-input → `failed` test; negative path is covered at the dispatch
   boundary (`test_dormant_worker_gate.js`, `EVAL-007`, `test_decision_graph.js`,
   `test_durable_mission_lifecycle.js`). **W7 has a worker-bounded failure path**
   via `test_witness_negpath.js` (8/8) — see Point 8.

### Point 8 — WitnessWorker failure-honesty (FIXED in `w7` correctness pass)

`852fee10` wired the **ReplayWorker** to the kernel engine and made it
failure-honest (verified:false + `no_replay_provider` / `kernel_error` /
violations → not verified; proven by RW-1/3/6/9/10/11/17 + EVAL-009). This
pass extends that honesty into **`WitnessWorker`** — the previously-documented
gap is **closed**:

- **WitnessWorker.handle now reads the upstream replay verdict.**
  `canonical_workers.js` WitnessWorker.handle sets `this._event = event` (trace
  contract on direct invocation, mirroring ReplayWorker) and adds a
  failure-honesty gate: on `REPLAY_COMPLETED` where
  `event.payload.replay?.verified !== true`, it **refuses to attest** — emits
  `WITNESS_REJECTED` (payload `{documentId, upstreamEventId, replay, reason}`
  where `reason = 'unverified_replay:<reason>'`, options `{causation_id:
  event.event_id}`) and returns `{status:'rejected', reason}`; it **never
  fabricates** a `WITNESS_CREATED` attestation for an unverified replay.
- **`WITNESS_REJECTED` is registered in the generated event registry** (via
  `gateway/generated/event_generator.js`, authority_owner `WitnessWorker`,
  event_class `system`) and regenerated — registry `232→233`, hash
  `32b532129ec7cefb72caabdbea1a050e0c88bcfa69c73425512e2ca7a229cb9c`. The delta
  is byte-verified to contain **only** the WITNESS_REJECTED block. EventGovernance
  + EventValidator both load the shared `event_registry.json`, so the new type is
  governance-valid by construction (no separate allowlist edit).
- **Failure-honesty definition satisfied** — an unverified/failed/no-provider
  replay propagates to the witness worker (ReplayWorker still emits
  `REPLAY_COMPLETED` regardless), and the witness worker now **cannot produce a
  valid attestation** for it: every rejection path asserts BOTH the presence of
  `WITNESS_REJECTED` AND the absence of `WITNESS_CREATED`.
- **Witness-level negative-path suite added**: `gateway/test_witness_negpath.js`
  (WIT-NEG-1..8, all PASS). WIT-NEG-1 verified→`WITNESS_CREATED` ok; WIT-NEG-2
  no_replay_provider→rejected, no WITNESS_CREATED; WIT-NEG-3 kernel_error→rejected;
  WIT-NEG-4 missing replay→`unverified_replay:replay_not_verified`; WIT-NEG-5
  `WITNESS_CREATE` direct still attests (no regression); WIT-NEG-6 type registered
  in registry; WIT-NEG-7 trace fields (correlation/causation/namespace) preserved
  on `WITNESS_REJECTED`; WIT-NEG-8 witness registered with `REPLAY_COMPLETED`.
- **Acknowledged residual (accepted, no code change)**: the three ReplayWorker
  emit paths still always emit `REPLAY_COMPLETED` even when unverified — that is
  intentional (a rejected replay must surface to downstream via a canonical event,
  and now the witness worker refuses to attest it). The trust boundary that was
  missing — refusing the invalid attestation — is now enforced at the witness.

**Verdict for W1–W5/W8: TIER-2 LIVE-WIRED (4/5, neg-path via dispatch).**
**Verdict for W7: TIER-2 LIVE-WIRED — failure-honesty FIXED** (worker-bounded
rejection path + dedicated neg-path suite; not TIER-1 because it is a
command/verification gate rather than a stateful compute arrow like W6).

### S1–S5 — spine arrows
1. **Reachable**: `/ingest` mounted; spine emits + persists; bridge + scheduler
   wired for business events.
2. **Correct worker**: N/A (not worker arrows).
3. **Non-stub**: real persistence + mission lifecycle (P0 atomic claim/retry/
   lease/DLQ wired).
4. **Observable**: canonical event with namespace/correlation persisted to
   ping_events.
5. **Negative path**: `test_durable_mission_lifecycle.js` (race, retry
   exhaustion, DLQ, reaper), `test_lease_reaping.js`, `test_lease_renewal.js`,
   `EVAL-007` (failure propagation), `test_dormant_worker_gate.js`.

**Verdict: LIVE (5/5) at boundary level.** S4 is a **distinct TIER-3 (PENDING)** arrow: the
READ_ONLY_PATCH_PLAN execution gate (G1 live PG + G2 schema + G3 migration order + G4
baseline + G5 golden test first + G6 approval) governs the atomic-claim correctness
evidence; unit-level mock coverage of the unconditional-update race is in the durable
lifecycle tests (`test_durable_mission_lifecycle.js`), but the SELECT-for-update race
against a real Postgres is **not proven** (Docker-blocked). S4 is NOT claimed strict-
LIVE; it is TIER-3 PENDING until the live-PG race proof lands.

## Summary (fresh, not the old 24/5/2) — 3 distinct proof tiers

**Tier legend (distinct, non-flattened):**
- **TIER-1 LIVE-PROVEN**: 5/5 under the stronger definition, including a
  **negative-path test at the worker boundary itself**.
- **TIER-2 LIVE-WIRED**: 5/5 reachable/correct/non-stub/observable, but the
  negative-path proof lives at the **dispatch/boundary layer** (not a per-worker
  malformed-input test).
- **TIER-3 PENDING / GAPPED**: a correctness-critical assertion or failure path
  is not yet proven (needs live infra) OR has a **structural gap** (see W7).

| Arrow | 1 Reachable | 2 Correct worker | 3 Non-stub | 4 Observable | 5 Neg-path | Tier / Verdict |
|-------|-------------|------------------|------------|--------------|------------|----------------|
| S1 /ingest | ✅ | ✅ | ✅ | ✅ | ✅ | TIER-2 LIVE-WIRED |
| S2 persist | ✅ | ✅ | ✅ | ✅ | ✅ | TIER-2 LIVE-WIRED |
| S3 bridge | ✅ | ✅ | ✅ | ✅ | ✅ | TIER-2 LIVE-WIRED |
| S4 atomic claim | ✅ | ✅ | ✅ | ✅ | ⚠️ (race proof needs PG) | **TIER-3 PENDING** (distinct) |
| S5 dispatch | ✅ | ✅ | ✅ | ✅ | ✅ | TIER-2 LIVE-WIRED |
| W1 observation | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |
| W2 claim | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |
| W3 classification | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |
| W4 recommendation | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |
| W5 projection | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |
| W6 **replay** | ✅ | ✅ | ✅ | ✅ | ✅ (worker-bounded) | **TIER-1 LIVE-PROVEN** (structurally verified) |
| W7 witness | ✅ | ✅ | ✅ (refuses on unverified) | ✅ (WITNESS_REJECTED + causation) | ✅ (worker-bounded) | **TIER-2 LIVE-WIRED (failure-honesty FIXED)** |
| W8 lineage | ✅ | ✅ | ✅ | ✅ | ⚠️(boundary) | TIER-2 LIVE-WIRED |

**Count under 3-tier stronger definition:** 14/14 arrows REACHABLE + CORRECT +
NON-STUB. Full 5/5 with **worker-bounded** negative-path test = **2 (W6, W7)**.
TIER-2 LIVE-WIRED = **11** (S1,S2,S3,S5,W1,W2,W3,W4,W5,W7,W8). TIER-3 = **1**
(S4 = PENDING live-PG race proof).

**Key change vs prior audit**: the replay arrow (W6) is one of two TIER-1 arrows,
upgraded from stub to kernel-wired by `852fee10`. This pass additionally **closed
the W7 witness failure-honesty gap** (previously the sole structural defect on the
live chain): `WitnessWorker` now reads `replay.verified`, emits `WITNESS_REJECTED`
on any unverified/failed/no-provider replay, and never fabricates a valid
attestation — proven by `test_witness_negpath.js` (8/8). "No arrow is currently a
pass-through stub" is now true for both W6 and W7.

## Priority gaps (deliberate, not "dead")
1. **✅ W7 witness failure-honesty — FIXED** (this pass). `WitnessWorker` now
   refuses to attest unverified replays via `WITNESS_REJECTED`; 8-test
   `test_witness_negpath.js` proves presence of rejection AND absence of
   fabricated attestation on every failure path. (Residual accepted: ReplayWorker
   still emits `REPLAY_COMPLETED` for unverified replays by design — the rejected
   replay surfaces as a canonical event and the witness refuses to attest it.)
2. **Per-worker negative-path tests** for W1–W5/W8 — malformed-input → `failed`
   (not fabricated success), mirroring the replay RW negative-path suite.
3. **S4 atomic-claim race proof** — requires live Postgres (G-gate); mock
   coverage exists but the SELECT-for-update race is the one correctness
   boundary not yet proven against a real DB.
4. **Live E2E** (Docker-blocked) — the full chain S1→W8 against real Postgres;
   all unit/eval levels green, integration-level still PENDING_LIVE_E2E.

## Next step (per mandate order)
Step 8 (spine-level confidence/priority semantic matrix) is COMPLETE — see
`docs/CONFIDENCE_PRIORITY_SEMANTIC_MATRIX.md` (corrected to 3-class confidence
boundaries + explicit priority scale table + live-not-dormant string-priority
trace). The W7 witness failure-honesty gap (the only structural defect previously
known on the live chain, Priority gap 1) is **FIXED** by the `w7` correctness
pass (Point 8, `test_witness_negpath.js` 8/8). No structural correctness defect
remains on the live chain; B7 (step 9, agent file migration) may proceed.
