# A1 Implementation Contract

## Phase A1 — Constitutional Correctness Implementation Contract

**Mission:** Design the implementation contract for Phase A1 before any code is modified.

**Constitutional Rules:**
- DO NOT IMPLEMENT
- DO NOT REFACTOR
- DO NOT MODIFY CODE
- Produce only architectural proof and implementation contracts

---

# SECTION 1 — TRANSACTIONAL BOUNDARIES

## Write Operation Inventory

### 1.1 Mission Creation

**Location:** `mission_generation_service.js:_createMission()`

**Transaction Owner:** MissionGenerationService

**Transaction Scope:** Single INSERT into missions table

**Resources Modified:** missions table

**Can rollback occur?** YES - Not currently implemented

**Can partial commit occur?** NO - Single operation

**Current guarantees:** None (no transaction wrapper)

**Required guarantees:** TransactionBoundary wrapper with outbox integration

**Classification:** UNSAFE

---

### 1.2 Mission Enqueue

**Location:** `mission_queue.js:enqueueTransactional()`

**Transaction Owner:** MissionQueue

**Transaction Scope:** SELECT missions + INSERT mission_queue

**Resources Modified:** mission_queue table

**Can rollback occur?** YES - Currently implemented

**Can partial commit occur?** NO - Transaction exists

**Current guarantees:** Transaction exists, but event publication outside transaction

**Required guarantees:** Event publication must be inside transaction via outbox

**Classification:** PARTIALLY SAFE

---

### 1.3 Mission Claim

**Location:** `mission_queue.js:claim()`

**Transaction Owner:** MissionQueue

**Transaction Scope:** UPDATE mission_queue

**Resources Modified:** mission_queue table

**Can rollback occur?** NO - Single UPDATE without transaction

**Can partial commit occur?** NO - Single operation

**Current guarantees:** None (no transaction wrapper)

**Required guarantees Advisory:** Locking required before UPDATE

**Classification:** UNSAFE

---

### 1.4 Mission Execution

**Location:** `mission_execution_authority.js:executeMission()`

**Transaction Owner:** MissionExecutionAuthority

**Transaction Scope:** Multiple operations (retrieve, invoke, validate, test, replay, approve, commit)

**Resources Modified:** mission_executions table, filesystem (patches, commits)

**Can rollback occur?** NO - No transaction wrapper

**Can partial commit occur?** YES - Multiple independent operations

**Current guarantees:** None

**Required guarantees:** TransactionBoundary wrapper with outbox for events

**Classification:** UNSAFE

---

### 1.5 Event Publication

**Location:** `mission_event_bus.js:publish()`

**Transaction Owner:** MissionEventBus

**Transaction Scope:** INSERT into mission_events table

**Resources Modified:** mission_events table

**Can rollback occur?** NO - No transaction wrapper

**Can partial commit occur?** NO - Single operation

**Current guarantees:** None

**Required guarantees:** Must use outbox pattern, not direct INSERT

**Classification:** UNSAFE

---

## Transaction Classification Summary

| Operation | Classification | Blocker |
|-----------|---------------|---------|
| Mission Creation | UNSAFE | No transaction wrapper |
| Mission Enqueue | PARTIALLY SAFE | Event outside transaction |
| Mission Claim | UNSAFE | No transaction wrapper |
| Mission Execution | UNSAFE | No transaction wrapper |
| Event Publication | UNSAFE | Not using outbox pattern |

---

# SECTION 2 — OUTBOX CONTRACT

## Event Emission Inventory

### 2.1 MissionGenerated Event

**Emitter:** `mission_generation_service.js:generateMissions()`

**Who owns emission?** MissionGenerationService

**Inside transaction?** NO - Called after INSERT

**Can event exist without state?** NO - Requires mission_id

**Can state exist without event?** YES - Mission created without event

**Duplicate possible?** YES - No idempotency

**Lost event possible?** YES - No outbox pattern

**Required outbox schema:** StandardEventSchema with aggregate_id=mission_id

