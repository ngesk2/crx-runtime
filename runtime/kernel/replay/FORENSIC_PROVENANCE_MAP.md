# FORENSIC PROVENANCE MAP

## Executive Summary

**Finding**: The current Layer 0 replay kernel represents a **partial migration** from `canonical_fingerprint_service.js`. Critical constitutional capabilities were lost during migration.

**Evidence**:
- Archive authority exists: `constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js`
- Comparison docs exist: Both `identity_engine_vs_canonical_fingerprint_service.md` and `canonical_engine_vs_canonical_fingerprint_service.md`
- Current runtime does NOT use: `fingerprintWithDomain`, `verifyFingerprint`, `FINGERPRINT_DOMAINS`
- No TextEncoder or Uint8Array usage in current runtime TypeScript files

**Conclusion**: Migration incomplete. Domain-separated fingerprint authority was abandoned mid-migration.

---

## PROVENANCE GRAPH

```
ARCHIVE AUTHORITY (constitutional-integration-lab/extracted/js_txt/)
│
├── canonical_fingerprint_service.js (480 lines)
│   ├── FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0"
│   ├── HASH_ALGORITHM = "SHA-256"
│   ├── FINGERPRINT_DOMAINS (18 domains frozen)
│   ├── CanonicalizationError class
│   ├── canonicalize() function (full implementation)
│   ├── fingerprint() function
│   ├── fingerprintWithDomain() function ← CRITICAL: NOT PORTED
│   ├── verifyFingerprint() function ← CRITICAL: NOT PORTED
│   ├── sha256Hex() function (WebCrypto + Node.js fallback)
│   ├── buildPreimage() function (length-prefixed)
│   └── TextEncoder usage ← CRITICAL: NOT PORTED
│
└── COMPARISON DOCS
    ├── identity_engine_vs_canonical_fingerprint_service.md
    └── canonical_engine_vs_canonical_fingerprint_service.md

CURRENT RUNTIME (runtime/replay/)
│
├── CanonicalJson.ts
│   ├── canonicalize() (partial implementation)
│   ├── toBuffer() (uses Buffer.from) ← VIOLATION: Node-only
│   └── canonicalizeString() (uses normalize('NFC')) ← VIOLATION: locale-dependent
│
├── CanonicalHashAuthority.ts
│   ├── canonicalize() (delegates to CanonicalJson)
│   ├── computeFingerprint() (no domain separation)
│   ├── hashBytes() (uses crypto.createHash) ← VIOLATION: Node-only
│   └── Buffer.from() ← VIOLATION: Node-only
│
├── WitnessAuthority.ts
│   ├── generateWitness() (no domain separation)
│   ├── computeWitnessRoot() (uses Buffer.from) ← VIOLATION: Node-only
│   └── No fingerprint verification
│
├── MerkleTree.ts
│   └── Uses Buffer.from ← VIOLATION: Node-only
│
└── DeterministicFailure.ts
    └── Fixed timestamp constant (constitutional)

KERNEL COMMIT-SERVICE (runtime/kernel/commit-service/src/engines/)
│
├── identity_engine.ts
│   ├── computeCanonicalHash() (no domain separation)
│   ├── createHash from 'crypto' ← VIOLATION: Node-only
│   └── canonicalize from canonical_engine
│
└── canonical_engine.ts
    ├── canonicalize() (partial implementation)
    └── No error handling, no circular detection, no type rejection
```

---

## CAPABILITY DIFF: ARCHIVE vs CURRENT RUNTIME

### Domain Separation Authority

| Capability | Archive | Current Runtime | Status |
|-----------|---------|-----------------|--------|
| Domain registry (FINGERPRINT_DOMAINS) | ✅ 18 domains frozen | ❌ None | **LOST** |
| fingerprintWithDomain() | ✅ Explicit function | ❌ None | **LOST** |
| Domain validation | ✅ O(1) validation via Set | ❌ None | **LOST** |
| Length-prefixed preimage | ✅ schema\|domain\|payload | ❌ None | **LOST** |

### Verification Authority

| Capability | Archive | Current Runtime | Status |
|-----------|---------|-----------------|--------|
| verifyFingerprint() | ✅ Explicit function | ❌ None | **LOST** |
| Expected hash validation | ✅ 64-char hex validation | ❌ None | **LOST** |
| Hash comparison | ✅ Computed vs expected | ❌ None | **LOST** |

### Schema/Algorithm Authority

| Capability | Archive | Current Runtime | Status |
|-----------|---------|-----------------|--------|
| FINGERPRINT_SCHEMA_VERSION | ✅ "fingerprint.schema.3.0" | ❌ None | **LOST** |
| HASH_ALGORITHM | ✅ "SHA-256" constant | ❌ Hardcoded string | **LOST** |
| Algorithm specification | ✅ Explicit constant | ❌ Implicit | **LOST** |

