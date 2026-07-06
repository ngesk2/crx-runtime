# A1 Execution Order

## Phase A1 — Constitutional Correctness Implementation

**Execution Strategy:** Sequential implementation with verification gates.

---

## Overview

Total Estimated Duration: 8 weeks

**Phases:**
1. Foundation (Week 1-2)
2. Core Infrastructure (Week 3-4)
3. Integration (Week 5-6)
4. Verification (Week 7-8)

---

## Phase 1: Foundation (Week 1-2)

### Task 1.1: StandardEventSchema Implementation

**Duration:** 3 days

**Prerequisites:** None

**Deliverables:**
- StandardEventSchema class with validation
- Deterministic serialization
- Version evolution rules
- Schema validation tests

**Verification:**
- [ ] Schema validation tests pass
- [ ] Serialization determinism tests pass
- [ ] Migration validation tests pass

**Rollback Strategy:** Revert to existing event format

**Blocking Risks:** None

**Success Criteria:**
- All required fields validated
- Deterministic serialization verified
- Version evolution rules defined

---

### Task 1.2: TransactionBoundary Implementation

**Duration:** 3 days

**Prerequisites:** None

**Deliverables:**
- TransactionBoundary class
- TransactionMiddleware
- Context propagation
- Rollback tests
- Nested transaction tests
- Partial failure tests

**Verification:**
- [ ] Rollback tests pass
- [ ] Nested transaction tests pass
- [ ] Partial failure tests pass

**Rollback Strategy:** Remove TransactionBoundary wrapper

**Blocking Risks:** R1 (Performance Impact)

**Success Criteria:**
- Transactions rollback correctly on error
- Savepoints work correctly
- No partial state on failure

---

### Task 1.3: AdvisoryLock Implementation

**Duration:** 2 days

**Prerequisites:** None

**Deliverables:**
- AdvisoryLock class
- LockManager class
- Lock timeout handling
- Concurrent write tests
- Lock contention tests
- Deadlock detection tests
- Timeout handling tests

**Verification:**
- [ ] Concurrent write tests pass
- [ ] Lock contention tests pass
- [ ] Deadlock detection tests pass
- [ ] Timeout handling tests pass

**Rollback Strategy:** Remove advisory locks

**Blocking Risks:** R3 (Lock Contention), R9 (Deadlock)

**Success Criteria:**
- Only one writer at a time
- Lock timeout works correctly
- No deadlocks occur

---

## Phase 2: Core Infrastructure (Week 3-4)

### Task 2.1: EventOutbox Implementation

**Duration:** 4 days

**Prerequisites:** Task 1.1 (StandardEventSchema), Task 1.2 (TransactionBoundary)

**Deliverables:**
- EventOutbox class with StandardEventSchema
- Dispatcher with retry
- Ordering guarantees
- Dispatcher recovery tests
- Duplicate dispatch prevention tests
- Replay verification tests

**Verification:**
- [ ] Dispatcher recovery tests pass
- [ ] Duplicate dispatch prevention tests pass
- [ ] Replay verification tests pass

**Rollback Strategy:** Revert to direct event publication

**Blocking Risks:** R2 (Dispatcher Bottleneck), R7 (Ordering Violation)

**Success Criteria:**
- Events survive crashes
- Duplicate dispatch prevented
- Events replay deterministically

---

### Task 2.2: IdempotencyManager Implementation

**Duration:** 4 days

**Prerequisites:** Task 1.2 (TransactionBoundary)

**Deliverables:**
- IdempotencyManager with database uniqueness
- Execution tokens
- Replay tokens
- Duplicate request tests
- Concurrent duplicate tests
- Replay tests

**Verification:**
- [ ] Duplicate request tests pass
- [ ] Concurrent duplicate tests pass
- [ ] Replay tests pass

**Rollback Strategy:** Remove idempotency checks

**Blocking Risks:** R4 (Key Exhaustion), R8 (Key Collision)

**Success Criteria:**
- Duplicate requests execute once
- Database uniqueness enforced
- Replay detection works

---

## Phase 3: Integration (Week 5-6)

### Task 3.1: Mission Generation Integration

**Duration:** 3 days

**Prerequisites:** Task 2.1 (EventOutbox), Task 2.2 (IdempotencyManager)

**Deliverables:**
- Wire TransactionBoundary into mission generation
- Wire EventOutbox into mission generation
- Wire IdempotencyManager into mission generation
- Integration tests

