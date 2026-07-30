# Phase 0.2 - Inventory Diff vs Constitutional Map

**Objective:** Compare generated authority inventory against frozen constitutional map to identify drift

**Classification:**
- ✅ Verified (directly observed in inspected source)
- 🟡 Inferred (architectural conclusion supported by evidence)
- 🔵 Requires Inspection (insufficient evidence to classify)
- ❓ Unverified Claim (claim made without supporting evidence)
- 💡 Recommendation (architectural convergence advice, not a defect)

**Confidence Scale:**
- High: Verified directly in code
- Medium: Strong architectural inference
- Low: Pattern match only
- Unknown: Repository not inspected

**Severity Scale:**
- P0 Constitutional Failure: Startup failure, canonical hash divergence, constitutional authority bypass
- P1 Runtime Failure: Authority duplication, configuration drift, infrastructure fragmentation
- P2 Drift: Architectural cleanup, façade delegation, helper duplication
- P3 Cleanup: Test construction, dev tools, CLI utilities

---

## Diff Summary

**Total Authorities in Frozen Map:** 12
**Total Authorities in Inventory:** 12
**Authorities with Violations:** 3
**Authorities with Drift:** 2
**Missing Implementations:** 1

---

## Authority-by-Authority Diff

### Execution

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | ExecutionEngine | ExecutionEngine | ✅ Match |
| Location | runtime/kernel/execution/execution-engine.ts | runtime/kernel/execution/execution-engine.ts | ✅ Match |
| Category | Constitutional Runtime Gateway | Constitutional Runtime Gateway | ✅ Match |
| Public APIs | execute() | execute() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Events

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | ExecutionEventBus | ExecutionEventBus | ✅ Match |
| Location | runtime/kernel/execution/execution-event-bus.ts | runtime/kernel/execution/execution-event-bus.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | publish(), subscribe(), getEvents() | publish(), subscribe(), getEvents() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Replay

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | DeterministicReplayEngine | DeterministicReplayEngine | ✅ Match |
| Location | runtime/kernel/replay/deterministic_replay_engine.ts | runtime/kernel/replay/deterministic_replay_engine.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | replay(), verify() | replay() | ⚠ Partial match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift (canonical implementation)

---

### Replay (Auxiliary)

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | Python ReplayKernel | Python ReplayKernel | ✅ Match |
| Location | runtime/replay/replay_kernel.py | runtime/replay/replay_kernel.py | ✅ Match |
| Category | Auxiliary | Auxiliary | ✅ Match |
| Public APIs | verify(), compare(), migrate() | replay_events() | ❌ Mismatch |
| Violations | 0 | 1 | ❌ Violation |

**Status:** ❌ Drift detected

**Violation:** ReplayKernel implements constitutional logic (event loading, canonical serialization, hash verification, witness generation, fingerprint generation) instead of acting as auxiliary verifier

**Expected:** Should consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority

**Current:** Owns constitutional logic directly

**Severity:** P1 Runtime Failure

**Action Required:** Refactor to ReplayVerifier that consumes constitutional authorities

---

### Knowledge

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | KnowledgeAuthority | KnowledgeAuthority | ✅ Match |
| Location | runtime/kernel/knowledge/knowledge-authority.ts | runtime/kernel/knowledge/knowledge-authority.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | mutateGraph(), queryGraph() | mutateGraph(), queryGraph() | ✅ Match |
| Violations | 0 | DeterministicReplayEngine | ❌ Violation |

**Status:** ❌ Drift detected

**Violation:** ReplayKernel implements constitutional logic (event loading, canonical serialization, hash verification, witness generation, fingerprint generation) instead of acting as auxiliary verifier

**Expected:** Should consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority

**Current:** Owns constitutional logic directly

**Severity:** P1 Runtime Failure

**Action Required:** Refactor to ReplayVerifier that consumes constitutional authorities

---

### Identity

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | CanonicalIdentityService | CanonicalIdentityService | ✅ Match |
| Location | runtime/kernel/identity/canonical-identity-service.ts | runtime/kernel/identity/canonical-identity-service.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | generateIdentity(), resolveIdentity() | generateIdentity(), resolveIdentity() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Witness

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | WitnessAuthority | WitnessAuthority | ✅ Match |
| Location | runtime/kernel/replay/witness_authority.ts | runtime/kernel/replay/witness_authority.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | generateWitness(),.verifyWitness() | generateWitness(), verifyWitness() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Canonical Hash

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | CanonicalHashAuthority | CanonicalHashAuthority | ✅ Match |
| Location | runtime/kernel/replay/canonical_hash_authority.ts | runtime/kernel/replay/canonical_hash_authority.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | generateHash(), verifyHash() | generateHash(), verifyHash() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift (canonical implementation)

---

### Canonical Hash (Monolithic)

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | N/A | CanonicalAuthority | ❌ Not in map |
| Location | N/A | constitution/authority/canonical.py | ❌ Not in map |
| Category | N/A | Constitutional | ❌ Not in map |
| Public APIs | N/A | serialize_to_canonical_bytes(), hash_canonical_bytes() | ❌ Not in map |
| Violations | 0 | 1 | ❌ Violation |

**Status:** ❌ Drift detected

