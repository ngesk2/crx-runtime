cross_anchor_drift_summary.js
/******************************************************************************
 * PATCH-071
 * CROSS-ANCHOR DRIFT SUMMARY (HUMAN-FACING, ADVISORY)
 * MODULE: cross_anchor_drift_summary.js
 *
 * ROLE
 * ----
 * Translate cross-anchor drift reports into structured human-readable
 * summaries.
 *
 * This module:
 *   - NEVER recalculates drift
 *   - NEVER interprets correctness
 *   - NEVER assigns authority
 *   - NEVER suppresses signals
 *
 * It only converts machine signals ? narrative view artifacts.
 *
 * STATUS
 * ------
 * Human-Facing · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const CROSS_ANCHOR_DRIFT_SUMMARY_SCHEMA =
  "merkle.anchor.cross_drift.summary";
const CROSS_ANCHOR_DRIFT_SUMMARY_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * summarizeCrossAnchorDrift(driftReport)
 *
 * @param {Object} driftReport - output of detectCrossAnchorDrift()
 * @returns {Object} summary artifact
 */
function summarizeCrossAnchorDrift(driftReport) {
  if (!driftReport || typeof driftReport !== "object") {
    return buildSummary([], "invalid_input");
  }


  const signals = Array.isArray(driftReport.signals)
    ? driftReport.signals
    : [];


  const grouped = groupSignals(signals);


  const narrative = buildNarrative(grouped);


  const artifact = {
    schema: CROSS_ANCHOR_DRIFT_SUMMARY_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_SUMMARY_VERSION,


    source_drift_fingerprint:
      driftReport.drift_fingerprint || null,


    summary_counts: buildCounts(grouped),


    narrative,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.summary_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * GROUPING
 * ========================================================================== */


function groupSignals(signals) {
  const groups = {
    root_divergence: [],
    replay: [],
    leaf_mismatch: [],
    other: []
  };


  signals.forEach(s => {
    switch (s.code) {
      case "merkle_root_divergence":
        groups.root_divergence.push(s);
        break;


      case "anchor_replayed":
        groups.replay.push(s);
        break;


      case "leaf_count_inconsistent":
        groups.leaf_mismatch.push(s);
        break;


      default:
        groups.other.push(s);
    }
  });


  return groups;
}


/* =============================================================================
 * NARRATIVE BUILDER
 * ========================================================================== */


function buildNarrative(groups) {
  const lines = [];


  if (groups.root_divergence.length > 0) {
    lines.push(
      `${groups.root_divergence.length} Merkle root divergence event(s) detected.`
    );
  }


  if (groups.replay.length > 0) {
    lines.push(
      `${groups.replay.length} anchor replay occurrence(s) detected.`
    );
  }


  if (groups.leaf_mismatch.length > 0) {
    lines.push(
      `${groups.leaf_mismatch.length} leaf count inconsistency event(s) detected.`
    );
  }


  if (groups.other.length > 0) {
    lines.push(
      `${groups.other.length} additional drift signal(s) observed.`
    );
  }


  if (lines.length === 0) {
    lines.push("No cross-anchor drift signals detected.");
  }


  return lines;
}


/* =============================================================================
 * COUNTS
 * ========================================================================== */


function buildCounts(groups) {
  return {
    root_divergence: groups.root_divergence.length,
    replay: groups.replay.length,
    leaf_mismatch: groups.leaf_mismatch.length,
    other: groups.other.length,
    total:
      groups.root_divergence.length +
      groups.replay.length +
      groups.leaf_mismatch.length +
      groups.other.length
  };
}


/* =============================================================================
 * SUMMARY BUILDER
 * ========================================================================== */


function buildSummary(signals, note = null) {
  const artifact = {
    schema: CROSS_ANCHOR_DRIFT_SUMMARY_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_SUMMARY_VERSION,


    source_drift_fingerprint: null,
    summary_counts: { total: 0 },
    narrative: ["Unable to summarize drift."],


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.summary_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const CROSS_ANCHOR_DRIFT_SUMMARY_INVARIANTS = Object.freeze({
  humanFacing: true,
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    recalculateDrift: true,
    suppressSignals: true,
    rankSeverity: true,
    inferTrust: true,
    mutateSource: true
  }
});


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
 * END OF cross_anchor_drift_summary.js
 * ========================================================================== */


cross_anchor_drift_summary_misuse_tests.js
