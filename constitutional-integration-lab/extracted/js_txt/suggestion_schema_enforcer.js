suggestion_schema_enforcer.js
/* ============================================================
   suggestion_schema_enforcer.js
   ------------------------------------------------------------
   Constitutional Suggestion Enforcement Engine


   Guarantees:
   - Strict SuggestionArtifact schema enforcement
   - Micro-adjustment only (mechanical_only | surface_only)
   - No authority leakage (deep recursive scan)
   - Structural binding validation
   - Exact reversibility enforcement
   - Canonical JSON purity
   - Snapshot fingerprint binding
   - Deep freeze on success


   Deterministic rejection on any violation.
   ============================================================ */


import { canonicalize } from "../core/canonical_fingerprint_service.js";


/* ============================================================
   CONSTANTS
   ============================================================ */


const ALLOWED_SEMANTIC_DELTAS = new Set([
  "mechanical_only",
  "surface_only"
]);


const FORBIDDEN_FIELDS = new Set([
  "confidence",
  "probability",
  "score",
  "rating",
  "severity",
  "severity_level",
  "overall_assessment",
  "grade",
  "percentile",
  "ranking",
  "composite_index"
]);


const REQUIRED_FIELDS = [
  "artifact_type",
  "snapshot_fingerprint",
  "structural_node_id",
  "span",
  "semantic_delta",
  "replacement_text",
  "minimal_span",
  "reversible",
  "declaredNonAuthoritative"
];


/* ============================================================
   Utility Guards
   ============================================================ */


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function deepFreeze(obj) {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return obj;
  Object.freeze(obj);
  Object.getOwnPropertyNames(obj).forEach((prop) => {
    if (
      obj[prop] &&
      typeof obj[prop] === "object" &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  return obj;
}


function deepAuthorityScan(obj, path = "") {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return;


  const entries = Array.isArray(obj)
    ? obj.entries()
    : Object.entries(obj);


  for (const [key, value] of entries) {
    const field = Array.isArray(obj) ? null : key;


    if (field && FORBIDDEN_FIELDS.has(field)) {
      throw new Error(
        `Authority field detected: "${field}" at path "${path}"`
      );
    }


    if (typeof value === "object" && value !== null) {
      deepAuthorityScan(
        value,
        path ? `${path}.${field || "[array]"}` : field || "[array]"
      );
    }
  }
}


/* ============================================================
   Structural Binding Validation
   ============================================================ */


function validateStructuralBinding(artifact, snapshot) {
  const node = snapshot.structural_graph.nodes.find(
    (n) => n.node_id === artifact.structural_node_id
  );


  if (!node) {
    throw new Error("Invalid structural_node_id.");
  }


  const { start, end } = artifact.span;


  if (start < node.span.start || end > node.span.end) {
    throw new Error(
      "Artifact span exceeds structural node bounds."
    );
  }
}


/* ============================================================
   Semantic Delta Enforcement
   ============================================================ */


function validateSemanticDelta(artifact) {
  if (!isPlainObject(artifact.semantic_delta)) {
    throw new Error("semantic_delta must be an object.");
  }


  const keys = Object.keys(artifact.semantic_delta);
  if (keys.length !== 1 || keys[0] !== "category") {
    throw new Error(
      "semantic_delta must contain only 'category'."
    );
  }


  const category = artifact.semantic_delta.category;


  if (!ALLOWED_SEMANTIC_DELTAS.has(category)) {
    throw new Error(
      `Invalid semantic_delta category: ${category}`
    );
  }
}


/* ============================================================
   Reversibility Enforcement
   ============================================================ */


function validateReversibility(artifact, snapshot) {
  const originalText = snapshot.document_text;
  const { start, end } = artifact.span;


  const before = originalText.slice(0, start);
  const target = originalText.slice(start, end);
  const after = originalText.slice(end);


  const applied = before + artifact.replacement_text + after;


  const reverted =
    applied.slice(0, start) +
    target +
    applied.slice(start + artifact.replacement_text.length);


  if (reverted !== originalText) {
    throw new Error("Reversibility violation detected.");
  }
}


/* ============================================================
   Canonical Purity Enforcement
   ============================================================ */


function validateCanonicalPurity(artifact) {
  try {
    canonicalize(artifact);
  } catch (err) {
    throw new Error(
      "Artifact not canonicalizable. Possibly contains unsupported types."
    );
  }
}


/* ============================================================
   Schema Enforcement
   ============================================================ */


function validateSchema(artifact, snapshot) {
  if (!isPlainObject(artifact)) {
    throw new Error("Artifact must be a plain object.");
  }


  for (const field of REQUIRED_FIELDS) {
    if (!(field in artifact)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }


  if (artifact.artifact_type !== "suggestion") {
    throw new Error("artifact_type must be 'suggestion'.");
  }


  if (artifact.snapshot_fingerprint !== snapshot.snapshot_fingerprint) {
    throw new Error(
      "snapshot_fingerprint mismatch."
    );
  }


  if (artifact.declaredNonAuthoritative !== true) {
    throw new Error(
      "declaredNonAuthoritative must be true."
    );
  }


  if (artifact.minimal_span !== true) {
    throw new Error("minimal_span must be true.");
  }


  if (artifact.reversible !== true) {
    throw new Error("reversible must be true.");
  }
}


/* ============================================================
   Public Entry
   ============================================================ */


export function enforceSuggestionArtifact({
  artifact,
  snapshot
}) {
  validateSchema(artifact, snapshot);
  validateSemanticDelta(artifact);
  validateStructuralBinding(artifact, snapshot);
  validateReversibility(artifact, snapshot);
  deepAuthorityScan(artifact);
  validateCanonicalPurity(artifact);


  return deepFreeze(artifact);
}
anti_authority_field_guard.js
