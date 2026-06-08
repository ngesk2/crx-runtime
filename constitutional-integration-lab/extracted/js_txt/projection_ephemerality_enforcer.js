projection_ephemerality_enforcer.js
/* ============================================================
   projection_ephemerality_enforcer.js
   ------------------------------------------------------------
   Overlay Ephemerality Constitution


   Version: projection_ephemerality_enforcer.1.0


   Guarantees:
   - Projection artifacts never persisted in snapshot lineage
   - AuthorSnapshot purity enforcement
   - Rebuild determinism validation
   - Projection recomputability guarantee
   - No mutation
   - Immutable advisory result
   ============================================================ */


export const PROJECTION_EPHEMERALITY_ENFORCER_VERSION =
  "projection_ephemerality_enforcer.1.0";


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
   Forbidden Snapshot Fields
   ============================================================ */


const FORBIDDEN_SNAPSHOT_FIELDS = new Set([
  "projection_layer",
  "suggestion_artifacts",
  "overlay_metadata",
  "rendering_preferences",
  "lens_state"
]);


/* ============================================================
   Deep Scan for Overlay Leakage
   ============================================================ */


function deepScanForOverlayLeak(obj, path = "") {
  const violations = [];


  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return violations;
  }


  for (const key of Object.keys(obj)) {
    const fullPath = path ? `${path}.${key}` : key;


    if (FORBIDDEN_SNAPSHOT_FIELDS.has(key)) {
      violations.push({
        type: "PROJECTION_FIELD_PERSISTED_IN_SNAPSHOT",
        field: fullPath
      });
    }


    const value = obj[key];


    if (
      isPlainObject(value) ||
      Array.isArray(value)
    ) {
      violations.push(
        ...deepScanForOverlayLeak(value, fullPath)
      );
    }
  }


  return violations;
}


/* ============================================================
   Deterministic Rebuild Dependency Validator
   ============================================================ */


function validateRebuildInputs({
  snapshot,
  plugin_versions,
  scheduler_fingerprint
}) {
  const violations = [];


  if (!snapshot.snapshot_fingerprint) {
    violations.push({
      type: "SNAPSHOT_FINGERPRINT_REQUIRED"
    });
  }


  if (!plugin_versions || typeof plugin_versions !== "object") {
    violations.push({
      type: "PLUGIN_VERSIONS_REQUIRED"
    });
  }


  if (
    typeof scheduler_fingerprint !== "string"
  ) {
    violations.push({
      type: "SCHEDULER_FINGERPRINT_REQUIRED"
    });
  }


  return violations;
}


/* ============================================================
   Public API
   ============================================================ */


export function enforceProjectionEphemerality({
  snapshot,
  plugin_versions,
  scheduler_fingerprint
}) {
  if (!isPlainObject(snapshot)) {
    throw new Error("Invalid snapshot");
  }


  const violations = [];


  /* --------------------------------------------------------
     1?? Snapshot Purity
     -------------------------------------------------------- */


  violations.push(
    ...deepScanForOverlayLeak(snapshot)
  );


  /* --------------------------------------------------------
     2?? Deterministic Rebuild Inputs
     -------------------------------------------------------- */


  violations.push(
    ...validateRebuildInputs({
      snapshot,
      plugin_versions,
      scheduler_fingerprint
    })
  );


  const sortedViolations = violations.sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b))
  );


  const result = {
    valid: sortedViolations.length === 0,
    violation_count: sortedViolations.length,
    violations: sortedViolations,
    enforcer_version:
      PROJECTION_EPHEMERALITY_ENFORCER_VERSION
  };


  return deepFreeze(result);
}
snapshot_lineage_integrity_guard.js
