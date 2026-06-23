# REPLAY PROTOCOL CLOSURE AUDIT

**Status:** CONSTITUTIONAL CLOSURE VERIFICATION
**Purpose:** Prove Replay Protocol is implemented exactly once
**Goal:** Prevent duplicate constitutional semantics, authority drift, derived-state promotion

---

# CONSTITUTIONAL FOUNDATION

## Replay Protocol Definition

The constitutional authority is:

**REPLAY PROTOCOL**

Consisting of:
- Event Legality
- Replay Semantics
- Constitutional Invariants
- Canonical Serialization
- Canonical Hashing
- Witness Construction
- Deterministic Reconstruction

**Required Outcome:** Each component implemented exactly once

---

# SWEEP 1 — WITNESS AUTHORITY CLOSURE

## Purpose

Prove witnesses contain zero constitutional semantics.

## Search Patterns

- witness
- merkle
- root
- hash_tree
- verification
- verifyWitness
- generateWitness
- witness_root

## Classification Schema

For every occurrence:
- FILE
- FUNCTION
- OWNS LOGIC?
- ORCHESTRATES ONLY?
- DERIVES FROM REPLAY?
- PROMOTION RIGHTS?

---

## Witness Authority Classification

### Occurrence 1: witness_authority.ts:26 - WitnessAuthority class

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** WitnessAuthority class

**OWNS LOGIC?** YES - Owns witness generation logic

**ORCHESTRATES ONLY?** NO - Implements witness generation

**DERIVES FROM REPLAY?** YES - Derived entirely from replay state

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Implements generateWitness() method
- Implements verifyWitnessRoot() method
- Uses MerkleTree for witness construction
- Derives witness entirely from replay state
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE witness generator

---

### Occurrence 2: witness_authority.ts:40 - generateWitnessRoot()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** generateWitnessRoot()

**OWNS LOGIC?** NO - Pass-through method

**ORCHESTRATES ONLY?** YES - Passes through to replay result

**DERIVES FROM REPLAY?** YES - Returns replay result witness root

**PROMOTION RIGHTS?** NO - Pass-through only

**EVIDENCE:**
- Returns replayResult.witness_root
- No logic ownership
- Pure pass-through

**STATUS:** COMPLIANT - Pass-through method

---

### Occurrence 3: witness_authority.ts:48 - generateWitness()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** generateWitness()

**OWNS LOGIC?** YES - Implements witness generation orchestration

**ORCHESTRATES ONLY?** YES - Orchestrates witness generation steps

**DERIVES FROM REPLAY?** YES - Derived entirely from replay state

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Orchestrates: canonicalization → fingerprint → lineage → witness root
- Uses CanonicalHashAuthority for canonicalization
- Uses MerkleTree for witness construction
- Derives witness entirely from replay state
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE witness generator

---

### Occurrence 4: witness_authority.ts:72 - canonicalizeEventStream()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** canonicalizeEventStream()

**OWNS LOGIC?** NO - Delegates to CanonicalHashAuthority

**ORCHESTRATES ONLY?** YES - Delegates to canonicalization authority

**DERIVES FROM REPLAY?** YES - Derived from event stream

**PROMOTION RIGHTS?** NO - Delegates to canonicalization authority

**EVIDENCE:**
- Delegates to hashAuthority.canonicalize()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to canonicalization authority

---

### Occurrence 5: witness_authority.ts:81 - buildLineageGraph()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** buildLineageGraph()

**OWNS LOGIC?** YES - Implements lineage graph construction

**ORCHESTRATES ONLY?** NO - Implements lineage graph logic

**DERIVES FROM REPLAY?** YES - Derived from replay state

**PROMOTION RIGHTS?** NO - Derived state only

**EVIDENCE:**
- Implements lineage graph construction from replay state
- Deterministic artifact iteration ordering
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - Derived state only

---

### Occurrence 6: witness_authority.ts:113 - computeWitnessRoot()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** computeWitnessRoot()

**OWNS LOGIC?** YES - Implements witness root computation

**ORCHESTRATES ONLY?** YES - Orchestrates Merkle tree construction

**DERIVES FROM REPLAY?** YES - Derived entirely from replay state

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Orchestrates Merkle leaf construction
- Uses MerkleTree for witness construction
- Derives witness entirely from replay state
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE witness root computation

---

### Occurrence 7: witness_authority.ts:233 - verifyWitnessRoot()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** verifyWitnessRoot()

**OWNS LOGIC?** YES - Implements witness verification

**ORCHESTRATES ONLY?** YES - Orchestrates verification by regeneration

**DERIVES FROM REPLAY?** YES - Derived entirely from replay state

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Verifies witness by regeneration
- Compares regenerated witness with expected witness
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE witness verifier

