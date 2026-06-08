cross_anchor_drift_misuse_tests.js
/******************************************************************************
 * PATCH-070
 * CROSS-ANCHOR DRIFT MISUSE TESTS
 * MODULE: cross_anchor_drift_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that cross_anchor_drift_detector:
 *   - NEVER throws on malformed input
 *   - NEVER assigns authority
 *   - NEVER validates anchors as trusted
 *   - ONLY emits advisory drift signals
 *
 * These tests:
 *   - NEVER block execution
 *   - NEVER interpret meaning
 *   - Emit evidence artifacts only
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


const CROSS_ANCHOR_DRIFT_MISUSE_SCHEMA =
  "merkle.anchor.cross_drift.misuse_tests";
const CROSS_ANCHOR_DRIFT_MISUSE_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC TEST RUNNER
 * ========================================================================== */


function runCrossAnchorDriftMisuseTests() {
  const results = [];


  results.push(testRejectsInsufficientAnchors());
  results.push(testAllowsMalformedAnchors());
  results.push(testDetectsRootDivergence());
  results.push(testDetectsReplay());
  results.push(testDetectsLeafCountInconsistency());
  results.push(testNoAuthorityFieldsInjected());


  const artifact = {
    schema: CROSS_ANCHOR_DRIFT_MISUSE_SCHEMA,
    schemaVersion: CROSS_ANCHOR_DRIFT_MISUSE_VERSION,
    module: "cross_anchor_drift_detector",


    results,
    summary: summarize(results),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.test_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * TEST CASES
 * ========================================================================== */


function testRejectsInsufficientAnchors() {
  const report = detectCrossAnchorDrift([]);


  return report.note === "insufficient_anchors"
    ? pass("insufficient_anchors", "Handled gracefully")
    : fail("insufficient_anchors", "Did not return expected note");
}


function testAllowsMalformedAnchors() {
  try {
    const report = detectCrossAnchorDrift([
      null,
      {},
      { anchor_fingerprint: "fp:A" }
    ]);


    return pass(
      "malformed_anchor_tolerated",
      "Malformed anchors tolerated",
      { signal_count: report.signals.length }
    );
  } catch (e) {
    return fail("malformed_anchor_tolerated", e.message);
  }
}


function testDetectsRootDivergence() {
  const a = anchor("fp:A", "root1", 3);
  const b = anchor("fp:B", "root2", 3);


  const report = detectCrossAnchorDrift([a, b]);


  return containsSignal(report, "merkle_root_divergence")
    ? pass("root_divergence_detected", "Root divergence detected")
    : fail("root_divergence_detected", "No divergence signal emitted");
}


function testDetectsReplay() {
  const a = anchor("fp:A", "root1", 3);


  const report = detectCrossAnchorDrift([a, a]);


  return containsSignal(report, "anchor_replayed")
    ? pass("replay_detected", "Replay detected")
    : fail("replay_detected", "Replay not detected");
}


function testDetectsLeafCountInconsistency() {
  const a = anchor("fp:A", "root1", 3);
  const b = anchor("fp:B", "root1", 4);


  const report = detectCrossAnchorDrift([a, b]);


  return containsSignal(report, "leaf_count_inconsistent")
    ? pass("leaf_count_inconsistent", "Leaf count inconsistency detected")
    : fail("leaf_count_inconsistent", "No inconsistency signal emitted");
}


function testNoAuthorityFieldsInjected() {
  const a = anchor("fp:A", "root1", 3);
  const b = anchor("fp:B", "root1", 3);


  const report = detectCrossAnchorDrift([a, b]);


  const forbidden = ["verdict", "accepted", "rejected", "confidence", "score"];


  const leaked = forbidden.filter(f => f in report);


  return leaked.length === 0
    ? pass("no_authority_leak", "No authority fields present")
    : fail("no_authority_leak", "Authority field leaked: " + leaked.join(","));
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function anchor(fp, root, leafCount) {
  return {
    schema: "merkle.anchor",
    schemaVersion: "1.0.0",
    anchor_fingerprint: fp,
    merkle_root: root,
    leaf_count: leafCount,
    declaredNonAuthoritative: true
  };
}


function containsSignal(report, code) {
  return (report.signals || []).some(s => s.code === code);
}


function pass(test, message, evidence = null) {
  return {
    test,
    status: "pass",
    message,
    evidence
  };
}


function fail(test, message) {
  return {
    test,
    status: "fail",
    message
  };
}


function summarize(results) {
  return {
    passed: results.filter(r => r.status === "pass").length,
    failed: results.filter(r => r.status === "fail").length
  };
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
 * END OF cross_anchor_drift_misuse_tests.js
 * ========================================================================== */
cross_anchor_drift_summary.js
