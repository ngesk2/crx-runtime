# Scheduler Audit: `orchestration/execution/scheduler.js`

**File**: `C:\Users\nolan\PING\orchestration\execution\scheduler.js` (169 lines)
**Audited**: 2026-07-04
**Version**: Phase 39 (git HEAD)
**Pre-existing audit at this path overwritten**: The prior audit (231 lines, 9 invariants) was written against an older version of the code and contained inaccuracies (claimed `Date.now()` in `_getRecentLoad` and `mission_compiler.js` — neither exists in the current code).

---

## Overview

The `Scheduler` class is the worker-to-mission dispatcher in the Constitutional Orchestration Fabric. It wraps a `WorkerPortRegistry` and an `EventQueue`, providing two dispatch methods and one internal selection algorithm:

| Method | Lines | Purpose |
|--------|-------|---------|
| `schedule(mission)` | 12–53 | One worker per required capability |
| `scheduleForConsensus(mission, workerCount)` | 55–85 | N workers for a single capability (consensus) |
| `_selectWorker(capability, mission)` | 87–109 | SHA-256 consistent hashing + load balancing |

**Dependencies**: `crypto` (Node.js built-in), `WorkerPortRegistry` (worker_port.js), `EventQueue` (event_queue.js)

---

## Invariant 1 — Deterministic Worker Selection

**Verdict: PASS** (with state dependency caveat)

### Evidence

`_selectWorker` (lines 87–109) builds a deterministic seed:

```js
const seed = JSON.stringify({
  capability,
  missionId: mission.id,
  missionType: mission.type,
  target: mission.target
});                           // line 88–93
const hash = crypto.createHash('sha256').update(seed).digest('hex');  // line 105
const index = parseInt(hash.substring(0, 8), 16) % loadBalanced.length; // line 106
```

The seed depends on `mission.id`, which is generated in `MissionCompiler._createMission` (mission_compiler.js line 180):

```js
id: `msn_${crypto.createHash('sha256').update(type + JSON.stringify(overrides)).digest('hex').substring(0, 16)}`
```

This uses `JSON.stringify(overrides)`. The `overrides` object is constructed with consistent key order (literal syntax in `compileMissions()` lines 70–76, 83–89, etc.), so **same intelligence graph → same mission IDs → same seed → same hash → same index**. No `Date.now()`, no `Math.random()`, no non-deterministic dependency in the mission ID path.

### Why PASS (not FAIL)

The prior audit claimed `Date.now()` appears in `mission_compiler.js` line 180 and in `_getRecentLoad`. This is **false for the current codebase**:

- `mission_compiler.js` line 180: pure SHA-256 of `type + JSON.stringify(overrides)`. No `Date.now()`.
- `_getRecentLoad` (lines 145–150): uses `this._assignmentSequence` (integer counter), not `Date.now()`.
- The 60-second sliding window mentioned in the prior audit does **not exist** in the current code. The window is a **10-assignment sequence window** (line 147: `this._assignmentSequence - 10`).

### State dependency

**However**, worker selection also depends on `loadBalanced` sort order (lines 98–103):

```js
const loadBalanced = available.sort((a, b) => {
  const aRecent = this._getRecentLoad(a.workerId);
  const bRecent = this._getRecentLoad(b.workerId);
  if (aRecent !== bRecent) return aRecent - bRecent;
  return a.currentLoad - b.currentLoad;
});
```

`_getRecentLoad` queries `_recentAssignments` (lines 145–150), which is state accumulated at runtime. This means:

| Scenario | Deterministic? | Reason |
|----------|---------------|--------|
| Replay from **clean** Scheduler (fresh `reset()`) | **YES** | All recent loads = 0, all currentLoads = 0 → sort stable → hash index stable |
| Replay from **dirty** Scheduler (prior assignments exist) | **NO** | Different sort order → potentially different worker for same inputs |

**Line references**: 87–109 (selection), 145–150 (state-dependent load), 163–166 (reset())

