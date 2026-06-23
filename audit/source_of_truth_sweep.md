# SOURCE OF TRUTH SWEEP

**Status:** AUDIT IN PROGRESS
**Purpose:** Identify source authorities, derived projections, and dangerous duplicates
**Goal:** One authority per truth domain

---

# SOURCE OF TRUTH ANALYSIS

## Event Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| ReplayEventStream | Event Recording Authority | Event projections, event indexes, event summaries | Mutable event caches, duplicated event logs, shadow event databases | CLEAN - No shadow copies detected |

**Source Authority:** Event Recording Authority (root authority)
**Generated Derivations:** None in current codebase
**Shadow Copies:** None detected

---

## Identity Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| CanonicalJson | Identity Authority | Identity indexes, identity lookups, identity mappings | Mutable identity caches, shadow identity registries, identity patches | CLEAN - No shadow copies detected |
| CertificateAuthority | Identity Authority | Fingerprint indexes, fingerprint lookups | Mutable fingerprint caches, shadow fingerprint databases | CLEAN - No shadow copies detected |

**Source Authority:** Identity Authority (root authority)
**Generated Derivations:** None in current codebase
**Shadow Copies:** None detected

---

## Lineage Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| GraphValidator | Lineage Authority | Lineage projections, lineage indexes, lineage visualizations | Mutable lineage caches, duplicated lineage graphs, shadow lineage databases | CLEAN - No shadow copies detected |

**Source Authority:** Lineage Authority (root authority)
**Generated Derivations:** None in current codebase
**Shadow Copies:** None detected

---

## Policy Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| Policy Authority | Policy Authority | Policy projections, policy indexes, policy summaries | Mutable policy caches, duplicated policy configurations, shadow policy databases | NOT IMPLEMENTED - Policy Authority not yet implemented |

**Source Authority:** Policy Authority (root authority) - NOT IMPLEMENTED
**Generated Derivations:** None
**Shadow Copies:** None detected

---

## Replay Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| DeterministicReplayEngine | Replay Authority | State projections, replay summaries, replay indexes | Mutable replay caches, shadow replay logs, replay patches | CLEAN - No shadow copies detected |
| ReplayStateMachine | Replay Authority (via State Authority) | State projections, state summaries, state indexes | Mutable state caches, shadow state databases, state patches | CLEAN - No shadow copies detected |
| StateSerializer | Replay Authority (via State Authority) | State projections, state summaries | Mutable state caches, shadow state databases | CLEAN - No shadow copies detected |

**Source Authority:** Replay Authority (root authority)
**Generated Derivations:** State projections (via State Authority)
**Shadow Copies:** None detected

---

## Witness Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| WitnessAuthority | Identity Authority (generation) + Replay Authority (verification) | Witness indexes, witness lookups | Mutable witness caches, shadow witness databases | CONSTITUTIONAL VIOLATION - Witness Authority should be eliminated |
| MerkleTree | Identity Authority (generation) + Replay Authority (verification) | Witness indexes, witness lookups | Mutable witness caches, shadow witness databases | CONSTITUTIONAL VIOLATION - Should be merged into Identity + Replay |

**Source Authority:** Identity Authority (generation) + Replay Authority (verification) per constitution
**Generated Derivations:** Witness indexes, witness lookups
**Shadow Copies:** None detected
**Constitutional Issue:** Witness Authority is eliminated in constitution but still exists in codebase

---

## State Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| ReplayStateMachine | Replay Authority (via State Authority) | State projections, state summaries, state indexes | Mutable state caches, shadow state databases, state patches | CLEAN - No shadow copies detected |
| StateSerializer | Replay Authority (via State Authority) | State projections, state summaries | Mutable state caches, shadow state databases | CLEAN - No shadow copies detected |

**Source Authority:** State Authority (derived from Replay Authority)
**Generated Derivations:** State projections, state summaries, state indexes
**Shadow Copies:** None detected

---

## Invariant Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| InvariantRunner | Policy Authority (via invariant definitions) | Invariant indexes, invariant lookups | Mutable invariant caches, shadow invariant databases, runtime patches to invariant definitions | CLEAN - No shadow copies detected |
| ReplayInvariants | Policy Authority (via invariant definitions) | Invariant indexes, invariant lookups | Mutable invariant caches, shadow invariant databases, runtime patches to invariant definitions | CLEAN - No shadow copies detected |

**Source Authority:** Policy Authority (via invariant definitions) - Policy Authority not yet implemented
**Generated Derivations:** Invariant indexes, invariant lookups
**Shadow Copies:** None detected

---

## Canonicalization Domain

| System | Source Authority | Generated Derivations | Shadow Copies (DANGEROUS) | Status |
|--------|-----------------|----------------------|--------------------------|--------|
| CanonicalJson | Identity Authority | Canonicalization indexes, canonicalization lookups | Mutable canonicalization caches, shadow canonicalization databases | CONSTITUTIONAL VIOLATION - Canonicalization Authority should be eliminated |
| CanonicalHashAuthority | Identity Authority | Fingerprint indexes, fingerprint lookups | Mutable fingerprint caches, shadow fingerprint databases | CONSTITUTIONAL VIOLATION - Should be merged into Identity Authority |