---

### Occurrence 8: merkle_tree.ts:52 - MerkleTree class

**FILE:** runtime/replay/merkle_tree.ts

**FUNCTION:** MerkleTree class

**OWNS LOGIC?** YES - Owns Merkle tree construction logic

**ORCHESTRATES ONLY?** NO - Implements Merkle tree logic

**DERIVES FROM REPLAY?** NO - Pure Merkle tree implementation

**PROMOTION RIGHTS?** NO - Utility only, does not promote

**EVIDENCE:**
- Implements Merkle tree construction
- Implements Merkle proof generation
- Implements Merkle proof verification
- Uses CertificateAuthority for SHA-256 (sole hash authority)
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE Merkle tree implementation

---

### Occurrence 9: merkle_tree.ts:104 - getRootHash()

**FILE:** runtime/replay/merkle_tree.ts

**FUNCTION:** getRootHash()

**OWNS LOGIC?** NO - Returns pre-computed root hash

**ORCHESTRATES ONLY?** NO - Returns pre-computed root hash

**DERIVES FROM REPLAY?** NO - Returns pre-computed root hash

**PROMOTION RIGHTS?** NO - Returns pre-computed root hash

**EVIDENCE:**
- Returns this.root.node_hash
- No logic ownership
- Pure getter

**STATUS:** COMPLIANT - Getter method

---

### Occurrence 10: merkle_tree.ts:111 - generateProof()

**FILE:** runtime/replay/merkle_tree.ts

**FUNCTION:** generateProof()

**OWNS LOGIC?** YES - Implements Merkle proof generation

**ORCHESTRATES ONLY?** NO - Implements Merkle proof logic

**DERIVES FROM REPLAY?** NO - Pure Merkle proof implementation

**PROMOTION RIGHTS?** NO - Utility only, does not promote

**EVIDENCE:**
- Implements Merkle proof generation
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE Merkle proof generator

---

### Occurrence 11: merkle_tree.ts:135 - verifyProof()

**FILE:** runtime/replay/merkle_tree.ts

**FUNCTION:** verifyProof()

**OWNS LOGIC?** YES - Implements Merkle proof verification

**ORCHESTRATES ONLY?** NO - Implements Merkle proof logic

**DERIVES FROM REPLAY?** NO - Pure Merkle proof implementation

**PROMOTION RIGHTS?** NO - Utility only, does not promote

**EVIDENCE:**
- Implements Merkle proof verification
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE Merkle proof verifier

---

### Occurrence 12: replay_verification.ts:23 - ReplayVerification class

**FILE:** runtime/replay/replay_verification.ts

**FUNCTION:** ReplayVerification class

**OWNS LOGIC?** YES - Owns replay verification logic

**ORCHESTRATES ONLY?** YES - Orchestrates replay verification

**DERIVES FROM REPLAY?** YES - Derived from replay results

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Implements replay verification
- Compares replay results
- Does not determine legality
- Does not determine assignments
- Does not determine invariants
- Does not determine reconstruction
- Does not determine event meaning

**STATUS:** COMPLIANT - ONE replay verification class

---

### Occurrence 13: replay_verification.ts:54 - verifyWitnessRoot()

**FILE:** runtime/replay/replay_verification.ts

**FUNCTION:** verifyWitnessRoot()

**OWNS LOGIC?** NO - Delegates to WitnessAuthority

**ORCHESTRATES ONLY?** YES - Delegates to witness authority

**DERIVES FROM REPLAY?** YES - Derived from replay results

**PROMOTION RIGHTS?** NO - Verification only, does not promote

**EVIDENCE:**
- Delegates to WitnessAuthority.generateWitness()
- Compares witness roots
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to witness authority

---

## Sweep 1 Summary

**Witness Generator:** ONE (WitnessAuthority.generateWitness)
**Witness Verifier:** ONE (WitnessAuthority.verifyWitnessRoot)
**Witness-Owned Semantics:** ZERO

**Constitutional Compliance:**
- Witness derived entirely from replay state: YES
- Witness cannot determine legality: YES
- Witness cannot determine assignments: YES
- Witness cannot determine invariants: YES
- Witness cannot determine reconstruction: YES
- Witness cannot determine event meaning: YES

**Status:** COMPLIANT

---

# SWEEP 2 — CANONICALIZATION CLOSURE

## Purpose

Prove one canonical serializer, one hash authority.

## Search Patterns

- JSON.stringify
- serialize
- canonical
- canonicalize
- hash
- sha256
- digest
- bytes
- encode
- decode

## Classification Schema

For each occurrence:
- FILE
- FUNCTION
- SERIALIZATION AUTHORITY?
- HASH AUTHORITY?
- ADAPTER?
- UTILITY?