### Recommendation
- Document determinism assumption: "Same inputs + same scheduler state → same worker. Cross-state determinism is NOT guaranteed."
- Call `reset()` before any replay session.

---

## Invariant 2 — Specialization Scoring

**Verdict: WARN** — scheduler uses `findAvailable` (load/latency sort), NOT `findBest` (specialization scoring)

### Evidence

`_selectWorker` calls `this._workers.findAvailable(capability, 10)` at line 95.

`WorkerPortRegistry.findAvailable` (worker_port.js lines 271–279):

```js
findAvailable(capability, count = 1) {
  const candidates = [];
  for (const worker of this._workers.values()) {
    if (worker.isAvailable && (worker.capabilities.includes(capability) || capability === '*')) {
      candidates.push(worker);
    }
  }
  candidates.sort((a, b) => a.currentLoad - b.currentLoad || b.averageLatency - a.averageLatency);
  return candidates.slice(0, count);
}
```

Sort criteria: `currentLoad` ascending, then `averageLatency` descending (note: `b.averageLatency - a.averageLatency` means **higher latency sorts first** — this is counterintuitive and may be a bug).

`WorkerPortRegistry.findBest` (worker_port.js lines 282–304) **exists** but is **never called by the scheduler**:

```js
findBest(capability, missionType) {
  const score = this._computeScore(worker, missionType);
  // score = capMatch*0.25 + specMatch*0.3 + latency*0.15 + acceptance*0.2 + load*0.1
}
```

### Side finding: `findAvailable` latency sort is inverted

Line 278: `a.currentLoad - b.currentLoad || b.averageLatency - a.averageLatency`

This means: when loads are equal, **higher latency sorts first** (descending). This is likely unintentional — lower latency should sort first. If loads are equal, the worker with higher latency (slower) gets picked first, which is the opposite of what you'd want.

### Impact

- Workers with high specialization scores are NOT preferred.
- The hash-based selection distributes across the load/latency-sorted list, which is a reasonable fairness heuristic but ignores specialization entirely.
- The inverted latency sort in `findAvailable` means slower workers may be selected more often when loads are equal.

**Line references**: scheduler.js:95, worker_port.js:271–279, 282–304, 278

### Recommendation
- If specialization-aware routing is desired, switch to `findBest()` or add specialization to the sort comparator in `findAvailable`.
- Fix the `findAvailable` latency sort: `a.averageLatency - b.averageLatency` (ascending) instead of `b.averageLatency - a.averageLatency`.

---

## Invariant 3 — Replay Determinism

**Verdict: PASS** (clean state) / **WARN** (dirty state)

### Evidence

`_recentAssignments` is a `Map<workerId, Array<{missionId, capability, sequence}>>` (line 8).

| Factor | Detail | Line |
|--------|--------|------|
| Initial state | Empty Map | 8 |
| Record on schedule | `_recordAssignment(workerId, missionId, cap)` | 24, 75 |
| Cleanup threshold | Keeps last 100 assignments per worker | 135 |
| Recent load window | Last 10 assignments (sequence-based) | 147 |
| `reset()` method | Clears Map + resets sequence counter to 0 | 163–166 |

### The prior audit's replay-determinism FAILs were based on wrong code

The prior audit claimed three "fatal" breaks, all of which are **false for the current codebase**:

| Claimed break | Current code | Status |
|--------------|-------------|--------|
| `mission_compiler.js` line 180 embeds `Date.now()` | Uses SHA-256 of `type + JSON.stringify(overrides)` — no `Date.now()` | **False alarm** |
| `_recentAssignments` never cleaned up | `_cleanupOldAssignments()` runs every `_recordAssignment`, keeps last 100 entries | **False alarm** |
| `_getRecentLoad` uses `Date.now()` 60s window | Uses `_assignmentSequence - 10` — no wall clock | **False alarm** |

### Actual replay scenarios

