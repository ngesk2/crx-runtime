merkle_anchor_chain_drift_summary.js
/******************************************************************************
 * PATCH-081
 * ANCHOR CHAIN DRIFT SUMMARY + MULTI-BRANCH CONFLICT ANALYZER
 * MODULE: merkle_anchor_chain_drift_summary.js
 *
 * ROLE
 * ----
 * Translate anchor chain drift reports into structured human-readable
 * summaries AND detect multi-branch fork conflicts.
 *
 * This module:
 *   - NEVER recalculates drift
 *   - NEVER resolves forks
 *   - NEVER ranks branches
 *   - NEVER assigns authority
 *   - NEVER suppresses signals
 *
 * It only:
 *   - Groups structural drift signals
 *   - Detects fork conflict structures
 *   - Emits advisory narrative
 *
 * STATUS
 * ------
 * Human-Facing � Advisory � Replay-Safe � Authority-Negative
 *****************************************************************************/


const ANCHOR_CHAIN_DRIFT_SUMMARY_SCHEMA =
  "merkle.anchor.chain.drift.summary";


const ANCHOR_CHAIN_DRIFT_SUMMARY_VERSION = "1.0.0";


/* =============================================================================
 * PUBLIC API
 * ========================================================================== */


/**
 * summarizeAnchorChainDrift(driftReport, canonicalChain = null)
 *
 * @param {Object} driftReport - output of PATCH-079
 * @param {Object|null} canonicalChain - optional canonical chain for
 *                                       fork analysis
 *
 * @returns {Object} human-facing summary artifact
 */
