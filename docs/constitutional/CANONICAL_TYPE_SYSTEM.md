# Canonical Type System

**Version:** 1.1
**Status:** DRAFT
**Purpose:** Define the canonical object families that the compiler produces and consumes.

---

## Canonical Object Decomposition

CanonicalObject is decomposed to avoid a monolithic base class.

### CanonicalIdentity
- `id` - CanonicalID (Authority, Namespace, Kind, Version, Hash)
- `authority` - Authority that created the object
- `namespace` - Object namespace
- `kind` - Object type
- `version` - Object version
- `hash` - Content hash

### CanonicalMetadata
- `schema_version` - Schema version used
- `created_at` - Creation timestamp
- `modified_at` - Modification timestamp
- `tags` - Optional tags
- `annotations` - Optional annotations

### CanonicalProvenance
- `source_id` - Source object ID
- `parents` - Parent object IDs
- `lineage` - Lineage chain
- `origin` - Origin information

### CanonicalLifecycle
- `state` - Current lifecycle state
- `state_history` - State transition history
- `valid_from` - Validity start
- `valid_until` - Validity end

### CanonicalObject
- `identity` - CanonicalIdentity
- `metadata` - CanonicalMetadata
- `provenance` - CanonicalProvenance
- `lifecycle` - CanonicalLifecycle
- `payload` - Object-specific payload

**Inheritance:** Every object contains exactly one CanonicalObject. No multiple inheritance.

---

### Source

Represents where information originates (long-lived).

**Examples:**
- Git Repository
- Website
- API
- RFC
- Human
- Database
- Telemetry Stream
- Log Stream

**Invariant:** A Source never becomes Knowledge. It only emits Artifacts. Sources are long-lived and mutable.

**Compiler Stage:** Discovery

---

### Artifact

Immutable representation of acquired information (snapshot).

**Examples:**
- File
- Document
- Commit
- Image
- Schema
- SQL
- OpenAPI
- Notebook
- Config
- API Response
- Telemetry Sample

**Invariant:** Artifact = acquired bytes (immutable snapshot). Nothing inferred. Artifacts are immutable snapshots of Sources.

**Compiler Stage:** Acquisition

**Source vs. Artifact:**
- GitHub Repo (Source) → Commit (Artifact)
- Website (Source) → HTML Response (Artifact)
- API (Source) → API Response (Artifact)

---

### Evidence

Evidence is extracted from Artifacts.

**Examples:**
- AST node
- Function
- Import
- Table
- Endpoint
- Commit Author
- Dependency
- Hash
- Symbol

**Invariant:** Evidence is factual. Not semantic.

**Compiler Stage:** Parsing

---

### Fact

Facts are extracted from Evidence (immutable).

**Examples:**
- Function Foo() calls Function Bar()
- Module A imports Module B
- File X contains Class Y
- Endpoint Z depends on Database W

**Invariant:** Facts are immutable and factual. Facts are not Knowledge. Facts are the basis for Knowledge compilation.

**Compiler Stage:** Fact Extraction

**Evidence vs. Fact:**
- Evidence: AST node (raw parsed data)
- Fact: Function Foo() calls Function Bar() (extracted relationship)

---

### Relationship

Relationship is also factual.

**Examples:**
- calls()
- imports()
- contains()
- extends()
- writes()
- reads()
- publishes()
- subscribes()

**Invariant:** Dependency edges, ownership edges.

**Compiler Stage:** Relationship

---

### Knowledge

Knowledge is compiled from Facts.

**References:**
- Facts
- Evidence
- Relationships
- Constitution

**Invariant:** Knowledge always references Facts, Evidence, Relationships, Constitution. Nothing else. Knowledge is the first semantic object. Knowledge contains NO subjective fields (confidence, trust, freshness, risk, priority).

**Compiler Stage:** Knowledge Compilation

**Knowledge Immutability:**
- Knowledge contains only things replay can regenerate
- Knowledge contains zero subjective fields
- Knowledge survives deleting every Assessment object
- Knowledge is immutable forever

---

### Assessment

Assessment never mutates Knowledge.

**Examples:**
- Confidence
- Freshness
- Risk
- Complexity
- Security
- Quality
- Coverage
- Trust
- Priority

**Invariant:** These are opinions. They evolve. Knowledge does not. Assessment references Knowledge but never modifies it. Knowledge remains immutable forever. Assessment is like a Git branch - it references commits (Knowledge) but never changes them.

