# Constitutional Runtime 2.1 - Public API Audit

## Overview

This report audits the public API to reduce exposed APIs, hide implementation details, and recommend deprecations. The goal is to minimize the public surface area and expose only constitutional interfaces.

**Principle:** Expose only constitutional interfaces. Hide implementation details. Deprecate unnecessary APIs.

---

## Public API Audit

### 1. Planning API

**Location:** `runtime/planning/`

**Public Functions:**
- `get_hierarchy_store()` - Returns HierarchyStore singleton
- `get_strategy_hierarchy()` - Returns StrategyHierarchy singleton
- `get_strategy_builder()` - Returns StrategyBuilder singleton

**Public Classes:**
- Intent
- Strategy
- Objective
- ObjectiveRevision
- Mission
- Task
- HierarchyStore
- StrategyHierarchy
- StrategyBuilder

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (ObjectiveRevision, Task)
- Legacy hierarchy exposed (HierarchyStore)
- Should expose only constitutional interfaces

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep Intent, Strategy as constitutional interfaces
- Hide Objective, ObjectiveRevision, Mission, Task as internal
- Hide HierarchyStore as internal
- Expose only get_strategy_hierarchy(), get_strategy_builder()
- Deprecate get_hierarchy_store()

---

### 2. Compiler API

**Location:** `runtime/planning/compiler_stages.py`

**Public Functions:**
- None (ConstitutionalCompiler not exposed as singleton)

**Public Classes:**
- CompilerStage (enum)
- StageResult
- CompilationResult
- CompilerStage (base class)
- FrontendStage
- IRNormalizationStage
- OptimizationStage
- SchedulingStage
- SecurityStage
- EvidenceStage
- BackendStage
- ConstitutionalCompiler

**Analysis:**
- Too many stage classes exposed
- Implementation details exposed (individual stage classes)
- Should expose only ConstitutionalCompiler
- Stage classes should be internal

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep ConstitutionalCompiler as public interface
- Hide individual stage classes as internal
- Keep CompilerStage enum as public (for configuration)
- Hide StageResult, CompilationResult as internal
- Expose get_constitutional_compiler() singleton

---

### 3. Scheduler API

**Location:** `runtime/scheduler/constitutional_scheduler.py`

**Public Functions:**
- `get_constitutional_scheduler()` - Returns ConstitutionalScheduler singleton
- `get_scheduler_metrics()` - Returns SchedulerMetrics singleton

**Public Classes:**
- SchedulingPriority (enum)
- SchedulingStatus (enum)
- ResourceRequirement
- SchedulingConstraints
- ScheduledTask
- ConstitutionalScheduler
- SchedulerMetrics

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (ScheduledTask, ResourceRequirement)
- Should expose only ConstitutionalScheduler
- Enums should be public (for configuration)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep ConstitutionalScheduler as public interface
- Keep SchedulingPriority, SchedulingStatus enums as public
- Hide ScheduledTask, ResourceRequirement, SchedulingConstraints as internal
- Hide SchedulerMetrics as internal
- Expose get_constitutional_scheduler() singleton

---

### 4. Verification API

**Location:** `runtime/verification/verifier.py`

**Public Functions:**
- `get_independent_verifier()` - Returns IndependentVerifier singleton
- `get_verification_pipeline()` - Returns VerificationPipeline singleton

**Public Classes:**
- VerificationStatus (enum)
- VerificationMethod (enum)
- VerificationResult
- VerificationTask
- IndependentVerifier
- VerificationPipeline

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (VerificationTask, VerificationResult)
- Should expose only IndependentVerifier
- Enums should be public (for configuration)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep IndependentVerifier as public interface
- Keep VerificationStatus, VerificationMethod enums as public
- Hide VerificationTask, VerificationResult as internal
- Hide VerificationPipeline as internal
- Expose get_independent_verifier() singleton

---

### 5. Evidence API

**Location:** `runtime/evidence/evidence_compiler.py`

**Public Functions:**
- `get_evidence_compiler()` - Returns EvidenceCompiler singleton
- `get_evidence_executor()` - Returns EvidenceExecutor singleton

**Public Classes:**
- EvidenceType (enum)
- EvidencePriority (enum)
- EvidenceRequirement
- EvidencePlan
- EvidenceCompiler
- EvidenceExecutor

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (EvidenceRequirement, EvidencePlan)
- Should expose only EvidenceCompiler
- Enums should be public (for configuration)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep EvidenceCompiler as public interface
- Keep EvidenceType, EvidencePriority enums as public
- Hide EvidenceRequirement, EvidencePlan as internal
- Hide EvidenceExecutor as internal (should be part of execution layer)
- Expose get_evidence_compiler() singleton

---

### 6. Security API

**Location:** `runtime/security/semantic_capabilities.py`

**Public Functions:**
- `get_semantic_capability_broker()` - Returns SemanticCapabilityBroker singleton