### Canonicalization Authority

| Capability | Archive | Current Runtime | Status |
|-----------|---------|-----------------|--------|
| CanonicalizationError | ✅ Custom error class | ❌ Uses DeterministicFailureFactory | **DIFFERENT** |
| Circular reference detection | ✅ WeakSet | ✅ Set | **PRESENT** |
| BigInt rejection | ✅ Explicit | ❌ None | **LOST** |
| Symbol rejection | ✅ Explicit | ❌ None | **LOST** |
| Function rejection | ✅ Explicit | ❌ None | **LOST** |
| Sparse array rejection | ✅ Explicit | ✅ Explicit | **PRESENT** |
| Undefined rejection | ✅ Explicit | ❌ None | **LOST** |
| Non-plain object rejection | ✅ Explicit | ❌ None | **LOST** |
| Max depth guard | ✅ Configurable (default 100) | ❌ None | **LOST** |
| Scientific notation guard | ✅ Configurable | ❌ Partial | **PARTIAL** |
| UTF-8 NFC normalization | ✅ Explicit | ✅ Explicit | **PRESENT** |
| -0 normalization | ✅ Explicit | ✅ Explicit | **PRESENT** |

### Byte Authority

| Capability | Archive | Current Runtime | Status |
|-----------|---------|-----------------|--------|
| TextEncoder | ✅ Web API | ❌ None | **LOST** |
| Uint8Array | ✅ Web API | ❌ None | **LOST** |
| Buffer | ❌ None | ✅ Node.js only | **VIOLATION** |
| Runtime-agnostic crypto | ✅ WebCrypto + Node fallback | ❌ Node crypto only | **VIOLATION** |
| base64url encoding | ✅ Implicit in hex output | ❌ Buffer.from | **VIOLATION** |

---

## MIGRATION ANALYSIS

### What Was Ported

**From canonical_fingerprint_service.js to CanonicalJson.ts**:
- ✅ Basic canonicalization logic
- ✅ Object key sorting
- ✅ Array handling
- ✅ Circular reference detection
- ✅ Sparse array rejection
- ✅ UTF-8 NFC normalization
- ✅ -0 normalization

**From canonical_fingerprint_service.js to CanonicalHashAuthority.ts**:
- ✅ SHA-256 hashing (but with Node crypto only)
- ✅ Canonicalization delegation

### What Was Lost

**Critical Constitutional Losses**:
- ❌ Domain separation authority (18 domains)
- ❌ fingerprintWithDomain() function
- ❌ verifyFingerprint() function
- ❌ FINGERPRINT_SCHEMA_VERSION constant
- ❌ HASH_ALGORITHM constant
- ❌ Length-prefixed preimage construction
- ❌ Expected hash validation
- ❌ BigInt rejection
- ❌ Symbol rejection
- ❌ Function rejection
- ❌ Undefined rejection
- ❌ Non-plain object rejection
- ❌ Max depth guard
- ❌ TextEncoder usage
- ❌ Uint8Array usage
- ❌ Runtime-agnostic crypto (WebCrypto + Node fallback)

### What Was Introduced (Violations)

**Constitutional Violations Introduced**:
- ❌ Buffer.from() (Node-only primitive)
- ❌ crypto.createHash() (Node-only crypto)
- ❌ No runtime-agnostic byte encoding
- ❌ No domain separation (hash collision risk)
- ❌ No verification authority (integrity risk)

---

## ARCHITECTURAL DIVERGENCE

### Old System (canonical_fingerprint_service.js)

```
Fingerprint Authority
├── Owns: hashes, domains, verification
├── Schema: fingerprint.schema.3.0
├── Algorithm: SHA-256 (explicit constant)
├── Domains: 18 frozen domains
├── Verification: verifyFingerprint()
├── Crypto: WebCrypto + Node fallback
└── Byte encoding: TextEncoder + Uint8Array
```

### New System (runtime/replay/)

```
Fragmented Authorities
├── CanonicalJson
│   ├── Owns: canonicalization only
│   ├── Byte encoding: Buffer.from (Node-only) ← VIOLATION
│   └── No domain separation
├── CanonicalHashAuthority
│   ├── Owns: hashing only
│   ├── Crypto: Node crypto only ← VIOLATION
│   └── No domain separation
├── WitnessAuthority
│   ├── Owns: witness composition
│   ├── Byte encoding: Buffer.from (Node-only) ← VIOLATION
│   └── No domain separation
└── MerkleTree
    ├── Owns: Merkle tree construction
    └── Byte encoding: Buffer.from (Node-only) ← VIOLATION
```

