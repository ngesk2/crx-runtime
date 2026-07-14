# Constitutional Runtime 2.1 - Architecture Diagram

## Overview

This document provides the updated architecture diagram for Constitutional Runtime 2.1, reflecting the consolidation and normalization pass.

---

## Complete Architecture Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Constitutional Runtime 2.1                              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Intent Layer (Stable)                                                             │
│                                                                                   │
│  Intent → Strategy → Transient Objectives                                        │
│                                                                                   │
│  - Intent: Long-term, stable goals (rarely change)                               │
│  - Strategy: Stable architectural behavior (survives objective revisions)        │
│  - Transient Objectives: Planning constructs (compile to Mission IR)              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Planning Layer (Platform-Independent)                                             │
│                                                                                   │
│  Transient Objectives → Mission IR → Planning IR → Canonical IR                   │
│                                                                                   │
│  - Mission IR: Compiled from objectives, executable representation                │
│  - Planning IR: Platform-independent, capability-agnostic                         │
│  - Canonical IR: Single source of truth, versioned (v1)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Compiler Stages (High-Level Abstraction)                                         │
│                                                                                   │
│  Frontend → IR Normalization → Optimization → Scheduling → Security → Evidence → │
│  Backend                                                                         │
│                                                                                   │
│  - Frontend: Parse and validate PlanningIR                                        │
│  - IR Normalization: Normalize to canonical form                                 │
│  - Optimization: Run optimization passes on CIR                                  │
│  - Scheduling: Determine execution order                                        │
│  - Security: Validate security constraints                                      │
│  - Evidence: Generate evidence collection plan                                  │
│  - Backend: Finalize CIR for execution                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Optimization Passes (LLVM-Style)                                                │
│                                                                                   │
│  Validation → Dependency → Capability → Rollback → Parallelization → Cost →      │
│  Evidence → Verification                                                        │
│                                                                                   │
│  - Internal implementation detail                                               │
│  - Public API exposes stages, not passes                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Canonical IR (Optimized)                                                         │
│                                                                                   │
│  Nodes: TRANSFORM | EFFECT | VALIDATION | AGGREGATION | BRANCH | MERGE           │
│                                                                                   │
│  - Pure Transforms: Input → Output, deterministic, composable                    │
│  - Effect Nodes: Filesystem, Network, Terminal, LLM, Artifacts, Human, etc.      │
│  - Capability Requirements: Semantic capability paths                            │
│  - Resource Requirements: Memory, CPU, network, etc.                             │
│  - Artifacts: First-class constitutional citizens                                │
│  - Constraints: Temporal, resource, capability, safety                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Execution Graph Generation                                                       │
│                                                                                   │
│  Canonical IR → Execution Graph (DAG)                                            │
│                                                                                   │
│  - Nodes become executable tasks                                                 │
│  - Edges become dependencies                                                     │
│  - Capability requirements attached to nodes                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Runtime Subsystems (Distributed-Ready)                                           │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Scheduler   │  │  Executor    │  │  Verifier    │  │  Evidence    │        │
│  │              │  │              │  │              │  │  Engine      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Security    │  │  Artifacts   │  │  State       │  │  Capability  │        │
│  │  Manager     │  │  Registry    │  │  Machine     │  │  Broker      │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                   │
│  - Subsystems communicate via artifacts and events                                │
│  - No direct object references                                                   │
│  - Ready for distribution                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Event Store (Canonical Truth)                                                     │
│                                                                                   │
│  Events:                                                                          │
│  - IntentCreated, StrategyCreated, ObjectiveCreated                              │
│  - MissionCreated, MissionCompiled, MissionOptimized, MissionScheduled, ...      │
│  - CapabilityRequested, CapabilityGranted, CapabilityRevoked, ...               │
│  - LeaseIssued, LeaseRevoked, LeaseExpired                                       │
│  - CIRGenerated, ExecutionGraphGenerated                                         │
│  - NodeScheduled, NodeStarted, NodeCompleted, NodeFailed, ...                    │
│  - ArtifactProduced, ArtifactVerified, ArtifactSigned, ...                        │
│  - VerificationStarted, VerificationSucceeded, VerificationFailed                 │
│  - EvidenceCollected, EvidenceVerified                                            │
│  - StateTransition                                                               │
│                                                                                   │
│  - Append-only, immutable events                                                 │
│  - Optimistic concurrency control                                                 │
│  - Event streams per aggregate                                                   │
│  - Event subscriptions                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        ↓
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Projections (Derived State)                                                       │
│                                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Mission     │  │  Artifact    │  │  Capability  │  │  Lease       │        │
│  │  Projection  │  │  Projection  │  │  Projection  │  │  Projection  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                                   │
│  - State derived from events                                                     │
│  - Rebuildable from event replay                                                 │
│  - No mutable truth directly owned by subsystems                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Changes

