# Constitutional Compiler Specification

**Document Type:** Architecture Specification
**Status:** DRAFT (not yet implemented)
**Date:** 2026-06-24
**Runtime:** brain-constitution-runner

---

## 1. Purpose

The constitutional compiler transforms human-readable constitutional documents (markdown) into machine-verifiable constitutional artifacts (JSON registries). It is the enforcement engine that prevents runtime code from defining constitutional law.

---

## 2. Architecture

```
constitution/**/*.md
vault/laws/*.md
vault/constitution/*.md
    │
    ▼
┌─────────────────────────────────────┐
│         Parser Layer                │
│  Extracts structured data from      │
│  constitutional markdown documents  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Dependency Builder             │
│  Resolves cross-document references │
│  Builds dependency graph            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Authority Graph Builder         │
│  Extracts authority hierarchy from  │
│  AUTHORITY_TAXONOMY_SPEC.md         │
│  + authority declarations in laws   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Primitive Registry Builder      │
│  Registers declared primitives:     │
│  - event types (from EVENT_LAW.md)  │
│  - truth types (from TRUTH_LAW.md)  │
│  - invariant types                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Truth Registry Builder         │
│  Registers what constitutes truth   │
│  per TRUTH_LAW.md                   │
│  Maps: event_class → truth_status   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│       Validation Engine             │
│  Runs all validators from           │
│  AUTHORITY_GRAPH_VALIDATOR_SPEC.md  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Witness Generator              │
│  Computes deterministic hash of     │
│  all compiled constitutional state  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Constitutional Snapshot Builder    │
│  Produces signed snapshot per       │
│  CONSTITUTIONAL_SNAPSHOT_SPEC.md   │
└─────────────────────────────────────┘
```

---

## 3. Component Specifications

### 3.1 Parser Layer

**Input:** Markdown files with YAML frontmatter
**Output:** Structured document objects

```yaml
parser:
  input_format: markdown_with_yaml_frontmatter
  extraction:
    - document_id: from filename
    - status: from frontmatter (FROZEN, ACTIVE, SUPERSEDED, etc.)
    - document_type: from frontmatter (Law, Specification, Architecture)
    - authority_class: from explicit declaration or file path convention
    - governing_scope: from document content headers
    - cross_references: from [[wiki-links]] or explicit references
    - invariants: from document content (CONSTITUTIONAL_INVARIANT markers)
    - event_types: from event type registrations
    - validators: from validator declarations
```

**Parsed Document Schema:**

```yaml
parsed_document:
  document_id: string
  document_path: string
  status: ACTIVE | FROZEN | SUPERSEDED | PHASE_LABELED | PENDING_RATIFICATION
  document_type: LAW | SPECIFICATION | ARCHITECTURE | PARTICIPANT
  authority_class: string          # From declared hierarchy
  governing_scope: string[]        # Domains this document governs
  cross_references: string[]       # Document IDs referenced
  invariants: invariant[]          # Declared invariants
  event_registrations: event_type[] # If document declares event types
  amendment_history: amendment[]   # Trace of amendments
  content_hash: string             # SHA-256 of canonical content
```

### 3.2 Dependency Builder

**Input:** Parsed document objects
**Output:** Dependency graph (directed acyclic)

```yaml
dependency_builder:
  resolution:
    - cross_references become edges
    - supersession declarations become edges (superseded → superseder)
    - "governs" declarations become edges (document → domain)
    - "requires" declarations become edges (document → prerequisite)
  
  validation:
    - No circular dependencies
    - All referenced documents exist
    - Supersession chain is acyclic
    - No orphan references

output_schema:
  dependency_graph:
    nodes: parsed_document[]
    edges:
      - source: document_id
        target: document_id
        relationship: references | supersedes | governs | requires
```

### 3.3 Authority Graph Builder

**Input:** AUTHORITY_TAXONOMY_SPEC.md + parsed documents with authority_class
**Output:** Authority graph (ordered hierarchy)

```yaml
authority_graph_builder:
  source: AUTHORITY_TAXONOMY_SPEC.md
  extraction:
    - authority classes (ordered list)
    - resolution rules
    - supersession rules
  
  resolution:
    - each document assigned authority_class
    - authority_class resolved to ordinal rank
    - supersession chains resolved
    - lineage depth computed

output_schema:
  authority_graph:
    authority_hierarchy:
      - class: string
        rank: integer
        description: string
    document_authority:
      - document_id: string
        authority_class: string
        rank: integer
        superseded_by: string | null
    event_authority:
      - event_class: string
        authority_class: string
        rank: integer
```

### 3.4 Primitive Registry Builder