**Required replay semantics:** Must replay from outbox on crash

**Required cleanup semantics:** Clean published events after 7 days

---

### 2.2 MissionQueued Event

**Emitter:** `mission_queue.js:enqueueTransactional()`

**Who owns emission?** MissionQueue

**Inside transaction?** NO - Called after COMMIT

**Can event exist without state?** NO - Requires queue_id

**Can state exist without event?** YES - Queue entry exists without event

**Duplicate possible?** YES - No idempotency

**Lost event possible?** YES - Published after COMMIT, crash loses event

**Required outbox schema:** StandardEventSchema with aggregate_id=queue_id

**Required replay semantics:** Must replay from outbox on crash

**Required cleanup semantics:** Clean published events after 7 days

---

### 2.3 MissionClaimed Event

**Emitter:** `mission_queue.js:claim()`

**Who owns emission?** MissionQueue

**Inside transaction?** NO - Called after UPDATE

**Can event exist without state?** NO - Requires queue_id

**Can state exist without event?** YES - Queue entry claimed without event

**Duplicate possible?** YES - No idempotency

**Lost event possible?** YES - No outbox pattern

**Required outbox schema:** StandardEventSchema with aggregate_id=queue_id

**Required replay semantics:** Must replay from outbox on crash

**Required cleanup semantics:** Clean published events after 7 days

---

### 2.4 MissionStarted Event

**Emitter:** `mission_execution_authority.js:executeMission()`

**Who owns emission?** MissionExecutionAuthority

**Inside transaction?** NO - Called before any state change

**Can event exist without state?** YES - Published before execution starts

**Can state exist without event?** YES - Execution can start without event

**Duplicate possible?** YES - No idempotency

**Lost event possible?** YES - No outbox pattern

**Required outbox schema:** StandardEventSchema with aggregate_id=execution_id

**Required replay semantics:** Must replay from outbox on crash

**Required cleanup semantics:** Clean published events after 7 days

---

### 2.5 MissionCompleted Event

**Emitter:** `mission_execution_authority.js:executeMission()` (implied)

**Who owns emission?** MissionExecutionAuthority

**Inside transaction?** NO - Not currently implemented

**Can event exist without state?** NO - Requires execution_id

**Can state exist without event?** YES - Execution can complete without event

**Duplicate possible?** YES - No idempotency

**Lost event possible?** YES - No outbox pattern

**Required outbox schema:** StandardEventSchema with aggregate_id=execution_id

**Required replay semantics:** Must replay from outbox on crash

**Required cleanup semantics:** Clean published events after 7 days

---

## Outbox Contract Summary

| Event | State-Event Coupling | Duplicate Risk | Lost Event Risk |
|-------|---------------------|----------------|-----------------|
| MissionGenerated | Weak | HIGH | HIGH |
| MissionQueued | Weak | HIGH | HIGH |
| MissionClaimed | Weak | HIGH | HIGH |
| MissionStarted | Weak | HIGH | HIGH |
| MissionCompleted | Weak | HIGH | HIGH |

**Required Outbox Schema:** StandardEventSchema (see Section 4)

**Required Replay Semantics:** All events must be replayable from outbox after crash

**Required Cleanup Semantics:** Delete published events after 7 days

---

# SECTION 3 — IDEMPOTENCY CONTRACT

## Externally Callable Commands

### 3.1 Mission Generation

**Command:** `mission_generation_service.js:generateMissions(repoId)`

**Idempotency key:** `generate-missions-${repoId}-${timestamp}`

**Storage location:** idempotency_keys table

**Lifetime:** 1 hour

**Conflict behavior:** Return cached result

**Replay behavior:** Return cached mission list

**Recovery behavior:** Re-execute if expired

**Classification:** MISSING

---

### 3.2 Mission Enqueue

**Command:** `mission_queue.js:enqueueTransactional(missionId, priority)`

**Idempotency key:** `enqueue-mission-${missionId}`

