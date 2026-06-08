merkle_anchor_chain_validator.js
/******************************************************************************
 * PATCH-074
 * MERKLE ANCHOR CHAIN VALIDATOR
 * MODULE: merkle_anchor_chain_validator.js
 *
 * ROLE
 * ----
 * Validate structural coherence of a sequence of Merkle anchor artifacts.
 *
 * This module:
 *   - Verifies chronological ordering
 *   - Verifies parent ? child linkage continuity
 *   - Detects root hash forks
 *   - Detects replay within same chain
 *
 * This module:
 *   - NEVER mutates anchors
 *   - NEVER assigns correctness
 *   - NEVER blocks execution
 *   - NEVER injects authority
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const MERKLE_ANCHOR_CHAIN_REPORT_SCHEMA =
  "merkle.anchor.chain.validation.report";


const MERKLE_ANCHOR_CHAIN_REPORT_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * validateMerkleAnchorChain(anchors)
 *
 * @param {Array<Object>} anchors - ordered anchor artifacts
 * @returns {Object} advisory chain validation report
 */
function validateMerkleAnchorChain(anchors) {
  const signals = [];


  if (!Array.isArray(anchors)) {
    return buildReport(signals, "invalid_input");
  }


  if (anchors.length === 0) {
    return buildReport(signals, "empty_chain");
  }


  const seenRoots = new Set();
  const seenFingerprints = new Set();


  for (let i = 0; i < anchors.length; i++) {
    const current = anchors[i];


    if (!current || typeof current !== "object") {
      signals.push(signal(
        "invalid_anchor_shape",
        "Anchor is not a valid object",
        { index: i }
      ));
      continue;
    }


    const fp = current.anchor_fingerprint;
    const root = current.merkle_root;
    const parent = current.previous_anchor_fingerprint;


    // Duplicate fingerprint replay
    if (fp && seenFingerprints.has(fp)) {
      signals.push(signal(
        "anchor_replay_detected",
        "Anchor fingerprint appears multiple times",
        { anchor_fingerprint: fp }
      ));
    }


    if (fp) seenFingerprints.add(fp);


    // Root fork detection
    if (root && seenRoots.has(root)) {
      signals.push(signal(
        "root_reuse_detected",
        "Merkle root reused across chain",
        { merkle_root: root }
      ));
    }


    if (root) seenRoots.add(root);


    // Parent linkage validation
    if (i > 0) {
      const previous = anchors[i - 1];


      if (parent !== previous.anchor_fingerprint) {
        signals.push(signal(
          "broken_parent_link",
          "Anchor does not correctly reference previous anchor",
          {
            index: i,
            expected_parent: previous.anchor_fingerprint,
            actual_parent: parent
          }
        ));
      }
    }


    // Timestamp monotonicity check (advisory only)
    if (i > 0) {
      const prevTime = Date.parse(anchors[i - 1].created_at || "");
      const currTime = Date.parse(current.created_at || "");


      if (!isNaN(prevTime) && !isNaN(currTime)) {
        if (currTime < prevTime) {
          signals.push(signal(
            "timestamp_regression",
            "Anchor timestamp moved backward in chain",
            { index: i }
          ));
        }
      }
    }
  }


  return buildReport(signals);
}


/* =============================================================================
 * SIGNAL BUILDER
 * ========================================================================== */


function signal(code, message, evidence = null) {
  return {
    code,
    message,
    evidence,
    declaredNonAuthoritative: true
  };
}


/* =============================================================================
 * REPORT BUILDER
 * ========================================================================== */


function buildReport(signals, note = null) {
  const report = {
    schema: MERKLE_ANCHOR_CHAIN_REPORT_SCHEMA,
    schemaVersion: MERKLE_ANCHOR_CHAIN_REPORT_VERSION,


    signal_count: signals.length,
    signals,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) report.note = note;


  report.chain_report_fingerprint = stableFingerprint(report);
  return report;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const MERKLE_ANCHOR_CHAIN_VALIDATOR_INVARIANTS =
  Object.freeze({
    advisoryOnly: true,
    replaySafe: true,
    appendOnly: true,
    nonAuthoritative: true,


    mustNot: {
      mutateAnchors: true,
      suppressSignals: true,
      assignCorrectness: true,
      blockExecution: true
    }
  });


/* =============================================================================
 * END OF merkle_anchor_chain_validator.js
 * ========================================================================== */
merkle_anchor_chain_validator_misuse_tests.js
