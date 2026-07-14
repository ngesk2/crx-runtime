# Constitutional Runtime 2.1 - Compatibility Layer Plan

## Overview

This document outlines the compatibility layer plan for Constitutional Runtime 2.1. The goal is to ensure backwards compatibility while introducing new architectural improvements.

**Key Principle:** Always preserve backwards compatibility where practical. If something becomes internal, create an adapter instead of deleting it. Old APIs may delegate to new implementations. Nothing should disappear without first becoming an implementation detail.

---

## Compatibility Layers

### 1. Objective Compatibility Layer

**Status:** ✅ Implemented

**Location:** `runtime/planning/transient_objectives.py`

**Purpose:** Convert between legacy Objective and TransientObjective

**Adapter:** `ObjectiveAdapter`

**Methods:**
- `from_legacy_objective()`: Convert legacy Objective to TransientObjective
- `to_legacy_objective()`: Convert TransientObjective to legacy Objective

**Implementation:**
```python
class ObjectiveAdapter:
    @staticmethod
    def from_legacy_objective(legacy_objective) -> TransientObjective:
        # Convert legacy Objective to TransientObjective
        # Preserve all data
        # Mark as persisted for audit
    
    @staticmethod
    def to_legacy_objective(transient_objective: TransientObjective):
        # Convert TransientObjective to legacy Objective
        # Preserve all data
        # Maintain compatibility with existing code
```

**Backwards Compatibility:**
- Legacy Objective implementation preserved in `runtime/planning/hierarchy.py`
- Adapter transparently converts between formats
- Existing code continues to use legacy Objective
- New code can use TransientObjective
- Gradual migration path available

**Deprecation Path:**
1. Phase 1: Adapter implemented (✅ Complete)
2. Phase 2: New code uses TransientObjective
3. Phase 3: Existing code gradually migrated
4. Phase 4: Legacy Objective deprecated with warnings
5. Phase 5: Legacy Objective removed after validation

---

### 2. Planning IR Compatibility Layer

**Status:** ✅ Implemented

**Location:** `architecture/ir_lowering.py`

**Purpose:** Maintain existing Planning IR interface while using CIR internally

**Adapter:** `IRLoweringPass`

**Implementation:**
```python
class IRLoweringPass:
    def lower(self, planning_ir: PlanningIR) -> CanonicalIR:
        # Lower Planning IR to Canonical IR
        # Preserve all information
        # Add CIR-specific metadata
        # Validate output
```

**Backwards Compatibility:**
- Planning IR continues to be public API
- IR lowering happens transparently
- No changes to existing Planning IR generation
- No changes to existing Planning IR consumption
- CIR is internal implementation detail

**Deprecation Path:**
1. Phase 1: IR lowering implemented (✅ Complete)
2. Phase 2: CIR used internally
3. Phase 3: Direct CIR API exposed for advanced users
4. Phase 4: Planning IR deprecated with warnings
5. Phase 5: Planning IR removed after validation

---

### 3. Capability Authorization Compatibility Layer

**Status:** ⏳ Pending

**Location:** `runtime/security/capability_authorization_adapter.py` (to be created)

**Purpose:** Bridge string-based authorization with semantic graph proofs

**Adapter:** `CapabilityAuthorizationAdapter`

**Implementation:**
```python
class CapabilityAuthorizationAdapter:
    def __init__(self, use_semantic: bool = False):
        self.use_semantic = use_semantic
        self.string_authorizer = StringAuthorizer()
        self.semantic_authorizer = SemanticAuthorizer()
    
    def authorize(self, capability: str, context: Dict) -> bool:
        if self.use_semantic:
            return self.semantic_authorizer.authorize(capability, context)
        else:
            return self.string_authorizer.authorize(capability, context)
    
    def validate_authorization(self, capability: str, context: Dict) -> tuple[bool, str]:
        # Try semantic first
        semantic_result = self.semantic_authorizer.authorize(capability, context)
        string_result = self.string_authorizer.authorize(capability, context)
        
        # Log discrepancies
        if semantic_result != string_result:
            self._log_discrepancy(capability, semantic_result, string_result)
        
        # Return semantic result if enabled
        if self.use_semantic:
            return semantic_result, "semantic"
        else:
            return string_result, "string"
```

**Backwards Compatibility:**
- String-based authorization continues to work
- Semantic authorization runs in parallel
- Gradual migration to semantic proofs
- Feature flag controls which method to use

**Deprecation Path:**
1. Phase 1: Adapter implemented
2. Phase 2: Semantic authorization implemented
3. Phase 3: Parallel validation enabled
4. Phase 4: Semantic authorization enabled by feature flag
5. Phase 5: String-based authorization deprecated
6. Phase 6: String-based authorization removed after validation

---

### 4. State Projection Compatibility Layer

