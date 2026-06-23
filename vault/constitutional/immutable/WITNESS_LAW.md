# WITNESS LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Witness generation and verification law only. No implementation details.

---

# WITNESS DEFINITION

## Witness Semantics

**DEFINITION:** Witness is deterministic evidence artifact attesting that a binding between content, identity, lineage, or constitutional context holds at the time of attestation.

**PURPOSE:** Witness provides deterministic proof of replay correctness, migration verification, deterministic CI proof, and cross-runtime consistency.

**CLASSIFICATION:** DETERMINISTIC_EVIDENCE_ARTIFACT

**PROPERTIES:**
- **Deterministic:** Same inputs → same witness
- **Pure:** No side effects during generation
- **Infrastructure-independent:** No network IO, no clock dependence
- **Verifiable:** Witness can be recomputed and verified independently

---

# WITNESS FLOW

## Step 1: Event Stream

**INPUT:** Immutable event stream

**PURPOSE:** Provide input events for witness generation

**FORMAT:** JSON array of events

**REQUIREMENTS:**
- Events must be ordered constitutionally
- Events must be immutable
- Events must include actor identity
- Events must include policy decisions

---

## Step 2: Canonicalization

**INPUT:** Event stream

**OUTPUT:** Canonical bytes

**PURPOSE:** Canonicalize events to deterministic byte representation

**ALGORITHM:** Deterministic canonicalization algorithm (RFC-8785 JCS)

**REQUIREMENTS:**
- Lexicographic property ordering
- Deterministic numeric rendering
- UTF-8 normalization
- No undefined fields

---

## Step 3: Fingerprint

**INPUT:** Canonical bytes

**OUTPUT:** Fingerprint hash

**PURPOSE:** Compute fingerprint of canonical bytes

**ALGORITHM:** SHA-256 hash

**REQUIREMENTS:**
- Deterministic: same canonical bytes → same fingerprint
- Pure: no side effects
- Infrastructure-independent: no external dependencies

---

## Step 4: Lineage Verification

**INPUT:** Event stream, fingerprint

**OUTPUT:** Verified lineage

**PURPOSE:** Verify lineage integrity

**ALGORITHM:** Lineage verification algorithm

**REQUIREMENTS:**
- Detect cycles
- Detect duplicate edges
- Verify parent existence
- Preserve acyclicity

---

## Step 5: Replay State

**INPUT:** Event stream, verified lineage

**OUTPUT:** Replay state

**PURPOSE:** Replay events to reconstruct state

**ALGORITHM:** Deterministic replay algorithm

**REQUIREMENTS:**
- Deterministic: same events → same replay state
- Pure: no side effects
- Infrastructure-independent: no external dependencies
- Use minimum replay set

---

## Step 6: Witness Root

**INPUT:** Fingerprint, verified lineage, replay state

**OUTPUT:** Witness root

**PURPOSE:** Compute witness root hash

**ALGORITHM:** Merkle tree construction with domain separation

**REQUIREMENTS:**
- Deterministic: same inputs → same witness root
- Pure: no side effects
- Infrastructure-independent: no external dependencies
- Include constitutional law commitment

---

# WITNESS PROPERTIES

## Property 1: Deterministic

**DEFINITION:** Same inputs → same witness

**PURPOSE:** Enable deterministic replay verification

**VERIFICATION:** Witness root must be identical for same event stream

---

## Property 2: Pure

**DEFINITION:** No side effects

**PURPOSE:** Ensure witness generation does not mutate state

**VERIFICATION:** Witness generation must not modify external state

---

## Property 3: Infrastructure-Independent

**DEFINITION:** No network IO, no clock dependence

**PURPOSE:** Ensure witness generation works in any environment

**VERIFICATION:** Witness generation must not depend on external services

---

## Property 4: Verifiable

**DEFINITION:** Witness can be verified independently

**PURPOSE:** Enable independent verification of replay correctness

**VERIFICATION:** Witness root can be recomputed and verified

---

# WITNESS USE CASES

## Use Case 1: Replay Verification

**PURPOSE:** Verify replay determinism

**METHOD:** Compare witness root with expected witness root

**CLASSIFICATION:** REPLAY_VERIFICATION

---

## Use Case 2: Migration Verification

**PURPOSE:** Verify migration correctness

**METHOD:** Compare witness root before and after migration

**CLASSIFICATION:** MIGRATION_VERIFICATION

---

## Use Case 3: Deterministic CI Proof

**PURPOSE:** Provide deterministic CI proof

**METHOD:** Include witness root in CI pipeline

**CLASSIFICATION:** CI_PROOF

---

## Use Case 4: Cross-Runtime Consistency

**PURPOSE:** Verify consistency across runtimes

**METHOD:** Compare witness root across different runtimes

**CLASSIFICATION:** CROSS_RUNTIME_CONSISTENCY

---

# WITNESS CONSTRAINTS

## Implementation Constraints

**Constraint 1:** No network IO

**Constraint 2:** No clock dependence

**Constraint 3:** No infrastructure dependence

**Constraint 4:** No side effects

**Constraint 5:** Pure functions only

---

## Constitutional Law Commitment

**Requirement:** Witness MUST commit to constitutional law itself

**Implementation:**
- Include constitutional_law_commitment as witness leaf
- Hash canonicalized semantic law manifest
- Commit to invariants, replay rules, witness rules, authority rules

**Purpose:** Prevent law drift without witness divergence

---

## Merkle Tree Construction

**Requirements:**
- Deterministic leaf ordering by leaf_id
- SHA-256 with domain separation (0x00 for leaf, 0x01 for parent)
- Odd node count handled by duplicating last node
- Maximum leaf count limit enforced

---

# WITNESS VERIFICATION

## Verification Process

1. **Recompute witness** from minimum replay set
2. **Compare** with persisted witness
3. **Detect** divergence
4. **Report** violations deterministically

## Verification Constraints

Verification MUST NOT depend on:
- External mutable state
- Network services
- Current timestamps
- Runtime configuration

Verification MUST:
- Use same algorithm as generation
- Use same minimum replay set
- Produce identical witness root for identical inputs

---

# WITNESS FAILURE SEMANTICS

## Failure Classification

Witness failures MUST be deterministic:
- **WITNESS_DIVERGENCE:** Witness does not match recomputed witness
- **INVALID_EVENT_STREAM:** Event stream cannot be parsed or is malformed
- **LINEAGE_VIOLATION:** Lineage contains cycles or duplicate edges
- **IDENTITY_DIVERGENCE:** Identity does not match content under declared law
- **CANONICALIZATION_ERROR:** Canonicalization fails

## Failure Handling

Witness failures MUST:
- Fail deterministically with structured failure codes
- Provide sufficient context for diagnosis
- Allow witness to be recomputed for verification

---

**Document ID:** CONSTITUTION-WITNESS-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