**Storage location:** idempotency_keys table

**Lifetime:** 24 hours

**Conflict behavior:** Return existing queue entry

**Replay behavior:** Return existing queue entry

**Recovery behavior:** Re-execute if expired

**Classification:** MISSING

---

### 3.3 Mission Claim

**Command:** `mission_queue.js:claim(schedulerId, leaseSeconds)`

**Idempotency key:** Not applicable (competitive operation)

**Storage location:** N/A

**Lifetime:** N/A

**Conflict behavior:** Use advisory locking

**Replay behavior:** Advisory lock prevents duplicate claim

**Recovery behavior:** Lease expiration allows re-claim

**Classification:** WEAK (requires advisory locking)

---

### 3.4 Mission Execution

**Command:** `mission_execution_authority.js:executeMission(missionId)`

**Idempotency key:** `execute-mission-${missionId}`

**Storage location:** execution_tokens table

**Lifetime:** Until mission completion

**Conflict behavior:** Return existing execution result

**Replay behavior:** Return cached execution result

**Recovery behavior:** Re-execute if not completed

**Classification:** MISSING

---

### 3.5 Event Publication

**Command:** `mission_event_bus.js:publish(eventType, eventData)`

**Idempotency key:** `publish-event-${eventId}`

**Storage location:** idempotency_keys table

**Lifetime:** 1 hour

**Conflict behavior:** Return existing event

**Replay behavior:** Return existing event

**Recovery behavior:** Outbox replay handles recovery

**Classification:** MISSING

---

## Idempotency Contract Summary

| Command | Classification | Blocker |
|---------|---------------|---------|
| Mission Generation | MISSING | No idempotency key |
| Mission Enqueue | MISSING | No idempotency key |
| Mission Claim | WEAK | Requires advisory locking |
| Mission Execution | MISSING | No idempotency key |
| Event Publication | MISSING | No idempotency key |

---

# SECTION 4 — STANDARDEVENTSCHEMA

## Event Inventory

### 4.1 MissionGenerated

**Current schema:**
```javascript
{
  event_id: string,
  event_type: "MissionGenerated",
  event_data: {
    mission_id: string,
    repo_id: string,
    mission_type: string,
    mission_description: string
  },
  event_hash: string,
  created_at: timestamp,
  witness: object
}
```

**Producer:** MissionGenerationService

**Consumers:** Unknown (event bus subscribers)

**Replay safe?** NO - No version field

**Versioned?** NO

**Deterministic?** Partially (hash exists)

**Canonical ordering?** NO

---

### 4.2 MissionQueued

**Current schema:**
```javascript
{
  event_id: string,
  event_type: "MissionQueued",
  event_data: {
    queue_id: string,
    mission_id: string,
    priority: number
  }
}
```

**Producer:** MissionQueue

**Consumers:** Unknown (event bus subscribers)

**Replay safe?** NO

**Versioned?** NO

**Deterministic?** NO

**Canonical ordering?** NO

---

### 4.3 MissionClaimed

**Current schema:**
```javascript
{
  event_id: string,
  event_type: "MissionClaimed",
  event_data: {
    queue_id: string,
    mission_id: string,
    scheduler_id: string,
    lease_expiration: timestamp
  }
}
```

**Producer:** MissionQueue

**Consumers:** Unknown (event bus subscribers)

**Replay safe?** NO

**Versioned?** NO

**Deterministic?** NO

**Canonical ordering?** NO

---

### 4.4 MissionStarted

**Current schema:**
```javascript
{
  event_id: string,
  event_type: "MissionStarted",
  event_data: {
    mission_id: string,
    execution_id: string,
    started_at: timestamp
  }
}
```

**Producer:** MissionExecutionAuthority

**Consumers:** Unknown (event bus subscribers)

**Replay safe?** NO

**Versioned?** NO

**Deterministic?** NO

**Canonical ordering?** NO

---

## Constitutional Schema Design