**Status:** ⏳ Pending

**Location:** `architecture/projections/state_projection_adapter.py` (to be created)

**Purpose:** Convert existing mutable state to event-sourced projections

**Adapter:** `StateProjectionAdapter`

**Implementation:**
```python
class StateProjectionAdapter:
    def __init__(self, use_projections: bool = False):
        self.use_projections = use_projections
        self.mutator = StateMutator()
        self.projection_updater = ProjectionUpdater()
    
    def update_state(self, state_id: str, changes: Dict) -> None:
        if self.use_projections:
            # Emit event
            event = self._create_state_change_event(state_id, changes)
            event_store.append(event)
        else:
            # Direct mutation
            self.mutator.mutate(state_id, changes)
    
    def get_state(self, state_id: str) -> Dict:
        if self.use_projections:
            # Read from projection
            return self.projection_updater.get_projection(state_id)
        else:
            # Read from mutable state
            return self.mutator.get_state(state_id)
    
    def migrate_to_projections(self) -> None:
        # Migrate existing state to events
        # Validate event replay produces same state
        # Switch to projection mode
        pass
```

**Backwards Compatibility:**
- Existing state mutations continue to work
- Event emission runs in parallel
- Projections updated from events
- Gradual migration to event-driven state

**Deprecation Path:**
1. Phase 1: Adapter implemented
2. Phase 2: Event emission integrated
3. Phase 3: Projections implemented
4. Phase 4: Parallel state updates enabled
5. Phase 5: Projections enabled by feature flag
6. Phase 6: Direct state mutations deprecated
7. Phase 7: Direct state mutations removed after validation

---

### 5. Compiler Pass Compatibility Layer

**Status:** ✅ Implemented

**Location:** `runtime/planning/compiler_stages.py`

**Purpose:** Expose high-level stages while preserving pass-level access

**Adapter:** `ConstitutionalCompiler`

**Implementation:**
```python
class ConstitutionalCompiler:
    def __init__(self, pass_pipeline: PassPipeline):
        self.pass_pipeline = pass_pipeline  # Pass pipeline still accessible
        self._stages = []  # High-level stages
    
    def compile(self, planning_ir: PlanningIR) -> CompilationResult:
        # Use high-level stages
        # Pass pipeline used internally
        # Both interfaces available
```

**Backwards Compatibility:**
- Existing optimization passes preserved
- Pass pipeline still accessible
- Stage abstraction is additive
- Both interfaces available

**Deprecation Path:**
1. Phase 1: Compiler stages implemented (✅ Complete)
2. Phase 2: Stages used by default
3. Phase 3: Pass pipeline access deprecated with warnings
4. Phase 4: Pass pipeline access removed after validation

---

### 6. Skill Registry Compatibility Layer

**Status:** ✅ Implemented

**Location:** `runtime/skills/skill_classification.py`

**Purpose:** Classify skills while preserving existing registry

**Adapter:** `ClassifiedSkillRegistry`

**Implementation:**
```python
class ClassifiedSkillRegistry:
    def __init__(self, classifier: SkillClassifier):
        self.classifier = classifier
        self.skill_registry = get_skill_registry()  # Original registry preserved
    
    def register_skill(self, skill: SkillDefinition):
        # Register in original registry
        self.skill_registry.register(skill)
        # Classify
        self.classifier.classify_skill(skill)
```

**Backwards Compatibility:**
- Existing skill registry preserved
- Classification is additive
- Skills continue to work as before
- Both interfaces available

**Deprecation Path:**
1. Phase 1: Skill classification implemented (✅ Complete)
2. Phase 2: Classification enabled by default
3. Phase 3: Unclassified skill access deprecated
4. Phase 4: Unclassified skill access removed after validation

---

### 7. Schema Version Compatibility Layer

**Status:** ✅ Implemented

**Location:** `architecture/schema_versioning.py`

**Purpose:** Support multiple schema versions with automatic migration

**Adapter:** `SchemaMigrator`

**Implementation:**
```python
class SchemaMigrator:
    def migrate(self, schema_type, data, from_version, to_version):
        # Find migration path
        # Execute migrations
        # Return migrated data
```

**Backwards Compatibility:**
- Old schema versions supported
- Automatic migration to latest
- No breaking changes
- Deprecation warnings for old versions

**Deprecation Path:**
1. Phase 1: Schema versioning implemented (✅ Complete)
2. Phase 2: All schemas versioned
3. Phase 3: Old versions deprecated with warnings
4. Phase 4: Old versions removed after validation

---

## Feature Flags

### Implementation

