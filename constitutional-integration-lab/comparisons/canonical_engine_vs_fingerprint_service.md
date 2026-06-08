# Comparison: canonical_engine.ts VS canonical_fingerprint_service.js

**Generated:** 2026-06-06  
**Mode:** Forensic side-by-side — no redesign

---

## EXISTING CRX AUTHORITY

**FILE:** `C:\Users\nolan\CRX\runtime\kernel\commit-service\src\engines\canonical_engine.ts`  
**LINES:** 18  
**EXPORTS:** `canonicalize(value: any): any`

**EVIDENCE:**
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

---

## ARCHIVE AUTHORITY

**FILE:** `JS.txt#canonical_fingerprint_service.js` → `extracted/js_txt/canonical_fingerprint_service.js`  
**LINES:** 478  
**EXPORTS:** `canonicalize`, `fingerprint`, `fingerprintWithDomain`, `verifyFingerprint`, `FINGERPRINT_DOMAINS`, `FINGERPRINT_SCHEMA_VERSION`, `CanonicalizationError`

**EVIDENCE (canonicalize signature and guards, lines 142-222):**
- Options: `rejectUnknownFields`, `allowedTopLevelFields`, `strictNumberMode`, `maxDepth`
- Rejects: BigInt, undefined, Symbol, Function
- Circular reference detection via WeakSet
- String NFC normalization
- Negative zero preserved as `"-0"`
- Returns string tokens for primitives (not raw JS values)

---

## DIRECT OVERLAP

| Capability | CRX | Archive |
|------------|-----|---------|
| Recursive object key sorting | YES | YES |
| Array recursion | YES | YES |
| Null handling | YES (pass-through) | YES (returns `"null"` string token) |
| Plain object only | NO (any object) | YES (`isPlainObject` check) |
| Depth limit | NO | YES (`maxDepth`) |
| Circular detection | NO | YES |
| Type rejection (BigInt/Symbol/Function) | NO | YES |

**Overlap estimate:** ~40% of canonicalization behavior

---

## MISSING CAPABILITIES (CRX lacks vs Archive)

- Domain-separated fingerprinting (`FINGERPRINT_DOMAINS`)
- Hash verification (`verifyFingerprint`)
- `CanonicalizationError` typed failures
- Strict plain-object enforcement
- Circular reference detection
- String NFC normalization
- Scientific notation guard
- Schema version constant (`fingerprint.schema.3.0`)
- Length-prefixed preimage construction (lines 423+)

---

## STRONGER IMPLEMENTATION

**Archive (`canonical_fingerprint_service.js`)** — evidence: 478 lines, explicit constitutional guarantees header, domain registry, verification path.

CRX is minimal subset suitable only for happy-path JSON objects.

---

## SAFE REUSE TARGETS

| Archive export | Maps to CRX target (naming only — no migration performed) |
|----------------|-------------------------------------------------------------|
| `canonicalize()` strict mode | `kernel/canonical` |
| `fingerprintWithDomain()` | `kernel/identity` |
| `verifyFingerprint()` | `kernel/witness` |
| `FINGERPRINT_DOMAINS` | `kernel/identity` registry |

---

## REPLAY RISKS

| Risk | CRX | Archive |
|------|-----|---------|
| Hash drift across runtimes | HIGH — no domain prefix, loose object handling | LOW — explicit replay purity claim |
| Non-plain objects hashed differently | HIGH — class instances pass through | LOW — rejected |
| Circular structures | UNDEFINED — stack overflow possible | DETECTED — throws |
| Undefined in objects | SILENT — JSON.stringify drops keys | REJECTED |

---

## LINEAGE RISKS

CRX canonical form does not bind to lineage domain. Archive separates `ARTIFACT`, `SNAPSHOT`, `ANCHOR`, `EXECUTION_RECORD` domains — lineage fingerprints cannot collide with artifact fingerprints in archive model.

CRX: single hash path — lineage edge IDs and artifact IDs share same hash semantics.

---

## DETERMINISM RISKS

**CRX:** `JSON.stringify(canonical)` after in-place object rebuild — key order deterministic but value types not normalized (Date objects, class instances undefined behavior).

**Archive:** Primitive serialization explicit; numbers via `JSON.stringify(val)` with strict mode option.

---

## SAFE EXTRACTION CANDIDATES

| Candidate | Source lines | Confidence |
|-----------|--------------|------------|
| `canonicalize()` with guards | Archive 142-420 | HIGH |
| `FINGERPRINT_DOMAINS` registry | Archive 44-75 | HIGH |
| `verifyFingerprint()` | Archive 455+ | HIGH |
| CRX `canonical_engine.ts` | — | QUARANTINE — superseded by archive for replay-critical use |

**CRX file status:** EXTEND boundary only if archive canonicalize adopted — do not modify CRX in this audit.
