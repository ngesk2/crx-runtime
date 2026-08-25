# CANONICAL-TRACE-CONTRACT-001

**Date:** 2026-08-24
**Branch:** `constitutional-trunk` @ `85c2aaff`
**Status:** V1 — canonical trace record defined, gaps documented

---

## 0. Purpose

This document defines the **canonical trace record** — the minimum set of fields every event and mission must carry to enable causal reconstruction, replay, and evaluation. It is the contract that eval harnesses (Phase D) assert against.

---

## 1. Event Trace Record

Every event persisted to `ping_events` must carry these fields:

### 1.1 Required Fields (enforced by UnifiedEventRuntime.emit)

| Field | Type | Source | Invariant |
|-------|------|--------|-----------|
| `event_id` | string | SHA-256 content-derived | INV-001 |
| `event_type` | string | governance-validated | INV-011 |
| `source` | string | producer identifier | — |
| `timestamp` | string | ISO-8601 via ConstitutionalTimeAuthority | INV-006 |
| `namespace` | string | `core::<name>` \| `tenant::<id>` | INV-017 |
| `payload` | object | business data | — |
| `metadata` | object | enrichment | — |

### 1.2 Metadata Sub-fields (enforced by UnifiedEventRuntime.emit)

| Field | Type | Source | Invariant |
|-------|------|--------|-----------|
| `schema_version` | string | hardcoded `'1.0.0'` | INV-013 |
| `namespace` | string | same as top-level | INV-019 |
| `causation_id` | string\|null | triggering event_id | INV-015 |
| `correlation_id` | string | root event_id (default = eventId) | INV-015 |
| `confidence` | number\|null | optional, carried not computed | INV-016 |

### 1.3 Missing Event Fields (Phase C candidates)

| Field | Type | Purpose | Priority |
|-------|------|---------|----------|
| `attempt_number` | int | Which processing attempt (1-based) | HIGH |
| `dispatch_outcome` | enum | `persisted` \| `deduplicated` \| `governance_rejected` \| `handler_failed` | HIGH |
| `span_id` | string | OpenTelemetry-style trace grouping | LOW |
| `parent_span_id` | string | Causal parent within a single event's processing | LOW |

---

## 2. Mission Trace Record

Every mission persisted to `ping_missions` must carry these fields:

### 2.1 Required Fields (enforced by MissionRuntime)

| Field | Type | Source | Invariant |
|-------|------|--------|-----------|
| `mission_id` | string | SHA-256 deterministic | INV-002 |
| `mission_type` | string | from EVENT_MISSION_MAP | — |
| `status` | enum | lifecycle state machine | INV-035 |
| `priority` | int | canonical 0-3 | INV-022 |
| `payload` | jsonb | business data + event context | — |
| `result` | jsonb\|null | worker output | — |
| `assigned_to` | string\|null | worker name | — |
| `created_at` | timestamptz | via ConstitutionalTimeAuthority | INV-006 |
| `updated_at` | timestamptz | via ConstitutionalTimeAuthority | INV-006 |
| `error` | text\|null | failure reason | — |
| `retries` | int | current retry count | INV-036 |
| `max_attempts` | int | retry ceiling (default 3) | INV-036 |
| `lease_until` | timestamptz\|null | 60s sliding window | INV-037 |
| `claimed_at` | timestamptz\|null | when assigned | INV-034 |

### 2.2 Payload Sub-fields (set by EventToMissionBridge)

| Field | Type | Source | Invariant |
|-------|------|--------|-----------|
| `event_id` | string | triggering event | INV-002 |
| `event_type` | string | original business event type | — |
| `source` | string | event source | — |
| `namespace` | string | event namespace | INV-020 |
| `correlation_id` | string | root event correlation | INV-015 |
| `canonical_hash` | string\|null | canonical object hash | INV-009 |
| `confidence` | number\|null | event confidence | INV-016 |
| `payload` | object | nested business payload | — |

### 2.3 Dispatch Metadata (added by MissionScheduler._dispatch)

