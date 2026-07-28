# CANONICALIZATION AUTHORITY DIFF

**Audit Date:** 20260621
**Scope:** PING repository + CascadeProjects
**Task:** Identify every implementation of JSON.stringify, canonicalize, CanonicalJson, stable stringify, sorted key serialization, custom serializers

---

## CURRENT AUTHORITY

**Authoritative Implementation:**

`runtime/replay/canonical_json.ts`

**Classification:** AUTHORITATIVE

**Evidence:**
- Declared as "sole canonicalization authority" in comments
- Implements RFC-8785 JSON Canonicalization Scheme
- Used by all other replay modules
- Exported from replay index

---

## PING RUNTIME IMPLEMENTATIONS

### Delegating Files

**runtime/replay/canonical_certificate.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(cleaned)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/canonical_event_envelope.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(envelope)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/canonical_hash_authority.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(obj)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/certificate_authority.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(...)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/state_serializer.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.toUint8Array(...)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/witness_authority.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(...)`, `CanonicalJson.toUint8Array(...)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/replay_verification.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(...)`
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT

**runtime/replay/replay_event_stream.ts**
- **Classification:** DELEGATING
- **Usage:** `JSON.stringify(...)` for payload size calculation only (non-constitutional)
- **Authority:** Does not use for canonicalization
- **Status:** CORRECT (utility use only)

**runtime/replay/constitutional_self_check_core.ts**
- **Classification:** DELEGATING
- **Usage:** `JSON.parse(...)` for test data (non-constitutional)
- **Authority:** Does not use for canonicalization
- **Status:** CORRECT (test utility only)

**runtime/replay/__tests__/constitutional_primitives.test.ts**
- **Classification:** DELEGATING
- **Usage:** `CanonicalJson.canonicalize(...)` for tests
- **Authority:** Delegates to canonical_json.ts
- **Status:** CORRECT (test delegation)

---

## CASCADEPROJECTS IMPLEMENTATIONS

### Duplicate Implementations

**CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/canonical_engine.ts**
- **Classification:** DUPLICATE
- **Implementation:** Independent recursive sort implementation
- **Code:**
  ```typescript
  export function canonicalize(value: any): any {
    if (Array.isArray(value)) {
      return value.map(canonicalize)
    }
    if (value !== null && typeof value === "object") {
      const sortedKeys = Object.keys(value).sort()
      const result: any = {}
      for (const key of sortedKeys) {
        result[key] = canonicalize(value[key])
      }
      return result
    }
    return value
  }
  ```
- **Authority:** Independent (does not delegate to CanonicalJson)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

**CRX_REMOTE/kernel/commit-service/src/engines/touch src/engines/canonical_engine.ts**
- **Classification:** DUPLICATE
- **Implementation:** Same recursive sort implementation
- **Authority:** Independent (does not delegate to CanonicalJson)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

**CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts**
- **Classification:** DUPLICATE
- **Usage:** `JSON.stringify(canonical)` for serialization
- **Authority:** Application-level serialization (bypasses CanonicalJson)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

**CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts**
- **Classification:** DUPLICATE
- **Usage:** `JSON.stringify(canonical)` for serialization
- **Authority:** Application-level serialization (bypasses CanonicalJson)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

**CRX_REMOTE/tests/certification/generate-corpus-vectors.ts**
- **Classification:** DELEGATING
- **Usage:** `JSON.stringify(corpus, null, 2)` for test file generation
- **Authority:** Non-constitutional (test file output)
- **Status:** CORRECT (test utility only)

---

## PING COMMIT-SERVICE IMPLEMENTATIONS

### Status: EMPTY

**runtime/kernel/commit-service/src/engines/**
- **Classification:** EMPTY DIRECTORY
- **Status:** NO VIOLATIONS
- **Note:** No identity_engine.ts or canonical_engine.ts exist in PING commit-service

---

## SUMMARY

### Current Authority

**runtime/replay/canonical_json.ts** - AUTHORITATIVE

### Delegates

**PING runtime:** 9 files (all correctly delegating)
**CascadeProjects:** 1 file (test utility, correct)

### Duplicates

**CascadeProjects:** 4 files (all critical violations)
- 2 independent canonicalize implementations
- 2 application-level JSON.stringify usage

### Dead

**None identified**

---

## CONSTITUTIONAL ASSESSMENT

**PING Runtime:** ✅ CORRECT
- Single authoritative implementation
- All delegates correctly
- No duplicates

**CascadeProjects:** ❌ CRITICAL VIOLATIONS
- 4 duplicate implementations
- No delegation to constitutional authority
- Authority fragmentation

---

## REQUIRED ACTIONS

### P0 (Critical)

1. **Delete CRX_REMOTE duplicate canonicalization implementations:**
   - `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/canonical_engine.ts`
   - `CRX_REMOTE/kernel/commit-service/src/engines/touch src/engines/canonical_engine.ts`

2. **Delete CRX_REMOTE application-level serialization:**
   - `CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts`
   - `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts`

### P1 (High)

3. **Ensure any consumers of deleted files delegate to:**
   - `runtime/replay/canonical_json.ts` (if in PING)
   - Or import from `@crx/replay` (if in external packages)

---

## CONSTITUTIONAL DIFF

**Authorities Added:** 0
**Authorities Removed:** 4 (CascadeProjects duplicates)
**Delegation Increased:** YES (by removing non-delegating implementations)
**Sovereignty Score:** IMPROVED (if actions taken)
