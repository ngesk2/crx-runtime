merkle_anchor_chain_severity_and_divergence.js
/******************************************************************************
 * PATCH-083
 * SEVERITY ? PRESENTATION ADAPTER
 * + CROSS-CHAIN CONSENSUS DIVERGENCE ANALYZER
 *
 * MODULE:
 *   merkle_anchor_chain_severity_and_divergence.js
 *
 * ROLE
 * ----
 * 1. Adapt advisory severity classifications into presentation-safe objects.
 * 2. Detect structural divergence across multiple canonical chains.
 *
 * This module:
 *   - NEVER resolves consensus
 *   - NEVER ranks chains
 *   - NEVER assigns correctness
 *   - NEVER mutates inputs
 *   - NEVER injects authority
 *
 * STATUS
 * ------
 * Human-Facing · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/




/* =============================================================================
 * SEVERITY ? PRESENTATION ADAPTER
 * ========================================================================== */


/**
 * adaptSeverityForPresentation(summaryArtifact)
 *
 * Converts advisory severity into presentation-safe structure.
 * Does NOT alter severity meaning.
 */
function adaptSeverityForPresentation(summaryArtifact) {
  if (!summaryArtifact ||
      summaryArtifact.schema !==
        "merkle.anchor.chain.drift.summary") {
    return buildPresentation("none", []);
  }


  const severity = classifyConflictSeverity(summaryArtifact);


  const presentation = {
    label: severity.toUpperCase(),
    description: severityDescription(severity),
    severity,
    declaredNonAuthoritative: true
  };


  return buildPresentation(severity, presentation);
}


function severityDescription(level) {
  switch (level) {
    case "none":
      return "No structural divergence detected.";
    case "low":
      return "Minor structural divergence detected.";
    case "moderate":
      return "Noticeable structural divergence detected.";
    case "high":
      return "Significant structural divergence detected.";
    default:
      return "Structural divergence level unknown.";
  }
}


function buildPresentation(level, presentation) {
  const artifact = {
    schema: "merkle.anchor.chain.severity.presentation",
    schemaVersion: "1.0.0",


    severity_level: level,
    presentation,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.presentation_fingerprint = stableFingerprint(artifact);
  return artifact;
}




/* =============================================================================
 * CROSS-CHAIN CONSENSUS DIVERGENCE ANALYZER
 * ========================================================================== */


/**
 * analyzeCrossChainDivergence(canonicalChains)
 *
 * Accepts array of canonical chain artifacts.
 * Detects structural divergence across chains.
 */
function analyzeCrossChainDivergence(canonicalChains) {
  if (!Array.isArray(canonicalChains)) {
    return buildDivergenceReport([], "invalid_input");
  }


  const fingerprints = [];
  const anchorSets = [];


  canonicalChains.forEach(chain => {
    if (!isValidCanonical(chain)) return;


    fingerprints.push(chain.chain_fingerprint);


    const set = new Set(
      (chain.anchors || []).map(a => a.anchor_fingerprint)
    );
    anchorSets.push(set);
  });


  const divergenceSignals = [];


  // Fingerprint mismatch detection
  const uniqueFingerprints = new Set(fingerprints);
  if (uniqueFingerprints.size > 1) {
    divergenceSignals.push(signal(
      "chain_fingerprint_divergence",
      "Canonical chain fingerprints differ across inputs"
    ));
  }


  // Anchor set divergence detection
  if (anchorSets.length > 1) {
    const base = anchorSets[0];


    anchorSets.slice(1).forEach((set, index) => {
      if (!setEquals(base, set)) {
        divergenceSignals.push(signal(
          "anchor_set_divergence",
          "Anchor membership differs between chains",
          { compared_index: index + 1 }
        ));
      }
    });
  }


  return buildDivergenceReport(divergenceSignals);
}


function isValidCanonical(chain) {
  return chain &&
         chain.schema === "merkle.anchor.chain.canonical" &&
         Array.isArray(chain.anchors);
}


function setEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const val of a) if (!b.has(val)) return false;
  return true;
}