**Required Fields:**
```javascript
{
  event_id: string,           // Unique identifier
  event_type: string,         // Event type
  aggregate_id: string,       // Aggregate identifier
  aggregate_type: string,     // Aggregate type (mission, queue, execution)
  authority: string,          // Authority that created event
  authority_version: string,  // Authority version
  causation_id: string,       // Event that caused this event (optional)
  correlation_id: string,     // Correlation ID for tracing
  timestamp: number,          // Constitutional timestamp
  payload_version: number,     // Payload version for evolution
  payload: object,            // Event payload
  witness: object             // Cryptographic witness
}
```

**Forbidden Fields:**
- `event_data` (use `payload` instead)
- `event_hash` (use `witness` instead)
- `version` (use `payload_version` instead)
- Custom authority-specific fields

**Version Evolution Rules:**
1. Never remove required fields
2. Add optional fields with new payload_version
3. Consumers must ignore unknown fields
4. Producers must maintain backward compatibility
5. Schema changes require payload_version increment

---

# SECTION 5 — LOCKING MODEL

## Concurrent Mutation Inventory

### 5.1 Mission Aggregate

**Aggregate:** Mission (missions table)

**Current locking:** None

**Race conditions:**
- Concurrent mission creation for same repo
- Concurrent mission status updates
- Concurrent mission priority updates

**Required lock scope:** Row-level lock on mission_id

**Recommend:** PostgreSQL advisory lock with key based on mission_id

**Rationale:** Mission is single-writer aggregate, requires exclusive access

---

### 5.2 Queue Aggregate

**Aggregate:** Queue (mission_queue table)

**Current locking:** FOR UPDATE SKIP LOCKED in claim()

**Race conditions:**
- Concurrent claim operations
- Concurrent lease renewals
- Concurrent status updates

**Required lock scope:** Row-level lock on queue_id

**Recommend:** PostgreSQL advisory lock with key based on queue_id

**Rationale:** Queue entry is single-writer aggregate, requires exclusive access during claim

---

### 5.3 Execution Aggregate

**Aggregate:** Execution (mission_executions table)

**Current locking:** None

**Race conditions:**
- Concurrent execution attempts for same mission
- Concurrent status updates
- Concurrent result updates

**Required lock scope:** Row-level lock on execution_id

**Recommend:** PostgreSQL advisory lock with key based on execution_id

**Rationale:** Execution is single-writer aggregate, requires exclusive access

---

### 5.4 Event Aggregate

**Aggregate:** Event (mission_events table, event_outbox table)

**Current locking:** None

**Race conditions:**
- Concurrent event publication
- Concurrent event processing

**Required lock scope:** None needed (append-only)

**Recommend:** No lock (append-only pattern)

**Rationale:** Events are immutable, no mutation possible

---

## Locking Model Summary

| Aggregate | Current Locking | Required Locking | Recommendation |
|-----------|------------------|-------------------|----------------|
| Mission | None | Advisory lock | PostgreSQL advisory |
| Queue | FOR UPDATE SKIP LOCKED | Advisory lock | PostgreSQL advisory |
| Execution | None | Advisory lock | PostgreSQL advisory |
| Event | None | None | No lock (append-only) |

---

# SECTION 6 — CORRECTNESS TEST MATRIX

## Regression Suite Design

### Test 1: Duplicate Request

**Purpose:** Verify idempotency prevents duplicate execution

**Expected invariant:** Operation executes once, same result returned

**Failure condition:** Operation executes twice, different results

**Recovery expectation:** Idempotency key prevents second execution

---

### Test 2: Rollback

**Purpose:** Verify transaction rollback on error

**Expected invariant:** No partial state on failure

**Failure condition:** Partial state persists after error

**Recovery expectation:** TransactionBoundary rolls back all changes

---

### Test 3: Crash During Transaction

**Purpose:** Verify crash safety during transaction

**Expected invariant:** No partial state after crash

**Failure condition:** Partial state persists after crash

**Recovery expectation:** PostgreSQL rolls back uncommitted transaction

