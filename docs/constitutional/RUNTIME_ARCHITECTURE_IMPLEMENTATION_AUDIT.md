# Runtime Architecture & Implementation Audit

**Version:** 1.0
**Status:** DRAFT
**Purpose:** Bridge between constitutional model and codebase. Define exactly what TypeScript/Python modules must exist to implement everything defined.

---

## Overview

This document is not another ontology. It is the bridge between the constitutional model and the codebase. It answers one question: Exactly what TypeScript/Python modules must exist to implement everything defined?

This document contains:
- Runtime package layout
- Compiler package layout
- Canonical object library
- CIR library
- Graph engine
- Replay engine
- Projection engine
- Assessment engine
- Planning engine
- Executive runtime
- Persistence
- Serialization
- Authority services

---

## Package Layout

### Runtime Package Layout

```
runtime/
    canonical/
        canonical-object.ts
        canonical-id.ts
        canonical-identity.ts
        canonical-metadata.ts
        canonical-provenance.ts
        canonical-lifecycle.ts
        source.ts
        artifact.ts
        evidence.ts
        fact.ts
        relationship.ts
        knowledge.ts
        assessment.ts
        capability.ts
        plan.ts
        projection.ts
        certificate.ts
    replay/
        engine.ts
        witness.ts
        certificate.ts
        verification.ts
    projection/
        engine.ts
        graph.ts
        vector.ts
        lexical.ts
        architecture.ts
        search.ts
        temporal.ts
    assessment/
        engine.ts
        confidence.ts
        trust.ts
        freshness.ts
        risk.ts
        quality.ts
    planning/
        engine.ts
        planner.ts
        executor.ts
    executive/
        agent.ts
        dispatcher.ts
        worker-protocol.ts
    persistence/
        object-store.ts
        replay-store.ts
        certificate-store.ts
    serialization/
        canonical-serializer.ts
        cir-serializer.ts
        graph-serializer.ts
    authority/
        identity-authority.ts
        certificate-authority.ts
        witness-authority.ts
        verification-authority.ts
```

---

### Compiler Package Layout

```
compiler/
    discovery/
        scanner.ts
        source-discovery.ts
    acquisition/
        snapshot.ts
        artifact-acquisition.ts
    parsing/
        parser.ts
        evidence-extraction.ts
    facts/
        extractor.ts
        fact-extraction.ts
    relationships/
        extractor.ts
        relationship-extraction.ts
    knowledge/
        compiler.ts
        knowledge-compilation.ts
    assessment/
        engine.ts
        assessment-generation.ts
    capability/
        compiler.ts
        capability-compilation.ts
    planning/
        planner.ts
        plan-generation.ts
    projection/
        engine.ts
        projection-generation.ts
    replay/
        engine.ts
        certificate-generation.ts
    pipeline/
        executor.ts
        stage-registry.ts
        pass-registry.ts
    optimization/
        duplicate-fact-elimination.ts
        relationship-inference.ts
        ontology-merging.ts
        capability-clustering.ts
        semantic-summarization.ts
        embedding-generation.ts
        contradiction-detection.ts
        dead-knowledge-elimination.ts
```

---

### CIR Library Layout

```
cir/
    entity.ts
    relationship.ts
    property.ts
    observation.ts
    fact.ts
    constraint.ts
    behavior.ts
    interface.ts
    authority.ts
    capability.ts
    decision.ts
    policy.ts
    event.ts
    builders/
        entity-builder.ts
        relationship-builder.ts
        property-builder.ts
        observation-builder.ts
        fact-builder.ts
        constraint-builder.ts
        behavior-builder.ts
        interface-builder.ts
        authority-builder.ts
        capability-builder.ts
        decision-builder.ts
        policy-builder.ts
        event-builder.ts
    validators/
        entity-validator.ts
        relationship-validator.ts
        property-validator.ts
        observation-validator.ts
        fact-validator.ts
        constraint-validator.ts
        behavior-validator.ts
        interface-validator.ts
        authority-validator.ts
        capability-validator.ts
        decision-validator.ts
        policy-validator.ts
        event-validator.ts
```

