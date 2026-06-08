# Replay Authority Map

**Phase 14:** JS/TS Constitutional Boundary Sweep  
**Date:** 2026-06-07

## Executive Summary

**Status:** SINGLE-SOURCE CONSTITUTIONAL AUTHORITIES

The constitutional replay kernel maintains a single-source authority model. All replay computation routes through designated constitutional authorities. No duplicate implementations found.

## 1. Witness Authority

### Single-Source Authority

**Location:** `runtime/replay/witness_authority.ts`

**Responsibilities:**
- Witness root generation
- Merkle tree construction
- Lineage graph construction
- Witness verification

**Method:** `generateWitness(eventStream, state, violations)`

**Algorithm:** `merkle_sha256_v1`

**Status:** ✓ COMPLIANT (single source)

### Witness Root Usage Map

| Location | Usage | Purpose | Status |
|----------|-------|---------|--------|
| `witness_authority.ts:37` | Return witness root | Extract witness from result | ✓ COMPLIANT |
| `witness_authority.ts:202` | Set witness root | Generate witness root | ✓ COMPLIANT |
| `witness_authority.ts:221` | Compare witness roots | Verify witness equality | ✓ COMPLIANT |
| `deterministic_replay_engine.ts:77` | Store witness root | Replay result | ✓ COMPLIANT |
| `deterministic_replay_engine.ts:85` | Freeze witness root | Immutability | ✓ COMPLIANT |
| `replay_verification.ts:40, 56, 103, 118` | Compare witness roots | Verification | ✓ COMPLIANT |
| `constitutional_self_check.ts:202, 206, 210` | Verify witness root | Self-check | ✓ COMPLIANT |
| `constitutional_self_check.ts:231` | Collect witness roots | Determinism test | ✓ COMPLIANT |
| Tests | Compare witness roots | Test verification | ✓ COMPLIANT |

**Duplicate Implementations:** ZERO

## 2. Merkle Authority

### Single-Source Authority

**Location:** `runtime/replay/merkle_tree.ts`

**Responsibilities:**
- Merkle tree construction
- Merkle proof generation
- Merkle proof verification
- Node hash computation

**Class:** `MerkleTree`

**Algorithm:** SHA256

**Status:** ✓ COMPLIANT (single source)

### Merkle Usage Map

| Location | Usage | Purpose | Status |
|----------|-------|---------|--------|
| `merkle_tree.ts:49` | Class definition | Merkle tree implementation | ✓ COMPLIANT |
| `merkle_tree.ts:54` | Constructor | Build Merkle tree | ✓ COMPLIANT |
| `merkle_tree.ts:108` | Generate proof | Merkle proof generation | ✓ COMPLIANT |
| `merkle_tree.ts:132` | Verify proof | Merkle proof verification | ✓ COMPLIANT |
| `merkle_tree.ts:158` | Build tree | Internal tree construction | ✓ COMPLIANT |
| `witness_authority.ts:17` | Import | Use Merkle tree | ✓ COMPLIANT |
| `witness_authority.ts:198` | Instantiate | Build Merkle tree | ✓ COMPLIANT |
| `witness_authority.ts:199` | Get root hash | Extract witness root | ✓ COMPLIANT |
| `index.ts:19` | Export | Public API | ✓ COMPLIANT |

**Duplicate Implementations:** ZERO

## 3. Fingerprint Authority

### Single-Source Authority

**Location:** `runtime/replay/canonical_hash_authority.ts`

**Responsibilities:**
- Fingerprint generation
- SHA256 hash computation
- Canonical bytes hashing

**Method:** `computeFingerprint(canonicalBytes)`

**Algorithm:** SHA256

**Status:** ✓ COMPLIANT (single source)

### Fingerprint Usage Map

| Location | Usage | Purpose | Status |
|----------|-------|---------|--------|
| `canonical_hash_authority.ts:57` | Compute fingerprint | Fingerprint generation | ✓ COMPLIANT |
| `deterministic_replay_engine.ts:60` | Compute fingerprint | Replay computation | ✓ COMPLIANT |
| `deterministic_replay_engine.ts:74` | Store fingerprint | Replay result | ✓ COMPLIANT |
| `witness_authority.ts:53` | Compute fingerprint | Witness generation | ✓ COMPLIANT |
| `witness_authority.ts:110` | Store fingerprint | Witness leaf | ✓ COMPLIANT |
| `witness_authority.ts:124` | Hash fingerprint | Witness leaf bytes | ✓ COMPLIANT |
| `replay_verification.ts:41, 62, 104, 128` | Compare fingerprints | Verification | ✓ COMPLIANT |
| `constitutional_self_check.ts:162, 178` | Compare fingerprints | Self-check | ✓ COMPLIANT |
| Tests | Compare fingerprints | Test verification | ✓ COMPLIANT |

**Duplicate Implementations:** ZERO

## 4. Canonicalization Authority

### Single-Source Authority

**Location:** `runtime/replay/canonical_json.ts`

**Responsibilities:**
- RFC-8785 JSON canonicalization
- Deterministic serialization
- UTF-8 normalization
- Object key sorting

**Method:** `canonicalize(value)`

**Standard:** RFC-8785

**Status:** ✓ COMPLIANT (single source)

### Canonicalization Usage Map

