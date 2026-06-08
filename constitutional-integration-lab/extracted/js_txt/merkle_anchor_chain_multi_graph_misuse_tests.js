merkle_anchor_chain_multi_graph_misuse_tests.js
/******************************************************************************
 * PATCH-087
 * MULTI-CHAIN GRAPH VISUALIZER — MISUSE TESTS
 *
 * MODULE:
 *   merkle_anchor_chain_multi_graph_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that buildMultiChainGraph:
 *   - NEVER throws
 *   - NEVER assigns authority
 *   - NEVER ranks chains
 *   - NEVER resolves consensus
 *   - NEVER mutates inputs
 *   - Correctly models shared vs unique anchors
 *   - Is deterministic
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


function runMultiChainGraphMisuseTests() {
  const results = [];


  results.push(testInvalidInputHandling());
  results.push(testSharedAnchorDetection());
  results.push(testUniqueAnchorDetection());
  results.push(testEdgeConstruction());
  results.push(testNoAuthorityInjection());
  results.push(testDeterminism());
  results.push(testNoMutation());


  const artifact = {
    schema:
      "merkle.anchor.chain.multi_graph.misuse_tests",
    schemaVersion: "1.0.0",
    module:
      "buildMultiChainGraph",


    results,
    summary: summarize(results),


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.test_fingerprint =
    stableFingerprint(artifact);


  return artifact;
}


/* =============================================================================
 * TESTS
 * ========================================================================== */


function testInvalidInputHandling() {
  try {
    const graph = buildMultiChainGraph(null);
    return pass("invalid_input_handled",
      "Handled invalid input safely");
  } catch (e) {
    return fail("invalid_input_handled",
      "Visualizer threw on invalid input");
  }
}


function testSharedAnchorDetection() {
  const chain1 = canonical(["A", "B"]);
  const chain2 = canonical(["A", "C"]);


  const graph =
    buildMultiChainGraph([chain1, chain2]);


  const nodeA =
    graph.nodes.find(n => n.id === "A");


  if (!nodeA || nodeA.shared !== true)
    return fail("shared_anchor_detection",
      "Shared anchor not detected");


  return pass("shared_anchor_detection",
    "Shared anchor detected correctly");
}


function testUniqueAnchorDetection() {
  const chain1 = canonical(["A", "B"]);
  const chain2 = canonical(["A", "C"]);


  const graph =
    buildMultiChainGraph([chain1, chain2]);


  const nodeB =
    graph.nodes.find(n => n.id === "B");


  if (!nodeB || nodeB.shared !== false)
    return fail("unique_anchor_detection",
      "Unique anchor incorrectly marked shared");


  return pass("unique_anchor_detection",
    "Unique anchor correctly identified");
}


function testEdgeConstruction() {
  const chain = canonicalWithParents([
    ["A", null],
    ["B", "A"]
  ]);


  const graph =
    buildMultiChainGraph([chain]);


  const edge =
    graph.edges.find(e =>
      e.from === "A" && e.to === "B"
    );


  return edge
    ? pass("edge_construction",
        "Parent-child edge constructed")
    : fail("edge_construction",
        "Parent-child edge missing");
}


function testNoAuthorityInjection() {
  const chain = canonical(["A"]);


  const graph =
    buildMultiChainGraph([chain]);


  const forbidden =
    ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in graph) {
      return fail("authority_injection",
        `Forbidden field present: ${f}`);
    }
  }


  if (graph.declaredNonAuthoritative !== true)
    return fail("authority_flag_missing",
      "declaredNonAuthoritative not true");


  return pass("authority_injection",
    "No authority injected");
}


function testDeterminism() {
  const chain1 = canonical(["A", "B"]);
  const chain2 = canonical(["A", "C"]);


  const g1 =
    buildMultiChainGraph([chain1, chain2]);
  const g2 =
    buildMultiChainGraph([chain1, chain2]);


  return g1.graph_fingerprint ===
         g2.graph_fingerprint
    ? pass("deterministic_output",
        "Graph fingerprint stable")
    : fail("deterministic_output",
        "Graph fingerprint unstable");
}


function testNoMutation() {
  const chain = canonical(["A", "B"]);
  const before =
    stableFingerprint(chain);


  buildMultiChainGraph([chain]);


  const after =
    stableFingerprint(chain);


  return before === after
    ? pass("no_mutation",
        "Input chains not mutated")
    : fail("mutation_detected",
        "Canonical chain mutated");
}


/* =============================================================================
 * FIXTURES
 * ========================================================================== */


function canonical(anchorIds) {
  return {
    schema: "merkle.anchor.chain.canonical",
    schemaVersion: "1.0.0",
    anchors: anchorIds.map(id => ({
      anchor_fingerprint: id,
      previous_anchor_fingerprint: null,
      merkle_root: "root-" + id,
      created_at: new Date().toISOString(),
      declaredNonAuthoritative: true
    })),
    chain_fingerprint:
      stableFingerprint(anchorIds),
    declaredNonAuthoritative: true
  };
}


function canonicalWithParents(pairs) {
  return {
    schema: "merkle.anchor.chain.canonical",
    schemaVersion: "1.0.0",
    anchors: pairs.map(([id, parent]) => ({
      anchor_fingerprint: id,
      previous_anchor_fingerprint: parent,
      merkle_root: "root-" + id,
      created_at: new Date().toISOString(),
      declaredNonAuthoritative: true
    })),
    chain_fingerprint:
      stableFingerprint(pairs),
    declaredNonAuthoritative: true
  };
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function pass(test, message) {
  return { test, status: "pass", message };
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
 * END OF PATCH-087
 * ========================================================================== */
canonical_fingerprint_service.js
