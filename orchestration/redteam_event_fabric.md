# EventFabricAuditArtifact

**Audit Type:** Phase 40D Red Team — Zero Trust
**Subsystem:** Event Fabric
**File:** `orchestration/execution/event_queue.js`
**Severity:** CRITICAL
**Status:** CONSTITUTIONAL VIOLATIONS CONFIRMED

---

## Executive Summary

**Verdict: FAIL**

Event Fabric has **5 CRITICAL constitutional violations** that break replay guarantees, allow duplicate events, permit orphan references, enable causation cycles, and permit payload mutation.

**Previous audit was optimistic.** The duplicate detection mechanism is broken across process restarts, and no validation prevents architectural violations.

---

## Violation 1: Duplicate Detection Lost on Restart

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 77-79: In-memory duplicate detection
if (this._emittedIds.has(eventId)) {
  return null;
}
this._emittedIds.add(eventId);

// Line 197-215: Load from disk, reset _emittedIds
_load() {
  if (!fs.existsSync(QUEUE_DIR)) return;
  const files = fs.readdirSync(QUEUE_DIR)
    .filter(f => f.endsWith('.json'))
    .sort()
    .slice(-5000);
  let maxSeq = 0;
  for (const file of files) {
    try {
      const event = JSON.parse(fs.readFileSync(path.join(QUEUE_DIR, file), 'utf8'));
      this._events.push(event);
      if (event.event_id) this._emittedIds.add(event.event_id);  // ← Only adds loaded IDs
      // ...
    } catch (e) { }
  }
  this._globalSequence = maxSeq;
}
```

**Flaw:**
- `_emittedIds` is reset on every process restart
- Only loaded event IDs are added to `_emittedIds` (L208)
- If an event was emitted but not persisted (e.g., crash before persistence), it would be re-emitted
- If an event was persisted but not loaded (e.g., beyond 5000 file limit), it would be re-emitted

**Replay Transcript:**
1. Process starts, emits event E1 (ID: abc123)
2. Process crashes before persistence
3. Process restarts, `_emittedIds` is empty
4. Same event E1 is emitted again with same ID abc123
5. Duplicate event in event stream

**Minimal Reproduction:**
```javascript
const queue = new EventQueue();
queue.emit('worker_started', { workerId: 'w1' });  // Event ID: abc123
// Process crashes here
const queue2 = new EventQueue();  // _emittedIds reset
queue2.emit('worker_started', { workerId: 'w1' });  // Same ID abc123 emitted again
```

**Impact:**
- Duplicate events break replay determinism
- Same event ID appears multiple times
- Downstream consumers process duplicate work
- Violates "no duplicate events" constitutional guarantee

---

## Violation 2: Replay Ordering Drift from Filesystem Sort

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 199-202: Filesystem sort is not deterministic
const files = fs.readdirSync(QUEUE_DIR)
  .filter(f => f.endsWith('.json'))
  .sort()  // ← Filesystem sort order is platform-dependent
  .slice(-5000);
```

**Flaw:**
- `fs.readdirSync().sort()` uses locale-aware string comparison
- Sort order differs across platforms (Linux vs Windows vs macOS)
- Sort order differs across filesystems (ext4 vs NTFS vs APFS)
- Same event files loaded in different order → different `global_sequence` assignment
- Replay produces different event ordering

**Replay Transcript:**
1. Linux system: files sorted as [a.json, b.json, c.json] → global_sequence [1, 2, 3]
2. Windows system: files sorted as [b.json, a.json, c.json] → global_sequence [1, 2, 3]
3. Same events, different global_sequence values
4. Downstream consumers see different ordering

**Minimal Reproduction:**
```javascript
// On Linux
const queue1 = new EventQueue();  // Loads events in Linux sort order
// On Windows
const queue2 = new EventQueue();  // Loads events in Windows sort order
// Same events, different global_sequence values
```

**Impact:**
- Replay ordering drift across platforms
- Same event stream produces different execution
- Violates "deterministic ordering" constitutional guarantee

---