**Verification:**
- [ ] Mission generation uses TransactionBoundary
- [ ] MissionGenerated event uses outbox
- [ ] Mission generation is idempotent

**Rollback Strategy:** Revert to original implementation

**Blocking Risks:** R16 (Integration Breakage)

**Success Criteria:**
- Mission creation transactional
- Events published via outbox
- Duplicate generation prevented

---

### Task 3.2: Mission Queue Integration

**Duration:** 3 days

**Prerequisites:** Task 1.3 (AdvisoryLock), Task 2.1 (EventOutbox), Task 2.2 (IdempotencyManager)

**Deliverables:**
- Wire TransactionBoundary into queue operations
- Wire EventOutbox into queue operations
- Wire IdempotencyManager into queue operations
- Wire AdvisoryLock into queue operations
- Integration tests

**Verification:**
- [ ] Queue operations use TransactionBoundary
- [ ] Queue events use outbox
- [ ] Queue operations are idempotent
- [ ] Queue operations use advisory locks

**Rollback Strategy:** Revert to original implementation

**Blocking Risks:** R16 (Integration Breakage)

**Success Criteria:**
- Queue operations transactional
- Events published via outbox
- Duplicate enqueue prevented
- Concurrent claims serialized

---

### Task 3.3: Mission Execution Integration

**Duration:** 4 days

**Prerequisites:** Task 2.1 (EventOutbox), Task 2.2 (IdempotencyManager), Task 1.3 (AdvisoryLock)

**Deliverables:**
- Wire TransactionBoundary into execution
- Wire EventOutbox into execution
- Wire IdempotencyManager into execution
- Wire AdvisoryLock into execution
- Integration tests

**Verification:**
- [ ] Execution uses TransactionBoundary
- [ ] Execution events use outbox
- [ ] Execution is idempotent
- [ ] Execution uses advisory locks

**Rollback Strategy:** Revert to original implementation

**Blocking Risks:** R16 (Integration Breakage)

**Success Criteria:**
- Execution transactional
- Events published via outbox
- Duplicate execution prevented
- Concurrent executions serialized

---

### Task 3.4: Event Bus Integration

**Duration:** 2 days

**Prerequisites:** Task 2.1 (EventOutbox)

**Deliverables:**
- Wire EventOutbox into event bus
- Remove direct event publication
- Integration tests

**Verification:**
- [ ] Event bus uses outbox
- [ ] Direct publication removed

**Rollback Strategy:** Revert to direct publication

**Blocking Risks:** R16 (Integration Breakage)

**Success Criteria:**
- All events published via outbox
- No direct event publication

---

## Phase 4: Verification (Week 7-8)

### Task 4.1: Regression Suite Implementation

**Duration:** 5 days

**Prerequisites:** All Phase 3 tasks

**Deliverables:**
- Duplicate request test
- Rollback test
- Crash during transaction test
- Crash after commit before event test
- Crash after event before commit test
- Replay test
- Outbox replay test
- Retry replay test
- Network timeout test
- Database timeout test
- Worker restart test
- Power failure test

**Verification:**
- [ ] All 12 regression tests pass

**Rollback Strategy:** N/A (tests only)

**Blocking Risks:** R18 (Test Coverage Gaps), R20 (Flaky Tests)

**Success Criteria:**
- All constitutional invariants verified
- All failure scenarios covered

---

### Task 4.2: Documentation

**Duration:** 3 days

**Prerequisites:** Task 4.1

**Deliverables:**
- TRANSACTION_BOUNDARY.md
- OUTBOX_ARCHITECTURE.md
- IDEMPOTENCY_IMPLEMENTATION.md
- STANDARD_EVENT_SCHEMA.md
- ADVISORY_LOCKING_IMPLEMENTATION.md
- CONSTITUTIONAL_REGRESSION_REPORT.md

**Verification:**
- [ ] All documentation complete
- [ ] All documentation reviewed

**Rollback Strategy:** N/A (documentation only)

**Blocking Risks:** None

**Success Criteria:**
- All implementation documented
- All architectural decisions explained

---

## Gate Criteria

### Gate 1: Foundation Complete (End of Week 2)
- [ ] StandardEventSchema implemented and tested
- [ ] TransactionBoundary implemented and tested
- [ ] AdvisoryLock implemented and tested
- [ ] All Foundation tests pass
- [ ] No critical risks unmitigated

**Can proceed to Phase 2:** YES/NO

---

### Gate 2: Core Infrastructure Complete (End of Week 4)
- [ ] EventOutbox implemented and tested
- [ ] IdempotencyManager implemented and tested
- [ ] All Core Infrastructure tests pass
- [ ] No critical risks unmitigated

