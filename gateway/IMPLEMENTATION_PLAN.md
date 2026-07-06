# Implementation Plan

## Phase 3 — Implementation Order with Explicit Prerequisites

**Derived from repository evidence and constitutional audit.**

---

# CRITICAL BLOCKERS

Before Phase A1 implementation can proceed, the following critical blockers must be resolved:

## Blocker 1: Missing serializerAuthority

**Impact:** Identity Authority and Witness Authority cannot be used
**Prerequisite:** Must create serializerAuthority or fix Identity/Witness Authorities
**Priority:** CRITICAL

---

## Blocker 2: No Persistence Authority

**Impact:** Multiple independent persistence implementations
**Prerequisite:** Must create Persistence Authority
**Priority:** CRITICAL

---

## Blocker 3: No Transaction Authority

**Impact:** No transaction abstraction
**Prerequisite:** Must create Transaction Authority
**Priority:** CRITICAL

---

## Blocker 4: No Replay Authority

**Impact:** No unified replay authority
**Prerequisite:** Must create Replay Authority
**Priority:** HIGH

---

# IMPLEMENTATION ORDER

## Phase A0: Foundation Repair (Prerequisite for A1)

### Task A0.1: Create Serializer Authority

**Prerequisites:** None
**Deliverables:**
- `serializer_authority.js` - Single canonical serializer
- Integration with Canonical Authority

**Verification:**
- Identity Authority can load serializerAuthority
- Witness Authority can load serializerAuthority

**Estimated Duration:** 1 day

**Success Criteria:**
- identity_authority.js loads without error
- witness_authority.js loads without error

---

### Task A0.2: Fix Identity Authority

**Prerequisites:** A0.1
**Deliverables:**
- Update identity_authority.js to use serializerAuthority
- Test identity generation

**Verification:**
- Identity Authority generates IDs correctly
- No runtime errors

**Estimated Duration:** 1 day

**Success Criteria:**
- Identity Authority functional
- All ID generation methods work

---

### Task A0.3: Fix Witness Authority

**Prerequisites:** A0.1
**Deliverables:**
- Update witness_authority.js to use serializerAuthority
- Test witness generation

**Verification:**
- Witness Authority generates witnesses correctly
- No runtime errors

**Estimated Duration:** 1 day

**Success Criteria:**
- Witness Authority functional
- All witness generation methods work

---

## Phase A1: Constitutional Correctness Implementation

### Task A1.1: Create Transaction Authority

**Prerequisites:** A0.1, A0.2, A0.3
**Deliverables:**
- `transaction_authority.js` - TransactionAuthority interface
- `transaction_provider.js` - TransactionProvider interface
- `postgres_transaction_provider.js` - PostgresTransactionProvider implementation
- Documentation: TRANSACTION_AUTHORITY.md

**Architecture:**
```
TransactionAuthority (interface)
    ↓
TransactionProvider (interface)
    ↓
PostgresTransactionProvider (implementation)
```

**Verification:**
- Transaction Authority abstraction works
- PostgresTransactionProvider wraps PostgreSQL transactions
- Transaction boundary enforcement

**Estimated Duration:** 2 days

**Success Criteria:**
- Transaction Authority abstracts PostgreSQL transactions
- All transaction operations go through authority
- No direct BEGIN/COMMIT/ROLLBACK in business logic

---

### Task A1.2: Create Persistence Authority

**Prerequisites:** A1.1
**Deliverables:**
- `persistence_authority.js` - Persistence Authority interface
- `persist()` - Persist operation
- `commit()` - Commit operation
- `recover()` - Recover operation
- `snapshot()` - Snapshot operation
- `replay()` - Replay operation
- Documentation: PERSISTENCE_AUTHORITY.md

**Architecture:**
```
Persistence Authority
    ↓
Persist
    ↓
Commit
    ↓
Recover
    ↓
Snapshot
    ↓
Replay
```

**Verification:**
- Persistence Authority abstracts all persistence operations
- Single entry point for all writes
- Transaction integration

**Estimated Duration:** 3 days

**Success Criteria:**
- All persistence operations go through authority
- No direct PostgreSQL access in business logic
- Transaction integration works

---

