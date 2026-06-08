artifact_reversibility_validator.js
/* ============================================================
   artifact_reversibility_validator.js
   ------------------------------------------------------------
   Micro-Adjustment Reversibility Proof Layer


   Version: artifact_reversibility_validator.2.0


   Guarantees:
   - Byte-exact reversibility
   - No whitespace normalization
   - No Unicode normalization drift
   - Span-isolated mutation
   - No cascade outside span
   - Structural node alignment validation
   - Deterministic validation
   - Immutable advisory result
   ============================================================ */


export const ARTIFACT_REVERSIBILITY_VALIDATOR_VERSION =
  "artifact_reversibility_validator.2.0";


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
   Strict Byte Comparator
   ============================================================ */


function byteExactEqual(a, b) {
  return a.length === b.length && a === b;
}


/* ============================================================
   Zero-Width / Hidden Character Guard
   ============================================================ */


const ZERO_WIDTH_PATTERN = /[\u200B-\u200F\uFEFF]/;


function detectHiddenCharacters(str) {
  return ZERO_WIDTH_PATTERN.test(str);
}


/* ============================================================
   Span Validation
   ============================================================ */


function validateSpan(span, documentLength) {
  if (
    !span ||
    !Number.isInteger(span.start) ||
    !Number.isInteger(span.end)
  ) {
    return { type: "INVALID_SPAN_STRUCTURE" };
  }


  if (span.start < 0 || span.end < 0) {
    return { type: "NEGATIVE_SPAN_INDEX" };
  }


  if (span.start > span.end) {
    return { type: "SPAN_START_GT_END" };
  }


  if (span.end > documentLength) {
    return { type: "SPAN_EXCEEDS_DOCUMENT_LENGTH" };
  }


  if (span.start === span.end) {
    return { type: "ZERO_LENGTH_SPAN_NOT_ALLOWED" };
  }


  return null;
}


/* ============================================================
   Structural Node Binding Check
   ============================================================ */


function validateNodeBinding(
  structuralGraph,
  structural_node_id,
  span
) {
  const node = structuralGraph.nodes.find(
    n => n.node_id === structural_node_id
  );


  if (!node) {
    return { type: "STRUCTURAL_NODE_NOT_FOUND" };
  }


  if (
    span.start !== node.span.start ||
    span.end !== node.span.end
  ) {
    return {
      type: "SPAN_MUST_MATCH_STRUCTURAL_NODE_EXACTLY"
    };
  }


  return null;
}


/* ============================================================
   Pure Forward Simulation
   ============================================================ */


function simulateApply(document_text, span, replacement) {
  const before = document_text.slice(0, span.start);
  const after = document_text.slice(span.end);
  return before + replacement + after;
}


/* ============================================================
   Pure Reverse Simulation
   ============================================================ */


function simulateRevert(
  appliedText,
  span,
  originalSubstring,
  replacementLength
) {
  const before = appliedText.slice(0, span.start);
  const after = appliedText.slice(
    span.start + replacementLength
  );
  return before + originalSubstring + after;
}


/* ============================================================
   Main Validator
   ============================================================ */


export function validateArtifactReversibility({
  suggestionArtifact,
  document_text,
  structuralGraph
}) {
  const violations = [];


  /* --------------------------------------------------------
     Basic Type Guards
     -------------------------------------------------------- */


  assert(
    isPlainObject(suggestionArtifact),
    "suggestionArtifact must be plain object"
  );


  assert(
    typeof document_text === "string",
    "document_text must be string"
  );


  assert(
    isPlainObject(structuralGraph),
    "structuralGraph must be plain object"
  );


  const {
    span,
    replacement_text,
    structural_node_id
  } = suggestionArtifact;


  /* --------------------------------------------------------
     Span Validation
     -------------------------------------------------------- */


  const spanViolation = validateSpan(
    span,
    document_text.length
  );
  if (spanViolation) violations.push(spanViolation);


  /* --------------------------------------------------------
     Structural Binding Validation
     -------------------------------------------------------- */


  const nodeViolation = validateNodeBinding(
    structuralGraph,
    structural_node_id,
    span
  );
  if (nodeViolation) violations.push(nodeViolation);


  /* --------------------------------------------------------
     Replacement Validation
     -------------------------------------------------------- */


  if (typeof replacement_text !== "string") {
    violations.push({
      type: "REPLACEMENT_TEXT_NOT_STRING"
    });
  }


  if (detectHiddenCharacters(replacement_text)) {
    violations.push({
      type: "HIDDEN_CHARACTER_DETECTED_IN_REPLACEMENT"
    });
  }


  /* --------------------------------------------------------
     Extract Original Substring
     -------------------------------------------------------- */


  const originalSubstring =
    document_text.slice(span.start, span.end);


  if (detectHiddenCharacters(originalSubstring)) {
    violations.push({
      type: "HIDDEN_CHARACTER_IN_ORIGINAL"
    });
  }


  /* --------------------------------------------------------
     Forward Simulation
     -------------------------------------------------------- */


  const appliedText = simulateApply(
    document_text,
    span,
    replacement_text
  );


  /* --------------------------------------------------------
     Outside Span Invariance Check
     -------------------------------------------------------- */


  const beforeOriginal =
    document_text.slice(0, span.start);
  const afterOriginal =
    document_text.slice(span.end);


  const beforeApplied =
    appliedText.slice(0, span.start);
  const afterApplied =
    appliedText.slice(
      span.start + replacement_text.length
    );


  if (!byteExactEqual(beforeOriginal, beforeApplied)) {
    violations.push({
      type: "MUTATION_BEFORE_SPAN"
    });
  }


  if (!byteExactEqual(afterOriginal, afterApplied)) {
    violations.push({
      type: "MUTATION_AFTER_SPAN"
    });
  }


  /* --------------------------------------------------------
     Reverse Simulation
     -------------------------------------------------------- */


  const revertedText = simulateRevert(
    appliedText,
    span,
    originalSubstring,
    replacement_text.length
  );


  /* --------------------------------------------------------
     Byte-Exact Equality Check
     -------------------------------------------------------- */


  if (!byteExactEqual(revertedText, document_text)) {
    violations.push({
      type: "REVERSIBILITY_FAILURE"
    });
  }


  /* --------------------------------------------------------
     No Length Drift Guard
     -------------------------------------------------------- */


  const expectedLength =
    document_text.length -
    originalSubstring.length +
    replacement_text.length;


  if (appliedText.length !== expectedLength) {
    violations.push({
      type: "LENGTH_DRIFT_DETECTED"
    });
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
    validator_version:
      ARTIFACT_REVERSIBILITY_VALIDATOR_VERSION
  };


  return deepFreeze(result);
}




author_projection_boundary_validator.js
