# Patch Proposal — C1/C2/C3 (READ ONLY)

**Status**: PROPOSAL — no code modified. Every claim verified against the exact file/line.
**Bugs**: 3 production-blocking defects in the canonical worker chain, first documented in `ORCHESTRATION_CONVERGENCE_PLAN.md`.
**Directive compliance**: READ ONLY WITHOUT DELETING ANY CAPABILITIES. All three patches ADD wiring / correct behavior. No capability removed.

---

## C1 — `embeddingService.subscribe is not a function` — CRITICAL

### Evidence
`gateway/bootstrap/gateway_runtime.js:480`
```js
await embeddingService.initialize();
embeddingService.subscribe(unifiedEventRuntime);   // ← TypeError, no such method
```

`ping-runtime/embeddings/embedding_service.js` (197 lines, full read) exposes:
`initialize()`, `isIndexable()`, `embed()`, `projectToQdrant()`, `search()`, `getStats()`.
**There is no `subscribe()` method.**

### Why it is worse than a crash
Line 480 is inside the `if (pgAvailable) { try { ... } catch { pgAvailable = false } }` block
(`gateway_runtime.js:469-566`). The TypeError is swallowed by the catch, setting
`pgAvailable = false` — which **disables the entire PG subsystem**: workers are never
registered, the Mission Scheduler never starts, the Event-to-Mission Bridge never starts,
and business emitters never initialize. One missing method silently kills the whole pipeline.

### Proposed fix — implement `subscribe()` (capability preserved)
Add to `EmbeddingService` a `subscribe(eventRuntime)` method mirroring the proven
graph-projection subscriber pattern already at `gateway_runtime.js:525-555`:

```js
/**
 * Subscribe to indexable event types on the UnifiedEventRuntime.
 * Async (non-blocking) projection: each matching event is embedded and
 * upserted to Qdrant. Mirrors the graph-projection subscriber pattern.
 * @param {object} eventRuntime — UnifiedEventRuntime (must expose .on(type, handler))
 */
subscribe(eventRuntime) {
  if (!eventRuntime || typeof eventRuntime.on !== 'function') {
    console.warn('[EmbeddingService] No eventRuntime — subscription skipped');
    return this;
  }
  for (const type of this._indexableTypes) {
    eventRuntime.on(type, async (event) => {
      try {
        const payload = event.payload || {};
        const canonicalObject = {
          id: event.event_id,
          kind: event.event_type,
          namespace: event.namespace,
          identity: event.identity || null,
          canonical_hash: (event.metadata && event.metadata.canonical_hash) || null,
          payload,
        };
        await this.projectToQdrant(canonicalObject, {
          sourceEventId: event.event_id,
          eventType: event.event_type,
          namespace: event.namespace,
        });
      } catch (err) {
        console.error(`[EmbeddingService] Projection failed for ${event.event_type}: ${err.message}`);
      }
    });
  }
  this._stats.subscribed = this._indexableTypes.size;
  return this;
}
```

- `this._indexableTypes` is already the constructor-defined Set (19 knowledge-worthy types, default `INDEXABLE_TYPES`).
- Overlap with `ProjectionWorker` (both project `RECOMMENDATION_CREATED` etc.) is **idempotent** — same point id (content-addressed) → same upsert. Dedup of the two projection triggers is a Phase 2 (event bus convergence) concern, NOT this fix.

---

## C2 — Phantom mission completions — CRITICAL

### Evidence
`ping-runtime/orchestration/mission_scheduler.js:172-191`
```js
const event = {
  event_type: mission.mission_type,        // ← wrong: mission_type, not event_type
  ...
};
await this._workerRuntime.dispatch(event);
await this._missionRuntime.complete(mission.mission_id, { ... });   // ← phantom complete
```

### Root cause
The bridge stores the **original event type** in the mission payload:
`ping-runtime/orchestration/event_to_mission_bridge.js:105-109`
```js
await this._missionRuntime.create(mapping.missionType, {
  event_id: event.event_id,
  event_type: event.event_type,   // ← the real type (e.g. LEAD_CREATED)
  source: event.source,
  payload: event.payload,
}, { priority: mapping.priority, createdBy: 'event-to-mission-bridge' });
```

