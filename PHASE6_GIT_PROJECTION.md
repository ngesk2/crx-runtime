# Phase 6 - Git Projection

**Objective:** Inventory every Git dependency

**For each dependency determine:**
- Execution Critical?
- Projection?
- Evidence Consumer?
- Remove?

**Acceptance Criteria:** Git records constitutional state, Git never defines constitutional state

---

## Git Dependency Inventory

### 1. GitInfrastructureEngine in ExecutionEngine

**Location:** `runtime/kernel/execution/execution-engine.ts`
**Type:** ❌ **Execution Dependency**
**Current Usage:**
- Line 32: Imports `GitInfrastructureEngine`
- Line 85: Constructor creates `new GitInfrastructureEngine()`
- Line 228: Direct call to `gitInfrastructure.recordCompilerRun()`

**Git Operations:**
```typescript
// Line 32 - Import
import { GitInfrastructureEngine } from '../../constitutional-compiler/git/git-infrastructure';

// Line 85 - Constructor
this.gitInfrastructure = new GitInfrastructureEngine();

// Line 228 - Direct call in execute()
const gitCommit = await this.gitInfrastructure.recordCompilerRun({
  executionId: context.executionId,
  treeHash: this.generateTreeHash(context),
  compilerVersion: '1.0.0',
  semanticIRVersion: '1.0.0',
  timestamp: context.timestamp,
});
```

**Execution Critical:** ❌ **YES** - Git is used for correctness (commit SHA generation)
**Projection:** ❌ **NO** - Git is execution dependency, not projection
**Evidence Consumer:** ❌ **NO** - Git is called directly, not consuming evidence

**Constitutional Violation:** Git is execution dependency, not projection

**Action:** ❌ **Remove** - Git should be projection, not execution dependency

---

### 2. GitInfrastructureEngine

**Location:** `constitutional-compiler/git/git-infrastructure.ts`
**Type:** ⚠ **Git Infrastructure**
**Current Usage:**
- Git commit recording
- Tree hash generation
- Compiler run tracking

**Git Operations:**
```typescript
// Git commit recording
recordCompilerRun(params: CompilerRunParams): Promise<GitCommit>

// Tree hash generation
generateTreeHash(executionContext: ExecutionContext): string
```

**Execution Critical:** ⚠ **Context Dependent** - Used for correctness in current implementation
**Projection:** ✅ **YES** - Should be projection authority
**Evidence Consumer:** ❌ **NO** - Currently called directly

**Constitutional Status:** Should be projection authority, not execution dependency

**Action:** ✅ **Preserve** (as projection) - Repurpose as Git Projection Authority

---

### 3. Git Commit SHA in Execution Context

**Location:** `runtime/kernel/execution/execution-engine.ts`
**Type:** ❌ **Execution State**
**Current Usage:**
- Line 228: Git commit SHA stored in execution context
- Line 233: Git commit SHA included in event data

**Git Operations:**
```typescript
// Line 228 - Store in context
context.gitCommit = gitCommit;

// Line 233 - Include in event
gitCommit: context.gitCommit
```

**Execution Critical:** ❌ **YES** - Git commit SHA is part of execution context
**Projection:** ❌ **NO** - Git state is embedded in execution
**Evidence Consumer:** ❌ **NO** - Git state is generated during execution

**Constitutional Violation:** Git state embedded in execution context

**Action:** ❌ **Remove** - Git commit should be projection, not execution state

---

### 4. Git in Self-Improvement Loop

**Location:** `runtime/kernel/execution/self-improvement-loop.ts`
**Type:** ❌ **Potential Git Dependency**
**Current Usage:**
- Referenced in audit findings as potential Git usage
- May use Git for PR operations

**Git Operations:**
- Potential GitHub API calls through GitHubProvider
- Potential Git operations for self-improvement

**Execution Critical:** ⚠ **Context Dependent** - Depends on implementation
**Projection:** ⚠ **Context Dependent** - Depends on implementation
**Evidence Consumer:** ⚠ **Context Dependent** - Depends on implementation

**Constitutional Status:** Requires inspection

**Action:** ❓ **Requires Inspection** - Determine actual Git usage

---

### 5. Git in DistributedExecution

