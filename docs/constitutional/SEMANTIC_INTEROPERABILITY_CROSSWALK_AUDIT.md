# Semantic Interoperability & Crosswalk Audit

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Define where PING intentionally agrees with existing semantic standards, and where it intentionally diverges. This is the last major design document before implementation.

---

## Overview

This document is not another ontology. It is a compatibility matrix that defines how PING interacts with existing semantic systems. For every major semantic system, we answer:

- What is its unit of truth?
- What maps directly to PING?
- What cannot map?
- Where are the constitutional risks?
- Should it compile losslessly or lossy?

---

## Semantic System Compatibility Matrix

### RDF (Resource Description Framework)

**Unit of Truth:** Triple (Subject, Predicate, Object)

**Maps to PING:**
- Entity → CIR Entity
- Relationship → CIR Relationship
- Property → CIR Property

**Lossless?** Mostly

**Notes:**
- Good graph interchange format
- RDF triples map directly to CIR Facts
- RDF graphs map to PING Knowledge Graph
- RDF reification maps to PING Evidence

**Cannot Map:**
- RDF blank nodes (PING requires canonical IDs)
- RDF literals (PING requires typed properties)
- RDF named graphs (PING uses separate graph families)

**Constitutional Risks:**
- RDF allows mutable truth (PING requires immutability)
- RDF allows blank nodes (PING requires canonical IDs)
- RDF allows reification without provenance (PING requires provenance)

**Compilation:** Lossless (with constraints on blank nodes and mutable truth)

---

### OWL (Web Ontology Language)

**Unit of Truth:** Axiom / Class / Property

**Maps to PING:**
- Constraint → CIR Constraint
- Knowledge → PING Knowledge
- Ontology → PING Knowledge

**Lossless?** Partial

**Notes:**
- OWL reasoning semantics differ from PING compilation
- OWL classes map to PING Entity kinds
- OWL properties map to PING Relationships
- OWL axioms map to PING Constraints

**Cannot Map:**
- OWL open world assumption (PING uses closed world)
- OWL inference without replay (PING requires replay)
- OWL class expressions (PING requires explicit Facts)

**Constitutional Risks:**
- OWL inference can create knowledge without replay (FORBIDDEN)
- OWL open world assumption conflicts with PING determinism (FORBIDDEN)
- OWL reasoning can produce non-deterministic results (FORBIDDEN)

**Compilation:** Lossy (OWL inference must be replaced with PING compilation)

---

### JSON-LD (JSON for Linking Data)

**Unit of Truth:** JSON Object with @context

**Maps to PING:**
- Entity → CIR Entity
- Relationship → CIR Relationship
- Property → CIR Property

**Lossless?** Yes

**Notes:**
- Excellent frontend format for PING
- JSON-LD contexts map to PING schemas
- JSON-LD framing maps to PING Projections
- JSON-LD compaction maps to PING serialization

**Cannot Map:**
- JSON-LD blank nodes (PING requires canonical IDs)
- JSON-LD relative IRIs (PING requires absolute canonical IDs)

**Constitutional Risks:**
- JSON-LD allows mutable truth (PING requires immutability)
- JSON-LD allows blank nodes (PING requires canonical IDs)

**Compilation:** Lossless (with constraints on blank nodes and mutable truth)

---

### Schema.org

**Unit of Truth:** Type / Property

**Maps to PING:**
- Knowledge → PING Knowledge
- Type → CIR Entity kind
- Property → CIR Property

**Lossless?** Partial

**Notes:**
- Public web vocabulary for structured data
- Schema.org types map to PING Entity kinds
- Schema.org properties map to PING Properties
- Schema.org actions map to PING Behaviors

**Cannot Map:**
- Schema.org open world assumption (PING uses closed world)
- Schema.org type hierarchy without replay (PING requires replay)
- Schema.org property inheritance without replay (PING requires replay)

**Constitutional Risks:**
- Schema.org allows mutable truth (PING requires immutability)
- Schema.org type hierarchy without replay (FORBIDDEN)

**Compilation:** Lossy (Schema.org inheritance must be replaced with PING compilation)

---

### OpenAPI (Swagger)

**Unit of Truth:** API Specification

**Maps to PING:**
- Artifact → PING Artifact
- Evidence → PING Evidence
- Capability → PING Capability

**Lossless?** Yes

**Notes:**
- Strong acquisition source for PING
- OpenAPI spec → Artifact
- OpenAPI endpoints → Evidence
- OpenAPI operations → Capability

**Cannot Map:**
- OpenAPI mutable specs (PING requires immutable Artifacts)
- OpenAPI versioning without replay (PING requires replay)

**Constitutional Risks:**
- OpenAPI allows mutable specs (PING requires immutability)
- OpenAPI versioning without replay (FORBIDDEN)

