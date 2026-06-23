# AUTHORITY INVENTORY

**Status:** AUDIT IN PROGRESS
**Purpose:** Complete map of who is allowed to define truth
**Scope:** All critical subsystems

---

# AUTHORITY INVENTORY TABLE

| System | Authority Type | Canonical? | Mutable? | Replay Critical? | Layer | Notes |
|--------|---------------|-----------|----------|-----------------|-------|-------|
| CanonicalJson | Serialization Authority | YES | NO | YES | Layer 0 | Sole canonicalization authority (merged into Identity per constitution) |
| ReplayStateMachine | State Authority | YES | NO | YES | Layer 1 | Derived from replay, not root authority |
| ReplayEventStream | Event Recording Authority | YES | NO | YES | Layer 1 | Append-only event recording |
| WitnessAuthority | Witness Generation | DERIVED | NO | YES | Layer 1 | Absorbed by Identity + Replay per constitution |
| CertificateAuthority | Certificate Commitment | DERIVED | NO | YES | Layer 1 | Computes certificate commitments |
| CanonicalHashAuthority | Fingerprint Authority | DERIVED | NO | YES | Layer 1 | Computes fingerprints from canonical bytes |
| MerkleTree | Witness Construction | DERIVED | NO | YES | Layer 1 | Merkle tree for witness root generation |
| InvariantRunner | Invariant Enforcement | DERIVED | NO | YES | Layer 1 | Evaluates invariants against state |
| ReplayInvariants | Invariant Definitions | DERIVED | NO | YES | Layer 1 | Defines standard replay invariants |
| DeterministicReplayEngine | Replay Execution | DERIVED | NO | YES | Layer 1 | Executes deterministic replay |
| ReplayVerification | Replay Verification | DERIVED | NO | YES | Layer 1 | Verifies replay correctness |
| StateSerializer | State Serialization | DERIVED | NO | YES | Layer 1 | Serializes state deterministically |
| DeterministicFailure | Failure Semantics | DERIVED | NO | YES | Layer 1 | Structured failure codes |
| ConstitutionalLawManifest | Law Commitment | DERIVED | NO | YES | Layer 1 | Semantic law manifest for witness |
| CanonicalCertificate | Certificate Serialization | DERIVED | NO | YES | Layer 1 | Canonical certificate serialization |
| ByteUtils | Byte Utilities | UTILITY | NO | YES | Layer 0 | Portable byte operations (concat, encode, decode) |
| GraphValidator | Lineage Validation | DERIVED | NO | YES | Layer 1 | Validates lineage DAG constraints |
| AuthorityRegistry | Authority Tracking | METADATA | YES | NO | Layer 1 | Tracks authority classifications |
| AuthorityClassification | Authority Classification | METADATA | YES | NO | Layer 1 | Defines authority types |
| ConstitutionalSelfCheck | Self-Check | INFRASTRUCTURE | NO | NO | Layer 2 | Host-specific self-check adapter |
| NodeSelfCheckAdapter | Node Adapter | INFRASTRUCTURE | NO | NO | Layer 2 | Node.js-specific self-check |
| ConstitutionalForensics | Forensics | INFRASTRUCTURE | NO | NO | Layer 2 | Forensic analysis tools |
| ConstitutionalTestRunner | Test Runner | INFRASTRUCTURE | NO | NO | Layer 2 | Test execution infrastructure |
| DeepFreeze | Utility | UTILITY | NO | NO | Layer 0 | Object freezing utility |
| ReplayLimits | Configuration | CONFIGURATION | YES | NO | Layer 1 | Execution limit constants |

---

# SHADOW AUTHORITIES (DANGEROUS)

| System | Authority Type | Canonical? | Mutable? | Replay Critical? | Risk | Remediation |
|--------|---------------|-----------|----------|-----------------|-------|-------------|
| KernelCommitService | SHADOW | NO | YES | NO | HIGH | Eliminate or migrate to proper authority |

---

# AUTHORITY CLASSIFICATION SUMMARY

## Root Authorities (Layer 0)

1. **Identity Authority** — Content normalization, identity assignment, identity verification
   - Implemented by: CanonicalJson (canonicalization), CertificateAuthority (hashing)
   - Status: Canonical, Immutable, Replay Critical

2. **Lineage Authority** — Parent-child derivation relationships, DAG legality
   - Implemented by: GraphValidator
   - Status: Canonical, Immutable, Replay Critical

3. **Event Recording Authority** — Constitutional occurrence capture, append-only event sequence
   - Implemented by: ReplayEventStream
   - Status: Canonical, Immutable, Replay Critical

4. **Replay Authority** — Deterministic reconstruction law, integrity verification
   - Implemented by: DeterministicReplayEngine, ReplayVerification
   - Status: Canonical, Immutable, Replay Critical

5. **Policy Authority** — Mutation authorization rules, constraint evaluation
   - Status: Not yet implemented in current codebase

## Derived Authorities (Layer 1)

1. **State Authority** — State projection lifecycle
   - Implemented by: ReplayStateMachine, StateSerializer
   - Status: Derived from Replay, Immutable, Replay Critical

2. **Witness Authority** — Witness generation and verification
   - Implemented by: WitnessAuthority, MerkleTree
   - Status: Derived from Identity + Replay, Immutable, Replay Critical
   - Note: Per constitution, Witness Authority is eliminated and absorbed by Identity + Replay

## Eliminated Authorities (Per Constitution)

