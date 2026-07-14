# Constitutional Runtime 2.1 - Consolidation Plan

## Overview

This document outlines the consolidation and normalization pass for Constitutional Runtime 2.1. The goal is to prepare the runtime for long-term evolution by consolidating architecture, normalizing interfaces, and establishing clear boundaries between subsystems.

**Key Principle:** Always preserve backwards compatibility where practical. Old APIs may delegate to new implementations. Nothing should disappear without first becoming an implementation detail.

---

## Completed Architectural Improvements

### 1. Canonical Intermediate Representation (CIR)

**Status:** ✅ Completed

**Location:** `architecture/canonical_ir.py`

**Description:**
- Single source of truth for all downstream systems
- Versioned schema (v1)
- Separates pure transforms from effect nodes
- Defines canonical node types: TRANSFORM, EFFECT, VALIDATION, AGGREGATION, BRANCH, MERGE
- Supports capability requirements and resource requirements
- Includes artifacts and constraints

**Impact:**
- All downstream systems (Verifier, Scheduler, Evidence, Rollback, Security, Artifacts, State Machine) consume the same CIR
- Eliminates multiple incompatible internal representations
- Enables optimization passes to operate on canonical form

**Backwards Compatibility:**
- Existing Planning IR continues to work
- IR lowering pass converts Planning IR → CIR
- No breaking changes to existing code

---

### 2. Schema Versioning Framework

**Status:** ✅ Completed

**Location:** `architecture/schema_versioning.py`

**Description:**
- Explicit schema versions for all runtime schemas
- Schema registry with version tracking
- Migration system for forward evolution
- Schema validation
- Never mutates schemas in-place

**Schema Types:**
- Mission v1, v2, v3
- PlanningIR v3
- CanonicalIR v1
- Artifact v5
- Evidence v2
- Capability v4
- Workflow v6

**Impact:**
- Enables safe schema evolution
- Supports migration paths between versions
- Provides validation for all data

**Backwards Compatibility:**
- Existing schemas continue to work
- Migration adapters for old versions
- Deprecation warnings before removal

---

### 3. IR Lowering (Planning IR → CIR)

**Status:** ✅ Completed

**Location:** `architecture/ir_lowering.py`

**Description:**
- Lowers Planning IR to Canonical IR
- Converts subgoals to CIR nodes
- Converts capability requests to CIR capability requirements
- Creates edges based on dependencies
- Generates artifacts and constraints
- Validates CIR output

**Impact:**
- Planning IR remains platform-independent
- CIR becomes single source of truth
- Enables optimization passes on canonical form

**Backwards Compatibility:**
- Existing Planning IR generation unchanged
- Lowering is transparent to users
- No changes to planning logic

---

### 4. Event Sourcing Foundation

**Status:** ✅ Completed

**Locations:** 
- `architecture/canonical_events.py`
- `architecture/event_store.py`

**Description:**
- Canonical event types for all runtime operations
- Append-only event store
- Event streams per aggregate
- Optimistic concurrency control
- Event subscriptions

**Event Types:**
- IntentCreated, StrategyCreated, ObjectiveCreated
- MissionCreated, MissionCompiled, MissionOptimized, MissionScheduled, MissionStarted, MissionCompleted, MissionFailed, MissionCancelled, MissionArchived
- CapabilityRequested, CapabilityGranted, CapabilityRevoked, CapabilityDenied
- LeaseIssued, LeaseRevoked, LeaseExpired
- PlanningIRGenerated, CIRGenerated, ExecutionGraphGenerated
- NodeScheduled, NodeStarted, NodeCompleted, NodeFailed, NodePreempted
- ArtifactProduced, ArtifactVerified, ArtifactSigned, ArtifactArchived
- VerificationStarted, VerificationSucceeded, VerificationFailed
- EvidenceCollected, EvidenceVerified
- StateTransition

**Impact:**
- Events become canonical truth
- Mutable state becomes derived projections
- Enables replay and audit
- Supports distributed runtime

**Backwards Compatibility:**
- Existing state management continues to work
- Event store is additive, not replacement
- Gradual migration to event-sourced projections

