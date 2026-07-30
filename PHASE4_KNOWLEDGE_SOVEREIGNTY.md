# Phase 4 - Knowledge Sovereignty

**Objective:** Inventory every graph mutation

**Classification:**
- Direct graph writes
- Authority writes
- Test mutations

**Acceptance Criteria:** Execution never mutates graph state directly

---

## Graph Mutation Inventory

### 1. Execution Engine Direct Graph Writes

**Location:** `runtime/kernel/execution/execution-engine.ts`
**Type:** ❌ **Direct Graph Writes**
**Authority Owner:** ExecutionEngine (Not Knowledge Authority)
**Current Usage:**
- Line 157: `knowledgeAuthority.createEdge()`
- Line 197: `knowledgeAuthority.createNode()`

**Graph Operations:**
```typescript
// Line 157 - Direct edge creation
const edgeId = await this.knowledgeAuthority.createEdge({
  sourceId: context.executionId,
  targetId: context.evidenceIds[0],
  relation: 'produced',
});

// Line 197 - Direct node creation
const nodeId = await this.knowledgeAuthority.createNode({
  type: 'Execution',
  data: {
    executionId: context.executionId,
    actorId: context.actorId,
    providerId,
    operation,
    input,
    timestamp: context.timestamp,
  },
});
```

**Constitutional Violation:** Execution knows graph layout and directly mutates graph state

**Action:** ❌ **Harvest** - Execution should emit evidence only, Knowledge Authority consumes evidence

---

### 2. GraphService Direct Graph Writes

**Location:** `src/services/graph-service.ts`
**Type:** ❌ **Direct Graph Writes**
**Authority Owner:** GraphService (Business Service)
**Current Usage:**
- Direct node creation
- Direct edge creation
- Graph operations independent of Knowledge Authority

**Graph Operations:**
```typescript
// Direct node creation
createNode(type: string, data: unknown): Promise<Node>

// Direct edge creation
createEdge(sourceId: string, targetId: string, relation: string): Promise<Edge>

// Graph traversal
findPath(sourceId: string, targetId: string): Promise<Path>

// Graph operations
traverseGraph(startId: string): Promise<Node[]>
```

**Constitutional Violation:** Business service performing constitutional graph work

**Action:** ❌ **Harvest** - GraphService should become Knowledge Authority client

---

### 3. Test File Graph Mutations

**Location:** Test files
**Type:** ⚠ **Test Mutations**
**Authority Owner:** Test Code

**Instances:**

**spine-test.ts:**
```typescript
// Direct graph mutation in event data
graphMutation: {
  type: 'createNode',
  data: {
    type: 'Inspection',
    data: { propertyId: 'property-123', status: 'completed' }
  }
}
```

**github-spine-test.ts:**
```typescript
// Direct graph mutation in event data
graphMutation: {
  type: 'createNode',
  data: {
    type: 'PullRequest',
    data: { 
      prNumber: 123, 
      title: 'Add GitHub provider integration',
    }
  }
}
```

**Constitutional Status:** ⚠ **Acceptable in tests** but should use Knowledge Authority pattern

**Action:** ⚠ **Preserve** (test-only) - Should demonstrate Knowledge Authority pattern

---

### 4. Knowledge Authority Writes

**Location:** `runtime/kernel/knowledge/knowledge-authority-interface.ts`
**Type:** ✅ **Authority Writes**
**Authority Owner:** IKnowledgeAuthority (Constitutional Authority)
**Current Usage:**
- Canonical graph node creation
- Canonical graph edge creation
- Graph query operations

**Graph Operations:**
```typescript
// Canonical node creation
createNode(node: Node): Promise<string>

// Canonical edge creation
createEdge(edge: Edge): Promise<string>

// Graph queries
getNode(nodeId: string): Promise<Node | null>
getEdge(edgeId: string): Promise<Edge | null>
findPath(sourceId: string, targetId: string): Promise<Path>
```

**Constitutional Status:** ✅ Correct ownership - Constitutional authority for graph operations

**Action:** ✅ **Preserve** - This is the intended constitutional graph authority

---

### 5. ProjectionStore Graph Mutations

**Location:** `runtime/event_sourcing/projections.py`
**Type:** ❌ **Direct Graph Writes**
**Authority Owner:** ProjectionStore (Event Sourcing)
**Current Usage:**
- Event projection updates
- State reconstruction
- Graph mutation through projections

**Graph Operations:**
```python
# Projection updates
def update_projection(event: Event) -> None:
    # Mutates projection state
    # Can include graph structure
```

**Constitutional Violation:** Event-sourcing system performing constitutional graph work

**Action:** ❌ **Harvest** - Should use Knowledge Authority for graph operations

---