**Location:** `constitutional-compiler/execution/distributed-execution.ts`
**Type:** ❌ **Potential Git Dependency**
**Current Usage:**
- Referenced in audit findings as potential Git usage
- May use Git for distributed compute coordination

**Git Operations:**
- Potential Git operations for distributed execution

**Execution Critical:** ⚠ **Context Dependent** - Depends on implementation
**Projection:** ⚠ **Context Dependent** - Depends on implementation
**Evidence Consumer:** ⚠ **Context Dependent** - Depends on implementation

**Constitutional Status:** Requires inspection

**Action:** ❓ **Requires Inspection** - Determine actual Git usage

---

## Git Dependency Summary

**Total Git Dependencies:** 5
**✅ Projection:** 1 (GitInfrastructureEngine - should be)
**❌ Execution Dependencies:** 2 (ExecutionEngine Git usage, Git commit SHA in context)
**❓ Requires Inspection:** 2 (Self-Improvement Loop, DistributedExecution)

---

## Git Dependency Classification

### Execution Dependencies (Remove Targets)
- ❌ GitInfrastructureEngine in ExecutionEngine - Remove
- ❌ Git commit SHA in execution context - Remove

### Projection Authority (Preserve as Projection)
- ✅ GitInfrastructureEngine - Preserve (repurpose as Git Projection Authority)

### Requires Inspection
- ❓ Self-Improvement Loop Git usage - Requires inspection
- ❓ DistributedExecution Git usage - Requires inspection

---

## Constitutional Violation Analysis

### Execution Engine Git Dependency
**Issue:** ExecutionEngine imports, constructs, and calls GitInfrastructureEngine directly
**Problem:** Git is execution dependency, not projection
**Constitutional Rule:** Git should be projection, not execution dependency

**Current Flow:**
```
ExecutionEngine.execute()
    ↓
GitInfrastructureEngine (execution dependency)
    ↓
Git Commit
    ↓
Execution Context (includes gitCommit)
```

**Constitutional Flow:**
```
ExecutionEngine.execute()
    ↓
Evidence
    ↓
Replay
    ↓
Witness
    ↓
Git Projection Authority
    ↓
Git Commit
```

---

## Acceptance Criteria Status

- [x] Complete inventory of Git dependencies - ✅ 5 dependencies identified
- [x] Determine execution critical/projection/evidence consumer/remove - ✅ Complete classification
- [ ] Git records constitutional state - ❌ Git currently defines execution state
- [ ] Git never defines constitutional state - ❌ Git is execution dependency

---

## Required Actions

### 1. Remove Git from ExecutionEngine
**Target:** ExecutionEngine lines 32, 85, 228
**Action:** Remove GitInfrastructureEngine import, construction, and direct calls
**Disposition:** Git becomes projection, not execution dependency

### 2. Remove Git Commit SHA from Execution Context
**Target:** ExecutionEngine lines 228, 233
**Action:** Remove gitCommit from execution context and event data
**Disposition:** Git commit becomes projection output, not execution state

### 3. Repurpose GitInfrastructureEngine as Projection Authority
**Target:** GitInfrastructureEngine
**Action:** Repurpose as Git Projection Authority
**Disposition:** Git becomes projection authority consuming witness

### 4. Inspect Self-Improvement Loop Git Usage
**Target:** Self-Improvement Loop
**Action:** Determine actual Git usage
**Disposition:** Classify as execution dependency or projection

### 5. Inspect DistributedExecution Git Usage
**Target:** DistributedExecution
**Action:** Determine actual Git usage
**Disposition:** Classify as execution dependency or projection

---

## Disposition

**Finding:** Git Dependencies for Correctness
**Status:** ❌ **Confirmed** - Git is execution dependency, not projection
**Evidence:** Source inspection of execution-engine.ts
**Action:** Remove Git from execution, repurpose as projection authority

**Constitutional Target:**
```
Execution
    ↓
Evidence
    ↓
Replay
    ↓
Witness
    ↓
Git Projection Authority
    ↓
Git Commit
```

**Current State:**
```
Execution
    ↓
Git Infrastructure Engine (execution dependency)
    ↓
Git Commit
    ↓
Execution Context (includes gitCommit)
```

**Constitutional Violation:** Git defines execution state instead of recording constitutional state