---

### Test 4: Crash After Commit Before Event

**Purpose:** Verify outbox survives crash after commit

**Expected invariant:** Event exists in outbox, can be replayed

**Failure condition:** Event lost after crash

**Recovery expectation:** Outbox dispatcher replays event on restart

---

### Test 5: Crash After Event Before Commit

**Purpose:** Verify event doesn't exist if transaction not committed

**Expected invariant:** No event published if transaction rolled back

**Failure condition:** Event exists without state

**Recovery expectation:** Outbox not written if transaction rolled back

---

### Test 6: Replay

**Purpose:** Verify deterministic replay from outbox

**Expected invariant:** Replay produces same event

**Failure condition:** Replay produces different event

**Recovery expectation:** StandardEventSchema ensures deterministic serialization

---

### Test 7: Outbox Replay

**Purpose:** Verify outbox dispatcher recovers unpublished events

**Expected invariant:** All unpublished events published after restart

**Failure condition:** Events remain unpublished after restart

**Recovery expectation:** Dispatcher processes unpublished events on startup

---

### Test 8: Retry Replay

**Purpose:** Verify idempotency prevents duplicate execution on retry

**Expected invariant:** Retry returns cached result

**Failure condition:** Retry executes business logic again

**Recovery expectation:** IdempotencyManager returns cached result

---

### Test 9: Network Timeout

**Purpose:** Verify timeout doesn't leave partial state

**Expected invariant:** No partial state on timeout

**Failure condition:** Partial state persists after timeout

**Recovery expectation:** TransactionBoundary rolls back on timeout

---

### Test 10: Database Timeout

**Purpose:** Verify database timeout doesn't leave partial state

**Expected invariant:** No partial state on timeout

**Failure condition:** Partial state persists after timeout

**Recovery expectation:** PostgreSQL rolls back uncommitted transaction

---

### Test 11: Worker Restart

**Purpose:** Verify worker restart doesn't lose in-flight work

**Expected invariant:** In-flight work resumes or is retried

**Failure condition:** Work lost on restart

**Recovery expectation:** Outbox dispatcher processes unpublished events

---

### Test 12: Power Failure

**Purpose:** Verify power failure doesn't corrupt state

**Expected invariant:** No partial state after power failure

**Failure condition:** Partial state persists after power failure

**Recovery expectation:** PostgreSQL WAL ensures atomicity

---

# SECTION 7 — DEPENDENCY GRAPH

```
TransactionBoundary
    ↓
StandardEventSchema
    ↓
EventOutbox
    ↓
IdempotencyManager
    ↓
AdvisoryLock
    ↓
Regression Tests
```

**Dependency Rules:**
- StandardEventSchema must be defined before EventOutbox can use it
- EventOutbox must be implemented before TransactionBoundary can integrate it
- TransactionBoundary must be implemented before IdempotencyManager can use it
- AdvisoryLock must be implemented before concurrent operations can use it
- All implementations must be complete before regression tests can pass

---

# SECTION 8 — EXECUTION ORDER

## Task 1: StandardEventSchema

**Prerequisites:** None

**Deliverables:**
- StandardEventSchema class with validation
- Deterministic serialization
- Version evolution rules

**Verification:** Schema validation tests pass

**Rollback strategy:** Revert to existing event format

**Blocking risks:** None

---

## Task 2: TransactionBoundary

**Prerequisites:** None

**Deliverables:**
- TransactionBoundary class
- TransactionMiddleware
- Context propagation

**Verification:** Rollback tests pass

**Rollback strategy:** Remove TransactionBoundary wrapper

**Blocking risks:** None

---

## Task 3: EventOutbox

**Prerequisites:** StandardEventSchema, TransactionBoundary

**Deliverables:**
- EventOutbox class with StandardEventSchema
- Dispatcher with retry
- Ordering guarantees

**Verification:** Outbox replay tests pass

**Rollback strategy:** Revert to direct event publication

**Blocking risks:** StandardEventSchema must be complete