### 1. Intent/Strategy/Objective Simplification

**Before:**
```
Intent → Strategy → Objective → Mission → Workflow → Task
```

**After:**
```
Intent → Strategy → Transient Objectives → Mission IR → Planning IR → Canonical IR
```

**Changes:**
- Objectives are now transient planning constructs
- Objectives compile into Mission IR
- Objectives exist only during planning unless explicitly persisted
- Backwards compatibility adapter for legacy objectives

---

### 2. Canonical Intermediate Representation

**Before:**
- Multiple incompatible internal representations
- Planning IR directly converted to Execution Graph

**After:**
```
Planning IR → Canonical IR → Optimization → Execution Graph
```

**Changes:**
- Single source of truth for all downstream systems
- Versioned schema (v1)
- Separates pure transforms from effect nodes
- All subsystems consume CIR

---

### 3. Compiler Stages

**Before:**
- Dozens of optimization passes exposed as public API
- No clear compilation phases

**After:**
```
Frontend → IR Normalization → Optimization → Scheduling → Security → Evidence → Backend
```

**Changes:**
- High-level stage abstraction
- Internal passes hidden from public API
- LLVM-style architecture
- Clear compilation phases

---

### 4. Skill Classification

**Before:**
- All skills in single registry
- No distinction between pure and effectful

**After:**
```
Pure Transformations (composable, no side effects)
Effect Nodes (capability negotiation required)
```

**Changes:**
- Clear separation of concerns
- Pure transforms compose indefinitely
- Effect nodes require capability negotiation
- Functional programming principles

---

### 5. Event Sourcing

**Before:**
- Mutable state owned by subsystems
- No canonical event history

**After:**
```
Events (canonical truth) → Projections (derived state)
```

**Changes:**
- Events become canonical truth
- Mutable state becomes derived projections
- Enables replay and audit
- Supports distributed runtime

---

### 6. Schema Versioning

**Before:**
- Schemas mutated in-place
- No version tracking
- No migration support

**After:**
```
Schema v1 → Schema v2 → Schema v3 (with migrations)
```

**Changes:**
- Explicit schema versions
- Migration system for forward evolution
- Never mutate schemas in-place
- Schema validation

---

## Subsystem Communication

### Before

```
Subsystem A → Direct Object Reference → Subsystem B
```

### After

```
Subsystem A → Artifact/Event → Subsystem B
```

**Benefits:**
- No direct object references
- Ready for distribution
- Clear communication boundaries
- Audit trail via events

---

## Data Flow

### Planning Flow

```
User Intent
    ↓
Strategy Selection
    ↓
Transient Objective Generation
    ↓
Objective to Mission IR Compilation
    ↓
Planning IR Generation
    ↓
IR Lowering to CIR
    ↓
Compiler Stages (Frontend → Normalization → Optimization → Scheduling → Security → Evidence → Backend)
    ↓
Optimized CIR
    ↓
Execution Graph Generation
```

### Execution Flow

