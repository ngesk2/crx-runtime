# SEMANTIC GRAPH SWEEP

**Status:** AUDIT IN PROGRESS
**Purpose:** Build repo semantic graph using AST
**Goal:** Track imports, authority ownership, invariant references, replay dependencies, state mutation sites, witness generation paths, serialization paths

---

# SEMANTIC GRAPH ANALYSIS

## Import Dependency Graph

### Layer 0: Constitutional Kernel

```
canonical_json.ts
├── No external imports
└── Uses: TextEncoder (via byte_utils.ts)

certificate_authority.ts
├── No external imports
└── Uses: TextEncoder (via byte_utils.ts)

byte_utils.ts
├── No external imports
└── Uses: TextEncoder, TextDecoder (portable implementations)

canonical_certificate.ts
├── Imports: ReplayCertificate (replay_types.ts)
├── Imports: CanonicalJson (canonical_json.ts)
└── Imports: utf8Encode (byte_utils.ts)

merkle_tree.ts
├── Imports: concatBytes (byte_utils.ts)
├── Imports: utf8Encode (byte_utils.ts)
├── Imports: utf8Decode (byte_utils.ts)
└── Imports: hexDecode (byte_utils.ts)

replay_types.ts
├── No external imports
└── Defines: ReplayCertificate, ExecutionArtifact, DeterministicTiming

deterministic_failure.ts
├── No external imports
└── Defines: DeterministicFailure, DeterministicFailureError, DeterministicFailureFactory

replay_limits.ts
├── No external imports
└── Defines: ReplayLimits constants

canonical_hash_authority.ts
├── Imports: CanonicalJson (canonical_json.ts)
├── Imports: CertificateAuthority (certificate_authority.ts)
├── Imports: base64UrlEncode (byte_utils.ts)
├── Imports: base64UrlDecode (byte_utils.ts)
└── Imports: utf8Decode (byte_utils.ts)

witness_authority.ts
├── Imports: CanonicalJson (canonical_json.ts)
├── Imports: CertificateAuthority (certificate_authority.ts)
├── Imports: MerkleTree (merkle_tree.ts)
├── Imports: StateSerializer (state_serializer.ts)
├── Imports: getConstitutionalLawManifest (constitutional_law_manifest.ts)
├── Imports: base64UrlDecode (byte_utils.ts)
├── Imports: hexDecode (byte_utils.ts)
└── Imports: utf8Encode (byte_utils.ts)

replay_event_stream.ts
├── Imports: DeterministicFailureFactory (deterministic_failure.ts)
├── Imports: ReplayLimits (replay_limits.ts)
└── Imports: ReplayEventEnvelope (canonical_event_envelope.ts)

replay_invariants.ts
├── Imports: InvariantDefinition (replay_types.ts)
└── Defines: ReplayInvariants

invariant_runner.ts
├── Imports: DeterministicFailureFactory (deterministic_failure.ts)
├── Imports: ReplayLimits (replay_limits.ts)
└── Imports: InvariantDefinition (replay_types.ts)

state_serializer.ts
├── Imports: CanonicalJson (canonical_json.ts)
└── Imports: ReplayState (replay_types.ts)

deterministic_replay_engine.ts
├── Imports: ReplayEventStream (replay_event_stream.ts)
├── Imports: InvariantRunner (invariant_runner.ts)
├── Imports: ReplayStateMachine (replay_state_machine.ts)
└── Imports: DeterministicFailureFactory (deterministic_failure.ts)

replay_verification.ts
├── Imports: DeterministicReplayEngine (deterministic_replay_engine.ts)
├── Imports: WitnessAuthority (witness_authority.ts)
└── Imports: DeterministicFailureFactory (deterministic_failure.ts)

replay_state_machine.ts
├── Imports: DeterministicFailureFactory (deterministic_failure.ts)
├── Imports: ReplayLimits (replay_limits.ts)
└── Imports: ReplayState (replay_types.ts)

graph_validator.ts
├── Imports: DeterministicFailureFactory (deterministic_failure.ts)
└── Imports: LineageGraph (replay_types.ts)

canonical_event_envelope.ts
├── Imports: DeterministicFailureFactory (deterministic_failure.ts)
└── Imports: CanonicalJson (canonical_json.ts)

authority_classification.ts
├── No external imports
└── Defines: AuthorityClassification, AuthorityRegistry

authority_registry.ts
├── Imports: AuthorityClassification (authority_classification.ts)
└── Registers: ReplayAuthority, WitnessAuthority, CertificateAuthority, CanonicalizationAuthority, HashAuthority, KernelCommitService

constitutional_law_manifest.ts
├── No external imports
└── Defines: ConstitutionalLawManifest, CURRENT_CONSTITUTIONAL_LAW_MANIFEST

constitutional_self_check.ts
├── Imports: ConstitutionalSelfCheckCore (constitutional_self_check_core.ts)
└── Imports: NodeSelfCheckAdapter (node_self_check_adapter.ts)

constitutional_self_check_core.ts
├── No external imports
└── Defines: ConstitutionalSelfCheckCore interface

node_self_check_adapter.ts
├── Imports: ConstitutionalSelfCheckCore (constitutional_self_check_core.ts)
└── Implements: Node.js-specific self-check

constitutional_forensics.ts
├── Imports: DeterministicReplayEngine (deterministic_replay_engine.ts)
└── Imports: ReplayVerification (replay_verification.ts)

constitutional_test_runner.ts
├── Imports: DeterministicReplayEngine (deterministic_replay_engine.ts)
└── Imports: ReplayVerification (replay_verification.ts)

utils/deep_freeze.ts
├── No external imports
└── Defines: deepFreeze utility
```

