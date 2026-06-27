# Constitutional Knowledge Compiler (CKC)

## Canonical Artifact Lifecycle Specification v1.0

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

## PROJECTED

Knowledge Substrate creates derived views.

Examples:

Graph projections

Vector projections

Lexical indexes

Temporal indexes

Capability indexes

Architecture indexes

These are projections.

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

Every object SHALL possess globally stable identifiers.

Required identities include:

SourceID

ArtifactID

EvidenceID

ExtractionIRID

CanonicalIRID

KnowledgeObjectID

RelationshipID

CapabilityID

WitnessID

ReplayID

ProjectionID

LifecycleID

Identifiers SHALL remain stable across replay.

---

# Event Requirements

Every lifecycle transition SHALL emit one constitutional event.

Each event SHALL include:

* Event ID
* Event Type
* Event Version
* Timestamp
* Lifecycle State
* Object ID
* Parent IDs
* Replay Version
* Constitution Version
* Compiler Version
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

* persistence
* retrieval
* graph projections
* vector projections
* indexing
* lineage storage

Never recompiles knowledge.

---

## Runtime

Owns:

* scheduling
* capabilities
* workers
* leases
* events
* execution

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

Knowledge Objects

Replay Certificates

Witnesses

Diagnostics

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

Compiler

↓

Knowledge Substrate

↓

Runtime

↓

Execution Providers

Future work SHALL implement these contracts rather than introduce new architectural authorities.

All subsequent sprints are implementation sprints unless constitutional governance explicitly revises this specification.