**Clean replay** (after `reset()`):
- `_getRecentLoad` returns 0 for all workers.
- `available.sort(...)` compares all-zero recent loads, then all-zero currentLoads → **stable sort**.
- Hash index → fully deterministic. **PASS**

**Dirty replay** (prior assignments exist):
- Different workers have different recent loads (0–10).
- Sort order changes → `loadBalanced` array is permuted.
- Same hash → potentially **different worker** at the permuted index.
- **WARN**: Cross-state determinism is not guaranteed (by design — load balancing is stateful by intent).

**Line references**: 8, 116–132, 134–143, 145–150, 163–166

### Recommendation
- Call `reset()` before any replay session to guarantee determinism.
- Document that the Scheduler provides **same-state** determinism, not absolute determinism.

---

## Invariant 4 — Starvation

**Verdict: WARN** — probabilistic fairness only, no anti-starvation guarantee

### Evidence

The scheduler uses two mechanisms that together provide weak anti-starvation:

| Mechanism | Effect | Lines |
|-----------|--------|-------|
| **Hash distribution** | `index = hash % N` — uniform across N workers assuming good hash | 105–106 |
| **Recent-load sort** | Workers with fewer recent assignments (last 10) sort earlier, getting first pick of hash indices | 98–103 |

However:

1. **No minimum-assignment guarantee**: A worker at position `N-1` in a large pool could theoretically never be selected if the hash consistently produces indices 0..N-2. (In practice SHA-256 is uniform, but there is no countermeasure.)

2. **No starvation counter**: No tracking of "missed assignments" per worker, no boost for workers not selected recently.

3. **Sort + hash interaction**: The sort places low-load workers at the front, and the hash picks one of them. After assignment, `_getRecentLoad` increments (recent window = 10), so the worker moves down in the sort. This provides **de facto round-robin behavior** but is not mathematically guaranteed.

4. **Hash is per-capability**: For `schedule()`, each capability gets its own hash. If mission A uses cap `X` and mission B uses cap `Y`, their hash seeds differ entirely, so distribution is independent.

### Practical Assessment

With N workers of equal capability and a uniform hash, each worker has **~1/N** probability per assignment. The recent-load sort provides approximately round-robin behavior for burst scenarios. Starvation is unlikely but not structurally prevented.

**Line references**: 98–103 (load sort), 105–106 (hash modulus), 116–132 (recordAssignment), 134–143 (cleanup)

### Recommendation
- Add explicit anti-starvation: if a worker has not received an assignment in >100 calls, boost its priority.
- Alternatively, document the hash approach as "probabilistically fair" and accept it.

---

## Invariant 5 — Fairness: `scheduleForConsensus` with Insufficient Workers

**Verdict: FAIL** — causes hung missions when `workerCount` cannot be met

### Evidence

`scheduleForConsensus(mission, workerCount = 3)` at line 55:

```js
const workers = this._workers.findAvailable(primaryCap, workerCount);
if (workers.length === 0) return [];
```

`findAvailable(cap, count)` returns **up to** `count` workers (line 271–279). If only 1 worker is available, it returns 1 worker. The scheduler then proceeds:

```js
const assignment = {
  workers: workers.map(w => ({ workerId: w.workerId, ... })),
  consensusCount: workers.length,   // = 1, not 3
  // ...
};
for (const w of workers) {
  w.transition('assigned', { missionId: mission.id });
}
```

This succeeds with **fewer workers than requested**. The caller (`engine.js`) has two paths:

### Path A: `_executeMission` (git_diff-triggered) — **BUGGED**

Lines 165–167:
```js
const assignments = mission.metadata.priority >= 8
  ? this._scheduler.scheduleForConsensus(mission, 3)
  : this._scheduler.schedule(mission);
```

Does **NOT** set `mission.metadata.expectedWorkerCount`. Then `_checkMissionComplete` (lines 279–287):

```js
const expectedWorkers = mission.metadata.expectedWorkerCount ||
  (mission.metadata.priority >= 8 ? 3 : 1);
const completed = (mission.workerOutputs || []).length;
if (completed >= expectedWorkers) {
  this._resolveMission(mission);
}
```