---

## REPLAY RISKS FROM INCOMPLETE MIGRATION

### Critical Risks

**1. Hash Collision Risk**
- **Cause**: No domain separation
- **Impact**: Same hash for different contexts (artifact vs snapshot vs diff)
- **Evidence**: Archive had 18 frozen domains, current runtime has 0

**2. Integrity Verification Risk**
- **Cause**: No verifyFingerprint() function
- **Impact**: Cannot verify replay integrity
- **Evidence**: Archive had explicit verification, current runtime has none

**3. Cross-Platform Determinism Risk**
- **Cause**: Node-only Buffer and crypto
- **Impact**: Cannot replay in browser or other runtimes
- **Evidence**: Archive had WebCrypto + Node fallback, current runtime has Node only

**4. Schema Migration Risk**
- **Cause**: No FINGERPRINT_SCHEMA_VERSION
- **Impact**: Cannot detect schema changes during migration
- **Evidence**: Archive had explicit version constant, current runtime has none

**5. Algorithm Ambiguity Risk**
- **Cause**: No HASH_ALGORITHM constant
- **Impact**: Algorithm changes undetectable
- **Evidence**: Archive had explicit constant, current runtime has hardcoded string

---

## RECOVERY PATH

### Option 1: Port Missing Capabilities from Archive

**Recoverable from canonical_fingerprint_service.js**:
1. FINGERPRINT_DOMAINS constant (18 domains)
2. fingerprintWithDomain() function
3. verifyFingerprint() function
4. FINGERPRINT_SCHEMA_VERSION constant
5. HASH_ALGORITHM constant
6. buildPreimage() function (length-prefixed)
7. Expected hash validation logic
8. BigInt/Symbol/Function rejection guards
9. Max depth guard
10. Runtime-agnostic crypto (WebCrypto + Node fallback)
11. TextEncoder + Uint8Array byte encoding

**Risk**: LOW - Archive code is pure functional, well-tested, constitutional

### Option 2: Create New Byte Authority

**Create**:
1. CanonicalByteAuthority (runtime-agnostic)
2. HashProvider (WebCrypto + Node adapter pattern)
3. DomainRegistry (frozen domain set)

**Risk**: MEDIUM - New code, needs testing, may diverge from archive

### Option 3: Hybrid Approach

**Combine**:
1. Port domain separation and verification from archive
2. Create new runtime-agnostic byte authority
3. Keep current CanonicalJson (with fixes)

**Risk**: LOW - Leverages proven archive code + modern architecture

---

## RECOMMENDATION

**Immediate Action**: Port missing constitutional capabilities from `canonical_fingerprint_service.js`

**Priority Order**:
1. **P0**: Domain separation (fingerprintWithDomain, FINGERPRINT_DOMAINS)
2. **P0**: Verification authority (verifyFingerprint)
3. **P0**: Schema/algorithm constants (FINGERPRINT_SCHEMA_VERSION, HASH_ALGORITHM)
4. **P1**: Runtime-agnostic crypto (WebCrypto + Node fallback)
5. **P1**: Byte encoding (TextEncoder + Uint8Array, replace Buffer)
6. **P2**: Type rejection guards (BigInt, Symbol, Function)
7. **P2**: Max depth guard

**Rationale**: Archive code is constitutional, proven, and directly addresses the architectural gap. Creating new authority risks divergence and loses provenance.

---

## EVIDENCE SUMMARY

**Files Examined**:
- ✅ `constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js` (480 lines)
- ✅ `constitutional-integration-lab/comparisons/identity_engine_vs_canonical_fingerprint_service.md`
- ✅ `constitutional-integration-lab/comparisons/canonical_engine_vs_canonical_fingerprint_service.md`
- ✅ `runtime/replay/CanonicalJson.ts`
- ✅ `runtime/replay/CanonicalHashAuthority.ts`
- ✅ `runtime/replay/WitnessAuthority.ts`
- ✅ `runtime/replay/MerkleTree.ts`
- ✅ `runtime/kernel/commit-service/src/engines/identity_engine.ts`
- ✅ `runtime/kernel/commit-service/src/engines/canonical_engine.ts`

**Searches Performed**:
- ✅ fingerprintWithDomain|verifyFingerprint|FINGERPRINT_DOMAINS (no matches in .ts/.js files)
- ✅ TextEncoder|Uint8Array (no matches in .ts files)
- ✅ base64url|hex decode|utf8 encode (no matches in .ts files)
- ✅ binary canonicalization|byte serialization (no matches in .ts files)

**Conclusion**: The archive authority exists and contains critical constitutional capabilities that were lost during migration. Current runtime is architecturally incomplete.