```python
class FeatureFlags:
    # Planning Layer
    USE_TRANSIENT_OBJECTIVES = True
    USE_OBJECTIVE_COMPILER = True
    
    # Compiler
    USE_COMPILER_STAGES = True
    USE_CIR = True
    
    # Skills
    USE_SKILL_CLASSIFICATION = True
    
    # Capability Authorization
    USE_SEMANTIC_AUTHORIZATION = False  # Pending
    
    # Event Sourcing
    USE_EVENT_SOURCING = False  # Pending
    USE_PROJECTIONS = False  # Pending
    
    # Distributed Runtime
    USE_ARTIFACT_COMMUNICATION = False  # Pending
    USE_EVENT_COMMUNICATION = False  # Pending
```

### Usage

```python
if FeatureFlags.USE_TRANSIENT_OBJECTIVES:
    # Use new transient objectives
    objective = TransientObjective(...)
else:
    # Use legacy objectives
    objective = Objective(...)
```

### Rollback

Set feature flag to `False` to rollback to old behavior.

---

## Adapter Pattern

### Generic Adapter Interface

```python
class CompatibilityAdapter[T, U]:
    """
    Generic adapter for converting between types T and U.
    """
    
    def to_new(self, old: T) -> U:
        """Convert old type to new type."""
        raise NotImplementedError
    
    def to_old(self, new: U) -> T:
        """Convert new type to old type."""
        raise NotImplementedError
    
    def is_compatible(self, old: T) -> bool:
        """Check if old type is compatible."""
        raise NotImplementedError
```

### Example Implementation

```python
class ObjectiveAdapter(CompatibilityAdapter[Objective, TransientObjective]):
    def to_new(self, old: Objective) -> TransientObjective:
        return self.from_legacy_objective(old)
    
    def to_old(self, new: TransientObjective) -> Objective:
        return self.to_legacy_objective(new)
    
    def is_compatible(self, old: Objective) -> bool:
        return True  # All objectives are compatible
```

---

## Testing Strategy

### Adapter Testing

1. **Round-trip testing:** Convert old → new → old, verify equivalence
2. **Data preservation:** Ensure all data preserved during conversion
3. **Behavior preservation:** Ensure behavior unchanged
4. **Performance testing:** Ensure adapter performance acceptable

### Feature Flag Testing

1. **Flag toggling:** Test enabling/disabling flags
2. **Rollback testing:** Test rollback via flag
3. **Integration testing:** Test flags in production-like environment

### Compatibility Testing

1. **Old API testing:** Test old APIs still work
2. **New API testing:** Test new APIs work correctly
3. **Mixed usage testing:** Test old and new APIs used together
4. **Migration testing:** Test migration path works

---

## Deprecation Policy

### Deprecation Timeline

1. **Announcement:** Deprecation announced with warning
2. **Grace Period:** 3-6 months grace period
3. **Warning Period:** Warnings in logs and documentation
4. **Removal:** Removal after validation and grace period

### Deprecation Process

1. Add deprecation warning to old API
2. Update documentation
3. Communicate deprecation to users
4. Monitor usage of deprecated API
5. Remove after grace period

### Deprecation Example

```python
def legacy_function():
    import warnings
    warnings.warn(
        "legacy_function is deprecated, use new_function instead",
        DeprecationWarning,
        stacklevel=2
    )
    # Legacy implementation
```

---

## Monitoring

### Metrics

- Feature flag usage
- Adapter usage
- Old API usage
- New API usage
- Migration progress
- Error rates

### Alerts

- High old API usage after deprecation
- Adapter errors
- Feature flag errors
- Migration failures

---

## Documentation

### User Documentation

- Migration guides for each adapter
- Feature flag documentation
- Deprecation notices
- Backwards compatibility guarantees

### Developer Documentation

- Adapter implementation details
- Feature flag usage
- Testing procedures
- Rollback procedures

---

## Rollback Procedures

### Feature Flag Rollback

1. Set feature flag to `False`
2. Restart affected subsystems
3. Verify functionality
4. Monitor for issues

### Adapter Rollback

1. Disable adapter
2. Use old implementation directly
3. Verify functionality
4. Monitor for issues

### Full Rollback

1. Disable all feature flags
2. Use all old implementations
3. Verify functionality
4. Monitor for issues

---

## Success Criteria

### Compatibility Layer Success

Each compatibility layer is successful when:

1. Adapter preserves all data
2. Adapter preserves all behavior
3. Performance acceptable
4. Tests passing
5. Documentation complete
6. Rollback procedure tested

### Overall Success

Compatibility layer is successful when:

1. All adapters implemented
2. All feature flags implemented
3. All tests passing
4. No breaking changes
5. Documentation complete
6. Rollback procedures tested

---

## Conclusion

The compatibility layer plan ensures backwards compatibility while introducing new architectural improvements. Adapters provide gradual migration paths, feature flags enable rollback, and deprecation policies provide clear timelines. All changes maintain backwards compatibility through adapters and gradual migration paths.
