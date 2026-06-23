# PING Runtime Constitutional Sovereignty Refactor Directive

**Refactor Date:** 2026-06-18  
**Refactor Mode:** PING RUNTIME KERNEL CONSTITUTIONAL SOVEREIGNTY  
**Refactor Principle:** Refactor PING Runtime kernel to enforce constitutional authority separation, deterministic replay closure, identity continuity correctness, and structural sovereignty.

---

## CRITICAL DECISION POINT

### ClaimIdentity Constitutional Primitive

**Before implementing any patch:**

Determine whether **ClaimIdentity** is a constitutional primitive distinct from **EventId** and **ArtifactId**.

### Current Runtime Contains

- EventId
- ArtifactId

### Identity Continuity Specification Introduces

- canonical_id
- supersedes
- descendant
- replacement
- fork

### Decision Required

**If ClaimIdentity becomes a constitutional primitive:**
- redesign IdentityAuthority first
- then apply remaining patches

**Do not proceed with identity refactors until this decision is made.**

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Refactor PING Runtime kernel to enforce constitutional authority separation, deterministic replay closure, identity continuity correctness, and structural sovereignty.

**FINAL DETERMINATION:** 11 phases required to achieve constitutional kernel sovereignty.

**KEY FINDINGS:**
- Current: PING Runtime has mixed namespaces (artifact IDs in event lineage, event IDs in artifact lineage)
- Current: PING Runtime has raw strings for constitutional identifiers
- Current: PING Runtime has runtime-derived failures (throw new Error)
- Current: PING Runtime has scattered lineage logic
- Current: PING Runtime has state authoritative, event derived
- Current: PING Runtime has controllers performing constitutional work
- Current: PING Runtime has mixed identity authority (canonicalization + hashing + identity derivation)
- Current: PING Runtime has authority overlap (hash creation + certificate certification)
- Current: PING Runtime has direct persistence access
- Current: PING Runtime has direct construction (new Brain, new Worker, new Engine)
- Target: PING Runtime enforces strict authority separation (11 constitutional authorities)
- Target: PING Runtime converges deterministically (same event history, lineage graph, replay ordering, replay state, canonical bytes, canonical hash, witness root, replay certificate)
- Target: PING Runtime has no authority overlap

---

## PHASE 1 — NAMESPACE SOVEREIGNTY

### Patch F

### Current Implementation

```typescript
parent_event_ids
```

**contains:**
- artifact IDs
- event IDs

**depending on context.**

### Target Implementation

**Repair ReplayStateMachine namespace boundaries.**

**Enforce:**
```typescript
parent_event_ids: EventId[]
```

**only.**

**Remove mixed namespaces.**

### Constitutional Rule

```text
Replay must never contain:

* artifact ids in event lineage
* event ids in artifact lineage
```

### Implementation

**LineageAuthority derives artifact lineage during replay.**

**Remove:**
```typescript
if (parentId.startsWith("evt-"))
```

**style namespace switching.**

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**LOW** - Namespace hardening

---

## PHASE 2 — CONSTITUTIONAL TYPE HARDENING

### Patch J

### Current Implementation

**Raw strings for constitutional identifiers.**

### Target Implementation

**Enforce branded identifiers everywhere.**

**Replace raw strings with:**
- EventId
- ArtifactId
- WitnessLeafId

### Required

```typescript
event_id: EventId

artifact_id: ArtifactId

parent_event_ids: EventId[]

artifact_lineage: ArtifactId[]
```

### Constitutional Rule

```text
No constitutional identifier may exist as string.
```

### File Location

`PING/runtime/replay/canonical_event_envelope.ts`

### Risk

**LOW** - Type hardening

---

## PHASE 3 — DETERMINISTIC FAILURE CLOSURE

### Patch H

### Current Implementation

```typescript
throw new Error(...)
```

**throughout kernel.**

### Target Implementation

