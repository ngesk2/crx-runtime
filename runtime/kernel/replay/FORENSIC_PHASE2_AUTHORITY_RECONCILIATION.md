# FORENSIC PHASE 2: AUTHORITY RECONCILIATION AUDIT

## READ-ONLY AUDIT
NO PATCHES
NO PORTS
NO REFACTORING

---

## EXECUTIVE SUMMARY

**Finding**: `canonical_fingerprint_service.js` is the **original constitutional authority**. Current Layer 0 replay kernel represents a **partial migration** with critical capabilities lost.

**Evidence**:
- CanonicalHashAuthority.ts line 5: Comment explicitly states "Ported from constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js"
- ReplayVerification.ts line 5: Comment states "Ported from constitutional-integration-lab/extracted/js_txt/deterministic_replay_harness.js"
- Current runtime has NO domain separation, NO verification authority, NO runtime-agnostic byte encoding
- Archive has unified fingerprint authority with all capabilities

**Conclusion**: Migration incomplete. CanonicalHashAuthority is a narrowed fragment extracted from canonical_fingerprint_service.js, not a superseded authority.

---

## 1. DOMAIN SEPARATION COMPATIBILITY

### HASH CONSUMER MAP

| Caller | File | Input Type | Purpose | Domain Required? |
|--------|------|------------|---------|-----------------|
| computeFingerprint | canonical_hash_authority.ts:57 | CanonicalBytes (base64url) | Replay fingerprint | **YES** - missing |
| computeFingerprint | deterministic_replay_engine.ts:60 | CanonicalBytes | Replay fingerprint | **YES** - missing |
| computeFingerprint | witness_authority.ts:53 | CanonicalBytes | Witness fingerprint | **YES** - missing |
| hashBytes | canonical_hash_authority.ts:69 | string (base64url) | Internal hashing | **YES** - missing |
| hashBytes | merkle_tree.ts:91, 249, 260 | Buffer | Merkle node hashing | **NO** - has own domain |
| createHash | constitutional_self_check.ts:83 | Buffer | Corpus verification | **NO** - file hash |
| createHash | identity_engine.ts:10 | string | Artifact hash | **YES** - missing |

### Analysis

**Current Runtime Domain Usage**:
- **MerkleTree**: Uses HASH_DOMAIN_LEAF (0x00) and HASH_DOMAIN_PARENT (0x01) prefixes
- **CanonicalHashAuthority**: NO domain separation - hashes canonical bytes directly
- **identity_engine**: NO domain separation - hashes canonical string directly

**Archive Domain Usage**:
- **FINGERPRINT_DOMAINS**: 18 frozen domains (SNAPSHOT, ARTIFACT, DIFF, RELATIONSHIP, ANCHOR, DRIFT_REPORT, EXECUTION_RECORD, EXECUTION_FAILURE, EXECUTION_ID, EXECUTION_ENVELOPE, SCHEDULER, SCHEDULER_SUMMARY, PLUGIN_SEED, TIMEOUT, CAPABILITY_DECLARATION, STRUCTURAL_NODE, PROJECTION, DIFF_ARTIFACT)

### Compatibility Question

**Can archived FINGERPRINT_DOMAINS be applied directly?**

**Answer**: **YES** - with mapping

**Mapping Required**:
- `SNAPSHOT` → current replay fingerprint (canonical bytes)
- `ARTIFACT` → identity_engine artifact hash
- `RELATIONSHIP` → lineage graph hash
- `PROJECTION` → replay state hash
- `STRUCTURAL_NODE` → Merkle tree node hash (already has domain separation)

**Breaking Change**: **NO** - introducing domain separation would change fingerprints, but this is intentional and required for constitutional correctness.

---

## 2. PREIMAGE COMPATIBILITY AUDIT

### Archive Preimage Construction

```javascript
// canonical_fingerprint_service.js lines 400-414
function lengthPrefix(str) {
  return str.length + "|" + str;
}

function buildPreimage(domain, canonicalString) {
  validateDomain(domain);
  const schemaPart = lengthPrefix(FINGERPRINT_SCHEMA_VERSION);
  const domainPart = lengthPrefix(domain);
  const payloadPart = lengthPrefix(canonicalString);
  return schemaPart + domainPart + payloadPart;
}
```

