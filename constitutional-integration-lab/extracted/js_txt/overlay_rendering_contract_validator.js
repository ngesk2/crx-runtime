overlay_rendering_contract_validator.js
/* ============================================================
   overlay_rendering_contract_validator.js
   ------------------------------------------------------------
   UI Authority-Neutral Rendering Constitution


   Version: overlay_rendering_contract_validator.3.0


   Guarantees:
   - No authority-implying semantics
   - No coercive interaction patterns
   - No ranking or scoring surfaces
   - No urgency signaling
   - No automatic remediation
   - No psychological pressure UI
   - Deterministic deep validation
   - Immutable advisory result
   ============================================================ */


export const OVERLAY_RENDERING_CONTRACT_VERSION =
  "overlay_rendering_contract_validator.3.0";


/* ============================================================
   Utilities
   ============================================================ */


function assert(condition, message) {
  if (!condition) throw new Error(message);
}


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
   Rendering Constitution Model
   ============================================================ */


/* -------------------------------
   Explicitly Allowed Primitives
-------------------------------- */


const ALLOWED_RENDER_PRIMITIVES = new Set([
  "soft_underline",
  "neutral_dotted_underline",
  "subtle_highlight",
  "click_to_expand",
  "manual_apply_only",
  "per_suggestion_apply",
  "plugin_visibility_toggle",
  "layer_toggle",
  "ephemeral_overlay",
  "non_ranked_display"
]);


/* -------------------------------
   Prohibited Visual Semantics
-------------------------------- */


const FORBIDDEN_COLOR_SEMANTICS = [
  "red",
  "crimson",
  "error_red",
  "danger",
  "critical",
  "alert"
];


/* -------------------------------
   Prohibited Behavioral Patterns
-------------------------------- */


const FORBIDDEN_BEHAVIOR = [
  "auto_scroll",
  "auto_focus",
  "auto_expand",
  "auto_apply",
  "global_fix_all",
  "batch_apply",
  "force_modal",
  "blocking_overlay",
  "non_dismissible",
  "collapse_by_default",
  "forced_highlight"
];


/* -------------------------------
   Prohibited Authority Semantics
-------------------------------- */


const FORBIDDEN_AUTHORITY_SEMANTICS = [
  "severity",
  "priority",
  "rank",
  "ranking",
  "score",
  "confidence_meter",
  "grade",
  "quality_index",
  "progress_bar",
  "heatmap",
  "aggregate_score",
  "error_badge",
  "warning_icon",
  "critical_icon",
  "verdict"
];


/* ============================================================
   Deep Scan Engine
   ============================================================ */


function deepScan(obj, path = "") {
  const violations = [];


  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return violations;
  }


  const keys = Object.keys(obj).sort();


  for (const key of keys) {
    const fullPath = path ? `${path}.${key}` : key;


    /* ---------------------------------------------
       Forbidden color semantics
    ---------------------------------------------- */
    if (FORBIDDEN_COLOR_SEMANTICS.includes(key)) {
      violations.push({
        type: "FORBIDDEN_COLOR_SEMANTIC",
        field: fullPath
      });
    }


    /* ---------------------------------------------
       Forbidden behavioral flags
    ---------------------------------------------- */
    if (FORBIDDEN_BEHAVIOR.includes(key)) {
      violations.push({
        type: "FORBIDDEN_BEHAVIOR_PATTERN",
        field: fullPath
      });
    }


    /* ---------------------------------------------
       Forbidden authority semantics
    ---------------------------------------------- */
    if (FORBIDDEN_AUTHORITY_SEMANTICS.includes(key)) {
      violations.push({
        type: "FORBIDDEN_AUTHORITY_UI_SEMANTIC",
        field: fullPath
      });
    }


    const value = obj[key];


    /* ---------------------------------------------
       Disallowed rendering primitive
    ---------------------------------------------- */
    if (key === "render_primitive") {
      if (!ALLOWED_RENDER_PRIMITIVES.has(value)) {
        violations.push({
          type: "INVALID_RENDER_PRIMITIVE",
          field: fullPath,
          value
        });
      }
    }


    /* ---------------------------------------------
       Prohibited sort models
    ---------------------------------------------- */
    if (key === "sort_by") {
      if (["severity", "priority", "score"].includes(value)) {
        violations.push({
          type: "RANKED_SORT_PROHIBITED",
          field: fullPath
        });
      }
    }


    /* ---------------------------------------------
       Default expansion coercion
    ---------------------------------------------- */
    if (key === "default_expanded" && value === true) {
      violations.push({
        type: "DEFAULT_EXPANSION_PROHIBITED",
        field: fullPath
      });
    }


    /* ---------------------------------------------
       Error marker enforcement
    ---------------------------------------------- */
    if (key === "show_error_marker" && value === true) {
      violations.push({
        type: "ERROR_MARKER_PROHIBITED",
        field: fullPath
      });
    }


    if (
      isPlainObject(value) ||
      Array.isArray(value)
    ) {
      violations.push(
        ...deepScan(value, fullPath)
      );
    }
  }


  return violations;
}


/* ============================================================
   Cross-Field Invariant Enforcement
   ============================================================ */


function validateCrossFieldInvariants(config) {
  const violations = [];


  /* No aggregate counts implying deficiency */
  if (
    config.show_total_issues === true
  ) {
    violations.push({
      type: "AGGREGATE_ISSUE_COUNT_PROHIBITED"
    });
  }


  /* No auto-scroll to first suggestion */
  if (
    config.auto_scroll_to_first === true
  ) {
    violations.push({
      type: "AUTO_SCROLL_TO_FIRST_PROHIBITED"
    });
  }


  /* No global fix capability */
  if (
    config.global_fix_all === true
  ) {
    violations.push({
      type: "GLOBAL_FIX_ALL_PROHIBITED"
    });
  }


  /* No auto-apply capability */
  if (
    config.auto_apply === true
  ) {
    violations.push({
      type: "AUTO_APPLY_PROHIBITED"
    });
  }


  /* Must explicitly declare non-ranked ordering */
  if (
    config.display_mode &&
    config.display_mode !== "non_ranked_display"
  ) {
    violations.push({
      type: "DISPLAY_MODE_MUST_BE_NON_RANKED"
    });
  }


  return violations;
}


/* ============================================================
   Main Contract Validator
   ============================================================ */


export function validateOverlayRenderingContract(
  uiConfiguration
) {
  assert(
    isPlainObject(uiConfiguration),
    "UI configuration must be plain object"
  );


  const violations = [];


  /* --------------------------------------------------------
     Deep Structural Scan
  --------------------------------------------------------- */


  violations.push(
    ...deepScan(uiConfiguration)
  );


  /* --------------------------------------------------------
     Cross-field invariants
  --------------------------------------------------------- */


  violations.push(
    ...validateCrossFieldInvariants(
      uiConfiguration
    )
  );


  /* --------------------------------------------------------
     Deterministic ordering
  --------------------------------------------------------- */


  const sortedViolations = violations.sort((a, b) =>
    JSON.stringify(a).localeCompare(
      JSON.stringify(b)
    )
  );


  const result = {
    valid: sortedViolations.length === 0,
    violation_count: sortedViolations.length,
    violations: sortedViolations,
    contract_version:
      OVERLAY_RENDERING_CONTRACT_VERSION
  };


  return deepFreeze(result);
}
artifact_firewall.js