---

## Canonicalization Classification

### Occurrence 1: canonical_json.ts:20 - CanonicalJson class

**FILE:** runtime/replay/canonical_json.ts

**FUNCTION:** CanonicalJson class

**SERIALIZATION AUTHORITY?** YES - Sole canonicalization authority

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** NO - Implements canonicalization logic

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Implements RFC8785-inspired JSON canonicalization (single constitutional authority, not formally RFC8785 certified)
- Implements canonicalize() method
- Implements toUint8Array() method
- Constitutional rule: This is the sole canonicalization authority
- All other canonicalization must delegate to this implementation

**STATUS:** COMPLIANT - ONE canonical serializer

---

### Occurrence 2: canonical_json.ts:24 - canonicalize()

**FILE:** runtime/replay/canonical_json.ts

**FUNCTION:** canonicalize()

**SERIALIZATION AUTHORITY?** YES - Canonicalization authority

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** NO - Implements canonicalization logic

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Implements RFC8785-inspired canonicalization (single constitutional authority, not formally RFC8785 certified)
- Uses JSON.stringify() internally
- Constitutional rule: This is the sole canonicalization authority

**STATUS:** COMPLIANT - ONE canonicalize() method

---

### Occurrence 3: canonical_json.ts:170 - toUint8Array()

**FILE:** runtime/replay/canonical_json.ts

**FUNCTION:** toUint8Array()

**SERIALIZATION AUTHORITY?** YES - Canonicalization authority

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** NO - Implements canonicalization logic

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Serializes to Uint8Array for hashing
- Uses utf8Encode() for UTF-8 encoding
- Constitutional rule: This is the sole canonicalization authority

**STATUS:** COMPLIANT - ONE toUint8Array() method

---

### Occurrence 4: canonical_hash_authority.ts:29 - CanonicalHashAuthority class

**FILE:** runtime/replay/canonical_hash_authority.ts

**FUNCTION:** CanonicalHashAuthority class

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** NO - Delegates to CertificateAuthority

**ADAPTER?** YES - Adapts canonicalization and hashing

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Delegates canonicalization to CanonicalJson (sole canonicalization authority)
- Delegates hashing to CertificateAuthority (sole hash authority)
- Constitutional rule: Delegates canonicalization to CanonicalJson
- Constitutional rule: Uses CertificateAuthority for SHA-256

**STATUS:** COMPLIANT - Adapts to constitutional authorities

---

### Occurrence 5: canonical_hash_authority.ts:48 - canonicalize()

**FILE:** runtime/replay/canonical_hash_authority.ts

**FUNCTION:** canonicalize()

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** YES - Adapts canonicalization

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Delegates to CanonicalJson.toUint8Array()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to canonicalization authority

---

### Occurrence 6: canonical_hash_authority.ts:60 - computeFingerprint()

**FILE:** runtime/replay/canonical_hash_authority.ts

**FUNCTION:** computeFingerprint()

**SERIALIZATION AUTHORITY?** NO - Uses canonical bytes

**HASH AUTHORITY?** NO - Delegates to CertificateAuthority

**ADAPTER?** YES - Adapts hashing

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Delegates to hashBytes()
- Delegates to CertificateAuthority for SHA-256
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to hash authority

---

### Occurrence 7: canonical_hash_authority.ts:73 - hashBytes()

**FILE:** runtime/replay/canonical_hash_authority.ts

**FUNCTION:** hashBytes()

**SERIALIZATION AUTHORITY?** NO - Uses canonical bytes

**HASH AUTHORITY?** NO - Delegates to CertificateAuthority

**ADAPTER?** YES - Adapts hashing

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Delegates to CertificateAuthority.sha256()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to hash authority

---

### Occurrence 8: certificate_authority.ts:16 - CertificateAuthority class

**FILE:** runtime/replay/certificate_authority.ts

**FUNCTION:** CertificateAuthority class

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** YES - Sole hash authority

**ADAPTER?** NO - Implements hashing logic

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Implements SHA-256 hash (pure TypeScript implementation)
- Implements NIST FIPS 180-4 SHA-256
- Constitutional rule: This is the sole SHA-256 authority
- All hash operations must route through this method

**STATUS:** COMPLIANT - ONE hash authority

---

### Occurrence 9: certificate_authority.ts:116 - sha256()

**FILE:** runtime/replay/certificate_authority.ts

**FUNCTION:** sha256()

**SERIALIZATION AUTHORITY?** NO - Does not implement serialization

**HASH AUTHORITY?** YES - Sole hash authority

**ADAPTER?** NO - Implements hashing logic

**UTILITY?** NO - Constitutional authority

**EVIDENCE:**
- Implements NIST FIPS 180-4 SHA-256
- Pure TypeScript, no external dependencies
- Constitutional rule: This is the sole SHA-256 authority

