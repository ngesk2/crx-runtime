# Event Fabric Audit: orchestration/execution/event_queue.js

**Audit date:** 2026-07-04
**File path:** C:\Users\nolan\PING\orchestration\execution\event_queue.js
**Total lines:** 218
**Schema version declared:** 3.0.0 (line 41)
**Valid event types:** 31 (lines 7-39)

---

## Invariant 1: Deterministic Event IDs — PASS

**Requirement:** Event IDs computed from sorted JSON keys + SHA-256 hash. _sortKeys and _deterministicJson must produce consistent output.

### Evidence

**_sortKeys (lines 55-62):**
Objects: keys are sorted alphabetically via Object.keys(obj).sort() (line 58). Recursive on values. Deterministic.
Arrays: order is preserved — obj.map(v => this._sortKeys(v)) (line 57) recurses into elements but does NOT sort them. This is correct per JSON semantics (array order is significant).
Primitives/null: returned as-is (line 56). Correct.

**_deterministicJson (line 64-66):**
Wraps sorted object in JSON.stringify. Produces the same output for identical inputs. Correct.

**Event ID computation (lines 73-75):**
sortedData is computed on line 73. But line 74 passes data directly (not sortedData) to _deterministicJson. This is a code smell — _deterministicJson(data) will sort again internally, so functionally it works correctly (same input → same output). No bug, but redundant work.
SHA-256 hash truncated to 16 hex chars (64 bits). Same eventType + same data → same eventId. Deterministic.

### Verdict: PASS
_sortKeys produces deterministic output. Event IDs are deterministic for the same (eventType, data) tuple. The duplicate call to _sortKeys on line 74 vs. line 73 is wasteful but not incorrect.

---

## Invariant 2: Deterministic Ordering — FAIL

**Requirement:** global_sequence increments monotonically. _load must restore _globalSequence correctly from persisted events.

### Evidence

**Emission (line 82):** const globalSequence = ++this._globalSequence;
Pre-increment. _globalSequence starts at 0 (line 48). First event gets sequence 1. Monotonically increasing within a single session. Correct.

**_load restoration (lines 197-214):**
Filenames are ${event.event_id}.json — a hex string (0-9, a-f) from SHA-256 truncated to 16 chars. Array.sort() sorts these alphabetically by filename, which is **effectively random order** with respect to sequence numbers.

**Concrete failure scenario:** If more than 5000 events exist:
- slice(-5000) loads only the 5000 events with the highest-sorting filenames.
- These are NOT the 5000 most recent events (sequence order has zero correlation with hex filename order).
- If the actual highest global_sequence is, say, 10000, but that event's filename sorts in the first 1000 alphabetically, it gets dropped by slice.
- maxSeq is set to the max among the 5000 loaded events — possibly far below the true max.
- Next emission starts from maxSeq + 1, which likely collides with an already-used sequence number.

**Even with <=5000 events:** The .sort() on filenames is harmless because all events are loaded (slice(-5000) with N <= 5000 returns all N). But the sort is misleading — it suggests intentional ordering by filename, which is meaningless.

### Verdict: FAIL
_globalSequence is not reliably restored across restarts when more than ~5000 events exist. This breaks deterministic ordering across process boundaries. Root cause: using filename sort instead of a dedicated sequence metadata file, and arbitrary 5000-event cap on load.

---

## Invariant 3: No Duplicate Emission — WARN

**Requirement:** _emittedIds set checked before emission. Dedup must survive process restart.

### Evidence

**In-session dedup (lines 77-80):** Works correctly within a single session. Returns 
ull for duplicates.

**_load reconstructs _emittedIds (line 208):** Populated from persisted events on restart. Good.

**But _load only reads last 5000 files (line 199-202):** If N > 5000 events exist, only 5000 are loaded. The remaining (N-5000) event IDs are NOT added to _emittedIds. If one of those evicted events is re-emitted (same type + data), it passes the dedup check and is duplicated on disk.

**Crash window between line 80 and line 112:**
- Line 80: _emittedIds.add(eventId) — ID is in the Set.
- Line 112: 	his._persist(event) — event written to disk.
- If the process crashes between these two lines, the ID is in the in-memory Set (lost on restart) but not on disk. On restart, the event will NOT be in _emittedIds and WILL be re-emitted.