**Compiler Stage:** Assessment

**Assessment Immutability:**
- Assessment contains only subjective fields
- Assessment references Knowledge
- Assessment never modifies Knowledge
- Knowledge survives deleting every Assessment object
- Assessment is like Git branches, Knowledge is like Git commits

---

### Capability

Capability is compiled from Knowledge. Not manually authored.

**Examples:**
- Search
- Authentication
- Payment
- Logging
- Metrics
- Deployment

**Invariant:** Capability is an abstraction. Not code.

**Compiler Stage:** Capability

---

### Plan

Plans consume Knowledge, Capabilities, Policies, Goals.

**Invariant:** Plans are executable intent.

**Compiler Stage:** Planning

---

### Projection

Projection is always reproducible.

**Examples:**
- Graph
- Vector
- Lexical
- Architecture
- Search
- Temporal

**Invariant:** Nothing lives here permanently.

**Compiler Stage:** Projection

---

### Certificate

Replay, Witness, Verification, Signature, Audit all become Certificates.

**Invariant:** Don't split Replay and Witness into unrelated object families. Replay is a process. Witness is a certificate.

**Compiler Stage:** Replay

---

## Compiler Stages Mapping

Each compiler stage produces exactly one canonical object family.

| Stage | Input Types | Transformation | Output Types | Determinism Contract | Replay Contract |
|-------|-------------|----------------|--------------|---------------------|-----------------|
| Discovery | External sources | Source discovery | Source | Deterministic | Replayable |
| Acquisition | Source | Snapshot acquisition | Artifact | Deterministic | Replayable |
| Parsing | Artifact | Evidence extraction | Evidence | Deterministic | Replayable |
| Fact Extraction | Evidence | Fact extraction | Fact | Deterministic | Replayable |
| Relationship | Fact, Evidence | Relationship extraction | Relationship | Deterministic | Replayable |
| Knowledge Compilation | Fact, Evidence, Relationship | Knowledge compilation | Knowledge | Deterministic | Replayable |
| Assessment | Knowledge | Assessment generation | Assessment | Deterministic | Replayable |
| Capability | Knowledge | Capability compilation | Capability | Deterministic | Replayable |
| Planning | Knowledge, Capability, Policy, Goal | Plan generation | Plan | Deterministic | Replayable |
| Projection | Knowledge, Relationship | Projection generation | Projection | Deterministic | Replayable |
| Replay | Knowledge | Replay execution | Certificate | Deterministic | Replayable |

**Invariant:** Compiler stages should not emit arbitrary JSON. Each stage produces one type. Every stage has explicit input types, output types, determinism contract, and replay contract.

---

## Stage Properties

### Stage Purity
Every stage has Input Family → Output Family. No side effects.

### Stage Determinism
Running twice produces identical:
- Canonical Object IDs
- Hashes
- Relationships
- Evidence

### Stage Locality
Stage may only inspect its declared inputs. No global lookups. No runtime state.

### Stage Replayability
Entire stage replayed independently without downstream stages.

### Stage Completeness
Output contains enough information that downstream stages never reopen the original source. Once Parsing finishes, Compiler should never reopen Repository, File, Website, API again. Everything flows forward.

---

## CanonicalID

Uniform identity structure for all objects.

**Structure:**
- Authority
- Namespace
- Kind
- Version
- Hash

**Examples:**
- `ping.compiler.knowledge.v1.8f3e9...`
- `ping.compiler.evidence.v1.1a02...`
- `ping.runtime.plan.v3.92bc...`

**Invariant:** Every parser understands every object.

---

## Graphs and Reports

### Graphs

A Graph is not a canonical object.

A graph is simply:
```
Projection(Knowledge, Relationship)
```

**Invariant:** The graph can always be rebuilt. Never store the graph as authority. Store the objects.

### Reports

Compiler reports, Performance reports, Diagnostics, Verification reports should all compile into:
- Certificate
- Assessment

**Invariant:** Not another hierarchy.

---

## Inheritance Rules

Every object should inherit exactly one base.

**CanonicalObject** is the only base class.

No multiple inheritance. No ambiguous ownership.

---

## Success Criteria

1. Every object in the repository maps to exactly one canonical type.
2. No object requires multiple inheritance or ambiguous ownership.
3. Every compiler stage emits only one canonical object family.
4. Every runtime component consumes canonical objects rather than bespoke JSON structures.
5. Every future feature can be expressed by extending these types instead of introducing a new top-level category.