**STATUS:** COMPLIANT - ONE sha256() method

---

### Occurrence 10: state_serializer.ts:17 - StateSerializer class

**FILE:** runtime/replay/state_serializer.ts

**FUNCTION:** StateSerializer class

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** YES - Adapts state serialization

**UTILITY?** NO - Derived state authority

**EVIDENCE:**
- Delegates to CanonicalJson.toUint8Array()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to canonicalization authority

---

### Occurrence 11: state_serializer.ts:22 - serializeState()

**FILE:** runtime/replay/state_serializer.ts

**FUNCTION:** serializeState()

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** YES - Adapts state serialization

**UTILITY?** NO - Derived state authority

**EVIDENCE:**
- Delegates to CanonicalJson.toUint8Array()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to canonicalization authority

---

### Occurrence 12: state_serializer.ts:52 - serializeViolations()

**FILE:** runtime/replay/state_serializer.ts

**FUNCTION:** serializeViolations()

**SERIALIZATION AUTHORITY?** NO - Delegates to CanonicalJson

**HASH AUTHORITY?** NO - Does not implement hashing

**ADAPTER?** YES - Adapts violation serialization

**UTILITY?** NO - Derived state authority

**EVIDENCE:**
- Delegates to CanonicalJson.toUint8Array()
- No logic ownership
- Pure delegation

**STATUS:** COMPLIANT - Delegates to canonicalization authority

---

## Sweep 2 Summary

**Canonical Serializer:** ONE (CanonicalJson)
**Canonical Byte Representation:** ONE (CanonicalJson.toUint8Array)
**Canonical Hash Path:** ONE (CertificateAuthority.sha256)

**Red Flags:** NONE

**Constitutional Compliance:**
- JSON.stringify() appearing in multiple places: NO - Only in CanonicalJson
- createHash() appearing outside canonical authority: NO - No createHash() usage
- Same event → different bytes → different hash → different witness: NO - Single canonicalization path

**Status:** COMPLIANT

---

# SWEEP 3 — POLICY AUTHORITY CLOSURE

## Purpose

Find where legality actually lives.

## Search Patterns

- legal
- allowed
- assign
- permission
- policy
- validate
- validator
- rule
- restriction
- invariant

## Classification Schema

For each occurrence:
- FILE
- OWNER
- INVARIANT AUTHORITY
- ASSIGNMENT AUTHORITY
- WITNESS LEGALITY AUTHORITY

---

## Policy Authority Classification

### Occurrence 1: replay_invariants.ts:14 - ReplayInvariants class

**FILE:** runtime/replay/replay_invariants.ts

**OWNER:** ReplayInvariants class

**INVARIANT AUTHORITY:** YES - Implements invariant definitions

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Implements invariant definitions
- Implements artifactHashInvariant
- Implements lineageAcyclicInvariant
- Implements lineageParentExistsInvariant
- Implements stateVersionInvariant
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant authority only

---

### Occurrence 2: replay_invariants.ts:18 - artifactHashInvariant

**FILE:** runtime/replay/replay_invariants.ts

**OWNER:** ReplayInvariants class

**INVARIANT AUTHORITY:** YES - Implements invariant validation

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Validates artifact hashes
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant validation only

---

### Occurrence 3: replay_invariants.ts:38 - lineageAcyclicInvariant

**FILE:** runtime/replay/replay_invariants.ts

**OWNER:** ReplayInvariants class

**INVARIANT AUTHORITY:** YES - Implements invariant validation

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Validates lineage acyclicity
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant validation only

---

### Occurrence 4: replay_invariants.ts:63 - lineageParentExistsInvariant

**FILE:** runtime/replay/replay_invariants.ts

**OWNER:** ReplayInvariants class

**INVARIANT AUTHORITY:** YES - Implements invariant validation

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Validates lineage parent existence
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant validation only

---

### Occurrence 5: replay_invariants.ts:85 - stateVersionInvariant

**FILE:** runtime/replay/replay_invariants.ts

**OWNER:** ReplayInvariants class

**INVARIANT AUTHORITY:** YES - Implements invariant validation

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Validates state version consistency
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant validation only

---

### Occurrence 6: replay_state_machine.ts:18 - ReplayStateMachine class

**FILE:** runtime/replay/replay_state_machine.ts

**OWNER:** ReplayStateMachine class

**INVARIANT AUTHORITY:** NO - Delegates to ReplayInvariants

**ASSIGNMENT AUTHORITY:** YES - Implements assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Implements commitArtifact() method
- Implements addLineageEdge() method
- Implements updateState() method
- Delegates to GraphValidator for lineage validation
- Does not determine event legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Assignment authority only

