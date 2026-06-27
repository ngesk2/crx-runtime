# Knowledge Object Specification

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Define exactly what a Knowledge Object is. PATCH 01 says Knowledge exists. PATCH 05 defines exactly what one is.

---

## Overview

A Knowledge Object is the first semantic object in the compiler pipeline. It is compiled from Facts, Evidence, Relationships, and Constitution. Knowledge Objects are immutable and contain only things that replay can regenerate.

---

## Knowledge Object Structure

### Identity

**CanonicalIdentity:**
- `id` - CanonicalID (Authority, Namespace, Kind, Version, Hash)
- `authority` - Authority that created the Knowledge Object
- `namespace` - Knowledge Object namespace
- `kind` - Knowledge Object kind
- `version` - Knowledge Object version
- `hash` - Content hash

**Invariant:** Knowledge Object identity is unique and immutable.

---

### Derived Facts

**Definition:** Facts derived from Evidence and Relationships.

**Structure:**
```json
{
  "derived_facts": [
    {
      "fact_id": "canonical_id",
      "fact_kind": "fact_kind",
      "subject": "entity_id",
      "predicate": "relationship_kind",
      "object": "entity_id",
      "evidence": ["evidence_id"]
    }
  ]
}
```

**Examples:**
- Function Foo() calls Function Bar()
- Module A imports Module B
- File X contains Class Y
- Endpoint Z depends on Database W

**Invariant:** Derived Facts are immutable and derived from Evidence.

---

### Supporting Evidence

**Definition:** Evidence that supports the Derived Facts.

**Structure:**
```json
{
  "supporting_evidence": [
    {
      "evidence_id": "canonical_id",
      "evidence_kind": "evidence_kind",
      "artifact_id": "artifact_id",
      "content": "evidence_content"
    }
  ]
}
```

**Examples:**
- AST node
- Function definition
- Import statement
- Table definition
- Endpoint definition

**Invariant:** Supporting Evidence is immutable and references Artifacts.

---

### Relationships

**Definition:** Relationships between Facts and Evidence.

**Structure:**
```json
{
  "relationships": [
    {
      "relationship_id": "canonical_id",
      "relationship_kind": "relationship_kind",
      "source": "entity_id",
      "target": "entity_id",
      "properties": {}
    }
  ]
}
```

**Examples:**
- calls
- imports
- contains
- extends
- depends_on
- owns

**Invariant:** Relationships are immutable and directional.

---

### Lineage

**Definition:** Lineage chain tracking the compilation history.

**Structure:**
```json
{
  "lineage": [
    {
      "stage": "stage_name",
      "input_id": "canonical_id",
      "output_id": "canonical_id",
      "timestamp": "iso_timestamp"
    }
  ]
}
```

**Examples:**
- Discovery → Source
- Acquisition → Artifact
- Parsing → Evidence
- Fact Extraction → Fact
- Relationship → Relationship
- Knowledge Compilation → Knowledge

**Invariant:** Lineage is immutable and tracks the compilation history.

---

### Authority

**Definition:** Authority that governs the Knowledge Object.

**Structure:**
```json
{
  "authority": {
    "authority_id": "canonical_id",
    "authority_kind": "authority_kind",
    "scope": "entity_id",
    "level": "authority_level",
    "constraints": []
  }
}
```

**Examples:**
- Constitutional authority
- Domain authority
- Namespace authority
- Version authority
- Certification authority

**Invariant:** Authority is immutable and defines governance.

---

### Replay Proof

**Definition:** Proof that the Knowledge Object can be replayed.

**Structure:**
```json
{
  "replay_proof": {
    "replay_id": "canonical_id",
    "replay_timestamp": "iso_timestamp",
    "replay_hash": "content_hash",
    "replay_state": "replay_state",
    "verification_status": "verification_status"
  }
}
```

**Examples:**
- Replay execution result
- Witness certificate
- Verification result
- Signature

**Invariant:** Replay Proof is immutable and verifies replayability.

---

### Constitution Version

**Definition:** Version of the Constitution used to compile the Knowledge Object.

**Structure:**
```json
{
  "constitution_version": {
    "version": "semantic_version",
    "schema_version": "schema_version",
    "constraints": []
  }
}
```

**Examples:**
- CKC v1.1
- Canonical Type System v1.1
- Compiler Pipeline Specification v1.0

**Invariant:** Constitution Version is immutable and defines the compilation contract.

---

### Schema Version

**Definition:** Version of the Knowledge Object schema.

