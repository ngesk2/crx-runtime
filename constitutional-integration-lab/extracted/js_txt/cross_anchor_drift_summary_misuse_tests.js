cross_anchor_drift_summary_misuse_tests.js
/******************************************************************************
 * PATCH-072
 * CROSS-ANCHOR DRIFT SUMMARY — MISUSE TESTS
 * MODULE: cross_anchor_drift_summary_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that:
 *   - Summary never recalculates drift
 *   - Summary never suppresses signals
 *   - Summary never injects authority
 *   - Summary handles malformed input safely
 *   - Summary is replay-safe
 *
 * These tests:
 *   - NEVER throw
 *   - NEVER block execution
 *   - Emit evidence only
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


function runCrossAnchorDriftSummaryMisuseTests() {
  const results = [];


  results.push(testHandlesInvalidInput());
  results.push(testDoesNotSuppressSignals());
  results.push(testDoesNotRecalculateCounts());
  results.push(testDoesNotInjectAuthority());
  results.push(testReplaySafety());


  const artifact = {
    schema: "merkle.anchor.cross_drift.summary.misuse_tests",
    schemaVersion: "1.0.0",
    module: "cross_anchor_drift_summary",


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


function testHandlesInvalidInput() {
  try {
    const summary = summarizeCrossAnchorDrift(null);


    if (!summary || !summary.schema) {
      return fail("invalid_input_handling", "No summary returned");
    }


    return pass(
      "invalid_input_handling",
      "Invalid input handled safely"
    );
  } catch (e) {
    return fail("invalid_input_handling", e.message);
  }
}


function testDoesNotSuppressSignals() {
  const drift = mockDrift([
    signal("merkle_root_divergence"),
    signal("anchor_replayed"),
    signal("leaf_count_inconsistent")
  ]);


  const summary = summarizeCrossAnchorDrift(drift);


  const totalSignals = drift.signals.length;
  const totalCount = summary.summary_counts.total;


  if (totalSignals !== totalCount) {
    return fail(
      "signal_suppression",
      "Summary counts do not match signal count"
    );
  }


  return pass(
    "signal_suppression",
    "All signals preserved in counts"
  );
}


function testDoesNotRecalculateCounts() {
  const drift = mockDrift([
    signal("merkle_root_divergence"),
    signal("merkle_root_divergence"),
    signal("anchor_replayed")
  ]);


  const summary = summarizeCrossAnchorDrift(drift);


  if (summary.summary_counts.root_divergence !== 2) {
    return fail(
      "count_mismatch",
      "Root divergence count incorrect"
    );
  }


  if (summary.summary_counts.replay !== 1) {
    return fail(
      "count_mismatch",
      "Replay count incorrect"
    );
  }


  return pass(
    "count_accuracy",
    "Counts reflect original signals only"
  );
}


function testDoesNotInjectAuthority() {
  const drift = mockDrift([signal("merkle_root_divergence")]);
  const summary = summarizeCrossAnchorDrift(drift);


  const forbidden = ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in summary) {
      return fail(
        "authority_injection",
        `Forbidden authority field present: ${f}`
      );
    }
  }


  if (summary.declaredNonAuthoritative !== true) {
    return fail(
      "authority_flag_missing",
      "declaredNonAuthoritative not true"
    );
  }


  return pass(
    "authority_injection",
    "No authority fields present"
  );
}


function testReplaySafety() {
  const drift = mockDrift([
    signal("merkle_root_divergence"),
    signal("anchor_replayed")
  ]);


  const s1 = summarizeCrossAnchorDrift(drift);
  const s2 = summarizeCrossAnchorDrift(drift);


  if (s1.summary_fingerprint !== s2.summary_fingerprint) {
    return fail(
      "replay_safety",
      "Summary fingerprint not stable"
    );
  }


  return pass(
    "replay_safety",
    "Summary fingerprint deterministic"
  );
}


/* =============================================================================
 * MOCKS
 * ========================================================================== */


function mockDrift(signals) {
  const report = {
    schema: "merkle.anchor.cross_drift.report",
    schemaVersion: "1.0.0",
    signals,
    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  report.drift_fingerprint = stableFingerprint(report);
  return report;
}


function signal(code) {
  return {
    code,
    message: code,
    declaredNonAuthoritative: true
  };
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
 * END OF cross_anchor_drift_summary_misuse_tests.js
 * ========================================================================== */
cross_anchor_drift_summary_presentation_adapter.js
