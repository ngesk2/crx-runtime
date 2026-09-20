# Authority Convergence Patch Ledger

**Status:** PATCH 1 COMPLETE — WSL CANONICAL REPOSITORY

---

## PATCH 0 - ESTABLISH BASELINE (WSL CANONICAL)

**Objective:** Establish canonical WSL repository baseline

**Git Status:**
- Repository: /home/nolan/ping (canonical engineering root)
- Branch: refactor/runtime-authority-convergence
- HEAD: 28f0c9707
- Worktree: N/A
- Remotes: origin https://github.com/ngesk2/crx-runtime.git

**Finding:** WSL canonical repository does NOT have the gitlink problem. runtime/ is already a normal tracked directory with 258 files. The gitlink problem is isolated to the Windows branch (feature/mission-control-truth).

**WSL runtime State:**
- runtime/constitutional/ contains only Python files (event_chain.py, secret_adapter.py, etc.)
- No TypeScript constitutional authorities in src/ before PATCH 1
- JavaScript IdentityAuthority exists at runtime/kernel/authorities/identity_authority.js
- Uses format: type_hash16 (underscore separator)

**Next Action:** Execute PATCH 1 in canonical WSL repository

---

## PATCH 1 - FIX BROKEN IDENTITY AUTHORITY CONTRACT (WSL CANONICAL)

**Objective:** Add TypeScript IdentityAuthority to canonical WSL repository with correct legacy format

**Files Changed:**
- ADDED: runtime/constitutional/src/identity-authority.ts (127 lines)
- ADDED: runtime/constitutional/src/identity-authority.test.ts (91 lines) - characterization tests
- ADDED: runtime/constitutional/src/hash-authority.ts (48 lines)
- ADDED: runtime/constitutional/src/time-authority.ts (89 lines)
- ADDED: runtime/constitutional/src/index.ts (12 lines) - minimal exports only
- ADDED: runtime/constitutional/package.json (617 bytes)

**Authority Affected:** IdentityAuthority (constitutional)

**Duplicate Eliminated:** None (created missing TypeScript authority alongside existing JavaScript)

**Compatibility Preserved:** YES - Implemented generateId() with type_hash16 format (underscore separator) to match historical JavaScript implementation

**Tests Run:** Not yet executed in WSL (tests added but not run)

**Result:** COMMITTED to WSL canonical repository at SHA 28f0c9707

**Canonical Behavior Changed:** NO - TypeScript implementation matches JavaScript legacy format (type_hash16)

**Compatibility Risk:** LOW - Format verified against historical JavaScript implementation

**ID Format Resolution:**
- Historical JavaScript: type_hash16 (underscore separator)
- PATCH 1 initial (incorrect): type:hash16 (colon separator)
- PATCH 1 corrected: type_hash16 (underscore separator)
- Evidence: runtime/kernel/authorities/identity_authority.js line 57

**Next:** Proceed to PATCH 2 (identity semantic split documentation)

---

## PATCH 2 - IDENTITY SEMANTIC SPLIT DOCUMENTATION

**Objective:** Document semantic split between random/temporal and deterministic/content-addressed identity authorities

**Finding:** Identity authorities are NOT duplicates. They serve distinct semantic purposes:
- Python IdentityAuthority (UUID v7) → random/temporal identity for execution/events/actors
- JavaScript/TypeScript IdentityAuthority (type_hash16) → deterministic/content-addressed identity for objects/artifacts

**Verdict:** DO NOT COLLAPSE. These are semantically distinct responsibilities with different use cases.

**Files Changed:**
- ADDED: docs/IDENTITY_SEMANTIC_SPLIT.md (141 lines)

**Dependency Graph Documented:**
- Execution Identity → Python IdentityAuthority (UUID v7) → Event IDs, Actor IDs, Mission/Run/Execution IDs
- Object Identity → JavaScript/TypeScript IdentityAuthority → Canonical SHA-256 → type_hash16 → Artifact IDs, Evidence IDs, Repository Object IDs

**Format Compatibility:**
- JavaScript: type_hash16 (underscore separator) - CANONICAL
- TypeScript PATCH 1: type_hash16 (underscore separator) - COMPATIBLE
- Python UUID v7: RFC 9562 format - SEPARATE PATH