---

# AUTHORITY OWNERSHIP GRAPH

## Root Authorities

```
Identity Authority
├── CanonicalJson (canonicalization)
├── CertificateAuthority (hashing)
└── ByteUtils (byte operations)

Lineage Authority
└── GraphValidator (DAG validation)

Event Recording Authority
└── ReplayEventStream (event recording)

Replay Authority
├── DeterministicReplayEngine (replay execution)
├── ReplayVerification (replay verification)
└── ReplayStateMachine (state projection)

Policy Authority
└── NOT IMPLEMENTED
```

## Derived Authorities

```
State Authority (Derived from Replay)
├── ReplayStateMachine (state projection)
└── StateSerializer (state serialization)

Witness Authority (Derived from Identity + Replay)
├── WitnessAuthority (witness generation)
└── MerkleTree (witness construction)
```

## Eliminated Authorities (Per Constitution)

```
Witness Authority (Eliminated)
└── Should be absorbed by Identity + Replay

Canonicalization Authority (Eliminated)
└── Should be absorbed by Identity
```

---

# INVARIANT REFERENCES GRAPH

## Invariant Definitions

```
replay_invariants.ts
├── artifactHashInvariant
├── lineageAcyclicInvariant
├── lineageParentExistsInvariant
└── stateVersionInvariant
```

## Invariant Usage

```
invariant_runner.ts
├── Registers invariants
├── Runs invariants against state
└── Reports violations

deterministic_replay_engine.ts
├── Uses InvariantRunner
└── Enforces invariants during replay
```

---

# REPLAY DEPENDENCIES GRAPH

## Replay Execution Path

```
ReplayEventStream (event stream)
    ↓
DeterministicReplayEngine (replay execution)
    ↓
InvariantRunner (invariant enforcement)
    ↓
ReplayStateMachine (state projection)
    ↓
WitnessAuthority (witness generation)
    ↓
ReplayVerification (witness verification)
```

## Replay Dependencies

```
DeterministicReplayEngine depends on:
├── ReplayEventStream (event input)
├── InvariantRunner (invariant enforcement)
└── ReplayStateMachine (state projection)

ReplayStateMachine depends on:
├── DeterministicFailureFactory (error handling)
└── ReplayLimits (execution limits)

WitnessAuthority depends on:
├── CanonicalJson (canonicalization)
├── CertificateAuthority (hashing)
├── MerkleTree (witness construction)
├── StateSerializer (state serialization)
└── getConstitutionalLawManifest (law commitment)
```

---

# STATE MUTATION SITES

## State Mutation Paths

```
ReplayStateMachine
├── commitArtifact (artifact commit)
├── addLineageEdge (lineage edge creation)
└── updateState (state update)

All state mutations occur through:
├── Event recording (append-only)
├── Replay execution (deterministic)
└── Invariant enforcement (verification)
```

## State Mutation Verification

```
All state mutations are verified by:
├── InvariantRunner (invariant enforcement)
├── GraphValidator (lineage validation)
└── DeterministicFailureFactory (failure reporting)
```

---

# WITNESS GENERATION PATHS

## Witness Generation Flow

```
ReplayState (reconstructed state)
    ↓
CanonicalJson (canonicalization)
    ↓
CertificateAuthority (hashing)
    ↓
MerkleTree (witness construction)
    ↓
WitnessAuthority (witness generation)
    ↓
WitnessRoot (witness output)
```

## Witness Dependencies

```
WitnessAuthority depends on:
├── CanonicalJson (canonicalization)
├── CertificateAuthority (hashing)
├── MerkleTree (witness construction)
├── StateSerializer (state serialization)
└── getConstitutionalLawManifest (law commitment)
```

---

# SERIALIZATION PATHS

## Canonicalization Path

```
Object/Value
    ↓
CanonicalJson.canonicalize (canonicalization)
    ↓
CanonicalJson.toUint8Array (UTF-8 encoding)
    ↓
Uint8Array (canonical bytes)
```

## Serialization Dependencies