### Task A1.3: Enforce Standard Event Schema

**Prerequisites:** A0.1, A0.2, A0.3
**Deliverables:**
- Update `standard_event_schema.js` to enforce validation
- Remove custom event envelopes
- Enforce canonical serialization
- Documentation: STANDARD_EVENT_SCHEMA.md

**Verification:**
- All events validate against schema
- No custom event envelopes
- Canonical serialization enforced

**Estimated Duration:** 2 days

**Success Criteria:**
- All events use StandardEventSchema
- Event validation enforced
- Canonical serialization enforced

---

### Task A1.4: Implement Transactional Outbox

**Prerequisites:** A1.1, A1.2, A1.3
**Deliverables:**
- Update `event_outbox.js` to integrate with Transaction Authority
- Update `event_outbox.js` to integrate with Persistence Authority
- Enforce ordering guarantees
- Implement crash recovery
- Documentation: OUTBOX_ARCHITECTURE.md

**Verification:**
- Outbox integrated with Transaction Authority
- Outbox integrated with Persistence Authority
- Event ordering guaranteed
- Crash recovery works

**Estimated Duration:** 3 days

**Success Criteria:**
- All events published through outbox
- Events survive crashes
- Event ordering guaranteed
- No direct event publication

---

### Task A1.5: Implement Idempotency

**Prerequisites:** A1.1, A1.2
**Deliverables:**
- Update `idempotency_manager.js` to integrate with Transaction Authority
- Update `idempotency_manager.js` to integrate with Persistence Authority
- Implement database uniqueness constraints
- Implement replay reuse
- Implement duplicate suppression
- Documentation: IDEMPOTENCY_IMPLEMENTATION.md

**Verification:**
- Idempotency integrated with Transaction Authority
- Idempotency integrated with Persistence Authority
- Database uniqueness enforced
- Replay reuse works
- Duplicate suppression works

**Estimated Duration:** 3 days

**Success Criteria:**
- All commands use idempotency
- Duplicate requests execute once
- Database uniqueness enforced
- Replay reuse works

---

### Task A1.6: Implement Advisory Locking

**Prerequisites:** A0.1, A0.2, A0.3
**Deliverables:**
- Update `advisory_lock.js` to integrate with Identity Authority
- Implement advisory locking for Mission aggregate
- Implement advisory locking for Execution aggregate
- Implement advisory locking for Queue aggregate
- Implement advisory locking for Schedule aggregate
- Documentation: ADVISORY_LOCKING.md

**Verification:**
- Advisory locking integrated with Identity Authority
- Mission aggregate has advisory locking
- Execution aggregate has advisory locking
- Queue aggregate has advisory locking
- Schedule aggregate has advisory locking

**Estimated Duration:** 3 days

**Success Criteria:**
- One writer per aggregate
- Advisory locks prevent concurrent writes
- Lock timeout handling works
- Deadlock detection works

---

## Phase A2: Write Authorities

### Task A2.1: Create Mission Write Authority

**Prerequisites:** A1.1, A1.2, A1.6
**Deliverables:**
- `mission_write_authority.js` - Mission Write Authority
- Integrate with Transaction Authority
- Integrate with Persistence Authority
- Integrate with Advisory Lock
- Integrate with Outbox
- Integrate with Idempotency

**Verification:**
- Mission writes go through authority
- Transaction integration works
- Persistence integration works
- Advisory lock integration works
- Outbox integration works
- Idempotency integration works

**Estimated Duration:** 3 days

**Success Criteria:**
- Single writer for Mission aggregate
- All Mission operations transactional
- Events published through outbox
- Idempotency enforced

---

### Task A2.2: Create Execution Write Authority

**Prerequisites:** A1.1, A1.2, A1.6
**Deliverables:**
- `execution_write_authority.js` - Execution Write Authority
- Integrate with Transaction Authority
- Integrate with Persistence Authority
- Integrate with Advisory Lock
- Integrate with Outbox
- Integrate with Idempotency

**Verification:**
- Execution writes go through authority
- Transaction integration works
- Persistence integration works
- Advisory lock integration works
- Outbox integration works
- Idempotency integration works

**Estimated Duration:** 3 days