**Structure:**
```json
{
  "schema_version": {
    "version": "semantic_version",
    "fields": [],
    "constraints": []
  }
}
```

**Examples:**
- Knowledge Object Schema v1.0
- Knowledge Object Schema v1.1

**Invariant:** Schema Version is immutable and defines the Knowledge Object structure.

---

## Knowledge Object Invariants

1. **Immutability:** Knowledge Objects are immutable.
2. **Determinism:** Same inputs produce same Knowledge Objects.
3. **Replayability:** Knowledge Objects can be replayed.
4. **Completeness:** Knowledge Objects contain all information needed for downstream stages.
5. **Subjective Field Exclusion:** Knowledge Objects contain zero subjective fields.

---

## What Knowledge Objects Cannot Contain

### Forbidden Fields

Knowledge Objects MUST NOT contain:

**Subjective Fields:**
- confidence
- trust
- score
- risk
- priority
- freshness
- quality
- complexity
- security
- coverage

**Derived Fields:**
- embeddings
- summaries
- vectors
- abstractions
- generalizations
- interpretations

**Mutable Fields:**
- state
- status
- flags
- counters
- timestamps (except lineage)

**Runtime Fields:**
- execution_context
- runtime_state
- cache
- performance_metrics

**Assessment Fields:**
- assessment_id
- assessment_result
- assessment_metadata

**Reason:** These fields belong in Assessment Objects, not Knowledge Objects. Knowledge Objects contain only things replay can regenerate.

---

## Knowledge Object vs. Assessment Object

### Knowledge Object

**Contains:**
- Identity
- Derived Facts
- Supporting Evidence
- Relationships
- Lineage
- Authority
- Replay Proof
- Constitution Version
- Schema Version

**Does NOT Contain:**
- confidence
- trust
- score
- risk
- priority
- freshness
- embeddings
- summaries
- vectors

**Purpose:** Immutable semantic knowledge compiled from Facts, Evidence, Relationships, and Constitution.

---

### Assessment Object

**Contains:**
- Identity
- Knowledge Reference
- Confidence
- Trust
- Freshness
- Risk
- Priority
- Quality
- Complexity
- Security
- Coverage

**Purpose:** Mutable assessment of Knowledge (opinions about Knowledge).

---

## Knowledge Object Compilation

### Compilation Process

**Inputs:**
- Facts
- Evidence
- Relationships
- Constitution

**Transformation:**
- Compile Facts into Derived Facts
- Link Evidence to Derived Facts
- Extract Relationships
- Build Lineage
- Apply Authority
- Generate Replay Proof
- Record Constitution Version
- Record Schema Version

**Output:**
- Knowledge Object

---

### Compilation Invariants

1. **Determinism:** Same inputs produce same Knowledge Object.
2. **Purity:** No side effects on inputs.
3. **Locality:** Only inspect declared inputs.
4. **Replayability:** Can be replayed independently.
5. **Completeness:** Output contains all information needed for downstream stages.

---

## Knowledge Object Verification

### Verification Strategies

**Structural Verification:**
- Verify Knowledge Object structure is valid
- Verify all fields are present
- Verify all references are valid

**Semantic Verification:**
- Verify Knowledge Object semantics are valid
- Verify Derived Facts are consistent
- Verify Relationships are consistent

**Replay Verification:**
- Verify Knowledge Object can be replayed
- Verify Replay Proof is valid
- Verify Constitution Version is compatible

**Subjective Field Verification:**
- Verify Knowledge Object contains no subjective fields
- Verify Knowledge Object contains no derived fields
- Verify Knowledge Object contains no mutable fields

---

## Knowledge Object Storage

### Storage Strategy

**Canonical Object Storage:**
- Store Knowledge Objects as canonical objects
- Store Knowledge Objects in canonical object store
- Index Knowledge Objects by canonical ID

**Graph Projection:**
- Reconstruct Knowledge Graph from Knowledge Objects
- Cache Knowledge Graph for performance
- Invalidate cache on Knowledge Object changes

**Benefits:**
- Single source of truth
- Knowledge Objects are immutable
- Knowledge Graph is reproducible
- Knowledge Graph is always up-to-date

---

## Knowledge Object Queries

### Query Patterns

**Find Knowledge Object by ID:**
- Query canonical object store by canonical ID

**Find Knowledge Objects by Kind:**
- Query canonical object store by kind

**Find Knowledge Objects by Authority:**
- Query canonical object store by authority

