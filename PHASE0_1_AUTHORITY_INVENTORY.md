# Phase 0.1 - Authority Inventory Generation

**Objective:** Generate authority inventory from codebase to compare against frozen constitutional map

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

## Authority Inventory (Generated from Codebase)

### Execution

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Execution | ExecutionEngine | runtime/kernel/execution/execution-engine.ts | execute() | 0 | ✅ Verified |

### Events

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Events | ExecutionEventBus | runtime/kernel/execution/execution-event-bus.ts | publish(), subscribe(), getEvents() | 0 | ✅ Verified |

### Replay

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Replay | DeterministicReplayEngine | runtime/kernel/replay/deterministic_replay_engine.ts | replay() | 0 | ✅ Verified |
| Replay (Auxiliary) | ReplayKernel | runtime/replay/replay_kernel.py | replay_events() | 1 (violates authority map) | ✅ Verified |

### Knowledge

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Knowledge | KnowledgeAuthority | runtime/kernel/knowledge/knowledge-authority.ts | mutateGraph(), queryGraph() | 0 | ✅ Verified |

### Identity

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Identity | CanonicalIdentityService | runtime/kernel/identity/canonical-identity-service.ts | generateIdentity(), resolveIdentity() | 0 | ✅ Verified |

### Witness

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Witness | WitnessAuthority | runtime/kernel/replay/witness_authority.ts | generateWitness(), verifyWitness() | 0 | ✅ Verified |

### Canonical Hash

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Canonical Hash | CanonicalHashAuthority | runtime/kernel/replay/canonical_hash_authority.ts | generateHash(), verifyHash() | 0 | ✅ Verified |
| Canonical Hash (Monolithic) | CanonicalAuthority | constitution/authority/canonical.py | serialize_to_canonical_bytes(), hash_canonical_bytes() | 1 (violates authority map) | ✅ Verified |

### Provider Lifetime

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Provider Lifetime | RuntimeContainer | runtime/di_container.py | create(), shutdown() | 1 (global singleton) | ✅ Verified |

### Provider Resolution

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Provider Resolution | ProviderRegistry | runtime/kernel/providers/provider-registry.ts | registerProvider(), resolveProvider(), getProviders() | 0 | ✅ Verified |

### Bootstrap

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Bootstrap | RuntimeBootstrap | runtime/bootstrap.py | bootstrap() | 0 | ✅ Verified |

### Projection Pipeline

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Projection Pipeline | ProjectionPipeline | NOT IMPLEMENTED | N/A | 1 (missing implementation) | 🔵 Requires Inspection |

### Git Projection

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Git Projection | GitProjection | constitutional-compiler/git/git-infrastructure.ts | projectToGit() | 0 | ✅ Verified |

### Infrastructure

| Authority | Owner | Implementation | Public APIs | Violations | Status |
|-----------|-------|---------------|-------------|------------|--------|
| Infrastructure | GatewayAuthority | src/lib/gateway.ts (crx-ui-next) | resolveGateway() | 0 | ✅ Verified |

---

## Violations Summary

### P1 Runtime Failures

1. **ReplayKernel violates authority map**
   - **Location:** runtime/replay/replay_kernel.py
   - **Issue:** Implements constitutional logic (event loading, canonical serialization, hash verification, witness generation, fingerprint generation) instead of acting as auxiliary verifier
   - **Expected:** Should consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority
   - **Current:** Owns constitutional logic directly
   - **Action Required:** Refactor to ReplayVerifier that consumes constitutional authorities

2. **CanonicalAuthority monolithic**
   - **Location:** constitution/authority/canonical.py
   - **Issue:** Monolithic god-object that owns serialize_to_canonical_bytes(), hash_canonical_bytes()
   - **Expected:** Should be split into CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService
   - **Current:** Single object owns all canonical operations
   - **Action Required:** Harvest into separate authorities

### P2 Drift

3. **RuntimeContainer global singleton**
   - **Location:** runtime/di_container.py
   - **Issue:** Global _container instance with get_container() function
   - **Expected:** RuntimeBootstrap → RuntimeContainer → Application without module globals
   - **Current:** Module-level singleton pattern
   - **Action Required:** Refactor to eliminate global state (acceptable for now as composition root)

4. **RuntimeContainer event_store_factory smell**
   - **Location:** runtime/di_container.py
   - **Issue:** Lambda returning lambda (hidden service locator pattern)
   - **Expected:** RuntimeContainer owns SessionFactory → RepositoryFactory → EventStore(session)
   - **Current:** event_store_factory = lambda: lambda session: EventStore(session)
   - **Action Required:** Refactor factory hierarchy (flagged for Phase 5)

### P1 Runtime Failures

5. **ReplayKernel imports PostgreSQL directly**
   - **Location:** runtime/replay/replay_kernel.py
   - **Issue:** Imports storage.postgres.database, storage.postgres.models directly
   - **Expected:** Should depend on EventReader only
   - **Current:** Coupled to one persistence implementation
   - **Action Required:** Inject EventReader from RuntimeContainer (flagged for Phase 5)

### 🔵 Requires Inspection

6. **ProjectionPipeline not implemented**
   - **Location:** runtime/kernel/projection/projection-pipeline.ts
   - **Issue:** Implementation does not exist
   - **Expected:** ProjectionPipeline that owns projection orchestration
   - **Current:** Not yet created
   - **Action Required:** Implement before removing Git dependencies (Phase 0.6)

---

## Diff vs Frozen Constitutional Map

### Authorities in Map but Not in Inventory
- None

### Authorities in Inventory but Not in Map
- None

### Authorities with Violations
1. Replay (Auxiliary) - ReplayKernel violates authority map
2. Canonical Hash (Monolithic) - CanonicalAuthority violates authority map
3. Provider Lifetime - RuntimeContainer global singleton
4. Projection Pipeline - Not implemented

### Authorities with Drift
1. Provider Lifetime - event_store_factory smell
2. Replay (Auxiliary) - PostgreSQL direct import

---

## Implementation Backlog

### P1 (Immediate Attention)
1. Refactor ReplayKernel to ReplayVerifier (consume DeterministicReplayEngine, WitnessAuthority, CanonicalHashAuthority)
2. Harvest CanonicalAuthority into separate authorities (CanonicalHashAuthority, WitnessAuthority, CanonicalIdentityService)
3. Implement ProjectionPipeline before removing Git dependencies

### P2 (Can Be Deferred)
4. Refactor RuntimeContainer to eliminate global singleton
5. Refactor RuntimeContainer event_store_factory hierarchy
6. Inject EventReader into ReplayKernel instead of PostgreSQL direct import

---

## Acceptance Criteria Status

- [x] Generate authority inventory from codebase
- [x] Document public APIs for each authority
- [x] Document violations
- [x] Diff inventory against frozen constitutional map
- [x] Create implementation backlog

---

## Disposition

**Finding:** Authority inventory generated from codebase
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** P1 (violations identified)
**Evidence:** Source inspection of all authority implementations
**Action:** Proceed with Phase 0.2 - Diff inventory vs constitutional map

---

**Status:** Phase 0.1 Complete
**Next Step:** Phase 0.2 - Diff inventory vs constitutional map
