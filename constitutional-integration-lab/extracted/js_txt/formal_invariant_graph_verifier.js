/* ============================================================
   formal_invariant_graph_verifier.js
   ------------------------------------------------------------
   Global Constitutional Topology Verifier


   Version: invariant_graph.1.0


   Purpose:
   - Formalize execution constitution as DAG
   - Verify invariant presence
   - Detect forbidden bypass edges
   - Detect cycles
   - Validate required ordering
   - Produce invariant graph fingerprint
   - Integrate with CI gate
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================
   Invariant Node Definitions
   ============================================================ */


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


/* ============================================================
   Required Directed Edges (Constitutional Ordering)
   ============================================================ */


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


/* ============================================================
   Forbidden Direct Edges (Bypass Detection)
   ============================================================ */


const FORBIDDEN_EDGES = Object.freeze([


  ["SNAPSHOT_VERIFIED", "ARTIFACT_BOUND"],
  ["SCHEDULER_BOUND", "ARTIFACT_BOUND"],
  ["RUNTIME_ISOLATED", "FINGERPRINT_BOUND"],
  ["CONTRACT_VALIDATED", "CI_DOMAIN_LOCK_ENFORCED"],
  ["SNAPSHOT_VERIFIED", "RUNTIME_ISOLATED"] // must pass scheduler


]);


/* ============================================================
   Graph Utilities
   ============================================================ */


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


/* ============================================================
   Main Verifier
   ============================================================ */


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


  /* ------------------------------------------------------------
     1?? Node Presence Check
     ------------------------------------------------------------ */


  const requiredNodeSet =
    new Set(Object.values(INVARIANT_NODES));


  for (const requiredNode of requiredNodeSet) {
    if (!declaredNodes.includes(requiredNode)) {
      throw new Error(
        `Missing required invariant node: ${requiredNode}`
      );
    }
  }


  /* ------------------------------------------------------------
     2?? Required Edge Check
     ------------------------------------------------------------ */


  for (const [from, to] of REQUIRED_EDGES) {
    if (!edgeExists(declaredEdges, from, to)) {
      throw new Error(
        `Missing required invariant edge: ${from} ? ${to}`
      );
    }
  }


  /* ------------------------------------------------------------
     3?? Forbidden Edge Check
     ------------------------------------------------------------ */


  for (const [from, to] of FORBIDDEN_EDGES) {
    if (edgeExists(declaredEdges, from, to)) {
      throw new Error(
        `Forbidden invariant bypass detected: ${from} ? ${to}`
      );
    }
  }


  /* ------------------------------------------------------------
     4?? Cycle Detection
     ------------------------------------------------------------ */


  if (detectCycle(declaredNodes, declaredEdges)) {
    throw new Error(
      "Invariant graph contains cycle — constitution invalid"
    );
  }


  /* ------------------------------------------------------------
     5?? Domain Transition Enforcement
     ------------------------------------------------------------ */


  const domainTransitions = declaredEdges.filter(
    ([from, to]) =>
      from.includes("FINGERPRINT") ||
      to.includes("FINGERPRINT")
  );


  if (domainTransitions.length === 0) {
    throw new Error(
      "No fingerprint domain transition detected"
    );
  }


  /* ------------------------------------------------------------
     6?? Deterministic Graph Fingerprint
     ------------------------------------------------------------ */


  const invariant_graph_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.AUTHORITY_GRAPH,
      {
        nodes: [...declaredNodes].sort(),
        edges: [...declaredEdges]
          .map(e => e.join("?"))
          .sort()
      }
    );


  return Object.freeze({
    valid: true,
    invariant_graph_fingerprint
  });
}
.github/workflows/constitutional_ci.yml
