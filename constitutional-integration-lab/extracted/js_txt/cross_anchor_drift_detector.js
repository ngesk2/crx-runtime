cross_anchor_drift_detector.js
/******************************************************************************
 * PATCH-069
 * CROSS-ANCHOR DRIFT DETECTOR
 * MODULE: cross_anchor_drift_detector.js
 *
 * ROLE
 * ----
 * Detect mechanical drift across multiple Merkle anchor evidences.
 *
 * This module:
 *   - Compares anchor ? anchor (N-way)
 *   - Detects divergence, replay, and structural inconsistency
 *   - Emits drift signals ONLY
 *
 * This module:
 *   - NEVER validates anchors as true
 *   - NEVER trusts external systems
 *   - NEVER assigns authority or correctness
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const CROSS_ANCHOR_DRIFT_SCHEMA = "merkle.anchor.cross_drift";
const CROSS_ANCHOR_DRIFT_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * detectCrossAnchorDrift(anchors)
 *
 * @param {Array<Object>} anchors - merkle anchor evidence artifacts
 * @returns {Object} cross-anchor drift report
 */
function detectCrossAnchorDrift(anchors) {
  const signals = [];


  if (!Array.isArray(anchors) || anchors.length < 2) {
    return buildReport(
      signals,
      "insufficient_anchors"
    );
  }


  const indexed = indexAnchors(anchors);


  detectRootDivergence(indexed, signals);
  detectReplay(indexed, signals);
  detectStructuralInconsistency(indexed, signals);


  return buildReport(signals);
}


/* =============================================================================
 * DRIFT DETECTION
 * ========================================================================== */


function detectRootDivergence(indexed, signals) {
  const roots = Object.create(null);


  Object.values(indexed).forEach(a => {
    const root = a.merkle_root || "__missing__";
    roots[root] = (roots[root] || 0) + 1;
  });


  const distinctRoots = Object.keys(roots);


  if (distinctRoots.length > 1) {
    signals.push(signal(
      "merkle_root_divergence",
      "Different Merkle roots observed across anchors",
      {
        roots: roots
      }
    ));
  }
}


function detectReplay(indexed, signals) {
  const seen = Object.create(null);


  Object.values(indexed).forEach(a => {
    const fp = a.anchor_fingerprint;
    if (!fp) return;


    if (seen[fp]) {
      signals.push(signal(
        "anchor_replayed",
        "Identical anchor fingerprint observed multiple times",
        { anchor_fingerprint: fp }
      ));
    } else {
      seen[fp] = true;
    }
  });
}


function detectStructuralInconsistency(indexed, signals) {
  const leafCounts = Object.create(null);


  Object.values(indexed).forEach(a => {
    const c =
      typeof a.leaf_count === "number"
        ? a.leaf_count
        : "__missing__";


    leafCounts[c] = (leafCounts[c] || 0) + 1;
  });


  const distinctCounts = Object.keys(leafCounts);


  if (distinctCounts.length > 1) {
    signals.push(signal(
      "leaf_count_inconsistent",
      "Inconsistent leaf counts across anchors",
      { leaf_counts: leafCounts }
    ));
  }
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function indexAnchors(anchors) {
  const map = Object.create(null);


  anchors.forEach((a, i) => {
    map[a.anchor_fingerprint || `__anon_${i}`] = a || {};
  });


  return map;
}


function signal(code, message, evidence = null) {
  return {
    code,
    message,
    evidence,
    declaredNonAuthoritative: true
  };
}


function buildReport(signals, note = null) {
  const report = {
    schema: CROSS_ANCHOR_DRIFT_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_VERSION,


    signals,
    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) report.note = note;


  report.drift_fingerprint = stableFingerprint(report);
  return report;
}


/* =============================================================================
 * HASHING (CANONICAL)
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
 * INVARIANTS
 * ========================================================================== */


const CROSS_ANCHOR_DRIFT_INVARIANTS = Object.freeze({
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    trustAnchors: true,
    rankRoots: true,
    resolveTruth: true,
    blockExecution: true
  }
});


/* =============================================================================
 * END OF cross_anchor_drift_detector.js
 * ========================================================================== */
cross_anchor_drift_misuse_tests.js