**Input:** EVENT_LAW.md, TRUTH_LAW.md, invariant_law.md
**Output:** Primitive registry

```yaml
primitive_registry_builder:
  extraction:
    event_classes: from EVENT_LAW.md
    event_types: from EVENT_LAW.md registry
    truth_types: from TRUTH_LAW.md
    invariant_types: from invariant_law.md
    authority_classes: from AUTHORITY_TAXONOMY_SPEC.md

output_schema:
  primitive_registry:
    event_classes: event_class[]
    event_types: event_type[]          # All registered event types
    truth_classifications: truth_type[]
    invariant_definitions: invariant[]
    authority_classifications: authority_class[]
```

### 3.5 Truth Registry Builder

**Input:** TRUTH_LAW.md
**Output:** Truth registry

```yaml
truth_registry_builder:
  source: TRUTH_LAW.md
  
  classification:
    - constitutional_truth: immutable verified event
    - derived_truth: deterministic replay projection
    - non_truth: inference, embedding, vector, summary, memory, model_output,
                 observation, candidate_claim, qdrant_vector, agent_output

  verification:
    mapping of event_class → verification_required (true/false)
    mapping of event_class → projection_allowed (true/false)

output_schema:
  truth_registry:
    truth_definitions: truth_entry[]
    verification_requirements: event_class → verification_gate
    projection_rules: event_class → projection_policy
```

### 3.6 Validation Engine

**Input:** All compiled registries + graphs
**Output:** Validation report

```yaml
validation_engine:
  validators: from AUTHORITY_GRAPH_VALIDATOR_SPEC.md
  
  validation_scope:
    - No duplicate primitives
    - No authority cycles
    - Single root authority
    - Truth declarations match event classes
    - No orphan laws (laws referencing non-existent domains)
    - No duplicate jurisdictions
    - Supersession chains are complete
    - All referenced documents exist

  output:
    valid: boolean
    violations: validation_violation[]
    warning: validation_warning[]
```

---

## 4. Output Artifacts

| Artifact | Format | Content | Consumer |
|----------|--------|---------|----------|
| `authority_graph.json` | JSON | Authority hierarchy + per-document authority assignments | runtime (authority_search.py, registry.ts) |
| `dependency_graph.json` | JSON | Cross-document dependency map | CI, governance |
| `primitive_registry.json` | JSON | All declared primitives (events, truth, invariants) | runtime (type checking, validation) |
| `truth_registry.json` | JSON | Truth classifications and verification rules | runtime (app.py, verification pipeline) |
| `constitutional_snapshot.json` | JSON | Signed snapshot of entire constitutional state | git, CI, governance |
| `witness.json` | JSON | Deterministic witness hash | verification |

---

## 5. Error Handling

| Error | Severity | Compiler Action |
|-------|----------|-----------------|
| Circular dependency | FATAL | Halt, report cycle |
| Missing referenced document | ERROR | Halt, report missing ID |
| Duplicate primitive declaration | ERROR | Halt, report duplicates |
| Unknown authority class | ERROR | Halt, report unknown class |
| Supersession target not found | WARNING | Report, permit continuation |
| Orphan document (unreferenced) | WARNING | Report, permit continuation |
| Pending ratification document | INFO | Report, continue |

---

## 6. Execution Model

**Runtime:** `brain-constitution-runner` (Docker container)
**Trigger:** Git commit (pre-commit hook) + manual CI
**Frequency:** Every constitutional change

```yaml
execution:
  mode: deterministic_compilation
  input: constitution/**/*.md, vault/**/*.md
  output: eslint-style (all artifacts + validation report)
  caching: content-addressed (reuse unchanged documents)
  concurrency: sequential (dependency order)
```

---

## 7. Implementation Order

1. **Parser Layer** — Extract structured data from markdown
2. **Dependency Builder** — Build cross-document graph
3. **Authority Graph Builder** — Resolve authority hierarchy
4. **Primitive Registry Builder** — Register declared types
5. **Truth Registry Builder** — Map truth classifications
6. **Validation Engine** — Run all validators
7. **Witness Generator** — Compute deterministic hash
8. **Snapshot Builder** — Assemble and sign

Each component must be independently testable before the next begins.

---

## 8. Constitutional Compliance

The compiler itself MUST:

1. Be deterministic (same input → same output)
2. Be pure (no side effects during compilation)
3. Produce content-addressed outputs
4. Be verifiable (output can be recomputed)
5. Be versioned (compiler version in output)
6. NOT define constitutional law — only compile it
7. NOT produce runtime artifacts — only registries

---

**Document ID:** CONSTITUTION-COMPILER-SPEC-1.0
**Status:** DRAFT
**Next Step:** Implement Parser Layer
