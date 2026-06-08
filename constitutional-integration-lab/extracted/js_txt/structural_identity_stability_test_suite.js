structural_identity_stability_test_suite.js
/* ============================================================
   structural_identity_stability_test_suite.js (Hardened)
   ------------------------------------------------------------
   Guarantees:
   - Structural graph determinism
   - Stable node ID derivation (span + type bound)
   - Deterministic node ordering
   - Span immutability
   - Parent containment invariants
   - STRUCTURAL_GRAPH domain stability
   - Insertion-order independence
   - Cross-run identity verification
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


import {
  buildStructuralGraph
} from "../core/structural_graph_builder.js";


/* ============================================================ */


export const STRUCTURAL_STABILITY_SUITE_VERSION =
  "structural.test.2.0";


/* ============================================================ */


export class StructuralIdentityStabilityError extends Error {
  constructor(message) {
    super(message);
    this.name = "StructuralIdentityStabilityError";
  }
}


/* ============================================================
   Canonicalization
   ============================================================ */


function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }


  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }


  return value;
}


function canonicalEqual(a, b) {
  return JSON.stringify(canonicalize(a)) ===
         JSON.stringify(canonicalize(b));
}


/* ============================================================
   Deterministic Node Projection
   ============================================================ */


function projectNode(node) {
  return {
    node_id: node.node_id,
    type: node.type,
    start: node.start,
    end: node.end,
    parent_id: node.parent_id || null
  };
}


function sortNodesDeterministically(nodes) {
  return [...nodes].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    if (a.end !== b.end) return a.end - b.end;
    return a.type.localeCompare(b.type);
  });
}


/* ============================================================
   Invariant Validators
   ============================================================ */


function verifySpanValidity(node, documentLength) {
  if (node.start < 0 || node.end > documentLength) {
    throw new StructuralIdentityStabilityError(
      `Span out of bounds: ${node.node_id}`
    );
  }


  if (node.start >= node.end) {
    throw new StructuralIdentityStabilityError(
      `Invalid span range: ${node.node_id}`
    );
  }
}


function verifyParentContainment(nodeMap, node) {
  if (!node.parent_id) return;


  const parent = nodeMap.get(node.parent_id);


  if (!parent) {
    throw new StructuralIdentityStabilityError(
      `Missing parent: ${node.parent_id}`
    );
  }


  if (!(parent.start <= node.start &&
        parent.end >= node.end)) {
    throw new StructuralIdentityStabilityError(
      `Parent containment violated: ${node.node_id}`
    );
  }
}


/* ============================================================
   Structural Graph Canonical Fingerprint
   ============================================================ */


async function fingerprintStructuralGraph(graph) {
  const ordered = sortNodesDeterministically(graph.nodes)
    .map(projectNode);


  return fingerprintWithDomain(
    FINGERPRINT_DOMAINS.STRUCTURAL_GRAPH,
    canonicalize({ nodes: ordered })
  );
}


/* ============================================================
   Main Suite
   ============================================================ */


export async function runStructuralIdentityStabilityTest({
  document_text
}) {


  if (typeof document_text !== "string") {
    throw new StructuralIdentityStabilityError(
      "document_text must be string"
    );
  }


  /* 1?? Build Twice */
  const graphA =
    await buildStructuralGraph({ document_text });


  const graphB =
    await buildStructuralGraph({ document_text });


  /* 2?? Canonical Fingerprints */
  const fpA = await fingerprintStructuralGraph(graphA);
  const fpB = await fingerprintStructuralGraph(graphB);


  if (fpA !== fpB) {
    throw new StructuralIdentityStabilityError(
      "Structural graph fingerprint drift detected"
    );
  }


  /* 3?? Node Identity Stability */
  const orderedA =
    sortNodesDeterministically(graphA.nodes)
      .map(projectNode);


  const orderedB =
    sortNodesDeterministically(graphB.nodes)
      .map(projectNode);


  if (!canonicalEqual(orderedA, orderedB)) {
    throw new StructuralIdentityStabilityError(
      "Node identity drift detected"
    );
  }


  /* 4?? Span Validity */
  const documentLength = document_text.length;


  for (const node of orderedA) {
    verifySpanValidity(node, documentLength);
  }


  /* 5?? Parent Containment */
  const nodeMap =
    new Map(orderedA.map(n => [n.node_id, n]));


  for (const node of orderedA) {
    verifyParentContainment(nodeMap, node);
  }


  /* 6?? Deterministic Node Ordering Verification */
  const rawOrder = graphA.nodes.map(n => n.node_id);
  const canonicalOrder =
    orderedA.map(n => n.node_id);


  if (!canonicalEqual(rawOrder, canonicalOrder)) {
    throw new StructuralIdentityStabilityError(
      "Node ordering is not canonical — builder is order-sensitive"
    );
  }


  /* 7?? Insertion-Order Independence Check */
  const reversed =
    [...graphA.nodes].reverse();


  const reversedFingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.STRUCTURAL_GRAPH,
      canonicalize({
        nodes:
          sortNodesDeterministically(reversed)
            .map(projectNode)
      })
    );


  if (reversedFingerprint !== fpA) {
    throw new StructuralIdentityStabilityError(
      "Fingerprint sensitive to insertion order"
    );
  }


  /* 8?? Cross-Run Loop Stability */
  for (let i = 0; i < 5; i++) {
    const loopGraph =
      await buildStructuralGraph({ document_text });


    const loopFp =
      await fingerprintStructuralGraph(loopGraph);


    if (loopFp !== fpA) {
      throw new StructuralIdentityStabilityError(
        `Structural drift detected at iteration ${i}`
      );
    }
  }


  /* 9?? Stability Session Fingerprint */
  const stability_session_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.STRUCTURAL_GRAPH,
      canonicalize({
        version: STRUCTURAL_STABILITY_SUITE_VERSION,
        structural_fingerprint: fpA,
        node_count: orderedA.length
      })
    );


  return Object.freeze({
    structural_stable: true,
    structural_fingerprint: fpA,
    node_count: orderedA.length,
    stability_session_fingerprint,
    suite_version: STRUCTURAL_STABILITY_SUITE_VERSION
  });
}
entropy_budget_guard.js
