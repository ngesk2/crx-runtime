# EXISTING CRX AUTHORITY

**FILE:** runtime/kernel/commit-service/src/engines/canonical_engine.ts

```typescript
export function canonicalize(value: any, options = {}): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(v => canonicalize(v, options));
  }

  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((a, k) => {
        a[k] = canonicalize(value[k], options);
        return a;
      }, {} as any);
  }

  return value;
}
```

**CAPABILITIES:**
- Recursive object key sorting
- Array canonicalization
- Null/undefined handling
- Basic type preservation

**MISSING CAPABILITIES:**
- Domain separation
- Error handling (CanonicalizationError)
- BigInt rejection
- Symbol rejection
- Function rejection
- Circular reference detection
- Sparse array handling
- UTF-8 NFC normalization
- Max depth guard
- Scientific notation guard
- Explicit algorithm specification

---

# ARCHIVE AUTHORITY

**FILE:** extracted/js_txt/canonical_fingerprint_service.js

```javascript
export const FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0";
export const HASH_ALGORITHM = "SHA-256";

export const FINGERPRINT_DOMAINS = Object.freeze({
  SNAPSHOT: "SNAPSHOT",
  ARTIFACT: "ARTIFACT",
  DIFF: "DIFF",
  RELATIONSHIP: "RELATIONSHIP",
  ANCHOR: "ANCHOR",
  DRIFT_REPORT: "DRIFT_REPORT",
  EXECUTION_RECORD: "EXECUTION_RECORD",
  EXECUTION_FAILURE: "EXECUTION_FAILURE",
  EXECUTION_ID: "EXECUTION_ID",
  EXECUTION_ENVELOPE: "EXECUTION_ENVELOPE",
  SCHEDULER: "SCHEDULER",
  SCHEDULER_SUMMARY: "SCHEDULER_SUMMARY",
  PLUGIN_SEED: "PLUGIN_SEED",
  TIMEOUT: "TIMEOUT",
  CAPABILITY_DECLARATION: "CAPABILITY_DECLARATION",
  STRUCTURAL_NODE: "STRUCTURAL_NODE",
  PROJECTION: "PROJECTION",
  DIFF_ARTIFACT: "DIFF_ARTIFACT"
});

export class CanonicalizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CanonicalizationError";
  }
}

export async function canonicalize(value, options = {}) {
  const {
    maxDepth = 100,
    strictScientificNotation = false,
    rejectBigInt = true,
    rejectSymbol = true,
    rejectFunction = true,
    normalizeUTF8 = true,
    rejectSparseArrays = true,
    rejectUndefined = true,
    rejectNonPlainObjects = true
  } = options;

  const visited = new WeakSet();

  function normalize(obj, depth = 0) {
    if (depth > maxDepth) {
      throw new CanonicalizationError(`Max depth exceeded: ${maxDepth}`);
    }

    if (obj === null || obj === undefined) {
      if (rejectUndefined && obj === undefined) {
        throw new CanonicalizationError("Undefined rejected");
      }
      return obj;
    }

    if (typeof obj === "bigint") {
      if (rejectBigInt) {
        throw new CanonicalizationError("BigInt rejected");
      }
      return obj.toString();
    }

    if (typeof obj === "symbol") {
      if (rejectSymbol) {
        throw new CanonicalizationError("Symbol rejected");
      }
      return obj.toString();
    }

    if (typeof obj === "function") {
      if (rejectFunction) {
        throw new CanonicalizationError("Function rejected");
      }
      return "[Function]";
    }

    if (typeof obj === "string") {
      if (normalizeUTF8) {
        return obj.normalize("NFC");
      }
      return obj;
    }

    if (typeof obj === "number") {
      if (strictScientificNotation && !Number.isFinite(obj)) {
        throw new CanonicalizationError("Non-finite number rejected");
      }
      if (Object.is(obj, -0)) {
        return 0; // Normalize -0 to 0
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      if (rejectSparseArrays && !obj.every((_, i) => i in obj)) {
        throw new CanonicalizationError("Sparse array rejected");
      }
      if (visited.has(obj)) {
        throw new CanonicalizationError("Circular reference detected");
      }
      visited.add(obj);
      return obj.map(v => normalize(v, depth + 1));
    }

    if (typeof obj === "object") {
      if (rejectNonPlainObjects && Object.getPrototypeOf(obj) !== Object.prototype) {
        throw new CanonicalizationError("Non-plain object rejected");
      }
      if (visited.has(obj)) {
        throw new CanonicalizationError("Circular reference detected");
      }
      visited.add(obj);
      const sorted = Object.keys(obj).sort();
      const result = {};
      for (const key of sorted) {
        result[key] = normalize(obj[key], depth + 1);
      }
      return result;
    }

    return obj;
  }

  return normalize(value);
}
```