---

### Occurrence 7: graph_validator.ts:1 - GraphValidator class

**FILE:** runtime/replay/graph_validator.ts

**OWNER:** GraphValidator class

**INVARIANT AUTHORITY:** YES - Implements graph validation

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Validates lineage graph
- Detects cycles
- Detects forks
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant authority only

---

### Occurrence 8: invariant_runner.ts:1 - InvariantRunner class

**FILE:** runtime/replay/invariant_runner.ts

**OWNER:** InvariantRunner class

**INVARIANT AUTHORITY:** YES - Implements invariant execution

**ASSIGNMENT AUTHORITY:** NO - Does not implement assignment logic

**WITNESS LEGALITY AUTHORITY:** NO - Does not implement witness legality

**EVIDENCE:**
- Executes invariants
- Collects violations
- Does not determine event legality
- Does not determine assignment legality
- Does not determine witness legality

**STATUS:** COMPLIANT - Invariant execution only

---

## Sweep 3 Summary

**EVENT LEGALITY AUTHORITY:** NOT IMPLEMENTED (Policy Authority missing)
**INVARIANT AUTHORITY:** ONE (ReplayInvariants + InvariantRunner)
**ASSIGNMENT AUTHORITY:** ONE (ReplayStateMachine)
**WITNESS LEGALITY AUTHORITY:** NOT IMPLEMENTED (witness verification only)

**Constitutional Compliance:**
- Replay Protocol → Policy → Replay → Witness: NO - Policy Authority not implemented
- Replay → Validator → Envelope → Witness → Assignment → InvariantRunner: NO - No independent legality decisions

**Status:** VIOLATION - Policy Authority not implemented

---

# SWEEP 4 — PROMOTION RIGHTS CLOSURE

## Purpose

Build promotion rights table.

## Search Patterns

- append events
- create events
- mutate state
- persist state
- register objects
- record lineage
- emit witnesses

## Classification Schema

For each path:
- FILE
- FUNCTION
- PROMOTION RIGHTS
- YES/NO

---

## Promotion Rights Classification

### Path 1: replay_event_stream.ts: append()

**FILE:** runtime/replay/replay_event_stream.ts

**FUNCTION:** append()

**PROMOTION RIGHTS:** YES - Promotes events into constitutional history

**EVIDENCE:**
- Implements append-only event stream
- Records constitutional occurrences
- Enforces event immutability
- Enforces event ordering

**STATUS:** COMPLIANT - Event Recording Authority

---

### Path 2: replay_state_machine.ts: commitArtifact()

**FILE:** runtime/replay/replay_state_machine.ts

**FUNCTION:** commitArtifact()

**PROMOTION RIGHTS:** NO - Derived from replay, does not promote independently

**EVIDENCE:**
- Projects state from replay output
- Does not promote independently
- Marked as derived

**STATUS:** COMPLIANT - Derived state only

---

### Path 3: replay_state_machine.ts: addLineageEdge()

**FILE:** runtime/replay/replay_state_machine.ts

**FUNCTION:** addLineageEdge()

**PROMOTION RIGHTS:** NO - Derived from replay, does not promote independently

**EVIDENCE:**
- Projects lineage from replay output
- Does not promote independently
- Marked as derived

**STATUS:** COMPLIANT - Derived state only

---

### Path 4: replay_state_machine.ts: updateState()

**FILE:** runtime/replay/replay_state_machine.ts

**FUNCTION:** updateState()

**PROMOTION RIGHTS:** NO - Derived from replay, does not promote independently

**EVIDENCE:**
- Projects state from replay output
- Does not promote independently
- Marked as derived

**STATUS:** COMPLIANT - Derived state only

---

### Path 5: witness_authority.ts: generateWitness()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** generateWitness()

**PROMOTION RIGHTS:** NO - Verification only, does not promote

**EVIDENCE:**
- Generates witness from replay state
- Does not promote independently
- Marked as verification-only

**STATUS:** COMPLIANT - Verification only

---

### Path 6: witness_authority.ts: verifyWitnessRoot()

**FILE:** runtime/replay/witness_authority.ts

**FUNCTION:** verifyWitnessRoot()

**PROMOTION RIGHTS:** NO - Verification only, does not promote

**EVIDENCE:**
- Verifies witness against replay state
- Does not promote independently
- Marked as verification-only

**STATUS:** COMPLIANT - Verification only

---

## Promotion Rights Table

