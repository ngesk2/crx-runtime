merkle_anchor_chain_drift_misuse_tests.js
/******************************************************************************
 * PATCH-080
 * ANCHOR CHAIN DRIFT DETECTOR — MISUSE TESTS
 * MODULE: merkle_anchor_chain_drift_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that merkle_anchor_chain_drift_detector:
 *   - NEVER throws
 *   - NEVER assigns authority
 *   - NEVER suppresses structural drift
 *   - Detects added/removed/modified anchors
 *   - Detects parent linkage changes
 *   - Is replay-safe and deterministic
 *
 * These tests:
 *   - Emit evidence only
 *   - NEVER block execution
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


function runAnchorChainDriftMisuseTests() {
  const results = [];


  results.push(testInvalidInputHandling());
  results.push(testAnchorAddedDetection());
  results.push(testAnchorRemovedDetection());
  results.push(testAnchorModifiedDetection());
  results.push(testParentLinkChangeDetection());
  results.push(testNoAuthorityInjection());
  results.push(testReplaySafety());
  results.push(testOrderIndependence());


  const artifact = {
    schema: "merkle.anchor.chain.drift.misuse_tests",
    schemaVersion: "1.0.0",
    module: "merkle_anchor_chain_drift_detector",


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


function testInvalidInputHandling() {
  try {
    const report = detectAnchorChainDrift(null, null);
    return pass("invalid_input_handled", "Handled invalid input safely");
  } catch (e) {
    return fail("invalid_input_handled", "Detector threw on invalid input");
  }
}


function testAnchorAddedDetection() {
  const prev = canonical([anchor("A", null)]);
  const curr = canonical([anchor("A", null), anchor("B", "A")]);


  const report = detectAnchorChainDrift(prev, curr);


  return containsSignal(report, "anchor_added")
    ? pass("anchor_added_detected", "Anchor addition detected")
    : fail("anchor_added_detected", "Anchor addition not detected");
}


function testAnchorRemovedDetection() {
  const prev = canonical([anchor("A", null), anchor("B", "A")]);
  const curr = canonical([anchor("A", null)]);


  const report = detectAnchorChainDrift(prev, curr);


  return containsSignal(report, "anchor_removed")
    ? pass("anchor_removed_detected", "Anchor removal detected")
    : fail("anchor_removed_detected", "Anchor removal not detected");
}


function testAnchorModifiedDetection() {
  const prev = canonical([anchor("A", null)]);
  const modified = anchor("A", null);
  modified.merkle_root = "modified-root";


  const curr = canonical([modified]);


  const report = detectAnchorChainDrift(prev, curr);


  return containsSignal(report, "anchor_modified")
    ? pass("anchor_modified_detected", "Anchor modification detected")
    : fail("anchor_modified_detected", "Anchor modification not detected");
}


function testParentLinkChangeDetection() {
  const prev = canonical([anchor("A", null), anchor("B", "A")]);
  const changed = anchor("B", null); // parent changed


  const curr = canonical([anchor("A", null), changed]);


  const report = detectAnchorChainDrift(prev, curr);


  return containsSignal(report, "parent_link_changed")
    ? pass("parent_link_changed_detected", "Parent change detected")
    : fail("parent_link_changed_detected", "Parent change not detected");
}


function testNoAuthorityInjection() {
  const prev = canonical([anchor("A", null)]);
  const curr = canonical([anchor("A", null)]);


  const report = detectAnchorChainDrift(prev, curr);


  const forbidden = ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in report) {
      return fail("authority_injection", `Forbidden field present: ${f}`);
    }
  }


  if (report.declaredNonAuthoritative !== true) {
    return fail("authority_flag_missing", "declaredNonAuthoritative not true");
  }


  return pass("authority_injection", "No authority fields injected");
}


function testReplaySafety() {
  const prev = canonical([anchor("A", null)]);
  const curr = canonical([anchor("A", null)]);


  const r1 = detectAnchorChainDrift(prev, curr);
  const r2 = detectAnchorChainDrift(prev, curr);


  return r1.drift_fingerprint === r2.drift_fingerprint
    ? pass("replay_safety", "Deterministic fingerprint")
    : fail("replay_safety", "Fingerprint instability detected");
}


function testOrderIndependence() {
  const prev = canonical([anchor("A", null), anchor("B", "A")]);
  const currUnordered = canonical([
    anchor("B", "A"),
    anchor("A", null)
  ]);


  const report = detectAnchorChainDrift(prev, currUnordered);


  return report.signal_count === 0
    ? pass("order_independent", "Order independence preserved")
    : fail("order_independent", "Order affected drift detection");
}


/* =============================================================================
 * FIXTURES
 * ========================================================================== */


function anchor(fp, parent) {
  return {
    schema: "merkle.anchor",
    schemaVersion: "1.0.0",
    anchor_fingerprint: fp,
    previous_anchor_fingerprint: parent,
    merkle_root: "root-" + fp,
    created_at: new Date().toISOString(),
    declaredNonAuthoritative: true
  };
}


function canonical(anchors) {
  return canonicalizeAnchorChain(anchors);
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
 * END OF merkle_anchor_chain_drift_misuse_tests.js
 * ========================================================================== */
merkle_anchor_chain_drift_summary.js