`WorkerRuntime.dispatch` (`ping-runtime/workers/worker_runtime.js:69-94`) only routes events whose
`event_type` is in a worker's registered `eventTypes`. Workers are registered with **business event types**
(`canonical_workers.js:404-427`: observation accepts `LEAD_CREATED`, `CUSTOMER_CREATED`, ...; claim accepts
`OBSERVATION_CREATED`, `CLAIM_GENERATE`, ...). But the scheduler dispatches `mission.mission_type`
(`LEAD_FOLLOWUP`, `CUSTOMER_ONBOARD`, ...) which **matches no worker** → dispatch silently no-ops →
`complete()` still marks the mission done. Mission completed, worker never ran → chain dies.

### Proven fix (already exists in the test suite)
`gateway/test_commissioning.js:345-352` is the passing reference implementation:
```js
const parsedPayload = typeof mission.payload === 'string' ? JSON.parse(mission.payload) : mission.payload;
const event = {
  event_type: parsedPayload.event_type || mission.mission_type,   // ← correct
  source: 'mission-scheduler',
  mission_id: mission.mission_id,
  payload: parsedPayload,
  metadata: { mission_type: mission.mission_type, priority: mission.priority },
};
```

### Proposed fix — align `_dispatch` with the proven test
Replace `mission_scheduler.js:172-182` with:
```js
// Build event for worker — the worker routes on the ORIGINAL event type,
// not the mission type. The mission payload carries it (bridge stores
// event_type in mission payload). Mirrors test_commissioning.js:345-352.
const payload = typeof mission.payload === 'string' ? JSON.parse(mission.payload) : (mission.payload || {});
const event = {
  event_type: payload.event_type || mission.mission_type,
  source: 'mission-scheduler',
  mission_id: mission.mission_id,
  payload,
  metadata: {
    mission_type: mission.mission_type,
    priority: mission.priority,
    assigned_to: workerName,
  },
};
```
Optionally harden `_dispatch` so a no-op dispatch is not a phantom complete:
```js
await this._workerRuntime.dispatch(event);
// dispatch() already awaits worker.handle(); workers that matched will have incremented.
```

---

## C3 — ProjectionWorker never receives `embeddingService` — HIGH

### Evidence
`gateway/bootstrap/gateway_runtime.js:484-488`
```js
registerCanonicalWorkers(workerRuntime, {
  eventRuntime: unifiedEventRuntime,
  pool: this._pool,
  aiRuntime,
});
```
No `embeddingService` key.

`ping-runtime/workers/canonical_workers.js:122` (ProjectionWorker) is already wired to consume it:
```js
this._embeddingService = options.embeddingService || null;
```
and `:146-165` already projects to Qdrant when it is present. `registerCanonicalWorkers`
(`canonical_workers.js:429-430`) spreads `...options` into every worker constructor:
```js
const worker = new Worker({ ...options, ...workerOpts });
```
So the ONLY missing piece is passing the key at the call site.

### Proposed fix — one-line addition
```js
registerCanonicalWorkers(workerRuntime, {
  eventRuntime: unifiedEventRuntime,
  pool: this._pool,
  aiRuntime,
  embeddingService,                       // ← ADD: enables ProjectionWorker Qdrant path
});
```
No change to `canonical_workers.js` — the consumer already exists.

---

## Verification plan (after approval)

| # | Check | How |
|---|-------|-----|
| 1 | EmbeddingService has `subscribe` | `node -e "const {EmbeddingService}=require('./ping-runtime/embeddings/embedding_service'); console.log(typeof EmbeddingService.prototype.subscribe)"` → `function` |
| 2 | Scheduler dispatch uses real event_type | Mirror `test_commissioning.js` chain: `REVIEW_RECEIVED → REVIEW_RESPONSE(mission) → observation(worker on REVIEW_RECEIVED)`; assert `missionRuntime.getStats().completed > 0` AND observation worker `totalProcessed > 0` |
| 3 | ProjectionWorker receives embeddingService | Boot `gateway_runtime` with PG mocked; assert `workerRuntime.getStats().workers.projection` exists and its worker `_embeddingService` is truthy |
| 4 | Full suite regression | `node --test test_commissioning.js` + full gateway suite (158 baseline, 1 Docker skip) |

## Open questions (deferred to convergence, NOT this patch)
1. `EmbeddingService.subscribe` (spine) and `ProjectionWorker` (chain) both project — should one be the single projection owner in Phase 2?
2. Should `MissionScheduler.complete()` require evidence the worker actually processed (dispatch result count) rather than assuming?
