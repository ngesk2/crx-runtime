merkle_anchor_chain_drift_detector.js
/******************************************************************************
 * PATCH-079
 * ANCHOR CHAIN ? CHAIN DRIFT DETECTOR
 * MODULE: merkle_anchor_chain_drift_detector.js
 *
 * ROLE
 * ----
 * Compare two canonical anchor chain artifacts and detect structural drift.
 *
 * This module:
 *   - Compares canonical chains only
 *   - Detects added anchors
 *   - Detects removed anchors
 *   - Detects modified anchors
 *   - Detects parent linkage changes
 *
 * This module:
 *   - NEVER resolves forks
 *   - NEVER assigns correctness
 *   - NEVER mutates inputs
 *   - NEVER blocks execution
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const ANCHOR_CHAIN_DRIFT_SCHEMA =
  "merkle.anchor.chain.drift";


const ANCHOR_CHAIN_DRIFT_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * detectAnchorChainDrift(previousChain, currentChain)
 *
 * @param {Object} previousChain - canonical chain artifact
 * @param {Object} currentChain  - canonical chain artifact
 *
 * @returns {Object} drift report artifact
 */
function detectAnchorChainDrift(previousChain, currentChain) {
  const signals = [];


  if (!isValidCanonical(previousChain) ||
      !isValidCanonical(currentChain)) {
    return buildReport(signals, "invalid_input");
  }


  const prevMap = indexByFingerprint(previousChain.anchors);
  const currMap = indexByFingerprint(currentChain.anchors);


  // Added anchors
  Object.keys(currMap).forEach(fp => {
    if (!prevMap[fp]) {
      signals.push(signal(
        "anchor_added",
        "Anchor added in current chain",
        { anchor_fingerprint: fp }
      ));
    }
  });


  // Removed anchors
  Object.keys(prevMap).forEach(fp => {
    if (!currMap[fp]) {
      signals.push(signal(
        "anchor_removed",
        "Anchor removed from current chain",
        { anchor_fingerprint: fp }
      ));
    }
  });


  // Modified anchors
  Object.keys(currMap).forEach(fp => {
    if (prevMap[fp]) {
      const prevAnchor = prevMap[fp];
      const currAnchor = currMap[fp];


      if (!deepEqual(prevAnchor, currAnchor)) {
        signals.push(signal(
          "anchor_modified",
          "Anchor content changed",
          { anchor_fingerprint: fp }
        ));


        // Parent linkage change detection
        if (prevAnchor.previous_anchor_fingerprint !==
            currAnchor.previous_anchor_fingerprint) {
          signals.push(signal(
            "parent_link_changed",
            "Parent linkage modified",
            {
              anchor_fingerprint: fp,
              previous_parent:
                prevAnchor.previous_anchor_fingerprint || null,
              current_parent:
                currAnchor.previous_anchor_fingerprint || null
            }
          ));
        }
      }
    }
  });


  return buildReport(signals);
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function isValidCanonical(chain) {
  return chain &&
         chain.schema === "merkle.anchor.chain.canonical" &&
         Array.isArray(chain.anchors);
}


function indexByFingerprint(anchors) {
  const map = Object.create(null);


  (anchors || []).forEach(a => {
    if (a && a.anchor_fingerprint) {
      map[a.anchor_fingerprint] = a;
    }
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
    schema: ANCHOR_CHAIN_DRIFT_SCHEMA,
    schemaVersion: ANCHOR_CHAIN_DRIFT_VERSION,


    signal_count: signals.length,
    signals,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) report.note = note;


  report.drift_fingerprint = stableFingerprint(report);
  return report;
}


function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const ANCHOR_CHAIN_DRIFT_INVARIANTS = Object.freeze({
  advisoryOnly: true,
  replaySafe: true,
  orderIndependent: true,
  nonAuthoritative: true,


  mustNot: {
    resolveForks: true,
    rankChains: true,
    suppressSignals: true,
    mutateInputs: true
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
 * END OF merkle_anchor_chain_drift_detector.js
 * ========================================================================== */


merkle_anchor_chain_drift_misuse_tests.js
