# Constitutional Knowledge Compiler (CKC)

## Canonical Artifact Lifecycle Specification v1.1

### Objective

The Constitutional Knowledge Compiler (CKC), Knowledge Substrate, Runtime, and every future execution provider SHALL implement one shared lifecycle for all artifacts.

This document freezes the lifecycle contract.

No subsystem may invent alternative states or bypass transitions.

The lifecycle becomes the permanent contract between:

* Constitution
* Compiler
* Knowledge Substrate
* Runtime
* Capability Fabric
* Execution Providers

The architecture is now considered frozen unless this specification changes through constitutional governance.

---

# Foundational Invariants

The following invariants SHALL always hold.

1. Constitution defines legality.
2. Compiler transforms evidence into canonical knowledge.
3. Knowledge Substrate preserves canonical knowledge.
4. Runtime consumes canonical knowledge.
5. Execution Providers never become authorities.
6. Replay validates reproducibility.
7. Witness certifies successful replay.
8. Every state transition emits an immutable constitutional event.
9. Every artifact possesses stable identity.
10. No component bypasses lifecycle transitions.

---

# Canonical Artifact Lifecycle

Every artifact SHALL move through the following states.

```
DISCOVERED
        ↓
IDENTIFIED
        ↓
ACQUIRED
        ↓
NORMALIZED
        ↓
PARSED
        ↓
EVIDENCE_CONSTRUCTED
        ↓
EXTRACTION_IR
        ↓
RELATIONSHIPS_CONSTRUCTED
        ↓
CANONICAL_IR
        ↓
KNOWLEDGE_COMPILED
        ↓
CONSTITUTIONALLY_VERIFIED
        ↓
REPLAY_CERTIFIED
        ↓
WITNESSED
        ↓
PUBLISHED
        ↓
INDEXED
        ↓
PROJECTED
        ↓
CONSUMED
        ↓
OBSERVED
        ↓
UPDATED
        ↓
ARCHIVED
```

No lifecycle stage may be skipped.

---

# Stage Definitions

## DISCOVERED

The system becomes aware of a potential evidence source.

Examples:

* Git repository
* Website
* API
* RFC
* Database
* PDF
* Source archive

Output:

SourceIdentity

---

## IDENTIFIED

Identity is resolved.

Produce:

* Source ID
* Repository ID
* Organization
* Branch
* Commit
* Version
* Authority
* Trust classification
* License
* Cryptographic hashes

No semantics.

---

## ACQUIRED

Immutable acquisition.

The original source is preserved exactly.

No mutation permitted.

Produce:

Acquisition Record

---

## NORMALIZED

Normalize formats without changing meaning.

Examples:

* line endings
* encoding
* archive extraction
* deterministic ordering

No inference.

---

## PARSED

Language-specific parsers execute.

Produce:

Structural Parse Trees

Examples:

* Tree-sitter
* language AST
* schema parsers
* OpenAPI
* SQL
* Protobuf

---

## EVIDENCE_CONSTRUCTED

Construct provenance-backed evidence.

Observation becomes Fact.

Fact becomes Evidence.

Every evidence object includes:

* provenance
* parser version
* source location
* hashes
* timestamps

---

## EXTRACTION_IR

Generate frontend intermediate representation.

Language-specific.

Not canonical.

Equivalent to compiler frontend output.

---

## RELATIONSHIPS_CONSTRUCTED

Derive relationships deterministically.

Examples:

imports

calls

inherits

implements

reads

writes

publishes

subscribes

contains

references

No semantic inference.

---

## CANONICAL_IR

Transform Extraction IR into implementation-independent representation.

This is the permanent compiler middle-end.

Every downstream system depends upon this representation.

---

## KNOWLEDGE_COMPILED

Construct canonical Knowledge Objects.

Not generated.

Not synthesized.

Compiled.

Each object includes:

* Identity
* Type
* Evidence
* Relationships
* Authority
* Dependencies
* Confidence
* Freshness
* Conflicts
* Lineage

---

## CONSTITUTIONALLY_VERIFIED

Validate against constitutional rules.

Verify:

* schemas
* legality
* invariants
* authority boundaries
* required evidence
* identity consistency

Failure halts compilation.

---

## REPLAY_CERTIFIED

Replay entire transformation.

Replay consumes only:

* Canonical Knowledge Objects
* Constitution Version

Replay never consumes repositories or raw files.

Requirements:

Same inputs

↓

Same Canonical IR

↓

Same Knowledge Objects

↓

Same hashes

↓

Same outputs

Replay proves deterministic reproducibility.

---

