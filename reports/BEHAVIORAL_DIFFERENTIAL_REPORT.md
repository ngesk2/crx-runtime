# Behavioral Differential Report
**Version:** Pre-Replay Execution  
**Classification:** Forensics (Read-Only)

Detailed line-by-line behavioral comparison between key authority pairings.

---

## 1. canonical_engine.ts vs JS.txt#canonicalize

- **INPUTS:**
  - `canonical_engine.ts`: `value: any`
  - `JS.txt#canonicalize`: `value: any`, `options: object` (supports `rejectUnknownFields`, `strictNumberMode`, `maxDepth`).
- **OUTPUTS:**
  - `canonical_engine.ts`: Sorted object structure.
  - `JS.txt#canonicalize`: Deterministic JSON-compatible string.
- **INVARIANTS:**
  - `canonical_engine.ts`: Object keys must be sorted alphabetically.
  - `JS.txt#canonicalize`: Rejects circular structures, sparse arrays, undefined values, functions, symbols, and nonplain objects. Normalizes strings to NFC.
- **FAILURE MODES:**
  - `canonical_engine.ts`: Throws maximum call stack size exceeded on circular objects.
  - `JS.txt#canonicalize`: Throws structured `CanonicalizationError`.

---

## 2. identity_engine.ts vs JS.txt#fingerprint

- **INPUTS:**
  - `identity_engine.ts`: `input: any`
  - `JS.txt#fingerprint`: `value: any`, `options: object` (requires `domain`).
- **OUTPUTS:**
  - `identity_engine.ts`: 64-character hex hash.
  - `JS.txt#fingerprint`: 64-character domain-separated hex hash.
- **INVARIANTS:**
  - `identity_engine.ts`: Output is SHA-256 of JSON.stringify.
  - `JS.txt#fingerprint`: Preimage includes length prefixes: `lengthPrefix(schema_version) + lengthPrefix(domain) + lengthPrefix(canonicalString)`.\n