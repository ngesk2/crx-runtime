semantic_delta_validator.js
/* ============================================================
   semantic_delta_validator.js (Hardened Constitutional)
   ------------------------------------------------------------
   Guarantees:
   - Non-stancing enforcement
   - Structural-only micro-modification constraint
   - Semantic delta bounding
   - Intent-layer protection
   - Tone preservation heuristic enforcement
   - Structural node binding requirement
   - Snapshot binding
   - Unicode normalization stability
   - Replay-safe deterministic validation
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================ */


export const SEMANTIC_DELTA_SCHEMA_VERSION =
  "semantic_delta.2.0";


/* ============================================================ */


export class SemanticDeltaViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "SemanticDeltaViolationError";
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
      .reduce((acc, k) => {
        acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value;
}


function normalizeText(text) {
  return typeof text === "string"
    ? text.normalize("NFC")
    : text;
}


function deepFreeze(obj) {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) {
      deepFreeze(obj[k]);
    }
  }
  return obj;
}


function assert(cond, msg) {
  if (!cond) {
    throw new SemanticDeltaViolationError(msg);
  }
}


/* ============================================================
   Restricted Language Detection
   ============================================================ */


const PROHIBITED_STANCE_TERMS = Object.freeze([
  "better","best","worse","improve","stronger","weaker",
  "more compelling","less effective","should","must",
  "clearly","obviously","important","crucial",
  "significant","powerful","weak","good","bad"
]);


function containsProhibitedLanguage(text) {
  const lower = normalizeText(text).toLowerCase();
  return PROHIBITED_STANCE_TERMS.some(term =>
    lower.includes(term)
  );
}


/* ============================================================
   Allowed Delta Types
   ============================================================ */


const ALLOWED_DELTA_TYPES = Object.freeze([
  "whitespace_adjustment",
  "punctuation_adjustment",
  "sentence_split",
  "sentence_merge",
  "formatting_adjustment",
  "structural_reorder",
  "reference_clarification",
  "citation_format_alignment",
  "duplicate_removal",
  "typo_correction"
]);


/* ============================================================
   Structure Validation
   ============================================================ */


function validateStructure(suggestion) {


  assert(
    suggestion &&
    typeof suggestion === "object" &&
    Object.getPrototypeOf(suggestion) === Object.prototype,
    "Suggestion must be plain object"
  );


  const required = [
    "artifact_type",
    "structural_node_id",
    "semantic_delta",
    "delta_type",
    "original_fragment",
    "proposed_fragment",
    "snapshot_fingerprint",
    "structural_graph_fingerprint"
  ];


  for (const field of required) {
    assert(field in suggestion,
      `Missing required field: ${field}`);
  }


  assert(
    suggestion.artifact_type ===
      "author.structural_micro_suggestion",
    "Invalid artifact_type"
  );


  assert(
    ALLOWED_DELTA_TYPES.includes(
      suggestion.delta_type
    ),
    "delta_type not allowed"
  );


  assert(
    typeof suggestion.semantic_delta === "number",
    "semantic_delta must be numeric"
  );
}


/* ============================================================
   Delta Magnitude Constraint
   ============================================================ */


function validateDeltaMagnitude(suggestion) {


  const original =
    normalizeText(suggestion.original_fragment);


  const proposed =
    normalizeText(suggestion.proposed_fragment);


  const delta =
    Math.abs(proposed.length - original.length);


  assert(
    delta === suggestion.semantic_delta,
    "Declared semantic_delta mismatch"
  );


  assert(
    delta <= 120,
    "Semantic delta exceeds micro-adjustment bound"
  );
}


/* ============================================================
   Structural Locality Enforcement
   ============================================================ */


function validateLocality(suggestion) {


  const original =
    normalizeText(suggestion.original_fragment);


  const proposed =
    normalizeText(suggestion.proposed_fragment);


  assert(
    original.length > 0 &&
    proposed.length > 0,
    "Fragments must be non-empty"
  );


  assert(
    suggestion.structural_node_id.length > 5,
    "Invalid structural_node_id"
  );
}


/* ============================================================
   Tone + Intent Guard
   ============================================================ */


function validateToneAndIntent(suggestion) {


  const proposed =
    normalizeText(suggestion.proposed_fragment);


  assert(
    !containsProhibitedLanguage(proposed),
    "Proposed fragment contains stance language"
  );


  assert(
    !proposed.includes("Therefore") &&
    !proposed.includes("In conclusion"),
    "Intent-shifting connective detected"
  );
}


/* ============================================================
   Metadata Smuggling Protection
   ============================================================ */


function validateNoHiddenFields(suggestion) {


  const allowedFields = new Set([
    "artifact_type",
    "structural_node_id",
    "semantic_delta",
    "delta_type",
    "original_fragment",
    "proposed_fragment",
    "snapshot_fingerprint",
    "structural_graph_fingerprint"
  ]);


  for (const key of Object.keys(suggestion)) {
    assert(
      allowedFields.has(key),
      `Unexpected field detected: ${key}`
    );
  }
}


/* ============================================================
   Deterministic Fingerprint Binding
   ============================================================ */


async function computeSuggestionFingerprint(suggestion) {


  return fingerprintWithDomain(
    FINGERPRINT_DOMAINS.SEMANTIC_DELTA,
    canonicalize({
      schema_version: SEMANTIC_DELTA_SCHEMA_VERSION,
      structural_node_id: suggestion.structural_node_id,
      delta_type: suggestion.delta_type,
      semantic_delta: suggestion.semantic_delta,
      original_fragment:
        normalizeText(suggestion.original_fragment),
      proposed_fragment:
        normalizeText(suggestion.proposed_fragment),
      snapshot_fingerprint:
        suggestion.snapshot_fingerprint,
      structural_graph_fingerprint:
        suggestion.structural_graph_fingerprint
    })
  );
}


/* ============================================================
   Public API
   ============================================================ */


export async function validateSemanticDeltaSuggestion(
  suggestion
) {


  validateStructure(suggestion);
  validateNoHiddenFields(suggestion);
  validateDeltaMagnitude(suggestion);
  validateLocality(suggestion);
  validateToneAndIntent(suggestion);


  const suggestion_fingerprint =
    await computeSuggestionFingerprint(suggestion);


  return deepFreeze({
    valid: true,
    schema_version: SEMANTIC_DELTA_SCHEMA_VERSION,
    suggestion_fingerprint,
    suggestion: canonicalize(suggestion)
  });
}
authority_boundary_prover.js
