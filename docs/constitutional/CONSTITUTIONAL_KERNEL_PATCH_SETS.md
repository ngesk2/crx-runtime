# Constitutional Kernel Patch Sets

**Patch Date:** 2026-06-18  
**Patch Mode:** PING RUNTIME KERNEL REFACTORING  
**Patch Principle:** Refactor PING Runtime kernel to enforce constitutional authority separation and structural sovereignty.

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Refactor PING Runtime kernel to enforce constitutional authority separation, remove mixed responsibilities, and harden constitutional enforcement.

**FINAL DETERMINATION:** 10 patch sets required to achieve constitutional kernel sovereignty.

**KEY FINDINGS:**
- Current: PING Runtime has mixed responsibilities (canonicalization + hashing + identity derivation in one function)
- Current: PING Runtime has scattered lineage logic (storeLineage, validateLineage, GraphValidator)
- Current: PING Runtime has direct persistence calls (pool.query, sqlite, postgres)
- Current: PING Runtime has mixed namespaces (parent_event_ids contains artifact IDs or event IDs)
- Current: PING Runtime has side-channel audit logs (logEvent)
- Target: PING Runtime enforces strict authority separation (CanonicalAuthority, CanonicalHashAuthority, IdentityAuthority, LineageAuthority, PersistenceAuthority, EventStore)
- Target: PING Runtime uses branded types only (EventId, ArtifactId)
- Target: PING Runtime uses deterministic failures only (DeterministicFailureFactory)

---

## PATCH SET A — COMMITARTIFACT() CONTROLLER

### Current Implementation

```typescript
artifactId = computeCanonicalHash(artifact)

validateLineage(...)

storeArtifact(...)
storeLineage(...)
logEvent(...)
```

### Target Implementation

```text
HTTP
 → CommitService
      → AuthorizationAuthority
      → CanonicalAuthority
      → IdentityAuthority
      → LineageAuthority
      → EventStore
```

### Refactor

**Replace:**
```typescript
artifactId = computeCanonicalHash(artifact)
validateLineage(...)
storeArtifact(...)
storeLineage(...)
logEvent(...)
```

**With:**
```typescript
await commitService.commit({
  type: "artifact_commit",
  payload: artifact,
  lineage
})
```

### Controller Loses

- computeCanonicalHash
- validateLineage
- storeArtifact
- storeLineage
- logEvent

**entirely.**

### File Location

`PING/runtime/kernel/commit-service/src/api/commit_controller.ts`

### Risk

**MEDIUM** - Core commit path refactoring

---

## PATCH SET B — IDENTITY ENGINE SPLIT

### Current Implementation

`computeCanonicalHash(...)` appears to perform:

- canonicalization
- hashing
- identity derivation

**all together.**

### Target Implementation

**Split into:**

```typescript
CanonicalAuthority
  canonicalize(...)

CanonicalHashAuthority
  hash(...)

IdentityAuthority
  deriveArtifactId(...)
```

### Refactor

**Replace:**
```typescript
artifactId = computeCanonicalHash(artifact)
```

**With:**
```typescript
const canonical =
    canonicalAuthority.canonicalize(payload)

const hash =
    canonicalHashAuthority.hash(canonical)

const artifactId =
    identityAuthority.deriveArtifactId(hash)
```

### File Location

`PING/runtime/replay/canonical_hash_authority.ts`

### Risk

**LOW** - Authority separation, no functional change

---

## PATCH SET C — LINEAGE AUTHORITY

### Current Implementation

```typescript
storeLineage(...)
validateLineage(...)
GraphValidator(...)
```

**Lineage logic is scattered.**

### Target Implementation

**Create:**

```typescript
LineageAuthority

responsible for:

deriveLineage(...)
validateLineage(...)
detectCycles(...)
buildAncestorGraph(...)
```

### Refactor

**Replace scattered lineage logic with:**

```typescript
CommitService
    → LineageAuthority

only.
```

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**LOW** - Lineage logic consolidation

---

## PATCH SET D — PERSISTENCE FIREWALL

### Current Implementation

```typescript
storeArtifact(...)
storeLineage(...)
```

**direct persistence calls.**

### Target Implementation

**Replace with:**

```typescript
PersistenceAuthority.write(...)
```

**And remove:**

```typescript
pool.query(...)
sqlite...
postgres...
```

**from application-facing modules.**

### Target Architecture

```text
Application
 → CommitService
 → Projection Runtime
 → PersistenceAuthority
```

### File Location

`PING/runtime/kernel/commit-service/src/persistence/artifact_store.ts`

### Risk

**HIGH** - Persistence layer refactoring

---

## PATCH SET E — EVENTSTORE SOVEREIGNTY

### Current Implementation

```typescript
logEvent(...)
```

**looks like a side-channel audit log.**

### Target Implementation

**Replace:**

```typescript
logEvent(...)
```

**With:**

```typescript
eventStore.append(...)
```

### Constitutional Rule

```text
EventStore
is authoritative

Logs are derived
```

### File Location

`PING/runtime/kernel/commit-service/src/api/commit_controller.ts`

### Risk

**MEDIUM** - Event logging refactoring

---

## PATCH SET F — REPLAYSTATEMACHINE NAMESPACE REPAIR

### Current Implementation

```typescript
parent_event_ids
```

**contains:**