| Location | Usage | Purpose | Status |
|----------|-------|---------|--------|
| `canonical_json.ts:24` | Canonicalize | Canonicalization | ✓ COMPLIANT |
| `canonical_json.ts:123` | Fallback | Let JSON.stringify handle primitives | ✓ COMPLIANT |
| `canonical_event_envelope.ts:95` | Canonicalize | Event envelope canonicalization | ✓ COMPLIANT |
| `canonical_event_envelope.ts:51` | Canonicalize | Immutable copy | ✓ COMPLIANT |
| `deterministic_replay_engine.ts:56` | Canonicalize | Replay computation | ✓ COMPLIANT |
| `witness_authority.ts:51` | Canonicalize | Witness generation | ✓ COMPLIANT |
| Tests | Canonicalize | Test verification | ✓ COMPLIANT |

**Duplicate Implementations:** ZERO

## 5. Infrastructure Authority Map

### Infrastructure-Only Authorities

| Authority | Location | Purpose | Constitutional Impact |
|-----------|----------|---------|----------------------|
| `canonical_engine.ts` | `commit-service/src/engines/` | Artifact canonicalization | NONE (infra-only) |
| `identity_engine.ts` | `commit-service/src/engines/` | Artifact hashing | NONE (infra-only) |

**Status:** ✓ COMPLIANT (marked as infra-only)

### Infrastructure Usage Map

| Location | Usage | Purpose | Status |
|----------|-------|---------|--------|
| `commit_controller.ts:2` | Import | Use canonical hash | ✓ COMPLIANT (infra-only) |
| `commit_controller.ts:13` | Compute hash | Artifact identification | ✓ COMPLIANT (infra-only) |
| `identity_engine.ts:2` | Import | Use canonicalize | ✓ COMPLIANT (infra-only) |
| `identity_engine.ts:4` | Export | Compute canonical hash | ✓ COMPLIANT (infra-only) |
| `identity_engine.ts:5` | Canonicalize | Artifact canonicalization | ✓ COMPLIANT (infra-only) |
| `identity_engine.ts:7` | Serialize | Artifact serialization | ✓ COMPLIANT (infra-only) |
| `identity_engine.ts:10` | Hash | Artifact hashing | ✓ COMPLIANT (infra-only) |

**Constitutional Impact:** NONE (infrastructure only, does not affect replay truth)

## 6. Authority Consolidation

### Existing Protections Repurposed

**Constitutional Self-Check System:**
- `constitutional_self_check.ts` - Implements startup verification
- Corpus hash verification
- Certification artifact hash verification
- Witness root integrity verification
- Canonicalization consistency test
- Witness regeneration spot check
- Determinism smoke test
- **Status:** ✓ REUSED (no duplication needed)

**Object.freeze Protections:**
- `deterministic_replay_engine.ts:85` - Freezes witness_root
- `deterministic_replay_engine.ts:86` - Freezes result
- **Status:** ✓ REUSED (no duplication needed)

**Corpus Certification Vectors:**
- Frozen in `certification/vectors/replay_vectors_manifest.json`
- Frozen in `certification/hashes/witness_roots.txt`
- Frozen in `certification/hashes/corpus_sha256.txt`
- **Status:** ✓ REUSED (no duplication needed)

**Docker Startup Gate:**
- `Dockerfile` - Runs constitutional self-check on startup
- Health check for ongoing verification
- **Status:** ✓ REUSED (no duplication needed)

**Clean-Room Verification:**
- Documented in `clean_room_reproducibility_report.md`
- Verified clone/ci/test equivalence
- **Status:** ✓ REUSED (no duplication needed)

## 7. Duplicate Authority Removal

**Findings:** ZERO

No duplicate authority implementations found. All replay computation routes through single-source constitutional authorities.

## 8. Authority Flow Diagram

```
Event Stream
  ↓
CanonicalJson.canonicalize() [AUTHORITATIVE]
  ↓
CanonicalBytes
  ↓
CanonicalHashAuthority.computeFingerprint() [AUTHORITATIVE]
  ↓
Fingerprint
  ↓
InvariantRunner.verifyInvariants() [AUTHORITATIVE]
  ↓
ReplayState + Violations
  ↓
WitnessAuthority.generateWitness() [AUTHORITATIVE]
  ↓
MerkleTree.buildTree() [AUTHORITATIVE]
  ↓
WitnessRoot
  ↓
ReplayResult (frozen)
```

## 9. Recommendations

### No Changes Required

The constitutional replay kernel maintains a single-source authority model:
- All replay computation routes through designated authorities
- No duplicate implementations found
- Existing protections are repurposed (no duplication needed)
- Infrastructure is clearly separated and marked

### Documentation Updates

Consider adding inline comments to authorities:
- `witness_authority.ts` - Add comment: "AUTHORITATIVE: Single-source witness generation"
- `merkle_tree.ts` - Add comment: "AUTHORITATIVE: Single-source Merkle construction"
- `canonical_hash_authority.ts` - Add comment: "AUTHORITATIVE: Single-source fingerprint generation"
- `canonical_json.ts` - Add comment: "AUTHORITATIVE: Single-source canonicalization"

## Conclusion

Phase 14 replay authority map audit PASSED. The constitutional replay kernel maintains a single-source authority model with clear separation between constitutional computation and infrastructure. No duplicate authority implementations found. All existing protections are repurposed without duplication.

**Status:** SINGLE-SOURCE CONSTITUTIONAL AUTHORITIES