**Violation:** Monolithic god-object that owns serialize_to_canonical_bytes(), hash_canonical_bytes()

**Expected:** Should be split into CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService

**Current:** Single object owns all canonical operations

**Severity:** P1 Runtime Failure

**Action Required:** Harvest into separate authorities

---

### Provider Lifetime

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | RuntimeContainer | RuntimeContainer | ✅ Match |
| Location | runtime/di_container.py | runtime/di_container.py | ✅ Match |
| Category | Runtime | Runtime | ✅ Match |
| Public APIs | create(), shutdown() | create(), shutdown() | ✅ Match |
| Violations | 0 | 1 (global singleton) | ⚠ Drift |

**Status:** ⚠ Drift detected

**Drift:** Global _container instance with get_container() function

**Expected:** RuntimeBootstrap → RuntimeContainer → Application without module globals

**Current:** Module-level singleton pattern

**Severity:** P2 Drift

**Action Required:** Refactor to eliminate global state (acceptable for now as composition root)

---

### Provider Resolution

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | ProviderRegistry | ProviderRegistry | ✅ Match |
| Location | runtime/kernel/providers/provider-registry.ts | runtime/kernel/providers/provider-registry.ts | ✅ Match |
| Category | Constitutional | Constitutional | ✅ Match |
| Public APIs | registerProvider(), resolveProvider(), getProviders() | registerProvider(), resolveProvider(), getProviders() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Bootstrap

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | RuntimeBootstrap | RuntimeBootstrap | ✅ Match |
| Location | runtime/bootstrap.py | runtime/bootstrap.py | ✅ Match |
| Category | Runtime | Runtime | ✅ Match |
| Public APIs | bootstrap() | bootstrap() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Projection Pipeline

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | ProjectionPipeline | NOT IMPLEMENTED | ❌ Missing |
| Location | runtime/kernel/projection/projection-pipeline.ts | N/A | ❌ Missing |
| Category | Runtime | N/A | ❌ Missing |
| Public APIs | project(), registerSink() | N/A | ❌ Missing |
| Violations | 0 | 1 (missing implementation) | ❌ Missing |

**Status:** ❌ Missing implementation

**Issue:** Implementation does not exist

**Expected:** ProjectionPipeline that owns projection orchestration

**Current:** Not yet created

**Severity:** 🔵 Requires Inspection

**Action Required:** Implement before removing Git dependencies (Phase 0.6)

---

### Git Projection

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | GitProjection | GitProjection | ✅ Match |
| Location | constitutional-compiler/git/git-infrastructure.ts | constitutional-compiler/git/git-infrastructure.ts | ✅ Match |
| Category | Projection | Projection | ✅ Match |
| Public APIs | projectToGit() | projectToGit() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

### Infrastructure

| Property | Frozen Map | Inventory | Status |
|----------|------------|-----------|--------|
| Owner | GatewayAuthority | GatewayAuthority | ✅ Match |
| Location | src/lib/gateway.ts (crx-ui-next) | src/lib/gateway.ts (crx-ui-next) | ✅ Match |
| Category | Infrastructure | Infrastructure | ✅ Match |
| Public APIs | resolveGateway() | resolveGateway() | ✅ Match |
| Violations | 0 | 0 | ✅ Match |

**Status:** ✅ No drift

---

## Additional Drift (Not in Frozen Map)

### RuntimeContainer event_store_factory smell

**Location:** runtime/di_container.py
**Issue:** Lambda returning lambda (hidden service locator pattern)
**Expected:** RuntimeContainer owns SessionFactory → RepositoryFactory → EventStore(session)
**Current:** event_store_factory = lambda: lambda session: EventStore(session)
**Severity:** P2 Drift
**Action Required:** Refactor factory hierarchy (flagged for Phase 5)

---

### ReplayKernel imports PostgreSQL directly

**Location:** runtime/replay/replay_kernel.py
**Issue:** Imports storage.postgres.database, storage.postgres.models directly
**Expected:** Should depend on EventReader only
**Current:** Coupled to one persistence implementation
**Severity:** P1 Runtime Failure
**Action Required:** Inject EventReader from RuntimeContainer (flagged for Phase 5)

---

## Implementation Backlog (Prioritized)

### P1 (Immediate Attention)
1. Refactor ReplayKernel to ReplayVerifier (consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority)
2. Harvest CanonicalAuthority into separate authorities (CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService)
3. Implement ProjectionPipeline before removing Git dependencies
4. Inject EventReader into ReplayKernel instead of PostgreSQL direct import

### P2 (Can Be Deferred)
5. Refactor RuntimeContainer to eliminate global singleton
6. Refactor RuntimeContainer event_store_factory hierarchy

---

## Acceptance Criteria Status

- [x] Compare generated inventory against frozen constitutional map
- [x] Identify drift per authority
- [x] Document violations
- [x] Document additional drift
- [x] Create prioritized implementation backlog

---

## Disposition

**Finding:** Inventory diff vs constitutional map completed
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** P1 (violations identified)
**Evidence:** Comparison of generated inventory against frozen constitutional map
**Action:** Proceed with Phase 0.3 - Freeze interfaces

---

**Status:** Phase 0.2 Complete
**Next Step:** Phase 0.3 - Freeze interfaces