**Public Classes:**
- CapabilityDomain (enum)
- Operation (enum)
- CapabilityPath
- Ownership
- SemanticCapability
- SemanticCapabilityBroker
- CapabilityPathBuilder
- SemanticCapabilityBuilder

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (Ownership, CapabilityPathBuilder)
- Should expose only SemanticCapabilityBroker
- Enums should be public (for configuration)
- CapabilityPath should be public (for capability specification)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep SemanticCapabilityBroker as public interface
- Keep CapabilityDomain, Operation enums as public
- Keep CapabilityPath as public (for capability specification)
- Hide Ownership as internal
- Hide CapabilityPathBuilder, SemanticCapabilityBuilder as internal
- Expose get_semantic_capability_broker() singleton

---

### 7. Artifact API

**Location:** `runtime/artifacts/artifact_ontology.py`

**Public Functions:**
- `get_artifact_registry()` - Returns ArtifactRegistry singleton

**Public Classes:**
- ArtifactType (enum)
- ArtifactState (enum)
- ArtifactLineage
- ArtifactSignature
- ArtifactSchema
- ArtifactVerification
- ConstitutionalArtifact
- ArtifactRegistry
- ArtifactBuilder

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (ArtifactLineage, ArtifactSignature, ArtifactSchema, ArtifactVerification)
- Should expose only ArtifactRegistry, ConstitutionalArtifact
- Enums should be public (for configuration)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep ArtifactRegistry as public interface
- Keep ConstitutionalArtifact as public interface
- Keep ArtifactType, ArtifactState enums as public
- Hide ArtifactLineage, ArtifactSignature, ArtifactSchema, ArtifactVerification as internal
- Hide ArtifactBuilder as internal
- Expose get_artifact_registry() singleton

---

### 8. Hermes API

**Location:** `runtime/hermes/constitutional_citizen.py`

**Public Functions:**
- `get_hermes_citizen()` - Returns ConstitutionalCitizen singleton
- `get_lease_manager()` - Returns LeaseManager singleton

**Public Classes:**
- LeaseStatus (enum)
- EphemeralLease
- ConstitutionalCitizen
- LeaseManager

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (EphemeralLease, LeaseManager)
- Should expose only ConstitutionalCitizen
- LeaseStatus enum should be public (for configuration)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep ConstitutionalCitizen as public interface
- Keep LeaseStatus enum as public
- Hide EphemeralLease as internal
- Hide LeaseManager as internal
- Expose get_hermes_citizen() singleton

---

### 9. Constitutional Law API

**Location:** `constitution/laws.py`

**Public Functions:**
- `get_constitutional_guard()` - Returns ConstitutionalGuard singleton

**Public Classes:**
- Law (enum)
- LawViolation
- ConstitutionalGuard

**Analysis:**
- Appropriate public API
- Law enum should be public (for reference)
- LawViolation should be public (for error reporting)
- ConstitutionalGuard should be public (for enforcement)

**Recommendation:** **KEEP**

**Action:**
- Keep all classes as public
- Keep get_constitutional_guard() singleton

---

### 10. Architecture API

**Location:** `architecture/`

**Public Classes:**
- CanonicalIR
- CIRNode
- CIREdge
- CIRConstraint
- CanonicalEvent
- EventStore
- IRLoweringPass
- CIRValidator

**Analysis:**
- Too many public classes exposed
- Implementation details exposed (CIREdge, CIRConstraint, IRLoweringPass, CIRValidator)
- Should expose only CanonicalIR, CanonicalEvent, EventStore
- CIRNode should be public (for node specification)

**Recommendation:** **SIMPLIFY**

**Action:**
- Keep CanonicalIR as public interface
- Keep CIRNode as public interface (for node specification)
- Keep CanonicalEvent as public interface
- Keep EventStore as public interface
- Hide CIREdge, CIRConstraint as internal
- Hide IRLoweringPass, CIRValidator as internal

---

## Public API Summary

| Module | Current Public Classes | Recommended Public Classes | Reduction |
|--------|---------------------|---------------------------|----------|
| Planning | 10 | 2 | 80% |
| Compiler | 12 | 2 | 83% |
| Scheduler | 8 | 3 | 63% |
| Verification | 7 | 3 | 57% |
| Evidence | 7 | 3 | 57% |
| Security | 8 | 4 | 50% |
| Artifact | 9 | 4 | 56% |
| Hermes | 4 | 2 | 50% |
| Laws | 3 | 3 | 0% |
| Architecture | 7 | 4 | 43% |

**Total Reduction:** 75 classes → 30 classes (60% reduction)

---

## Deprecation Recommendations

### High Priority Deprecations

1. **Deprecate get_hierarchy_store()**
   - Legacy hierarchy store
   - Replaced by StrategyHierarchy
   - Mark as deprecated

2. **Deprecate HierarchyStore**
   - Legacy hierarchy implementation
   - Replaced by StrategyHierarchy
   - Mark as deprecated

3. **Deprecate Objective, ObjectiveRevision, Mission, Task**
   - Legacy planning constructs
   - Replaced by TransientObjective
   - Mark as deprecated