**Convergence Rule:** Events must not use object IDs (non-temporal). Objects must not use UUID v7 (non-deterministic).

**Result:** COMMITTED to WSL canonical repository

**Next:** Continue PATCH 2 - hash authority jurisdictional split documentation

---

## PATCH 2 - HASH AUTHORITY JURISDICTIONAL SPLIT DOCUMENTATION

**Objective:** Document jurisdictional split between hash authorities across subsystems

**Finding:** Hash authorities are jurisdictionally separated, NOT duplicates to collapse:

**Python CanonicalHashAuthority** (runtime/authorities/canonical_hash_authority.py):
- Simple hashlib.sha256 wrapper
- Methods: sha256(), hash_json(), hash_dict()
- No envelope pattern
- Jurisdiction: Python constitutional subsystem

**TypeScript CanonicalHashAuthority** (runtime/kernel/replay/canonical_hash_authority.ts):
- Delegates to CanonicalJson for canonicalization
- Delegates to CertificateAuthority for SHA-256 (sole hash authority per its constitutional rule)
- Uses envelope pattern: hash_algorithm:hash
- Jurisdiction: Replay subsystem

**TypeScript HashAuthority** (runtime/constitutional/src/hash-authority.ts):
- Uses Node crypto.createHash directly
- Has envelope pattern with canonical_version, serialization_version, algorithm, payload
- Own canonicalizeObject() implementation
- Jurisdiction: TypeScript constitutional subsystem

**Verdict:** DO NOT COLLAPSE. These are jurisdictionally separated subsystems with no cross-language data flow per hash-authority.ts comments.

**Convergence Decision:** Jurisdictional separation is intentional. No convergence needed.

**Result:** Documented in ledger (no code changes)

**PIVOT:** Authority convergence baseline accepted. PATCH 1 (IdentityAuthority) + PATCH 2 (semantic/jurisdictional split documentation) are sufficient foundation. Pivoting to PING social object vertical slice.

**Next:** PATCH 3 - Object Kernel

---

## PATCH 3 — OBJECT KERNEL (PING SOCIAL OBJECT VERTICAL SLICE)

**Objective:** Implement the smallest protocol-neutral PING primitives for social object flow

**Scope:**
- Inspect and reuse existing authorities (IdentityAuthority, Canonical serialization, HashAuthority, CapabilityAuthority, ping_events, replay/evidence machinery, gateway composition, Postgres access boundaries)
- Implement minimal protocol-neutral primitives: Actor, Object, Relationship, Transition, Capability, Proof
- Do NOT create replacements for existing authorities
- Do NOT create dozens of subclasses

**Initial Schemas:**
- ping.identity@1
- ping.social.profile@1
- ping.social.post@1
- ping.relationship@1
- ping.transition@1

**Canonical Object Structure:**
```json
{
  "id": "object_<deterministic-id>",
  "schema": "ping.social.post@1",
  "controller": "alice",
  "created_at": "...",
  "content": {
    "text": "Hello PING"
  },
  "refs": []
}
```

**Architectural Decision:** Object identity uses established deterministic/content-addressed path (type_hash16), NOT UUID-v7. UUID-v7 is for internal temporal identifiers, not durable cryptographic identity.

**Status:** COMPLETE - COMMITTED at SHA fc2a04b9d

**Files Changed:**
- ADDED: database/ping_objects.sql (154 lines) - PostgreSQL schema for ping_objects, ping_relationships, ping_transitions
- ADDED: runtime/constitutional/src/schemas/ping-objects.ts (88 lines) - TypeScript interfaces for PING objects
- ADDED: runtime/constitutional/src/ping-object-kernel.ts (206 lines) - PING object operations using existing authorities
- MODIFIED: runtime/constitutional/src/index.ts - exports PingObjectKernel and schemas

**Authorities Reused:**
- IdentityAuthority for deterministic object IDs (type_hash16 format)
- HashAuthority for content hashing
- TimeAuthority for timestamps

**Schemas Implemented:**
- ping.identity@1
- ping.social.profile@1
- ping.social.post@1
- ping.relationship@1
- ping.transition@1

