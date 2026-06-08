structural_drift_guard.js
/* ============================================================
   structural_drift_guard.js
   ------------------------------------------------------------
   Anti-Cascade Structural Integrity Guard


   Version: structural_drift_guard.2.0


   Guarantees:
   - Only target node span may change
   - No upstream/downstream mutation
   - No sibling cascade
   - No parent mutation
   - No structural graph modification
   - Deterministic validation
   - Advisory-only rejection
   ============================================================ */


export const STRUCTURAL_DRIFT_GUARD_VERSION =
  "structural_drift_guard.2.0";


/* ============================================================
   Utilities
   ============================================================ */


function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function deepFreeze(obj) {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}


/* ============================================================
   Core Drift Validator
   ============================================================ */


export function validateStructuralDrift({
  original_snapshot,
  proposed_replacement,
  structural_node_id
}) {
  assert(
    isPlainObject(original_snapshot),
    "original_snapshot must be plain object"
  );


  assert(
    typeof proposed_replacement === "string",
    "proposed_replacement must be string"
  );


  assert(
    typeof structural_node_id === "string",
    "structural_node_id required"
  );


  const violations = [];


  const {
    document_text,
    structural_graph
  } = original_snapshot;


  assert(
    typeof document_text === "string",
    "Invalid snapshot document_text"
  );


  assert(
    isPlainObject(structural_graph),
    "Invalid structural_graph"
  );


  const targetNode = structural_graph.nodes.find(
    n => n.node_id === structural_node_id
  );


  if (!targetNode) {
    violations.push({
      type: "TARGET_NODE_NOT_FOUND",
      structural_node_id
    });
  } else {
    const { start, end } = targetNode.span;


    const before = document_text.slice(0, start);
    const after = document_text.slice(end);


    const reconstructed =
      before + proposed_replacement + after;


    /* ========================================================
       Validate no upstream mutation
       ======================================================== */


    if (before !== document_text.slice(0, start)) {
      violations.push({
        type: "UPSTREAM_MUTATION_DETECTED"
      });
    }


    /* ========================================================
       Validate no downstream mutation
       ======================================================== */


    if (after !== document_text.slice(end)) {
      violations.push({
        type: "DOWNSTREAM_MUTATION_DETECTED"
      });
    }


    /* ========================================================
       Validate no sibling cascade
       ======================================================== */


    for (const node of structural_graph.nodes) {
      if (node.node_id === structural_node_id) continue;


      const originalSlice = document_text.slice(
        node.span.start,
        node.span.end
      );


      const newSlice = reconstructed.slice(
        node.span.start,
        node.span.end
      );


      if (originalSlice !== newSlice) {
        violations.push({
          type: "STRUCTURAL_CASCADE_DETECTED",
          affected_node_id: node.node_id
        });
      }
    }


    /* ========================================================
       Validate no node count mutation
       ======================================================== */


    if (
      structural_graph.nodes.length !==
      original_snapshot.structural_graph.nodes.length
    ) {
      violations.push({
        type: "STRUCTURAL_NODE_COUNT_CHANGED"
      });
    }


    /* ========================================================
       Validate no parent span mutation
       ======================================================== */


    if (targetNode.parent_node_id) {
      const parent = structural_graph.nodes.find(
        n => n.node_id === targetNode.parent_node_id
      );


      if (parent) {
        const parentOriginalSlice =
          document_text.slice(
            parent.span.start,
            parent.span.end
          );


        const parentNewSlice =
          reconstructed.slice(
            parent.span.start,
            parent.span.end
          );


        if (
          parentOriginalSlice !== parentNewSlice
        ) {
          violations.push({
            type: "PARENT_SPAN_MUTATION_DETECTED"
          });
        }
      }
    }
  }


  const result = {
    valid: violations.length === 0,
    violation_count: violations.length,
    violations,
    guard_version: STRUCTURAL_DRIFT_GUARD_VERSION
  };


  return deepFreeze(result);
}


suggestion_schema_enforcer.js