**Format**: `schema_version|domain|canonical_string` (length-prefixed)

### Current Runtime Preimage Construction

**CanonicalHashAuthority**:
```typescript
// canonical_hash_authority.ts lines 45-51
canonicalize(obj: unknown): CanonicalBytes {
  const canonical = CanonicalJson.canonicalize(obj);
  const bytes = Buffer.from(canonical, 'utf8').toString('base64url');
  return {
    bytes,
    canonicalization_version: this.canonicalizationVersion
  };
}
```

**Format**: `base64url(canonical_json_string)` (no schema, no domain)

### Fingerprint Persistence Locations

| Location | File | Purpose | Current Format |
|----------|------|---------|----------------|
| Replay logs | deterministic_replay_engine.ts:74 | Replay result fingerprint | `sha256:hex` |
| Witness leaves | witness_authority.ts:123 | Witness fingerprint | `sha256:hex` |
| Merkle nodes | merkle_tree.ts:91 | Merkle node hash | `sha256:hex` (with domain prefix) |
| State files | state_serializer.ts:45 | Serialized state | Buffer (via CanonicalJson.toBuffer) |
| Corpus hashes | constitutional_self_check.ts:66 | Certification artifacts | `sha256:hex` (uppercase) |

### Breaking Change Analysis

**Would introducing buildPreimage() change existing replay fingerprints?**

**Answer**: **YES - BREAKING**

**Impact**:
- Current: `sha256(base64url(canonical_json_string))`
- Archive: `sha256(length_prefix(schema) + length_prefix(domain) + length_prefix(canonical_json_string))`

**Breaking Locations**:
- All replay fingerprints (deterministic_replay_engine.ts)
- All witness fingerprints (witness_authority.ts)
- All Merkle node hashes (merkle_tree.ts) - though these already have domain separation
- All corpus hashes (constitutional_self_check.ts)

**Mitigation**: This is a **constitutional breaking change** required for correctness. The current implementation is non-constitutional (no domain separation, no schema version).

---

## 3. MERKLE COMPATIBILITY AUDIT

### MerkleTree Hash Model

**File**: `runtime/replay/merkle_tree.ts`

**Evidence**:
```typescript
// Lines 20-22
export const HASH_DOMAIN_LEAF = 0x00;
export const HASH_DOMAIN_PARENT = 0x01;

// Lines 249-252
private hashBytes(bytes: Buffer, isLeaf: boolean = true): string {
  const prefix = isLeaf ? Buffer.from([HASH_DOMAIN_LEAF]) : Buffer.from([HASH_DOMAIN_PARENT]);
  const combined = Buffer.concat([prefix, bytes]);
  return crypto.createHash('sha256').update(combined).digest('hex');
}

// Lines 258-260
private hashParent(left: Buffer, right: Buffer): string {
  const combined = Buffer.concat([left, right]);
  return this.hashBytes(combined, false);
}
```

**Analysis**:
- MerkleTree uses **domain-separated hashes** (HASH_DOMAIN_LEAF, HASH_DOMAIN_PARENT)
- MerkleTree uses **raw SHA-256** (crypto.createHash) with byte prefixes
- MerkleTree does NOT use CanonicalHashAuthority.computeFingerprint()
- MerkleTree does NOT use canonical_fingerprint_service.js

### Merkle Hash Model Classification

**MERKLE HASH MODEL**: **DOMAIN-SEPARATED RAW HASH TREE**

**Evidence**:
- Line 250: `Buffer.from([HASH_DOMAIN_LEAF])` - domain prefix
- Line 252: `crypto.createHash('sha256').update(combined).digest('hex')` - raw SHA-256
- No delegation to CanonicalHashAuthority
- No delegation to canonical_fingerprint_service.js

