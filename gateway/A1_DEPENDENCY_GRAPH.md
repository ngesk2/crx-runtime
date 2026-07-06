# A1 Dependency Graph

## Phase A1 — Constitutional Correctness Implementation

**Dependency Rules:**
- Nothing later may depend on unfinished earlier work
- All dependencies must be explicitly stated
- Circular dependencies are prohibited

---

## Layer 1: Foundation (No Dependencies)

### StandardEventSchema
- Purpose: Define constitutional event schema
- Dependencies: None
- Consumers: EventOutbox, TransactionBoundary

### TransactionBoundary
- Purpose: Provide transaction abstraction
- Dependencies: None
- Consumers: All write operations, EventOutbox

### AdvisoryLock
- Purpose: Provide PostgreSQL advisory locking
- Dependencies: None
- Consumers: Mission, Queue, Execution operations

---

## Layer 2: Core Infrastructure (Depends on Layer 1)

### EventOutbox
- Purpose: Durable event publication
- Dependencies: StandardEventSchema, TransactionBoundary
- Consumers: All event publishers

### IdempotencyManager
- Purpose: Idempotency enforcement
- Dependencies: TransactionBoundary
- Consumers: All externally callable commands

---

## Layer 3: Integration (Depends on Layer 2)

### Mission Generation Integration
- Purpose: Wire TransactionBoundary and EventOutbox into mission generation
- Dependencies: TransactionBoundary, EventOutbox, IdempotencyManager
- Consumers: None

### Mission Queue Integration
- Purpose: Wire TransactionBoundary, EventOutbox, AdvisoryLock into queue operations
- Dependencies: TransactionBoundary, EventOutbox, IdempotencyManager, AdvisoryLock
- Consumers: None

### Mission Execution Integration
- Purpose: Wire TransactionBoundary, EventOutbox, IdempotencyManager into execution
- Dependencies: TransactionBoundary, EventOutbox, IdempotencyManager, AdvisoryLock
- Consumers: None

### Event Bus Integration
- Purpose: Wire EventOutbox into event bus
- Dependencies: EventOutbox
- Consumers: None

---

## Layer 4: Verification (Depends on Layer 3)

### Regression Suite
- Purpose: Verify constitutional invariants
- Dependencies: All Layer 3 integrations
- Consumers: None

---

## Dependency Graph Visualization

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: Foundation                  │
├───────────────────┬───────────────────┬────────────────┤
│ StandardEventSchema│ TransactionBoundary│  AdvisoryLock  │
└─────────┬─────────┴─────────┬─────────┴────────┬───────┘
          │                 │                  │
          └─────────────────┼──────────────────┘
                            │
┌───────────────────────────┼───────────────────────────┐
│                           │                           │
┌───────────────────────────┴───────────────────────────┐
│              Layer 2: Core Infrastructure             │
├──────────────────────────────┬────────────────────────┤
│          EventOutbox          │   IdempotencyManager   │
└──────────────┬───────────────┴──────────┬─────────────┘
               │                            │
               └────────────┬───────────────┘
                            │
┌───────────────────────────┼───────────────────────────┐
│                           │                           │
┌───────────────────────────┴───────────────────────────┐
│               Layer 3: Integration                    │
├──────────┬──────────┬──────────┬──────────────────────┤
│ Mission  │ Mission  │ Mission  │    Event Bus         │
│ Generation│   Queue  │Execution │   Integration        │
│ Integration│Integration│Integration│                   │
└──────────┴──────────┴──────────┴──────────────────────┘
               │
               │
┌──────────────┴────────────────────────────────────────┐
│          Layer 4: Verification                         │
├───────────────────────────────────────────────────────┤
│              Regression Suite                          │
└───────────────────────────────────────────────────────┘
```

---

## Critical Path

The critical path for Phase A1 is:

1. StandardEventSchema (Layer 1)
2. TransactionBoundary (Layer 1)
3. EventOutbox (Layer 2 - depends on 1, 2)
4. Mission Queue Integration (Layer 3 - depends on 1, 2, 3, AdvisoryLock)
5. Regression Suite (Layer 4 - depends on all Layer 3)

**Estimated Critical Path Duration:** 5 sequential tasks

---

## Parallel Work Opportunities

### Parallel Group 1 (Layer 1)
- StandardEventSchema
- TransactionBoundary
- AdvisoryLock

**Can be parallelized:** YES (no dependencies)

### Parallel Group 2 (Layer 2)
- EventOutbox
- IdempotencyManager

**Can be parallelized:** YES (no dependencies between them)

### Parallel Group 3 (Layer 3)
- Mission Generation Integration
- Mission Queue Integration
- Mission Execution Integration
- Event Bus Integration

**Can be parallelized:** PARTIALLY (Event Bus Integration depends only on EventOutbox, others depend on all Layer 2)

---

## Dependency Violations to Avoid

### Circular Dependencies
- ❌ TransactionBoundary → EventOutbox → TransactionBoundary
- ❌ IdempotencyManager → TransactionBoundary → IdempotencyManager

### Missing Dependencies
- ❌ EventOutbox without StandardEventSchema
- ❌ Integration without TransactionBoundary
- ❌ Regression Suite without Integration

### Premature Dependencies
- ❌ Regression Suite depending on Layer 1 only
- ❌ Integration depending on incomplete Layer 2

---

## Dependency Validation Checklist

Before proceeding with implementation, verify:

- [ ] All Layer 1 components have no dependencies
- [ ] All Layer 2 components depend only on Layer 1
- [ ] All Layer 3 components depend only on Layer 1 and Layer 2
- [ ] Layer 4 depends on all Layer 3 components
- [ ] No circular dependencies exist
- [ ] No missing dependencies exist
- [ ] No premature dependencies exist

---

## Dependency Change Impact Analysis

If a component changes, what must be re-verified?

### StandardEventSchema Changes
- Impact: EventOutbox, all event publishers
- Re-verification: EventOutbox integration, event serialization

### TransactionBoundary Changes
- Impact: All write operations, EventOutbox, IdempotencyManager
- Re-verification: All integrations, rollback tests

### EventOutbox Changes
- Impact: All event publishers, event bus
- Re-verification: Event publication, outbox replay tests

### IdempotencyManager Changes
- Impact: All externally callable commands
- Re-verification: Idempotency tests, duplicate request tests

### AdvisoryLock Changes
- Impact: Mission, Queue, Execution operations
- Re-verification: Concurrent write tests, lock contention tests
