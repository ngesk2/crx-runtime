# REPLAY LAW

**Status:** FROZEN CONSTITUTIONAL AUTHORITY
**Scope:** Replay determinism and reconstruction law only. No implementation details.

---

# REPLAY DETERMINISM

## Constitutional Requirement

Deterministic reconstruction requires sufficient information to:
1. Reproduce every identity assignment under declared law
2. Traverse every lineage edge in recorded order
3. Replay every event occurrence in constitutional order
4. Re-evaluate every policy decision under the policy law active at each boundary
5. Verify every persisted witness without external mutable reference
6. Produce identical state projection at any declared boundary

---

# MINIMUM REPLAY SET

| Element | Constitutional Justification |
|---------|------------------------------|
| **Complete event sequence** | Axiom 3 — history is append-only events; without total ordering of occurrences, constitutional time is undefined |
| **Artifact content or content-addressed retrievals for all referenced identities** | Axiom 1 — identity is content-derived; reconstruction cannot resolve artifacts without content |
| **Identity law version for each era** | Axiom 1 — identity determinism is versioned law, not implicit convention |
| **Complete lineage edge set** | Axiom 2 — ancestry is constitutional fact; state without lineage is ungrounded |
| **Policy law version for each era** | Axiom 5 — mutations require policy; replay must re-derive authorization, not assume it |
| **Recorded policy decisions** | Axiom 5 — dispositions are facts, not recomputable opinions without recorded judgment context |
| **Claim records and dispositions** | Links propositional intent to authorized mutations; legitimacy chain is not inferable from events alone |
| **Actor identity for each event** | Agency and authority chains require knowing who acted |
| **Persisted witness attestations (when recorded)** | Axiom 8 — attestations are part of the integrity substrate when durably recorded |
| **Declared reconstruction boundary** | Axiom 4 — determinism is bounded to a point in constitutional time |

---

# EXPLICIT EXCLUSIONS FROM MINIMUM REPLAY SET

- State projections (derived)
- Ephemeral caches and agent context (non-constitutional)
- Narrative summaries (non-authoritative)
- Transport metadata not recorded as constitutional events
- Implementation-specific storage coordinates

---

# REPLAY CONSTRAINTS

## Determinism Constraints

Replay MUST be:
- **Deterministic:** Same inputs → same outputs
- **Pure:** No side effects during reconstruction
- **Infrastructure-independent:** No network IO, no clock dependence
- **Transport-independent:** No HTTP, no protocol dependencies
- **Provider-independent:** No external provider dependencies

Replay MUST NEVER depend on:
- Live databases
- Mutable APIs
- Network timing
- Current clocks
- External providers
- Runtime side effects

---

## Reconstruction Boundaries

Replay MUST support reconstruction at any declared boundary:
- Event index
- Policy version boundary
- Identity law version boundary
- Custom constitutional time marker

Replay MUST produce identical state projections for identical boundaries.

---

## Integrity Verification

Replay MUST verify:
- Lineage acyclicity
- Identity consistency
- Policy decision validity
- Witness attestation correctness
- Invariant satisfaction

Replay MUST detect:
- Divergence from expected state
- Invalid lineage edges
- Missing required facts
- Violated invariants

---

# REPLAY PROOF

## Witness Generation

Witness generation MUST:
- Use minimum replay set as input
- Apply deterministic canonicalization
- Compute deterministic fingerprint
- Verify lineage integrity
- Reconstruct state deterministically
- Generate witness root via Merkle tree

Witness MUST be:
- Deterministic: same inputs → same witness
- Pure: no side effects
- Infrastructure-independent: no external dependencies
- Verifiable: can be recomputed independently

---

## Witness Verification

Witness verification MUST:
- Recompute witness from minimum replay set
- Compare with persisted witness
- Detect divergence
- Report violations deterministically

Witness verification MUST NOT depend on:
- External mutable state
- Network services
- Current timestamps
- Runtime configuration

---

# REPLAY FAILURE SEMANTICS

## Failure Classification

Replay failures MUST be deterministic:
- **INVALID_EVENT_STREAM:** Event stream cannot be parsed or is malformed
- **INVALID_EVENT_ORDER:** Events violate constitutional ordering
- **INVALID_LINEAGE:** Lineage contains cycles or duplicate edges
- **IDENTITY_DIVERGENCE:** Identity does not match content under declared law
- **POLICY_VIOLATION:** Mutation lacks required policy authorization
- **INVARIANT_VIOLATION:** Reconstructed state violates invariant
- **WITNESS_DIVERGENCE:** Witness does not match recomputed witness

## Failure Handling

Replay MUST:
- Fail deterministically with structured failure codes
- Never throw generic errors
- Provide sufficient context for diagnosis
- Allow replay to be re-executed for verification

---

# REPLAY VERSIONING

## Version Requirements

Replay MUST version:
- Replay algorithm version
- Identity law version
- Policy law version
- Invariant version
- Canonicalization version

Version changes MUST:
- Be recorded in event stream
- Be traceable in minimum replay set
- Be verifiable in witness generation

---

**Document ID:** CONSTITUTION-REPLAY-LAW-1.0
**Status:** FROZEN
**Amendment:** Requires constitutional amendment process