## WITNESSED

Generate immutable replay certification.

Witnesses are immutable.

Never regenerated.

If replay changes, generate a new witness.

Do not overwrite.

Witness includes:

Replay version

Compiler version

Constitution version

Hashes

Verification timestamp

Replay certificate

Witness certifies replay.

Witness does not replace replay.

---

## PUBLISHED

Knowledge Objects become available to the Knowledge Substrate.

Compiler responsibility ends.

---

## INDEXED

Knowledge Substrate creates lookup structures.

Examples:

* Identity indexes
* Temporal indexes
* Capability indexes
* Authority indexes

Indexing creates efficient access structures.

---

## PROJECTED

Knowledge Substrate creates derived views as pure deterministic functions.

Every projection is reproducible from canonical knowledge.

Examples:

* Knowledge Objects → Graph Projection
* Knowledge Objects → Vector Projection
* Knowledge Objects → Lexical Projection
* Knowledge Objects → Architecture Projection

All projections are deterministic.

Not authorities.

---

## CONSUMED

Runtime consumes canonical knowledge.

Runtime never modifies canonical objects.

---

## OBSERVED

Execution produces new observations.

Observations begin new compilation cycles.

---

## UPDATED

Knowledge evolves through new evidence.

Historical versions remain replayable.

No destructive mutation.

---

## ARCHIVED

Knowledge remains replayable forever.

Nothing is deleted.

Only historical.

---

# Canonical Object Identity

Every object SHALL possess globally stable identifiers following a hierarchical model.

Identity flows downward:

```
SourceID
    ↓
ArtifactID
    ↓
EvidenceID
    ↓
KnowledgeObjectID
    ↓
ProjectionID
    ↓
ExecutionID
    ↓
ReplayID
    ↓
WitnessID
```

Additional identities include:

* ExtractionIRID
* CanonicalIRID
* RelationshipID
* CapabilityID
* LifecycleID

Identifiers SHALL remain stable across replay.

---

# Event Requirements

Every lifecycle transition SHALL emit one constitutional event.

Events SHALL describe state transitions (verbs), not entities.

Examples:

* ArtifactNormalized (not Artifact)
* KnowledgeCompiled (not KnowledgeObject)
* ReplayCertified (not Replay)

Each event SHALL include:

* Event ID
* Event Type
* Event Version
* Timestamp
* Lifecycle State
* Object ID
* Parent IDs
* Constitution Version
* Compiler Version
* Schema Version
* Replay Version
* Witness Version
* Projection Version
* Policy Version
* Schema Hash

No silent transitions are permitted.

---

# Authority Boundaries

## Constitution

Owns:

* schemas
* legality
* invariants
* identity rules
* replay rules
* witness rules
* semantic ontology
* meaning definitions

Defines:

* what a Capability is
* what an Artifact is
* what Evidence means
* what Knowledge means

Never executes.

---

## Compiler

Owns:

* parsing
* evidence construction
* IR generation
* relationship construction
* knowledge compilation

Never schedules.

Never stores runtime state.

---

## Knowledge Substrate

Owns:

* canonical persistence
* retrieval
* lineage storage
* projection management
* publication
* indexing

Does not:

* execute
* schedule
* reason
* compile
* verify

---

## Runtime

Owns:

* scheduling
* capabilities
* workers
* leases
* events
* execution

Runtime SHALL NOT:

* infer authority
* modify evidence
* modify lineage
* generate canonical knowledge

Never mutates canonical knowledge.

---

## Execution Providers

Own:

execution only.

Never become authorities.

Examples:

Ollama

Claude

OpenAI

Gemini

Devin

OpenCode

Local tools

Deterministic algorithms

Humans

All are replaceable.

---

# Compiler Output Contract

The compiler SHALL expose only:

Canonical IR

Verified Knowledge Objects

Replay Certificates

Compiler Reports

Diagnostics are temporary.

Compiler Reports are artifacts.

No runtime-specific structures.

---

# Runtime Input Contract

The runtime SHALL consume only:

Knowledge Objects

Capabilities

Policies

Replay Certificates

Witnesses

Events

Runtime SHALL never read repositories directly.

---

# Architectural Freeze

The following authorities are now considered permanent:

Constitution

↓

Canonical State

↓

Compiler

↓

Knowledge

↓

Runtime

↓

Execution Providers

The compiler produces canonical state.
It does not own it.

The Constitution owns the meaning of canonical state.

Future work SHALL implement these contracts rather than introduce new architectural authorities.

All subsequent sprints are implementation sprints unless constitutional governance explicitly revises this specification.