**Source Authority:** Identity Authority per constitution
**Generated Derivations:** Fingerprint indexes, fingerprint lookups
**Shadow Copies:** None detected
**Constitutional Issue:** Canonicalization Authority is eliminated in constitution but still exists as separate class

---

# DANGEROUS DUPLICATES DETECTED

## Duplicate 1: Witness Authority

**Finding:** WitnessAuthority class exists as separate authority despite being eliminated in constitution.

**Constitutional Reference:** constitution/authority_model.md — Witness Authority eliminated, absorbed by Identity + Replay

**Current State:** WitnessAuthority class in witness_authority.ts

**Source Authority:** Should be Identity Authority (generation) + Replay Authority (verification)

**Generated Derivations:** Witness indexes, witness lookups

**Shadow Copies:** None

**Risk:** MEDIUM — Shadow authority, but currently delegates to proper authorities

**Remediation:** Eliminate WitnessAuthority class, move witness generation to Identity Authority, move witness verification to Replay Authority

---

## Duplicate 2: Canonicalization Authority

**Finding:** CanonicalHashAuthority exists as separate authority despite being eliminated in constitution.

**Constitutional Reference:** constitution/authority_model.md — Canonicalization Authority eliminated, absorbed by Identity

**Current State:** CanonicalHashAuthority class in canonical_hash_authority.ts

**Source Authority:** Should be Identity Authority

**Generated Derivations:** Fingerprint indexes, fingerprint lookups

**Shadow Copies:** None

**Risk:** MEDIUM — Shadow authority, but currently delegates to proper authorities

**Remediation:** Eliminate CanonicalHashAuthority class, merge into Identity Authority

---

## Duplicate 3: KernelCommitService

**Finding:** KernelCommitService registered as SHADOW authority in authority_registry.ts

**Constitutional Reference:** constitution/source_of_truth_law.md — Shadow copies are prohibited

**Current State:** Registered as SHADOW in authority_registry.ts

**Source Authority:** None (shadow)

**Generated Derivations:** None

**Shadow Copies:** Self is shadow copy

**Risk:** HIGH — Shadow authority creates competing truth

**Remediation:** Eliminate KernelCommitService, migrate functionality to proper authorities

---

# SOURCE OF TRUTH VIOLATIONS

## Violation 1: Missing Policy Authority

**Finding:** Policy Authority is defined in constitution but not implemented in codebase.

**Constitutional Reference:** constitution/authority_model.md — Policy Authority is root authority

**Current State:** Not implemented

**Source Authority:** None (missing)

**Generated Derivations:** None

**Shadow Copies:** None

**Risk:** HIGH — No mutation authorization mechanism

**Remediation:** Implement Policy Authority with mutation authorization rules

---

# SOURCE OF TRUTH SUMMARY

## Clean Domains

The following domains have ONE source authority and NO dangerous duplicates:

1. **Event Domain** — Event Recording Authority
2. **Identity Domain** — Identity Authority
3. **Lineage Domain** — Lineage Authority
4. **Replay Domain** — Replay Authority
5. **State Domain** — State Authority (derived from Replay Authority)
6. **Invariant Domain** — Policy Authority (via invariant definitions) - NOT IMPLEMENTED

## Violated Domains

The following domains have constitutional violations:

1. **Witness Domain** — Witness Authority should be eliminated, absorbed by Identity + Replay
2. **Canonicalization Domain** — Canonicalization Authority should be eliminated, absorbed by Identity
3. **Policy Domain** — Policy Authority is not implemented

## Shadow Authorities

The following shadow authorities exist:

1. **KernelCommitService** — Shadow authority, should be eliminated

---

# REMEDIATION PLAN

## Priority 1: Eliminate Shadow Authorities

1. **Eliminate KernelCommitService**
   - Remove from authority_registry.ts
   - Migrate functionality to proper authorities
   - Validate no shadow authorities remain

## Priority 2: Eliminate Eliminated Authorities

1. **Eliminate Witness Authority**
   - Remove WitnessAuthority class
   - Move witness generation to Identity Authority
   - Move witness verification to Replay Authority
   - Update all references

2. **Eliminate Canonicalization Authority**
   - Remove CanonicalHashAuthority class
   - Merge into Identity Authority
   - Update all references

## Priority 3: Implement Missing Authorities

1. **Implement Policy Authority**
   - Create Policy Authority class
   - Implement mutation authorization rules
   - Implement constraint evaluation
   - Implement policy versioning
   - Register as root authority

---

# VERIFICATION CHECKLIST

After remediation, verify:

- [ ] One source authority per truth domain
- [ ] No shadow authorities
- [ ] No dangerous duplicates
- [ ] All eliminated authorities removed
- [ ] All missing authorities implemented
- [ ] Authority registry updated
- [ ] Constitutional law compliance verified

---

**Document ID:** AUDIT-SOURCE-OF-TRUTH-SWEEP-1.0
**Status:** IN PROGRESS
**Last Updated:** 2026-06-09
