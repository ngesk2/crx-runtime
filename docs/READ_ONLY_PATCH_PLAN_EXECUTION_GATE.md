# READ-ONLY PATCH PLAN — Durable Execution Semantics for PING Mission Pipeline

**Status**: READ-ONLY. Zero code changes. This document is the execution gate that must be satisfied before any patch is written.

**Date**: 2026-08-08
**Branch**: constitutional-hardening (HEAD `a9d9aeee`, post-M3 migration)
**Scope**: P0 durable execution slice only. Track A Section 2 lifecycle + architecture recommendation.

---

## 0. Executive Verdict

PING's event→mission→worker pipeline is **functionally complete, structurally honest (5 live stages), and durable-persistence capable, but execution-semantics-broken at exactly one boundary**: worker failure is swallowed, so the scheduler marks missions complete without verified success. Four of the six P0 correctness primitives (atomic claim, retry, DLQ, lease/recovery) exist as fully-written orphaned code with **zero require() importers** — they must be wired, not rewritten.

**The only architecturally-correct move is to make `ping_missions` the authoritative execution queue** (atomic claim + conditional transition + lease + retry columns + DLQ handoff), and to reuse `RetryAuthority`/`DeadLetterAuthority` **only** where their contracts map cleanly onto `ping_missions`. Do NOT introduce `PersistentQueueAuthority` into this slice — it risks a second mission authority.

**One hard precondition before any patch**: live Postgres migration state must be verified. Every DDL below is app-side `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE`, but actual schema-in-place, migration application order, and E2E execution are all UNVERIFIED (Docker daemon down — npipe). This gate FAILS until that is proven.

---

## 1. Verified Evidence Matrix (all read first-hand this session, post-M3 paths)

| Gate | Result | Evidence (file:line) | Consequence |
|------|--------|----------------------|-------------|
| Event persistence | **PASS** | `ping-runtime/events/unified_event_runtime.js` ping_events DDL (`event_id VARCHAR(64) PK`, ON CONFLICT dedup); `storage/postgres/models.py`; `gateway/bootstrap/gateway_runtime.js:419-456` | Events survive restart; replay/evidence read from `ping_events` (EvidenceAuthority.accumulate) |
| Atomic mission claim | **FAIL** | `ping-runtime/orchestration/mission_runtime.js:149-155` `getPending()` → `SELECT * WHERE status='created' ORDER BY priority DESC, created_at ASC LIMIT $1` (no `FOR UPDATE SKIP LOCKED`); `:79-90` `assign()` → unconditional `UPDATE ... SET status='assigned', assigned_to=$1 WHERE mission_id=$2` (no `AND status='created'` guard) | Two scheduler instances can claim the same `created` mission; selection and assignment are two separate transactions — race window |
| Failure propagation | **FAIL** | `ping-runtime/workers/worker_runtime.js:86-91` — `catch (err)` increments `totalFailed`, logs, **does not rethrow**; `dispatch()` resolves normally | The immediate correctness defect. Scheduler cannot distinguish success from failure |
| Completion verification | **FAIL** | `ping-runtime/orchestration/mission_scheduler.js:204-207` — `complete()` called unconditionally after `dispatch()`; `dispatch()` is void and swallows worker errors | Phantom-complete: "done" is asserted, never verified |
| Retry | **FAIL** | `mission_runtime.js:43` `retries INTEGER DEFAULT 0` exists; **nothing in the codebase increments or reads it** (verified — no read/write site in any `.js` except DDL). `gateway/retry_authority.js` (285L, in-memory Maps) — **zero `require()` importers**. `gateway/retry_policy.js` (264L) — only importer is `dead_letter_authority.js` (itself zero-importer), so unreachable from the live import graph. Verified by full `git ls-files *.js` require-scan (scripted, not rg-substring) | Retry infrastructure exists but is disconnected from `ping_missions`; failures never re-enter execution |
| Durable DLQ | **FAIL** | `gateway/dead_letter_authority.js:56-64` `repository_dead_letters` DDL (dead_letter_id PK, original_job_id, mission_id, execution_id, retry_count, replayable, witness...); **zero `require()` importers** (only self/`retry_policy`; unreachable from live import graph — verified by full require-scan) | `repository_dead_letters` exists; failed/exhausted missions are never routed there |
| Lease / crash recovery | **FAIL** | `gateway/advisory_lock.js` exists; **zero `require()` importers** (verified by full require-scan). `ping_missions` DDL (`mission_runtime.js:30-48`) has `assigned_to` but **no `lease_until`, no `claimed_at`, no reaper** | `assigned_to` alone is insufficient for crash recovery — a scheduler that dies mid-mission leaves the mission `assigned`/`running` forever; `getPending()` only selects `status='created'`, so it is never retried |
| Idempotency | **FAIL** | `ping-runtime/orchestration/event_to_mission_bridge.js:16-59` EVENT_MISSION_MAP creates one mission per event; `mission_runtime.js:56-59` mission_id = `sha256(missionType:Date.now():JSON.stringify(payload))` — **non-deterministic, includes wall clock** | Redelivered events create duplicate missions (no content-addressed fence). `IntelligenceWorker` (`intelligence_worker.js:104-116`) emits both CLASSIFICATION_CREATED + RECOMMENDATION_CREATED per event; retries duplicate downstream side effects |
| External automation boundary | **PASS** | `ping-runtime/workers/canonical_workers.js` — workers are the only execution surface; no MCP/browser/playwright clients in repo (verified) | Future MCP/browser adapters attach behind worker/capability boundary — no contamination today |
| Database migration readiness | **FAIL / UNVERIFIED** | `database/fix_pipeline_blockers.sql` (fixes `events`/`observations`/`event_processing` — Phase 43 tables, NOT the PING spine); `mission_runtime.js:43` (retries); `unified_event_runtime.js` (ping_events); `dead_letter_authority.js:56-64` (repository_dead_letters) | Required schema is code-side CREATE TABLE IF NOT EXISTS; actual application order and in-place schema cannot be confirmed without a live Postgres connection |
| Deployment readiness | **FAIL** | `compose.yaml:255` → `Dockerfile.projection` (ABSENT); `:280` → `Dockerfile.witness` (ABSENT); `:302` → `Dockerfile.replay` (ABSENT); `:324` → `Dockerfile.worker-runtime` (exists, Phase 43); `:163-190` gateway; `:349-371` ui. Docker daemon down (npipe) | `docker compose up --profile dev` cannot build 3 of 5 worker services; no trustworthy execution run possible |