---

### Graph Engine Layout

```
graphs/
    identity/
        graph.ts
        builder.ts
        query.ts
    authority/
        graph.ts
        builder.ts
        query.ts
    structural/
        graph.ts
        builder.ts
        query.ts
    dependency/
        graph.ts
        builder.ts
        query.ts
    behavior/
        graph.ts
        builder.ts
        query.ts
    capability/
        graph.ts
        builder.ts
        query.ts
    policy/
        graph.ts
        builder.ts
        query.ts
    decision/
        graph.ts
        builder.ts
        query.ts
    knowledge/
        graph.ts
        builder.ts
        query.ts
    replay/
        graph.ts
        builder.ts
        query.ts
    temporal/
        graph.ts
        builder.ts
        query.ts
    engine/
        graph-engine.ts
        projection-engine.ts
        cache.ts
```

---

## Module Contracts

### Runtime Canonical Module

**Purpose:** Define canonical object types and interfaces.

**Exported Types:**
- CanonicalObject
- CanonicalIdentity
- CanonicalMetadata
- CanonicalProvenance
- CanonicalLifecycle
- Source
- Artifact
- Evidence
- Fact
- Relationship
- Knowledge
- Assessment
- Capability
- Plan
- Projection
- Certificate

**Imports Allowed:**
- None (base types)

**Imports Forbidden:**
- No external dependencies

**Produced Object Families:**
- All canonical object families

**Consumed Object Families:**
- None

---

### Runtime Replay Module

**Purpose:** Execute replay and generate certificates.

**Exported Types:**
- ReplayEngine
- WitnessGenerator
- CertificateGenerator
- VerificationEngine

**Imports Allowed:**
- runtime/canonical
- runtime/persistence

**Imports Forbidden:**
- No direct access to sources
- No direct access to compiler stages

**Produced Object Families:**
- Certificate

**Consumed Object Families:**
- Knowledge

---

### Runtime Projection Module

**Purpose:** Generate projections from knowledge and relationships.

**Exported Types:**
- ProjectionEngine
- GraphProjection
- VectorProjection
- LexicalProjection
- ArchitectureProjection
- SearchProjection
- TemporalProjection

**Imports Allowed:**
- runtime/canonical
- runtime/graphs
- runtime/persistence

**Imports Forbidden:**
- No direct access to sources
- No direct access to compiler stages

**Produced Object Families:**
- Projection

**Consumed Object Families:**
- Knowledge
- Relationship

---

### Runtime Assessment Module

**Purpose:** Generate assessments from knowledge.

**Exported Types:**
- AssessmentEngine
- ConfidenceAssessment
- TrustAssessment
- FreshnessAssessment
- RiskAssessment
- QualityAssessment

**Imports Allowed:**
- runtime/canonical
- runtime/persistence

**Imports Forbidden:**
- No direct access to sources
- No direct access to compiler stages

**Produced Object Families:**
- Assessment

**Consumed Object Families:**
- Knowledge

---

### Runtime Planning Module

**Purpose:** Generate plans from knowledge, capabilities, policies, and goals.

**Exported Types:**
- PlanningEngine
- Planner
- Executor

**Imports Allowed:**
- runtime/canonical
- runtime/persistence

**Imports Forbidden:**
- No direct access to sources
- No direct access to compiler stages

**Produced Object Families:**
- Plan

**Consumed Object Families:**
- Knowledge
- Capability
- Policy
- Goal

---

### Runtime Executive Module

**Purpose:** Execute plans and coordinate agents.

**Exported Types:**
- Agent
- Dispatcher
- WorkerProtocol

**Imports Allowed:**
- runtime/canonical
- runtime/planning
- runtime/persistence

**Imports Forbidden:**
- No direct access to sources
- No direct access to compiler stages

**Produced Object Families:**
- Plan
- Assessment
- Certificate