Since `expectedWorkerCount` is undefined and priority >= 8, it defaults to **3**. But only **1** worker was assigned. That worker completes → `completed = 1 >= 3 → false` → **mission hangs forever**.

### Path B: `dispatchToAssignment` (autonomous loop) — **WORKS**

Line 195:
```js
mission.metadata.expectedWorkerCount = dispatch.workers.length;
```

Sets expected count to the **actual** number of assigned workers. Correct.

### Summary

| Path | Sets expectedWorkerCount? | Behaviour |
|------|--------------------------|-----------|
| `_executeMission` (git_diff) | **No** | Hangs if fewer than 3 workers available |
| `dispatchToAssignment` (loop) | Yes | Correct — adjusts to actual count |

### Additional Concern: Redundant `scheduleForConsensus` call

`_executeMission` calls `scheduleForConsensus(mission, 3)` which transitions workers to `assigned`. Then `dispatchToAssignment` (called later by the autonomous loop) calls it **again** for the same mission, but is blocked by the `mission.status === 'processing'` guard at line 181. So the mission remains stuck in `processing` with only 1 worker transitioned and no way to proceed.

**Line references**: scheduler.js:55–85, engine.js:165–175, 279–287, 195

### Recommendation
1. In `scheduleForConsensus`, verify that `workers.length >= workerCount` and return `[]` (or log a warning) if not met.
2. In `_executeMission` (engine.js), set `mission.metadata.expectedWorkerCount` after scheduling (same as `dispatchToAssignment` does).

---

## Invariant 6 — Routing Key Consumption

**Verdict: WARN** — `routingKey` is computed and stored but never consumed downstream

### Evidence

`_computeRoutingKey` (lines 111–114):
```js
_computeRoutingKey(mission) {
  const raw = `${mission.type}:${mission.target || 'global'}:${mission.metadata.priority}`;
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 12);
}
```

Source of truth: SHA-256 of `type:target:priority`, no randomness.

`routingKey` is assigned to the `assignment` object in both `schedule()` (line 40) and `scheduleForConsensus()` (line 70).

A repository-wide grep for `routingKey`, `routing_key`, `routing-key`, and `_computeRoutingKey` across the entire `orchestration/` directory yields **zero hits outside scheduler.js**:

```
orchestration/execution/scheduler.js:
  40: routingKey: this._computeRoutingKey(mission)
  70: routingKey: this._computeRoutingKey(mission)
  111: _computeRoutingKey(mission)
```

No consumer reads `assignment.routingKey`:
- Engine.js: reads `assignments[0].workers`, `dispatch.workers`, `dispatch.workers.length` — never reads `routingKey`.
- EventQueue: not emitted in any event.
- ArtifactRouter, ConsensusEngine, WorkerStateMachine, ArtifactStore: not referenced in any file.

**Line references**: 40, 70, 111–114

### Recommendation
- Either remove `routingKey` as dead code, or wire it into:
  - Event emission (include in `worker_assigned` event data)
  - Artifact context (pass to ContextAuthority for routing decisions)
  - Queue partitioning (if persistent queues are implemented)

---

## Invariant 7 — Transition Coupling

**Verdict: PASS** — VALID_TRANSITIONS chain is correct

### Evidence

The scheduler calls `worker.transition('assigned', ...)` in two places:

| Method | Line | Workers affected |
|--------|------|-----------------|
| `schedule()` | 44 | One per selected capability |
| `scheduleForConsensus()` | 74 | All selected workers |

WorkerPort.VALID_TRANSITIONS (worker_port.js lines 4–13):

```
idle:       ['assigned']
assigned:   ['running', 'idle']
running:    ['waiting', 'failed', 'idle']
waiting:    ['consensus', 'completed', 'failed', 'running']
consensus:  ['completed', 'failed']
completed:  ['idle', 'assigned']
failed:     ['idle']
archived:   ['idle']
```

The engine completes the chain:

