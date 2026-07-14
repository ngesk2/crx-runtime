# Constitutional Runtime 2.1 - Constitutional Simplification Report

## Overview

This report verifies the pipeline ensures every layer has exactly one responsibility with no leakage upward or downward.

**Target Pipeline:**
```
Intent → Strategy → Transient Objective → Mission IR → Planning IR → Canonical IR → Compiler Stages → Execution Graph → Executor
```

---

## Layer Responsibility Audit

### 1. Intent Layer

**Location:** `runtime/planning/strategy.py`

**Responsibility:** Define stable, long-term goals

**Current Implementation:**
- Intent dataclass with intent_id, intent_name, description, status, metadata
- IntentStatus enum (ACTIVE, ARCHIVED, SUPERSEDED)
- No execution logic
- No planning logic
- Pure data structure

**Responsibility Leakage:** None

**Issues:** None

**Recommendation:** **KEEP**

---

### 2. Strategy Layer

**Location:** `runtime/planning/strategy.py`

**Responsibility:** Define stable architectural approaches to achieving intents

**Current Implementation:**
- Strategy dataclass with strategy_id, intent_id, strategy_name, description, status, metadata
- StrategyStatus enum (ACTIVE, DEPRECATED, SUPERSEDED)
- StrategyBuilder for creating strategies
- No execution logic
- No planning logic
- Pure data structure

**Responsibility Leakage:** None

**Issues:** None

**Recommendation:** **KEEP**

**Note:** Evaluate if Strategy should become Constitutional Law (see Redundancy Report)

---

### 3. Transient Objective Layer

**Location:** `runtime/planning/transient_objectives.py`

**Responsibility:** Generate planning constructs from strategies

**Current Implementation:**
- TransientObjective dataclass
- ObjectiveLifecycle enum (TRANSIENT, PERSISTED, ARCHIVED)
- ObjectiveCompiler compiles objectives to Mission IR
- ObjectiveGenerator creates objectives from strategies
- ObjectivePersistenceAdapter for optional persistence
- ObjectiveAdapter for backwards compatibility

**Responsibility Leakage:**
- **LEAK DOWN:** ObjectiveCompiler compiles to Mission IR (should be separate layer)

**Issues:**
- ObjectiveCompiler should be separate layer (Objective → Mission IR compilation)
- Compilation logic mixed with objective definition

**Recommendation:** **SEPARATE**

**Action:**
- Keep TransientObjective as pure planning construct
- Move ObjectiveCompiler to separate compilation layer
- Objective → Mission IR compilation should be explicit layer

---

### 4. Mission IR Layer

**Location:** `runtime/planning/transient_objectives.py` (referenced)

**Responsibility:** Executable representation compiled from objectives

**Current Implementation:**
- MissionIR referenced as compilation target
- Not explicitly defined as separate class
- Compiled by ObjectiveCompiler

**Responsibility Leakage:**
- **LEAK UP:** MissionIR not explicitly defined as layer
- **LEAK DOWN:** Compilation logic in ObjectiveCompiler

**Issues:**
- MissionIR should be explicit layer
- Should be separate from TransientObjective
- Should be separate from PlanningIR

**Recommendation:** **CREATE**

**Action:**
- Create explicit MissionIR class
- Separate MissionIR from TransientObjective
- Separate MissionIR from PlanningIR
- MissionIR → PlanningIR compilation should be explicit layer

---

### 5. Planning IR Layer

**Location:** `runtime/planning/planning_ir.py`

**Responsibility:** Platform-independent, capability-agnostic planning output

**Current Implementation:**
- PlanningIR dataclass with subgoals, dependencies, capability_requests, risks, evidence_requirements
- PlanningIRBuilder for constructing IR
- Platform-independent
- Capability-agnostic
- Pure data structure

**Responsibility Leakage:** None

**Issues:** None

**Recommendation:** **KEEP**

---

### 6. Canonical IR Layer

**Location:** `architecture/canonical_ir.py`

**Responsibility:** Single source of truth for execution

**Current Implementation:**
- CanonicalIR dataclass with nodes, edges, artifacts, constraints
- CIRNode types: TRANSFORM, EFFECT, VALIDATION, AGGREGATION, BRANCH, MERGE
- Versioned schema (v1)
- Capability requirements
- Resource requirements
- Pure data structure

**Responsibility Leakage:** None

**Issues:** None

**Recommendation:** **KEEP**

---

### 7. Compiler Stages Layer

**Location:** `runtime/planning/compiler_stages.py`

**Responsibility:** High-level compilation phases

**Current Implementation:**
- CompilerStage abstract class
- Frontend, IR Normalization, Optimization, Scheduling, Security, Evidence, Backend stages
- ConstitutionalCompiler orchestrates stages
- Each stage has execute() method
- Stages are pure transformations (no IO, no execution)

**Responsibility Leakage:** None

**Issues:** None

**Recommendation:** **KEEP**

---

### 8. Execution Graph Layer

**Location:** Referenced but not explicitly defined

**Responsibility:** DAG representation of execution dependencies

**Current Implementation:**
- Referenced in architecture
- Not explicitly defined as class
- Generated from Canonical IR

**Responsibility Leakage:**
- **LEAK UP:** Not explicitly defined as layer
- **LEAK DOWN:** Generation logic not separated

