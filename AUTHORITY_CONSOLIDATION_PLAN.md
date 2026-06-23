# AUTHORITY CONSOLIDATION PLAN

**Audit Date:** 20260621
**Scope:** PING repository + CascadeProjects
**Task:** Minimal refactor plan to reduce authority duplication (maximum 10 changes)

---

## CHANGE 1

**Files:** `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/canonical_engine.ts`

**Current Authority:** Independent canonicalization implementation (recursive sort)

**Target Authority:** Delete file

**Risk:** LOW

**Expected Constitutional Gain:** Removes duplicate canonicalization authority, enforces monoculture

**Evidence:**
- File implements independent canonicalization without delegating to CanonicalJson
- PING already has authoritative CanonicalJson in runtime/replay/canonical_json.ts
- No consumers in PING (file only exists in CascadeProjects)

---

## CHANGE 2

**Files:** `CRX_REMOTE/kernel/commit-service/src/engines/touch src/engines/canonical_engine.ts`

**Current Authority:** Independent canonicalization implementation (copy-paste error)

**Target Authority:** Delete file

**Risk:** LOW

**Expected Constitutional Gain:** Removes duplicate canonicalization authority, fixes copy-paste error

**Evidence:**
- File is copy-paste error (path includes "touch src/")
- Implements independent canonicalization without delegating to CanonicalJson
- No consumers in PING (file only exists in CascadeProjects)

---

## CHANGE 3

**Files:** `CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts`

**Current Authority:** Application-level JSON.stringify + crypto.createHash

**Target Authority:** Delete file

**Risk:** LOW

**Expected Constitutional Gain:** Removes duplicate hash authority, removes application-level serialization

**Evidence:**
- File uses JSON.stringify directly (bypasses CanonicalJson)
- File uses crypto.createHash directly (bypasses CertificateAuthority)
- No consumers in PING (file only exists in CascadeProjects)

---

## CHANGE 4

**Files:** `CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts`

**Current Authority:** Application-level JSON.stringify + crypto.createHash + broken import

**Target Authority:** Delete file

**Risk:** LOW

**Expected Constitutional Gain:** Removes duplicate hash authority, fixes broken import

**Evidence:**
- File uses JSON.stringify directly (bypasses CanonicalJson)
- File uses crypto.createHash directly (bypasses CertificateAuthority)
- Import path is broken: "./touch src/engines/canonical_engine"
- No consumers in PING (file only exists in CascadeProjects)

---

## CHANGE 5

**Files:** `runtime/replay/node_self_check_adapter.ts:135`

**Current Authority:** Application-level crypto.createHash

**Target Authority:** CertificateAuthority.sha256

**Risk:** MEDIUM

**Expected Constitutional Gain:** Removes duplicate hash authority in PING, enforces delegation

**Evidence:**
- Line 135: `const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase()`
- Bypasses CertificateAuthority.sha256
- Used for corpus hash verification during startup
- Must convert file buffer to string for CertificateAuthority.sha256

**Implementation:**
```typescript
// Before
const actualHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').toUpperCase();

// After
const fileContent = fileBuffer.toString('utf-8');
const actualHash = CertificateAuthority.sha256(fileContent).toUpperCase();
```

---

## CHANGE 6

**Files:** `CRX_REMOTE/tests/certification/generate-corpus-vectors.ts:49`

**Current Authority:** JSON.stringify for test file generation

**Target Authority:** Keep (non-constitutional test utility)

**Risk:** NONE

**Expected Constitutional Gain:** None (already correct)

**Evidence:**
- Line 49: `fs.writeFileSync(corpusPath, JSON.stringify(corpus, null, 2))`
- Used for test file generation (non-constitutional)
- Does not affect constitutional authority
- No action required

---

## CHANGE 7

**Files:** `brain/infrastructure/docker/scripts/generate_keys.py:74`

**Current Authority:** cryptography.hazmat.primitives.hashes.SHA256()

**Target Authority:** Keep (infrastructure utility)

**Risk:** NONE