## Violation 3: Hidden Mutable Payloads

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 89: Event object stored with reference to data
const event = {
  event_id: eventId,
  type: eventType,
  schema_version: SCHEMA_VERSION,
  data: sortedData,  // ← Reference to sortedData
  // ...
};

// Line 106: Handler receives event object directly
const handlers = this._subscriptions.get(eventType) || [];
for (const handler of handlers) {
  try {
    handler(event);  // ← Handler can mutate event.data
  } catch (e) {
    console.error(`[EventQueue] Handler error for ${eventType}:`, e.message);
  }
}
```

**Flaw:**
- `event.data` is a reference to `sortedData`
- Handlers receive the event object directly
- If a handler mutates `event.data`, it mutates the stored event
- No copy/clone before passing to handlers
- Violates "immutable payloads" constitutional guarantee

**Replay Transcript:**
1. Event E1 emitted with data `{ key: 'value' }`
2. Handler H1 receives E1, mutates `event.data.key = 'mutated'`
3. Stored event now has data `{ key: 'mutated' }`
4. Replay loads event with mutated data
5. Different execution than original

**Minimal Reproduction:**
```javascript
const queue = new EventQueue();
queue.subscribe('worker_started', (event) => {
  event.data.workerId = 'hacked';  // Mutation
});
queue.emit('worker_started', { workerId: 'w1' });
// Stored event now has workerId: 'hacked'
```

**Impact:**
- Payloads are not immutable
- Handlers can corrupt event stream
- Replay produces different data
- Violates "immutable payloads" constitutional guarantee

---

## Violation 4: Parent Event ID Not Validated

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 97: parent_event_id set without validation
parent_event_id: causation.parentEventId || null,

// No validation that parent event exists
// No validation that parent event is not a descendant (cycle detection)
```

**Flaw:**
- `parent_event_id` can reference non-existent event
- No validation that parent event exists in `_events`
- No validation that parent event exists in `_emittedIds`
- Creates orphan references in lineage graph
- Violates "lineage integrity" constitutional guarantee

**Replay Transcript:**
1. Event E1 emitted with parent_event_id: 'nonexistent'
2. No validation, event accepted
3. Lineage graph has broken reference
4. Replay cannot trace lineage
5. Descendants of nonexistent parent cannot be verified

**Minimal Reproduction:**
```javascript
const queue = new EventQueue();
queue.emit('worker_started', { workerId: 'w1' }, {
  parentEventId: 'nonexistent_id'  // No validation
});
// Event accepted with invalid parent
```

**Impact:**
- Orphan references in lineage graph
- Lineage cannot be traced
- Descendants cannot be verified
- Violates "lineage integrity" constitutional guarantee

---

## Violation 5: Causation Graph Cycles Not Prevented

**Severity:** CRITICAL

**Proof:**
```javascript
// Line 95: causation_id set without cycle detection
causation_id: causation.event_id || null,

// Line 97: parent_event_id set without cycle detection
parent_event_id: causation.parentEventId || null,

// No cycle detection in causation graph
// No validation that causation_id is not a descendant
```

**Flaw:**
- Event A can reference event B as causation
- Event B can reference event A as causation
- No cycle detection in emit()
- No validation that causation graph is a DAG
- Creates cycles in causation graph
- Violates "acyclic causation graph" constitutional guarantee

**Replay Transcript:**
1. Event E1 emitted with causation_id: null
2. Event E2 emitted with causation_id: E1.event_id
3. Event E1 re-emitted with causation_id: E2.event_id (if allowed)
4. Cycle: E1 → E2 → E1
5. Lineage traversal infinite loop
6. Replay cannot process causation graph

**Minimal Reproduction:**
```javascript
const queue = new EventQueue();
const e1 = queue.emit('worker_started', { workerId: 'w1' });
const e2 = queue.emit('worker_started', { workerId: 'w2' }, { event_id: e1.event_id });
// If e1 could be re-emitted with causation_id: e2.event_id, cycle created
```

**Impact:**
- Cycles in causation graph
- Lineage traversal infinite loop
- Replay cannot process graph
- Violates "acyclic causation graph" constitutional guarantee

---

## Violation 6: Schema Evolution Not Validated