**Issues:**
- Execution Graph should be explicit layer
- Should be separate from Canonical IR
- Should be internal implementation detail

**Recommendation:** **INTERNAL ONLY**

**Action:**
- Create ExecutionGraph class as internal implementation
- Hide from public API
- Generate from Canonical IR
- Pass to Executor

---

### 9. Executor Layer

**Location:** Not explicitly defined in reviewed files

**Responsibility:** Execute nodes from execution graph

**Current Implementation:**
- Referenced in architecture
- Not explicitly defined as class
- Should execute nodes from execution graph

**Responsibility Leakage:**
- **LEAK UP:** Not explicitly defined as layer
- **LEAK DOWN:** May leak planning responsibilities

**Issues:**
- Executor should be explicit layer
- Should never replan (Constitutional Law 1)
- Should only execute

**Recommendation:** **CREATE**

**Action:**
- Create explicit Executor class
- Enforce Constitutional Law 1 (Execution never replans)
- Only execute nodes from execution graph
- No planning logic

---

## Pipeline Issues

### Issue 1: Missing Explicit Layers

**Missing Layers:**
- Mission IR (referenced but not explicit)
- Execution Graph (referenced but not explicit)
- Executor (referenced but not explicit)

**Impact:**
- Pipeline not clearly defined
- Responsibilities leak between layers
- Hard to enforce boundaries

**Recommendation:** Create explicit layers

---

### Issue 2: Compilation Logic in Wrong Layer

**Problem:**
- ObjectiveCompiler in TransientObjective layer
- Should be separate compilation layer

**Impact:**
- Responsibilities leak
- Objective layer does too much
- Compilation not explicit layer

**Recommendation:** Move compilation logic to separate layer

---

### Issue 3: Internal Details Exposed

**Problem:**
- Execution Graph not explicitly internal
- MissionIR not explicitly internal

**Impact:**
- Public API too large
- Implementation details exposed
- Hard to change implementation

**Recommendation:** Hide internal implementation details

---

## Simplified Pipeline

### Current Pipeline (Implicit)
```
Intent → Strategy → Transient Objective (with compilation) → Planning IR → Canonical IR → Compiler Stages → Execution Graph (implicit) → Executor (implicit)
```

### Simplified Pipeline (Explicit)
```
Intent
  ↓
Strategy
  ↓
Transient Objective
  ↓
Objective Compiler (explicit layer)
  ↓
Mission IR (explicit layer)
  ↓
IR Lowering (explicit layer)
  ↓
Planning IR
  ↓
Compiler Stages
  ↓
Canonical IR
  ↓
Execution Graph Generator (internal)
  ↓
Execution Graph (internal)
  ↓
Executor (explicit layer)
```

---

## Recommendations

### High Priority

1. **Create Explicit Mission IR Layer**
   - Define MissionIR class
   - Separate from TransientObjective
   - Separate from PlanningIR

2. **Create Explicit Objective Compiler Layer**
   - Move ObjectiveCompiler from TransientObjective
   - Make explicit compilation layer
   - Objective → Mission IR compilation

3. **Create Explicit Executor Layer**
   - Define Executor class
   - Enforce Constitutional Law 1
   - Only execute, never replan

4. **Create Internal Execution Graph**
   - Define ExecutionGraph class as internal
   - Hide from public API
   - Generate from Canonical IR

### Medium Priority

5. **Create Explicit IR Lowering Layer**
   - Make IR Lowering explicit layer
   - Planning IR → Canonical IR
   - Clear separation

6. **Create Internal Execution Graph Generator**
   - Define ExecutionGraphGenerator as internal
   - Generate from Canonical IR
   - Hide from public API

### Low Priority

7. **Hide Internal Implementation Details**
   - Hide Execution Graph from public API
   - Hide MissionIR from public API
   - Expose only constitutional interfaces

---

## Layer Responsibility Summary

| Layer | Status | Responsibility | Leakage |
|-------|--------|----------------|----------|
| Intent | KEEP | Define stable goals | None |
| Strategy | KEEP | Define architectural approaches | None |
| Transient Objective | SEPARATE | Planning constructs | Leaks compilation |
| Mission IR | CREATE | Executable representation | Not explicit |
| Planning IR | KEEP | Platform-independent output | None |
| Canonical IR | KEEP | Single source of truth | None |
| Compiler Stages | KEEP | High-level compilation phases | None |
| Execution Graph | INTERNAL | DAG representation | Not explicit |
| Executor | CREATE | Execute nodes | Not explicit |

---

## Conclusion

The pipeline has clear separation of concerns at the high level (Intent, Strategy, Planning IR, Canonical IR, Compiler Stages) but lacks explicit layers for compilation and execution.

**Key Issues:**
1. Compilation logic mixed with objective definition
2. Mission IR not explicit layer
3. Execution Graph not explicit layer
4. Executor not explicit layer

**Recommendations:**
1. Create explicit compilation layer
2. Create explicit Mission IR layer
3. Create internal Execution Graph layer
4. Create explicit Executor layer
5. Hide internal implementation details

**Impact:**
- Clearer pipeline
- Better separation of concerns
- Easier to enforce boundaries
- Reduced architectural entropy