**Success Criteria:**
- Single writer for Execution aggregate
- All Execution operations transactional
- Events published through outbox
- Idempotency enforced

---

### Task A2.3: Create Queue Write Authority

**Prerequisites:** A1.1, A1.2, A1.6
**Deliverables:**
- `queue_write_authority.js` - Queue Write Authority
- Integrate with Transaction Authority
- Integrate with Persistence Authority
- Integrate with Advisory Lock
- Integrate with Outbox
- Integrate with Idempotency

**Verification:**
- Queue writes go through authority
- Transaction integration works
- Persistence integration works
- Advisory lock integration works
- Outbox integration works
- Idempotency integration works

**Estimated Duration:** 3 days

**Success Criteria:**
- Single writer for Queue aggregate
- All Queue operations transactional
- Events published through outbox
- Idempotency enforced

---

### Task A2.4: Create Scheduler Write Authority

**Prerequisites:** A1.1, A1.2, A1.6
**Deliverables:**
- `scheduler_write_authority.js` - Scheduler Write Authority
- Integrate with Transaction Authority
- Integrate with Persistence Authority
- Integrate with Advisory Lock
- Integrate with Outbox
- Integrate with Idempotency

**Verification:**
- Scheduler writes go through authority
- Transaction integration works
- Persistence integration works
- Advisory lock integration works
- Outbox integration works
- Idempotency integration works

**Estimated Duration:** 3 days

**Success Criteria:**
- Single writer for Scheduler aggregate
- All Scheduler operations transactional
- Events published through outbox
- Idempotency enforced

---

## Phase A3: Repository Integration

### Task A3.1: Integrate Mission Operations

**Prerequisites:** A2.1
**Deliverables:**
- Replace direct mission writes with Mission Write Authority
- Replace mission_queue.js transactions with Transaction Authority
- Replace mission_queue.js event publication with Outbox
- Replace mission_queue.js idempotency with Idempotency Manager
- Replace mission_queue.js locking with Advisory Lock

**Verification:**
- All mission operations use authorities
- No direct PostgreSQL access
- No direct event publication
- No direct locking

**Estimated Duration:** 4 days

**Success Criteria:**
- Mission operations use authorities
- All constitutional guarantees enforced

---

### Task A3.2: Integrate Execution Operations

**Prerequisites:** A2.2
**Deliverables:**
- Replace direct execution writes with Execution Write Authority
- Replace mission_execution_authority.js transactions with Transaction Authority
- Replace mission_execution_authority.js event publication with Outbox
- Replace mission_execution_authority.js idempotency with Idempotency Manager
- Replace mission_execution_authority.js locking with Advisory Lock

**Verification:**
- All execution operations use authorities
- No direct PostgreSQL access
- No direct event publication
- No direct locking

**Estimated Duration:** 4 days

**Success Criteria:**
- Execution operations use authorities
- All constitutional guarantees enforced

---

### Task A3.3: Integrate Queue Operations

**Prerequisites:** A2.3
**Deliverables:**
- Replace direct queue writes with Queue Write Authority
- Replace mission_queue.js transactions with Transaction Authority
- Replace mission_queue.js event publication with Outbox
- Replace mission_queue.js idempotency with Idempotency Manager
- Replace mission_queue.js locking with Advisory Lock

**Verification:**
- All queue operations use authorities
- No direct PostgreSQL access
- No direct event publication
- No direct locking

**Estimated Duration:** 4 days

**Success Criteria:**
- Queue operations use authorities
- All constitutional guarantees enforced

---

### Task A3.4: Integrate Scheduler Operations

**Prerequisites:** A2.4
**Deliverables:**
- Replace direct scheduler writes with Scheduler Write Authority
- Replace constitutional_autonomous_scheduler.js transactions with Transaction Authority
- Replace constitutional_autonomous_scheduler.js event publication with Outbox
- Replace constitutional_autonomous_scheduler.js idempotency with Idempotency Manager
- Replace constitutional_autonomous_scheduler.js locking with Advisory Lock

**Verification:**
- All scheduler operations use authorities
- No direct PostgreSQL access
- No direct event publication
- No direct locking

**Estimated Duration:** 4 days

