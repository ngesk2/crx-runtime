/******************************************************************************
 * PATCH-067
 * ANCHOR REPLAY VERIFIER (EVIDENCE-ONLY)
 * MODULE: merkle_anchor_replay_verifier.js
 *
 * ROLE
 * ----
 * Compare Merkle anchor evidence artifacts to detect replay,
 * divergence, or inconsistency WITHOUT trusting anchors.
 *
 * This module:
 *   - Compares evidence ? evidence
 *   - Emits replay / drift signals
 *   - Treats external anchors as opaque
 *
 * This module:
 *   - NEVER verifies anchors
 *   - NEVER trusts timestamps, blockchains, or logs
 *   - NEVER assigns authority
 *   - NEVER throws
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const ANCHOR_REPLAY_SCHEMA = "merkle.anchor.replay.report";
const ANCHOR_REPLAY_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * detectAnchorReplay(previousEvidence, currentEvidence)
 *
 * @param {Object} previousEvidence - merkle anchor evidence
 * @param {Object} currentEvidence - merkle anchor evidence
 *
 * @returns {Object} replay report artifact
 */
function detectAnchorReplay(previousEvidence, currentEvidence) {
  const signals = [];


  // Defensive — never throw
  if (!isObject(previousEvidence) || !isObject(currentEvidence)) {
    signals.push(signal(
      "invalid_input",
      "Anchor replay verifier received invalid inputs"
    ));
    return buildReport(signals);
  }


  // --- Merkle root comparison ---
  if (previousEvidence.merkle_root !== currentEvidence.merkle_root) {
    signals.push(signal(
      "merkle_root_changed",
      "Merkle root differs between anchor evidence artifacts",
      {
        previous: previousEvidence.merkle_root,
        current: currentEvidence.merkle_root
      }
    ));
  }


  // --- Leaf count comparison ---
  if (previousEvidence.leaf_count !== currentEvidence.leaf_count) {
    signals.push(signal(
      "leaf_count_changed",
      "Leaf count differs between anchor evidence artifacts",
      {
        previous: previousEvidence.leaf_count,
        current: currentEvidence.leaf_count
      }
    ));
  }


  // --- Anchor reference comparison (opaque) ---
  if (!deepEqual(
    previousEvidence.anchor_reference,
    currentEvidence.anchor_reference
  )) {
    signals.push(signal(
      "anchor_reference_changed",
      "Anchor reference changed (opaque comparison)",
      {
        previous: previousEvidence.anchor_reference || null,
        current: currentEvidence.anchor_reference || null
      }
    ));
  }


  // --- Replay detection ---
  if (
    previousEvidence.anchor_fingerprint &&
    currentEvidence.anchor_fingerprint &&
    previousEvidence.anchor_fingerprint ===
      currentEvidence.anchor_fingerprint
  ) {
    signals.push(signal(
      "anchor_replayed",
      "Identical anchor evidence fingerprint observed"
    ));
  }


  return buildReport(signals);
}


/* =============================================================================
 * REPORT BUILDER
 * ========================================================================== */


function buildReport(signals) {
  const report = {
    schema: ANCHOR_REPLAY_SCHEMA,
    schemaVersion: ANCHOR_REPLAY_VERSION,


    signals,
    declaredNonAuthoritative: true,
    advisoryOnly: true,
    created_at: new Date().toISOString()
  };


  report.replay_fingerprint = stableFingerprint(report);
  return report;
}


/* =============================================================================
 * SIGNALS
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
 * UTILITIES
 * ========================================================================== */


function isObject(v) {
  return v && typeof v === "object";
}


function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
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
    return Object.keys(v).sort().reduce((a, k) => {
      a[k] = sortKeysDeep(v[k]);
      return a;
    }, {});
  }
  return v;
}


function sha256Strict(input) {
  if (typeof Utilities !== "undefined" &&
      Utilities.computeDigest) {
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


const MERKLE_ANCHOR_REPLAY_VERIFIER_INVARIANTS = Object.freeze({
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    verifyExternalSystems: true,
    inferImmutability: true,
    assignCorrectness: true,
    blockExecution: true
  }
});


/* =============================================================================
 * END OF merkle_anchor_replay_verifier.js
 * ========================================================================== */
merkle_anchor_replay_verifier_misuse_tests.js
