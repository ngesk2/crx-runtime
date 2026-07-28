# Canonical Intermediate Representation (CIR)

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Define the language that all objects compile into. This makes the system language-independent.

---

## Overview

The Canonical Intermediate Representation (CIR) is the universal language that all source formats compile into. Git repositories, APIs, SQL databases, Markdown documents, telemetry streams, RFCs, and all other sources compile into CIR.

CIR is not domain-specific. It is the constitutional intermediate representation that enables language-independent compilation and verification.

---

## CIR Elements

### Entity

An Entity represents a distinct, identifiable object in the system.

**Examples:**
- Function
- Class
- Module
- Table
- Endpoint
- Service
- Component
- Resource

**Structure:**
```json
{
  "type": "Entity",
  "id": "canonical_id",
  "kind": "entity_kind",
  "properties": {},
  "relationships": []
}
```

**Invariant:** Entities are immutable and have unique canonical identities.

---

### Relationship

A Relationship represents a connection between Entities or other CIR elements.

**Examples:**
- calls
- imports
- contains
- extends
- implements
- depends_on
- owns
- publishes
- subscribes

**Structure:**
```json
{
  "type": "Relationship",
  "id": "canonical_id",
  "kind": "relationship_kind",
  "source": "entity_id",
  "target": "entity_id",
  "properties": {}
}
```

**Invariant:** Relationships are immutable and directional.

---

### Property

A Property represents an attribute or characteristic of an Entity or Relationship.

**Examples:**
- name
- type
- visibility
- signature
- version
- status
- configuration

**Structure:**
```json
{
  "type": "Property",
  "id": "canonical_id",
  "kind": "property_kind",
  "entity_id": "entity_id",
  "value": "property_value",
  "type": "property_type"
}
```

**Invariant:** Properties are immutable and typed.

---

### Observation

An Observation represents a recorded event or state change.

**Examples:**
- function_call
- api_request
- database_query
- log_entry
- metric_update
- state_transition

**Structure:**
```json
{
  "type": "Observation",
  "id": "canonical_id",
  "kind": "observation_kind",
  "timestamp": "iso_timestamp",
  "entity_id": "entity_id",
  "data": {}
}
```

**Invariant:** Observations are immutable and timestamped.

---

### Fact

A Fact represents an immutable truth derived from Evidence.

**Examples:**
- Function Foo() calls Function Bar()
- Module A imports Module B
- File X contains Class Y
- Endpoint Z depends on Database W
- Service S exposes API P

**Structure:**
```json
{
  "type": "Fact",
  "id": "canonical_id",
  "kind": "fact_kind",
  "subject": "entity_id",
  "predicate": "relationship_kind",
  "object": "entity_id",
  "evidence": ["evidence_id"]
}
```

**Invariant:** Facts are immutable and derived from Evidence.

---

### Constraint

A Constraint represents a rule or limitation that must be satisfied.

**Examples:**
- type_constraint
- cardinality_constraint
- uniqueness_constraint
- dependency_constraint
- security_constraint
- performance_constraint

**Structure:**
```json
{
  "type": "Constraint",
  "id": "canonical_id",
  "kind": "constraint_kind",
  "scope": "entity_id",
  "expression": "constraint_expression",
  "severity": "severity_level"
}
```

**Invariant:** Constraints are immutable and enforce constitutional rules.

---

### Behavior

A Behavior represents the dynamic behavior or logic of an Entity.

**Examples:**
- algorithm
- workflow
- state_machine
- business_logic
- transformation
- validation

**Structure:**
```json
{
  "type": "Behavior",
  "id": "canonical_id",
  "kind": "behavior_kind",
  "entity_id": "entity_id",
  "definition": "behavior_definition",
  "triggers": []
}
```

**Invariant:** Behaviors are immutable and declarative.

---

### Interface

An Interface represents the contract or boundary of an Entity.

**Examples:**
- api_interface
- function_signature
- class_interface
- service_contract
- protocol_definition
- schema

**Structure:**
```json
{
  "type": "Interface",
  "id": "canonical_id",
  "kind": "interface_kind",
  "entity_id": "entity_id",
  "methods": [],
  "properties": []
}
```

**Invariant:** Interfaces are immutable and define contracts.

---

### Authority

An Authority represents the governance or ownership of an Entity or Relationship.

**Examples:**
- constitutional_authority
- domain_authority
- namespace_authority
- version_authority
- certification_authority

**Structure:**
```json
{
  "type": "Authority",
  "id": "canonical_id",
  "kind": "authority_kind",
  "scope": "entity_id",
  "level": "authority_level",
  "constraints": []
}
```

**Invariant:** Authorities are immutable and define governance.

---

### Capability

A Capability represents an abstract ability that can be derived from Knowledge.

**Examples:**
- search
- authentication
- payment
- logging
- metrics
- deployment
- monitoring
- orchestration

**Structure:**
```json
{
  "type": "Capability",
  "id": "canonical_id",
  "kind": "capability_kind",
  "entity_id": "entity_id",
  "requirements": [],
  "dependencies": []
}
```

**Invariant:** Capabilities are immutable and abstract.

---

### Decision

A Decision represents a choice or determination made by the system.

**Examples:**
- routing_decision
- scaling_decision
- security_decision
- policy_decision
- optimization_decision

**Structure:**
```json
{
  "type": "Decision",
  "id": "canonical_id",
  "kind": "decision_kind",
  "context": {},
  "options": [],
  "selected": "option_id",
  "rationale": "decision_rationale"
}
```