**Success Criteria:**
- Scheduler operations use authorities
- All constitutional guarantees enforced

---

### Task A3.5: Remove Direct PostgreSQL Access

**Prerequisites:** A3.1, A3.2, A3.3, A3.4
**Deliverables:**
- Remove all direct PostgreSQL access from authorities
- Remove all direct PostgreSQL access from services
- Enforce Persistence Authority usage

**Verification:**
- No direct PostgreSQL access in codebase
- All persistence goes through Persistence Authority

**Estimated Duration:** 3 days

**Success Criteria:**
- Zero direct PostgreSQL access
- Single persistence authority enforced

---

### Task A3.6: Remove Direct Event Publication

**Prerequisites:** A3.1, A3.2, A3.3, A3.4
**Deliverables:**
- Remove all direct event publication
- Enforce Outbox usage
- Remove event_bus.js direct publication

**Verification:**
- No direct event publication in codebase
- All events go through outbox

**Estimated Duration:** 2 days

**Success Criteria:**
- Zero direct event publication
- Outbox pattern enforced

---

## Phase A4: Regression Suite

### Task A4.1: Implement Transaction Rollback Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Transaction rollback test suite
- Nested transaction tests
- Partial failure tests

**Verification:**
- Rollback tests pass
- Nested transaction tests pass
- Partial failure tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All rollback tests pass
- No partial state on failure

---

### Task A4.2: Implement Duplicate Request Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Duplicate request test suite
- Concurrent duplicate tests
- Replay tests

**Verification:**
- Duplicate request tests pass
- Concurrent duplicate tests pass
- Replay tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All duplicate tests pass
- Duplicate requests execute once

---

### Task A4.3: Implement Outbox Replay Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Outbox replay test suite
- Dispatcher recovery tests
- Duplicate dispatch prevention tests

**Verification:**
- Outbox replay tests pass
- Dispatcher recovery tests pass
- Duplicate dispatch prevention tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All outbox tests pass
- Events survive crashes

---

### Task A4.4: Implement Lock Contention Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Lock contention test suite
- Deadlock detection tests
- Timeout handling tests

**Verification:**
- Lock contention tests pass
- Deadlock detection tests pass
- Timeout handling tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All lock tests pass
- One writer per aggregate

---

### Task A4.5: Implement Crash Recovery Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Crash recovery test suite
- Power failure tests
- Worker restart tests

**Verification:**
- Crash recovery tests pass
- Power failure tests pass
- Worker restart tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All crash recovery tests pass
- No partial state after crash

---

### Task A4.6: Implement Replay Determinism Tests

**Prerequisites:** A3.5, A3.6
**Deliverables:**
- Replay determinism test suite
- Witness determinism tests
- Canonical serialization tests

---

**Verification:**
- Replay determinism tests pass
- Witness determinism tests pass
- Canonical serialization tests pass

**Estimated Duration:** 2 days

**Success Criteria:**
- All replay tests pass
- Replay reconstructs identical state

---

### Task A4.7: Create Constitutional Regression Report

**Prerequisites:** A4.1, A4.2, A4.3, A4.4, A4.5, A4.6
**Deliverables:**
- CONSTITUTIONAL_REGRESSION_REPORT.md
- All test results documented
- Constitutional guarantees verified

**Verification:**
- All regression tests documented
- All constitutional guarantees verified

**Estimated Duration:** 1 day

**Success Criteria:**
- Complete regression report
- All guarantees verified

---

## Phase A5: Architectural Verification

### Task A5.1: Verify Identity Authority

**Prerequisites:** A4.7
**Deliverables:**
- Identity Authority verification
- Repository evidence

**Verification:**
- Identity Authority exists and functional
- Single identity authority enforced

**Estimated Duration:** 1 day

**Success Criteria:**
- Identity Authority verified
- Repository evidence documented

---

### Task A5.2: Verify Transaction Authority

**Prerequisites:** A4.7
**Deliverables:**
- Transaction Authority verification
- Repository evidence

**Verification:**
- Transaction Authority exists and functional
- Single transaction authority enforced

**Estimated Duration:** 1 day

**Success Criteria:**
- Transaction Authority verified
- Repository evidence documented

---

### Task A5.3: Verify Persistence Authority