| Field | Type | Source |
|-------|------|--------|
| `mission_type` | string | mission type (for logging) |
| `priority` | int | canonical priority |
| `assigned_to` | string | worker name |
| `canonical_hash` | string\|null | from mission payload |
| `confidence` | number\|null | from mission payload |
| `correlation_id` | string | from mission payload |
| `causation_id` | string\|null | from mission payload |

### 2.4 Missing Mission Fields (Phase C candidates)

| Field | Type | Purpose | Priority |
|-------|------|---------|----------|
| `attempt_number` | int | Which retry attempt (1-based) | HIGH |
| `dispatch_outcome` | enum | `dispatched` \| `skipped_capacity` \| `no_worker` \| `dormant_worker` \| `worker_not_registered` | HIGH |
| `degradation_reason` | string | Why degraded (capacity, no worker, etc.) | MEDIUM |
| `lifecycle_transitions` | jsonb | Array of `{from, to, at, reason}` | MEDIUM |
| `trace_summary` | jsonb | Computed: event count, duration, outcome | LOW |

---

## 3. Worker Dispatch Trace Record

The synthetic event created by MissionScheduler._dispatch for worker consumption:

### 3.1 Required Fields (set by scheduler at dispatch time)

| Field | Type | Source |
|-------|------|--------|
| `event_id` | string | from mission payload (INV-001) |
| `event_type` | string | from mission payload (original business type) |
| `source` | string | from mission payload or `'mission-scheduler'` |
| `namespace` | string | from mission payload (INV-020) |
| `mission_id` | string | mission.mission_id |
| `payload` | object | unwrapped business payload |
| `metadata.mission_type` | string | mission type |
| `metadata.priority` | int | canonical priority |
| `metadata.assigned_to` | string | worker name |
| `metadata.canonical_hash` | string\|null | from mission payload |
| `metadata.confidence` | number\|null | from mission payload |
| `metadata.correlation_id` | string | root correlation (INV-015) |
| `metadata.causation_id` | string\|null | triggering event_id |

### 3.2 Missing Worker Fields (Phase C candidates)

| Field | Type | Purpose | Priority |
|-------|------|---------|----------|
| `metadata.attempt_number` | int | Which retry attempt | HIGH |
| `metadata.dispatch_outcome` | enum | Always `dispatched` at this point (scheduler already decided) | — |
| `metadata.dispatch_timestamp` | string | When dispatch occurred (for duration calc) | MEDIUM |

---

## 4. Trace Reconstruction Algorithm

To reconstruct the full causal trace for any business observation:

```
1. Start with the root event (e.g., REVIEW_RECEIVED)
   → event_id = root_id
   → correlation_id = root_id (default)

2. Query ping_events WHERE metadata->>'correlation_id' = root_id ORDER BY timestamp ASC
   → returns all events in the causal chain

3. For each mission created from these events:
   → query ping_missions WHERE payload->>'event_id' = event_id
   → mission.trace = { mission_id, status, assigned_to, retries, error, result }

4. For each worker dispatch:
   → synthetic event_id from mission payload
   → worker result stored in mission.result

5. Assemble timeline:
   timestamp | event_type          | source              | namespace    | outcome
   ----------|---------------------|---------------------|--------------|--------
   T+0       | REVIEW_RECEIVED     | user-ingest         | tenant::hpp  | persisted
   T+1       | OBSERVATION_CREATED | observation-worker  | tenant::hpp  | persisted
   T+2       | CLAIM_CREATED       | claim-worker        | tenant::hpp  | persisted
   T+3       | CLASSIFICATION_CREATED | classification-worker | tenant::hpp | persisted
   T+4       | RECOMMENDATION_CREATED | recommendation-worker | tenant::hpp | persisted
   T+5       | PROJECTION_CREATED  | projection-worker   | tenant::hpp  | projected
   T+6       | REPLAY_COMPLETED    | replay-worker       | tenant::hpp  | completed
   T+7       | WITNESS_CREATED     | witness-worker      | tenant::hpp  | completed
   T+8       | LINEAGE_CREATED     | lineage-worker      | tenant::hpp  | completed
```