### Medium Priority Deprecations

4. **Deprecate individual compiler stage classes**
   - FrontendStage, IRNormalizationStage, etc.
   - Should be internal implementation details
   - Mark as deprecated

5. **Deprecate ScheduledTask**
   - Internal scheduling detail
   - Should not be public
   - Mark as deprecated

6. **Deprecate VerificationTask, VerificationResult**
   - Internal verification details
   - Should not be public
   - Mark as deprecated

7. **Deprecate EvidenceRequirement, EvidencePlan**
   - Internal evidence details
   - Should not be public
   - Mark as deprecated

---

## Public API Principles

### Principle 1: Expose Only Constitutional Interfaces
- Expose only subsystem interfaces (ConstitutionalCompiler, ConstitutionalScheduler, etc.)
- Hide implementation details (stage classes, task classes, etc.)
- Expose only constitutional abstractions (Intent, Strategy, etc.)

### Principle 2: Expose Enums for Configuration
- Expose enums for configuration (SchedulingPriority, VerificationMethod, etc.)
- Enums are constitutional configuration
- Hide enum implementations

### Principle 3: Expose Singletons for Access
- Expose singleton getter functions (get_constitutional_compiler(), etc.)
- Hide singleton instances
- Provide controlled access

### Principle 4: Hide Implementation Details
- Hide internal data structures (ScheduledTask, VerificationTask, etc.)
- Hide internal builders (CapabilityPathBuilder, ArtifactBuilder, etc.)
- Hide internal helpers (IRLoweringPass, CIRValidator, etc.)

### Principle 5: Deprecate Legacy APIs
- Deprecate legacy APIs (HierarchyStore, Objective, etc.)
- Provide migration path
- Remove after validation period

---

## Recommendations

### Critical Actions

1. **Simplify Planning API**
   - Keep Intent, Strategy as constitutional interfaces
   - Hide Objective, ObjectiveRevision, Mission, Task as internal
   - Hide HierarchyStore as internal
   - Deprecate get_hierarchy_store()

2. **Simplify Compiler API**
   - Keep ConstitutionalCompiler as public interface
   - Hide individual stage classes as internal
   - Expose get_constitutional_compiler() singleton

3. **Simplify Scheduler API**
   - Keep ConstitutionalScheduler as public interface
   - Hide ScheduledTask, ResourceRequirement as internal
   - Expose get_constitutional_scheduler() singleton

### High Priority Actions

4. **Simplify Verification API**
   - Keep IndependentVerifier as public interface
   - Hide VerificationTask, VerificationResult as internal
   - Expose get_independent_verifier() singleton

5. **Simplify Evidence API**
   - Keep EvidenceCompiler as public interface
   - Hide EvidenceRequirement, EvidencePlan as internal
   - Hide EvidenceExecutor as internal
   - Expose get_evidence_compiler() singleton

6. **Simplify Security API**
   - Keep SemanticCapabilityBroker as public interface
   - Hide Ownership, CapabilityPathBuilder as internal
   - Expose get_semantic_capability_broker() singleton

### Medium Priority Actions

7. **Simplify Artifact API**
   - Keep ArtifactRegistry, ConstitutionalArtifact as public interfaces
   - Hide ArtifactLineage, ArtifactSignature as internal
   - Expose get_artifact_registry() singleton

8. **Simplify Hermes API**
   - Keep ConstitutionalCitizen as public interface
   - Hide EphemeralLease, LeaseManager as internal
   - Expose get_hermes_citizen() singleton

9. **Simplify Architecture API**
   - Keep CanonicalIR, CIRNode, CanonicalEvent, EventStore as public interfaces
   - Hide CIREdge, CIRConstraint, IRLoweringPass as internal

---

## Conclusion

The Constitutional Runtime 2.1 has a large public API surface area with many implementation details exposed. The public API can be reduced by 60% by hiding implementation details and exposing only constitutional interfaces.

**Key Findings:**
- 75 public classes currently exposed
- 30 public classes recommended (60% reduction)
- Many implementation details exposed (stage classes, task classes, etc.)
- Legacy APIs exposed (HierarchyStore, Objective, etc.)

**Impact:**
- Large public API surface area
- Implementation details exposed
- Hard to maintain backwards compatibility
- Architectural entropy increases

**Recommendations:**
1. Simplify Planning API (80% reduction)
2. Simplify Compiler API (83% reduction)
3. Simplify Scheduler API (63% reduction)
4. Simplify Verification API (57% reduction)
5. Simplify Evidence API (57% reduction)
6. Simplify Security API (50% reduction)
7. Simplify Artifact API (56% reduction)
8. Simplify Hermes API (50% reduction)
9. Simplify Architecture API (43% reduction)
10. Deprecate legacy APIs

**Next Steps:**
1. Mark implementation details as internal (prefix with _)
2. Deprecate legacy APIs with warnings
3. Add migration documentation
4. Update public API documentation
5. Remove deprecated APIs after validation period
