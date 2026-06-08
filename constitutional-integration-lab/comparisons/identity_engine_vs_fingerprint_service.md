# Comparison: identity_engine.ts VS canonical_fingerprint_service.js

**Generated:** 2026-06-06

---

## EXISTING CRX AUTHORITY

**FILE:** `C:\Users\nolan\CRX\runtime\kernel\commit-service\src\engines\identity_engine.ts`

```typescript
export function computeCanonicalHash(input: any): string {
  const canonical = canonicalize(input)
  const serialized = JSON.stringify(canonical)
  const hash = crypto.createHash("sha256").update(serialized).digest("hex")
  return hash
}
```

**DEPENDENCIES:** `crypto`, `./canonical_engine`

---

## ARCHIVE AUTHORITY

**FILE:** `JS.txt#canonical_fingerprint_service.js`

**Identity-relevant exports:**
- `fingerprint(value, options)` — async SHA-256
- `fingerprintWithDomain(domain, value)` — domain-prefixed preimage
- `verifyFingerprint(expected, value, options)` — integrity check
- `FINGERPRINT_DOMAINS.ARTIFACT`, `.SNAPSHOT`, `.EXECUTION_RECORD`, etc.

---

## DIRECT OVERLAP

| Capability | CRX | Archive |
|------------|-----|---------|
| SHA-256 | YES (sync, Node crypto) | YES (async, WebCrypto/Utilities) |
| Pre-hash canonicalization | YES | YES |
| JSON serialization | YES | YES (via canonicalize tokens) |
| Hex output | YES | YES |
| Domain separation | NO | YES |
| Verification API | NO | YES |
| Async-only contract | NO (sync) | YES |

**Overlap:** ~60% (hash pipeline concept only)

---

## MISSING CAPABILITIES (CRX)

- `fingerprintWithDomain` — CRITICAL for replay (per archive replay harness usage)
- `verifyFingerprint` — CRITICAL for witness generation
- Expected hash format validation (`/^[a-f0-9]{64}$/`)
- Algorithm/version constants (`HASH_ALGORITHM`, `FINGERPRINT_SCHEMA_VERSION`)
- Error type `CanonicalizationError`

---

## STRONGER IMPLEMENTATION

**Archive** — domain registry + verify path + schema version. Used by `deterministic_replay_harness.js` lines 114-118 for snapshot verification.

---

## SAFE REUSE TARGETS

| Archive | CRX mapping |
|---------|-------------|
| `fingerprintWithDomain(FINGERPRINT_DOMAINS.ARTIFACT, artifact)` | Replaces `computeCanonicalHash` for artifact IDs |
| `verifyFingerprint` | New witness verification boundary |
| `FINGERPRINT_DOMAINS` | Identity authority registry |

---

## REPLAY RISKS

**CRX:** Artifact ID recomputed on replay cannot be domain-validated. No snapshot/event/execution domain separation.

**Archive:** Replay harness verifies `snapshot_fingerprint` via `verifyFingerprint` with `FINGERPRINT_DOMAINS.SNAPSHOT` (deterministic_replay_harness.js:114-118).

**Risk severity:** CRX identity path is **REPLAY-UNSAFE** relative to archive standard.

---

## LINEAGE RISKS

CRX uses same hash function for artifact identity and implicit event payload references. Archive separates domains preventing cross-type identity collision.

---

## DETERMINISM RISKS

CRX sync `crypto.createHash` vs archive async path — different runtime surfaces. Archive explicitly handles Apps Script `Utilities.computeDigest` fallback.

---

## SAFE EXTRACTION CANDIDATES

| Item | Action |
|------|--------|
| `canonical_fingerprint_service.js` full module | EXTRACT — primary identity authority |
| `identity_engine.ts` | QUARANTINE for replay-critical paths — insufficient alone |
| `computeCanonicalHash` | REFERENCE ONLY — do not extend for replay |
