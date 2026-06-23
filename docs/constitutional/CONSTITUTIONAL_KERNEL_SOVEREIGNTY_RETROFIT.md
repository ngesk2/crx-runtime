# Constitutional Kernel Sovereignty Retrofit

**Retrofit Date:** 2026-06-18  
**Retrofit Mode:** STRUCTURAL ENFORCEMENT (NOT DEVELOPER ENFORCEMENT)  
**Retrofit Principle:** Transform PING from "constitutional infrastructure exists" to "constitutional authority is mandatory."

---

## EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:** Make PING constitutionally sovereign by structurally enforcing that no authoritative object can be created, mutated, identified, hashed, linked, persisted, or witnessed without passing through the PING Constitutional Kernel.

**FINAL DETERMINATION:** 7 patches + 10 phases required to achieve structural sovereignty enforcement.

**KEY FINDINGS:**
- Current: Applications bypass PING authority through direct SQLite, direct hashing, direct identity generation
- Target: Applications must pass through PING Constitutional Kernel for all authoritative operations
- Implementation: 7 patches (low to high risk) + 10 phases (runtime construction to sovereignty scorecard)
- Result: Sovereignty becomes structurally enforced rather than developer-enforced

---

## CONSTITUTIONAL KERNEL DEFINITION

### Kernel Components

```text
PING Constitutional Kernel
│
├── IdentityAuthority
├── LineageAuthority
├── CanonicalAuthority
├── AuthorizationAuthority
├── CommitService
├── EventStore
├── ReplayEngine
├── PersistenceAuthority
└── WitnessAuthority
```

### Constitutional Rule

**Everything else becomes a plugin:**

```text
Applications
Workers
Brains
Agents
Digestion
Newsletter
Search
Archives
Indexes

↓

Kernel
```

### Sovereignty Definition

A system is sovereign when:

```text
No authoritative object
can be created,
mutated,
identified,
hashed,
linked,
persisted,
or witnessed

without passing through

PING Constitutional Kernel.
```

---

## PATCH 1 — MANDATORY IDENTITY AUTHORITY

### Current Failure

```text
Application
→ generates identity
→ persists
```

### Target

```text
Application
→ PING IdentityAuthority
→ receives identity
→ persists
```

### Implementation

**Create:**

```typescript
// ping/runtime/identity/IdentityAuthority.ts

export interface IdentityAuthority {
  allocateArtifactId(): string;
  allocateEventId(): string;
  allocateLineageId(): string;
}
```

**Replace:**

**Search:**
```bash
rg -n "uuid|uuid4|randomUUID|message_id|artifact_id|event_id|document_id"
```

**Replace all generators with:**
```typescript
identityAuthority.allocateArtifactId()
```

---

## PATCH 2 — EVENT FIRST ENFORCEMENT

### Current

```typescript
saveArticle()
{
    sqlite.insert(...)
    emitArticleCreated(...)
}
```

### Target

```typescript
saveArticle()
{
    const event =
        commitService.commit(
            ArticleCreated(...)
        );

    projection.apply(event);
}
```

### Constitutional Rule

**Remove:**
```typescript
sqlite.insert(...)
```

**from application code.**

**Application code should never mutate persistence.**

---

## PATCH 3 — COMMITSERVICE OWNERSHIP

### Current Audit Result

10 direct persistence bypasses

### Implementation

**Create:**

```typescript
interface CommitService {
   commit(event: DomainEvent): CommitResult;
}
```

**All mutations become:**
```typescript
commitService.commit(...)
```

**Only.**

**Search:**
```bash
rg -n \
"INSERT INTO|UPDATE |DELETE FROM|open\(|write\(|save_|archive_"
```

**Every result becomes a CommitService call.**

---

## PATCH 4 — PROJECTION SEPARATION

### Current

```text
Business Logic
→ SQLite
```

### Target

```text
Business Logic
→ Event
→ Projection
→ SQLite
```

### New Layout

```text
runtime/
  events/

  commit/

  projections/

  replay/
```

**SQLite becomes projection storage only.**

**Never authoritative storage.**

---

## PATCH 5 — REPLAY RECONSTRUCTION TEST

### Implementation

**Add mandatory constitutional test:**

```typescript
it("reconstructs state from events")
{
   const events = loadEventStream();

   const stateA =
       replay(events);

   const stateB =
       currentDatabaseProjection();

   expect(stateA).toEqual(stateB);
}
```

**If this fails:**
```text
constitutional violation
```

---

## PATCH 6 — RUNTIME DEPENDENCY ENFORCEMENT

### Current

Applications boot without PING

### Target