---

## 5. Invariant Assertions (for eval harness)

Every eval scenario must assert these trace invariants:

### 5.1 Event Invariants

```javascript
// INV-001: Deterministic event ID
assert.equal(event1.event_id, event2.event_id, 'Same logical event → same ID');

// INV-006: No physical time dependency
assert.ok(!event.metadata.physical_timestamp, 'No physical timestamp in metadata');

// INV-015: Causal chain integrity
assert.equal(event.metadata.causation_id, triggeringEvent.event_id);
assert.equal(event.metadata.correlation_id, rootEvent.event_id);

// INV-017: Namespace preserved
assert.equal(event.namespace, expectedNamespace);
assert.match(event.namespace, /^(core|tenant)::[a-zA-Z0-9_-]+$/);

// INV-016: Confidence null propagation
if (rootEvent.metadata.confidence === null) {
  assert.equal(event.metadata.confidence, null, 'Null confidence propagated');
}
```

### 5.2 Mission Invariants

```javascript
// INV-002: Deterministic mission ID
assert.equal(mission1.mission_id, mission2.mission_id, 'Same event → same mission');

// INV-034: Atomic claim
assert.equal(mission.status, 'assigned');
assert.ok(mission.claimed_at, 'claimed_at set');
assert.ok(mission.lease_until, 'lease_until set');

// INV-035: Forward-only transitions
assert.ok(['created','assigned','running','completed','failed','retry_pending'].includes(mission.status));

// INV-036: Retry exhaustion
if (mission.retries >= mission.max_attempts) {
  assert.equal(mission.status, 'failed', 'Exhausted → permanent failed');
}

// INV-037: Lease window
const leaseMs = new Date(mission.lease_until) - new Date(mission.claimed_at);
assert.ok(leaseMs > 0 && leaseMs <= 120000, 'Lease within 0-120s window');
```

### 5.3 Trace Reconstruction Invariants

```javascript
// Full chain has correct event count
assert.equal(trace.eventCount, expectedCount, 'All events in chain present');

// All events share correlation_id
const correlationIds = new Set(trace.events.map(e => e.metadata.correlation_id));
assert.equal(correlationIds.size, 1, 'Single correlation group');

// Events ordered by timestamp
for (let i = 1; i < trace.events.length; i++) {
  assert.ok(
    new Date(trace.events[i].timestamp) >= new Date(trace.events[i-1].timestamp),
    'Events ordered by timestamp'
  );
}
```

---

## 6. Gaps Summary

| Gap | Severity | Current State | Remediation |
|-----|----------|---------------|-------------|
| `attempt_number` missing from event + mission | HIGH | No retry attempt tracking | Add to MissionRuntime.failWithRetry and scheduler dispatch |
| `dispatch_outcome` missing from mission | HIGH | Scheduler logs skip reasons but doesn't persist them | Add column to ping_missions or metadata |
| `lifecycle_transitions` missing | MEDIUM | No transition history (only current status) | Add jsonb column or separate transitions table |
| `dispatch_timestamp` missing from worker event | MEDIUM | Duration calculated from mission timestamps only | Add to scheduler dispatch metadata |
| No `span_id` / `parent_span_id` | LOW | No OpenTelemetry-style grouping | Deferred to observability phase |

---

## 7. Next Steps

1. **Write trace contract tests** — assert all 5.1-5.3 invariants in a new `test_trace_contract.js`
2. **Add `attempt_number`** to MissionRuntime.failWithRetry and scheduler dispatch metadata
3. **Add `dispatch_outcome`** to MissionRuntime — persist skip/dispatch/fail outcomes
4. **Create eval harness** — 8 scenarios asserting trace invariants under stress
5. **Wire trace reconstruction** — GET /missions/:id/trace returns the full timeline
