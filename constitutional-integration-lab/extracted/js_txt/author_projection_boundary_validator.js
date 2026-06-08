author_projection_boundary_validator.js
/* ============================================================
   author_projection_boundary_validator.js
   ------------------------------------------------------------
   Snapshot Constitutional Boundary Guard


   Version: author_projection_boundary_validator.2.0


   Guarantees:
   - AuthorSnapshot purity enforcement
   - ProjectionLayer containment enforcement
   - Strict top-level schema enforcement
   - No plugin-derived judgment fields
   - No structural bleed across boundary
   - No hidden evaluation metadata
   - No circular structures
   - Deterministic violation ordering
   - Immutable advisory result
   - No mutation ever
   ============================================================ */


export const AUTHOR_PROJECTION_BOUNDARY_VALIDATOR_VERSION =
  "author_projection_boundary_validator.2.0";


/* ============================================================
   Required Snapshot Schema
   ============================================================ */


const REQUIRED_AUTHOR_KEYS = new Set([
  "schema_version",
  "document_text",
  "structural_graph",
  "interaction_events",
  "snapshot_fingerprint",
  "parent_snapshot_fingerprint"
]);


const ALLOWED_AUTHOR_KEYS = new Set([
  ...REQUIRED_AUTHOR_KEYS
]);


const REQUIRED_PROJECTION_KEYS = new Set([
  "snapshot_fingerprint",
  "scheduler_fingerprint",
  "plugin_versions",
  "suggestion_artifacts"
]);


const ALLOWED_PROJECTION_KEYS = new Set([
  ...REQUIRED_PROJECTION_KEYS,
  "reflection_artifacts",
  "overlay_metadata",
  "lens_state"
]);


/* ============================================================
   Forbidden Evaluation Patterns
   ============================================================ */


const FORBIDDEN_FIELD_PATTERNS = [
  /score/i,
  /confidence/i,
  /rating/i,
  /quality/i,
  /evaluation/i,
  /percentile/i,
  /grade/i,
  /severity/i,
  /ranking/i,
  /collapse/i,
  /overall/i,
  /strength/i,
  /weakness/i
];


/* ============================================================
   Type Guards
   ============================================================ */


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function isFrozenDeep(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return true;
  if (visited.has(obj)) return true;


  if (!Object.isFrozen(obj)) return false;
  visited.add(obj);


  for (const key of Object.keys(obj)) {
    if (!isFrozenDeep(obj[key], visited)) {
      return false;
    }
  }


  return true;
}


/* ============================================================
   Deep Scan Engine (Deterministic)
   ============================================================ */


function deepScanForForbiddenFields(obj) {
  const violations = [];
  const visited = new WeakSet();


  function scan(node, path = "") {
    if (node === null || typeof node !== "object") return;
    if (visited.has(node)) return;


    visited.add(node);


    if (!isPlainObject(node) && !Array.isArray(node)) {
      violations.push({
        type: "NON_PLAIN_OBJECT_DETECTED",
        path
      });
      return;
    }


    for (const key of Object.keys(node).sort()) {
      const fullPath = path ? `${path}.${key}` : key;


      for (const pattern of FORBIDDEN_FIELD_PATTERNS) {
        if (pattern.test(key)) {
          violations.push({
            type: "FORBIDDEN_EVALUATIVE_FIELD",
            field: fullPath
          });
        }
      }


      const value = node[key];


      if (typeof value === "function") {
        violations.push({
          type: "FUNCTION_FIELD_DETECTED",
          field: fullPath
        });
      }


      if (typeof value === "symbol") {
        violations.push({
          type: "SYMBOL_FIELD_DETECTED",
          field: fullPath
        });
      }


      if (typeof value === "bigint") {
        violations.push({
          type: "BIGINT_FIELD_DETECTED",
          field: fullPath
        });
      }


      scan(value, fullPath);
    }
  }


  scan(obj);
  return violations;
}


/* ============================================================
   Author Snapshot Validator
   ============================================================ */