```typescript
const runtime =
    createPingRuntime();

runtime.start();

application.attach(runtime);
```

**Search:**
```bash
rg -n \
"new NewsletterBrain|new DigestionWorker|main\(|bootstrap"
```

**Require runtime injection.**

**Example:**
```typescript
new NewsletterBrain(
   runtime.commitService,
   runtime.identityAuthority,
   runtime.lineageAuthority
);
```

---

## PATCH 7 — CANONICAL AUTHORITY CENTRALIZATION

### Current Audit

Canonical Authority = NONE

### Implementation

**Create:**

```typescript
CanonicalAuthority
```

**Responsible for:**
- serialization
- hashing
- ordering
- normalization
- identity derivation

**Applications may never call:**
```typescript
JSON.stringify(...)
createHash(...)
```

**directly.**

**Search:**
```bash
rg -n \
"JSON\.stringify|createHash|sha256|hashlib"
```

**Route all through:**
```typescript
canonicalAuthority
```

---

## IMPLEMENTATION ORDER

| Phase | Work | Risk |
| ----- | ---- | ---- |
| 1 | Identity Authority | Low |
| 2 | Canonical Authority | Low |
| 3 | CommitService introduction | Medium |
| 4 | Event-first enforcement | Medium |
| 5 | Projection separation | Medium |
| 6 | Replay reconstruction tests | Medium |
| 7 | Runtime dependency enforcement | High |

---

## CONSTITUTIONAL END STATE

### After All Seven Patches

```text
Application
→ IdentityAuthority
→ CommitService
→ Event Log
→ Projection
→ Persistence
```

### And Never

```text
Application
→ SQLite

Application
→ Filesystem

Application
→ Hashing

Application
→ Identity Generation
```

**directly.**

---

## PHASE 1 — RUNTIME CONSTRUCTION AUTHORITY

### Remove

```typescript
new NewsletterBrain()
new DigestionWorker()
new TaskEngine()
```

### Replace

```typescript
runtime.createNewsletterBrain()
runtime.createDigestionWorker()
runtime.createTaskEngine()
```

### Constitutional Rule

```text
No authoritative subsystem may be instantiated
outside the Kernel.
```

---

## PHASE 2 — IDENTITY + LINEAGE SEPARATION

### IdentityAuthority

**Responsible only for:**
```text
artifactId
eventId
recordId
```

**Interface:**
```typescript
interface IdentityAuthority {
    deriveArtifactId(
        canonicalBytes: Uint8Array
    ): ArtifactId;
}
```

### LineageAuthority

**Responsible only for:**
```text
lineageId
parentEventId
causalChain
ancestorGraph
```

**Interface:**
```typescript
interface LineageAuthority {
    deriveLineage(
        parentEvents: EventId[]
    ): LineageEnvelope;
}
```

**Applications cannot create lineage.**

---

## PHASE 3 — CANONICAL IDENTITY DERIVATION

### Remove

```typescript
uuid()
randomUUID()
allocateArtifactId()
```

### Replace

```typescript
artifactId =
SHA256(
    canonical(payload)
)
```

**Identity becomes:**
```text
deterministic
replayable
regeneratable
verifiable
```

---

## PHASE 4 — PERSISTENCE FIREWALL

### Applications Lose

```typescript
sqlite
postgres
filesystem
open(...)
write(...)
```

**entirely.**

### New Interface

```typescript
interface PersistenceAuthority {
    write(
        command: PersistenceCommand
    ): Result;
}
```

**Only projections may call:**
```typescript
PersistenceAuthority
```

### Result

```text
Application
cannot physically mutate state.
```

---

## PHASE 5 — COMMITSERVICE CONSTITUTIONAL PIPELINE

### Replace

```typescript
commit(event)
```

### With

```typescript
authorize(event)
canonicalize(event)
deriveIdentity(event)
deriveLineage(event)
validate(event)
commit(event)
```

### Pipeline

```text
Application
↓
CommitService
↓
AuthorizationAuthority
↓
CanonicalAuthority
↓
IdentityAuthority
↓
LineageAuthority
↓
EventStore
```

**Only then:**
```text
authoritative event exists
```

---

## PHASE 6 — EVENTSTORE SOVEREIGNTY

### Declare

#### Authoritative

```text
EventStore
```

#### Derived

```text
SQLite
PostgreSQL
Files
Indexes
Archives
Search
Digests
Views
Caches
```

### Constitutional Rule

```text
EventStore wins all conflicts.
```

### Projection Disagreement

```text
Projection loses.
```

**Always.**

---

## PHASE 7 — PROJECTION RUNTIME

### Replace