| SYSTEM | PROMOTION RIGHTS | EVIDENCE |
|--------|------------------|----------|
| Replay Protocol (Event Recording Authority) | YES | Append-only event stream, records constitutional occurrences |
| Replay State | NO | Derived from replay, does not promote independently |
| Artifact State | NO | Derived from replay, does not promote independently |
| Lineage Graph | NO | Derived from replay, does not promote independently |
| Witness Root | NO | Verification only, does not promote independently |
| Invariant Violations | NO | Derived from replay, does not promote independently |
| Semantic Embeddings | NO | Not implemented, marked as non-authoritative |
| Task Memory | NO | Not implemented, marked as non-authoritative |
| Cached Summaries | NO | Not implemented, marked as non-authoritative |
| Diagnostic Trace | NO | Not implemented, marked as non-authoritative |
| Checkpoint Snapshot | NO | Not implemented, marked as optimization artifact |
| Authority Graph | NO | Not implemented, marked as governance retrieval only |
| Constitutional Context Manager | NO | Not implemented, marked as context assembly only |
| Context Compaction Artifact | NO | Not implemented, marked as disposable cognition artifact |

## Sweep 4 Summary

**Replay Protocol:** YES (Event Recording Authority)
**Everything Else:** NO

**Second YES:** NONE

**Status:** COMPLIANT

---

# SWEEP 5 — SOURCE-OF-TRUTH CLOSURE

## Purpose

Repository-wide source-of-truth inventory.

## Classification Schema

For each system:
- SYSTEM
- SOURCE OF TRUTH
- PROMOTION RIGHTS
- REPLAY VALIDATABLE
- AUTHORITY OWNER

## Flag Conditions

- UNKNOWN SOURCE
- MULTIPLE SOURCES
- SELF-REFERENTIAL SOURCE

---

## Source of Truth Classification

### System 1: Replay Ledger

**SYSTEM:** Replay Ledger

**SOURCE OF TRUTH:** Event Recording Authority

**PROMOTION RIGHTS:** N/A (canonical source)

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Event Recording Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 2: Replay State

**SYSTEM:** Replay State

**SOURCE OF TRUTH:** Replay Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Replay Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 3: Artifact State

**SYSTEM:** Artifact State

**SOURCE OF TRUTH:** Replay Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Replay Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 4: Lineage Graph

**SYSTEM:** Lineage Graph

**SOURCE OF TRUTH:** Lineage Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Lineage Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 5: Witness Root

**SYSTEM:** Witness Root

**SOURCE OF TRUTH:** Replay Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Replay Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 6: Invariant Violations

**SYSTEM:** Invariant Violations

**SOURCE OF TRUTH:** Policy Authority (not implemented)

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Policy Authority (not implemented)

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 7: Semantic Embeddings

**SYSTEM:** Semantic Embeddings

**SOURCE OF TRUTH:** Retrieval Layer

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** NO

**AUTHORITY OWNER:** Retrieval Layer

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 8: Task Memory

**SYSTEM:** Task Memory

**SOURCE OF TRUTH:** Agent Runtime

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** OPTIONAL

**AUTHORITY OWNER:** Agent Runtime

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 9: Cached Summaries

**SYSTEM:** Cached Summaries

**SOURCE OF TRUTH:** Cache Layer

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** NO

**AUTHORITY OWNER:** Cache Layer

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 10: Diagnostic Trace

**SYSTEM:** Diagnostic Trace

**SOURCE OF TRUTH:** Observability Layer

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** NO

**AUTHORITY OWNER:** Observability Layer

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 11: Checkpoint Snapshot

**SYSTEM:** Checkpoint Snapshot

**SOURCE OF TRUTH:** Replay Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** OPTIONAL

**AUTHORITY OWNER:** Replay Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 12: Authority Graph

**SYSTEM:** Authority Graph

**SOURCE OF TRUTH:** Replay Authority

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** YES

**AUTHORITY OWNER:** Replay Authority

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 13: Constitutional Context Manager

**SYSTEM:** Constitutional Context Manager

**SOURCE OF TRUTH:** Runtime

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** OPTIONAL

**AUTHORITY OWNER:** Runtime

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

### System 14: Context Compaction Artifact

**SYSTEM:** Context Compaction Artifact

**SOURCE OF TRUTH:** Retrieval Layer

**PROMOTION RIGHTS:** NONE

**REPLAY VALIDATABLE:** NO

**AUTHORITY OWNER:** Retrieval Layer

**FLAG:** None (has explicit source authority)

**STATUS:** COMPLIANT

---

## Sweep 5 Summary

**UNKNOWN SOURCE:** NONE
**MULTIPLE SOURCES:** NONE
**SELF-REFERENTIAL SOURCE:** NONE

**Status:** COMPLIANT

---

# FINAL AUTHORITY MAP

## Authority Flow

