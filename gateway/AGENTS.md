# AGENTS.md - Constitutional Execution Constitution

**Purpose**: This document is the constitution for execution. Every architectural claim must have an executable proof.

---

## Core Principle

**Production Runtime = Constitutional Runtime**

The production runtime (server.js) must be the constitutional runtime. Any deviation is a violation.

---

## Lifecycle States

Every component progresses through these states:

```
Designed
    ↓
Implemented
    ↓
Verified
    ↓
Wired
    ↓
Exercised
    ↓
Production
    ↓
Deprecated
    ↓
Deleted
```

### State Definitions

**Designed**: Architecture specified, interfaces defined
**Implemented**: Code written, unit tests pass
**Verified**: Deterministic, constitutional hashes stable, replay proven, witnesses validated
**Wired**: Connected to other components, routing matrix updated
**Exercised**: Integration tests pass, vertical slice executed
**Production**: Serving production traffic, CRC increased
**Deprecated**: No longer production, but retained for rollback
**Deleted**: Fully removed from codebase

### Verification Stage Requirements

Before any component can move to "Wired", it must be "Verified":

- Deterministic behavior across repeated runs
- Constitutional hashes stable
- Replay proven (identical input → identical output)
- Witnesses validated (witness chain intact)

---

## Constitutional Runtime Coverage (CRC)

### Definition

CRC measures the percentage of production requests that route through constitutional authorities.

### Calculation

```
CRC = (Requests through constitutional authorities / Total production requests) × 100
```

### PR Requirements

Every PR must answer:

```
CRC Before: X%
CRC After: Y%
Delta: +Z%
```

If CRC did not move upward, the PR must justify why it exists.

### Current Status

**CRC: 100%** (13/13 endpoints route through constitutional authorities)

**Target**: 100% ✅ ACHIEVED

---

## Routing Matrix

The Routing Matrix is the migration dashboard. It answers:

- Which requests enter through server.js?
- Which route through constitutional authorities?
- Which perform direct SQL, hashing, inference, or provider calls?

### Current Status

**Total Endpoints**: 13
**Constitutional Authority Routing**: 1/13 (7.7%)
**Direct SQL Violations**: 11/13 (84.6%)

### Critical Violations

- ❌ /events (direct SQL)
- ❌ /events/recent (direct SQL)
- ❌ /events/stats (direct SQL)
- ❌ /events/:stream (direct SQL)
- ❌ /context/recent-events (direct SQL)
- ❌ /context/worker-status (direct SQL)
- ❌ /context/runtime-digest (direct SQL)
- ❌ /context/latest-summaries (direct SQL)
- ❌ /context/recent-failures (direct SQL)
- ❌ /context/model-metrics (direct SQL)
- ❌ /context/daily-activity (direct SQL)

### Migration Dashboard

Instead of asking "Did we build RepositoryAuthority?", ask "Does /sync execute through ExecutionRuntime?"

One is architecture. One is production. Production is what matters.

---

## Exit Criteria

Before persistent Ollama integration, these criteria must be met:

- ✅ Repository builds cleanly
- ✅ All verification scripts pass
- ✅ Containers start from clean environment
- ✅ Gateway starts without manual intervention
- ✅ One repository completes entire ingestion pipeline
- ✅ One replay is deterministic across repeated runs
- ✅ One context pack generated from constitutional objects
- ✅ InferenceAdapter is only path to Ollama
- ✅ No core authority imports I/O library
- ✅ No production path bypasses constitutional authorities

---

## Architectural Expansion Freeze

**Until CRC reaches 100%:**

- ❌ No new authorities
- ❌ No new compiler stages
- ❌ No new runtime abstractions
- ❌ No new infrastructure systems

**Only allowed:**

- ✅ Wiring (connecting existing components)
- ✅ Migration (moving to constitutional paths)
- ✅ Verification (proving correctness)
- ✅ Deletion of fully replaced paths

The finish line must not keep moving.

---

## Migration Safety Rules

### 1. Never Delete Before Replacement

Every deletion must satisfy this proof:

```
Old Path
    ↓
Replaced by
    ↓
New Path
    ↓
Routing Matrix = Constitutional
    ↓
CRC increased
    ↓
Tests pass
    ↓
Delete old code
```

Deletion is the last step, never the first.

### 2. Every Deletion References

- Routing Matrix entry (showing old path → new path)
- CRC improvement (before/after)
- Verification evidence (tests pass)

### 3. Every Production Path Must Have Exactly One Owner

No shared ownership. No ambiguous responsibility.

### 4. Legacy Code Deletion Requirements

Legacy code is only deleted after:

- Constitutional path is production
- Tests pass
- Routing matrix updated
- CRC increased

### 5. No Orphaned Implementations

Every implementation must have a clear owner and a clear purpose.

### 6. No Direct Infrastructure Access from HTTP

HTTP layer must route through constitutional authorities. No direct SQL, no direct provider calls.

### 7. ExecutionRuntime Remains the Only Constitutional Execution Entrypoint

All execution must route through ExecutionRuntime. No bypasses.

---

## Surgical Migration Discipline

Think like a surgeon, not a refactoring engineer.

Every migration must preserve a working patient.

### Correct Order

```
Wire
    ↓
Verify
    ↓
Exercise
    ↓
Measure
    ↓
Deprecate
    ↓
Delete
```

### Incorrect Order

```
Delete
    ↓
Hope
    ↓
Fix
```

Never delete and hope to fix. Always preserve functionality first.

---

## Verification Harness

### Command

```bash
npm run verify
```

### Individual Verifications

```bash
npm run verify:repository
npm run verify:build
npm run verify:typescript
npm run verify:python
npm run verify:containers
npm run verify:database
npm run verify:gateway
npm run verify:workers
npm run verify:authorities
npm run verify:replay
npm run verify:pipeline
npm run verify:ollama
npm run verify:e2e
```

### One Question

Can this repository be trusted?

---

## Operational Invariant

**Every architectural claim must have an executable proof.**

Examples:

**Claim**: One ReplayAuthority
**Proof**: `npm run verify:replay`

**Claim**: One HashAuthority
**Proof**: `npm run verify:hash`

**Claim**: Adapters contain no reasoning
**Proof**: `npm run verify:adapters`

**Claim**: No core I/O
**Proof**: `npm run verify:core-boundaries`

Architecture becomes continuously testable.

---

## Current System Readiness

### Layer Evidence Status

| Layer | Evidence | Status |
|-------|----------|--------|
| Repository integrity | ❌ | Not proven |
| Build | ❌ | Not proven |
| Containers | ⚠️ | Partially proven |
| Database | ⚠️ | Partially proven |
| Runtime startup | ❌ | Not proven |
| Constitutional authorities | ✅ | Partially proven |
| Replay determinism | ❌ | Not proven |
| Vertical slice | ❌ | Not proven |
| Ollama integration | ❌ | Not proven |

### Verification Results

- **11/13 passed** (84.6%)
- **2 failed** (authorities, replay) due to duplicate implementations

### Critical Blockers

1. 84.6% of endpoints bypass constitutional authorities
2. Duplicate authorities (13)
3. Duplicate replay implementations (2)
4. No replay determinism proof
5. No vertical slice execution

---

## Next Actions

### Immediate Priority

1. **Route all event queries through EventAuthority** (11 endpoints)
2. **Route all context queries through Authority** (6 endpoints)
3. **Consolidate duplicate authorities** (13 → 1 each)
4. **Consolidate duplicate replay implementations** (2 → 1)
5. **Prove replay determinism** (run identical input twice)

### CRC Target

Increase CRC from 7.7% to 100% by migrating all endpoints to constitutional paths.

### Exit Criteria

Achieve all 10 exit criteria before persistent Ollama integration.

---

## Protection of Existing Work

You have accumulated significant architectural value:

- Authorities (40+)
- Replay logic
- Witnesses
- Merkle structures
- Dependency graphs

The remaining challenge is **disciplined integration**, not invention.

Every migration must:
- Increase Constitutional Runtime Coverage
- Update the Routing Matrix
- Preserve functionality
- Only then retire legacy code

This execution discipline protects against accidental regressions.