```text
Application
→ SQLite
```

### With

```text
Application
→ Event
→ Projection Runtime
→ PersistenceAuthority
→ SQLite
```

**SQLite becomes disposable.**

---

## PHASE 8 — REPLAY LOCKSTEP VERIFICATION

### Required Replay Invariants

```typescript
expect(stateA)
    .toEqual(stateB);

expect(witnessA)
    .toEqual(witnessB);

expect(eventHashesA)
    .toEqual(eventHashesB);
```

### Verification Target

```text
State
Witness
Identity
Hashes
Lineage
```

**All must converge.**

---

## PHASE 9 — CONSTITUTIONAL TEST SUITES

### No Direct Persistence

**Fail build if:**
```text
sqlite3.connect
cursor.execute
INSERT
UPDATE
DELETE
open(...,'w')
```

**appear outside kernel.**

### No Direct Identity

**Fail build if:**
```text
uuid
uuid4
randomUUID
```

**appear outside IdentityAuthority.**

### No Direct Hashing

**Fail build if:**
```text
sha256
createHash
hashlib
```

**appear outside CanonicalAuthority.**

### No Direct Lineage

**Fail build if:**
```text
parentId
lineageId
ancestorId
```

**are created outside LineageAuthority.**

---

## PHASE 10 — SOVEREIGNTY SCORECARD

### Every Subsystem Receives

| Property              | Pass |
| --------------------- | ---- |
| Runtime Authority     | ✓    |
| Event Authority       | ✓    |
| Identity Authority    | ✓    |
| Canonical Authority   | ✓    |
| Lineage Authority     | ✓    |
| Replay Authority      | ✓    |
| Witness Authority     | ✓    |
| Persistence Authority | ✓    |

### Constitutional Status

```text
All ✓ = Sovereign
Any ✗ = Non-Constitutional
```

---

## CONSOLIDATED IMPLEMENTATION PLAN

### Combined Patch + Phase Order

| Step | Work | Risk |
| ---- | ---- | ---- |
| 1 | Patch 1: Identity Authority | Low |
| 2 | Patch 7: Canonical Authority | Low |
| 3 | Phase 2: Identity + Lineage Separation | Low |
| 4 | Phase 3: Canonical Identity Derivation | Low |
| 5 | Patch 3: CommitService Introduction | Medium |
| 6 | Phase 5: CommitService Constitutional Pipeline | Medium |
| 7 | Patch 2: Event-First Enforcement | Medium |
| 8 | Patch 4: Projection Separation | Medium |
| 9 | Phase 7: Projection Runtime | Medium |
| 10 | Patch 5: Replay Reconstruction Tests | Medium |
| 11 | Phase 8: Replay Lockstep Verification | Medium |
| 12 | Phase 9: Constitutional Test Suites | Medium |
| 13 | Patch 6: Runtime Dependency Enforcement | High |
| 14 | Phase 1: Runtime Construction Authority | High |
| 15 | Phase 4: Persistence Firewall | High |
| 16 | Phase 6: EventStore Sovereignty | High |
| 17 | Phase 10: Sovereignty Scorecard | High |

---

## FINAL DETERMINATION

### Current State

```text
PING constitutional infrastructure exists
BUT
Applications bypass constitutional authority
Authority is optional
Delegation is not occurring
Kernel exists
Kernel is not yet sovereign
```

### Target State

```text
PING constitutional infrastructure exists
AND
Applications delegate to constitutional authority
Authority is mandatory
Delegation is enforced
Kernel exists
Kernel is sovereign
```

### Minimum Implementation

**7 patches + 10 phases = 17 implementation steps**

**Estimated engineering hours:** 35-50 hours (depending on complexity)

**Result:** Sovereignty becomes structurally enforced rather than developer-enforced.

---

## CONCLUSION

This constitutional sovereignty retrofit transforms PING from "constitutional infrastructure exists" to "constitutional authority is mandatory" by:

1. **Removing direct persistence access** (Patch 3, Phase 4)
2. **Removing direct identity generation** (Patch 1, Phase 3)
3. **Removing direct hashing** (Patch 7)
4. **Removing direct lineage creation** (Phase 2)
5. **Enforcing event-first architecture** (Patch 2)
6. **Separating projections from authoritative state** (Patch 4, Phase 7)
7. **Enforcing runtime dependency** (Patch 6, Phase 1)
8. **Adding replay verification** (Patch 5, Phase 8)
9. **Adding constitutional test suites** (Phase 9)
10. **Scoring sovereignty** (Phase 10)

**At that point sovereignty becomes structurally enforced rather than developer-enforced.**