**Consumed Object Families:**
- Knowledge
- Capability
- Assessment
- Plan
- Certificate

---

### Runtime Persistence Module

**Purpose:** Persist canonical objects and replay data.

**Exported Types:**
- ObjectStore
- ReplayStore
- CertificateStore

**Imports Allowed:**
- runtime/canonical
- runtime/serialization

**Imports Forbidden:**
- No business logic

**Produced Object Families:**
- None (storage only)

**Consumed Object Families:**
- All canonical object families

---

### Runtime Serialization Module

**Purpose:** Serialize and deserialize canonical objects and CIR.

**Exported Types:**
- CanonicalSerializer
- CIRSerializer
- GraphSerializer

**Imports Allowed:**
- runtime/canonical
- cir

**Imports Forbidden:**
- No business logic

**Produced Object Families:**
- None (serialization only)

**Consumed Object Families:**
- All canonical object families
- All CIR elements

---

### Runtime Authority Module

**Purpose:** Provide authority services for identity, certificate, witness, and verification.

**Exported Types:**
- IdentityAuthority
- CertificateAuthority
- WitnessAuthority
- VerificationAuthority

**Imports Allowed:**
- runtime/canonical
- runtime/persistence

**Imports Forbidden:**
- No business logic

**Produced Object Families:**
- Certificate

**Consumed Object Families:**
- All canonical object families

---

### Compiler Discovery Module

**Purpose:** Discover sources and generate Source objects.

**Exported Types:**
- Scanner
- SourceDiscovery

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Source

**Consumed Object Families:**
- None (external sources only)

---

### Compiler Acquisition Module

**Purpose:** Acquire artifacts from sources and generate Artifact objects.

**Exported Types:**
- Snapshot
- ArtifactAcquisition

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Artifact

**Consumed Object Families:**
- Source

---

### Compiler Parsing Module

**Purpose:** Parse artifacts and generate Evidence objects.

**Exported Types:**
- Parser
- EvidenceExtraction

**Imports Allowed:**
- runtime/canonical
- cir
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Evidence

**Consumed Object Families:**
- Artifact

---

### Compiler Facts Module

**Purpose:** Extract facts from evidence and generate Fact objects.

**Exported Types:**
- FactExtractor
- FactExtraction

**Imports Allowed:**
- runtime/canonical
- cir
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Fact

**Consumed Object Families:**
- Evidence

---

### Compiler Relationships Module

**Purpose:** Extract relationships from facts and evidence and generate Relationship objects.

**Exported Types:**
- RelationshipExtractor
- RelationshipExtraction

**Imports Allowed:**
- runtime/canonical
- cir
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Relationship

**Consumed Object Families:**
- Fact
- Evidence

---

### Compiler Knowledge Module

**Purpose:** Compile knowledge from facts, evidence, and relationships and generate Knowledge objects.

**Exported Types:**
- KnowledgeCompiler
- KnowledgeCompilation

**Imports Allowed:**
- runtime/canonical
- cir
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Knowledge

**Consumed Object Families:**
- Fact
- Evidence
- Relationship

---

### Compiler Assessment Module

**Purpose:** Generate assessments from knowledge.

**Exported Types:**
- AssessmentEngine
- AssessmentGeneration

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Assessment

**Consumed Object Families:**
- Knowledge

---

### Compiler Capability Module

**Purpose:** Compile capabilities from knowledge and generate Capability objects.

**Exported Types:**
- CapabilityCompiler
- CapabilityCompilation

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Capability

**Consumed Object Families:**
- Knowledge

---

### Compiler Planning Module

**Purpose:** Generate plans from knowledge, capabilities, policies, and goals.

**Exported Types:**
- Planner
- PlanGeneration

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Plan

**Consumed Object Families:**
- Knowledge
- Capability
- Policy
- Goal

---

### Compiler Projection Module

**Purpose:** Generate projections from knowledge and relationships.

**Exported Types:**
- ProjectionEngine
- ProjectionGeneration

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Projection

**Consumed Object Families:**
- Knowledge
- Relationship

