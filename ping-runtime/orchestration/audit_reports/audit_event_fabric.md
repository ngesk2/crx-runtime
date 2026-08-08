# Event Integrity Report

**File:** `orchestration/execution/event_queue.js` (214 lines)
**Audit Date:** 2026-07-04
**Auditor:** OpenCode Constitutional Orchestration Fabric
**Scope:** 9 invariants covering deterministic IDs, ordering, duplicates, idempotency, immutability, schema propagation, causation, lineage, and correlation.

---

## 1. Deterministic Event IDs

**Verdict: PASS**

**Evidence:**
- Line 73-75: Event ID generation
```js
const sortedData = this._sortKeys(data);
const rawId = `${eventType}_${this._deterministicJson(data)}`;
const eventId = crypto.createHash('sha256').update(rawId).digest('hex').substring(0, 16);
```

**Determinism factors:**
- `_sortKeys()` (L55-62): Recursively sorts object keys lexicographically
- `_deterministicJson()` (L64-66): Stringifies sorted object
- SHA-256 hash of deterministic string
- Same eventType + same data → same eventId

**Edge cases handled:**
- Arrays: recursively sorted (L57)
- Nested objects: recursively sorted (L58-61)
- Null/primitive values: returned as-is (L56)

**Verdict:** Event IDs are deterministic and replay-safe.

---

## 2. Deterministic Ordering

**Verdict: FAIL — wall clock dependency**

**Evidence:**
- Line 82: Global sequence counter
```js
const globalSequence = ++this._globalSequence;
```
- Line 99: Event includes `global_sequence` field
- Line 98: Event includes `timestamp: new Date().toISOString()` — **NON-DETERMINISTIC**

**Problem:**
- Global sequence is deterministic (monotonic counter)
- But timestamp field uses wall clock, making event ordering non-deterministic across replays
- Two identical event streams emitted at different wall-clock times will have different `timestamp` values

**Impact:**
- Event ordering by timestamp is non-replayable
- `getEventsSince(timestamp)` (L160-163) depends on wall-clock comparison
- Stats calculation (L175-177) depends on wall-clock comparison

**Remediation:**
1. Remove `timestamp` field or replace with deterministic epoch (e.g., global_sequence)
2. Replace `getEventsSince` with sequence-based query
3. Replace stats rate calculation with sequence-based window

---

## 3. No Duplicate Emission

**Verdict: PASS**

**Evidence:**
- Line 77-80: Duplicate detection
```js
if (this._emittedIds.has(eventId)) {
  return null;
}
this._emittedIds.add(eventId);
```

**Mechanism:**
- `_emittedIds` is a Set tracking all emitted event IDs
- Before emission, check if eventId already exists
- If duplicate, return null (no emission, no handler invocation)
- After successful emission, add to Set

**Persistence:**
- Line 203: On load, all event IDs added to `_emittedIds`
- Duplicate detection survives process restarts

**Verdict:** Duplicate emission is prevented by deterministic ID tracking.

---

## 4. Idempotent Handlers

**Verdict: PASS (with WARN)**

**Evidence:**
- Line 104-111: Handler invocation
```js
const handlers = this._subscriptions.get(eventType) || [];
for (const handler of handlers) {
  try {
    handler(event);
  } catch (e) {
    console.error(`[EventQueue] Handler error for ${eventType}:`, e.message);
  }
}
```

**Idempotency:**
- Handlers receive the same event object on each invocation
- Event object is immutable (sorted data, frozen structure)
- Duplicate events are never emitted (see Finding 3)
- Therefore, handlers are naturally idempotent

**WARN: No handler-level idempotency enforcement**
- EventQueue does not enforce idempotency on handler implementations
- If a handler has side effects (e.g., writing to DB), those side effects are not idempotent
- This is a handler implementation concern, not EventQueue responsibility

**Verdict:** EventQueue provides idempotent event delivery; handler idempotency is implementation responsibility.

---

## 5. Immutable Payloads