**Prerequisites:** A4.7
**Deliverables:**
- Persistence Authority verification
- Repository evidence

**Verification:**
- Persistence Authority exists and functional
- Single persistence authority enforced

**Estimated Duration:** 1 day

**Success Criteria:**
- Persistence Authority verified
- Repository evidence documented

---

### Task A5.4: Verify Replay Authority

**Prerequisites:** A4.7
**Deliverables:**
- Replay Authority verification
- Repository evidence

**Verification:**
- Replay Authority exists and functional
- Single replay authority enforced

**Estimated Duration:** 1 day

**Success Criteria:**
- Replay Authority verified
- Repository evidence documented

---

### Task A5.5: Verify Witness Authority

**Prerequisites:** A4.7
**Deliverables:**
- Witness Authority verification
- Repository evidence

**Verification:**
- Witness Authority exists and functional
- Single witness authority enforced

**Estimated Duration:** 1 day

**Success Criteria:**
- Witness Authority verified
- Repository evidence documented

---

### Task A5.6: Create Implementation Evidence

**Prerequisites:** A5.1, A5.2, A5.3, A5.4, A5.5
**Deliverables:**
- IMPLEMENTATION_EVIDENCE.md
- All constitutional guarantees verified
- Repository evidence for all guarantees

**Verification:**
- All guarantees documented
- All repository evidence documented

**Estimated Duration:** 2 days

**Success Criteria:**
- Complete implementation evidence
- All guarantees verified

---

# EXECUTION ORDER SUMMARY

## Phase A0: Foundation Repair (3 days)
- A0.1: Create Serializer Authority (1 day)
- A0.2: Fix Identity Authority (1 day)
- A0.3: Fix Witness Authority (1 day)

## Phase A1: Constitutional Correctness (13 days)
- A1.1: Create Transaction Authority (2 days)
- A1.2: Create Persistence Authority (3 days)
- A1.3: Enforce Standard Event Schema (2 days)
- A1.4: Implement Transactional Outbox (3 days)
- A1.5: Implement Idempotency (3 days)
- A1.6: Implement Advisory Locking (3 days)

## Phase A2: Write Authorities (12 days)
- A2.1: Create Mission Write Authority (3 days)
- A2.2: Create Execution Write Authority (3 days)
- A2.3: Create Queue Write Authority (3 days)
- A2.4: Create Scheduler Write Authority (3 days)

## Phase A3: Repository Integration (17 days)
- A3.1: Integrate Mission Operations (4 days)
- A3.2: Integrate Execution Operations (4 days)
- A3.3: Integrate Queue Operations (4 days)
- A3.4: Integrate Scheduler Operations (4 days)
- A3.5: Remove Direct PostgreSQL Access (3 days)
- A3.6: Remove Direct Event Publication (2 days)

## Phase A4: Regression Suite (13 days)
- A4.1: Implement Transaction Rollback Tests (2 days)
- A4.2: Implement Duplicate Request Tests (2 days)
- A4.3: Implement Outbox Replay Tests (2 days)
- A4.4: Implement Lock Contention Tests (2 days)
- A4.5: Implement Crash Recovery Tests (2 days)
- A4.6: Implement Replay Determinism Tests (2 days)
- A4.7: Create Constitutional Regression Report (1 day)

## Phase A5: Architectural Verification (7 days)
- A5.1: Verify Identity Authority (1 day)
- A5.2: Verify Transaction Authority (1 day)
- A5.3: Verify Persistence Authority (1 day)
- A5.4: Verify Replay Authority (1 day)
- A5.5: Verify Witness Authority (1 day)
- A5.6: Create Implementation Evidence (2 days)

**Total Estimated Duration:** 65 days

---

# PREREQUISITE CHAIN