**Remove:**
```typescript
throw new Error(...)
```

**Replace with:**
```typescript
DeterministicFailureFactory.toError(...)
```

**only.**

### Constitutional Rule

```text
No runtime-derived failures.
No infrastructure-derived failures.
No environment-derived failures.
Replay failures must be deterministic.
```

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**LOW** - Error handling standardization

---

## PHASE 4 — LINEAGE AUTHORITY

### Patch C

### Current Implementation

```typescript
storeLineage
validateLineage
GraphValidator
ReplayStateMachine
```

**Lineage logic is scattered.**

### Target Implementation

**Create:**
```typescript
LineageAuthority
```

**Responsible for:**
```typescript
deriveLineage(...)
validateLineage(...)
detectCycles(...)
buildAncestorGraph(...)
traceContinuityPath(...)
determineContinuityType(...)
computeContinuityDistance(...)
```

### Implementation

**Move logic from:**
- storeLineage
- validateLineage
- GraphValidator
- ReplayStateMachine

**into LineageAuthority.**

### Constitutional Rule

```text
No lineage logic may exist elsewhere.
```

### File Location

`PING/runtime/replay/lineage_authority.ts` (new file)

### Risk

**LOW** - Lineage logic consolidation

---

## PHASE 5 — EVENTSTORE SOVEREIGNTY

### Patch E

### Current Architecture

```text
state authoritative
event derived
```

### Target Implementation

**Replace with:**
```text
event authoritative
state projected
```

### Implementation

**Remove:**
```typescript
logEvent(...)
```

**Replace:**
```typescript
eventStore.append(...)
```

### Constitutional Rule

```text
EventStore becomes constitutional source of truth.
Logs become projections.
```

### File Location

`PING/runtime/kernel/commit-service/src/api/commit_controller.ts`

### Risk

**MEDIUM** - Event logging refactoring

---

## PHASE 6 — COMMITSERVICE SOVEREIGNTY

### Patch A

### Current Implementation

**Controller performs constitutional work:**
```typescript
computeCanonicalHash(...)
validateLineage(...)
storeArtifact(...)
storeLineage(...)
logEvent(...)
```

### Target Implementation

**Controller must become thin.**

**Remove:**
```typescript
computeCanonicalHash(...)
validateLineage(...)
storeArtifact(...)
storeLineage(...)
logEvent(...)
```

**from controllers.**

### Target Architecture

```text
HTTP
→ CommitService
→ AuthorizationAuthority
→ CanonicalAuthority
→ IdentityAuthority
→ LineageAuthority
→ EventStore
```

### Constitutional Rule

```text
Controllers perform no constitutional work.
```

### File Location

`PING/runtime/kernel/commit-service/src/api/commit_controller.ts`

### Risk

**MEDIUM** - Core commit path refactoring

---

## PHASE 7 — IDENTITY AUTHORITY SEPARATION

### Patch B

### Current Implementation

```typescript
computeCanonicalHash(...)
```

**mixes:**
- canonicalization
- hashing
- identity derivation

### Target Implementation

**Split authority.**

**Create:**
```typescript
CanonicalAuthority
CanonicalHashAuthority
IdentityAuthority
```

### Implementation

**IdentityAuthority must own:**
```text
canonical bytes
→ canonical hash
→ artifact id
```

### Constitutional Rule

```text
Do not expose:

deriveArtifactId(hash)

directly.

IdentityAuthority must prevent hash bypasses.
```

### File Location

`PING/runtime/replay/canonical_hash_authority.ts`

### Risk

**LOW** - Authority separation

---

## PHASE 8 — CERTIFICATE SOVEREIGNTY

### Patch G

### Current Implementation

```typescript
WitnessAuthority
  → CanonicalHashAuthority
  → CertificateAuthority
```

**Potential constitutional overlap.**

### Target Implementation

**Separate:**
```typescript
CanonicalHashAuthority
CertificateAuthority
WitnessAuthority
```

