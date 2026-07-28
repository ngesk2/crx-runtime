# Authority Graph Validator Specification

**Document Type:** Architecture Specification
**Status:** DRAFT (not yet implemented)
**Date:** 2026-06-24
**Runtime:** brain-constitution-runner (validation submodule)

---

## 1. Purpose

Validators that enforce constitutional integrity on the compiled authority graph, dependency graph, and registries. Each validator has a single responsibility and produces deterministic output.

---

## 2. Validator Architecture

```yaml
validator_architecture:
  input: compiled_constitutional_state
    - authority_graph.json
    - dependency_graph.json
    - primitive_registry.json
    - truth_registry.json

  pipeline:
    - Each validator is an independent check
    - Validators run in dependency order
    - All validators must pass for constitutional certification
    - Failure opens constitutional incident

  output: validation_report.json
```

---

## 3. Validator Specifications

### 3.1 DuplicatePrimitiveValidator

```yaml
validator:
  id: DUPLICATE_PRIMITIVE_VALIDATOR
  input: primitive_registry.json
  validation_rule: |
    No two entries in the primitive registry may have the same
    primitive_id, event_type, or truth_classification value.
  failure_condition: |
    Two or more primitives share the same identifier
  constitutional_severity: CRITICAL
  remediation_required: |
    Remove duplicate declaration. If intentional conflict,
    file constitutional amendment to supersede the older.
  
  example_failure:
    - event_type: CLAIM_CREATED declared in two event_classes
    - invariant_id: LINEAGE_ACYCLIC declared twice
```

### 3.2 AuthorityLoopValidator

```yaml
validator:
  id: AUTHORITY_LOOP_VALIDATOR
  input: authority_graph.json
  validation_rule: |
    The authority graph must be a directed acyclic graph.
    No authority may depend on itself (transitively).
  failure_condition: |
    Cycle detected in authority hierarchy or superseession chain
  constitutional_severity: CRITICAL
  remediation_required: |
    Break cycle by removing one edge or declaring explicit supersession.
    
  algorithm: topological_sort
  cycle_detection: DFS with back-edge marking
```

### 3.3 RootAuthorityValidator

```yaml
validator:
  id: ROOT_AUTHORITY_VALIDATOR
  input: authority_graph.json
  validation_rule: |
    Every authority in the graph must trace to a single root authority.
    The root authority is CONSTITUTIONAL_LAW.
  failure_condition: |
    Orphan authority with no path to root, or multiple root authorities
  constitutional_severity: CRITICAL
  remediation_required: |
    Declare authority lineage path for orphan. If multiple roots,
    determine which supersedes which.
    
  root_node: CONSTITUTIONAL_LAW
  reachability: BFS from root
```

### 3.4 TruthAuthorityValidator

```yaml
validator:
  id: TRUTH_AUTHORITY_VALIDATOR
  input: truth_registry.json, event_registry.json
  validation_rule: |
    Every event_class marked as "may produce truth" must have a corresponding
    authority_class with rank < 5. Non-truth event classes must have rank >= 8.
  failure_condition: |
    Low-authority event_class (rank >= 8) produces truth, or
    high-authority event_class (rank < 5) does not produce truth
  constitutional_severity: HIGH
  remediation_required: |
    Reclassify event or adjust authority class assignment.
    
  truth_producing_classes:
    - CONSTITUTIONAL_LAW (rank 0)
    - CANONICAL_SPEC (rank 1)
    - CREATOR_RESEARCH (rank 2)
```

### 3.5 SupersessionValidator

```yaml
validator:
  id: SUPERSESSION_VALIDATOR
  input: dependency_graph.json, authority_graph.json
  validation_rule: |
    If document A is declared as superseded by document B:
    1. Document B must exist
    2. Document B must be at the same or higher authority class
    3. Document A's status must be SUPERSEDED
  failure_condition: |
    Supersession target does not exist, target has lower authority,
    or superseded document status is not SUPERSEDED
  constitutional_severity: HIGH
  remediation_required: |
    Create target document, adjust authority class, or update status.
    
  superseession_types:
    - DOCUMENT_SUPERSEDED: entire document replaced
    - SCOPE_SUPERSEDED: specific domain superseded
    - AMENDMENT: patch applied to document
```

### 3.6 OrphanLawValidator

