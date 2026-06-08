merkle_anchor_chain_validator_misuse_tests.js
/******************************************************************************
 * PATCH-075
 * ANCHOR CHAIN VALIDATOR — MISUSE TESTS
 * MODULE: merkle_anchor_chain_validator_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that merkle_anchor_chain_validator:
 *   - NEVER throws
 *   - NEVER assigns authority
 *   - Detects structural incoherence
 *   - Tolerates malformed anchors
 *   - Is replay-safe
 *
 * These tests:
 *   - Emit evidence only
 *   - NEVER block execution
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


function runAnchorChainValidatorMisuseTests() {
  const results = [];


  results.push(testInvalidInput());
  results.push(testEmptyChain());
  results.push(testReplayDetection());
  results.push(testRootReuseDetection());
  results.push(testBrokenParentLink());
  results.push(testTimestampRegression());
  results.push(testMalformedAnchor());
  results.push(testNoAuthorityInjection());
  results.push(testReplaySafety());


  const artifact = {
    schema: "merkle.anchor.chain.misuse_tests",
    schemaVersion: "1.0.0",
    module: "merkle_anchor_chain_validator",


    results,
    summary: summarize(results),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.test_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * TESTS
 * ========================================================================== */


function testInvalidInput() {
  try {
    const report = validateMerkleAnchorChain(null);
    return pass("invalid_input_handled", "Handled null input safely");
  } catch (e) {
    return fail("invalid_input_handled", "Validator threw on null input");
  }
}


function testEmptyChain() {
  const report = validateMerkleAnchorChain([]);


  return report.note === "empty_chain"
    ? pass("empty_chain_handled", "Empty chain handled")
    : fail("empty_chain_handled", "Empty chain not handled properly");
}


function testReplayDetection() {
  const a = anchor("fp:A", "root1", null, 1);
  const report = validateMerkleAnchorChain([a, a]);


  return containsSignal(report, "anchor_replay_detected")
    ? pass("replay_detected", "Replay detected")
    : fail("replay_detected", "Replay not detected");
}


function testRootReuseDetection() {
  const a = anchor("fp:A", "root1", null, 1);
  const b = anchor("fp:B", "root1", "fp:A", 2);


  const report = validateMerkleAnchorChain([a, b]);


  return containsSignal(report, "root_reuse_detected")
    ? pass("root_reuse_detected", "Root reuse detected")
    : fail("root_reuse_detected", "Root reuse not detected");
}


function testBrokenParentLink() {
  const a = anchor("fp:A", "root1", null, 1);
  const b = anchor("fp:B", "root2", "wrong-parent", 2);


  const report = validateMerkleAnchorChain([a, b]);


  return containsSignal(report, "broken_parent_link")
    ? pass("broken_parent_link", "Broken parent link detected")
    : fail("broken_parent_link", "Broken parent link not detected");
}


function testTimestampRegression() {
  const a = anchor("fp:A", "root1", null, 2);
  const b = anchor("fp:B", "root2", "fp:A", 1); // older timestamp


  const report = validateMerkleAnchorChain([a, b]);


  return containsSignal(report, "timestamp_regression")
    ? pass("timestamp_regression", "Timestamp regression detected")
    : fail("timestamp_regression", "Timestamp regression not detected");
}


function testMalformedAnchor() {
  const report = validateMerkleAnchorChain([{}, null]);


  return containsSignal(report, "invalid_anchor_shape")
    ? pass("malformed_anchor_detected", "Malformed anchor detected")
    : fail("malformed_anchor_detected", "Malformed anchor not detected");
}


function testNoAuthorityInjection() {
  const a = anchor("fp:A", "root1", null, 1);
  const report = validateMerkleAnchorChain([a]);


  const forbidden = ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in report) {
      return fail(
        "authority_injection",
        `Forbidden authority field present: ${f}`
      );
    }
  }


  if (report.declaredNonAuthoritative !== true) {
    return fail(
      "authority_flag_missing",
      "declaredNonAuthoritative not true"
    );
  }


  return pass("authority_injection", "No authority injection");
}


function testReplaySafety() {
  const a = anchor("fp:A", "root1", null, 1);
  const b = anchor("fp:B", "root2", "fp:A", 2);


  const r1 = validateMerkleAnchorChain([a, b]);
  const r2 = validateMerkleAnchorChain([a, b]);


  return r1.chain_report_fingerprint === r2.chain_report_fingerprint
    ? pass("replay_safety", "Deterministic fingerprint")
    : fail("replay_safety", "Fingerprint instability detected");
}


/* =============================================================================
 * FIXTURES
 * ========================================================================== */


function anchor(fp, root, parent, timeOrder) {
  return {
    schema: "merkle.anchor",
    schemaVersion: "1.0.0",
    anchor_fingerprint: fp,
    merkle_root: root,
    previous_anchor_fingerprint: parent,
    created_at: new Date(timeOrder * 1000).toISOString(),
    declaredNonAuthoritative: true
  };
}


function containsSignal(report, code) {
  return (report.signals || []).some(s => s.code === code);
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function pass(test, message, evidence = null) {
  return { test, status: "pass", message, evidence };
}


function fail(test, message) {
  return { test, status: "fail", message };
}


function summarize(results) {
  return {
    passed: results.filter(r => r.status === "pass").length,
    failed: results.filter(r => r.status === "fail").length
  };
}


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
 * END OF merkle_anchor_chain_validator_misuse_tests.js
 * ========================================================================== */
merkle_anchor_chain_fork_graph_builder.js
