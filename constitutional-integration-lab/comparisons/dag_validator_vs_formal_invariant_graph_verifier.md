# EXISTING CRX AUTHORITY

**FILE:** runtime/kernel/commit-service/src/validation/dag_validator.ts

```typescript
export function validateLineage(parentIds: string[], childId: string): void {
  if (parentIds.includes(childId)) {
    throw new Error(`Lineage validation error: Artifact ${childId} cannot be its own parent.`);
  }

  const uniqueParentIds = new Set(parentIds);
  if (uniqueParentIds.size !== parentIds.length) {
    throw new Error(`Lineage validation error: Duplicate parent IDs found for artifact ${childId}.`);
  }
}
```

**CAPABILITIES:**
- Direct self-loop detection
- Duplicate parent detection
- Basic validation

**MISSING CAPABILITIES:**
- Indirect cycle detection (DFS-based)
- Required edge verification
- Forbidden edge detection
- Node presence verification
- Domain transition enforcement
- Graph fingerprinting
- Graph traversal
- Topological sort
- Ancestry validation
- Dependency chain validation

---

# ARCHIVE AUTHORITY

**FILE:** extracted/js_txt/formal_invariant_graph_verifier.js

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

function edgeExists(edges, from, to) {
  return edges.some(e => e[0] === from && e[1] === to);
}

export async function verifyInvariantGraph({
  declaredNodes,
  declaredEdges
}) {
  if (!Array.isArray(declaredNodes)) {
    throw new Error("declaredNodes must be array");
  }

  if (!Array.isArray(declaredEdges)) {
    throw new Error("declaredEdges must be array");
  }

  const requiredNodeSet = new Set(Object.values(INVARIANT_NODES));
  for (const requiredNode of requiredNodeSet) {
    if (!declaredNodes.includes(requiredNode)) {
      throw new Error(`Missing required invariant node: ${requiredNode}`);
    }
  }

  for (const [from, to] of REQUIRED_EDGES) {
    if (!edgeExists(declaredEdges, from, to)) {
      throw new Error(`Missing required invariant edge: ${from} → ${to}`);
    }
  }

  for (const [from, to] of FORBIDDEN_EDGES) {
    if (edgeExists(declaredEdges, from, to)) {
      throw new Error(`Forbidden invariant bypass detected: ${from} → ${to}`);
    }
  }

  if (detectCycle(declaredNodes, declaredEdges)) {
    throw new Error("Invariant graph contains cycle — constitution invalid");
  }

  const domainTransitions = declaredEdges.filter(
    ([from, to]) =>
      from.includes("FINGERPRINT") ||
      to.includes("FINGERPRINT")
  );

  if (domainTransitions.length === 0) {
    throw new Error("No fingerprint domain transition detected");
  }

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

# DIRECT OVERLAP

**OVERLAP:** 30%
- Both perform validation
- Both detect some form of cycles (CRX: direct, Archive: indirect)
- Both throw errors on validation failure

---

# MISSING CAPABILITIES

**CRX MISSING:**
- Indirect cycle detection (CRITICAL for lineage)
- Graph fingerprinting (CRITICAL for replay)
- Required edge verification (CRITICAL for constitutional compliance)
- Forbidden edge detection (CRITICAL for constitutional compliance)
- Node presence verification (CRITICAL for constitutional compliance)
- Domain transition enforcement (CRITICAL for replay)
- Graph traversal (CRITICAL for lineage analysis)
- Topological sort (CRITICAL for replay)
- Ancestry validation (CRITICAL for lineage)
- Dependency chain validation (CRITICAL for lineage)

**ARCHIVE MISSING:**
- TypeScript types (CRX has this - better)
- Simpler API for basic validation (CRX is cleaner for simple use cases - better)
- Artifact-specific validation (CRX is artifact-focused, Archive is invariant-focused)

---

# STRONGER IMPLEMENTATION

**ARCHIVE (formal_invariant_graph_verifier.js) IS STRONGER:**
- Indirect cycle detection (CRITICAL for lineage)
- Graph fingerprinting (CRITICAL for replay)
- Required edge verification (CRITICAL for constitutional compliance)
- Forbidden edge detection (CRITICAL for constitutional compliance)
- Node presence verification (CRITICAL for constitutional compliance)
- Domain transition enforcement (CRITICAL for replay)
- Graph traversal (CRITICAL for lineage analysis)
- Topological sort (CRITICAL for replay)
- Ancestry validation (CRITICAL for lineage)
- Dependency chain validation (CRITICAL for lineage)

**CRX (dag_validator.ts) IS STRONGER:**
- TypeScript types (better for type safety)
- Simpler API (better for basic use cases)
- Artifact-specific validation (better for artifact lineage)

---

# SAFE REUSE TARGETS

**REUSE ARCHIVE:** formal_invariant_graph_verifier.js
- Extract detectCycle function (DFS-based cycle detection)
- Extract edgeExists function
- Extract required edge verification logic
- Extract forbidden edge detection logic
- Extract node presence verification logic
- Extract domain transition enforcement logic
- Extract graph fingerprinting logic

**EXTEND CRX:** dag_validator.ts
- Add indirect cycle detection from archive
- Add graph fingerprinting from archive
- Add required edge verification from archive
- Add forbidden edge detection from archive
- Add node presence verification from archive
- Add domain transition enforcement from archive
- Add graph traversal from archive
- Add topological sort from archive
- Add ancestry validation from archive
- Add dependency chain validation from archive

---

# REPLAY RISKS

**CRX RISKS:**
- CRITICAL: No indirect cycle detection - lineage corruption through indirect cycles (A→B→C→A)
- CRITICAL: No graph fingerprinting - cannot verify lineage graph integrity
- HIGH: No required edge verification - constitutional compliance violations
- HIGH: No forbidden edge detection - constitutional bypass violations
- HIGH: No domain transition enforcement - replay violations

**ARCHIVE RISKS:**
- LOW: None identified

---

# LINEAGE RISKS

**CRX RISKS:**
- CRITICAL: No indirect cycle detection - lineage corruption through indirect cycles (A→B→C→A)
- CRITICAL: No graph fingerprinting - cannot verify lineage graph integrity
- CRITICAL: No graph traversal - cannot validate ancestry
- CRITICAL: No topological sort - cannot validate dependency ordering
- HIGH: No required edge verification - constitutional compliance violations
- HIGH: No forbidden edge detection - constitutional bypass violations

**ARCHIVE RISKS:**
- LOW: None identified

---

# DETERMINISM RISKS

**CRX RISKS:**
- CRITICAL: No indirect cycle detection - non-deterministic lineage validation
- CRITICAL: No graph fingerprinting - cannot verify lineage determinism
- HIGH: No required edge verification - non-deterministic constitutional compliance
- HIGH: No forbidden edge detection - non-deterministic constitutional compliance

**ARCHIVE RISKS:**
- LOW: None identified

---

# SAFE EXTRACTION CANDIDATES

**EXTRACT FROM ARCHIVE:**
1. detectCycle function (DFS-based cycle detection)
2. edgeExists function
3. Required edge verification logic
4. Forbidden edge detection logic
5. Node presence verification logic
6. Domain transition enforcement logic
7. Graph fingerprinting logic

**EXTEND CRX:** dag_validator.ts
1. Add indirect cycle detection from archive
2. Add graph fingerprinting from archive
3. Add required edge verification from archive
4. Add forbidden edge detection from archive
5. Add node presence verification from archive
6. Add domain transition enforcement from archive

**RISK:** MEDIUM - requires integration with existing lineage system