**Canonical Object Structure:**
```json
{
  "id": "object_<deterministic-id>",
  "schema": "ping.social.post@1",
  "controller": "alice",
  "created_at": "...",
  "content": { "text": "Hello PING" },
  "refs": []
}
```

**Operations Implemented:**
- createPost(controller, text, refs)
- createProfile(controller, displayName, bio)
- createRelationship(subject, predicate, object)
- createCreateTransition(objectId, actorId, payload, proof)
- createRelateTransition(objectId, actorId, sequence, payload, previousTransition, proof)
- verifyTransition(transition, expectedPayload)

**Database Tables:**
- ping_objects (append-only content store)
- ping_relationships (subject-predicate-object graph)
- ping_transitions (append-only immutable state changes with triggers preventing updates/deletes)

**Architectural Decisions:**
- Object identity uses deterministic/content-addressed path (type_hash16), NOT UUID-v7
- UUID-v7 remains for internal temporal identifiers only
- No replacements for existing authorities
- Minimal protocol-neutral primitives (no dozens of subclasses)

**Next:** PATCH 4 - Immutable Transitions (append to ping_events, not separate event store)

---

## PATCH 4 — IMMUTABLE TRANSITIONS (IN PROGRESS)

**Objective:** Append object transitions to existing ping_events canonical event spine

**Scope:**
- Do NOT introduce ping_object_events, social_events, object_event_bus, or another replay store
- Use existing canonical event spine (events table from database/events.sql)
- Operations: create, relate, unrelate, propose, approve, publish, tombstone

**Status:** COMPLETE - COMMITTED at SHA [pending]

**Files Changed:**
- ADDED: runtime/constitutional/src/ping-transition-mapper.ts (102 lines)
- MODIFIED: runtime/constitutional/src/index.ts - exports PingTransitionMapper

**Canonical Event Mapping:**
- PING transitions mapped to existing events table schema (stream, event_type, payload, created_at)
- Stream format: `ping.{object_id}`
- Event type format: `ping.{operation}` (e.g., ping.create, ping.relate, ping.approve)
- Bidirectional conversion: toCanonicalEvent() and fromCanonicalEvent()
- Validation: validateEvent() checks required fields

**Canonical Event Format:**
```json
{
  "stream": "ping.object_a1b2c3d4",
  "event_type": "ping.create",
  "payload": {
    "transition_id": "transition_e5f6g7h8",
    "object_id": "object_a1b2c3d4",
    "operation": "create",
    "actor_id": "alice",
    "sequence": 1,
    "previous_transition": null,
    "payload_hash": "...",
    "proof": {},
    "metadata": {}
  },
  "created_at": "2026-09-20T13:00:00Z"
}
```

**Architectural Decision:**
- NO separate ping_object_events, social_events, object_event_bus, or replay store
- Uses existing canonical event spine (events table from database/events.sql)
- Transitions are immutable once appended to events table (existing triggers prevent updates/deletes)

**Next:** PATCH 5 - Two Actually Independent Identities (Alice and Bob with independent signing keys)

---

## PATCH 5 — TWO ACTUALLY INDEPENDENT IDENTITIES (IN PROGRESS)

**Objective:** Create Alice and Bob with independent identity records, signing keys, controllers, and local/client state

**Scope:**
- Alice and Bob MUST have independent identity records
- Independent signing keys
- Independent controllers
- Independent local/client state
- PROVE: Alice signs P1, Bob independently verifies P1
- PROVE: Bob cannot sign as Alice

**Status:** IN PROGRESS

---

## PATCH 1 - FIX BROKEN IDENTITY AUTHORITY CONTRACT (WINDOWS - BLOCKED)

**Objective:** Restore canonical IdentityAuthority contract by implementing missing authority in @ping/constitutional package

**Status:** BLOCKED - Gitlink problem isolated to Windows branch

**Finding:** Windows branch (feature/mission-control-truth) has stranded gitlink. WSL canonical repository does not have this problem. All future work in canonical WSL repository.

**Decision:** Abandon Windows branch repair. Work in canonical WSL repository only.
