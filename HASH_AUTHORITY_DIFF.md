# HASH AUTHORITY DIFF

**Audit Date:** 20260621
**Scope:** PING repository + CascadeProjects
**Task:** Identify every implementation of crypto.createHash, sha256, sha512, digest, hashObject, hashValue, Merkle hashing, identity hashing

---

## CURRENT AUTHORITY

**Authoritative Implementation:**

`runtime/replay/certificate_authority.ts`

**Classification:** AUTHORITATIVE

**Evidence:**
- Pure TypeScript SHA-256 implementation (NIST FIPS 180-4)
- Declared as "sole SHA-256 authority" in comments
- Used by canonical_hash_authority.ts
- No external dependencies
- Runtime-neutral (no Node crypto)

---

## PING RUNTIME IMPLEMENTATIONS

### Delegating Files

**runtime/replay/canonical_hash_authority.ts**
- **Classification:** DELEGATING
- **Usage:** `CertificateAuthority['sha256'](string)`
- **Authority:** Delegates to certificate_authority.ts
- **Status:** CORRECT

**runtime/replay/merkle_tree.ts**
- **Classification:** DELEGATING
- **Usage:** `CertificateAuthority.sha256(...)`
- **Authority:** Delegates to certificate_authority.ts
- **Status:** CORRECT

**runtime/replay/witness_authority.ts**
- **Classification:** DELEGATING
- **Usage:** Uses MerkleTree which delegates to CertificateAuthority
- **Authority:** Delegates to certificate_authority.ts (via MerkleTree)
- **Status:** CORRECT

### Duplicate Implementations

**runtime/replay/node_self_check_adapter.ts**
- **Classification:** DUPLICATE
- **Implementation:** `crypto.createHash('sha256').update(fileBuffer).digest('hex')`
- **Code:**
  ```typescript
  const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();
  ```
- **Authority:** Application-level hashing (bypasses CertificateAuthority)
- **Purpose:** Corpus hash verification during startup
- **Status:** CRITICAL VIOLATION
- **Required Action:** Replace with CertificateAuthority.sha256

---

## CASCADEPROJECTS IMPLEMENTATIONS

### Duplicate Implementations

**CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts**
- **Classification:** DUPLICATE
- **Implementation:** `crypto.createHash("sha256").update(serialized).digest("hex")`
- **Code:**
  ```typescript
  const hash = crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
  ```
- **Authority:** Application-level hashing (bypasses CertificateAuthority)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

**CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts**
- **Classification:** DUPLICATE
- **Implementation:** `crypto.createHash("sha256").update(serialized).digest("hex")`
- **Code:**
  ```typescript
  const hash = crypto
    .createHash("sha256")
    .update(serialized)
    .digest("hex")
  ```
- **Authority:** Application-level hashing (bypasses CertificateAuthority)
- **Status:** CRITICAL VIOLATION
- **Required Action:** DELETE

---

## PYTHON IMPLEMENTATIONS

### Non-Constitutional (Infrastructure)

**brain/infrastructure/docker/scripts/generate_keys.py**
- **Classification:** NON-CONSTITUTIONAL
- **Usage:** `cryptography.hazmat.primitives.hashes.SHA256()`
- **Purpose:** Infrastructure key generation
- **Authority:** Infrastructure utility (not constitutional)
- **Status:** CORRECT (infrastructure, not constitutional)

### Application Metadata

**brain/src/constitutional/event_emitter.py**
- **Classification:** APPLICATION METADATA
- **Usage:** `request_hash`, `response_hash` fields in event payloads
- **Purpose:** Event metadata for tracking
- **Authority:** Application metadata (not constitutional identity)
- **Status:** CORRECT (metadata, not constitutional authority)

---

## SUMMARY

### Current Authority

**runtime/replay/certificate_authority.ts** - AUTHORITATIVE

### Delegates

**PING runtime:** 3 files (all correctly delegating)
**CascadeProjects:** 0 files

### Duplicates

**PING runtime:** 1 file (node_self_check_adapter.ts)
**CascadeProjects:** 2 files (identity_engine.ts in both locations)

### Dead

**None identified**

---

## CONSTITUTIONAL ASSESSMENT

**PING Runtime:** ⚠️ PARTIAL VIOLATION
- Single authoritative implementation
- Most delegates correctly
- 1 duplicate in node_self_check_adapter.ts

**CascadeProjects:** ❌ CRITICAL VIOLATIONS
- 2 duplicate implementations
- No delegation to constitutional authority
- Authority fragmentation

---

## REQUIRED DECISION

**Question:** Can every hash in the repository ultimately delegate to a single replay hash authority?

**Answer:** NO

**Exact Blockers:**

1. **PING runtime:**
   - `runtime/replay/node_self_check_adapter.ts:135` uses `crypto.createHash` directly
   - Does not delegate to CertificateAuthority.sha256
   - Blocker: Startup verification bypasses constitutional hash authority

2. **CascadeProjects:**
   - `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts:9-11` uses `crypto.createHash` directly
   - `CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts:9-11` uses `crypto.createHash` directly
   - Neither delegates to CertificateAuthority.sha256
   - Blocker: Identity generation bypasses constitutional hash authority

---

## REQUIRED ACTIONS

### P0 (Critical)

1. **Fix PING runtime duplicate:**
   - Replace `crypto.createHash` in `node_self_check_adapter.ts:135` with `CertificateAuthority.sha256`
   - Convert file buffer to string input for CertificateAuthority.sha256

2. **Delete CRX_REMOTE duplicate hash implementations:**
   - `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts`
   - `CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts`

### P1 (High)

3. **Ensure any consumers of deleted files delegate to:**
   - `CertificateAuthority.sha256` (if in PING)
   - Or import from `@crx/replay` (if in external packages)

---

## CONSTITUTIONAL DIFF

**Authorities Added:** 0
**Authorities Removed:** 2 (CascadeProjects duplicates)
**Delegation Increased:** YES (by fixing node_self_check_adapter.ts)
**Sovereignty Score:** IMPROVED (if actions taken)