| Step | State | Caller | File:Line |
|------|-------|--------|-----------|
| 1 | `idle → assigned` | `scheduler.schedule()` `.transition('assigned')` | scheduler.js:44,74 |
| 2 | `assigned → running` | `dispatchToAssignment()` `.transition('running')` | engine.js:202 |
| 3 | `running → waiting` | `collectWorkerOutput()` `.transition('waiting')` | engine.js:249 |
| 4 | `waiting → completed/failed` | `_resolveMission()` `.transition('completed/failed')` | engine.js:310 |
| 5 | `completed/failed → idle` | `_resolveMission()` `.transition('idle')` | engine.js:311 |

All transitions are valid per the state machine.

### Note on duplicate transitions

In `schedule()`, if the **same worker** is selected for multiple capabilities (possible when capabilities overlap on a single worker), `transition('assigned')` is called multiple times for the same worker. The second call fails with a warning:

```
[WorkerPort] Invalid transition: assigned → assigned
```

This does not crash — `transition()` returns `false` (worker_port.js:62–65). But it means:
- The worker's load only increments once (first successful transition)
- The worker appears multiple times in `selectedWorkers`
- `worker_assigned` event has duplicate entries for the same workerId
- Subsequent `transition('running')` in the engine works correctly (state is still `assigned`)

This is not a transition-chain violation, but is an **assignment deduplication** issue.

### Prior audit claim about `WorkerStateMachine` divergence

The prior audit claimed two state machines (`WorkerPort` + `WorkerStateMachine`) have divergent transition rules. This is true as an architectural observation, but is **not a scheduler bug** — the scheduler only calls `WorkerPort.transition()`, not `WorkerStateMachine.transition()`. The engine manages both independently. The scheduler's responsibility is solely to transition the WorkerPort to `assigned`, which it does correctly.

**Line references**: scheduler.js:43–45, 73–76, worker_port.js:4–13, 61–90, engine.js:200–202, 247–249, 304–311

### Recommendation
- In `schedule()`, deduplicate workers after selection: if same `workerId` is already in `selectedWorkers`, skip.
- Or change the per-capability loop to use a Set-based dedup.

---

## Invariant 8 — Event Emission

**Verdict: PASS** — correct structure, minor gap in top-level workerId

### Evidence

`worker_assigned` event type is registered in `VALID_EVENT_TYPES` (event_queue.js line 11):
```js
'worker_assigned',
```

Emitted in two places:

**`schedule()` (lines 47–50)**:
```js
this._events.emit('worker_assigned', {
  missionId: mission.id,
  assignments: selectedWorkers.map(w => ({
    workerId: w.worker.workerId,
    capability: w.capability
  }))
});
```

**`scheduleForConsensus()` (lines 78–82)**:
```js
this._events.emit('worker_assigned', {
  missionId: mission.id,
  assignments: workers.map(w => ({
    workerId: w.workerId,
    capability: primaryCap
  })),
  consensusCount: workers.length
});
```

| Field | `schedule()` | `scheduleForConsensus()` | EventQueue mapping |
|-------|-------------|------------------------|-------------------|
| `missionId` | Yes | Yes | → `event.mission_id` (line 90) |
| `assignments[].workerId` | Yes | Yes | Nested — not mapped to top-level `worker_id` |
| `assignments[].capability` | Yes | Yes | Not in event schema, but carried in `data` |
| `consensusCount` | No | Yes | Consensus-specific |
| Top-level `workerId` | **No** | **No** | EventQueue maps `data.workerId` → `event.worker_id` (line 91) |

**Gap**: The event carries `assignments[]` array but does NOT set a top-level `workerId`. The EventQueue maps `data.workerId` to `event.worker_id` (line 91). Since no top-level `workerId` is set, `event.worker_id` will be `null` for all `worker_assigned` events. This means downstream subscriptions that filter by `worker_id` will miss these events entirely.