---

### Compiler Replay Module

**Purpose:** Execute replay and generate certificates.

**Exported Types:**
- ReplayEngine
- CertificateGeneration

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Certificate

**Consumed Object Families:**
- Knowledge

---

### Compiler Pipeline Module

**Purpose:** Execute compiler pipeline and coordinate stages.

**Exported Types:**
- PipelineExecutor
- StageRegistry
- PassRegistry

**Imports Allowed:**
- All compiler modules
- runtime/canonical
- runtime/persistence

**Imports Forbidden:**
- No business logic

**Produced Object Families:**
- None (coordination only)

**Consumed Object Families:**
- All canonical object families

---

### Compiler Optimization Module

**Purpose:** Execute optimization passes on knowledge.

**Exported Types:**
- DuplicateFactElimination
- RelationshipInference
- OntologyMerging
- CapabilityClustering
- SemanticSummarization
- EmbeddingGeneration
- ContradictionDetection
- DeadKnowledgeElimination

**Imports Allowed:**
- runtime/canonical
- compiler/pipeline

**Imports Forbidden:**
- No direct access to other compiler stages

**Produced Object Families:**
- Knowledge (optimized)

**Consumed Object Families:**
- Knowledge

---

## File-by-File Implementation Audit

### Existing Python Files

| Existing File | Keep | Replace | Move | Delete | New Location |
|---------------|------|---------|------|--------|--------------|
| runtime/cognitive/models.py | Replace | Canonical objects | runtime/canonical | ✓ | runtime/canonical/models.ts |
| repository_scanner.py | Keep | Discovery stage | compiler/discovery | | compiler/discovery/scanner.ts |
| repository_event_layer.py | Delete | Compiler pipeline replaces | | ✓ | — |
| observation_worker.py | Replace | Parser stage | compiler/parsing | | compiler/parsing/observation.ts |
| claim_worker.py | Replace | Knowledge compiler | compiler/knowledge | | compiler/knowledge/compiler.ts |
| replay_worker.py | Replace | Replay engine | runtime/replay | | runtime/replay/engine.ts |
| witness_worker.py | Replace | Certificate service | runtime/certificates | | runtime/certificates/witness.ts |
| lineage_worker.py | Replace | Relationship extractor | compiler/relationships | | compiler/relationships/extractor.ts |
| projection_worker.py | Replace | Projection engine | runtime/projection | | runtime/projection/engine.ts |
| constitutional_runtime.py | Replace | Pipeline executor | compiler/pipeline | | compiler/pipeline/executor.ts |
| constitutional_event_loop.py | Replace | Pipeline executor | compiler/pipeline | | compiler/pipeline/executor.ts |
| runtime/security/projection_integrity.py | Replace | Verification engine | runtime/verification | | runtime/verification/engine.ts |
| runtime/retrieval/retrieval_service.py | Replace | Projection engine | runtime/projection | | runtime/projection/search.ts |
| runtime/cognitive/context_pack_cache.py | Replace | Projection cache | runtime/projection | | runtime/projection/cache.ts |
| runtime/ingestion/drive_ingestor.py | Keep | Acquisition stage | compiler/acquisition | | compiler/acquisition/drive.ts |
| brainos/newsletter/worker.py | Keep | Acquisition stage | compiler/acquisition | | compiler/acquisition/newsletter.ts |
| brainos/rss/worker.py | Keep | Acquisition stage | compiler/acquisition | | compiler/acquisition/rss.ts |
| kernel/event_dispatcher.py | Delete | Compiler pipeline replaces | | ✓ | — |
| filesystem_worker.py | Keep | Acquisition stage | compiler/acquisition | | compiler/acquisition/filesystem.ts |

---

### Existing TypeScript Files