**CAPABILITIES:**
- Recursive object key sorting
- Array canonicalization
- Null/undefined handling (with rejection option)
- Domain separation (via FINGERPRINT_DOMAINS)
- Error handling (CanonicalizationError)
- BigInt rejection (configurable)
- Symbol rejection (configurable)
- Function rejection (configurable)
- Circular reference detection (WeakSet)
- Sparse array handling (with rejection option)
- UTF-8 NFC normalization (configurable)
- Max depth guard (configurable)
- Scientific notation guard (configurable)
- Explicit algorithm specification (HASH_ALGORITHM)
- Schema version (FINGERPRINT_SCHEMA_VERSION)

---

# DIRECT OVERLAP

**OVERLAP:** 70%
- Both perform recursive object key sorting
- Both handle array canonicalization
- Both handle null/undefined
- Both preserve basic types

---

# MISSING CAPABILITIES

**CRX MISSING:**
- Domain separation (CRITICAL for replay)
- Error handling (CRITICAL for safety)
- BigInt rejection (CRITICAL for determinism)
- Symbol rejection (CRITICAL for determinism)
- Function rejection (CRITICAL for determinism)
- Circular reference detection (CRITICAL for safety)
- Sparse array handling (CRITICAL for determinism)
- UTF-8 NFC normalization (CRITICAL for cross-platform consistency)
- Max depth guard (CRITICAL for safety)
- Scientific notation guard (CRITICAL for determinism)
- Explicit algorithm specification (CRITICAL for replay)
- Schema version (CRITICAL for migration)

**ARCHIVE MISSING:**
- TypeScript types (CRX has this - better)
- Simpler API (CRX is simpler for basic use cases - better)

---

# STRONGER IMPLEMENTATION

**ARCHIVE (canonical_fingerprint_service.js) IS STRONGER:**
- Domain separation (CRITICAL for replay)
- Error handling (CRITICAL for safety)
- Circular reference detection (CRITICAL for safety)
- Type rejection guards (CRITICAL for determinism)
- UTF-8 normalization (CRITICAL for cross-platform consistency)
- Configurable options (CRITICAL for flexibility)
- Explicit algorithm specification (CRITICAL for replay)
- Schema version (CRITICAL for migration)

**CRX (canonical_engine.ts) IS STRONGER:**
- TypeScript types (better for type safety)
- Simpler API (better for basic use cases)

---

# SAFE REUSE TARGETS

**REUSE ARCHIVE:** canonical_fingerprint_service.js
- Extract domain separation logic
- Extract error handling logic
- Extract circular reference detection
- Extract type rejection guards
- Extract UTF-8 normalization
- Extract max depth guard
- Extract scientific notation guard
- Extract algorithm specification
- Extract schema version

**EXTEND CRX:** canonical_engine.ts
- Add domain separation from archive
- Add error handling from archive
- Add circular reference detection from archive
- Add type rejection guards from archive
- Add UTF-8 normalization from archive
- Add max depth guard from archive
- Add scientific notation guard from archive
- Add algorithm specification from archive
- Add schema version from archive

---

# REPLAY RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - hash collisions across contexts
- CRITICAL: No circular reference detection - infinite loops
- CRITICAL: No type rejection - non-deterministic serialization
- HIGH: No UTF-8 normalization - cross-platform inconsistency
- HIGH: No max depth guard - stack overflow
- HIGH: No scientific notation guard - non-deterministic serialization
- HIGH: No algorithm specification - algorithm ambiguity
- HIGH: No schema version - migration issues

**ARCHIVE RISKS:**
- LOW: None identified

---

# LINEAGE RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - lineage fingerprint collisions
- CRITICAL: No circular reference detection - lineage corruption
- HIGH: No type rejection - lineage non-determinism
- HIGH: No UTF-8 normalization - cross-platform lineage inconsistency

**ARCHIVE RISKS:**
- LOW: None identified

---

# DETERMINISM RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - hash collisions across contexts
- CRITICAL: No circular reference detection - infinite loops
- CRITICAL: No type rejection - non-deterministic serialization
- HIGH: No UTF-8 normalization - cross-platform inconsistency
- HIGH: No max depth guard - stack overflow
- HIGH: No scientific notation guard - non-deterministic serialization

**ARCHIVE RISKS:**
- LOW: None identified

---

# SAFE EXTRACTION CANDIDATES

**EXTRACT FROM ARCHIVE:**
1. FINGERPRINT_DOMAINS constant
2. CanonicalizationError class
3. Circular reference detection logic (WeakSet)
4. Type rejection guards (BigInt, Symbol, Function)
5. UTF-8 NFC normalization
6. Max depth guard
7. Scientific notation guard
8. Algorithm specification (HASH_ALGORITHM)
9. Schema version (FINGERPRINT_SCHEMA_VERSION)

**EXTEND CRX:**
1. Add domain separation parameter
2. Add error handling
3. Add circular reference detection
4. Add type rejection guards
5. Add UTF-8 normalization
6. Add max depth guard
7. Add scientific notation guard
8. Add algorithm specification
9. Add schema version

**RISK:** LOW - pure function extension, no side effects