**Compilation:** Lossless (with constraints on mutable specs and versioning)

---

### OpenTelemetry

**Unit of Truth:** Span / Metric / Log

**Maps to PING:**
- Artifact → PING Artifact
- Event → CIR Event
- Evidence → PING Evidence

**Lossless?** Yes

**Notes:**
- Operational inputs for PING
- OpenTelemetry spans → Artifacts
- OpenTelemetry events → CIR Events
- OpenTelemetry metrics → Evidence

**Cannot Map:**
- OpenTelemetry mutable spans (PING requires immutable Artifacts)
- OpenTelemetry sampling without replay (PING requires replay)

**Constitutional Risks:**
- OpenTelemetry allows mutable spans (PING requires immutability)
- OpenTelemetry sampling without replay (FORBIDDEN)

**Compilation:** Lossless (with constraints on mutable spans and sampling)

---

### Git

**Unit of Truth:** Commit / Blob / Tree

**Maps to PING:**
- Source → PING Source
- Artifact → PING Artifact

**Lossless?** Yes

**Notes:**
- One acquisition frontend for PING
- Git repository → Source
- Git commit → Artifact
- Git blob → Artifact

**Cannot Map:**
- Git mutable branches (PING requires immutable Artifacts)
- Git rebasing without replay (PING requires replay)

**Constitutional Risks:**
- Git allows mutable branches (PING requires immutability)
- Git rebasing without replay (FORBIDDEN)

**Compilation:** Lossless (with constraints on mutable branches and rebasing)

---

### SPDX / SBOM (Software Bill of Materials)

**Unit of Truth:** Component / Relationship

**Maps to PING:**
- Artifact → PING Artifact
- Relationship → PING Relationship

**Lossless?** Yes

**Notes:**
- Supply-chain lineage for PING
- SPDX components → Artifacts
- SPDX relationships → Relationships
- SPDX licenses → Constraints

**Cannot Map:**
- SPDX mutable components (PING requires immutable Artifacts)
- SPDX versioning without replay (PING requires replay)

**Constitutional Risks:**
- SPDX allows mutable components (PING requires immutability)
- SPDX versioning without replay (FORBIDDEN)

**Compilation:** Lossless (with constraints on mutable components and versioning)

---

### W3C PROV (Provenance)

**Unit of Truth:** Entity / Activity / Agent

**Maps to PING:**
- Provenance → PING Provenance
- Entity → CIR Entity
- Activity → CIR Behavior
- Agent → PING Authority

**Lossless?** Very High

**Notes:**
- Likely closest existing model to PING
- PROV entities → CIR Entities
- PROV activities → CIR Behaviors
- PROV agents → PING Authorities
- PROV provenance → PING Provenance

**Cannot Map:**
- PROV mutable entities (PING requires immutability)
- PROV activities without replay (PING requires replay)

**Constitutional Risks:**
- PROV allows mutable entities (PING requires immutability)
- PROV activities without replay (FORBIDDEN)

**Compilation:** Lossless (with constraints on mutable entities and activities)

---

### STIX/TAXII (Structured Threat Information Expression)

**Unit of Truth:** Indicator / Malware / Attack Pattern

**Maps to PING:**
- Knowledge → PING Knowledge
- Assessment → PING Assessment

**Lossless?** Partial

**Notes:**
- Security domain knowledge for PING
- STIX indicators → Knowledge
- STIX attack patterns → Knowledge
- STIX sightings → Assessment

**Cannot Map:**
- STIX mutable indicators (PING requires immutability)
- STIX confidence without Assessment (PING requires Assessment)

**Constitutional Risks:**
- STIX allows mutable indicators (PING requires immutability)
- STIX confidence without Assessment (FORBIDDEN)

**Compilation:** Lossy (STIX confidence must be moved to Assessment)

---

### Neo4j LPG (Labeled Property Graph)

**Unit of Truth Node / Edge / Property

**Maps to PING:**
- Projection → PING Projection

**Lossless?** Yes

**Notes:**
- Never authoritative in PING
- Neo4j graphs → PING Projections
- Neo4j nodes → CIR Entities
- Neo4j edges → CIR Relationships
- Neo4j properties → CIR Properties

**Cannot Map:**
- Neo4j mutable graphs (PING requires immutable Projections)
- Neo4j as authoritative (FORBIDDEN)

**Constitutional Risks:**
- Neo4j mutable graphs (PING requires immutability)
- Neo4j accidentally becoming authoritative (FORBIDDEN)

**Compilation:** Lossless (with constraint that Neo4j is never authoritative)

---

### Apache Atlas

**Unit of Truth:** Entity / Lineage

**Maps to PING:**
- Lineage → PING Lineage

**Lossless?** Partial

