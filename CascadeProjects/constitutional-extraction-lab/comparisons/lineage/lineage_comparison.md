# DAG/Lineage Comparison

## Current CRX Implementation

**FILE:** runtime/kernel/commit-service/src/validation/dag_validator.ts

```typescript
export function validateLineage(parentIds: string[], childId: string): void {
  // Check for direct self-loop
  if (parentIds.includes(childId)) {
    throw new Error('Direct self-loop detected: artifact cannot be its own parent');
  }

  // Check for duplicate parents
  const uniqueParents = new Set(parentIds);
  if (uniqueParents.size !== parentIds.length) {
    throw new Error('Duplicate parent detected: artifact cannot have duplicate parents');
  }
}
```

**CAPABILITIES:**
- Direct self-loop detection
- Duplicate parent detection
- Basic validation

**MISSING CAPABILITIES:**
- Indirect cycle detection (A→B→C→A)
- Graph fingerprinting
- Required edge verification
- Forbidden edge detection
- Domain transition enforcement
- Ancestry validation
- Dependency chain validation
- Graph traversal
- Topological sort
- Cycle detection algorithm

---

## Legacy Implementation (formal_invariant_graph_verifier.js)

**FILE:** JS.txt (lines 1-263)

```javascript
export const INVARIANT_NODES = Object.freeze({
  SNAPSHOT_VERIFIED: "SNAPSHOT_VERIFIED",
  SCHEDULER_BOUND: "SCHEDULER_BOUND",
  RUNTIME_ISOLATED: "RUNTIME_ISOLATED",
  ENTROPY_ENFORCED: "ENTROPY_ENFORCED",
  CONTRACT_VALIDATED: "CONTRACT_VALIDATED",
  ARTIFACT_BOUND: "ARTIFACT_BOUND",
  FINGERPRINT_BOUND: "FINGERPRINT_BOUND",
  AUTHORITY_BOUNDARY_ENCLOSED: "AUTHORITY_BOUNDARY_ENCLOSED",
  CI_DOMAIN_LOCK_ENFORCED: "CI_DOMAIN_LOCK_ENFORCED"
});

const REQUIRED_EDGES = Object.freeze([
  ["SNAPSHOT_VERIFIED", "SCHEDULER_BOUND"],
  ["SCHEDULER_BOUND", "RUNTIME_ISOLATED"],
  ["RUNTIME_ISOLATED", "ENTROPY_ENFORCED"],
  ["ENTROPY_ENFORCED", "CONTRACT_VALIDATED"],
  ["CONTRACT_VALIDATED", "ARTIFACT_BOUND"],
  ["ARTIFACT_BOUND", "FINGERPRINT_BOUND"],
  ["FINGERPRINT_BOUND", "AUTHORITY_BOUNDARY_ENCLOSED"],
  ["AUTHORITY_BOUNDARY_ENCLOSED", "CI_DOMAIN_LOCK_ENFORCED"]
]);

const FORBIDDEN_EDGES = Object.freeze([
  ["SNAPSHOT_VERIFIED", "ARTIFACT_BOUND"],
  ["SCHEDULER_BOUND", "ARTIFACT_BOUND"],
  ["RUNTIME_ISOLATED", "FINGERPRINT_BOUND"],
  ["CONTRACT_VALIDATED", "CI_DOMAIN_LOCK_ENFORCED"],
  ["SNAPSHOT_VERIFIED", "RUNTIME_ISOLATED"]
]);

function detectCycle(nodes, edges) {
  const adjacency = new Map();
  const visited = new Set();
  const stack = new Set();

  for (const node of nodes) {
    adjacency.set(node, []);
  }

  for (const [from, to] of edges) {
    adjacency.get(from)?.push(to);
  }

  function dfs(node) {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (dfs(node)) return true;
  }

  return false;
}

export async function verifyInvariantGraph({
  declaredNodes,
  declaredEdges
}) {
  // 1. Node Presence Check
  const requiredNodeSet = new Set(Object.values(INVARIANT_NODES));
  for (const requiredNode of requiredNodeSet) {
    if (!declaredNodes.includes(requiredNode)) {
      throw new Error(`Missing required invariant node: ${requiredNode}`);
    }
  }

  // 2. Required Edge Check
  for (const [from, to] of REQUIRED_EDGES) {
    if (!edgeExists(declaredEdges, from, to)) {
      throw new Error(`Missing required invariant edge: ${from} → ${to}`);
    }
  }

  // 3. Forbidden Edge Check
  for (const [from, to] of FORBIDDEN_EDGES) {
    if (edgeExists(declaredEdges, from, to)) {
      throw new Error(`Forbidden invariant bypass detected: ${from} → ${to}`);
    }
  }

  // 4. Cycle Detection
  if (detectCycle(declaredNodes, declaredEdges)) {
    throw new Error("Invariant graph contains cycle — constitution invalid");
  }

  // 5. Domain Transition Enforcement
  const domainTransitions = declaredEdges.filter(
    ([from, to]) =>
      from.includes("FINGERPRINT") ||
      to.includes("FINGERPRINT")
  );

  if (domainTransitions.length === 0) {
    throw new Error("No fingerprint domain transition detected");
  }

  // 6. Deterministic Graph Fingerprint
  const invariant_graph_fingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.AUTHORITY_GRAPH,
    {
      nodes: [...declaredNodes].sort(),
      edges: [...declaredEdges]
        .map(e => e.join("→"))
        .sort()
    }
  );

  return Object.freeze({
    valid: true,
    invariant_graph_fingerprint
  });
}
```