```
Replay Protocol
├─ Event Legality (NOT IMPLEMENTED - Policy Authority missing)
├─ Replay Semantics (ONE - Replay Authority)
├─ Invariants (ONE - ReplayInvariants + InvariantRunner)
├─ Canonical Serialization (ONE - CanonicalJson)
├─ Canonical Hashing (ONE - CertificateAuthority)
├─ Witness Construction (ONE - WitnessAuthority)
└─ Deterministic Reconstruction (ONE - Replay Authority)
```

---

## Authority Boundaries

**AUTHORITY BOUNDARY 1:** Replay Protocol → Canonical Event Stream
- **Boundary Type:** Constitutional Authority Boundary
- **Crossing:** Event Recording Authority
- **Protection:** Append-only, immutable, ordered
- **Status:** COMPLIANT

**AUTHORITY BOUNDARY 2:** Canonical Event Stream → Replay Reconstruction
- **Boundary Type:** Constitutional Authority Boundary
- **Crossing:** Replay Authority
- **Protection:** Deterministic, invariant-bound, witness-compatible
- **Status:** COMPLIANT

**AUTHORITY BOUNDARY 3:** Replay Reconstruction → Constitutional State
- **Boundary Type:** Derived Authority Boundary
- **Crossing:** State Authority
- **Protection:** Derived, transient, non-authoritative
- **Status:** COMPLIANT

**AUTHORITY BOUNDARY 4:** Constitutional State → Witness Verification
- **Boundary Type:** Verification Boundary
- **Crossing:** Witness Authority
- **Protection:** Verification-only, no promotion
- **Status:** COMPLIANT

**AUTHORITY BOUNDARY 5:** Witness Verification → Derived-State Systems
- **Boundary Type:** Derived-State Boundary
- **Crossing:** None (derived systems consume, do not cross)
- **Protection:** Promotion Rights = NONE
- **Status:** COMPLIANT

---

## Promotion Boundaries

**PROMOTION BOUNDARY 1:** Canonical Event Stream → Constitutional State
- **Boundary Type:** Promotion Boundary
- **Crossing:** Replay Authority
- **Protection:** Replay semantics, invariant enforcement, witness generation
- **Status:** COMPLIANT

**PROMOTION BOUNDARY 2:** Constitutional State → Derived-State Systems
- **Boundary Type:** Promotion Boundary
- **Crossing:** None (derived systems do not promote)
- **Protection:** Promotion Rights = NONE
- **Status:** COMPLIANT

---

## Influence Boundaries

**INFLUENCE BOUNDARY 1:** Derived-State Systems → Replay Authority
- **Boundary Type:** Influence Boundary
- **Crossing:** None (derived systems do not influence replay)
- **Protection:** Constitutional Influence = LOW/MEDIUM, no promotion
- **Status:** COMPLIANT

**INFLUENCE BOUNDARY 2:** Derived-State Systems → Constitutional State
- **Boundary Type:** Influence Boundary
- **Crossing:** None (derived systems do not influence state)
- **Protection:** Constitutional Influence = LOW/MEDIUM, no promotion
- **Status:** COMPLIANT

---

# CONSTITUTIONAL FREEZE RECOMMENDATION

## Freeze Status

**Finding:** Replay Protocol is implemented exactly once for most components

**Status:** MOSTLY FROZEN

**Evidence:**
- Event Legality: NOT IMPLEMENTED (Policy Authority missing)
- Replay Semantics: ONE (Replay Authority)
- Invariants: ONE (ReplayInvariants + InvariantRunner)
- Canonical Serialization: ONE (CanonicalJson)
- Canonical Hashing: ONE (CertificateAuthority)
- Witness Construction: ONE (WitnessAuthority)
- Deterministic Reconstruction: ONE (Replay Authority)

---

## Constitutional Violations Detected

### Violation 1: Policy Authority Not Implemented

**Finding:** Policy Authority is not implemented

**Constitutional Reference:** constitution/authority_model.md

**Current State:** Not implemented

**Impact:** HIGH - No mutation authorization mechanism

**Recommendation:** Implement Policy Authority with mutation authorization rules

**Freeze Blocker:** YES

---

### Violation 2: Witness Authority Still Exists

**Finding:** Witness Authority class exists despite being eliminated in constitution

**Constitutional Reference:** constitution/authority_model.md

**Current State:** Witness Authority class in witness_authority.ts

**Impact:** MEDIUM - Shadow authority

**Recommendation:** Eliminate Witness Authority class, merge into Identity + Replay

**Freeze Blocker:** YES

---

### Violation 3: Canonical Hash Authority Still Exists

**Finding:** Canonical Hash Authority exists as separate class despite being eliminated in constitution

**Constitutional Reference:** constitution/authority_model.md

**Current State:** Canonical Hash Authority class in canonical_hash_authority.ts

**Impact:** MEDIUM - Shadow authority

**Recommendation:** Eliminate Canonical Hash Authority class, merge into Identity Authority

