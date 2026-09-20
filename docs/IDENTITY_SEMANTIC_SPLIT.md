# Identity Semantic Split

**Date:** 2026-09-20
**Purpose:** Document semantic split between random/temporal and deterministic/content-addressed identity authorities

---

## Semantic Distinction

There are **two distinct identity semantic paths** in the runtime, not duplicates to collapse:

### Path A: Random/Temporal Identity (Python)

**Location:** `runtime/authorities/identity_authority.py`

**Methods:**
- `generate_id()` → UUID v7 (RFC 9562, time-ordered, random)
- `generate_deterministic_id(namespace, name)` → UUID v5 (deterministic from namespace/name)
- `generate_short_id()` → 8-char hex from random bytes

**Semantics:**
- **What it identifies:** Actors, execution events, time-ordered operations
- **Why random/temporal:** Needs temporal uniqueness, monotonic ordering, collision resistance across distributed execution
- **Hash bytes:** N/A (uses RFC 9562 UUID structure with timestamp + random)
- **Content-addressed:** NO
- **Externally referenced:** YES (database primary keys, event IDs, actor IDs)

**Use cases:**
- Execution event IDs
- Actor IDs (Alice, Bob, Agent)
- Mission/Run/Execution IDs
- Temporal events requiring ordering

### Path B: Deterministic/Content-Addressed Identity (JavaScript/TypeScript)

**Locations:**
- `runtime/kernel/authorities/identity_authority.js` (JavaScript)
- `runtime/constitutional/src/identity-authority.ts` (TypeScript - PATCH 1)

**Methods:**
- `generateId(type, identityData)` → type_hash16 (deterministic canonical hash)
- `generateFromCanonicalHash(canonicalBytes, type)` → type_hash16
- Typed helpers: generateFailureId, generateToolId, generateArtifactId, etc.

**Semantics:**
- **What it identifies:** Objects, artifacts, evidence, repository entities
- **Why deterministic:** Same content must produce same ID for deduplication, caching, verification
- **Hash bytes:** SHA-256 of canonical serialization
- **Content-addressed:** YES
- **Externally referenced:** YES (artifact IDs, content IDs, deduplication keys)

**Use cases:**
- Artifact IDs (same content → same ID)
- Evidence instance IDs
- Repository object IDs
- Failure/tool/stream/chunk IDs (derived from deterministic state)

---

## Format Compatibility

**JavaScript legacy format (canonical):**
```javascript
return `${type}_${hash.substring(0, 16)}`;
```
Example: `failure_a1b2c3d4e5f6g7h8`

**TypeScript PATCH 1 format (compatible):**
```typescript
return `${type}_${canonicalId.hash.substring(0, 16)}`;
```
Example: `failure_a1b2c3d4e5f6g7h8`

**Python UUID v7 format (separate path):**
```
018f1e3c-6b8a-7d0f-8b1c-2d3e4f5a6b7c
```
**NOT interchangeable with type_hash16 format.**

---

## CanonicalID Structure (TypeScript)

PATCH 1 introduced structured canonical IDs for deterministic path:

```typescript
interface CanonicalID {
  authority: string;  // "identity"
  namespace: string;  // e.g., "artifact", "evidence"
  kind: string;       // Type prefix
  version: string;    // "1.0.0"
  hash: string;       // Full SHA-256
}
```

**Compatibility layer:** `generateId(type, context)` extracts hash16 for backward compatibility with JavaScript callers.

---

## Dependency Graph

```
Execution Identity (Random/Temporal)
    ↓
Python IdentityAuthority (UUID v7)
    ↓
PostgreSQL uuidv7() OR pure-Python RFC 9562
    ↓
Event IDs, Actor IDs, Mission/Run/Execution IDs

Object Identity (Deterministic/Content-Addressed)
    ↓
JavaScript/TypeScript IdentityAuthority
    ↓
Canonical Serialization → SHA-256 → type_hash16
    ↓
Artifact IDs, Evidence IDs, Repository Object IDs
```

**Crossing paths NOT allowed:** Object IDs must not use UUID v7 (non-deterministic). Event IDs must not use canonical hash (non-temporal).

---

## Convergence Verdict

**DO NOT COLLAPSE.**

These are semantically distinct responsibilities:
- **Random/temporal** for execution/event/actor identity
- **Deterministic/content-addressed** for object/artifact/evidence identity

**PATCH 2 action:**
1. Document this semantic split (this file)
2. Ensure TypeScript generateId() compatibility with JavaScript
3. Preserve Python UUID v7 path unchanged
4. Verify no callers mix semantics (events using object IDs, or vice versa)

**Future convergence (if needed):**
- MAY add Python wrapper for deterministic path if Python needs object IDs
- MAY add JavaScript wrapper for UUID v7 if JS needs temporal IDs
- DO NOT eliminate either semantic path