### Verdict: WARN
In-session dedup is reliable. Cross-session dedup is reliable only for the last 5000 events. Events evicted by the 5000-cap can be duplicated. Crash between _emittedIds.add and _persist also loses dedup.

---

## Invariant 4: Idempotent Handlers — PASS

**Requirement:** Subscription handlers must be wrapped in try/catch. Failures must not cascade.

### Evidence

**Handler dispatch (lines 103-110):**
Each handler call is independently wrapped in 	ry/catch (lines 105-109).
A throwing handler does NOT prevent subsequent handlers from executing (the or loop continues via catch).
_persist (line 112) executes AFTER all handlers, regardless of any handler failures.
Failure of one handler is isolated — does not propagate to the caller, does not prevent persistence.

**However:** The event object is passed by reference (line 106). If one handler mutates the event, subsequent handlers see the mutated version, and _persist persists the mutated version. This is a separate concern (see Invariant 5).

### Verdict: PASS
Handler isolation is correct. Failures are caught, logged, and do not cascade. Persistence runs unconditionally after all handlers complete.

---

## Invariant 5: Immutable Payloads — FAIL

**Requirement:** Event data must be frozen to prevent handler mutation.

### Evidence

**Event object constructed (lines 85-99):** Plain object, no Object.freeze() call anywhere in the file. sortedData (line 73) is a new object from _sortKeys, so the data sub-object is a fresh copy. But it's not frozen either.

**Event stored in _events array (line 101):** Stored as a mutable reference.

**Event passed to handlers (line 106):** Handlers receive the same mutable reference. Any mutation (e.g., event.data.foo = 'bar', event.global_sequence = 999) persists in 	his._events and in the subsequent _persist call.

**No Object.freeze at any point.** Searching the entire file: no freeze call exists.

**Consequence:**
1. A handler can silently corrupt the in-memory event.
2. _persist (line 112) would persist corrupted data.
3. getEventsByType, getChain, getDescendants, getStats would return corrupted data.

### Verdict: FAIL
Events are fully mutable. Handlers can mutate events post-emission. No Object.freeze() protection exists on the event object, its data sub-object, or any nested structure.

---

## Invariant 6: Schema Version — PASS

**Requirement:** schema_version must be present on every emitted event. _load must handle legacy events without it.

### Evidence

**Constant defined (line 41):** const SCHEMA_VERSION = '3.0.0';

**Present on every emitted event (line 88):** schema_version: SCHEMA_VERSION — Every event produced by emit() has schema_version: '3.0.0'. No alternate code path that omits it.

**_load handles missing schema_version (lines 204-212):**
No check for schema_version. A legacy event (e.g., schema_version '1.0.0' or missing entirely) is loaded as-is.
All field accesses use optional/truthy checks (event.event_id, event.global_sequence), so missing fields are silently handled.
If a downstream consumer requires schema_version, they must handle its absence. The queue itself does not enforce it on load.

### Verdict: PASS
All newly emitted events carry schema_version: '3.0.0'. Legacy events lacking schema_version are loaded silently with no errors.

---

## Invariant 7: Causation/Parent Lineage — FAIL

**Requirement:** causation_id and parent_event_id must be correctly distinguished. emitChain must not conflate them.

### Evidence

**emit() distinguishes the two fields (lines 95, 97):**
causation_id: causation.event_id || null and parent_event_id: causation.parentEventId || null — Two separate fields, two separate input sources. Calling emit() directly with distinct values produces a correct distinction.