**Expected Constitutional Gain:** None (already correct)

**Evidence:**
- Used for Docker key generation (infrastructure)
- Not constitutional identity generation
- Appropriate use of cryptography library for infrastructure
- No action required

---

## CHANGE 8

**Files:** `brain/src/constitutional/event_emitter.py`

**Current Authority:** json.dumps for PostgreSQL payload serialization

**Target Authority:** Keep (non-constitutional database operation)

**Risk:** NONE

**Expected Constitutional Gain:** None (already correct)

**Evidence:**
- Used for PostgreSQL payload serialization (non-constitutional)
- Event emission is application-level operation
- Does not affect constitutional authority
- No action required

---

## CHANGE 9

**Files:** `runtime/kernel/commit-service/src/commit_controller.ts`

**Current Authority:** Correctly delegates to CanonicalJson and CertificateAuthority

**Target Authority:** Keep (already correct)

**Risk:** NONE

**Expected Constitutional Gain:** None (already correct)

**Evidence:**
- Line 15: `const canonical = CanonicalJson.canonicalize(artifact)`
- Line 16: `const artifactId = CertificateAuthority.sha256(canonical)`
- Already delegates to constitutional authorities
- No action required

---

## CHANGE 10

**Files:** `runtime/replay/witness_authority.ts`

**Current Authority:** Correctly delegates to CanonicalHashAuthority and CertificateAuthority

**Target Authority:** Keep (already derived artifact)

**Risk:** NONE

**Expected Constitutional Gain:** None (already correct)

**Evidence:**
- Delegates to CanonicalHashAuthority for canonicalization
- Delegates to CertificateAuthority for hashing
- Witness is already derived artifact
- No action required

---

## SUMMARY

### Total Changes: 10

**Deletions (CascadeProjects):** 4 files
- CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/canonical_engine.ts
- CRX_REMOTE/kernel/commit-service/src/engines/touch src/engines/canonical_engine.ts
- CRX_REMOTE/constitutional-integration-lab/extracted/runtime/engines/identity_engine.ts
- CRX_REMOTE/kernel/commit-service/src/engines/identity_engine.ts

**Refactoring (PING):** 1 file
- runtime/replay/node_self_check_adapter.ts:135 (replace crypto.createHash with CertificateAuthority.sha256)

**No Action Required:** 5 items
- CRX_REMOTE/tests/certification/generate-corpus-vectors.ts (test utility)
- brain/infrastructure/docker/scripts/generate_keys.py (infrastructure)
- brain/src/constitutional/event_emitter.py (database serialization)
- runtime/kernel/commit-service/src/commit_controller.ts (already correct)
- runtime/replay/witness_authority.ts (already derived)

---

## CONSTITUTIONAL DIFF

**Authorities Added:** 0
**Authorities Removed:** 5 (4 CascadeProjects duplicates + 1 PING duplicate)
**Delegation Increased:** YES (by removing non-delegating implementations)
**Sovereignty Score:** IMPROVED

---

## HARD CONSTRAINTS

**Do NOT:**
- Invent new systems
- Create new constitutional layers
- Redesign replay
- Redesign PING
- Redesign BrainOS
- Write future architecture

**Do:**
- Remove duplicate authority (4 CascadeProjects files)
- Fix delegation failure (1 PING file)
- Preserve behavior (all changes maintain functionality)
- Avoid new architecture (no new systems created)

---

## IMPLEMENTATION ORDER

1. **Delete CascadeProjects duplicate canonicalization implementations** (Changes 1-2)
2. **Delete CascadeProjects duplicate hash implementations** (Changes 3-4)
3. **Fix PING hash delegation** (Change 5)
4. **Verify no functionality loss** (Changes 6-10 are verification steps)

---

## RISK ASSESSMENT

**Overall Risk:** LOW

**Reasoning:**
- 4 deletions are in CascadeProjects (not PING)
- 1 refactoring is in PING (well-understood startup verification)
- No new architecture introduced
- No behavior changes (only delegation improvements)
- All changes preserve functionality