### 6. Self-Improvement Loop Graph Writes

**Location:** `runtime/kernel/execution/self-improvement-loop.ts`
**Type:** ❌ **Direct Graph Writes**
**Authority Owner:** SelfImprovementLoop (Not Knowledge Authority)
**Current Usage:**
```typescript
// Line 405-415 - Direct node creation
await this.knowledgeAuthority.createNode({
  type: 'Issue',
  data: {
    issueNumber: state.issueNumber,
    executionId: state.executionId,
    stage: state.stage,
    timestamp: new Date().toISOString(),
  },
});

// Line 505-515 - Direct node creation
await this.knowledgeAuthority.createNode({
  type: 'SelfImprovementComplete',
  data: {
    issueNumber: state.issueNumber,
    executionId: state.executionId,
    stage: state.stage,
    timestamp: new Date().toISOString(),
    success: !state.error,
  },
});
```

**Constitutional Violation:** Self-improvement loop directly mutates graph state

**Action:** ❌ **Harvest** - Should emit evidence, Knowledge Authority handles graph mutations

---

## Graph Mutation Summary

**Total Graph Mutation Sources:** 6
**✅ Authority Writes:** 1 (IKnowledgeAuthority)
**❌ Direct Graph Writes:** 4 (ExecutionEngine, GraphService, ProjectionStore, SelfImprovementLoop)
**⚠ Test Mutations:** 2 (spine-test.ts, github-spine-test.ts)

---

## Graph Mutation Classification

### Constitutional Graph Authority
- ✅ IKnowledgeAuthority - Preserve

### Direct Graph Writes (Harvest Targets)
- ❌ ExecutionEngine direct graph writes - Harvest
- ❌ GraphService direct graph writes - Harvest
- ❌ ProjectionStore graph mutations - Harvest
- ❌ SelfImprovementLoop graph writes - Harvest

### Test Mutations (Preserve with Authority Pattern)
- ⚠ Test file graph mutations - Preserve (test-only, should demonstrate Knowledge Authority pattern)

---

## Constitutional Violation Analysis

### Execution Engine Violation
**Issue:** ExecutionEngine directly calls `knowledgeAuthority.createNode()` and `knowledgeAuthority.createEdge()`
**Problem:** Execution knows graph layout (what nodes/edges to create)
**Constitutional Rule:** Execution should emit evidence only, Knowledge Authority consumes evidence

**Current Flow:**
```
ExecutionEngine.execute()
    ↓
Direct graph mutation (createNode, createEdge)
    ↓
Knowledge Authority
```

**Constitutional Flow:**
```
ExecutionEngine.execute()
    ↓
Emit evidence
    ↓
Knowledge Authority
    ↓
Graph mutation from evidence
```

---

## Acceptance Criteria Status

- [x] Complete inventory of graph mutations - ✅ 6 mutation sources identified
- [x] Classify as direct/authority/test - ✅ Complete classification
- [ ] Execution never mutates graph state directly - ❌ 4 direct graph write violations

---

## Required Actions

### 1. Harvest Execution Engine Graph Writes
**Target:** ExecutionEngine lines 157, 197
**Action:** Remove direct graph mutation calls
**Disposition:** Execution emits evidence only, Knowledge Authority handles graph mutations

### 2. Harvest GraphService
**Target:** GraphService graph operations
**Action:** Route all graph operations through Knowledge Authority
**Disposition:** GraphService becomes Knowledge Authority client

### 3. Harvest ProjectionStore
**Target:** ProjectionStore graph mutations
**Action:** Use Knowledge Authority for graph operations
**Disposition:** ProjectionStore becomes Knowledge Authority client

### 4. Harvest Self-Improvement Loop
**Target:** SelfImprovementLoop lines 405-415, 505-515
**Action:** Remove direct graph mutation calls
**Disposition:** Self-improvement loop emits evidence only

### 5. Update Test Code
**Target:** Test files with direct graph mutations
**Action:** Demonstrate Knowledge Authority pattern in tests
**Disposition:** Preserve test code but use authority pattern

---

## Disposition

**Finding:** Graph Writes Outside Knowledge Authority
**Status:** ❌ **Confirmed** - 4 direct graph write violations exist
**Evidence:** Source inspection of execution-engine.ts, graph-service.ts, projections.py, self-improvement-loop.ts
**Action:** Harvest all direct graph writes to Knowledge Authority

**Constitutional Target:**
```
Execution
    ↓
Evidence
    ↓
Knowledge Indexer
    ↓
Knowledge Authority
    ↓
Graph Mutation
```

**Current State:**
```
Execution
    ↓
Direct Graph Mutation (4 sources)
    ↓
Knowledge Authority
    ↓
Constitutional Fragmentation
```