**CAPABILITIES:**
- Full cycle detection (DFS-based)
- Required edge verification
- Forbidden edge detection
- Node presence verification
- Domain transition enforcement
- Graph fingerprinting
- Deterministic graph representation
- Invariant graph verification

---

## Comparison Analysis

**OVERLAP:**
- Both perform validation
- Both detect some form of cycles (CRX: direct, Legacy: indirect)
- Both throw errors on validation failure

**CRX MISSING:**
- Indirect cycle detection (CRITICAL - addresses BOTTLENECK-002)
- Graph fingerprinting (CRITICAL for replay)
- Required edge verification (CRITICAL for constitutional compliance)
- Forbidden edge detection (CRITICAL for constitutional compliance)
- Domain transition enforcement (CRITICAL for replay)
- Graph traversal (CRITICAL for lineage analysis)
- Topological sort (CRITICAL for replay)

**LEGACY MISSING:**
- TypeScript types (CRX has this - better)
- Simpler API for basic validation (CRX is cleaner for simple use cases)
- Artifact-specific validation (CRX is artifact-focused, Legacy is invariant-focused)

---

## Replay Relevance

**INDIRECT CYCLE DETECTION:**
- CRITICAL - prevents lineage corruption through indirect cycles (A→B→C→A)
- Current CRX only detects direct self-loops
- Replay requires acyclic lineage graph
- Without indirect cycle detection, replay can produce incorrect state

**GRAPH FINGERPRINTING:**
- CRITICAL - enables lineage graph verification
- Supports replay verification
- Enables cached graph validation
- Detects graph drift over time

**REQUIRED EDGE VERIFICATION:**
- MEDIUM - ensures constitutional ordering
- Supports replay compliance verification

**FORBIDDEN EDGE DETECTION:**
- MEDIUM - prevents constitutional bypass
- Supports replay compliance verification

---

## Lineage Relevance

**INDIRECT CYCLE DETECTION:**
- CRITICAL - prevents lineage corruption
- Current CRX only detects direct self-loops
- Lineage requires acyclic graph
- Without indirect cycle detection, lineage can become corrupted

**GRAPH FINGERPRINTING:**
- CRITICAL - enables lineage verification
- Supports lineage integrity checks
- Detects lineage drift

**GRAPH TRAVERSAL:**
- CRITICAL - enables ancestry validation
- Supports dependency chain validation
- Enables lineage reconstruction

---

## Recommendation

**ACTION:** EXTEND dag_validator.ts with legacy capabilities

**EXTRACT FROM LEGACY:**
1. detectCycle() function (DFS-based cycle detection)
2. verifyInvariantGraph() function (adapt for lineage graphs)
3. Graph fingerprinting logic
4. Required edge verification (adapt for lineage)
5. Forbidden edge detection (adapt for lineage)
6. Domain transition enforcement (adapt for lineage)

**KEEP FROM CRX:**
1. TypeScript types
2. Artifact-specific API (validateLineage)
3. Simpler direct self-loop detection (keep as fast path)
4. Duplicate parent detection (keep as fast path)