**Early-return guards**: Both methods handle edge cases without emitting:
- `schedule()`: returns `[]` if no workers selected (line 28) — no emission, correct.
- `scheduleForConsensus()`: returns `[]` if no capabilities (line 56) or no workers (line 61) — no emission, correct.

**Line references**: 28, 47–50, 56, 61, 78–82, event_queue.js:11, 90–91

### Recommendation
- Add `workerId: selectedWorkers[0]?.worker.workerId` (or `workers[0]?.workerId`) to the event payload so `event.worker_id` is populated for the primary worker.

---

## Additional Findings

### Finding A: Duplicate worker assignment per-capability loop

**Severity: MINOR BUG**

In `schedule()`, the per-capability loop (lines 16–26):

```js
for (const cap of requiredCaps) {
  const worker = this._selectWorker(cap, mission);
  if (worker) {
    selectedWorkers.push({ worker, capability: cap, ... });
    this._recordAssignment(worker.workerId, mission.id, cap);
  }
}
```

If a single worker supports all `requiredCaps` (e.g., OpenCodeWorkerPort supports `authority.audit.time`, `authority.audit.identity`, `authority.audit.hash` — 3 capabilities), the same worker is selected for each. The worker receives multiple `transition('assigned')` calls (second fails with warning), appears multiple times in `selectedWorkers`, and `_recordAssignment` inflates the worker's perceived load by 3x.

**Lines**: 16–26, 43–45

### Finding B: `findAvailable` sort has inverted latency

**Severity: MINOR BUG** (in worker_port.js, affects scheduler indirectly)

Line 278: `a.currentLoad - b.currentLoad || b.averageLatency - a.averageLatency`

This means when loads are equal, workers are sorted by `averageLatency` **descending** — slower workers sort first. This is almost certainly unintentional. The likely intent was `a.averageLatency - b.averageLatency` (faster workers first).

**Lines**: worker_port.js:278

### Finding C: No unit tests for Scheduler

**Severity: OBSERVATION**

No test file exists for Scheduler:
- No `scheduler.test.js` or `scheduler.spec.js` in `orchestration/execution/`
- No `__tests__/` directory found containing scheduler tests
- Test artifacts in `orchestration/dormant_classifications/` are JSON classification files, not executable tests

**Lines**: N/A

### Finding D: `schedule()` returns single-element array wrapping a single assignment

**Severity: OBSERVATION** (architectural)

Both `schedule()` and `scheduleForConsensus()` return `[assignment]` — always a single-element array wrapping one assignment object. The caller (engine.js) always accesses `assignments[0]`. If multiple assignments were intended (e.g., one per capability), the return should be flat. If only one assignment is ever produced, the array wrapper is unnecessary complexity.

**Lines**: 52, 84

### Finding E: `_assignmentHistory` and `_assignmentSequence` off-by-one

**Severity: MINOR**

In `_recordAssignment` (lines 116–132):
```js
this._recentAssignments.get(workerId).push({
  missionId,
  capability,
  sequence: this._assignmentSequence++
});
this._assignmentHistory.push({
  workerId,
  missionId,
  capability,
  sequence: this._assignmentSequence  // Note: post-increment already happened
});
```

The sequence value stored in `_recentAssignments` is `this._assignmentSequence` **before** increment (postfix `++`), while the value in `_assignmentHistory` is `this._assignmentSequence` **after** increment. This means the two records will have different sequence numbers for the same assignment, which could cause confusion in `getStats()` if comparing across the two data structures.

**Lines**: 123, 129

---

## Summary Table

