# Phase 5 - Provider Sovereignty

**Objective:** Inventory provider construction

**Classification:**
- new Provider()
- ProviderRegistry
- dynamic resolution
- tests

**Acceptance Criteria:** Production code resolves providers only through the registry

---

## Provider Construction Inventory

### 1. ProviderRegistry

**Location:** `runtime/kernel/providers/provider-registry.ts`
**Type:** ✅ **Canonical Provider Authority**
**Authority Owner:** ProviderRegistry (Constitutional Authority)
**Current Usage:**
- Dynamic provider registration
- Provider filtering by type and trait
- Provider resolution by requirements

**Operations:**
```typescript
// Provider registration
register(provider: IProvider): void

// Provider resolution
resolve(requirements: ProviderRequirements): IProvider

// Provider filtering
filterByType(type: ProviderType): IProvider[]
filterByTrait(trait: ProviderTrait): IProvider[]
```

**Constitutional Status:** ✅ This is the intended canonical provider authority

**Action:** ✅ **Preserve** - This is the intended provider resolution mechanism

---

### 2. GitHubProvider Direct Construction (Test Files)

**Location:** Test files
**Type:** ⚠ **Test Direct Construction**
**Authority Owner:** Test Code

**Instances:**

**execution-engine-test.ts line 37:**
```typescript
const gitHubProvider = new GitHubProvider();
providerRegistry.register(gitHubProvider);
```

**github-spine-test.ts line 38:**
```typescript
const gitHubProvider = new GitHubProvider();
eventBus.setGitHubProvider(gitHubProvider);
```

**Constitutional Status:** ⚠ **Acceptable in tests** but should use ProviderRegistry pattern

**Action:** ⚠ **Preserve** (test-only) - Should demonstrate ProviderRegistry pattern

---

### 3. GitHubProvider Direct Construction (Self-Improvement Loop)

**Location:** `runtime/kernel/execution/self-improvement-loop.ts`
**Type:** ❌ **Production Direct Construction**
**Authority Owner:** SelfImprovementLoop (Not ProviderRegistry)

**Instance:**
```typescript
// Constructor receives GitHubProvider directly
constructor(
  private executionEngine: ExecutionEngine,
  private gitHubProvider: GitHubProvider,
  private knowledgeAuthority: IKnowledgeAuthority
)
```

**Constitutional Violation:** Self-improvement loop receives provider directly, not through registry

**Action:** ❌ **Harvest** - Should resolve provider through ProviderRegistry

---

### 4. ReplayVerification Direct Construction

**Location:** `runtime/adapters/express_commit_adapter.ts` line 17
**Type:** ❌ **Production Direct Construction**
**Authority Owner:** ExpressCommitAdapter (Adapter)

**Instance:**
```typescript
constructor() {
  this.replayVerification = new ReplayVerification();
}
```

**Constitutional Violation:** Adapter constructs ReplayVerification directly

**Action:** ❌ **Harvest** - Should resolve through ProviderRegistry or DI container

---

### 5. ConfigAdapter Direct Construction

**Location:** Referenced in audit findings
**Type:** ❌ **Production Direct Construction**
**Authority Owner:** ConfigAdapter (Adapter)

**Instance:**
```typescript
// Direct instantiation (referenced in audit)
new ConfigAdapter()
```

**Constitutional Violation:** Adapter constructed directly

**Action:** ❌ **Harvest** - Should resolve through ProviderRegistry or DI container

---

### 6. Business Service Direct Construction

**Location:** Business services (referenced in audit findings)
**Type:** ❌ **Production Direct Construction**
**Authority Owner:** Business Services

**Instances:**
```typescript
// EventService direct instantiation
new EventService()

// IdentityService direct instantiation
new IdentityService()

// GraphService direct instantiation
new GraphService()

// ReplayService direct instantiation
new ReplayService()

// ArtifactService direct instantiation
new ArtifactService()

// PropertyService direct instantiation
new PropertyService()
```

**Constitutional Violation:** Business services constructed directly in tests

**Action:** ❌ **Harvest** - Should resolve through ProviderRegistry or DI container

---

### 7. DI Container Provider Construction

**Location:** `runtime/di_container.py`
**Type:** ✅ **Canonical DI Construction**
**Authority Owner:** RuntimeContainer (DI Container)

**Instance:**
```python
# Line 55 - CanonicalAuthority construction
canonical_authority = CanonicalAuthority()

# Line 64 - CapabilityRegistry construction
capability_registry = CapabilityRegistry()

# Line 68 - Oracle construction
oracle = Oracle()

# Line 71 - EvidenceCompiler construction
evidence_compiler = EvidenceCompiler()

# Line 74 - ProjectionStore construction
projection_store = ProjectionStore()

# Line 77 - PostgresEventReader construction
event_reader = PostgresEventReader()
```

**Constitutional Status:** ✅ This is the intended DI container pattern

**Action:** ✅ **Preserve** - This is the intended composition root

---

### 8. Runtime Bootstrap Provider Construction

**Location:** `runtime/bootstrap.py`
**Type:** ✅ **Canonical Bootstrap Construction**
**Authority Owner:** RuntimeBootstrap (Composition Root)