---

### 5. Transient Objectives

**Status:** ✅ Completed

**Location:** `runtime/planning/transient_objectives.py`

**Description:**
- Objectives become planner-generated planning artifacts
- Transient by default (exist only during planning)
- Optional persistence for audit/history
- Compile into Mission IR
- Backwards compatibility adapter for legacy objectives

**Lifecycle:**
- TRANSIENT: Exists only during planning
- PERSISTED: Explicitly persisted for audit/history
- ARCHIVED: No longer active but preserved

**Impact:**
- Objectives no longer permanent architectural entities
- Planning becomes more flexible
- Reduces persistence overhead
- Maintains audit capability

**Backwards Compatibility:**
- Legacy Objective implementation preserved
- Adapter converts between legacy and transient
- Existing hierarchy.py continues to work

---

### 6. Objective to Mission IR Compiler

**Status:** ✅ Completed

**Location:** `runtime/planning/objective_compiler.py`

**Description:**
- Compiles transient objectives into Mission IR
- Generates subgoals from success criteria
- Generates capability requests from constraints
- Generates evidence requirements
- Generates risks and failure modes
- Validates Mission IR output

**Impact:**
- Objectives compile into executable representation
- Clear separation between planning and execution
- Enables objective-level optimization

**Backwards Compatibility:**
- Existing mission creation continues to work
- Compiler is additive capability
- No changes to existing workflows

---

### 7. High-Level Compiler Stages

**Status:** ✅ Completed

**Location:** `runtime/planning/compiler_stages.py`

**Description:**
- Exposes high-level compiler stages instead of implementation details
- Pipeline: Frontend → IR Normalization → Optimization → Scheduling → Security → Evidence → Backend
- Internally executes multiple optimization passes
- Public API exposes stages, not passes
- LLVM-style architecture

**Stages:**
1. **Frontend:** Parses and validates input (PlanningIR)
2. **IR Normalization:** Normalizes PlanningIR to canonical form
3. **Optimization:** Runs optimization passes on CIR
4. **Scheduling:** Determines execution order
5. **Security:** Validates security constraints
6. **Evidence:** Generates evidence collection plan
7. **Backend:** Finalizes CIR for execution

**Impact:**
- Simplified public API
- Clear compilation phases
- Easier to understand and maintain
- Enables stage-level customization

**Backwards Compatibility:**
- Existing optimization passes preserved
- Pass pipeline still accessible
- Stage abstraction is additive

---

### 8. Pure Transformations vs Effect Nodes

**Status:** ✅ Completed

**Location:** `runtime/skills/skill_classification.py`

**Description:**
- Separates skills into pure transformations and effect nodes
- Pure transforms: Input → Output, deterministic, composable, no side effects
- Effect nodes: Filesystem, Network, Terminal, LLM, Artifacts, Human approval, Compilation, Execution
- Functional programming principles
- Pure transforms compose indefinitely
- Effect nodes require capability negotiation

**Pure Transform:**
- Normalization
- Planning transforms
- Schema transforms
- IR transforms
- Graph transforms
- Validation transforms
- Aggregation, Filter, Map, Reduce

**Effect Nodes:**
- Filesystem read/write
- Network requests
- Terminal execution
- LLM inference
- Artifact creation/read
- Human approval
- Compilation
- Execution

**Impact:**
- Clear separation of concerns
- Enables optimization of pure transforms
- Capability negotiation focused on effect nodes
- Better composition semantics

**Backwards Compatibility:**
- Existing skill registry preserved
- Classification is additive
- Skills continue to work as before

---

### 9. Skill Classification

**Status:** ✅ Completed

**Location:** `runtime/skills/classify_existing_skills.py`

**Description:**
- Utility to classify existing skills
- Automatic classification based on capabilities and category
- Sample skills for demonstration
- Classification report generation

**Impact:**
- Existing skills automatically classified
- Clear inventory of pure transforms vs effect nodes
- Enables migration planning

**Backwards Compatibility:**
- No changes to existing skills
- Classification is read-only
- Skills continue to work as before