```
A0.1 (Serializer Authority)
    ↓
A0.2 (Identity Authority) ← A0.1
A0.3 (Witness Authority) ← A0.1
    ↓
A1.1 (Transaction Authority) ← A0.1, A0.2, A0.3
A1.2 (Persistence Authority) ← A1.1
A1.3 (Standard Event Schema) ← A0.1, A0.2, A0.3
A1.4 (Transactional Outbox) ← A1.1, A1.2, A1.3
A1.5 (Idempotency) ← A1.1, A1.2
A1.6 (Advisory Locking) ← A0.1, A0.2, A0.3
    ↓
A2.1 (Mission Write Authority) ← A1.1, A1.2, A1.6
A2.2 (Execution Write Authority) ← A1.1, A1.2, A1.6
A2.3 (Queue Write Authority) ← A1.1, A1.2, A1.6
A2.4 (Scheduler Write Authority) ← A1.1, A1.2, A1.6
    ↓
A3.1 (Mission Integration) ← A2.1
A3.2 (Execution Integration) ← A2.2
A3.3 (Queue Integration) ← A2.3
A3.4 (Scheduler Integration) ← A2.4
A3.5 (Remove Direct PostgreSQL) ← A3.1, A3.2, A3.3, A3.4
A3.6 (Remove Direct Events) ← A3.1, A3.2, A3.3, A3.4
    ↓
A4.1 (Rollback Tests) ← A3.5, A3.6
A4.2 (Duplicate Tests) ← A3.5, A3.6
A4.3 (Outbox Tests) ← A3.5, A3.6
A4.4 (Lock Tests) ← A3.5, A3.6
A4.5 (Crash Tests) ← A3.5, A3.6
A4.6 (Replay Tests) ← A3.5, A3.6
A4.7 (Regression Report) ← A4.1, A4.2, A4.3, A4.4, A4.5, A4.6
    ↓
A5.1 (Verify Identity) ← A4.7
A5.2 (Verify Transaction) ← A4.7
A5.3 (Verify Persistence) ← A4.7
A5.4 (Verify Replay) ← A4.7
A5.5 (Verify Witness) ← A4.7
A5.6 (Implementation Evidence) ← A5.1, A5.2, A5.3, A5.4, A5.5
```

---

# NO CIRCULAR DEPENDENCIES

All dependencies are strictly sequential. No circular dependencies exist.

---

# NO HIDDEN DEPENDENCIES

All dependencies are explicitly stated. No hidden dependencies exist.

---

# SUCCESS GATES

## Gate A0: Foundation Repair Complete
- [ ] Serializer Authority created
- [ ] Identity Authority fixed
- [ ] Witness Authority fixed

## Gate A1: Constitutional Correctness Complete
- [ ] Transaction Authority created
- [ ] Persistence Authority created
- [ ] Standard Event Schema enforced
- [ ] Transactional Outbox implemented
- [ ] Idempotency implemented
- [ ] Advisory Locking implemented

## Gate A2: Write Authorities Complete
- [ ] Mission Write Authority created
- [ ] Execution Write Authority created
- [ ] Queue Write Authority created
- [ ] Scheduler Write Authority created

## Gate A3: Repository Integration Complete
- [ ] Mission operations integrated
- [ ] Execution operations integrated
- [ ] Queue operations integrated
- [ ] Scheduler operations integrated
- [ ] Direct PostgreSQL access removed
- [ ] Direct event publication removed

## Gate A4: Regression Suite Complete
- [ ] Transaction rollback tests pass
- [ ] Duplicate request tests pass
- [ ] Outbox replay tests pass
- [ ] Lock contention tests pass
- [ ] Crash recovery tests pass
- [ ] Replay determinism tests pass
- [ ] Regression report created

## Gate A5: Architectural Verification Complete
- [ ] Identity Authority verified
- [ ] Transaction Authority verified
- [ ] Persistence Authority verified
- [ ] Replay Authority verified
- [ ] Witness Authority verified
- [ ] Implementation evidence created

---

# FINAL SUCCESS CONDITION

Phase A1 is complete only if:
- [ ] Identity Authority exists and is functional
- [ ] Transaction Authority exists and is functional
- [ ] Persistence Authority exists and is functional
- [ ] Replay Authority exists and is functional
- [ ] Witness Authority exists and is functional
- [ ] One writer per aggregate
- [ ] Replay reconstructs identical state
- [ ] Witness verifies replay
- [ ] Events survive crashes
- [ ] Duplicate requests execute once
- [ ] External effects occur only after commit
- [ ] Constitutional regression suite passes
- [ ] Repository evidence proves all guarantees