---

## 2. The Exact Failure Boundary

```
canonical worker.handle()
        ↓
WorkerRuntime.dispatch(event)
        ↓
worker_runtime.js:86-91
        ↓
ERROR IS SWALLOWED HERE (catch, log, no rethrow)
        ↓
dispatch() resolves normally (void)
        ↓
mission_scheduler.js:200-201  await this._workerRuntime.dispatch(event);
        ↓
mission_scheduler.js:204-207  await this._missionRuntime.complete(...)   ← UNCONDITIONAL
        ↓
MISSION COMPLETE  (phantom)
```

**Minimum P0 contract:**
```
dispatch(event)
  ├─ worker returns { status: "ok", ... }   → verified success → complete()
  └─ worker throws / returns failure         → rejected dispatch
                                              → scheduler fail/retry path
```
`{ status: "ok" }` must not merely mean "the handler returned an object." The completion gate validates the minimum worker result contract before `MissionRuntime.complete()`.

---

## 3. Track A Section 2 — Durable Lifecycle State Machine

Mapped onto `ping_missions.status` (current values preserved; new states added):

```
RECEIVED ──persist──▶ PERSISTED ──eligible──▶ AVAILABLE ──atomic claim──▶ CLAIMED
                                                                              │
                                                                              ▼
                                                              RUNNING ──verified────▶ COMPLETED
                                                                  │
                                                                  ├── error, retryable ──▶ RETRY_PENDING ──backoff──▶ AVAILABLE
                                                                  ├── error, exhausted ────▶ FAILED ──DLQ────▶ DEAD_LETTERED
                                                                  └── lease expired ──reaper──▶ AVAILABLE (re-claim)
```

| State | `ping_missions.status` | Entry condition | Exit |
|-------|------------------------|-----------------|------|
| RECEIVED | `created` (INSERT, uncommitted) | event → bridge maps to mission | commit |
| PERSISTED | `created` (committed) | INSERT committed | `retry_at <= now()` |
| AVAILABLE | `created` | eligible for claim | atomic claim succeeds |
| CLAIMED | `assigned` | `UPDATE ... WHERE status='created' AND retry_at<=now()` (1 row) | `start()` |
| RUNNING | `running` | `start()` sets `started_at` | verified result → completed; error → retry/failed; lease expiry → reaper |
| RETRY_PENDING | `retry_pending` | worker error, `retries < max` | backoff elapsed (`retry_at`), re-enter AVAILABLE |
| FAILED | `failed` | worker error, `retries >= max` | DLQ record written, then terminal |
| COMPLETED | `completed` | verified `{status:'ok'}` worker result | terminal |
| DEAD_LETTERED | `dead_lettered` | `repository_dead_letters` row + status flip | terminal (replayable via DLQ) |