**Instance:**
```python
# RuntimeBootstrap wires all dependencies
# This is the intended composition root
```

**Constitutional Status:** ✅ This is the intended bootstrap pattern

**Action:** ✅ **Preserve** - This is the intended composition root

---

### 9. GitHubProvider.execute() Direct Calls

**Location:** Various locations (referenced in audit findings)
**Type:** ❌ **Direct Provider Execution**
**Authority Owner:** Provider (Not ExecutionEngine)

**Instances:**
- Direct calls to GitHubProvider.execute() bypassing ExecutionEngine
- Test files call provider.execute() directly
- Self-improvement loop calls provider through ExecutionEngine (correct)

**Constitutional Violation:** Direct provider execution bypasses constitutional spine

**Action:** ❌ **Harvest** - All provider execution must route through ExecutionEngine.execute()

---

## Provider Construction Summary

**Total Provider Construction Sources:** 9
**✅ Canonical:** 3 (ProviderRegistry, DI Container, Runtime Bootstrap)
**❌ Direct Construction:** 5 (Self-Improvement Loop, ReplayVerification, ConfigAdapter, Business Services, Direct Provider Execution)
**⚠ Test Construction:** 1 (Test files)

---

## Provider Construction Classification

### Canonical Provider Authority
- ✅ ProviderRegistry - Preserve
- ✅ RuntimeContainer (DI Container) - Preserve
- ✅ RuntimeBootstrap - Preserve

### Production Direct Construction (Harvest Targets)
- ❌ Self-Improvement Loop GitHubProvider - Harvest
- ❌ ReplayVerification - Harvest
- ❌ ConfigAdapter - Harvest
- ❌ Business Service direct construction - Harvest
- ❌ Direct provider execution calls - Harvest

### Test Direct Construction (Preserve with Registry Pattern)
- ⚠ Test file provider construction - Preserve (test-only, should demonstrate ProviderRegistry pattern)

---

## Constitutional Violation Analysis

### Self-Improvement Loop Violation
**Issue:** Constructor receives GitHubProvider directly
**Problem:** Bypasses ProviderRegistry for provider resolution
**Constitutional Rule:** All providers should resolve through ProviderRegistry

**Current Flow:**
```
SelfImprovementLoop
    ↓
GitHubProvider (direct)
    ↓
Provider execution
```

**Constitutional Flow:**
```
SelfImprovementLoop
    ↓
ProviderRegistry
    ↓
GitHubProvider (resolved)
    ↓
Provider execution
```

---

### Direct Provider Execution Violation
**Issue:** Direct calls to provider.execute() bypass ExecutionEngine
**Problem:** Execution spine bypassed
**Constitutional Rule:** All provider execution must route through ExecutionEngine.execute()

**Current Flow:**
```
Client
    ↓
Provider.execute() (direct)
    ↓
External API
```

**Constitutional Flow:**
```
Client
    ↓
ExecutionEngine.execute()
    ↓
ProviderRegistry
    ↓
Provider.execute()
    ↓
External API
```

---

## Acceptance Criteria Status

- [x] Complete inventory of provider construction - ✅ 9 construction sources identified
- [x] Classify as new Provider()/ProviderRegistry/dynamic resolution/tests - ✅ Complete classification
- [ ] Production code resolves providers only through registry - ❌ 5 direct construction violations

---

## Required Actions

### 1. Harvest Self-Improvement Loop Provider Construction
**Target:** SelfImprovementLoop constructor
**Action:** Resolve GitHubProvider through ProviderRegistry
**Disposition:** Self-improvement loop becomes ProviderRegistry client

### 2. Harvest ReplayVerification Construction
**Target:** ExpressCommitAdapter line 17
**Action:** Resolve ReplayVerification through ProviderRegistry or DI container
**Disposition:** Adapter becomes registry client

### 3. Harvest ConfigAdapter Construction
**Target:** ConfigAdapter instantiation
**Action:** Resolve through ProviderRegistry or DI container
**Disposition:** Adapter becomes registry client

### 4. Harvest Business Service Construction
**Target:** Business service direct instantiation
**Action:** Resolve through ProviderRegistry or DI container
**Disposition:** Services become registry clients

### 5. Harvest Direct Provider Execution
**Target:** Direct provider.execute() calls
**Action:** Route all provider execution through ExecutionEngine.execute()
**Disposition:** Providers become ExecutionEngine clients

### 6. Update Test Code
**Target:** Test files with direct provider construction
**Action:** Demonstrate ProviderRegistry pattern in tests
**Disposition:** Preserve test code but use registry pattern

---

## Disposition

**Finding:** Direct Provider Construction
**Status:** ❌ **Confirmed** - 5 direct construction violations exist
**Evidence:** Source inspection of self-improvement-loop.ts, express_commit_adapter.ts, business services
**Action:** Harvest all direct construction to ProviderRegistry

**Constitutional Target:**
```
Production Code
    ↓
ProviderRegistry
    ↓
Provider Resolution
    ↓
Provider Execution
```

**Current State:**
```
Production Code
    ↓
Direct Provider Construction (5 sources)
    ↓
Provider Execution
    ↓
Constitutional Fragmentation
```