| Existing File | Keep | Replace | Move | Delete | New Location |
|---------------|------|---------|------|--------|--------------|
| runtime/replay/deterministic_replay_engine.ts | Keep | Replay engine | runtime/replay | | runtime/replay/engine.ts |
| runtime/replay/canonical_json.ts | Keep | Serialization | runtime/serialization | | runtime/serialization/canonical.ts |
| runtime/replay/canonical_hash_authority.ts | Keep | Authority service | runtime/authority | | runtime/authority/hash.ts |
| runtime/replay/canonical_certificate.ts | Keep | Certificate service | runtime/certificates | | runtime/certificates/certificate.ts |
| runtime/replay/witness_authority.ts | Keep | Authority service | runtime/authority | | runtime/authority/witness.ts |
| runtime/replay/certificate_authority.ts | Keep | Authority service | runtime/authority | | runtime/authority/certificate.ts |
| runtime/replay/authority_registry.ts | Keep | Authority service | runtime/authority | | runtime/authority/registry.ts |
| runtime/replay/constitutional_law_manifest.ts | Keep | Constitution service | runtime/constitution | | runtime/constitution/manifest.ts |
| runtime/replay/constitutional_self_check.ts | Keep | Verification service | runtime/verification | | runtime/verification/self-check.ts |
| runtime/replay/replay_event_stream.ts | Keep | Replay service | runtime/replay | | runtime/replay/stream.ts |
| runtime/replay/replay_state_machine.ts | Keep | Replay service | runtime/replay | | runtime/replay/state-machine.ts |
| runtime/replay/replay_verification.ts | Keep | Verification service | runtime/verification | | runtime/verification/replay.ts |
| runtime/replay/merkle_tree.ts | Keep | Graph service | runtime/graphs | | runtime/graphs/merkle.ts |
| runtime/replay/graph_validator.ts | Keep | Graph service | runtime/graphs | | runtime/graphs/validator.ts |
| runtime/replay/invariant_runner.ts | Keep | Verification service | runtime/verification | | runtime/verification/invariant.ts |
| runtime/replay/replay_invariants.ts | Keep | Verification service | runtime/verification | | runtime/verification/invariants.ts |
| runtime/adapters/postgres_event_store.ts | Keep | Persistence service | runtime/persistence | | runtime/persistence/postgres.ts |
| runtime/adapters/express_commit_adapter.ts | Keep | Acquisition adapter | compiler/acquisition | | compiler/acquisition/git.ts |
| runtime/adapters/config_adapter.ts | Keep | Configuration service | runtime/config | | runtime/config/adapter.ts |

---

## Migration Map

### Phase 1: Core Types (Week 1)

**Create:**
- runtime/canonical/canonical-object.ts
- runtime/canonical/canonical-id.ts
- runtime/canonical/canonical-identity.ts
- runtime/canonical/canonical-metadata.ts
- runtime/canonical/canonical-provenance.ts
- runtime/canonical/canonical-lifecycle.ts

**Migrate:**
- runtime/cognitive/models.py → runtime/canonical/models.ts

---

### Phase 2: CIR Library (Week 2)

**Create:**
- cir/entity.ts
- cir/relationship.ts
- cir/property.ts
- cir/observation.ts
- cir/fact.ts
- cir/constraint.ts
- cir/behavior.ts
- cir/interface.ts
- cir/authority.ts
- cir/capability.ts
- cir/decision.ts
- cir/policy.ts
- cir/event.ts

---

### Phase 3: Compiler Stages (Week 3-4)

**Create:**
- compiler/discovery/scanner.ts
- compiler/acquisition/snapshot.ts
- compiler/parsing/parser.ts
- compiler/facts/extractor.ts
- compiler/relationships/extractor.ts
- compiler/knowledge/compiler.ts

**Migrate:**
- repository_scanner.py → compiler/discovery/scanner.ts
- observation_worker.py → compiler/parsing/observation.ts
- claim_worker.py → compiler/knowledge/compiler.ts
- lineage_worker.py → compiler/relationships/extractor.ts

---

### Phase 4: Runtime Services (Week 5-6)

**Create:**
- runtime/replay/engine.ts
- runtime/projection/engine.ts
- runtime/assessment/engine.ts
- runtime/planning/engine.ts
- runtime/executive/agent.ts