**Schema deltas required (all additive, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`):**
- `retry_at TIMESTAMPTZ` — earliest time mission is claimable (backoff gate; `created` + `retry_at IS NULL OR retry_at <= now()`)
- `lease_until TIMESTAMPTZ` — claim lease deadline; reaper reclaims `assigned`/`running` past it
- `claimed_at TIMESTAMPTZ` — claim timestamp (audit + lease basis)
- `attempt_count INTEGER DEFAULT 0` — or reuse existing `retries` (verify no read/write site first — confirmed none)
- `dead_letter_id TEXT` — FK-able link to `repository_dead_letters`

---

## 4. P0 Patch Set (6 patches, each with acceptance)

### P0-1 — Atomic mission claim
- **File**: `ping-runtime/orchestration/mission_runtime.js`
- `getPending()` and `assign()` must be **one transaction**. Replace the split SELECT + unconditional UPDATE with:
  ```sql
  BEGIN
    SELECT * FROM ping_missions
      WHERE status = 'created' AND (retry_at IS NULL OR retry_at <= NOW())
      ORDER BY priority DESC, created_at ASC
      FOR UPDATE SKIP LOCKED
      LIMIT $1;
    UPDATE ping_missions
      SET status = 'assigned', assigned_to = $worker, claimed_at = NOW(), lease_until = NOW() + interval '60 seconds'
      WHERE mission_id IN (locked ids);
  COMMIT
  ```
  PLUS conditional-transition defense-in-depth on `assign()`:
  ```sql
  UPDATE ping_missions SET status='assigned', assigned_to=$1, claimed_at=NOW(), lease_until=NOW()+interval '60 seconds'
  WHERE mission_id=$2 AND status='created';
  ```
  Return rowCount; treat 0 as "not mine — skip". **Do not** add `SKIP LOCKED` to `getPending()` alone while retaining the current separate `assign()` transaction — that leaves the race between selection and assignment.
- **Acceptance**: two concurrent schedulers claiming the same `created` mission → exactly one claims; mock-pool test with parallel `getPending`+`assign` calls.

### P0-2 — Failure propagation
- **File**: `ping-runtime/workers/worker_runtime.js:86-91`
- `dispatch()` rethrows the worker error (or returns `{status:'failed', error}`) after the current `finally` cleanup (running--, heartbeat). Preserve per-worker stats.
- **Acceptance**: a worker that throws → `dispatch()` rejects → scheduler enters retry path, never `complete()`.

### P0-3 — Completion verification
- **File**: `ping-runtime/orchestration/mission_scheduler.js:204-207`
- `complete()` only on `result.status === 'ok'` (validated worker result contract). Worker failures route to `MissionRuntime.fail(missionId, error)`.
- **Acceptance**: phantom-complete eliminated — scheduler stats `failed` increments for throwing workers; `test_commissioning` still passes (all 5 live workers return `{status:'ok'}`).

### P0-4 — Durable retry
- **File**: `mission_runtime.js` (add `scheduleRetry`/`failWithRetry`), wire `gateway/retry_authority.js` policy lookup (reuse, don't rewrite).
- `failWithRetry(missionId, error, policyId)`: `retries++`; if `retries < max_attempts` → status `retry_pending`, `retry_at = now + backoff_delay`; else → `failed` → P0-5 DLQ.
- **Acceptance**: failing worker → retries incremented → after backoff, mission re-enters AVAILABLE and is re-dispatched; exhaustion flips to `failed`.

### P0-5 — Durable DLQ
- **File**: `gateway/dead_letter_authority.js` (instantiate + call at exhaustion), `mission_runtime.js` (dead_letter_id link).
- On `retries >= max`: write `repository_dead_letters` row (mission payload/result/error/witness) via existing `recordDeadLetter`, then status `dead_lettered`.
- **Acceptance**: exhausted mission appears in `repository_dead_letters` with payload, retry_count, replayable, witness; `getStats()` reflects it.
- **Note**: reuse DeadLetterAuthority as-is where its contract (`job.job_id`, `job_type`, `retry_count`) maps to mission fields. If the contract fights `ping_missions`, wrap with a thin adapter — do NOT fork the table.

### P0-6 — Lease + stale-worker recovery
- **File**: `mission_runtime.js` (add `reapExpiredLeases()`), `mission_scheduler.js` (invoke in poll cycle).
- Reaper: `UPDATE ping_missions SET status='created', assigned_to=NULL, retry_at=NOW() WHERE lease_until < NOW() AND status IN ('assigned','running')` → reclaims crashes/stragglers.
- **Acceptance**: mission left `running` with expired lease returns to AVAILABLE and is re-claimed.

---

## 5. Execution Gate — BLOCKING, evaluated in order, all must PASS before any patch

| # | Gate | Check | Current status |
|---|------|-------|----------------|
| G1 | **Live Postgres reachable** | `docker` daemon up; `ping-postgres` healthy; `psql`/pg client can connect to `ping_runtime` | ❌ FAIL (daemon down, npipe) |
| G2 | **Schema-in-place verified** | Connect to live PG: confirm `ping_events`, `ping_missions` (check `retries` column), `knowledge_nodes` (namespace/status), `repository_dead_letters` exist; confirm `fix_pipeline_blockers.sql` applied (events.aggregate_id VARCHAR, event_processing) | ❌ UNVERIFIED |
| G3 | **Migration order determined** | Decide + record: init-01 schema.sql (brainos canonical_state) → gateway initialize() DDL → fix_pipeline_blockers.sql → Phase D ALTERs → P0-1 ADD COLUMNs. No ambiguity allowed at execution time | ❌ NOT DECIDED |
| G4 | **Baseline regression green** | Full suite: test_commissioning (14 scenarios 0 failed), knowledge_search 10/10, evidence 12/12, ingest_boundary 24/24, pipeline_bridge 10/10, phase_d 7/7, slice3a 8/8, phase0 8/8, canonical_object 13/13, wave2/2_5/3a, p001_p005 27/27, p040 29/29, constitutional_validation 63/64 (1 Docker skip), kernel_pipeline, business_emitters 19/19. Pre-existing failures only (wave3b_p7 28/32, wave3b_p8 40/43) | ✅ PASS (at B6 baseline; re-run at gate) |
| G5 | **Golden lifecycle test exists** | `test_durable_mission_lifecycle.js` written BEFORE patches: pure mock-pool, exercises all 9 states + atomic-claim race + swallow-fix + retry/exhaustion + DLQ + lease reaper | ❌ NOT WRITTEN (write-first, run-last) |
| G6 | **User approval to exit read-only** | Explicit direction to begin P0 implementation | ❌ PENDING |

**Gate rule**: P0 patches are NOT written until G1–G5 pass and G6 is granted. If G1/G2 cannot be satisfied (Docker still down), the plan stands ready and unchanged.

---

## 6. Explicit Deferrals (not in P0)

- **Orca convergence** — external Stably Orca operator UX; execution stays in PING authorities.
- **MCP / browser automation** — boundary is clean (PASS); attach later behind workers.
- **Temporal** — queue tech replaceable; runtime topology is the constraint being fixed here.
- **Telemetry / observability** — 0 emissions today; separate slice.
- **Horizontal scaling** — atomic claim (P0-1) is the prerequisite; multi-node schedulers come after.
- **`PersistentQueueAuthority`** — NOT introduced in this slice (second-mission-authority risk).
- **Replay/witness/lineage activation** — nothing emits REPLAY_VERIFY; `EVENT_MISSION_MAP` fix is a separate decision (documented in SLICE3C matrix).
- **IntelligenceWorker duplication** — emits classification+recommendation in parallel with the chain; merge decision deferred (documented in PING_AGENT_DECISION_GRAPH.md).

---

## 7. Open Questions (need user direction)

1. **Retry policy defaults** — reuse `RetryAuthority` `default` policy (3 attempts, exponential, 1s base)? Or per-mission-type policies in `retry_policy.js`?
2. **Reuse boundary** — DeadLetterAuthority contract (`job.job_id`, `retry_count`) assumes a "job" shape. Accept a thin mission→job adapter, or add a `recordDeadLetterForMission()` method?
3. **`retries` reuse** — increment existing `retries INTEGER DEFAULT 0`, or add `attempt_count`? (No existing read/write site — either is safe; reuse is smaller.)
4. **Lease duration** — fixed 60s per claim (matches SKIP LOCKED example) or configurable per mission type?
5. **`canonical_event_envelope.js`** — still BLOCKED for migration (needs repoRoot injection + approval). Include in this slice or stay parked?

---

## 8. Deliverable Trail

- This plan: `docs/READ_ONLY_PATCH_PLAN_EXECUTION_GATE.md`
- Companion evidence (read-only, prior): `docs/FULL_SYSTEM_AUDIT.md`, `docs/deployment_topology.md`, `SLICE3C_OWNERSHIP_TRANSFER_MATRIX.md`, `PING_AGENT_DECISION_GRAPH.md`
- Next artifact when gates pass: `test_durable_mission_lifecycle.js` (G5, write-first), then P0-1…P0-6.