| # | Invariant | Verdict | Lines | Key Issue |
|---|-----------|---------|-------|-----------|
| 1 | Deterministic worker selection | PASS | 87–109, mission_compiler.js:180 | Deterministic for same state; cross-state determinism requires `reset()` |
| 2 | Specialization scoring | **WARN** | 95, worker_port.js:271–279 | Uses `findAvailable` (load/latency), not `findBest` (specialization) |
| 3 | Replay determinism | PASS/WARN | 8, 116–150, 163–166 | Clean replay = deterministic; dirty replay = state-dependent by intent |
| 4 | Starvation | **WARN** | 98–106, 116–132 | Hash distribution is probabilistically fair; no explicit anti-starvation |
| 5 | Fairness (insufficient workers) | **FAIL** | 55–85, engine.js:165–175, 279–287 | `scheduleForConsensus` returns <3 workers but engine expects 3 → hung mission |
| 6 | Routing key consumption | **WARN** | 40, 70, 111–114 | Computed, stored, never read by any downstream consumer (dead code) |
| 7 | Transition coupling | PASS | 44, 74, worker_port.js:4–13 | VALID_TRANSITIONS chain is correct; minor dedup issue in per-capability loop |
| 8 | Event emission | PASS | 47–50, 78–82 | Correct structure; missing top-level `workerId` means `event.worker_id` is always `null` |

### Additional Findings

| Finding | Severity | Lines | Issue |
|---------|----------|-------|-------|
| A: Duplicate worker assignment | MINOR | 16–26 | Same worker selected for multiple capabilities; multiple transitions + inflated load |
| B: Inverted latency sort in `findAvailable` | MINOR | worker_port.js:278 | `b.latency - a.latency` means slower workers sort first when loads are equal |
| C: No unit tests | OBSERVATION | — | No `scheduler.test.js` or equivalent |
| D: Single-element array return | OBSERVATION | 52, 84 | Always `[assignment]`; unnecessary wrapper for callers |
| E: Off-by-one in sequence counter | MINOR | 123, 129 | `_recentAssignments` and `_assignmentHistory` store different sequence values |

---

## Confidence Assessment

| Aspect | Rating | Rationale |
|--------|--------|-----------|
| Code reading confidence | HIGH | All 169 lines read; all call sites inspected in engine.js (716 lines), worker_port.js (344 lines), event_queue.js (218 lines), mission_compiler.js (210 lines), consensus_engine.js (164 lines) |
| Runtime verification | NONE | No live Docker; code-only audit. `scheduleForConsensus` worker deficiency bug and worker deduplication have not been observed in practice |
| Test coverage | NONE | No scheduler unit tests exist |

---

## Recommended Fixes (priority order)

1. **CRITICAL — Hung mission on `scheduleForConsensus` with insufficient workers**:
   - In `scheduleForConsensus()`, add guard: `if (workers.length < workerCount) return [];` (or log warning with actual count and proceed with adjusted expectations)
   - In `_executeMission()` (engine.js), set `mission.metadata.expectedWorkerCount = assignments[0].workers.length` after scheduling

2. **MINOR — Deduplicate workers in per-capability loop**:
   - In `schedule()`, add a `Set`-based check: `if (selectedWorkers.some(w => w.worker.workerId === worker.workerId)) continue;`

3. **MINOR — Fix inverted latency sort in `WorkerPortRegistry.findAvailable`**:
   - Change `b.averageLatency - a.averageLatency` to `a.averageLatency - b.averageLatency` at worker_port.js line 278

4. **MINOR — Fix off-by-one in `_recordAssignment` sequence counter**:
   - Store the same sequence value in both `_recentAssignments` and `_assignmentHistory` (e.g., capture pre-increment value in a local variable)

5. **LOW — Add top-level `workerId` to `worker_assigned` events**:
   - Both emission sites: add `workerId: selectedWorkers[0]?.worker.workerId` (or `workers[0]?.workerId`) for primary worker

6. **LOW — Remove or wire `routingKey`**:
   - If dead code: remove `_computeRoutingKey` and `routingKey` fields (saves ~4 lines, one SHA-256 hash per assignment)
   - If future use: document in comments where routingKey will be consumed

7. **INFO — Add unit test file `orchestration/execution/scheduler.test.js`** covering:
   - Deterministic selection (same seed → same worker)
   - `scheduleForConsensus` with insufficient workers returns empty
   - Worker deduplication across capabilities
   - `reset()` guarantees clean-state determinism