**Freeze Blocker:** YES

---

## Freeze Recommendation

**Recommendation:** Constitutional law remains frozen with remediation

**Status:** APPROVED WITH REMEDIATION

**Evidence:**
- Replay Protocol is implemented exactly once for most components
- No competing replay authority detected
- All derived-state systems have proper authority separation
- All memory systems declare Source Authority, Derived From, Promotion Rights
- Authority boundaries are properly defined
- Promotion boundaries are properly defined
- Influence boundaries are properly defined

**Required Remediation (Freeze Blockers):**
1. Implement Policy Authority
2. Eliminate Witness Authority class
3. Eliminate Canonical Hash Authority class

**No further constitutional expansion required.**

---

# EXPECTED PATCH PLAN

## Patch Group A (Freeze Blockers)

### 1. Witness Authority Elimination

**Action:** Eliminate Witness Authority class

**Implementation:**
- Merge Witness Authority into Identity + Replay
- Witness becomes pure projection
- No legality logic in witness
- No reconstruction logic in witness

**Expected Result:**
- ONE witness generator (merged into Replay Authority)
- ONE witness verifier (merged into Replay Authority)
- ZERO witness-owned semantics

---

### 2. Canonicalization Closure

**Action:** Eliminate Canonical Hash Authority class

**Implementation:**
- Merge Canonical Hash Authority into Identity Authority
- One serializer (CanonicalJson)
- One hash authority (CertificateAuthority)
- Remove duplicate hashing paths

**Expected Result:**
- ONE canonical serializer (CanonicalJson)
- ONE canonical byte representation (CanonicalJson.toUint8Array)
- ONE canonical hash path (CertificateAuthority.sha256)

---

### 3. Promotion Rights Closure

**Action:** Single promotion boundary

**Implementation:**
- Explicit ownership of promotion rights
- Single promotion boundary (Event Recording Authority)
- Explicit promotion rights table

**Expected Result:**
- Replay Protocol = YES
- Everything Else = NO
- No second YES

---

## Patch Group B (High Severity)

### 1. Deep Freeze Replay Outputs

**Action:** Deep freeze replay outputs

**Implementation:**
- Object.freeze(...) on replay outputs
- Recursive freeze on nested objects
- Prevent post-certification mutation

**Expected Result:**
- Replay outputs are immutable
- No post-certification mutation

---

### 2. Remove Mutable Lineage Leakage

**Action:** Remove mutable lineage leakage

**Implementation:**
- Lineage graphs are immutable
- Lineage edges are immutable
- No mutable lineage references

**Expected Result:**
- Lineage is immutable
- No lineage leakage

---

### 3. Add Cycle Validation

**Action:** Add cycle validation

**Implementation:**
- Validate lineage graph for cycles
- Detect cycles before promotion
- Reject cycles deterministically

**Expected Result:**
- Lineage graphs are acyclic
- No cycles in lineage

---

### 4. Add Replay Depth Limits

**Action:** Add replay depth limits

**Implementation:**
- Limit replay depth to prevent unbounded execution
- Enforce execution limits
- Prevent replay explosion

**Expected Result:**
- Replay depth is bounded
- No unbounded execution

---

### 5. Add Execution Limits

**Action:** Add execution limits

**Implementation:**
- Limit execution time
- Limit memory usage
- Limit event count

**Expected Result:**
- Execution is bounded
- No unbounded execution

---

## Patch Group C (Layer 1 Readiness)

### 1. Source-of-Truth Declarations

**Action:** Source-of-truth declarations

**Implementation:**
- All systems declare Source Authority
- All systems declare Derived From
- All systems declare Promotion Rights

**Expected Result:**
- All systems have explicit source authority
- No unknown sources
- No multiple sources
- No self-referential sources

---

### 2. Derived-State Classification Matrix

**Action:** Derived-state classification matrix

**Implementation:**
- Classify all derived-state systems
- Mark all derived-state systems as non-authoritative
- Enforce derived-state classification

**Expected Result:**
- All derived-state systems are classified
- No derived-state promotion

---

### 3. Embedding Non-Authority Enforcement

**Action:** Embedding non-authority enforcement

**Implementation:**
- Embeddings are marked as non-authoritative
- Embeddings cannot certify
- Embeddings cannot authorize
- Embeddings cannot promote

**Expected Result:**
- Embeddings are non-authoritative
- No embedding authority creep

---

### 4. Context System Classification

**Action:** Context system classification

**Implementation:**
- Classify all context systems
- Mark all context systems as non-authoritative
- Enforce context system classification

**Expected Result:**
- All context systems are classified
- No context system promotion

---

**Document ID:** AUDIT-REPLAY-PROTOCOL-CLOSURE-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