### Implementation

**HashAuthority:**
```text
hash creation only
```

**CertificateAuthority:**
```text
certificate derivation only
```

**WitnessAuthority:**
```text
witness construction only
```

### Constitutional Rule

```text
No authority may both:

create hash
and
certify hash

without explicit delegation.
```

### File Location

`PING/runtime/replay/witness_authority.ts`

### Risk

**LOW** - Authority separation

---

## PHASE 9 — PROJECTION SOVEREIGNTY

### Current Implementation

**No explicit projection layer.**

### Target Implementation

**Create explicit projection layer.**

### Target Architecture

```text
Application
→ CommitService
→ EventStore
→ Projection Runtime
→ PersistenceAuthority
```

### Constitutional Rule

```text
State becomes replayable projection.
Persistence becomes implementation detail.
```

### File Location

`PING/runtime/projections/` (new directory)

### Risk

**MEDIUM** - Projection layer creation

---

## PHASE 10 — PERSISTENCE FIREWALL

### Patch D

### Current Implementation

**Direct persistence access:**
```typescript
pool.query(...)
postgres writes
sqlite writes
filesystem writes
```

### Target Implementation

**Remove direct:**
```typescript
pool.query(...)
postgres writes
sqlite writes
filesystem writes
```

**from application modules.**

### Implementation

**All persistence flows through:**
```typescript
PersistenceAuthority.write(...)
```

**only.**

### Constitutional Rule

```text
No controller, service, replay component, or authority may write directly.
```

### File Location

`PING/runtime/kernel/commit-service/src/persistence/artifact_store.ts`

### Risk

**HIGH** - Persistence layer refactoring

---

## PHASE 11 — RUNTIME AUTHORITY

### Patch I

### Current Implementation

**Direct construction:**
```typescript
new Brain(...)
new Worker(...)
new Engine(...)
```

### Target Implementation

**Remove direct construction.**

**Replace with:**
```typescript
RuntimeAuthority.createBrain(...)
RuntimeAuthority.createWorker(...)
RuntimeAuthority.createEngine(...)
```

### Constitutional Rule

```text
Constructors lose constitutional authority.
RuntimeAuthority becomes sole runtime construction boundary.
```

### Implementation

**Search:**
```bash
rg -n "new .*Brain|new .*Worker|new .*Engine"
```

### File Location

Application entry points (worker.py, main.ts, etc.)

### Risk

**HIGH** - Runtime construction refactoring

---

## REQUIRED END STATE

### Convergence Requirements

**The runtime must converge to:**
```text
same event history
→ same lineage graph
→ same replay ordering
→ same replay state
→ same canonical bytes
→ same canonical hash
→ same witness root
→ same replay certificate
```

**independent of:**
- OS
- runtime
- database ordering
- insertion ordering
- locale
- Unicode composition
- clock time
- process state
- platform behavior

---

## CONSTITUTIONAL AUTHORITIES REQUIRED

### 11 Constitutional Authorities

1. **AuthorizationAuthority**
2. **CanonicalAuthority**
3. **CanonicalHashAuthority**
4. **IdentityAuthority**
5. **LineageAuthority**
6. **EventStore**
7. **ProjectionRuntime**
8. **PersistenceAuthority**
9. **WitnessAuthority**
10. **CertificateAuthority**
11. **RuntimeAuthority**

### Constitutional Rule

```text
No authority may own responsibilities belonging to another authority.
Authority overlap is a constitutional violation.
```

---

## CONSOLIDATED IMPLEMENTATION ORDER