**Verdict: PASS**

**Evidence:**
- Line 73: `const sortedData = this._sortKeys(data);`
- Line 89: `data: sortedData` (stored in event object)
- Line 55-62: `_sortKeys()` creates new sorted object (does not mutate input)

**Immutability:**
- `_sortKeys()` recursively creates new objects/arrays
- Original `data` parameter is not mutated
- Event object stores sorted copy
- Handlers receive immutable sorted copy

**Verification:**
```js
const original = { b: 1, a: 2 };
emit('test', original);
// original is still { b: 1, a: 2 } (not mutated)
// event.data is { a: 2, b: 1 } (sorted copy)
```

**Verdict:** Payloads are immutable via deep copy with sorting.

---

## 6. Schema Version Propagation

**Verdict: PASS**

**Evidence:**
- Line 41: `const SCHEMA_VERSION = '3.0.0';`
- Line 88: `schema_version: SCHEMA_VERSION` (included in every event)
- Line 7-39: `VALID_EVENT_TYPES` defines all allowed event types

**Propagation:**
- Every event includes `schema_version` field
- Schema version is constant across all events in this version
- Event type validation (L69-71) warns on unknown types

**WARN: No schema migration logic**
- If `SCHEMA_VERSION` changes, there is no migration path for existing events
- Events loaded from disk (L192-210) retain their original schema_version
- No version compatibility checking in handlers

**Verdict:** Schema version is propagated to all events, but no migration logic exists.

---

## 7. Causation Graph Integrity

**Verdict: PASS**

**Evidence:**
- Line 95: `causation_id: causation.event_id || null`
- Line 117-122: `emitChain()` helper for causation
```js
emitChain(eventType, data, parentEvent) {
  return this.emit(eventType, data, {
    event_id: parentEvent?.event_id || null,
    correlation_id: parentEvent?.correlation_id || null,
    parentEventId: parentEvent?.event_id || null
  });
}
```

**Causation tracking:**
- `causation_id` links event to its direct cause
- `emitChain()` simplifies causation chain construction
- Null if no causation provided

**Query support:**
- Line 156-158: `getDescendants(eventId)` queries by causation
```js
getDescendants(eventId) {
  return this._events.filter(e => e.causation_id === eventId || e.parent_event_id === eventId);
}
```

**Verdict:** Causation graph is tracked and queryable.

---

## 8. Parent Lineage Integrity

**Verdict: PASS**

**Evidence:**
- Line 97: `parent_event_id: causation.parentEventId || null`
- Line 121: `emitChain()` sets `parentEventId` from parent event

**Lineage tracking:**
- `parent_event_id` links event to its immediate parent
- Combined with `causation_id`, provides full lineage context
- Null if no parent provided

**Query support:**
- Line 156-158: `getDescendants(eventId)` queries by parent_event_id
- Line 152-154: `getChain(correlationId)` queries by correlation

**Verdict:** Parent lineage is tracked and queryable.

---

## 9. Correlation Chain Integrity

**Verdict: PASS with WARN**

**Evidence:**
- Line 83: Correlation ID generation
```js
const correlationId = data.correlationId || causation.correlation_id || 
  crypto.createHash('sha256').update(eventType + globalSequence.toString()).digest('hex').substring(0, 12);
```

**Correlation logic:**
1. Use `data.correlationId` if provided (explicit correlation)
2. Fall back to `causation.correlation_id` (inherit from parent)
3. Fall back to hash of `eventType + globalSequence` (auto-generate)

**Determinism:**
- Explicit correlation: deterministic (provided by caller)
- Inherited correlation: deterministic (from parent)
- Auto-generated: deterministic (eventType + globalSequence)

**WARN: Correlation ID collision risk**
- Auto-generated correlation uses only `eventType + globalSequence`
- If same event type occurs at same sequence (impossible due to monotonic counter), collision occurs
- However, globalSequence is unique per event, so collision is impossible in practice