**RISK:** MEDIUM - requires careful integration with existing lineage system

---

## Proposed Extension

```typescript
export interface LineageNode {
  id: string;
}

export interface LineageEdge {
  from: string;
  to: string;
}

export interface LineageGraph {
  nodes: string[];
  edges: LineageEdge[];
}

export function validateLineage(parentIds: string[], childId: string): void {
  // Keep existing fast path validation
  if (parentIds.includes(childId)) {
    throw new Error('Direct self-loop detected: artifact cannot be its own parent');
  }

  const uniqueParents = new Set(parentIds);
  if (uniqueParents.size !== parentIds.length) {
    throw new Error('Duplicate parent detected: artifact cannot have duplicate parents');
  }

  // Add indirect cycle detection
  const graph = buildLineageGraph(parentIds, childId);
  if (detectCycle(graph.nodes, graph.edges)) {
    throw new Error('Indirect cycle detected in lineage graph');
  }
}

function buildLineageGraph(parentIds: string[], childId: string): LineageGraph {
  const nodes = [...parentIds, childId];
  const edges: LineageEdge[] = parentIds.map(parent => ({ from: parent, to: childId }));
  return { nodes, edges };
}

function detectCycle(nodes: string[], edges: LineageEdge[]): boolean {
  const adjacency = new Map<string, string[]>();
  const visited = new Set<string>();
  const stack = new Set<string>();

  for (const node of nodes) {
    adjacency.set(node, []);
  }

  for (const [from, to] of edges) {
    adjacency.get(from)?.push(to);
  }

  function dfs(node: string): boolean {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    for (const neighbor of adjacency.get(node) || []) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  }

  for (const node of nodes) {
    if (dfs(node)) return true;
  }

  return false;
}

export async function verifyLineageGraph(graph: LineageGraph): Promise<{
  valid: boolean;
  graph_fingerprint: string;
}> {
  // 1. Cycle Detection
  if (detectCycle(graph.nodes, graph.edges)) {
    throw new Error('Lineage graph contains cycle — lineage invalid');
  }

  // 2. Deterministic Graph Fingerprint
  const graph_fingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.LINEAGE,
    {
      nodes: [...graph.nodes].sort(),
      edges: [...graph.edges]
        .map(e => `${e.from}→${e.to}`)
        .sort()
    }
  );

  return Object.freeze({
    valid: true,
    graph_fingerprint
  });
}

export function getAncestry(nodeId: string, graph: LineageGraph): string[] {
  // DFS to find all ancestors
  const ancestors: string[] = [];
  const visited = new Set<string>();

  function dfs(node: string) {
    if (visited.has(node)) return;
    visited.add(node);

    const parents = graph.edges
      .filter(edge => edge.to === node)
      .map(edge => edge.from);

    for (const parent of parents) {
      ancestors.push(parent);
      dfs(parent);
    }
  }

  dfs(nodeId);
  return ancestors;
}

export function topologicalSort(graph: LineageGraph): string[] {
  // Kahn's algorithm for topological sort
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of graph.nodes) {
    inDegree.set(node, 0);
    adjacency.set(node, []);
  }

  for (const [from, to] of graph.edges) {
    adjacency.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  }

  const queue: string[] = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const neighbor of adjacency.get(node) || []) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (result.length !== graph.nodes.length) {
    throw new Error('Graph contains cycle');
  }

  return result;
}
```

---

## Migration Path

1. Add detectCycle() function to dag_validator.ts
2. Add verifyLineageGraph() function
3. Add getAncestry() function
4. Add topologicalSort() function
5. Update validateLineage() to use detectCycle()
6. Add tests for indirect cycle detection
7. Add tests for graph fingerprinting
8. Add tests for ancestry traversal
9. Add tests for topological sort
10. Update documentation

---

## Risk Assessment

**MEDIUM RISK:**
- Cycle detection is O(V+E) - may impact performance for large graphs
- Requires integration with existing lineage system
- Graph fingerprinting requires domain separation (depends on canonical_engine.ts extension)

**MITIGATION:**
- Add performance tests
- Cache graph fingerprints
- Use fast path for small graphs (direct self-loop detection)
- Document performance characteristics