| Step | Phase | Work | Risk | Dependency |
| ---- | ----- | ---- | ---- | ---------- |
| 0 | **CRITICAL DECISION** | Determine ClaimIdentity constitutional primitive | **BLOCKER** | **Must decide before identity refactors** |
| 1 | Phase 1 | Namespace Sovereignty | Low | None |
| 2 | Phase 2 | Constitutional Type Hardening | Low | Phase 1 |
| 3 | Phase 3 | Deterministic Failure Closure | Low | None |
| 4 | Phase 4 | Lineage Authority | Low | Phase 1, Phase 2 |
| 5 | Phase 5 | EventStore Sovereignty | Medium | Phase 3 |
| 6 | Phase 6 | CommitService Sovereignty | Medium | Phase 4, Phase 5 |
| 7 | Phase 7 | Identity Authority Separation | Low | **CRITICAL DECISION** |
| 8 | Phase 8 | Certificate Sovereignty | Low | Phase 7 |
| 9 | Phase 9 | Projection Sovereignty | Medium | Phase 5, Phase 6 |
| 10 | Phase 10 | Persistence Firewall | High | Phase 9 |
| 11 | Phase 11 | Runtime Authority | High | Phase 10 |

---

## FINAL DETERMINATION

### Current PING Runtime State

```text
PING Runtime has mixed responsibilities:
- mixed namespaces (artifact IDs in event lineage, event IDs in artifact lineage)
- raw strings for constitutional identifiers
- runtime-derived failures (throw new Error)
- scattered lineage logic
- state authoritative, event derived
- controllers performing constitutional work
- mixed identity authority (canonicalization + hashing + identity derivation)
- authority overlap (hash creation + certificate certification)
- direct persistence access
- direct construction (new Brain, new Worker, new Engine)
```

### Target PING Runtime State

```text
PING Runtime enforces strict authority separation:
- 11 constitutional authorities (no overlap)
- branded identifiers only (EventId, ArtifactId, WitnessLeafId)
- deterministic failures only (DeterministicFailureFactory)
- single LineageAuthority (no scattered logic)
- event authoritative, state projected
- controllers thin (no constitutional work)
- separate identity authorities (CanonicalAuthority, CanonicalHashAuthority, IdentityAuthority)
- separate certificate authorities (CanonicalHashAuthority, CertificateAuthority, WitnessAuthority)
- explicit projection layer
- persistence firewall (PersistenceAuthority only)
- runtime construction authority (RuntimeAuthority only)
- deterministic convergence (same event history, lineage graph, replay ordering, replay state, canonical bytes, canonical hash, witness root, replay certificate)
```

### Minimum Implementation

**11 phases + 1 critical decision = 12 implementation steps**

**Estimated engineering hours:** 30-40 hours (PING Runtime kernel refactoring)

**Result:** PING Runtime kernel enforces constitutional authority separation, deterministic replay closure, identity continuity correctness, and structural sovereignty.

---

## CONCLUSION

This constitutional sovereignty refactor transforms PING Runtime from mixed-responsibility implementation to strict constitutional authority separation by:

1. **Critical Decision** - Determine ClaimIdentity constitutional primitive before identity refactors
2. **Namespace Sovereignty** (Phase 1) - parent_event_ids contains EventId[] only
3. **Constitutional Type Hardening** (Phase 2) - branded identifiers only
4. **Deterministic Failure Closure** (Phase 3) - DeterministicFailureFactory only
5. **Lineage Authority** (Phase 4) - single LineageAuthority with continuity methods
6. **EventStore Sovereignty** (Phase 5) - event authoritative, state projected
7. **CommitService Sovereignty** (Phase 6) - controllers thin, no constitutional work
8. **Identity Authority Separation** (Phase 7) - separate canonicalization, hashing, identity derivation
9. **Certificate Sovereignty** (Phase 8) - separate hash, certificate, witness authorities
10. **Projection Sovereignty** (Phase 9) - explicit projection layer
11. **Persistence Firewall** (Phase 10) - PersistenceAuthority only
12. **Runtime Authority** (Phase 11) - RuntimeAuthority only

**At that point PING Runtime kernel enforces constitutional authority separation, deterministic replay closure, identity continuity correctness, and structural sovereignty.**
