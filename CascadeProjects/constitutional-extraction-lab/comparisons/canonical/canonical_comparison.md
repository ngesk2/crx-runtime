# Canonicalization Comparison

## Current CRX Implementation

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
- No domain separation
- No error handling
- No options validation
- No custom sort functions
- No circular reference detection
- No date/time canonicalization
- No number precision handling
- No special object type handling (Map, Set, etc.)

---

## Legacy Implementation (canonical_fingerprint_service.js)

**FILE:** JS.txt (lines ~300-800)

```javascript
export const FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0";
export const HASH_ALGORITHM = "SHA-256";

export const FINGERPRINT_DOMAINS = Object.freeze({
  AUTHORITY_GRAPH: "authority_graph",
  MERKLE_ANCHOR_ADAPTER: "merkle_anchor_adapter",
  MERKLE_ANCHOR_ADAPTER_MISUSE: "merkle_anchor_adapter_misuse",
  CROSS_ANCHOR_DRIFT: "cross_anchor_drift",
  MERKLE_ANCHOR_CHAIN: "merkle_anchor_chain",
  // ... more domains
});

export class CanonicalizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CanonicalizationError";
  }
}

export function canonicalize(value, options = {}) {
  // Options validation
  if (options && typeof options !== 'object') {
    throw new CanonicalizationError("options must be object");
  }

  // Domain separation
  const domain = options.domain || FINGERPRINT_DOMAINS.DEFAULT;
  
  // Recursive canonicalization with domain prefix
  // ... implementation
}

export async function fingerprint(value, options = {}) {
  const canonical = canonicalize(value, options);
  const serialized = JSON.stringify(canonical);
  const hash = sha256Strict(serialized);
  return hash;
}

export async function fingerprintWithDomain(domain, value) {
  return fingerprint(value, { domain });
}

export async function verifyFingerprint(expected, value, options = {}) {
  const actual = fingerprint(value, options);
  return expected === actual;
}
```

**CAPABILITIES:**
- Domain separation (FINGERPRINT_DOMAINS)
- Error handling (CanonicalizationError)
- Options validation
- Fingerprint verification
- Domain-prefixed fingerprinting
- Schema versioning
- Algorithm specification

---

## Comparison Analysis

**OVERLAP:**
- Both perform recursive canonicalization
- Both sort object keys
- Both handle arrays

**CRX MISSING:**
- Domain separation (CRITICAL for replay stability)
- Error handling (CRITICAL for constitutional compliance)
- Fingerprint verification (CRITICAL for integrity)
- Schema versioning (CRITICAL for replay)
- Options validation (CRITICAL for safety)

**LEGACY MISSING:**
- TypeScript types (CRX has this)
- Simpler implementation (CRX is cleaner)

---

## Replay Relevance

**DOMAIN SEPARATION:**
- CRITICAL - different fingerprint domains prevent hash collisions across different contexts
- Example: artifact fingerprint vs event fingerprint vs lineage fingerprint
- Without domain separation, same content produces same hash regardless of context
- Replay requires context-aware fingerprinting

**FINGERPRINT VERIFICATION:**
- CRITICAL - enables integrity verification without re-computation
- Supports efficient replay verification
- Enables cached fingerprint validation

**SCHEMA VERSIONING:**
- CRITICAL - enables fingerprint migration
- Supports replay across schema versions
- Enables backward compatibility

---

## Lineage Relevance

**DOMAIN SEPARATION:**
- MEDIUM - lineage fingerprints need domain separation from artifact fingerprints
- Enables lineage-specific fingerprinting

**FINGERPRINT VERIFICATION:**
- MEDIUM - enables lineage integrity verification
- Supports efficient lineage validation

---

## Recommendation

**ACTION:** EXTEND canonical_engine.ts with legacy capabilities

**EXTRACT FROM LEGACY:**
1. FINGERPRINT_DOMAINS enum
2. CanonicalizationError class
3. fingerprint() function
4. fingerprintWithDomain() function
5. verifyFingerprint() function
6. Options validation logic

**KEEP FROM CRX:**
1. TypeScript types
2. Cleaner implementation structure
3. Simpler canonicalization logic

**RISK:** LOW - pure functions, no side effects

---

## Proposed Extension

```typescript
export const FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0";
export const HASH_ALGORITHM = "SHA-256";

export const FINGERPRINT_DOMAINS = Object.freeze({
  AUTHORITY_GRAPH: "authority_graph",
  ARTIFACT: "artifact",
  LINEAGE: "lineage",
  EVENT: "event",
  REPLAY: "replay",
  DEFAULT: "default"
} as const);

export type FingerprintDomain = typeof FINGERPRINT_DOMAINS[keyof typeof FINGERPRINT_DOMAINS];

export class CanonicalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalizationError";
  }
}

export interface CanonicalizeOptions {
  domain?: FingerprintDomain;
  skipCircular?: boolean;
  customSort?: (a: string, b: string) => number;
}

export function canonicalize(value: any, options: CanonicalizeOptions = {}): any {
  // Add options validation
  if (options && typeof options !== 'object') {
    throw new CanonicalizationError("options must be object");
  }

  // Keep existing implementation
  // Add circular reference detection if skipCircular
  // Add custom sort if provided
}

export async function fingerprint(value: any, options: CanonicalizeOptions = {}): Promise<string> {
  const canonical = canonicalize(value, options);
  const serialized = JSON.stringify(canonical);
  const hash = await computeSHA256(serialized);
  return hash;
}

export async function fingerprintWithDomain(domain: FingerprintDomain, value: any): Promise<string> {
  return fingerprint(value, { domain });
}

export async function verifyFingerprint(expected: string, value: any, options: CanonicalizeOptions = {}): Promise<boolean> {
  const actual = await fingerprint(value, options);
  return expected === actual;
}
```

---

## Migration Path

1. Add FINGERPRINT_DOMAINS enum to canonical_engine.ts
2. Add CanonicalizationError class
3. Add fingerprint() function
4. Add fingerprintWithDomain() function
5. Add verifyFingerprint() function
6. Update identity_engine.ts to use fingerprintWithDomain()
7. Add tests for domain separation
8. Add tests for fingerprint verification
9. Update documentation

---

## Risk Assessment

**LOW RISK:**
- Pure functions, no side effects
- Backward compatible (existing canonicalize() unchanged)
- TypeScript provides type safety
- Testable in isolation

**MITIGATION:**
- Add comprehensive tests
- Verify backward compatibility
- Document domain separation requirements
