artifact_firewall.js
/* ============================================================
   artifact_firewall.js
   ------------------------------------------------------------
   Unified Suggestion Constitution Enforcement Layer


   Version: artifact_firewall.1.0


   Guarantees:
   - Authority-free artifacts
   - Strict schema enforcement
   - Structural anti-cascade enforcement
   - Byte-exact reversibility
   - Deterministic validation ordering
   - Immutable advisory result
   - No mutation
   ============================================================ */


import { validateNoAuthorityFields }
  from "./anti_authority_field_guard.js";


import { validateSuggestionArtifact }
  from "./suggestion_schema_enforcer.js";


import { validateStructuralDrift }
  from "./structural_drift_guard.js";


import { validateArtifactReversibility }
  from "./artifact_reversibility_validator.js";


export const ARTIFACT_FIREWALL_VERSION =
  "artifact_firewall.1.0";


/* ============================================================
   Utilities
   ============================================================ */


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function deepFreeze(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (visited.has(obj)) return obj;
  visited.add(obj);
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key], visited);
  }
  return obj;
}


/* ============================================================
   Unified Firewall
   ============================================================ */


export function validateSuggestionThroughFirewall({
  suggestionArtifact,
  original_snapshot,
  structural_graph
}) {
  if (!isPlainObject(original_snapshot)) {
    throw new Error("Invalid original_snapshot");
  }


  const violations = [];


  const document_text =
    original_snapshot.document_text;


  /* --------------------------------------------------------
     1?? Authority Guard
     -------------------------------------------------------- */


  const authorityResult =
    validateNoAuthorityFields(suggestionArtifact);


  if (!authorityResult.valid) {
    violations.push(
      ...authorityResult.violations.map(v => ({
        layer: "authority_guard",
        ...v
      }))
    );
  }


  /* --------------------------------------------------------
     2?? Schema Enforcement
     -------------------------------------------------------- */


  const schemaResult =
    validateSuggestionArtifact({
      suggestion: suggestionArtifact,
      structural_graph,
      snapshot_fingerprint:
        original_snapshot.snapshot_fingerprint
    });


  if (!schemaResult.valid) {
    violations.push(
      ...schemaResult.violations.map(v => ({
        layer: "schema_enforcer",
        ...v
      }))
    );
  }


  /* --------------------------------------------------------
     3?? Structural Drift Guard
     -------------------------------------------------------- */


  const driftResult =
    validateStructuralDrift({
      original_snapshot,
      proposed_replacement:
        suggestionArtifact.replacement_text,
      structural_node_id:
        suggestionArtifact.structural_node_id
    });


  if (!driftResult.valid) {
    violations.push(
      ...driftResult.violations.map(v => ({
        layer: "structural_drift_guard",
        ...v
      }))
    );
  }


  /* --------------------------------------------------------
     4?? Reversibility Validator
     -------------------------------------------------------- */


  const reversibilityResult =
    validateArtifactReversibility({
      suggestionArtifact,
      document_text,
      structuralGraph: structural_graph
    });


  if (!reversibilityResult.valid) {
    violations.push(
      ...reversibilityResult.violations.map(v => ({
        layer: "reversibility_validator",
        ...v
      }))
    );
  }


  /* --------------------------------------------------------
     Deterministic Ordering
     -------------------------------------------------------- */


  const sortedViolations = violations.sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );


  const result = {
    valid: sortedViolations.length === 0,
    violation_count: sortedViolations.length,
    violations: sortedViolations,
    firewall_version: ARTIFACT_FIREWALL_VERSION
  };


  return deepFreeze(result);
}


projection_ephemerality_enforcer.js