**Migrate:**
- replay_worker.py → runtime/replay/engine.ts
- projection_worker.py → runtime/projection/engine.ts
- runtime/security/projection_integrity.py → runtime/verification/engine.ts
- runtime/retrieval/retrieval_service.py → runtime/projection/search.ts

---

### Phase 5: Graph Engine (Week 7)

**Create:**
- graphs/identity/graph.ts
- graphs/authority/graph.ts
- graphs/structural/graph.ts
- graphs/dependency/graph.ts
- graphs/behavior/graph.ts
- graphs/capability/graph.ts
- graphs/policy/graph.ts
- graphs/decision/graph.ts
- graphs/knowledge/graph.ts
- graphs/replay/graph.ts
- graphs/temporal/graph.ts

**Migrate:**
- runtime/replay/merkle_tree.ts → runtime/graphs/merkle.ts
- runtime/replay/graph_validator.ts → runtime/graphs/validator.ts

---

### Phase 6: Pipeline Integration (Week 8)

**Create:**
- compiler/pipeline/executor.ts
- compiler/pipeline/stage-registry.ts
- compiler/pipeline/pass-registry.ts

**Migrate:**
- constitutional_runtime.py → compiler/pipeline/executor.ts
- constitutional_event_loop.py → compiler/pipeline/executor.ts
- kernel/event_dispatcher.py → (delete, replaced by pipeline)

---

## TypeScript Tree Structure

### Initial Implementation Tree

```
runtime/
    canonical/
        canonical-object.ts
        canonical-id.ts
        canonical-identity.ts
        canonical-metadata.ts
        canonical-provenance.ts
        canonical-lifecycle.ts
        source.ts
        artifact.ts
        evidence.ts
        fact.ts
        relationship.ts
        knowledge.ts
        assessment.ts
        capability.ts
        plan.ts
        projection.ts
        certificate.ts

compiler/
    discovery/
        scanner.ts
    acquisition/
        snapshot.ts
    parsing/
        parser.ts
    facts/
        extractor.ts
    relationships/
        extractor.ts
    knowledge/
        compiler.ts
    assessment/
        engine.ts
    capability/
        compiler.ts
    planning/
        planner.ts
    projection/
        engine.ts
    replay/
        engine.ts
    pipeline/
        executor.ts

cir/
    entity.ts
    relationship.ts
    property.ts
    observation.ts
    fact.ts
    constraint.ts
    behavior.ts
    interface.ts
    authority.ts
    capability.ts
    decision.ts
    policy.ts
    event.ts

graphs/
    identity/
    authority/
    structural/
    dependency/
    behavior/
    capability/
    policy/
    decision/
    knowledge/
    replay/
    temporal/

replay/
projection/
planning/
assessment/
persistence/
serialization/
```

---

## Implementation Sequencing

### Recommended Implementation Order

1. **packages/core-types** (Week 1-2)
   - Canonical object interfaces
   - Canonical IDs
   - Serialization

2. **packages/cir** (Week 3)
   - Intermediate representation
   - Builders
   - Validators

3. **packages/compiler** (Week 4-6)
   - Stage interfaces
   - Pipeline executor
   - Pass registry

4. **packages/frontends** (Week 7-8)
   - Git
   - Markdown
   - OpenAPI
   - Filesystem
   - Telemetry

5. **packages/storage** (Week 9)
   - Object persistence
   - Replay storage
   - Certificates

6. **packages/runtime** (Week 10-12)
   - Planner
   - Dispatcher
   - Worker protocol
   - Distributed Qwen runtime
   - 14B coordinator
   - 7B/8B compiler workers
   - Artifact/fact/relationship compilation

---

## Conclusion

This document completes the constitutional layer. All architectural documents are now frozen. No more architectural redesign, no more object-family changes, no more graph-family changes, no more compiler-stage changes. Everything after this becomes executable work.

---

**Status:** DRAFT
**Version:** 1.0
