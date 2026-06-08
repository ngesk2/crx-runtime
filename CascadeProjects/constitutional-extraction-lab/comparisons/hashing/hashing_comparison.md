# Hashing Comparison

## Current CRX Implementation

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
- No domain separation
- No algorithm specification
- No hash verification
- No error handling
- No salt support
- No key derivation
- No multiple hash algorithms
- No hash versioning

---

## Legacy Implementation (canonical_fingerprint_service.js)

**FILE:** JS.txt (lines ~300-800)

```javascript
export const HASH_ALGORITHM = "SHA-256";

function sha256Strict(input) {
  if (
    typeof Utilities !== "undefined" &&
    Utilities.computeDigest
  ) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      input,
      Utilities.Charset.UTF_8
    );
    return bytes
      .map(b => ("0" + (b & 0xff).toString(16)).slice(-2))
      .join("");
  }
  throw new Error("No cryptographic hashing available");
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
- SHA-256 hashing
- Canonicalization before hashing
- JSON serialization
- Hex output
- Domain separation
- Hash verification
- Algorithm specification
- Google Apps Script fallback (Utilities.computeDigest)

---

## Comparison Analysis

**OVERLAP:**
- Both use SHA-256
- Both canonicalize before hashing
- Both use JSON serialization
- Both output hex

**CRX MISSING:**
- Domain separation (CRITICAL for replay stability)
- Hash verification (CRITICAL for integrity)
- Algorithm specification (CRITICAL for replay)
- Error handling (CRITICAL for safety)

**LEGACY MISSING:**
- Node.js crypto API (CRX has this - better)
- TypeScript types (CRX has this - better)
- Simpler implementation (CRX is cleaner)

---

## Replay Relevance

**DOMAIN SEPARATION:**
- CRITICAL - same content produces different hashes in different domains
- Example: artifact "foo" vs event "foo" vs lineage "foo"
- Without domain separation, hash collisions across contexts
- Replay requires context-aware hashing

**HASH VERIFICATION:**
- CRITICAL - enables integrity verification without re-computation
- Supports efficient replay verification
- Enables cached hash validation

**ALGORITHM SPECIFICATION:**
- CRITICAL - enables hash algorithm migration
- Supports replay across algorithm versions
- Enables backward compatibility

---

## Lineage Relevance

**DOMAIN SEPARATION:**
- CRITICAL - lineage hashes need domain separation from artifact hashes
- Enables lineage-specific hashing
- Prevents hash collisions between artifacts and lineage

**HASH VERIFICATION:**
- MEDIUM - enables lineage integrity verification
- Supports efficient lineage validation

---

## Recommendation

**ACTION:** EXTEND identity_engine.ts with legacy capabilities

**EXTRACT FROM LEGACY:**
1. HASH_ALGORITHM constant
2. fingerprint() function (rename from computeCanonicalHash)
3. fingerprintWithDomain() function
4. verifyFingerprint() function
5. Domain separation logic

**KEEP FROM CRX:**
1. Node.js crypto API (better than Google Apps Script)
2. TypeScript types
3. Simpler implementation structure

**RISK:** LOW - pure functions, no side effects

---

## Proposed Extension

```typescript
import { createHash } from 'crypto';
import { canonicalize, CanonicalizeOptions, FINGERPRINT_DOMAINS } from './canonical_engine';

export const HASH_ALGORITHM = "SHA-256";

export interface FingerprintOptions extends CanonicalizeOptions {
  algorithm?: "SHA-256" | "SHA-512";
}

export function computeCanonicalHash(artifact: any): string {
  // Keep existing function for backward compatibility
  const canonical = canonicalize(artifact);
  const serialized = JSON.stringify(canonical);
  const hash = createHash('sha256').update(serialized).digest('hex');
  return hash;
}

export async function fingerprint(value: any, options: FingerprintOptions = {}): Promise<string> {
  const algorithm = options.algorithm || "SHA-256";
  const canonical = canonicalize(value, options);
  const serialized = JSON.stringify(canonical);
  const hash = createHash(algorithm.toLowerCase().replace('-', '')).update(serialized).digest('hex');
  return hash;
}

export async function fingerprintWithDomain(domain: keyof typeof FINGERPRINT_DOMAINS, value: any): Promise<string> {
  return fingerprint(value, { domain });
}

export async function verifyFingerprint(expected: string, value: any, options: FingerprintOptions = {}): Promise<boolean> {
  const actual = await fingerprint(value, options);
  return expected === actual;
}
```

---

## Migration Path

1. Add HASH_ALGORITHM constant to identity_engine.ts
2. Add fingerprint() function
3. Add fingerprintWithDomain() function
4. Add verifyFingerprint() function
5. Keep computeCanonicalHash() for backward compatibility
6. Update commit_controller.ts to use fingerprintWithDomain()
7. Add tests for domain separation
8. Add tests for hash verification
9. Update documentation

---

## Risk Assessment

**LOW RISK:**
- Pure functions, no side effects
- Backward compatible (existing computeCanonicalHash() unchanged)
- TypeScript provides type safety
- Testable in isolation

**MITIGATION:**
- Add comprehensive tests
- Verify backward compatibility
- Document domain separation requirements