```yaml
validator:
  id: ORPHAN_LAW_VALIDATOR
  input: dependency_graph.json, document_index
  validation_rule: |
    Every constitutional document must be referenced by at least one other
    constitutional document OR be declared as root law (TRUTH_LAW.md).
  failure_condition: |
    Document has zero inbound references and is not root law
  constitutional_severity: MEDIUM
  remediation_required: |
    Add cross-reference from relevant document, or investigate if document
    should be archived.
    
  exceptions:
    - TRUTH_LAW.md (root law, does not require references)
    - AGENT_CONSTITUTION.md (participant document)
```

### 3.7 DuplicateJurisdictionValidator

```yaml
validator:
  id: DUPLICATE_JURISDICTION_VALIDATOR
  input: dependency_graph.json, governing_scope declarations
  validation_rule: |
    No two ACTIVE documents may claim the same governing_scope
    unless one explicitly supersedes the other in that scope.
  failure_condition: |
    Two active documents govern the same domain without declared supersession
  constitutional_severity: CRITICAL
  remediation_required: |
    Declare supersession, merge documents, or one must be archived.
    
  scope_resolution: |
    If document A supersedes document B in scope X,
    then A governs X and B's governance of X is void.
```

---

## 4. Validation Pipeline

```yaml
pipeline:
  order:
    - DUPLICATE_PRIMITIVE_VALIDATOR      # Fastest, catches fatal errors early
    - AUTHORITY_LOOP_VALIDATOR           # Graph must be acyclic before analysis
    - ROOT_AUTHORITY_VALIDATOR           # Root must exist before traversal
    - SUPERSESSION_VALIDATOR             # Supersession must be valid
    - ORPHAN_LAW_VALIDATOR              # Dependencies must be healthy
    - DUPLICATE_JURISDICTION_VALIDATOR   # Authority overlap detection
    - TRUTH_AUTHORITY_VALIDATOR          # Truth mapping (depends on class resolution)

  stop_on_first_fatal: true              # Fatal errors halt pipeline
  stop_on_first_critical: false          # Collect all critical before stopping
```

---

## 5. Output Format

```yaml
validation_report:
  valid: true | false
  constitutional_certification: PASS | FAIL
  validators:
    - id: DUPLICATE_PRIMITIVE_VALIDATOR
      passed: true | false
      severity: INFO | MEDIUM | HIGH | CRITICAL
      violations:
        - message: string
          document_id: string
          field: string
          value: string
    - id: AUTHORITY_LOOP_VALIDATOR
      passed: true | false
      severity: CRITICAL
      violations: []
  summary:
    total_validators: integer
    passed: integer
    failed: integer
    critical: integer
    high: integer
    medium: integer
```

---

## 6. Error Codes

| Code | Validator | Meaning |
|------|-----------|---------|
| DUP-PRIM-001 | DuplicatePrimitiveValidator | Duplicate event_type |
| DUP-PRIM-002 | DuplicatePrimitiveValidator | Duplicate invariant_id |
| DUP-PRIM-003 | DuplicatePrimitiveValidator | Duplicate truth_classification |
| LOOP-AUTH-001 | AuthorityLoopValidator | Circular authority hierarchy |
| LOOP-AUTH-002 | AuthorityLoopValidator | Circular superseession |
| ROOT-AUTH-001 | RootAuthorityValidator | Orphan authority (no path to root) |
| ROOT-AUTH-002 | RootAuthorityValidator | Multiple root authorities |
| TRUTH-AUTH-001 | TruthAuthorityValidator | Low-authority class produces truth |
| TRUTH-AUTH-002 | TruthAuthorityValidator | Non-truth class in truth registry |
| SUP-001 | SupersessionValidator | Supersession target does not exist |
| SUP-002 | SupersessionValidator | Supersession target has lower authority |
| SUP-003 | SupersessionValidator | Superseded document has wrong status |
| ORPHAN-001 | OrphanLawValidator | Zero inbound references |
| JURIS-001 | DuplicateJurisdictionValidator | Overlapping governance scope |
| JURIS-002 | DuplicateJurisdictionValidator | Overlapping scope without superseession |

---

## 7. Integration

- Validators run inside the constitutional compiler (CONSTITUTION_COMPILER_SPEC.md)
- Validation report is output alongside compiled registries
- Validation failures block constitutional snapshot generation
- Validation is deterministic: same input → same report
- Validation is pure: no network calls, no database queries

---

**Document ID:** AUTHORITY-GRAPH-VALIDATOR-SPEC-1.0
**Status:** DRAFT
**Next Step:** Implement DuplicatePrimitiveValidator in brain-constitution-runner
