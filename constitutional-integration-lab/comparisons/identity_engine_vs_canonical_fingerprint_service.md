# EXISTING CRX AUTHORITY

**FILE:** runtime/kernel/commit-service/src/engines/identity_engine.ts

```typescript
import { createHash } from 'crypto';
import { canonicalize } from './canonical_engine';

export function computeCanonicalHash(artifact: any): string {
  const canonical = canonicalize(artifact);
  const serialized = JSON.stringify(canonical);
  const hash = createHash('sha256').update(serialized).digest('hex');
  return hash;
}
```

**CAPABILITIES:**
- SHA-256 hashing
- Canonicalization before hashing
- JSON serialization
- Hex output

**MISSING CAPABILITIES:**
- Domain separation
- Hash verification
- Algorithm specification
- Schema version
- Error handling
- Fingerprint domain registry
- Explicit hash verification function

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
  // (full canonicalization implementation with domain separation, error handling, etc.)
}

export async function fingerprint(value, options = {}) {
  const canonical = await canonicalize(value, options);
  const serialized = JSON.stringify(canonical);
  const hash = await computeHash(serialized);
  return hash;
}

export async function fingerprintWithDomain(domain, value, options = {}) {
  if (!DOMAIN_SET.has(domain)) {
    throw new CanonicalizationError(`Invalid domain: ${domain}`);
  }
  const domainPrefixed = { domain, value };
  return await fingerprint(domainPrefixed, options);
}

export async function verifyFingerprint(expected, value, options = {}) {
  const actual = await fingerprint(value, options);
  return actual === expected;
}

async function computeHash(data) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else if (typeof require !== 'undefined') {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  } else {
    throw new CanonicalizationError('No crypto implementation available');
  }
}
```

**CAPABILITIES:**
- SHA-256 hashing
- Canonicalization before hashing
- JSON serialization
- Hex output
- Domain separation (via fingerprintWithDomain)
- Hash verification (via verifyFingerprint)
- Algorithm specification (HASH_ALGORITHM)
- Schema version (FINGERPRINT_SCHEMA_VERSION)
- Error handling (CanonicalizationError)
- Fingerprint domain registry (FINGERPRINT_DOMAINS)
- Runtime-specific crypto selection (WebCrypto vs Node.js crypto)

---

# DIRECT OVERLAP

**OVERLAP:** 80%
- Both perform SHA-256 hashing
- Both canonicalize before hashing
- Both serialize to JSON
- Both output hex strings

---

# MISSING CAPABILITIES

**CRX MISSING:**
- Domain separation (CRITICAL for replay)
- Hash verification (CRITICAL for integrity)
- Algorithm specification (CRITICAL for replay)
- Schema version (CRITICAL for migration)
- Error handling (CRITICAL for safety)
- Fingerprint domain registry (CRITICAL for domain separation)
- Runtime-specific crypto selection (CRITICAL for cross-platform)
- Explicit fingerprintWithDomain function (CRITICAL for domain separation)
- Explicit verifyFingerprint function (CRITICAL for verification)

**ARCHIVE MISSING:**
- TypeScript types (CRX has this - better)
- Simpler API (CRX is simpler for basic use cases - better)

---

# STRONGER IMPLEMENTATION

**ARCHIVE (canonical_fingerprint_service.js) IS STRONGER:**
- Domain separation (CRITICAL for replay)
- Hash verification (CRITICAL for integrity)
- Algorithm specification (CRITICAL for replay)
- Schema version (CRITICAL for migration)
- Error handling (CRITICAL for safety)
- Fingerprint domain registry (CRITICAL for domain separation)
- Runtime-specific crypto selection (CRITICAL for cross-platform)
- Explicit fingerprintWithDomain function (CRITICAL for domain separation)
- Explicit verifyFingerprint function (CRITICAL for verification)

**CRX (identity_engine.ts) IS STRONGER:**
- TypeScript types (better for type safety)
- Simpler API (better for basic use cases)
- Direct Node.js crypto usage (better for Node.js environment)

---

# SAFE REUSE TARGETS

**REUSE ARCHIVE:** canonical_fingerprint_service.js
- Extract domain separation logic (fingerprintWithDomain)
- Extract hash verification logic (verifyFingerprint)
- Extract algorithm specification (HASH_ALGORITHM)
- Extract schema version (FINGERPRINT_SCHEMA_VERSION)
- Extract error handling (CanonicalizationError)
- Extract fingerprint domain registry (FINGERPRINT_DOMAINS)
- Extract runtime-specific crypto selection

**EXTEND CRX:** identity_engine.ts
- Add domain separation parameter
- Add hash verification function
- Add algorithm specification
- Add schema version
- Add error handling
- Add fingerprint domain registry
- Add runtime-specific crypto selection

---

# REPLAY RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - hash collisions across contexts
- CRITICAL: No hash verification - cannot verify integrity
- HIGH: No algorithm specification - algorithm ambiguity
- HIGH: No schema version - migration issues
- HIGH: No error handling - silent failures
- HIGH: No fingerprint domain registry - domain collisions

**ARCHIVE RISKS:**
- LOW: None identified

---

# LINEAGE RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - lineage fingerprint collisions
- CRITICAL: No hash verification - cannot verify lineage integrity
- HIGH: No algorithm specification - algorithm ambiguity
- HIGH: No schema version - migration issues

**ARCHIVE RISKS:**
- LOW: None identified

---

# DETERMINISM RISKS

**CRX RISKS:**
- CRITICAL: No domain separation - hash collisions across contexts
- CRITICAL: No hash verification - cannot verify determinism
- HIGH: No algorithm specification - algorithm ambiguity
- HIGH: No schema version - migration issues

**ARCHIVE RISKS:**
- LOW: None identified

---

# SAFE EXTRACTION CANDIDATES

**EXTRACT FROM ARCHIVE:**
1. fingerprintWithDomain function
2. verifyFingerprint function
3. HASH_ALGORITHM constant
4. FINGERPRINT_SCHEMA_VERSION constant
5. FINGERPRINT_DOMAINS constant
6. CanonicalizationError class
7. Runtime-specific crypto selection logic

**EXTEND CRX:**
1. Add domain separation parameter
2. Add hash verification function
3. Add algorithm specification
4. Add schema version
5. Add error handling
6. Add fingerprint domain registry
7. Add runtime-specific crypto selection

**RISK:** LOW - pure function extension, no side effects
