# Constitutional Authority Map

## Executive Summary

This document maps constitutional authorities across the CRX/PING repository, identifying singular authorities, delegated implementations, and authority violations.

---

## Constitutional Authorities

### 1. Canonicalization Authority

**Singular Authority:** `runtime/replay/canonical_json.ts`

**Implementation:**
- RFC-8785 JSON Canonicalization Scheme (JCS)
- Lexicographic property ordering
- Deterministic numeric rendering
- UTF-8 normalization
- Circular reference protection
- BigInt/Symbol/Function rejection
- NaN normalization

**Delegations:**
- `runtime/kernel/commit-service/src/engines/canonical_engine.ts` ✅ (delegates to @crx/replay CanonicalJson)

**Status:** ✅ SINGULAR AUTHORITY ESTABLISHED

---

### 2. Hash Authority

**Singular Authority:** `runtime/replay/canonical_hash_authority.ts`

**Implementation:**
- Delegates canonicalization to CanonicalJson
- Uses CertificateAuthority for SHA-256
- Byte-stable hashing
- Runtime-neutral (no Buffer, no Node crypto)

**Violations:**
- `runtime/kernel/commit-service/src/engines/identity_engine.ts` ❌
  - Uses Node crypto directly
  - Does not delegate to constitutional hash authority
  - Creates parallel hash implementation

**Status:** ❌ AUTHORITY FRAGMENTATION

---

### 3. Replay Authority

**Singular Authority:** `runtime/replay/`

**Implementation:**
- `replay_state_machine.ts` - Deterministic state transitions
- `replay_event_stream.ts` - Event stream handling
- `deterministic_replay_engine.ts` - Replay execution
- `replay_verification.ts` - Determinism verification
- `witness_authority.ts` - Witness root generation

**Status:** ✅ SINGULAR AUTHORITY ESTABLISHED

---

### 4. Validation Authority

**Singular Authority:** `runtime/replay/graph_validator.ts`

**Implementation:**
- Transitive cycle detection (DFS)
- Orphan detection
- Depth enforcement
- Deterministic traversal ordering
- Constitutional depth guards

**Violations:**
- `runtime/kernel/commit-service/src/validation/dag_validator.ts` ❌
  - Only checks direct self-loops
  - Only checks duplicate parents
  - Missing transitive cycle detection
  - Missing orphan detection
  - Missing depth enforcement

**Status:** ❌ AUTHORITY FRAGMENTATION

---

### 5. Event Authority

**Singular Authority:** `runtime/replay/replay_event_stream.ts`

**Implementation:**
- Canonical event envelopes
- Event stream management
- Deterministic event ordering

**Violations:**
- `runtime/kernel/commit-service/src/events/event_log.ts` ❌
  - Direct database persistence
  - Does not delegate to replay authority
  - Mixed ownership (persistence + event handling)

**Status:** ❌ AUTHORITY FRAGMENTATION

---

### 6. Lineage Authority

**Singular Authority:** `runtime/replay/replay_state_machine.ts`

**Implementation:**
- Lineage graph construction
- Lineage validation
- Lineage depth calculation
- Event ID to artifact ID mapping

**Violations:**
- `runtime/kernel/commit-service/src/persistence/lineage_store.ts` ❌
  - Direct database persistence
  - No validation delegation
  - Mixed ownership (persistence + lineage logic)

**Status:** ❌ AUTHORITY FRAGMENTATION

---

## Implementation Layers

### Transport Layer

**Files:**
- `runtime/kernel/commit-service/src/api/commit_controller.ts`
- `runtime/kernel/commit-service/src/api/audit_controller.ts`
- `runtime/kernel/commit-service/src/server.ts`

**Violations:**
- `commit_controller.ts` calls `computeCanonicalHash` directly (should delegate to hash authority)
- `audit_controller.ts` directly queries database pool (should delegate to persistence authority)

**Status:** ❌ CONTROLLER VIOLATIONS

---

### Persistence Layer