---

## Architecture Diagram

### Before Consolidation

```
Intent → Objective → Mission → Task
         ↓
    Planning IR
         ↓
    Execution Graph
         ↓
    Runtime
```

### After Consolidation

```
Intent (Stable)
    ↓
Strategy (Stable, survives objective revisions)
    ↓
Transient Objectives (Planning constructs, compile to Mission IR)
    ↓
Mission IR (Compiled from objectives)
    ↓
Planning IR (Platform-independent, capability-agnostic)
    ↓
Canonical IR (Single source of truth, versioned)
    ↓
Compiler Stages (Frontend → Normalization → Optimization → Scheduling → Security → Evidence → Backend)
    ↓
Optimized CIR
    ↓
Execution Graph
    ↓
Runtime Subsystems (Scheduler, Executor, Verifier, Evidence, Security, Artifacts, State Machine)
    ↓
Event Store (Canonical truth)
    ↓
Projections (Derived state)
```

---

## Migration Strategy

### Phase 1: Foundation (Completed)

- ✅ Canonical IR design and implementation
- ✅ Schema versioning framework
- ✅ Event sourcing foundation
- ✅ IR lowering implementation

### Phase 2: Planning Layer (Completed)

- ✅ Transient objectives
- ✅ Objective to Mission IR compiler
- ✅ Compiler stages abstraction
- ✅ Skill classification

### Phase 3: Capability Authorization (Pending)

- Migrate from string matching to semantic graph proofs
- Create capability authorization adapters
- Maintain backwards compatibility

### Phase 4: Event Sourcing Migration (Pending)

- Convert mutable state to projections
- Implement event replay
- Migrate existing state to events
- Update subsystems to consume events

### Phase 5: Distributed Runtime Preparation (Pending)

- Abstract subsystem boundaries
- Implement artifact/event communication
- Remove direct object references
- Enable subsystem distribution

---

## Compatibility Layer Plan

### Principle

**Always preserve backwards compatibility where practical. If something becomes internal, create an adapter instead of deleting it.**

### Compatibility Adapters

#### 1. Objective Adapter

**Location:** `runtime/planning/transient_objectives.py`

**Purpose:** Convert between legacy Objective and TransientObjective

**Methods:**
- `from_legacy_objective()`: Convert legacy to transient
- `to_legacy_objective()`: Convert transient to legacy

**Status:** ✅ Implemented

---

#### 2. Planning IR Adapter

**Purpose:** Maintain existing Planning IR interface while using CIR internally

**Implementation:**
- Planning IR continues to be public API
- IR lowering happens transparently
- No breaking changes

**Status:** ✅ Implemented (IR lowering pass)

---

#### 3. Capability Authorization Adapter

**Purpose:** Bridge string-based authorization with semantic graph proofs

**Implementation:**
- Existing string-based checks continue to work
- New semantic proofs run in parallel
- Gradual migration to semantic proofs

**Status:** ⏳ Pending

---

#### 4. State Projection Adapter

**Purpose:** Convert existing mutable state to event-sourced projections

**Implementation:**
- Existing state access continues to work
- Projections updated from events
- Gradual migration to event-driven state

**Status:** ⏳ Pending

---

## Event Sourcing Roadmap

### Current State

- ✅ Canonical event types defined
- ✅ Event store implemented
- ✅ Event factory for creating events
- ✅ Event streams and subscriptions

### Next Steps

1. **Event Emission Integration**
   - Integrate event emission into existing subsystems
   - Emit events for all state changes
   - Maintain existing state updates in parallel

2. **Projection Implementation**
   - Create projections for Mission, Artifact, Capability, Lease
   - Update projections from events
   - Implement projection rebuild from events

3. **Migration Path**
   - Migrate existing state to events
   - Validate event replay produces same state
   - Switch to event-driven state updates

4. **Subsystem Updates**
   - Update Scheduler to consume events
   - Update Verifier to consume events
   - Update Evidence Engine to consume events

5. **Event Replay**
   - Implement event replay for debugging
   - Implement event replay for audit
   - Implement event replay for testing