**Invariant:** Decisions are immutable and recorded.

---

### Policy

A Policy represents a rule or guideline that governs behavior.

**Examples:**
- access_policy
- security_policy
- resource_policy
- compliance_policy
- operational_policy

**Structure:**
```json
{
  "type": "Policy",
  "id": "canonical_id",
  "kind": "policy_kind",
  "scope": "entity_id",
  "rules": [],
  "enforcement": "enforcement_level"
}
```

**Invariant:** Policies are immutable and govern behavior.

---

### Event

An Event represents a discrete occurrence or notification.

**Examples:**
- entity_created
- entity_updated
- entity_deleted
- relationship_added
- constraint_violated
- decision_made

**Structure:**
```json
{
  "type": "Event",
  "id": "canonical_id",
  "kind": "event_kind",
  "timestamp": "iso_timestamp",
  "entity_id": "entity_id",
  "data": {}
}
```

**Invariant:** Events are immutable and timestamped.

---

## CIR Compilation

### Source to CIR

All source formats compile into CIR:

**Git Repository → CIR:**
- Files → Entities
- Imports → Relationships
- Functions → Entities
- Classes → Entities
- Dependencies → Relationships

**API → CIR:**
- Endpoints → Entities
- Requests → Observations
- Responses → Observations
- Schemas → Interfaces

**SQL Database → CIR:**
- Tables → Entities
- Columns → Properties
- Foreign Keys → Relationships
- Queries → Observations

**Markdown → CIR:**
- Documents → Entities
- Headers → Properties
- Links → Relationships
- Code Blocks → Behaviors

**Telemetry → CIR:**
- Metrics → Observations
- Logs → Observations
- Traces → Relationships
- Spans → Entities

**RFC → CIR:**
- Specifications → Policies
- Requirements → Constraints
- Examples → Facts

---

## CIR Invariants

1. **Immutability:** All CIR elements are immutable.
2. **Canonical Identity:** All CIR elements have unique canonical identities.
3. **Type Safety:** All CIR elements are strongly typed.
4. **Determinism:** Same source produces same CIR.
5. **Replayability:** CIR compilation can be replayed.
6. **Language Independence:** CIR is independent of source language.
7. **Completeness:** CIR contains all information needed for downstream stages.

---

## CIR vs. Domain Objects

CIR is not domain-specific. Domain objects (Source, Artifact, Evidence, Fact, Relationship, Knowledge, Assessment, Capability, Plan, Projection, Certificate) are built on top of CIR.

**CIR → Domain Objects:**
- Entity, Relationship, Property → Evidence
- Fact → Fact
- Entity, Relationship, Property, Fact → Knowledge
- Entity, Relationship, Property → Capability
- Entity, Relationship, Property, Behavior → Plan
- Entity, Relationship → Projection
- Entity, Relationship, Property, Fact → Certificate

---

## CIR Verification

CIR can be verified independently of source format:

1. **Structural Verification:** All CIR elements have valid structure.
2. **Type Verification:** All CIR elements have valid types.
3. **Identity Verification:** All CIR elements have valid canonical identities.
4. **Relationship Verification:** All Relationships reference valid Entities.
5. **Constraint Verification:** All Constraints are satisfied.
6. **Completeness Verification:** All required CIR elements are present.

---

## CIR Serialization

CIR can be serialized to multiple formats:

**JSON:**
```json
{
  "elements": [
    {
      "type": "Entity",
      "id": "canonical_id",
      "kind": "entity_kind",
      "properties": {},
      "relationships": []
    }
  ]
}
```

**Binary:**
- Compact binary format for efficient storage and transmission.

**Protocol Buffers:**
- Schema-defined binary format for cross-language compatibility.

---

## CIR Versioning

CIR is versioned to enable evolution:

**Schema Version:**
- CIR schema version is included in all CIR elements.
- Schema version enables backward compatibility.

**Element Version:**
- Each CIR element has a version.
- Element version enables incremental updates.

---

## CIR Extensions

CIR can be extended with custom elements:

**Custom Elements:**
- Custom elements must follow CIR invariants.
- Custom elements must have valid canonical identities.
- Custom elements must be strongly typed.

**Extension Points:**
- Custom entity kinds
- Custom relationship kinds
- Custom property kinds
- Custom observation kinds
- Custom fact kinds
- Custom constraint kinds
- Custom behavior kinds
- Custom interface kinds
- Custom authority kinds
- Custom capability kinds
- Custom decision kinds
- Custom policy kinds
- Custom event kinds

---

## CIR Tooling

CIR enables tooling:

**Compilers:**
- Source format compilers compile to CIR.

**Verifiers:**
- CIR verifiers validate CIR structure and semantics.

**Transformers:**
- CIR transformers transform CIR between versions.

**Analyzers:**
- CIR analyzers analyze CIR for patterns and insights.

**Visualizers:**
- CIR visualizers visualize CIR structure and relationships.

---

## CIR Success Criteria

1. **Language Independence:** CIR is independent of source language.
2. **Completeness:** CIR contains all information needed for downstream stages.
3. **Determinism:** Same source produces same CIR.
4. **Replayability:** CIR compilation can be replayed.
5. **Verifiability:** CIR can be verified independently.
6. **Extensibility:** CIR can be extended with custom elements.
7. **Toolability:** CIR enables tooling.

---

**Status:** DRAFT
**Version:** 1.0