**Find Knowledge Objects by Constitution Version:**
- Query canonical object store by constitution version

**Find Knowledge Objects by Schema Version:**
- Query canonical object store by schema version

**Find Knowledge Objects by Fact:**
- Query canonical object store by derived facts

**Find Knowledge Objects by Evidence:**
- Query canonical object store by supporting evidence

**Find Knowledge Objects by Relationship:**
- Query canonical object store by relationships

---

## Knowledge Object Versioning

### Versioning Strategy

**Semantic Versioning:**
- Major version: Breaking changes
- Minor version: Non-breaking changes
- Patch version: Bug fixes

**Constitution Versioning:**
- Knowledge Objects reference Constitution Version
- Constitution Version changes trigger recompilation

**Schema Versioning:**
- Knowledge Objects reference Schema Version
- Schema Version changes trigger recompilation

---

## Knowledge Object Success Criteria

1. **Immutability:** Knowledge Objects are immutable.
2. **Determinism:** Same inputs produce same Knowledge Objects.
3. **Replayability:** Knowledge Objects can be replayed.
4. **Completeness:** Knowledge Objects contain all information needed for downstream stages.
5. **Subjective Field Exclusion:** Knowledge Objects contain zero subjective fields.
6. **Derived Field Exclusion:** Knowledge Objects contain zero derived fields (embeddings, summaries, vectors).
7. **Mutable Field Exclusion:** Knowledge Objects contain zero mutable fields.
8. **Assessment Field Exclusion:** Knowledge Objects contain zero assessment fields.
9. **Constitution Version:** Knowledge Objects reference Constitution Version.
10. **Schema Version:** Knowledge Objects reference Schema Version.

---

## Knowledge Object Example

```json
{
  "identity": {
    "id": "ping.compiler.knowledge.v1.8f3e9...",
    "authority": "ping.compiler",
    "namespace": "knowledge",
    "kind": "module_dependency",
    "version": "1",
    "hash": "sha256:..."
  },
  "metadata": {
    "schema_version": "1.0",
    "created_at": "2026-06-26T00:00:00Z",
    "modified_at": "2026-06-26T00:00:00Z",
    "tags": [],
    "annotations": []
  },
  "provenance": {
    "source_id": "ping.compiler.source.v1.1a02...",
    "parents": ["ping.compiler.evidence.v1.2b03..."],
    "lineage": [],
    "origin": "git_repository"
  },
  "lifecycle": {
    "state": "compiled",
    "state_history": [],
    "valid_from": "2026-06-26T00:00:00Z",
    "valid_until": null
  },
  "payload": {
    "derived_facts": [
      {
        "fact_id": "ping.compiler.fact.v1.3c04...",
        "fact_kind": "module_import",
        "subject": "module_a",
        "predicate": "imports",
        "object": "module_b",
        "evidence": ["ping.compiler.evidence.v1.2b03..."]
      }
    ],
    "supporting_evidence": [
      {
        "evidence_id": "ping.compiler.evidence.v1.2b03...",
        "evidence_kind": "import_statement",
        "artifact_id": "ping.compiler.artifact.v1.4d05...",
        "content": "import module_b"
      }
    ],
    "relationships": [
      {
        "relationship_id": "ping.compiler.relationship.v1.5e06...",
        "relationship_kind": "imports",
        "source": "module_a",
        "target": "module_b",
        "properties": {}
      }
    ],
    "lineage": [
      {
        "stage": "knowledge_compilation",
        "input_id": "ping.compiler.fact.v1.3c04...",
        "output_id": "ping.compiler.knowledge.v1.8f3e9...",
        "timestamp": "2026-06-26T00:00:00Z"
      }
    ],
    "authority": {
      "authority_id": "ping.compiler.authority.v1.6f07...",
      "authority_kind": "constitutional_authority",
      "scope": "module_dependency",
      "level": "constitutional",
      "constraints": []
    },
    "replay_proof": {
      "replay_id": "ping.compiler.replay.v1.7g08...",
      "replay_timestamp": "2026-06-26T00:00:00Z",
      "replay_hash": "sha256:...",
      "replay_state": "verified",
      "verification_status": "verified"
    },
    "constitution_version": {
      "version": "1.1",
      "schema_version": "1.0",
      "constraints": []
    },
    "schema_version": {
      "version": "1.0",
      "fields": [],
      "constraints": []
    }
  }
}
```

---

**Status:** DRAFT
**Version:** 1.0