---

## Remaining Medium-Priority Tasks

### 1. Capability Authorization Migration

**Task:** Migrate from string matching to semantic graph proofs

**Approach:**
- Implement semantic capability graph traversal
- Create authorization proof generation
- Create capability authorization adapters
- Maintain string-based checks as fallback
- Gradual migration to semantic proofs

**Files:**
- `runtime/security/semantic_capabilities.py` (exists)
- New: `runtime/security/capability_authorization_adapter.py`

---

### 2. Strategy Evolution Evaluation

**Task:** Evaluate whether Strategy should become Policy or Constitutional Law

**Approach:**
- Analyze overlap between Strategy and Policy
- Analyze overlap between Strategy and Constitutional Law
- Determine if Strategy represents stable architectural behavior
- Recommend consolidation or separation

**Files:**
- `runtime/planning/strategy.py` (exists)
- New: `architecture/strategy_evaluation.md`

---

### 3. Mutable State to Projections

**Task:** Convert mutable state to event-sourced projections

**Approach:**
- Identify all mutable state
- Create projection definitions
- Implement projection update logic
- Migrate existing state to events
- Switch to event-driven updates

**Files:**
- New: `architecture/projections/mission_projection.py`
- New: `architecture/projections/artifact_projection.py`
- New: `architecture/projections/capability_projection.py`

---

### 4. Distributed Runtime Preparation

**Task:** Abstract subsystem boundaries for distributed runtime

**Approach:**
- Define subsystem interfaces
- Implement artifact-based communication
- Implement event-based communication
- Remove direct object references
- Enable subsystem distribution

**Files:**
- New: `architecture/subsystem_boundaries.py`
- New: `architecture/subsystem_communication.py`

---

## Summary

### High-Priority Deliverables (Completed)

1. ✅ Canonical Intermediate Representation (CIR)
2. ✅ Schema Versioning Framework
3. ✅ IR Lowering (Planning IR → CIR)
4. ✅ Event Sourcing Foundation
5. ✅ Transient Objectives
6. ✅ Objective to Mission IR Compiler
7. ✅ High-Level Compiler Stages
8. ✅ Pure Transformations vs Effect Nodes
9. ✅ Skill Classification

### Remaining High-Priority Deliverables

1. ⏳ Updated Architecture Diagram
2. ⏳ Migration Strategy Document
3. ⏳ Compatibility Layer Plan
4. ⏳ Event Sourcing Roadmap

### Medium-Priority Tasks

1. ⏳ Capability Authorization Migration
2. ⏳ Strategy Evolution Evaluation
3. ⏳ Mutable State to Projections
4. ⏳ Distributed Runtime Preparation

---

## Key Architectural Principles

1. **Planning ≠ Execution:** Planning never executes, Execution never replans
2. **Zero Trust:** Hermes starts with no permissions, must request everything
3. **Platform Independence:** Planning is implementation-agnostic
4. **Immutability:** Objectives versioned, artifacts immutable, events append-only
5. **Composition:** Skills are pure functions, capabilities are hierarchical
6. **Governance:** Constitutional Laws are immutable invariants
7. **Separation:** Scheduler ≠ Executor, Verifier ≠ Executor, Oracle ≠ Implementation
8. **Ephemeral:** Hermes has no permanent permissions, only mission-specific leases
9. **Canonical IR:** Single source of truth for all downstream systems
10. **Event Sourcing:** Events are canonical truth, state is derived projection

---

## Conclusion

The Constitutional Runtime 2.1 consolidation pass has successfully implemented the foundational architectural improvements needed for long-term evolution. The runtime now has:

- A canonical intermediate representation that all subsystems consume
- Schema versioning and migration support
- Event sourcing foundation for audit and replay
- Transient objectives that compile into executable missions
- High-level compiler stages that hide implementation details
- Clear separation between pure transformations and effect nodes
- Backwards compatibility adapters for all changes

The remaining tasks focus on completing the event sourcing migration, preparing for distributed runtime, and finalizing the capability authorization system. All changes maintain backwards compatibility through adapters and gradual migration paths.