**Query support:**
- Line 152-154: `getChain(correlationId)` returns all events in correlation chain
- Line 182-185: `_countChains()` counts unique correlation IDs

**Verdict:** Correlation chain is tracked, queryable, and deterministic.

---

## 10. Additional Constitutional Violations

### 10a. Wall Clock in getStats()

**Verdict: FAIL**

**Evidence:**
- Line 175-177: Recent rate calculation
```js
recentRate: this._events.filter(e => {
  return Date.now() - new Date(e.timestamp).getTime() < 60000;
}).length,
```

**Problem:**
- Uses `Date.now()` for current time
- Uses `e.timestamp` (wall clock) for event time
- Same event stream queried at different wall-clock times produces different results

**Impact:**
- Stats are non-deterministic across replays
- Rate metrics cannot be reproduced historically

**Remediation:**
- Replace with sequence-based window (e.g., last 100 events by global_sequence)

---

### 10b. Wall Clock in getEventsSince()

**Verdict: FAIL**

**Evidence:**
- Line 160-163: Time-based query
```js
getEventsSince(timestamp) {
  const since = new Date(timestamp).getTime();
  return this._events.filter(e => new Date(e.timestamp).getTime() > since);
}
```

**Problem:**
- Compares wall-clock timestamps
- Same query at different wall-clock times produces different results
- Timestamp field itself is non-deterministic (see Finding 2)

**Impact:**
- Time-based queries are non-replayable
- Cannot reconstruct historical event windows

**Remediation:**
- Replace with sequence-based query (e.g., `getEventsSinceSequence(globalSequence)`)

---

### 10c. Event Persistence Determinism

**Verdict: WARN**

**Evidence:**
- Line 187-190: Event persistence
```js
_persist(event) {
  const filePath = path.join(QUEUE_DIR, `${event.event_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(event, null, 2));
}
```

**Concerns:**
- File path uses `event.event_id` (deterministic)
- JSON.stringify with `null, 2` adds whitespace (deterministic)
- But file system write order is non-deterministic (OS scheduling)
- `_load()` (L192-210) uses `fs.readdirSync().sort()` to compensate

**Verdict:** Persistence is deterministic due to sorting on load, but write order is non-deterministic.

---

## Summary

| Invariant | Verdict | Criticality | Key Failure |
|-----------|---------|-------------|-------------|
| 1. Deterministic event IDs | **PASS** | — | SHA-256 of sorted data |
| 2. Deterministic ordering | **FAIL** | CRITICAL | `new Date().toISOString()` in timestamp field |
| 3. No duplicate emission | **PASS** | — | `_emittedIds` Set tracking |
| 4. Idempotent handlers | **PASS** (WARN) | LOW | Handler idempotency is implementation responsibility |
| 5. Immutable payloads | **PASS** | — | Deep copy with sorting |
| 6. Schema version propagation | **PASS** (WARN) | LOW | No schema migration logic |
| 7. Causation graph integrity | **PASS** | — | `causation_id` tracking and query |
| 8. Parent lineage integrity | **PASS** | — | `parent_event_id` tracking and query |
| 9. Correlation chain integrity | **PASS** (WARN) | LOW | Auto-generation collision risk (theoretical) |
| 10. Wall clock violations | **FAIL** | CRITICAL | `Date.now()` in stats and queries |

**Overall: FAIL** — 2 CRITICAL violations prevent constitutional replay guarantees.

## Immediate Remediation Required

1. **Replace `new Date().toISOString()` with deterministic timestamp** (L98)
   - Use `globalSequence` as deterministic epoch
   - Or remove timestamp field entirely (ordering via global_sequence)

2. **Replace `Date.now()` in getStats()** (L176)
   - Use sequence-based window: last N events by global_sequence

3. **Replace wall-clock comparison in getEventsSince()** (L161-162)
   - Add `getEventsSinceSequence(globalSequence)` method
   - Deprecate time-based query

4. **Add schema migration logic** (optional but recommended)
   - Version compatibility checking on load
   - Migration path for schema_version changes