**Notes:**
- Enterprise metadata for PING
- Atlas entities → CIR Entities
- Atlas lineage → PING Lineage

**Cannot Map:**
- Atlas mutable entities (PING requires immutability)
- Atlas lineage without replay (PING requires replay)

**Constitutional Risks:**
- Atlas allows mutable entities (PING requires immutability)
- Atlas lineage without replay (FORBIDDEN)

**Compilation:** Lossy (Atlas lineage must be replaced with PING compilation)

---

### DataHub

**Unit of Truth:** Dataset / Schema / Lineage

**Maps to PING:**
- Source → PING Source
- Artifact → PING Artifact

**Lossless?** Partial

**Notes:**
- Catalog layer for PING
- DataHub datasets → Sources
- DataHub schemas → Artifacts
- DataHub lineage → PING Lineage

**Cannot Map:**
- DataHub mutable datasets (PING requires immutability)
- DataHub lineage without replay (PING requires replay)

**Constitutional Risks:**
- DataHub allows mutable datasets (PING requires immutability)
- DataHub lineage without replay (FORBIDDEN)

**Compilation:** Lossy (DataHub lineage must be replaced with PING compilation)

---

## PING Concepts vs. Existing Equivalents

### PING Concept Audit

| PING Concept | Existing Equivalent | Mapping | Notes |
|-------------|---------------------|---------|-------|
| Source | PROV Entity / DataHub Source | Direct | Long-lived information origin |
| Artifact | Git Blob / PROV Entity | Direct | Immutable snapshot |
| Evidence | PROV Entity | Direct | Factual extraction from Artifact |
| Fact | RDF Triple | Direct | Immutable factual relationship |
| Relationship | Edge (Neo4j) / RDF Triple | Direct | Factual relationship |
| Knowledge | Ontology Assertion (OWL) | Partial | PING Knowledge is replayable, OWL is not |
| Assessment | Annotation (PROV) | Direct | Opinion about Knowledge |
| Capability | Service Capability (OpenAPI) | Direct | Abstract capability from Knowledge |
| Plan | Workflow DAG | Direct | Executable intent |
| Projection | Materialized View | Direct | Reproducible view of Knowledge |
| Certificate | Attestation / Provenance Record (PROV) | Direct | Verification of correctness |

---

## Constitutional Failure Audit

### RDF Mutable Truth

**Question:** Does RDF allow mutable truth?

**Answer:** Yes, RDF allows mutable truth (triples can be added, removed, or modified).

**PING Position:** FORBIDDEN

**Reason:** PING requires immutable truth. All canonical objects are immutable.

**Mitigation:** RDF must be compiled into immutable PING objects. RDF mutations are not allowed in PING.

---

### Neo4j Authoritative Graph

**Question:** Can Neo4j accidentally become authoritative?

**Answer:** Yes, Neo4j can accidentally become authoritative if graphs are stored as authority.

**PING Position:** FORBIDDEN

**Reason:** PING stores canonical objects as authority. Graphs are Projections, not authority.

**Mitigation:** Neo4j is never authoritative in PING. Neo4j graphs are always Projections reconstructed from canonical objects.

---

### Embeddings as Constitutional

**Question:** Can embeddings become constitutional?

**Answer:** Yes, embeddings can accidentally become constitutional if stored in Knowledge.

**PING Position:** FORBIDDEN

**Reason:** PING Knowledge contains zero subjective fields. Embeddings are subjective and belong in Assessment or Optimization.

**Mitigation:** Embeddings are never stored in Knowledge. Embeddings are generated in Optimization Passes and marked as embeddings.

---

### Vectors Overwriting Facts

**Question:** Can vectors overwrite facts?

**Answer:** Yes, vectors can accidentally overwrite facts if used as primary storage.

**PING Position:** FORBIDDEN

**Reason:** PING Facts are immutable. Vectors are derived and cannot overwrite Facts.

**Mitigation:** Vectors are never used as primary storage. Vectors are generated in Optimization Passes and marked as derived.

---

### OWL Inference Without Replay

**Question:** Can OWL inference create knowledge without replay?

**Answer:** Yes, OWL inference can create knowledge without replay.

**PING Position:** FORBIDDEN

**Reason:** PING requires replay for all Knowledge compilation. OWL inference without replay is non-deterministic.

**Mitigation:** OWL inference is replaced with PING compilation. All Knowledge compilation is replayable.

---

### LLM Summaries as Evidence

**Question:** Can LLM summaries become evidence?

**Answer:** Yes, LLM summaries can accidentally become evidence if stored in Evidence.

**PING Position:** FORBIDDEN

**Reason:** PING Evidence is factual. LLM summaries are subjective and belong in Assessment or Optimization.

**Mitigation:** LLM summaries are never stored in Evidence. LLM summaries are generated in Optimization Passes and marked as summaries.