1. **Witness Authority** — Eliminated, absorbed by Identity + Replay
2. **Canonicalization Authority** — Eliminated, absorbed by Identity

---

# INFRASTRUCTURE SYSTEMS (Layer 2-4)

| System | Layer | Purpose | Authority Type |
|--------|-------|---------|---------------|
| ConstitutionalSelfCheck | Layer 2 | Host-specific self-check | INFRASTRUCTURE |
| NodeSelfCheckAdapter | Layer 2 | Node.js adapter | INFRASTRUCTURE |
| ConstitutionalForensics | Layer 2 | Forensic analysis | INFRASTRUCTURE |
| ConstitutionalTestRunner | Layer 2 | Test execution | INFRASTRUCTURE |
| Gateway | Layer 3 | HTTP API gateway | INFRASTRUCTURE |
| Ollama | Layer 4 | LLM inference | INFRASTRUCTURE |
| Postgres | Layer 4 | Database | INFRASTRUCTURE |
| Redis | Layer 4 | Cache | INFRASTRUCTURE |

---

# AUTHORITY VIOLATIONS DETECTED

## Violation 1: Witness Authority Still Exists

**Finding:** WitnessAuthority is still implemented as a separate class despite being eliminated in constitution.

**Constitutional Reference:** constitution/authority_model.md — Witness Authority eliminated, absorbed by Identity + Replay

**Current State:** WitnessAuthority class exists in witness_authority.ts

**Risk:** MEDIUM — Shadow authority, but currently delegated to proper authorities

**Remediation:** Refactor to eliminate WitnessAuthority class, move witness generation to Identity and verification to Replay

---

## Violation 2: Canonicalization Authority Still Exists

**Finding:** Canonicalization is still referenced as separate authority in some places.

**Constitutional Reference:** constitution/authority_model.md — Canonicalization Authority eliminated, absorbed by Identity

**Current State:** CanonicalHashAuthority exists as separate class

**Risk:** MEDIUM — Shadow authority, but currently delegated to proper authorities

**Remediation:** Refactor to eliminate Canonicalization Authority, merge into Identity Authority

---

## Violation 3: KernelCommitService Shadow Authority

**Finding:** KernelCommitService registered as SHADOW authority in authority_registry.ts

**Constitutional Reference:** constitution/source_of_truth_law — Shadow copies are prohibited

**Current State:** Registered as SHADOW, marked for elimination

**Risk:** HIGH — Shadow authority creates competing truth

**Remediation:** Eliminate KernelCommitService, migrate functionality to proper authorities

---

# MISSING AUTHORITIES

## Missing Authority 1: Policy Authority

**Finding:** Policy Authority is defined in constitution but not implemented in codebase.

**Constitutional Reference:** constitution/authority_model.md — Policy Authority is root authority

**Current State:** Not implemented

**Risk:** HIGH — No mutation authorization mechanism

**Remediation:** Implement Policy Authority with mutation authorization rules

---

# AUTHORITY DEPENDENCY GRAPH

```
Identity Authority (Root)
├── CanonicalJson (canonicalization)
└── CertificateAuthority (hashing)

Lineage Authority (Root)
└── GraphValidator (DAG validation)

Event Recording Authority (Root)
└── ReplayEventStream (event recording)

Replay Authority (Root)
├── DeterministicReplayEngine (replay execution)
├── ReplayVerification (replay verification)
└── ReplayStateMachine (state projection)

State Authority (Derived)
├── ReplayStateMachine (state projection)
└── StateSerializer (state serialization)

Witness Authority (Eliminated - should be removed)
├── WitnessAuthority (witness generation)
└── MerkleTree (witness construction)
```

---

# REPLAY CRITICAL SYSTEMS

The following systems are REPLAY CRITICAL — changes to these systems MUST preserve replay determinism:

1. CanonicalJson — Serialization must remain deterministic
2. CertificateAuthority — Hashing must remain deterministic
3. ReplayEventStream — Event ordering must remain deterministic
4. DeterministicReplayEngine — Replay execution must remain deterministic
5. MerkleTree — Witness construction must remain deterministic
6. StateSerializer — State serialization must remain deterministic
7. InvariantRunner — Invariant evaluation must remain deterministic
8. ByteUtils — Byte operations must remain portable and deterministic

---

# NON-CRITICAL SYSTEMS

The following systems are NOT replay critical — changes to these systems do not affect replay determinism:

1. ConstitutionalSelfCheck — Host-specific self-check
2. NodeSelfCheckAdapter — Node.js adapter
3. ConstitutionalForensics — Forensic analysis tools
4. ConstitutionalTestRunner — Test execution infrastructure
5. AuthorityRegistry — Authority tracking metadata
6. AuthorityClassification — Authority classification metadata
7. DeepFreeze — Object freezing utility
8. ReplayLimits — Configuration constants

---

# NEXT STEPS

1. **Eliminate Shadow Authorities:** Remove KernelCommitService
2. **Eliminate Eliminated Authorities:** Remove WitnessAuthority class, merge into Identity + Replay
3. **Implement Missing Authorities:** Implement Policy Authority
4. **Verify Authority Boundaries:** Ensure no cross-layer violations
5. **Update Constitution:** If any authority changes require constitutional amendment

---

**Document ID:** AUDIT-AUTHORITY-INVENTORY-1.0
**Status:** IN PROGRESS
**Last Updated:** 2026-06-09
