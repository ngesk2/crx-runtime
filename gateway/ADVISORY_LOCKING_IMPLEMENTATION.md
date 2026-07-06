# Advisory Locking Implementation

## Phase A1.5 — Constitutional Advisory Locking

### Constitutional Rules

Every mutable aggregate must have one writer.

Implement PostgreSQL advisory locking for:
- Mission
- Execution
- Queue
- Schedule

Application mutexes prohibited.
Redis locks prohibited.
Thread locks prohibited.

---

## Implementation

### AdvisoryLock Class

**Location:** `advisory_lock.js`

### Core Methods

#### `acquire(aggregateType, aggregateId, timeoutMs)`
Acquires advisory lock for aggregate.

- Generates lock ID from aggregate type and ID
- Uses `pg_try_advisory_lock` for non-blocking acquisition
- Retries with 100ms backoff until timeout
- Returns true if lock acquired
- Returns false if timeout

**Lock ID Generation:**
```javascript
_generateLockId(aggregateType, aggregateId) {
  const combined = `${aggregateType}:${aggregateId}`;
  let hash = 0;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}
```

#### `release(aggregateType, aggregateId)`
Releases advisory lock.

- Uses `pg_advisory_unlock`
- Returns true if released
- Returns false if not held

#### `executeWithLock(aggregateType, aggregateId, operation, timeoutMs)`
Executes operation with lock.

- Acquires lock
- Executes operation
- Releases lock in finally block
- Throws if lock acquisition fails

**Usage Example:**
```javascript
const advisoryLock = new AdvisoryLock(postgresPool);

await advisoryLock.executeWithLock('mission', missionId, async () => {
  // Safe to mutate mission
  await updateMission(missionId, updates);
});
```

#### `isLocked(aggregateType, aggregateId)`
Checks if lock is held.

- Attempts to acquire lock
- If successful, releases and returns false
- If unsuccessful, returns true

### LockManager Class

Manages advisory locks for all aggregate types.

**Features:**
- Tracks held locks
- Prevents double-acquisition
- Provides lock inspection
- Supports graceful shutdown

#### `acquire(aggregateType, aggregateId, timeoutMs)`
Acquires lock with tracking.

- Checks if already held by this process
- Acquires lock if not held
- Tracks lock acquisition time
- Returns true if acquired

#### `release(aggregateType, aggregateId)`
Releases lock with tracking.

- Checks if held by this process
- Releases lock
- Removes from tracking
- Returns true if released

#### `releaseAll()`
Releases all held locks.

- Iterates through held locks
- Releases each lock
- Clears tracking

#### `getHeldLocks()`
Returns information about held locks.

- Lock key
- Acquisition time
- Held duration

---

## Repository Invariants Preserved

✓ Every mutable aggregate has one writer
✓ PostgreSQL advisory locks only
✓ No application mutexes
✓ No Redis locks
✓ No thread locks
✓ Lock timeout handling

---

## Evidence Required

### Concurrent Write Tests
- Verify only one writer at a time
- Verify lock acquisition prevents concurrent writes
- Verify lock release allows subsequent writes

### Lock Contention Tests
- Verify lock contention handled correctly
- Verify timeout behavior
- Verify retry behavior

### Deadlock Detection Tests
- Verify no deadlocks with proper lock ordering
- Verify deadlock detection (if applicable)

### Timeout Handling Tests
- Verify timeout returns false
- Verify operation not executed on timeout
- Verify lock not held on timeout

---

## Forbidden Patterns

❌ Application mutexes
❌ Redis locks
❌ Thread locks
❌ Manual lock management
❌ Lock without release
❌ Nested locks without ordering

---

## Status

**Implementation:** ✅ Complete
**Tests:** ⏳ Pending
**Documentation:** ✅ Complete