---

## Classification Summary

### Allowed

**Direct mappings with constitutional compliance:**
- RDF → CIR Entity, Relationship, Property (with constraints on blank nodes and mutable truth)
- JSON-LD → CIR Entity, Relationship, Property (with constraints on blank nodes and mutable truth)
- OpenAPI → Artifact, Evidence, Capability (with constraints on mutable specs and versioning)
- OpenTelemetry → Artifact, Event, Evidence (with constraints on mutable spans and sampling)
- Git → Source, Artifact (with constraints on mutable branches and rebasing)
- SPDX/SBOM → Artifact, Relationship (with constraints on mutable components and versioning)
- W3C PROV → Provenance, Entity, Behavior, Authority (with constraints on mutable entities and activities)
- Neo4j LPG → Projection (with constraint that Neo4j is never authoritative)

---

### Derived Only

**Mappings that require compilation or transformation:**
- OWL → Constraint, Knowledge (OWL inference must be replaced with PING compilation)
- Schema.org → Knowledge (Schema.org inheritance must be replaced with PING compilation)
- STIX/TAXII → Knowledge, Assessment (STIX confidence must be moved to Assessment)
- Apache Atlas → Lineage (Atlas lineage must be replaced with PING compilation)
- DataHub → Source, Artifact (DataHub lineage must be replaced with PING compilation)

---

### Forbidden

**Mappings that violate constitutional principles:**
- RDF mutable truth (FORBIDDEN)
- OWL inference without replay (FORBIDDEN)
- Schema.org type hierarchy without replay (FORBIDDEN)
- OpenAPI mutable specs (FORBIDDEN)
- OpenTelemetry sampling without replay (FORBIDDEN)
- Git mutable branches (FORBIDDEN)
- Git rebasing without replay (FORBIDDEN)
- SPDX mutable components (FORBIDDEN)
- SPDX versioning without replay (FORBIDDEN)
- PROV mutable entities (FORBIDDEN)
- PROV activities without replay (FORBIDDEN)
- STIX mutable indicators (FORBIDDEN)
- STIX confidence without Assessment (FORBIDDEN)
- Neo4j mutable graphs (FORBIDDEN)
- Neo4j as authoritative (FORBIDDEN)
- Apache Atlas mutable entities (FORBIDDEN)
- Apache Atlas lineage without replay (FORBIDDEN)
- DataHub mutable datasets (FORBIDDEN)
- DataHub lineage without replay (FORBIDDEN)
- Embeddings as constitutional (FORBIDDEN)
- Vectors overwriting facts (FORBIDDEN)
- LLM summaries as evidence (FORBIDDEN)

---

## Semantic Interoperability Principles

### Principle 1: Immutability

All PING objects are immutable. Semantic systems that allow mutable truth must be compiled into immutable PING objects.

### Principle 2: Replayability

All PING Knowledge compilation is replayable. Semantic systems that allow inference without replay must be replaced with PING compilation.

### Principle 3: Canonical Identity

All PING objects have canonical identities. Semantic systems that allow blank nodes or relative identifiers must be compiled into canonical PING identities.

### Principle 4: Provenance

All PING objects have provenance. Semantic systems that allow entities without provenance must be compiled with PING provenance.

### Principle 5: Authority

All PING objects have authority. Semantic systems that allow entities without authority must be compiled with PING authority.

### Principle 6: Separation of Concerns

PING separates Knowledge (immutable) from Assessment (mutable). Semantic systems that mix knowledge and assessment must be compiled with PING separation.

### Principle 7: Graph as Projection

PING stores canonical objects as authority. Graphs are Projections, not authority. Semantic systems that store graphs as authority must be compiled with PING canonical objects.

---

## Semantic Interoperability Success Criteria

1. **Immutability:** All semantic systems are compiled into immutable PING objects.
2. **Replayability:** All semantic system inference is replaced with PING compilation.
3. **Canonical Identity:** All semantic system entities are compiled with canonical PING identities.
4. **Provenance:** All semantic system entities are compiled with PING provenance.
5. **Authority:** All semantic system entities are compiled with PING authority.
6. **Separation of Concerns:** All semantic systems are compiled with PING separation of Knowledge and Assessment.
7. **Graph as Projection:** All semantic system graphs are compiled as PING Projections, not authority.

---

## Conclusion

PING intentionally agrees with existing semantic standards where they align with constitutional principles (immutability, replayability, canonical identity, provenance, authority, separation of concerns, graph as projection). PING intentionally diverges where existing standards violate constitutional principles (mutable truth, inference without replay, blank nodes, entities without provenance, graphs as authority).

This document completes the constitutional layer. The constitutional layer is now effectively frozen.

---

**Status:** DRAFT
**Version:** 1.0