```
Execution Graph
    ↓
Scheduler (determines execution order)
    ↓
Capability Broker (zero-trust permission requests)
    ↓
Executor (executes nodes)
    ↓
Event Emission (canonical truth)
    ↓
Projection Updates (derived state)
    ↓
Verifier (independent verification)
    ↓
Evidence Engine (evidence collection)
    ↓
State Machine (constitutional transitions)
```

---

## Key Components

### 1. Canonical IR (`architecture/canonical_ir.py`)
- Single source of truth
- Versioned schema
- Pure transforms vs effect nodes
- Capability requirements
- Resource requirements
- Artifacts and constraints

### 2. Schema Versioning (`architecture/schema_versioning.py`)
- Schema registry
- Migration system
- Schema validation
- Version tracking

### 3. Event Store (`architecture/event_store.py`)
- Append-only events
- Event streams
- Optimistic concurrency
- Event subscriptions

### 4. Transient Objectives (`runtime/planning/transient_objectives.py`)
- Planning constructs
- Compile to Mission IR
- Optional persistence
- Lifecycle management

### 5. Compiler Stages (`runtime/planning/compiler_stages.py`)
- High-level abstraction
- Frontend, Normalization, Optimization, Scheduling, Security, Evidence, Backend
- LLVM-style architecture

### 6. Skill Classification (`runtime/skills/skill_classification.py`)
- Pure transforms
- Effect nodes
- Composition support
- Capability requirements

### 7. Capability Broker (`runtime/security/semantic_capabilities.py`)
- Semantic capability paths
- Graph-based authorization
- Zero-trust permissions
- Lease management

### 8. Constitutional Scheduler (`runtime/scheduler/constitutional_scheduler.py`)
- Separate from executor
- Priority, deadlines, preemption
- Backpressure, fairness
- Resource management

### 9. Independent Verifier (`runtime/verification/verifier.py`)
- Separate from executor
- Multi-pass verification
- Trust evaluation
- Verification pipeline

### 10. Evidence Engine (`runtime/evidence/evidence_compiler.py`)
- Automatic evidence generation
- Evidence plans
- Evidence execution
- Verification integration

### 11. State Machine (`runtime/state/state_machine.py`)
- Constitutional transitions
- Immutable lifecycle
- Transition rules
- State validation

### 12. Artifact Ontology (`runtime/artifacts/artifact_ontology.py`)
- First-class citizens
- Ownership, immutability, lineage
- Signature, schema, verification
- Artifact registry

---

## Backwards Compatibility

### Adapters

1. **Objective Adapter** (`runtime/planning/transient_objectives.py`)
   - Converts legacy Objective to TransientObjective
   - Maintains existing hierarchy.py interface

2. **Planning IR Adapter** (IR lowering pass)
   - Planning IR continues to be public API
   - IR lowering happens transparently

3. **Capability Authorization Adapter** (pending)
   - Bridge string-based and semantic authorization
   - Gradual migration path

4. **State Projection Adapter** (pending)
   - Convert mutable state to projections
   - Maintain existing state access

### Principle

**Always preserve backwards compatibility where practical. If something becomes internal, create an adapter instead of deleting it.**

---

## Distributed Runtime Preparation

### Current State
- Subsystems communicate via direct object references
- Mutable state owned by subsystems
- Co-location assumed

### Target State
- Subsystems communicate via artifacts and events
- State derived from events
- No co-location assumptions
- Ready for distribution

### Migration Path
1. Abstract subsystem boundaries
2. Implement artifact-based communication
3. Implement event-based communication
4. Remove direct object references
5. Enable subsystem distribution

---

## Summary

The Constitutional Runtime 2.1 architecture consolidates and normalizes the runtime for long-term evolution:

- **Canonical IR** as single source of truth
- **Schema versioning** for safe evolution
- **Event sourcing** for audit and replay
- **Transient objectives** for flexible planning
- **Compiler stages** for clear compilation phases
- **Skill classification** for pure vs effectful separation
- **Backwards compatibility** through adapters
- **Distributed-ready** subsystem communication

All changes maintain backwards compatibility through adapters and gradual migration paths.