- artifact IDs
- or
- event IDs

**depending on context.**

### Target Implementation

**Harden further:**

```typescript
CanonicalEventEnvelope

stores:

parent_event_ids: EventId[]

only.
```

**Then:**

```typescript
LineageAuthority

derives:

artifact lineage

during replay.
```

**This removes mixed namespaces permanently.**

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**LOW** - Namespace hardening

---

## PATCH SET G — WITNESS AUTHORITY SEPARATION

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
    hashing only

CertificateAuthority
    commitments only

WitnessAuthority
    witness construction only
```

### Constitutional Rule

```text
No authority should both:

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

## PATCH SET H — DETERMINISTIC FAILURE AUTHORITY

### Current Implementation

```typescript
throw new Error(...)
```

**still appears in:**

```typescript
validateLineage(...)
```

### Target Implementation

**Replace:**

```typescript
throw new Error(...)
```

**With:**

```typescript
throw DeterministicFailureFactory.toError(...)
```

**everywhere.**

### Constitutional Rule

```text
No runtime-derived failures.
```

### File Location

`PING/runtime/replay/replay_state_machine.ts`

### Risk

**LOW** - Error handling standardization

---

## PATCH SET I — RUNTIME CONSTRUCTION AUTHORITY

### Current Implementation

**Search:**
```bash
rg -n "new .*Brain|new .*Worker|new .*Engine"
```

### Target Implementation

**Replace:**

```typescript
new NewsletterBrain(...)
```

**With:**

```typescript
runtime.createNewsletterBrain(...)
```

**This moves authority to:**

```typescript
RuntimeAuthority
```

**instead of constructors.**

### Search Pattern

```bash
rg -n "new .*Brain|new .*Worker|new .*Engine"
```

### File Location

Application entry points (worker.py, main.ts, etc.)

### Risk

**HIGH** - Runtime construction refactoring

---

## PATCH SET J — EVENT ENVELOPE HARDENING

### Current Implementation

**Inspect and likely patch:**

```typescript
canonical_event_envelope.ts
```

### Target Implementation

**Enforce:**

```typescript
event_id: EventId
parent_event_ids: EventId[]
artifact_id: ArtifactId
```

**using branded types only.**

**No raw strings.**

### Constitutional Rule

```text
All constitutional identifiers must use branded types.
```

### File Location

`PING/runtime/replay/canonical_event_envelope.ts`

### Risk

**LOW** - Type hardening

---

## CONSOLIDATED IMPLEMENTATION ORDER

| Step | Patch Set | Work | Risk |
| ---- | --------- | ---- | ---- |
| 1 | B | Identity Engine Split | Low |
| 2 | C | Lineage Authority | Low |
| 3 | F | ReplayStateMachine Namespace Repair | Low |
| 4 | G | Witness Authority Separation | Low |
| 5 | H | Deterministic Failure Authority | Low |
| 6 | J | Event Envelope Hardening | Low |
| 7 | A | commitArtifact() Controller | Medium |
| 8 | E | EventStore Sovereignty | Medium |
| 9 | D | Persistence Firewall | High |
| 10 | I | Runtime Construction Authority | High |

---

## FINAL DETERMINATION

### Current PING Runtime State

```text
PING Runtime has mixed responsibilities:
- canonicalization + hashing + identity derivation in one function
- scattered lineage logic
- direct persistence calls
- mixed namespaces (artifact IDs and event IDs in parent_event_ids)
- side-channel audit logs
- raw strings for constitutional identifiers
- runtime-derived failures (throw new Error)
```

### Target PING Runtime State

```text
PING Runtime enforces strict authority separation:
- CanonicalAuthority: canonicalization only
- CanonicalHashAuthority: hashing only
- IdentityAuthority: identity derivation only
- LineageAuthority: lineage logic only
- PersistenceAuthority: persistence only
- EventStore: authoritative event storage only
- Branded types only (EventId, ArtifactId)
- Deterministic failures only (DeterministicFailureFactory)
- Runtime construction authority only (RuntimeAuthority)
```

### Minimum Implementation

**10 patch sets = 10 implementation steps**

**Estimated engineering hours:** 20-30 hours (PING Runtime kernel refactoring)

**Result:** PING Runtime kernel enforces constitutional authority separation and structural sovereignty.

---

## CONCLUSION

These 10 patch sets transform PING Runtime from mixed-responsibility implementation to strict constitutional authority separation by:

1. **Splitting identity engine** (Patch Set B) - separate canonicalization, hashing, identity derivation
2. **Consolidating lineage logic** (Patch Set C) - single LineageAuthority
3. **Repairing namespace** (Patch Set F) - parent_event_ids contains EventId[] only
4. **Separating witness authority** (Patch Set G) - separate hashing, commitments, witness construction
5. **Standardizing failures** (Patch Set H) - DeterministicFailureFactory only
6. **Hardening event envelope** (Patch Set J) - branded types only
7. **Refactoring commit controller** (Patch Set A) - CommitService pipeline only
8. **Establishing EventStore sovereignty** (Patch Set E) - eventStore.append only
9. **Implementing persistence firewall** (Patch Set D) - PersistenceAuthority only
10. **Enforcing runtime construction authority** (Patch Set I) - RuntimeAuthority only

**At that point PING Runtime kernel enforces constitutional authority separation and structural sovereignty.**