function buildDivergenceReport(signals, note = null) {
  const artifact = {
    schema: "merkle.anchor.chain.cross_divergence",
    schemaVersion: "1.0.0",


    signal_count: signals.length,
    signals,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.divergence_fingerprint = stableFingerprint(artifact);
  return artifact;
}


function signal(code, message, evidence = null) {
  return {
    code,
    message,
    evidence,
    declaredNonAuthoritative: true
  };
}




/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const PATCH_083_INVARIANTS = Object.freeze({
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    resolveConsensus: true,
    rankChains: true,
    assignTrust: true,
    mutateInputs: true,
    suppressDivergence: true
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
 * END OF PATCH-083
 * ========================================================================== */
merkle_anchor_chain_cross_divergence_misuse_tests.
/******************************************************************************
 * PATCH-084
 * CROSS-CHAIN CONSENSUS DIVERGENCE ANALYZER — MISUSE TESTS
 *
 * MODULE:
 *   merkle_anchor_chain_cross_divergence_misuse_tests.js
 *
 * PURPOSE
 * -------
 * Prove that analyzeCrossChainDivergence:
 *   - NEVER throws
 *   - NEVER assigns authority
 *   - NEVER ranks chains
 *   - NEVER resolves consensus
 *   - Detects fingerprint divergence
 *   - Detects anchor set divergence
 *   - Is deterministic and replay-safe
 *
 * STATUS
 * ------
 * Canonical · Advisory · Replay-Safe · Authority-Negative
 *****************************************************************************/


function runCrossChainDivergenceMisuseTests() {
  const results = [];


  results.push(testInvalidInputHandling());
  results.push(testFingerprintDivergenceDetection());
  results.push(testAnchorSetDivergenceDetection());
  results.push(testNoAuthorityInjection());
  results.push(testDeterminism());
  results.push(testNoMutation());


  const artifact = {
    schema:
      "merkle.anchor.chain.cross_divergence.misuse_tests",
    schemaVersion: "1.0.0",
    module:
      "analyzeCrossChainDivergence",


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
    const report = analyzeCrossChainDivergence(null);
    return pass("invalid_input_handled",
      "Handled invalid input safely");
  } catch (e) {
    return fail("invalid_input_handled",
      "Analyzer threw on invalid input");
  }
}


function testFingerprintDivergenceDetection() {
  const chain1 = canonical(["A"]);
  const chain2 = canonical(["B"]); // different anchor


  const report =
    analyzeCrossChainDivergence([chain1, chain2]);


  return containsSignal(
    report,
    "chain_fingerprint_divergence"
  )
    ? pass("fingerprint_divergence_detected",
        "Fingerprint divergence detected")
    : fail("fingerprint_divergence_detected",
        "Fingerprint divergence not detected");
}


function testAnchorSetDivergenceDetection() {
  const chain1 = canonical(["A", "B"]);
  const chain2 = canonical(["A"]); // missing B


  const report =
    analyzeCrossChainDivergence([chain1, chain2]);


  return containsSignal(
    report,
    "anchor_set_divergence"
  )
    ? pass("anchor_set_divergence_detected",
        "Anchor set divergence detected")
    : fail("anchor_set_divergence_detected",
        "Anchor set divergence not detected");
}


function testNoAuthorityInjection() {
  const chain = canonical(["A"]);


  const report =
    analyzeCrossChainDivergence([chain]);


  const forbidden =
    ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in report) {
      return fail("authority_injection",
        `Forbidden field present: ${f}`);
    }
  }


  if (report.declaredNonAuthoritative !== true) {
    return fail("authority_flag_missing",
      "declaredNonAuthoritative not true");
  }


  return pass("authority_injection",
    "No authority fields injected");
}


function testDeterminism() {
  const chain1 = canonical(["A", "B"]);
  const chain2 = canonical(["A", "B"]);


  const r1 =
    analyzeCrossChainDivergence([chain1, chain2]);
  const r2 =
    analyzeCrossChainDivergence([chain1, chain2]);


  return r1.divergence_fingerprint ===
         r2.divergence_fingerprint
    ? pass("deterministic_output",
        "Divergence fingerprint stable")
    : fail("deterministic_output",
        "Fingerprint instability detected");
}


function testNoMutation() {
  const chain1 = canonical(["A"]);
  const before = stableFingerprint(chain1);


  analyzeCrossChainDivergence([chain1]);


  const after = stableFingerprint(chain1);


  return before === after
    ? pass("no_mutation",
        "Analyzer does not mutate inputs")
    : fail("mutation_detected",
        "Input chain mutated");
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


function containsSignal(report, code) {
  return (report.signals || [])
    .some(s => s.code === code);
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
 * END OF PATCH-084
 * ========================================================================== */
merkle_anchor_chain_multi_divergence_severity.js