function validateAuthorSnapshot(authorSnapshot) {
  const violations = [];


  if (!isPlainObject(authorSnapshot)) {
    throw new Error("AuthorSnapshot must be a plain object");
  }


  const keys = Object.keys(authorSnapshot).sort();


  // Required keys
  for (const required of REQUIRED_AUTHOR_KEYS) {
    if (!keys.includes(required)) {
      violations.push({
        type: "MISSING_REQUIRED_AUTHOR_FIELD",
        field: required
      });
    }
  }


  // Unauthorized keys
  for (const key of keys) {
    if (!ALLOWED_AUTHOR_KEYS.has(key)) {
      violations.push({
        type: "UNAUTHORIZED_FIELD_IN_AUTHOR_SNAPSHOT",
        field: key
      });
    }
  }


  // Explicit projection bleed
  if ("suggestion_artifacts" in authorSnapshot) {
    violations.push({
      type: "SUGGESTION_ARTIFACT_LEAK_IN_AUTHOR_STATE"
    });
  }


  if ("projection_layer" in authorSnapshot) {
    violations.push({
      type: "PROJECTION_LAYER_EMBEDDED_IN_AUTHOR_STATE"
    });
  }


  // Deep evaluative scan
  violations.push(...deepScanForForbiddenFields(authorSnapshot));


  // Snapshot immutability check
  if (!isFrozenDeep(authorSnapshot)) {
    violations.push({
      type: "AUTHOR_SNAPSHOT_NOT_DEEP_FROZEN"
    });
  }


  return violations;
}


/* ============================================================
   Projection Layer Validator
   ============================================================ */


function validateProjectionLayer(projectionLayer) {
  const violations = [];


  if (!isPlainObject(projectionLayer)) {
    throw new Error("ProjectionLayer must be a plain object");
  }


  const keys = Object.keys(projectionLayer).sort();


  for (const required of REQUIRED_PROJECTION_KEYS) {
    if (!keys.includes(required)) {
      violations.push({
        type: "MISSING_REQUIRED_PROJECTION_FIELD",
        field: required
      });
    }
  }


  for (const key of keys) {
    if (!ALLOWED_PROJECTION_KEYS.has(key)) {
      violations.push({
        type: "UNAUTHORIZED_FIELD_IN_PROJECTION_LAYER",
        field: key
      });
    }
  }


  // Structural bleed prevention
  if ("document_text" in projectionLayer) {
    violations.push({
      type: "DOCUMENT_TEXT_IN_PROJECTION_LAYER"
    });
  }


  if ("structural_graph" in projectionLayer) {
    violations.push({
      type: "STRUCTURAL_GRAPH_IN_PROJECTION_LAYER"
    });
  }


  if ("interaction_events" in projectionLayer) {
    violations.push({
      type: "INTERACTION_EVENTS_IN_PROJECTION_LAYER"
    });
  }


  // Deep evaluative scan
  violations.push(...deepScanForForbiddenFields(projectionLayer));


  if (!isFrozenDeep(projectionLayer)) {
    violations.push({
      type: "PROJECTION_LAYER_NOT_DEEP_FROZEN"
    });
  }


  return violations;
}


/* ============================================================
   Public API
   ============================================================ */


export function validateAuthorProjectionBoundary({
  authorSnapshot,
  projectionLayer
}) {
  const authorViolations =
    validateAuthorSnapshot(authorSnapshot);


  const projectionViolations =
    validateProjectionLayer(projectionLayer);


  const allViolations = [
    ...authorViolations,
    ...projectionViolations
  ].sort((a, b) => {
    const aKey = `${a.type}:${a.field || ""}`;
    const bKey = `${b.type}:${b.field || ""}`;
    return aKey.localeCompare(bKey);
  });


  const result = {
    valid: allViolations.length === 0,
    violation_count: allViolations.length,
    violations: allViolations,
    validator_version:
      AUTHOR_PROJECTION_BOUNDARY_VALIDATOR_VERSION
  };


  return Object.freeze(result);
}
structural_drift_guard.js