**Severity:** HIGH

**Proof:**
```javascript
// Line 88: schema_version is hardcoded
schema_version: SCHEMA_VERSION,  // '3.0.0'

// Line 41: SCHEMA_VERSION is constant
const SCHEMA_VERSION = '3.0.0';

// No validation that loaded events have compatible schema
// No migration path for schema changes
```

**Flaw:**
- Loaded events (L206) are not validated for schema compatibility
- If SCHEMA_VERSION changes, old events may have incompatible structure
- No migration path for schema evolution
- Replay may fail with schema mismatch
- Violates "schema evolution compatibility" constitutional guarantee

**Replay Transcript:**
1. Events emitted with SCHEMA_VERSION '3.0.0'
2. SCHEMA_VERSION changed to '4.0.0'
3. Old events loaded with schema '3.0.0'
4. New handlers expect schema '4.0.0'
5. Replay fails with schema mismatch

**Minimal Reproduction:**
```javascript
// Change SCHEMA_VERSION to '4.0.0'
// Load old events with schema '3.0.0'
// Handlers fail with missing fields
```

**Impact:**
- Schema evolution breaks replay
- Old events incompatible with new schema
- No migration path
- Violates "schema evolution compatibility" constitutional guarantee

---

## Violation 7: Correlation ID Ambiguity

**Severity:** MEDIUM

**Proof:**
```javascript
// Line 83: correlation_id generation
const correlationId = data.correlationId || causation.correlation_id || crypto.createHash('sha256').update(eventType + globalSequence.toString()).digest('hex').substring(0, 12);
```

**Flaw:**
- If `data.correlationId` is passed, it's used directly
- No validation that correlationId is unique
- Multiple events can have same correlationId
- Correlation graph ambiguity
- Violates "unique correlation" constitutional guarantee

**Replay Transcript:**
1. Event E1 emitted with correlationId: 'custom'
2. Event E2 emitted with correlationId: 'custom'
3. Both events in same correlation chain
4. Ambiguous which event is parent/child
5. Correlation graph traversal ambiguous

**Minimal Reproduction:**
```javascript
const queue = new EventQueue();
queue.emit('worker_started', { workerId: 'w1', correlationId: 'custom' });
queue.emit('worker_started', { workerId: 'w2', correlationId: 'custom' });
// Both events have same correlationId
```

**Impact:**
- Correlation graph ambiguity
- Cannot trace unique chains
- Violates "unique correlation" constitutional guarantee

---

## Summary

| Violation | Severity | Constitutional Guarantee Broken |
|-----------|----------|-------------------------------|
| 1. Duplicate detection lost on restart | CRITICAL | No duplicate events |
| 2. Replay ordering drift from filesystem sort | CRITICAL | Deterministic ordering |
| 3. Hidden mutable payloads | CRITICAL | Immutable payloads |
| 4. Parent event ID not validated | CRITICAL | Lineage integrity |
| 5. Causation graph cycles not prevented | CRITICAL | Acyclic causation graph |
| 6. Schema evolution not validated | HIGH | Schema evolution compatibility |
| 7. Correlation ID ambiguity | MEDIUM | Unique correlation |

**Total CRITICAL violations: 5**

**Constitutional Debt:**
- Duplicate detection must persist across restarts
- File loading must use deterministic sort (lexicographic by filename)
- Event payloads must be cloned before passing to handlers
- Parent event ID must be validated against existing events
- Causation graph must be validated for cycles
- Schema version must be validated on load
- Correlation ID must be validated for uniqueness

**Previous Audit Optimism:**
- Assumed duplicate detection works (fails on restart)
- Assumed ordering is deterministic (fails on filesystem sort)
- Assumed payloads are immutable (fails on handler mutation)
- Assumed lineage is validated (no validation exists)
- Assumed causation graph is acyclic (no cycle detection)

**Conclusion:**
Event Fabric is **NOT constitutionally sovereign**. It has 5 CRITICAL violations that break replay guarantees, allow duplicate events, permit orphan references, enable causation cycles, and permit payload mutation.

**Phase 41 is BLOCKED** until these violations are repaired.