```
CanonicalJson depends on:
├── utf8Encode (byte_utils.ts) for UTF-8 encoding
└── No external dependencies

StateSerializer depends on:
├── CanonicalJson (canonicalization)
└── ReplayState (state type)
```

---

# SEMANTIC GRAPH ANALYSIS SUMMARY

## Import Dependency Analysis

**Finding:** All imports follow proper layer boundaries

**Status:** COMPLIANT

**Evidence:**
- Layer 0 files have no infrastructure dependencies
- Layer 1 files depend only on Layer 0
- Layer 2 files depend on Layer 0 (adapters)
- No circular dependencies detected
- No cross-layer violations detected

---

## Authority Ownership Analysis

**Finding:** Authority ownership is properly defined

**Status:** COMPLIANT with exceptions

**Evidence:**
- Root authorities are properly defined
- Derived authorities are properly defined
- Eliminated authorities still exist in codebase (constitutional violation)

**Exceptions:**
- Witness Authority should be eliminated
- Canonicalization Authority should be eliminated

---

## Invariant References Analysis

**Finding:** Invariant references are properly tracked

**Status:** COMPLIANT

**Evidence:**
- Invariant definitions are centralized in replay_invariants.ts
- Invariant usage is through InvariantRunner
- Invariant enforcement is during replay
- No shadow invariants detected

---

## Replay Dependencies Analysis

**Finding:** Replay dependencies are properly structured

**Status:** COMPLIANT

**Evidence:**
- Replay execution path is deterministic
- Replay dependencies are acyclic
- Replay verification is separate from execution
- No replay bypasses detected

---

## State Mutation Sites Analysis

**Finding:** State mutation sites are properly controlled

**Status:** COMPLIANT

**Evidence:**
- All state mutations occur through ReplayStateMachine
- All state mutations are verified by invariants
- All state mutations are recorded as events
- No direct state mutations detected

---

## Witness Generation Paths Analysis

**Finding:** Witness generation paths are properly structured

**Status:** COMPLIANT

**Evidence:**
- Witness generation is deterministic
- Witness generation depends on replay output
- Witness generation includes law commitment
- No witness bypasses detected

---

## Serialization Paths Analysis

**Finding:** Serialization paths are properly structured

**Status:** COMPLIANT

**Evidence:**
- Canonicalization is deterministic
- Canonicalization uses portable byte operations
- Serialization is infrastructure-independent
- No serialization bypasses detected

---

# SEMANTIC GRAPH VIOLATIONS DETECTED

## Violation 1: Witness Authority Still Exists

**Finding:** Witness Authority class exists despite being eliminated in constitution

**Constitutional Reference:** constitution/authority_model.md

**Current State:** WitnessAuthority class in witness_authority.ts

**Risk:** MEDIUM - Shadow authority

**Remediation:** Eliminate WitnessAuthority class, merge into Identity + Replay

---

## Violation 2: Canonicalization Authority Still Exists

**Finding:** Canonicalization Authority exists as separate class despite being eliminated in constitution

**Constitutional Reference:** constitution/authority_model.md

**Current State:** CanonicalHashAuthority class in canonical_hash_authority.ts

**Risk:** MEDIUM - Shadow authority

**Remediation:** Eliminate CanonicalHashAuthority class, merge into Identity Authority

---

# SEMANTIC GRAPH SUMMARY

## Compliant Aspects

- Import dependencies follow proper layer boundaries
- Authority ownership is properly defined (with exceptions)
- Invariant references are properly tracked
- Replay dependencies are properly structured
- State mutation sites are properly controlled
- Witness generation paths are properly structured
- Serialization paths are properly structured

## Violations Detected

- Witness Authority still exists (should be eliminated)
- Canonicalization Authority still exists (should be eliminated)

## No Circular Dependencies

- No circular dependencies detected
- No cross-layer violations detected
- No shadow dependencies detected

---

# REMEDIATION PLAN

## Priority 1: Eliminate Eliminated Authorities

1. **Eliminate Witness Authority**
   - Remove WitnessAuthority class
   - Move witness generation to Identity Authority
   - Move witness verification to Replay Authority
   - Update all references

2. **Eliminate Canonicalization Authority**
   - Remove CanonicalHashAuthority class
   - Merge into Identity Authority
   - Update all references

---

# VERIFICATION CHECKLIST

After remediation, verify:
- [ ] No circular dependencies
- [ ] No cross-layer violations
- [ ] No shadow dependencies
- [ ] Authority ownership is constitutional
- [ ] Invariant references are proper
- [ ] Replay dependencies are acyclic
- [ ] State mutation sites are controlled
- [ ] Witness generation paths are deterministic
- [ ] Serialization paths are portable

---

**Document ID:** AUDIT-SEMANTIC-GRAPH-SWEEP-1.0
**Status:** COMPLETED
**Last Updated:** 2026-06-09
