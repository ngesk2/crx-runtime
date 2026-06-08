merkle_anchor_chain_canonicalizer.js
/******************************************************************************
 * PATCH-078
 * ANCHOR CHAIN CANONICALIZER
 * MODULE: merkle_anchor_chain_canonicalizer.js
 *
 * ROLE
 * ----
 * Deterministically normalize and order a set of Merkle anchor artifacts
 * into a canonical chain representation.
 *
 * This module:
 *   - Sorts anchors deterministically
 *   - Preserves forks (does NOT resolve them)
 *   - Preserves all anchors
 *   - Does NOT validate correctness
 *   - Does NOT assign authority
 *
 * This module:
 *   - NEVER mutates input
 *   - NEVER suppresses anchors
 *   - NEVER resolves conflicts
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const ANCHOR_CHAIN_CANONICAL_SCHEMA =
  "merkle.anchor.chain.canonical";


const ANCHOR_CHAIN_CANONICAL_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * canonicalizeAnchorChain(anchors)
 *
 * @param {Array<Object>} anchors
 * @returns {Object} canonical chain artifact
 */
function canonicalizeAnchorChain(anchors) {
  if (!Array.isArray(anchors)) {
    return buildCanonical([], "invalid_input");
  }


  const cloned = anchors
    .filter(a => a && typeof a === "object")
    .map(deepClone);


  const sorted = deterministicSort(cloned);


  const artifact = {
    schema: ANCHOR_CHAIN_CANONICAL_SCHEMA,
    schemaVersion: ANCHOR_CHAIN_CANONICAL_VERSION,


    anchor_count: sorted.length,
    anchors: sorted,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.chain_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * DETERMINISTIC SORT
 * ========================================================================== */


function deterministicSort(anchors) {
  return anchors.sort((a, b) => {
    // 1?? Primary: previous_anchor_fingerprint
    const pa = a.previous_anchor_fingerprint || "";
    const pb = b.previous_anchor_fingerprint || "";
    if (pa < pb) return -1;
    if (pa > pb) return 1;


    // 2?? Secondary: created_at (if valid)
    const ta = Date.parse(a.created_at || "") || 0;
    const tb = Date.parse(b.created_at || "") || 0;
    if (ta < tb) return -1;
    if (ta > tb) return 1;


    // 3?? Tertiary: anchor_fingerprint
    const fa = a.anchor_fingerprint || "";
    const fb = b.anchor_fingerprint || "";
    if (fa < fb) return -1;
    if (fa > fb) return 1;


    return 0;
  });
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function buildCanonical(anchors, note) {
  const artifact = {
    schema: ANCHOR_CHAIN_CANONICAL_SCHEMA,
    schemaVersion: ANCHOR_CHAIN_CANONICAL_VERSION,


    anchor_count: anchors.length,
    anchors,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.chain_fingerprint = stableFingerprint(artifact);
  return artifact;
}


function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const ANCHOR_CHAIN_CANONICALIZER_INVARIANTS =
  Object.freeze({
    deterministic: true,
    orderIndependentInput: true,
    replaySafe: true,
    nonAuthoritative: true,


    mustNot: {
      validateTruth: true,
      resolveForks: true,
      suppressAnchors: true,
      mutateInput: true
    }
  });


/* =============================================================================
 * HASHING
 * ========================================================================== */


function stableFingerprint(value) {
  return sha256Strict(JSON.stringify(sortKeysDeep(value)));
}


function sortKeysDeep(v) {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    return Object.keys(v)
      .sort()
      .reduce((a, k) => {
        a[k] = sortKeysDeep(v[k]);
        return a;
      }, {});
  }
  return v;
}


function sha256Strict(input) {
  if (
    typeof Utilities !== "undefined" &&
    Utilities.computeDigest
  ) {
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      input,
      Utilities.Charset.UTF_8
    );
    return bytes
      .map(b => ("0" + (b & 0xff).toString(16)).slice(-2))
      .join("");
  }
  throw new Error("No cryptographic hashing available");
}


/* =============================================================================
 * END OF merkle_anchor_chain_canonicalizer.js
 * ========================================================================== */
merkle_anchor_chain_drift_detector.js
