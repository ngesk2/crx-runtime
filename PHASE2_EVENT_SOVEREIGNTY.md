# Phase 2 - Event Sovereignty

**Objective:** Inventory every event creation pipeline

**Classification:**
- ExecutionEventBus
- EventService
- InMemoryEventStore
- test buses
- adapters

**Acceptance Criteria:** One event authority

---

## Event Creation Pipeline Inventory

### 1. ExecutionEventBus

**Location:** `runtime/kernel/execution/execution-event-bus.ts`
**Purpose:** Constitutional event pipeline for execution events
**Authority Owner:** ExecutionEventBus (Constitutional Authority)
**Disposition:** ✅ **Preserve** - This is the intended canonical event authority

**Event Types:**
- ExecutionStarted
- ValidationCompleted
- CapabilityExecuted
- ArtifactProduced
- ReplayCommitted
- WitnessGenerated
- ObjectStored
- ProjectionBuilt
- KnowledgeUpdated
- GovernanceEvaluated

**Event Flow:**
```
ExecutionEventBus.publish()
    ↓
Identity Authority
    ↓
Knowledge Authority
    ↓
Replay Authority
    ↓
Provider Authority
    ↓
GitHub Provider
    ↓
Event History
```

**Constitutional Status:** ✅ This is the intended constitutional event authority

---

### 2. EventService

**Location:** `src/services/event-service.ts`
**Purpose:** Event sourcing operations (append, replay, snapshot, witness, verify)
**Authority Owner:** EventService (Business Service)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- appendEvent()
- replayEvents()
- createSnapshot()
- generateWitness()
- verifyEvent()

**Event Types:**
- Business events (aggregate-based)
- Domain events
- Integration events

**Constitutional Violation:** Business service creating events independently

---

### 3. InMemoryEventStore

**Location:** `runtime/kernel/replay/event-store.ts` (referenced in replay-hook.ts)
**Purpose:** In-memory event storage for replay
**Authority Owner:** ReplayHook (Hook mechanism)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- Event storage
- Event retrieval
- Event history management

**Constitutional Violation:** Independent event storage mechanism

---

### 4. EventStore (PostgreSQL)

**Location:** `storage/event_store.py`
**Purpose:** PostgreSQL event store with hash verification
**Authority Owner:** EventStore (Storage Layer)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- append_event()
- get_events()
- get_snapshots()
- create_snapshot()

**Event Types:**
- EventEnvelope events
- Snapshot events
- OutboxMessage events

**Constitutional Violation:** Storage layer creating events independently

---

### 5. ProjectionStore

**Location:** `runtime/event_sourcing/projections.py`
**Purpose:** Event-sourced projections
**Authority Owner:** ProjectionStore (Event Sourcing)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- Event projection
- State reconstruction
- Projection updates

**Event Types:**
- Domain events
- Projection events

**Constitutional Violation:** Event-sourcing system creating events independently

---

### 6. Test Event Buses

**Location:** Test files
**Purpose:** Event bus instances for testing
**Authority Owner:** Test Code
**Disposition:** ⚠ **Preserve** (test-only) - Should use shared event bus

**Instances:**
- `spine-test.ts` line 31: `new ExecutionEventBus()`
- `github-spine-test.ts` line 34: `new ExecutionEventBus()`
- `execution-engine-test.ts`: Uses ExecutionEngine which creates ExecutionEventBus

**Constitutional Status:** Acceptable in tests, but should use shared instance

---

### 7. Gateway EventEmitter

**Location:** `gateway/event_emitter.js`
**Purpose:** Event emission for gateway operations
**Authority Owner:** Gateway (Infrastructure)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- emitInferenceRequest()
- emitInferenceResponse()
- emitInferenceFailed()

**Event Types:**
- Inference events
- Gateway events

**Constitutional Violation:** Infrastructure creating events independently

---

### 8. ExpressCommitAdapter

**Location:** `runtime/adapters/express_commit_adapter.ts`
**Purpose:** HTTP adapter for commit operations
**Authority Owner:** ExpressCommitAdapter (Adapter)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- handleCommitRequest()
- ReplayVerification

**Event Types:**
- Commit events
- Replay events

**Constitutional Violation:** Adapter creating events independently

---

### 9. PostgresEventReader

**Location:** `storage/repositories/postgres_event_reader.py`
**Purpose:** PostgreSQL event reader
**Authority Owner:** PostgresEventReader (Repository)
**Disposition:** ❌ **Harvest** - Should use ExecutionEventBus

**Operations:**
- get_events()
- Event filtering
- Event pagination

**Event Types:**
- PostgreSQL events
- Domain events

**Constitutional Violation:** Repository layer creating events independently

---

## Event Creation Pipeline Summary

**Total Event Creation Pipelines:** 9
**✅ Canonical:** 1 (ExecutionEventBus)
**❌ Alternative:** 8

---

## Event Pipeline Classification

### Constitutional Event Authority
- ✅ ExecutionEventBus - Preserve

### Business Services (Harvest Targets)
- ❌ EventService - Harvest
- ❌ InMemoryEventStore - Harvest
- ❌ ProjectionStore - Harvest

### Storage Layer (Harvest Targets)
- ❌ EventStore (PostgreSQL) - Harvest
- ❌ PostgresEventReader - Harvest

### Infrastructure (Harvest Targets)
- ❌ Gateway EventEmitter - Harvest
- ❌ ExpressCommitAdapter - Harvest

### Test Code (Preserve with Shared Instance)
- ⚠ Test Event Buses - Preserve (test-only, use shared instance)

---

## Acceptance Criteria Status

- [x] Complete inventory of event creation pipelines - ✅ 9 pipelines identified
- [ ] One event authority - ❌ 8 alternative event authorities exist

---

## Required Actions

### 1. Harvest Business Services
**Target:** EventService, InMemoryEventStore, ProjectionStore
**Action:** Route all event creation through ExecutionEventBus
**Disposition:** Services become event authority clients

### 2. Harvest Storage Layer
**Target:** EventStore (PostgreSQL), PostgresEventReader
**Action:** Route all event operations through ExecutionEventBus
**Disposition:** Storage becomes event authority client

### 3. Harvest Infrastructure
**Target:** Gateway EventEmitter, ExpressCommitAdapter
**Action:** Route all event emission through ExecutionEventBus
**Disposition:** Infrastructure becomes event authority client

### 4. Update Test Code
**Target:** Test files with new ExecutionEventBus instances
**Action:** Use shared ExecutionEventBus instance in tests
**Disposition:** Preserve test code but use shared instance

---

## Disposition

**Finding:** Event Authority Fragmentation
**Status:** ❌ **Confirmed** - 8 alternative event creation pipelines exist
**Evidence:** Repository scan and source inspection
**Action:** Harvest all alternative event pipelines to ExecutionEventBus

**Constitutional Target:**
```
ExecutionEventBus (sole event authority)
    ↓
All event creation
    ↓
Constitutional event pipeline
```

**Current State:**
```
9 event creation pipelines
    ↓
Multiple event authorities
    ↓
Constitutional fragmentation
    ↓
Event divergence
```