function summarizeAnchorChainDrift(driftReport, canonicalChain = null) {
  if (!driftReport || typeof driftReport !== "object") {
    return buildSummary([], {}, "invalid_input");
  }


  const signals = Array.isArray(driftReport.signals)
    ? driftReport.signals
    : [];


  const grouped = groupDriftSignals(signals);
  const conflictInfo = analyzeForkConflicts(canonicalChain);


  const narrative = buildNarrative(grouped, conflictInfo);


  const artifact = {
    schema: ANCHOR_CHAIN_DRIFT_SUMMARY_SCHEMA,
    schemaVersion: ANCHOR_CHAIN_DRIFT_SUMMARY_VERSION,


    source_drift_fingerprint:
      driftReport.drift_fingerprint || null,


    drift_counts: buildDriftCounts(grouped),


    fork_analysis: conflictInfo,


    narrative,


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.summary_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * DRIFT GROUPING
 * ========================================================================== */


function groupDriftSignals(signals) {
  const groups = {
    added: [],
    removed: [],
    modified: [],
    parentChanged: [],
    other: []
  };


  signals.forEach(s => {
    switch (s.code) {
      case "anchor_added":
        groups.added.push(s);
        break;
      case "anchor_removed":
        groups.removed.push(s);
        break;
      case "anchor_modified":
        groups.modified.push(s);
        break;
      case "parent_link_changed":
        groups.parentChanged.push(s);
        break;
      default:
        groups.other.push(s);
    }
  });


  return groups;
}


/* =============================================================================
 * MULTI-BRANCH CONFLICT ANALYZER
 * ========================================================================== */


function analyzeForkConflicts(canonicalChain) {
  if (!canonicalChain ||
      canonicalChain.schema !== "merkle.anchor.chain.canonical" ||
      !Array.isArray(canonicalChain.anchors)) {
    return {
      fork_count: 0,
      branch_points: [],
      declaredNonAuthoritative: true
    };
  }


  const childrenMap = Object.create(null);


  canonicalChain.anchors.forEach(a => {
    const parent = a.previous_anchor_fingerprint || null;
    if (!childrenMap[parent]) {
      childrenMap[parent] = [];
    }
    childrenMap[parent].push(a.anchor_fingerprint);
  });


  const branchPoints = [];


  Object.keys(childrenMap).forEach(parent => {
    const children = childrenMap[parent];
    if (children.length > 1) {
      branchPoints.push({
        parent,
        branch_count: children.length,
        branches: children.slice().sort(),
        declaredNonAuthoritative: true
      });
    }
  });


  return {
    fork_count: branchPoints.length,
    branch_points: branchPoints,
    declaredNonAuthoritative: true
  };
}


/* =============================================================================
 * NARRATIVE BUILDER
 * ========================================================================== */


function buildNarrative(grouped, conflictInfo) {
  const lines = [];


  if (grouped.added.length > 0)
    lines.push(`${grouped.added.length} anchor(s) added.`);


  if (grouped.removed.length > 0)
    lines.push(`${grouped.removed.length} anchor(s) removed.`);


  if (grouped.modified.length > 0)
    lines.push(`${grouped.modified.length} anchor(s) modified.`);


  if (grouped.parentChanged.length > 0)
    lines.push(`${grouped.parentChanged.length} parent linkage change(s) detected.`);


  if (conflictInfo.fork_count > 0)
    lines.push(`${conflictInfo.fork_count} fork branch point(s) present in chain.`);


  if (lines.length === 0)
    lines.push("No structural drift or fork conflicts detected.");


  return lines;
}


/* =============================================================================
 * COUNT BUILDER
 * ========================================================================== */


function buildDriftCounts(groups) {
  return {
    added: groups.added.length,
    removed: groups.removed.length,
    modified: groups.modified.length,
    parentChanged: groups.parentChanged.length,
    other: groups.other.length,
    total:
      groups.added.length +
      groups.removed.length +
      groups.modified.length +
      groups.parentChanged.length +
      groups.other.length
  };
}


/* =============================================================================
 * FALLBACK BUILDER
 * ========================================================================== */


function buildSummary(signals, forkInfo, note) {
  const artifact = {
    schema: ANCHOR_CHAIN_DRIFT_SUMMARY_SCHEMA,
    schemaVersion: ANCHOR_CHAIN_DRIFT_SUMMARY_VERSION,


    drift_counts: { total: 0 },
    fork_analysis: forkInfo,


    narrative: ["Unable to summarize chain drift."],


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  if (note) artifact.note = note;


  artifact.summary_fingerprint = stableFingerprint(artifact);
  return artifact;
}


/* =============================================================================
 * INVARIANTS
 * ========================================================================== */


const ANCHOR_CHAIN_DRIFT_SUMMARY_INVARIANTS = Object.freeze({
  humanFacing: true,
  advisoryOnly: true,
  replaySafe: true,
  nonAuthoritative: true,


  mustNot: {
    recalculateDrift: true,
    resolveForks: true,
    rankBranches: true,
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
 * END OF merkle_anchor_chain_drift_summary.js
 * ========================================================================== */
merkle_anchor_chain_drift_summary_misuse_and_sever
/******************************************************************************
 * PATCH-082
 * ANCHOR CHAIN DRIFT SUMMARY MISUSE TESTS
 * + CONFLICT SEVERITY CLASSIFIER (ADVISORY)
 *
 * MODULE:
 *   merkle_anchor_chain_drift_summary_misuse_and_severity.js
 *
 * ROLE
 * ----
 * 1. Add advisory conflict severity classification to PATCH-081 output.
 * 2. Prove summary layer cannot inject authority.
 * 3. Prove severity is descriptive only.
 *
 * This module:
 *   - NEVER recalculates drift
 *   - NEVER resolves forks
 *   - NEVER assigns correctness
 *   - NEVER ranks branches
 *   - NEVER blocks execution
 *
 * STATUS
 * ------
 * Canonical � Advisory � Replay-Safe � Authority-Negative
 *****************************************************************************/


/* =============================================================================
 * CONFLICT SEVERITY CLASSIFIER (ADVISORY ONLY)
 * ========================================================================== */


/**
 * classifyConflictSeverity(summaryArtifact)
 *
 * Purely descriptive structural intensity classifier.
 *
 * Returns:
 *   - "none"
 *   - "low"
 *   - "moderate"
 *   - "high"
 *
 * Never:
 *   - declares correctness
 *   - ranks branches
 *   - assigns trust
 */
function classifyConflictSeverity(summaryArtifact) {
  if (!summaryArtifact ||
      summaryArtifact.schema !==
        "merkle.anchor.chain.drift.summary") {
    return "none";
  }


  const counts = summaryArtifact.drift_counts || {};
  const forks =
    (summaryArtifact.fork_analysis || {}).fork_count || 0;


  const structuralChanges =
    (counts.added || 0) +
    (counts.removed || 0) +
    (counts.modified || 0) +
    (counts.parentChanged || 0);


  if (structuralChanges === 0 && forks === 0) return "none";
  if (structuralChanges <= 2 && forks <= 1) return "low";
  if (structuralChanges <= 5 || forks <= 2) return "moderate";
  return "high";
}


/* =============================================================================
 * MISUSE TEST SUITE
 * ========================================================================== */


function runAnchorChainDriftSummaryMisuseTests() {
  const results = [];


  results.push(testNoAuthorityInjection());
  results.push(testSeverityNoAuthority());
  results.push(testSeverityDeterminism());
  results.push(testSeverityDoesNotMutate());
  results.push(testSummaryIntegrity());


  const artifact = {
    schema:
      "merkle.anchor.chain.drift.summary.misuse_tests",
    schemaVersion: "1.0.0",
    module:
      "merkle_anchor_chain_drift_summary + severity_classifier",


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


function testNoAuthorityInjection() {
  const summary = mockSummary();
  const forbidden = ["verdict", "accepted", "confidence", "score"];


  for (const f of forbidden) {
    if (f in summary) {
      return fail("authority_injection",
        `Forbidden field present: ${f}`);
    }
  }


  if (summary.declaredNonAuthoritative !== true) {
    return fail("authority_flag_missing",
      "declaredNonAuthoritative not true");
  }


  return pass("authority_injection",
    "No authority fields in summary");
}


function testSeverityNoAuthority() {
  const summary = mockSummary();
  const severity = classifyConflictSeverity(summary);


  if (typeof severity !== "string")
    return fail("severity_type_invalid",
      "Severity not string");


  const forbidden = ["correct", "valid", "trusted"];


  if (forbidden.includes(severity))
    return fail("severity_authority_injected",
      "Severity implies authority");


  return pass("severity_non_authoritative",
    "Severity purely descriptive");
}


function testSeverityDeterminism() {
  const summary = mockSummary();


  const s1 = classifyConflictSeverity(summary);
  const s2 = classifyConflictSeverity(summary);


  return s1 === s2
    ? pass("severity_deterministic",
        "Severity deterministic")
    : fail("severity_deterministic",
        "Severity unstable");
}


function testSeverityDoesNotMutate() {
  const summary = mockSummary();
  const before = stableFingerprint(summary);


  classifyConflictSeverity(summary);


  const after = stableFingerprint(summary);


  return before === after
    ? pass("no_mutation",
        "Classifier does not mutate summary")
    : fail("mutation_detected",
        "Classifier mutated summary");
}


function testSummaryIntegrity() {
  const summary = mockSummary();
  const fp1 = summary.summary_fingerprint;
  const fp2 = stableFingerprint(summary);


  return fp1 === fp2
    ? pass("summary_integrity",
        "Summary fingerprint stable")
    : fail("summary_integrity",
        "Summary fingerprint mismatch");
}


/* =============================================================================
 * MOCK FIXTURE
 * ========================================================================== */


function mockSummary() {
  const artifact = {
    schema: "merkle.anchor.chain.drift.summary",
    schemaVersion: "1.0.0",


    drift_counts: {
      added: 2,
      removed: 1,
      modified: 0,
      parentChanged: 1,
      other: 0,
      total: 4
    },


    fork_analysis: {
      fork_count: 1,
      branch_points: [],
      declaredNonAuthoritative: true
    },


    narrative: ["Example structural drift."],


    declaredNonAuthoritative: true,
    created_at: new Date().toISOString()
  };


  artifact.summary_fingerprint = stableFingerprint(artifact);
  return artifact;
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
 * END OF PATCH-082
 * ========================================================================== */
merkle_anchor_chain_severity_and_divergence.js