**Can proceed to Phase 3:** YES/NO

---

### Gate 3: Integration Complete (End of Week 6)
- [ ] Mission Generation integrated and tested
- [ ] Mission Queue integrated and tested
- [ ] Mission Execution integrated and tested
- [ ] Event Bus integrated and tested
- [ ] All Integration tests pass
- [ ] No critical risks unmitigated

**Can proceed to Phase 4:** YES/NO

---

### Gate 4: Verification Complete (End of Week 8)
- [ ] All 12 regression tests pass
- [ ] All documentation complete
- [ ] All constitutional invariants verified
- [ ] No critical risks unmitigated

**Phase A1 Complete:** YES/NO

---

## Parallel Work Opportunities

### Week 1 (Parallel)
- Task 1.1: StandardEventSchema (Days 1-3)
- Task 1.2: TransactionBoundary (Days 1-3)
- Task 1.3: AdvisoryLock (Days 4-5)

### Week 3 (Parallel)
- Task 2.1: EventOutbox (Days 1-4)
- Task 2.2: IdempotencyManager (Days 1-4)

### Week 5 (Sequential - AdvisoryLock dependency)
- Task 3.1: Mission Generation (Days 1-3)
- Task 3.2: Mission Queue (Days 4-6)
- Task 3.3: Mission Execution (Days 7-10)
- Task 3.4: Event Bus (Days 11-12)

---

## Blocking Risks by Phase

### Phase 1 Blocking Risks
- R1: Transaction Boundary Performance Impact
- R3: Advisory Lock Contention
- R9: Advisory Lock Deadlock

**Mitigation Required Before Phase 2:**
- Benchmark TransactionBoundary performance
- Define lock ordering rules
- Implement deadlock detection

---

### Phase 2 Blocking Risks
- R2: Outbox Dispatcher Bottleneck
- R4: Idempotency Key Exhaustion
- R7: Outbox Event Ordering Violation
- R8: Idempotency Key Collision

**Mitigation Required Before Phase 3:**
- Implement batch processing
- Implement TTL-based cleanup
- Implement strict event ordering
- Validate idempotency key generation

---

### Phase 3 Blocking Risks
- R16: Transaction Boundary Integration Breakage

**Mitigation Required Before Phase 4:**
- Implement gradual integration
- Add feature flags
- Test integration thoroughly

---

### Phase 4 Blocking Risks
- R18: Regression Test Coverage Gaps
- R20: Flaky Tests

**Mitigation Required Before Completion:**
- Define comprehensive test matrix
- Eliminate flaky tests

---

## Rollback Plan

### Phase 1 Rollback
If Foundation implementation fails:
1. Revert StandardEventSchema changes
2. Remove TransactionBoundary wrapper
3. Remove AdvisoryLock usage
4. Restore original event format
5. Restore original transaction handling

**Estimated Rollback Time:** 1 day

---

### Phase 2 Rollback
If Core Infrastructure implementation fails:
1. Revert EventOutbox changes
2. Remove IdempotencyManager usage
3. Restore direct event publication
4. Restore original idempotency handling

**Estimated Rollback Time:** 2 days

---

### Phase 3 Rollback
If Integration fails:
1. Revert Mission Generation integration
2. Revert Mission Queue integration
3. Revert Mission Execution integration
4. Revert Event Bus integration
5. Restore original implementations

**Estimated Rollback Time:** 3 days

---

### Phase 4 Rollback
If Verification fails:
1. Fix failing tests
2. Update documentation
3. Re-run verification

**Estimated Rollback Time:** 2 days

---

## Success Metrics

### Phase 1 Success Metrics
- StandardEventSchema validation: 100% pass rate
- TransactionBoundary rollback: 100% success rate
- AdvisoryLock acquisition: <100ms average
- AdvisoryLock contention: <5% failure rate

### Phase 2 Success Metrics
- EventOutbox dispatch: <1s average latency
- EventOutbox replay: 100% success rate
- IdempotencyManager check: <10ms average latency
- IdempotencyManager duplicate prevention: 100% success rate

### Phase 3 Success Metrics
- Integration tests: 100% pass rate
- Transaction duration: <5s average
- Event publication: <100ms average
- Lock acquisition: <100ms average

### Phase 4 Success Metrics
- Regression tests: 100% pass rate
- Test coverage: >90%
- Flaky test rate: <1%
- Documentation completeness: 100%