**Constitutional Implications**:
- MerkleTree is **intentionally using raw hashes** for tree topology
- MerkleTree has its own domain separation (HASH_DOMAIN_LEAF, HASH_DOMAIN_PARENT)
- MerkleTree should **NOT** consume fingerprint authority
- MerkleTree is **NOT violating authority boundaries** - it's a separate constitutional authority

**Recommendation**: Keep MerkleTree as-is. It's a separate constitutional authority for tree topology, not a fingerprint consumer.

---

## 4. BYTE AUTHORITY PROVENANCE

### TextEncoder/Uint8Array Search Results

**Search**: `TextEncoder` across C:\Users\nolan\CRX
**Results**: 
- Only found in node_modules (pg library, TypeScript lib.dom.d.ts, lib.webworker.d.ts)
- **NOT used in runtime/replay/*.ts files**

**Search**: `Uint8Array` across C:\Users\nolan\CRX
**Results**:
- Only found in node_modules (TypeScript types, pg library)
- **NOT used in runtime/replay/*.ts files**

### Buffer.from Search Results

**Search**: `Buffer.from` across C:\Users\nolan\CRX\runtime\replay
**Results**:
- canonical_event_envelope.ts:115
- canonical_hash_authority.ts:47, 70
- canonical_json.ts:171
- merkle_tree.ts:141, 142, 146, 147, 185, 186, 250, 267
- witness_authority.ts:119, 124, 134, 139, 144, 149, 154, 159, 164, 187, 192

### Archive Byte Authority

**canonical_fingerprint_service.js**:
```javascript
// Lines 358-375
async function sha256Hex(inputString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);

  if (typeof globalThis.crypto !== "undefined" && globalThis.crypto.subtle) {
    const buffer = await globalThis.crypto.subtle.digest(HASH_ALGORITHM, data);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  try {
    const nodeCrypto = await import("crypto");
    return nodeCrypto.createHash("sha256").update(inputString, "utf8").digest("hex");
  } catch {
    throw new Error("No compatible crypto implementation available");
  }
}
```

**Analysis**:
- Archive uses **TextEncoder** for UTF-8 encoding
- Archive uses **Uint8Array** for byte manipulation
- Archive uses **WebCrypto + Node fallback** for runtime-agnostic crypto

### BYTE AUTHORITY PROVENANCE CLASSIFICATION

**Classification**: **EMBEDDED AUTHORITY ONLY**

**Evidence**:
- Archive embeds TextEncoder/Uint8Array inside canonical_fingerprint_service.js
- Archive does NOT have a separate CanonicalByteAuthority class
- Archive treats byte encoding as internal implementation detail
- Current runtime replaced TextEncoder/Uint8Array with Buffer.from (Node-only)

**Conclusion**: The archive did NOT intend a standalone CanonicalByteAuthority. TextEncoder/Uint8Array were embedded implementation details for runtime-agnostic encoding. Current runtime violated this by using Node-only Buffer.

---

## 5. VERIFICATION AUTHORITY GAP

### Fingerprint Generation/Storage/Comparison

**Generation**:
- canonical_hash_authority.ts:57 - computeFingerprint()
- deterministic_replay_engine.ts:60 - calls computeFingerprint()
- witness_authority.ts:53 - calls computeFingerprint()

**Storage**:
- replay_types.ts:77 - Fingerprint interface
- replay_types.ts:123 - fingerprint in ReplayResult
- witness_authority.ts:110 - fingerprint parameter
- witness_authority.ts:123 - fingerprint as witness leaf

**Comparison**:
- replay_verification.ts:41 - compareFingerprints()
- replay_verification.ts:62 - verifyFingerprint()
- replay_verification.ts:104 - compareFingerprints()
- replay_verification.ts:128 - compareFingerprints()

### Archive Verification Authority

**canonical_fingerprint_service.js**:
```javascript
// Lines 455-467
export async function verifyFingerprint(
  value,
  expectedHash,
  options = {}
) {
  validateExpectedHashFormat(expectedHash);
  const computed = await fingerprint(value, options);
  return computed === expectedHash;
}
```

**Capabilities**:
- Expected hash format validation (64-char hex)
- Computed vs expected comparison
- Domain-aware verification

### Current Runtime Verification Authority

**ReplayVerification**:
```typescript
// replay_verification.ts lines 62-64
verifyFingerprint(eventStream: ReplayEventStream, expectedFingerprint: Fingerprint): boolean {
  const actualResult = this.engine.replay(eventStream);
  return this.compareFingerprints(actualResult.fingerprint, expectedFingerprint);
}

// Lines 128-132
private compareFingerprints(actual: Fingerprint, expected: Fingerprint): boolean {
  return actual.hash === expected.hash &&
         actual.hash_algorithm === expected.hash_algorithm &&
         actual.hash_version === expected.hash_version;
}
```

**Capabilities**:
- Computed vs expected comparison
- Hash algorithm comparison
- Hash version comparison
- **NO expected hash format validation**
- **NO domain-aware verification**

### VERIFICATION AUTHORITY MAP

| Authority | Owner | Responsibility | Current Implementation | Archive Implementation | Status |
|-----------|-------|----------------|------------------------|----------------------|--------|
| verifyFingerprint | canonical_fingerprint_service.js | Expected hash validation + computed comparison | **MISSING** - replaced by ReplayVerification.compareFingerprints | validateExpectedHashFormat() + computed comparison | **LOST** |
| compareFingerprints | ReplayVerification | Computed vs expected comparison | actual.hash === expected.hash + algorithm/version check | computed === expected | **DIFFERENT** |
| corpus verification | constitutional_self_check | File hash verification | crypto.createHash('sha256') + expected/actual comparison | N/A (archive didn't have corpus) | **PRESENT** |

### Verification Authority Gap Analysis

**Did migration lose verifyFingerprint()?**

**Answer**: **YES - PARTIALLY**

**Lost**:
- Expected hash format validation (64-char hex check)
- Domain-aware verification (archive had domain parameter)
- Standalone verification function

**Replaced by**:
- ReplayVerification.verifyFingerprint() - replay-level verification
- ReplayVerification.compareFingerprints() - fingerprint comparison
- constitutional_self_check - corpus file verification

**Conclusion**: Verification authority was **replaced**, not lost. Current runtime has replay-level verification but lost cryptographic-level verification (hash format validation, domain awareness).

---

## 6. CONSTITUTIONAL CHECK

### Authority Comparison Matrix

| Authority | Owner | Responsibility | Current Implementation | Archive Implementation | Status |
|-----------|-------|----------------|------------------------|----------------------|--------|
| **CanonicalJson** | CanonicalJson class | JSON canonicalization (RFC-8785) | canonicalize() + toBuffer() (Buffer.from) | canonicalize() (no toBuffer) | **VIOLATION** - Buffer.from |
| **CanonicalHashAuthority** | CanonicalHashAuthority class | SHA-256 hashing + fingerprint | computeFingerprint() (no domain, no verification) | fingerprint() + fingerprintWithDomain() + verifyFingerprint() | **FRAGMENT** - narrowed from archive |
| **WitnessAuthority** | WitnessAuthority class | Witness composition | generateWitness() (uses Buffer.from) | N/A (archive didn't have witness) | **VIOLATION** - Buffer.from |
| **MerkleTree** | MerkleTree class | Merkle tree topology | hashBytes() (domain-separated raw SHA-256) | N/A (archive didn't have Merkle) | **CONSTITUTIONAL** - separate authority |
| **identity_engine** | commit-service | Artifact hashing | computeCanonicalHash() (no domain) | N/A (archive didn't have identity) | **VIOLATION** - no domain separation |
| **canonical_fingerprint_service** | Archive (constitutional-integration-lab) | Unified fingerprint authority | **MISSING** - not ported | fingerprint() + fingerprintWithDomain() + verifyFingerprint() + FINGERPRINT_DOMAINS + FINGERPRINT_SCHEMA_VERSION + HASH_ALGORITHM | **LOST** - original authority |

### Authority Ownership Analysis

**Original Constitutional Authority**: `canonical_fingerprint_service.js`

**Current Runtime Authorities**:
- **CanonicalJson**: Owns canonicalization only (should NOT own byte encoding)
- **CanonicalHashAuthority**: Owns hashing only (fragment of archive)
- **WitnessAuthority**: Owns witness composition only (should NOT own byte encoding)
- **MerkleTree**: Owns tree topology only (constitutional - separate authority)
- **identity_engine**: Owns artifact hashing only (fragment of archive)

**Authority Fragmentation**:
- Archive: Unified fingerprint authority (hashes + domains + verification + byte encoding)
- Current: Fragmented authorities (CanonicalJson, CanonicalHashAuthority, WitnessAuthority, MerkleTree, identity_engine)

**Authority Inversion**:
- Archive: Fingerprint authority was constitutional root
- Current: Canonicalization became root (CanonicalJson)

---

## FINAL DETERMINATION

### Question: Is canonical_fingerprint_service.js the original constitutional authority?

**Answer**: **YES - CONCLUSIVE EVIDENCE**

**Evidence**:
1. CanonicalHashAuthority.ts line 5: Explicit comment "Ported from constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js"
2. Archive has unified fingerprint authority with all capabilities
3. Current runtime has fragmented authorities with missing capabilities
4. Comparison docs confirm archive has capabilities current runtime lacks
5. Current runtime is architecturally incomplete (no domain separation, no verification, no runtime-agnostic byte encoding)

### Question: Is canonical_fingerprint_service.js a superseded authority?

**Answer**: **NO**

**Evidence**:
- Current runtime does NOT have equivalent capabilities
- Current runtime is missing: domain separation, verification authority, schema version, algorithm specification, runtime-agnostic byte encoding
- Current runtime has constitutional violations (Buffer.from, Node-only crypto)
- Migration was incomplete, not a supersession

### Question: Is canonical_fingerprint_service.js a side-branch implementation?

**Answer**: **NO**

**Evidence**:
- Current runtime explicitly states it was ported from archive
- Current runtime is a narrowed fragment, not a parallel implementation
- Archive has capabilities current runtime lacks
- Comparison docs confirm archive is stronger implementation

### Question: Is canonical_fingerprint_service.js partially migrated into current Layer 0?

**Answer**: **YES - PARTIAL MIGRATION**

**Evidence**:
- CanonicalHashAuthority is a narrowed fragment (hashing only, no domain, no verification)
- CanonicalJson is partially ported (canonicalization only, lost byte encoding)
- MerkleTree is new (not in archive, but constitutional as separate authority)
- WitnessAuthority is new (not in archive, but has Buffer violations)
- Lost capabilities: domain separation, verification authority, schema version, algorithm specification, runtime-agnostic byte encoding

---

## RECOMMENDATION

**DO NOT**: Create new crypto logic, invent new canonicalization engine, rewrite replay, patch Buffer usage piecemeal

**DO**: Surgically restore missing constitutional authorities from archive

**Recovery Priority**:
1. **P0**: Port FINGERPRINT_DOMAINS (18 domains)
2. **P0**: Port fingerprintWithDomain() function
3. **P0**: Port verifyFingerprint() function
4. **P0**: Port FINGERPRINT_SCHEMA_VERSION constant
5. **P0**: Port HASH_ALGORITHM constant
6. **P0**: Port buildPreimage() function (length-prefixed)
7. **P1**: Port runtime-agnostic crypto (WebCrypto + Node fallback)
8. **P1**: Replace Buffer.from with TextEncoder/Uint8Array
9. **P2**: Port type rejection guards (BigInt, Symbol, Function)
10. **P2**: Port max depth guard

**Correct End-State Authority Graph**:
- CanonicalJson: Owns canonicalization only
- CanonicalByteAuthority: Owns utf8 encode/decode, base64url, hex conversion, Uint8Array operations
- CanonicalHashAuthority: Owns SHA-256, domain separation, preimage construction, verification
- MerkleAuthority: Owns tree topology only (keep as-is)
- WitnessAuthority: Owns witness composition only (remove Buffer violations)

**Breaking Changes Required**: YES - introducing domain separation and preimage construction will change all fingerprints. This is constitutional and required for correctness.
