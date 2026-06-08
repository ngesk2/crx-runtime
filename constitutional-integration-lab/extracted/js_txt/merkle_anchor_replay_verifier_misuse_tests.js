/******************************************************************************
 * PATCH-068
 * ANCHOR REPLAY VERIFIER — MISUSE TESTS
 * MODULE: merkle_anchor_replay_verifier_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that the anchor replay verifier:
 *   - NEVER throws
 *   - NEVER trusts anchors
 *   - NEVER assigns authority
 *   - Emits signals ONLY
 *   - Tolerates malformed, adversarial, or contradictory evidence
 *
 * These tests:
 *   - Are evidence, not enforcement
 *   - NEVER block execution
 *   - NEVER interpret meaning
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


/* =============================================================================
 * PUBLIC TEST RUNNER
 * ========================================================================== */


/**
 * runAnchorReplayVerifierMisuseTests()
 *
 * @returns {Object} misuse test artifact
 */
function runAnchorReplayVerifierMisuseTests() {
  const results = [];


  results.push(testInvalidInputs());
  results.push(testMissingFields());
  results.push(testContradictoryRoots());
  results.push(testReplayDetection());
  results.push(testOpaqueAnchorMutation());
  results.push(testNeverThrows());


  const artifact = {
    schema: "merkle.anchor.replay.misuse_tests",
    schemaVersion: "1.0.0",
    module: "merkle_anchor_replay_verifier",


    results,
    summary: summarize(results),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.test_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * INDIVIDUAL TESTS
 * ========================================================================== */


function testInvalidInputs() {
  try {
    const report = detectAnchorReplay(null, 42);
    return pass(
      "invalid_inputs",
      "Invalid inputs tolerated without throw",
      report.signals
    );
  } catch (e) {
    return fail("invalid_inputs", "Verifier threw on invalid inputs");
  }
}


function testMissingFields() {
  const a = {};
  const b = {};


  try {
    const report = detectAnchorReplay(a, b);
    return pass(
      "missing_fields",
      "Missing fields tolerated",
      report.signals
    );
  } catch (e) {
    return fail("missing_fields", "Verifier threw on missing fields");
  }
}


function testContradictoryRoots() {
  const prev = anchor("root-A", 10);
  const curr = anchor("root-B", 10);


  const report = detectAnchorReplay(prev, curr);


  return report.signals.some(s => s.code === "merkle_root_changed")
    ? pass(
        "contradictory_roots",
        "Merkle root divergence detected",
        report.signals
      )
    : fail(
        "contradictory_roots",
        "Merkle root divergence not detected"
      );
}


function testReplayDetection() {
  const a = anchor("root-X", 5, "fp:same");
  const b = anchor("root-X", 5, "fp:same");


  const report = detectAnchorReplay(a, b);


  return report.signals.some(s => s.code === "anchor_replayed")
    ? pass(
        "replay_detected",
        "Replay signal emitted",
        report.signals
      )
    : fail(
        "replay_detected",
        "Replay signal not emitted"
      );
}


function testOpaqueAnchorMutation() {
  const prev = anchor("root-Z", 7);
  const curr = anchor("root-Z", 7);
  curr.anchor_reference = { external: "changed" };


  const report = detectAnchorReplay(prev, curr);


  return report.signals.some(
    s => s.code === "anchor_reference_changed"
  )
    ? pass(
        "opaque_anchor_mutation",
        "Opaque anchor mutation detected",
        report.signals
      )
    : fail(
        "opaque_anchor_mutation",
        "Opaque mutation not detected"
      );
}


function testNeverThrows() {
  try {
    detectAnchorReplay(undefined, undefined);
    detectAnchorReplay([], []);
    detectAnchorReplay("x", "y");


    return pass(
      "never_throws",
      "Verifier never throws on adversarial inputs"
    );
  } catch (e) {
    return fail("never_throws", "Verifier threw unexpectedly");
  }
}


/* =============================================================================
 * FIXTURES
 * ========================================================================== */


function anchor(root, count, fingerprint = null) {
  return {
    schema: "merkle.anchor.evidence",
    merkle_root: root,
    leaf_count: count,
    anchor_reference: { opaque: true },
    anchor_fingerprint: fingerprint,
    declaredNonAuthoritative: true
  };
}


/* =============================================================================
 * RESULT HELPERS
 * ========================================================================== */


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
 * END OF merkle_anchor_replay_verifier_misuse_tests.js
 * ========================================================================== */
cross_anchor_drift_detector.js