**emitChain() conflates them (lines 116-122):**
`js
emitChain(eventType, data, parentEvent) {
    return this.emit(eventType, data, {
      event_id: parentEvent?.event_id || null,          // -> causation_id
      correlation_id: parentEvent?.correlation_id || null,
      parentEventId: parentEvent?.event_id || null       // -> parent_event_id
    });
  }
`
Both causation.event_id and causation.parentEventId are set to parentEvent?.event_id || null.
In every emitChain call: causation_id === parent_event_id (both equal the parent's event_id).
This makes causation_id and parent_event_id semantically identical for chain-emitted events.
The original intent: causation_id = the event that directly caused this event; parent_event_id = the parent in a process lineage. With emitChain, you cannot distinguish between "directly caused by" and "next step in a lineage."

**getDescendants (lines 155-157) treats them as alternatives:**
`js
getDescendants(eventId) {
    return this._events.filter(e => e.causation_id === eventId || e.parent_event_id === eventId);
  }
`
Since both fields are identical for chain events, this OR condition produces the same result for both. But the OR logic is redundant — e.causation_id === eventId already covers it. No correctness bug, but reveals that the two fields are semantically overloaded.

### Verdict: FAIL
emitChain sets causation_id and parent_event_id to the same value on every call. The intended semantic distinction between "direct causation" and "parent lineage" is lost in the only high-level chain API.

---

## Invariant 8: Correlation Chain — PASS

**Requirement:** correlation_id must propagate through chains. Fallback must not use Date.now().

### Evidence

**Correlation ID resolution (line 83):**
Precedence:
1. data.correlationId — explicitly set on the event data.
2. causation.correlation_id — propagated from parent event (via emitChain).
3. Auto-generated from SHA-256 of (eventType + globalSequence) — uses globalSequence, NOT Date.now().

**Propagation via emitChain (line 119):** Parent's correlation_id flows into causation.correlation_id, which is picked up at step 2 above. Correct chain propagation.

**Fallback is deterministic** (globalSequence-based, not wall-clock-based). Consistent with constitutional time requirements.

**getChain(correlationId) (lines 151-153):** Provides full chain retrieval by correlation ID.

### Verdict: PASS
Correlation ID correctly propagates: data.correlationId -> causation.correlation_id -> auto-generated from globalSequence (not Date.now()). Chain retrieval via getChain() works correctly.

---

## Invariant 9: Memory Growth — FAIL

**Requirement:** _events array should have a cap or eviction mechanism.

### Evidence

**_events array (lines 45, 101):** 	his._events = [] on construction. 	his._events.push(event) on every emission. Grows without bound during a session. Every emitted event is retained in memory indefinitely. No eviction, no compaction, no pruning, no circular buffer.

**_emittedIds Set (lines 47, 80):** Also unbounded. One entry per unique event emitted during the session.

**No query methods expose a cap:**
- getStats() iterates all events (line 171).
- getChain() filters all events (line 152).
- getDescendants() filters all events (line 156).
- getEventsSinceSequence() filters all events (line 166).

**Only _load has a cap (line 202: .slice(-5000)), but that's on load, not during runtime.**

### Verdict: FAIL
_events and _emittedIds grow without bound during a session. In a long-running process, this is an unbounded memory leak. No eviction, no pruning, no maximum size enforcement. For a production event fabric, this is a critical scalability issue.

---

## Invariant 10: Persistence Integrity — WARN

**Requirement:** Every event must be persisted via _persist before returning. No emit path should skip persistence.

### Evidence

**Persistence always called for non-duplicates (line 112):** Non-duplicate path always reaches _persist (line 112) and then returns the event. Duplicate path returns 
ull at line 78 — correctly skips persistence.

**No alternate emit path:** emitChain delegates to emit(), so it has identical behavior. All emissions flow through the same code path.

**_persist method (lines 192-195):** Writes individual JSON file per event. Synchronous write.

**Issues found:**

1. **Handlers run before persist (lines 103-110 before line 112).** If _persist fails, handlers have already seen the event. In-memory state and persisted state diverge.

2. **No try/catch around _persist.** If s.writeFileSync throws (disk full, permissions, path error), the exception propagates uncaught to the emit() caller. The event is already in 	his._events and already dispatched to handlers — irreversible inconsistency.

3. **No sync.** s.writeFileSync does not guarantee on-disk durability. On power loss, the file may be in OS cache and lost. No s.fsyncSync or { flush: true } option.

4. **No atomic write pattern.** No write-to-temp-then-rename. If the process crashes during writeFileSync, a partial file is left on disk. _load wraps JSON.parse in try/catch (line 205-212), so partial files are silently skipped. Event is lost without detection.

5. **One file per event.** 5000 events = 5000 files. Could become a performance issue for directory scans.

### Verdict: WARN
_persist is called for every non-duplicate event (PASS for the main requirement). However, the persist mechanism is fragile: no durability guarantees (no fsync), no atomic writes (partial file on crash), _persist exceptions propagate uncaught after handlers have already consumed the event.

---

## Invariant 11: VALID_EVENT_TYPES — PASS

**Requirement:** All 4 new types (worker_registered, worker_state_changed, worker_execution_started, worker_execution_completed) must be present.

### Evidence

The VALID_EVENT_TYPES array (lines 7-39) contains 31 entries. All 4 required new types are present:

- worker_registered (line 35)
- worker_state_changed (line 36)
- worker_execution_started (line 37)
- worker_execution_completed (line 38)

Total: 31 valid event types covering all categories (worker lifecycle, consensus, merge gate, artifacts, replay, missions, system).

**Non-blocking validation (line 69-71):** Unknown event types emit a warning but are not rejected. The event is still emitted. This is a design choice: the queue is permissive.

### Verdict: PASS
All 4 required types are registered. The complete set of 31 types covers all event categories.

---

## Bonus Findings

### B1: _load silent error swallowing (line 212)
`js
} catch (e) { }
`
Corrupt JSON files in the queue directory are silently skipped. No warning, no error log. If an event file is partially written (crash during _persist), the partial file is silently ignored. Severity: Low — acceptable degradation, but a console.warn would aid debugging.

### B2: emitChain does not verify parent exists (lines 116-122)
Uses optional chaining, so emitChain(..., undefined) works fine — creates an orphaned event with causation_id: null and parent_event_id: null. Not necessarily a bug (orphans are valid), but callers may assume the chain is valid.

### B3: No console.warn for isDuplicate callers (lines 124-126)
Returns $true/$false silently. If a caller checks isDuplicate and gets 	rue, there's no indication of whether the original emission succeeded or was a duplicate. Harmless but asymmetric with other warnings.

### B4: getEventsSince deprecation wrapper is fragile (lines 159-163)
Ignores the 	imestamp parameter entirely. Always returns last 100 events by sequence. This is correct for the deprecation behavior (delegating to sequence-based API), but callers passing a real timestamp will get unexpected results.

### B5: _deterministicJson is called twice per emission (lines 73-74)
Line 73 sorts data into sortedData. Line 74 calls _deterministicJson(data) which sorts data again internally. The sortedData result from line 73 is then used in the event object (line 89), so the sort is not wasted entirely — it's just done twice. Minor performance nit.

---

## Summary

| # | Invariant | Verdict | Key Issue |
|---|-----------|---------|-----------|
| 1 | Deterministic event IDs | PASS | _sortKeys + SHA-256 produces consistent IDs |
| 2 | Deterministic ordering | FAIL | _load sorts by filename (random w.r.t. sequence); .slice(-5000) drops high sequences |
| 3 | No duplicate emission | WARN | In-session dedup works; cross-session dedup lost for evicted events (>5000) |
| 4 | Idempotent handlers | PASS | try/catch per handler; failures isolated |
| 5 | Immutable payloads | FAIL | No Object.freeze(); handlers can mutate events post-emission |
| 6 | Schema version | PASS | schema_version: '3.0.0' on every event; legacy events load silently |
| 7 | Causation/parent lineage | FAIL | emitChain sets both fields to same value; distinction is collapsed |
| 8 | Correlation chain | PASS | correlation_id propagates correctly; fallback uses globalSequence, not Date.now() |
| 9 | Memory growth | FAIL | _events and _emittedIds grow unbounded; no eviction or cap |
| 10 | Persistence integrity | WARN | _persist always called; but no fsync, no atomic writes, exceptions uncaught |
| 11 | VALID_EVENT_TYPES | PASS | All 4 new types present; 31 total types registered |

**Overall: 5 PASS, 3 WARN, 3 FAIL**

### Critical failures (should block deployment):
1. **Invariant 2 (Ordering):** _globalSequence is not reliably restored on restart. Collision hazard for sequence numbers.
2. **Invariant 9 (Memory):** No bound on _events or _emittedIds. Unbounded growth in long-running processes.

### Notable warnings:
1. **Invariant 3 (Dedup):** 5000-event cap on load creates a window for duplicate persistence.
2. **Invariant 10 (Persistence):** No durability guarantees (no fsync, no atomic writes). Handlers see events before persistence confirms them.
3. **Invariant 7 (Lineage):** causation_id and parent_event_id are identical for all chain-emitted events. The API promises two independent lineage axes but delivers only one.
