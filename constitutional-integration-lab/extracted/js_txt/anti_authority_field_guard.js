anti_authority_field_guard.js
/* ============================================================
   anti_authority_field_guard.js
   ------------------------------------------------------------
   Authority Containment Firewall


   Version: anti_authority_field_guard.2.0


   Guarantees:
   - Recursive deep scan
   - Deterministic violation ordering
   - Explicit authority field detection
   - Implicit evaluative field detection
   - Composite metric detection
   - Ranking & aggregation detection
   - Statistical authority detection
   - Prototype pollution detection
   - No mutation
   - Immutable advisory result
   ============================================================ */


export const ANTI_AUTHORITY_FIELD_GUARD_VERSION =
  "anti_authority_field_guard.2.0";


/* ============================================================
   Forbidden Authority Patterns
   ============================================================ */


const EXPLICIT_AUTHORITY_PATTERNS = [
  /score/i,
  /confidence/i,
  /rating/i,
  /grade/i,
  /percentile/i,
  /severity/i,
  /rank/i,
  /ranking/i,
  /overall/i,
  /assessment/i,
  /evaluation/i,
  /quality/i,
  /strength/i,
  /weakness/i,
  /verdict/i,
  /judgment/i,
  /accuracy/i,
  /correctness/i
];


const STATISTICAL_AUTHORITY_PATTERNS = [
  /probability/i,
  /likelihood/i,
  /mean/i,
  /median/i,
  /variance/i,
  /std/i,
  /distribution/i,
  /confidence_interval/i,
  /zscore/i,
  /pvalue/i
];


const AGGREGATE_METRIC_PATTERNS = [
  /composite/i,
  /aggregate/i,
  /total_score/i,
  /final_score/i,
  /normalized/i,
  /weighted/i,
  /index/i
];


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
   Composite Numeric Authority Detector
   ============================================================ */


function detectSuspiciousNumericCluster(obj, path) {
  const numericKeys = Object.keys(obj).filter(
    key => typeof obj[key] === "number"
  );


  if (numericKeys.length >= 3) {
    return {
      type: "NUMERIC_CLUSTER_AUTHORITY_PATTERN",
      path,
      numeric_field_count: numericKeys.length
    };
  }


  return null;
}


/* ============================================================
   Deep Authority Scanner
   ============================================================ */


function deepScanForAuthority(value) {
  const violations = [];
  const visited = new WeakSet();


  function scan(node, path = "") {
    if (node === null) return;
    if (typeof node !== "object") return;
    if (visited.has(node)) return;


    visited.add(node);


    if (!isPlainObject(node) && !Array.isArray(node)) {
      violations.push({
        type: "NON_PLAIN_OBJECT_DETECTED",
        path
      });
      return;
    }


    const keys = Object.keys(node).sort();


    /* --------------------------------------------------------
       Composite numeric metric detection
       -------------------------------------------------------- */
    if (isPlainObject(node)) {
      const cluster = detectSuspiciousNumericCluster(
        node,
        path
      );
      if (cluster) {
        violations.push(cluster);
      }
    }


    for (const key of keys) {
      const fullPath = path ? `${path}.${key}` : key;


      /* ------------------------------------------------------
         Explicit authority field detection
         ------------------------------------------------------ */
      for (const pattern of EXPLICIT_AUTHORITY_PATTERNS) {
        if (pattern.test(key)) {
          violations.push({
            type: "EXPLICIT_AUTHORITY_FIELD",
            field: fullPath
          });
        }
      }


      /* ------------------------------------------------------
         Statistical authority detection
         ------------------------------------------------------ */
      for (const pattern of STATISTICAL_AUTHORITY_PATTERNS) {
        if (pattern.test(key)) {
          violations.push({
            type: "STATISTICAL_AUTHORITY_FIELD",
            field: fullPath
          });
        }
      }


      /* ------------------------------------------------------
         Aggregate metric detection
         ------------------------------------------------------ */
      for (const pattern of AGGREGATE_METRIC_PATTERNS) {
        if (pattern.test(key)) {
          violations.push({
            type: "AGGREGATE_METRIC_FIELD",
            field: fullPath
          });
        }
      }


      const val = node[key];


      /* ------------------------------------------------------
         Confidence-like numeric scalar detection
         ------------------------------------------------------ */
      if (
        typeof val === "number" &&
        val >= 0 &&
        val <= 1 &&
        /confidence|prob|likelihood/i.test(key)
      ) {
        violations.push({
          type: "CONFIDENCE_SCALAR_DETECTED",
          field: fullPath
        });
      }


      /* ------------------------------------------------------
         Nested scan
         ------------------------------------------------------ */
      scan(val, fullPath);
    }
  }


  scan(value);
  return violations;
}


/* ============================================================
   Public API
   ============================================================ */


export function validateNoAuthorityFields(payload) {
  const violations = deepScanForAuthority(payload);


  const sortedViolations = violations.sort((a, b) => {
    const aKey = `${a.type}:${a.field || a.path || ""}`;
    const bKey = `${b.type}:${b.field || b.path || ""}`;
    return aKey.localeCompare(bKey);
  });


  const result = {
    valid: sortedViolations.length === 0,
    violation_count: sortedViolations.length,
    violations: sortedViolations,
    guard_version:
      ANTI_AUTHORITY_FIELD_GUARD_VERSION
  };


  return deepFreeze(result);
}
overlay_rendering_contract_validator.js