---

## Task 4: IdempotencyManager

**Prerequisites:** TransactionBoundary

**Deliverables:**
- IdempotencyManager with database uniqueness
- Execution tokens
- Replay tokens

**Verification:** Duplicate request tests pass

**Rollback strategy:** Remove idempotency checks

**Blocking risks:** TransactionBoundary must be complete

---

## Task 5: AdvisoryLock

**Prerequisites:** None

**Deliverables:**
- AdvisoryLock class
- LockManager class
- Lock timeout handling

**Verification:** Concurrent write tests pass

**Rollback strategy:** Remove advisory locks

**Blocking risks:** None

---

## Task 6: Integration

**Prerequisites:** All previous tasks

**Deliverables:**
- Wire TransactionBoundary into existing operations
- Wire EventOutbox into event publishers
- Wire IdempotencyManager into commands
- Wire AdvisoryLock into concurrent operations

**Verification:** Integration tests pass

**Rollback strategy:** Revert to original implementations

**Blocking risks:** All previous tasks must be complete

---

## Task 7: Regression Suite

**Prerequisites:** Integration complete

**Deliverables:**
- All 12 regression tests
- Test infrastructure

**Verification:** All tests pass

**Rollback strategy:** N/A (tests only)

**Blocking risks:** Integration must be complete

---

# SECTION 9 — CONSTITUTIONAL INVARIANTS

## Invariant Checklist

| Invariant | Current State | Planned State |
|------------|---------------|---------------|
| Exactly-once observable effects | NO | YES |
| Atomic state/event consistency | NO | YES |
| Deterministic replay | NO | YES |
| Version compatibility | NO | YES |
| No duplicate side effects | NO | YES |
| No orphan events | NO | YES |
| No orphan state | NO | YES |
| Crash recoverability | NO | YES |
| Idempotent retries | NO | YES |
| Single transaction authority | NO | YES |

---

# SECTION 10 — COMPLETION GATE

## Completion Matrix

| Capability | Designed | Verified | Blocked |
|------------|----------|----------|---------|
| TransactionBoundary | YES | NO | NO |
| StandardEventSchema | YES | NO | NO |
| EventOutbox | YES | NO | NO |
| IdempotencyManager | YES | NO | NO |
| AdvisoryLock | YES | NO | NO |
| Integration | NO | NO | YES |
| Regression Suite | NO | NO | YES |

**Percentage Complete:** 50% (Designed only, not verified)

---

# FINAL QUESTIONS

## Can the repository guarantee:

**Exactly-once execution?**
- Answer: NO
- Blocker: No idempotency on commands
- Minimum change: Implement IdempotencyManager with database uniqueness

**Crash-safe recovery?**
- Answer: NO
- Blocker: No transaction boundaries, events outside transactions
- Minimum change: Implement TransactionBoundary with outbox pattern

**Deterministic replay?**
- Answer: NO
- Blocker: No StandardEventSchema, no deterministic serialization
- Minimum change: Implement StandardEventSchema with deterministic serialization

**No duplicate side effects?**
- Answer: NO
- Blocker: No idempotency, no advisory locking
- Minimum change: Implement IdempotencyManager and AdvisoryLock

**No orphan events?**
- Answer: NO
- Blocker: Events published outside transactions
- Minimum change: Implement outbox pattern

**No orphan writes?**
- Answer: NO
- Blocker: No transaction boundaries
- Minimum change: Implement TransactionBoundary

**Atomic event/state persistence?**
- Answer: NO
- Blocker: Events outside transactions
- Minimum change: Implement outbox pattern within transactions

**Version-safe evolution?**
- Answer: NO
- Blocker: No version fields in events
- Minimum change: Implement StandardEventSchema with payload_version

---

## CONCLUSION

Phase A1 cannot proceed to implementation until all architectural contracts are verified.

**Current Status:** Architectural design complete, implementation blocked by missing verification

**Next Step:** Review and approve this implementation contract before proceeding with code changes
