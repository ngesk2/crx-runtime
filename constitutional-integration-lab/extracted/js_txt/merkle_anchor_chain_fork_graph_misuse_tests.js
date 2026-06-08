merkle_anchor_chain_fork_graph_misuse_tests.js
/******************************************************************************
 * PATCH-077
 * ANCHOR FORK GRAPH BUILDER — MISUSE TESTS
 * MODULE: merkle_anchor_chain_fork_graph_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that merkle_anchor_chain_fork_graph_builder:
 *   - NEVER throws
 *   - NEVER assigns authority
 *   - NEVER suppresses fork signals
 *   - Detects orphan references
 *   - Detects disconnected subgraphs
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


function runAnchorForkGraphMisuseTests() {
  const results = [];


  results.push(testInvalidInput());
  results.push(testMalformedAnchor());
  results.push(testForkDetection());
  results.push(testOrphanReferenceDetection());
  results.push(testDisconnectedGraphDetection());
  results.push(testNoAuthorityInjection());
  results.push(testDeterministicFingerprint());


  const artifact = {
    schema: "merkle.anchor.chain.fork_graph.misuse_tests",
    schemaVersion: "1.0.0",
    module: "merkle_anchor_chain_fork_graph_builder",


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
    const graph = buildAnchorForkGraph(null);
    return pass("invalid_input_handled", "Handled null input safely");
  } catch (e) {
    return fail("invalid_input_handled", "Graph builder threw on null input");
  }
}


function testMalformedAnchor() {
  const graph = buildAnchorForkGraph([{}, null]);


  const hasSignal = containsSignal(graph, "invalid_anchor_shape") ||
                    containsSignal(graph, "missing_anchor_fingerprint");


  return hasSignal
    ? pass("malformed_anchor_detected", "Malformed anchor detected")
    : fail("malformed_anchor_detected", "Malformed anchor not detected");
}


function testForkDetection() {
  const a = anchor("A", null);
  const b = anchor("B", "A");
  const c = anchor("C", "A"); // fork


  const graph = buildAnchorForkGraph([a, b, c]);


  return containsSignal(graph, "fork_detected")
    ? pass("fork_detected", "Fork correctly detected")
    : fail("fork_detected", "Fork not detected");
}


function testOrphanReferenceDetection() {
  const a = anchor("A", "missing-parent");


  const graph = buildAnchorForkGraph([a]);


  return containsSignal(graph, "orphan_reference_detected")
    ? pass("orphan_detected", "Orphan reference detected")
    : fail("orphan_detected", "Orphan reference not detected");
}


function testDisconnectedGraphDetection() {
  const a = anchor("A", null);
  const b = anchor("B", null); // separate root


  const graph = buildAnchorForkGraph([a, b]);


  return containsSignal(graph, "disconnected_subgraph_detected")
    ? pass("disconnected_detected", "Disconnected subgraph detected")
    : fail("disconnected_detected", "Disconnected graph not detected");
}


function testNoAuthorityInjection() {
  const a = anchor("A", null);
  const graph = buildAnchorForkGraph([a]);


  const forbidden = ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in graph) {
      return fail("authority_injection", `Forbidden field present: ${f}`);
    }
  }


  if (graph.declaredNonAuthoritative !== true) {
    return fail("authority_flag_missing", "declaredNonAuthoritative not true");
  }


  return pass("authority_injection", "No authority fields injected");
}


function testDeterministicFingerprint() {
  const a = anchor("A", null);
  const b = anchor("B", "A");


  const g1 = buildAnchorForkGraph([a, b]);
  const g2 = buildAnchorForkGraph([a, b]);


  return g1.graph_fingerprint === g2.graph_fingerprint
    ? pass("deterministic_fingerprint", "Graph fingerprint stable")
    : fail("deterministic_fingerprint", "Fingerprint instability detected");
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


function containsSignal(graph, code) {
  return (graph.signals || []).some(s => s.code === code);
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
 * END OF merkle_anchor_chain_fork_graph_misuse_tests.js
 * ========================================================================== */
merkle_anchor_chain_canonicalizer.js
