# ADR-000X — Replay Identity Constitutional Freeze

## Status

CONSTITUTIONAL FREEZE

Mandatory for all replay, witness, lineage, projection, and verification systems.

---

# Core Constitutional Decision

## Normative Authority

```text
ReplayIdentity = WitnessRoot
```

The witness root is the sole constitutional replay authority.

A replay is not merely an event stream.

A replay is:

* canonical input
* replay execution
* invariant evaluation
* lineage derivation
* convergence validation
* replay outcomes
* witnessed constitutional state

executed under a specific replay law.

Only the witness root commits to the complete replay constitution.

Therefore:

```text
ReplayIdentity = WitnessRoot
```

is the normative replay law.

---

# Constitutional Replay Commitment

The witness root MUST commit to:

* canonical input
* replay configuration
* invariant set
* execution semantics
* lineage derivation
* replay outputs
* convergence state
* violations/outcomes
* witness law versioning

The witness root is therefore:

```text
ReplayCommitment
```

not merely an input commitment.

---

# Derived Authorities

## Fingerprint

```text
Fingerprint = hash(canonical_event_stream)
```

Fingerprint is a subordinate commitment authority.

It defines:

* transport identity
* deduplication identity
* import/export identity
* event stream commitment

Fingerprint does NOT define replay identity.

### Constitutional Distinction

Two replay systems may legally produce different replay outcomes from the same fingerprint if:

* invariant versions differ
* replay configuration differs
* canonicalization version differs
* permission state differs
* replay law differs

Therefore:

```text
Fingerprint != ReplayIdentity
```

This distinction is constitutionally mandatory.

---

## Lineage Graph

```text
LineageGraph = DerivationEvidence
```

Lineage is evidentiary substrate.

Not replay authority.

Not replay identity.

Not constitutional equivalence.

Correct authority relationship:

```text
Lineage -> Witness
```

Incorrect authority relationship:

```text
Lineage = Identity
```

Witness remains normative constitutional authority.

Lineage remains derived evidence.

This separation MUST remain invariant across all future layers.

---

# Replay Equivalence Freeze

Replay equivalence is defined exclusively by witness equality.

Correct constitutional rule:

```text
ReplayEquivalent(A, B)
    iff
WitnessRoot(A) == WitnessRoot(B)
```

Nothing else defines replay equivalence.

Not:

* fingerprint equality
* lineage equality
* projection equality
* replay state equality
* snapshot equality

Only witnessed constitutional convergence defines replay equivalence.

---

# Certification Invariant

The following invariant is constitutionally mandatory:

```text
WitnessEquality => FingerprintEquality
```

Because:

```text
WitnessRoot
    commits_to
Fingerprint
```

Therefore:

```text
WitnessA == WitnessB
```

MUST imply:

```text
FingerprintA == FingerprintB
```

Violation of this invariant indicates one or more of:

* witness corruption
* incomplete commitment scope
* replay certification invalidity
* constitutional replay divergence

This MUST become a mandatory certification test.

---

# One-Way Authority Chain

Correct constitutional authority flow:

```text
Event Stream
    ↓
Fingerprint
    ↓
Replay Execution
    ↓
Lineage + State + Violations
    ↓
Witness Root
    ↓
Replay Identity
```

Critically:

```text
Fingerprint != Witness
```

The fingerprint is subordinate authority.

The witness root subsumes fingerprint authority.

This layering MUST remain constitutionally stable.

---

# Why Fingerprints Cannot Define Replay Identity

If replay identity were fingerprint-derived, constitutional ambiguity emerges.

Example:

```text
same events
same fingerprint
different invariant version
different replay outcome
```

The system would then fail to distinguish:

* replay law drift
* invariant drift
* permission drift
* semantic divergence
* replay corruption
* constitutional replay incompatibility

Replay systems cannot derive constitutional identity solely from inputs when replay law influences outcomes.

In this architecture:

replay law is constitutionally authoritative.

Therefore:

```text
Fingerprint cannot define replay identity
```

---

# Constitutional Artifact Model

Correct replay result structure:

```ts
type ReplayResult = {
  replay_identity: WitnessRoot;

  event_commitment: Fingerprint;

  derivation_graph: LineageGraph;

  replay_state: ReplayState;

  violations: InvariantViolation[];
}
```

Only one field defines identity:

```ts
replay_identity
```

All remaining fields are evidentiary or derived artifacts.

This distinction is constitutionally mandatory.

---

# Naming Freeze

To eliminate authority ambiguity, the following renames are frozen:

| Current                | Freeze As                 |
| ---------------------- | ------------------------- |
| CanonicalHashAuthority | FingerprintAuthority      |
| Fingerprint            | EventStreamCommitment     |
| WitnessRoot            | ReplayCommitment          |
| ReplayIdentity         | WitnessRoot               |
| LineageGraph           | DerivationGraph           |
| parent_event_ids       | parent_object_refs        |
| WitnessAuthority       | ReplayCommitmentAuthority |

Most important constitutional clarification:

```text
Fingerprint != Identity
```

This authority distinction MUST propagate through all future layers.

---

# Final Constitutional Freeze

```text
Fingerprint
    = Input Commitment

LineageGraph
    = Derivation Evidence

Violations
    = Replay Outcomes

WitnessRoot
    = Replay Commitment

ReplayIdentity
    = WitnessRoot

ReplayEquivalence
    = WitnessRoot Equality
```

---

# Constitutional Guarantees Preserved

This model preserves:

* replay determinism
* constitutional authority
* provenance integrity
* replay portability
* trust composability
* certification semantics
* AI-operable verification
* future replay extensibility
* cross-host replay verification
* semantic replay consistency

without introducing competing identity authorities.

---

# Final Constitutional Principle

The system does not verify merely:

```text
"What bytes entered the system?"
```

The system verifies:

```text
"What constitutional replay result was witnessed?"
```

This distinction defines the architecture.

The system is not immutable storage infrastructure.

The system is deterministic constitutional execution infrastructure.