**Files:**
- `runtime/kernel/commit-service/src/persistence/artifact_store.ts`
- `runtime/kernel/commit-service/src/persistence/lineage_store.ts`
- `runtime/kernel/commit-service/src/persistence/db.ts`
- `runtime/kernel/commit-service/src/persistence/ledger_schema.sql`

**Violations:**
- `db.ts` exports global pool (violates dependency injection)
- Persistence stores hash, validate, establish truth (should be write-only/read-only)

**Status:** ❌ PERSISTENCE VIOLATIONS

---

### Security Layer

**Files:**
- None (to be implemented)

**Required:**
- Windows credential provider

**Status:** ⚠️ NOT IMPLEMENTED

---

## Repository Hygiene

### .gitignore

**Status:** ❌ ROOT .GITIGNORE MISSING

**Existing:**
- `runtime/.gitignore` ✅ (covers node_modules, dist, coverage, .turbo, .next, *.log)

**Required:**
- Root-level .gitignore to cover entire repository

---

### node_modules

**Status:** ❌ COMMITTED TO GIT

**Evidence:**
- `git ls-files` shows thousands of node_modules files tracked
- Critical repository hygiene violation

**Required:**
- Remove node_modules from git tracking
- Add to .gitignore
- Ensure package-lock.json is present

---

## Authority Violation Summary

| Authority | Singular Authority | Violations | Status |
|-----------|-------------------|------------|--------|
| Canonicalization | `runtime/replay/canonical_json.ts` | None | ✅ |
| Hash | `runtime/replay/canonical_hash_authority.ts` | `identity_engine.ts` | ❌ |
| Replay | `runtime/replay/` | None | ✅ |
| Validation | `runtime/replay/graph_validator.ts` | `dag_validator.ts` | ❌ |
| Event | `runtime/replay/replay_event_stream.ts` | `event_log.ts` | ❌ |
| Lineage | `runtime/replay/replay_state_machine.ts` | `lineage_store.ts` | ❌ |

---

## Controller Violations Summary

| Controller | Violation | Severity |
|------------|-----------|----------|
| `commit_controller.ts` | Calls computeCanonicalHash directly | P0 |
| `audit_controller.ts` | Directly queries database pool | P0 |

---

## Persistence Violations Summary

| File | Violation | Severity |
|------|-----------|----------|
| `db.ts` | Global pool export | P0 |
| `artifact_store.ts` | Hashes in persistence layer | P1 |
| `lineage_store.ts` | Validates in persistence layer | P1 |
| `event_log.ts` | Establishes truth in persistence layer | P1 |

---

## Recommended Actions

### P0 (Critical)

1. Remove `identity_engine.ts` - delegate to `canonical_hash_authority.ts`
2. Remove `dag_validator.ts` - delegate to `graph_validator.ts`
3. Refactor `commit_controller.ts` to delegate to hash authority
4. Refactor `audit_controller.ts` to delegate to persistence authority
5. Remove global pool export from `db.ts` - use dependency injection
6. Create root .gitignore
7. Remove node_modules from git tracking

### P1 (Recommended)

1. Refactor `event_log.ts` to delegate to replay event authority
2. Refactor `lineage_store.ts` to separate persistence from validation
3. Ensure persistence stores are write-only/read-only
4. Remove hashing/validation from persistence layer

### P2 (Optional)

1. Consolidate audit reports
2. Archive duplicate documentation
3. Standardize naming conventions

---

## Constitutional Reduction Analysis

### Question 1: Does this introduce authority?

**Answer:** No - all changes delegate to existing authorities.

### Question 2: Can replay reconstruct it?

**Answer:** Yes - all state derives from event stream.

### Question 3: Can hash reconstruct it?

**Answer:** Yes - identity derives from canonical hash.

### Question 4: Can delegation replace it?

**Answer:** Yes - all violations can be replaced with delegation.

---

## End State

**Target:** One authority per constitutional concern.

**Current:** 4/6 authorities singular (67%)

**Goal:** 6/6 authorities singular (100%)

**Path:** Delegate all violations to constitutional authorities.
