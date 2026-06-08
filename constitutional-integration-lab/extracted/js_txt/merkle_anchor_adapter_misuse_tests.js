/******************************************************************************
 * PATCH-066 (REWRITE)
 * MERKLE ANCHOR ADAPTER — MISUSE TESTS
 *
 * Constitutional · Advisory · Replay-Safe · Authority-Negative
 *
 * Guarantees:
 * - Deterministic output
 * - No wall-clock entropy
 * - No local hashing implementation
 * - Domain-separated fingerprinting
 * - No authority inference
 * - Never throws
 ******************************************************************************/


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* =============================================================================
 * PUBLIC TEST RUNNER
 * ========================================================================== */


export async function runMerkleAnchorAdapterMisuseTests() {


  const results = [];


  results.push(testRejectsNonArrayFingerprints());
  results.push(testDeterministicOrdering());
  results.push(testIgnoresAnchorAuthorityClaims());
  results.push(testAcceptsMalformedAnchorReference());
  results.push(testNeverThrows());
  results.push(testEmptyInputHandling());


  const artifact = {
    artifact_type: "merkle.anchor.adapter.misuse_tests",
    schema_version: "2.0.0",
    module: "merkle_anchor_adapter",


    results,
    summary: summarize(results),


    declaredNonAuthoritative: true
  };


  // Domain-separated fingerprint
  const fingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.MERKLE_ANCHOR_ADAPTER_MISUSE,
    artifact
  );


  return Object.freeze({
    ...artifact,
    artifact_fingerprint: fingerprint
  });
}


/* =============================================================================
 * MISUSE TESTS
 * ========================================================================== */


function testRejectsNonArrayFingerprints() {
  try {
    const a = createMerkleAnchorEvidence("not-an-array", {});
    return Array.isArray(a.signals)
      ? pass("non_array_fingerprints")
      : fail("non_array_fingerprints", "signals not emitted");
  } catch {
    return fail("non_array_fingerprints", "adapter threw");
  }
}


function testDeterministicOrdering() {
  const fpA = ["c", "b", "a"];
  const fpB = ["a", "b", "c"];


  const a = createMerkleAnchorEvidence(fpA, {});
  const b = createMerkleAnchorEvidence(fpB, {});


  return a.merkle_root === b.merkle_root
    ? pass("deterministic_ordering")
    : fail("deterministic_ordering", "root changed with ordering");
}


function testIgnoresAnchorAuthorityClaims() {
  const anchor = {
    system: "blockchain",
    reference: "tx:123",
    verified: true,
    final: true,
    authority: "absolute"
  };


  const a = createMerkleAnchorEvidence(["fp:a"], anchor);


  const serialized = JSON.stringify(a);


  const leaked =
    serialized.includes("verified") ||
    serialized.includes("final") ||
    serialized.includes("authority");


  return leaked
    ? fail("ignores_anchor_authority_claims", "authority leaked")
    : pass("ignores_anchor_authority_claims");
}


function testAcceptsMalformedAnchorReference() {
  try {
    createMerkleAnchorEvidence(["fp:a"], "not-an-object");
    return pass("accepts_malformed_anchor_reference");
  } catch {
    return fail("accepts_malformed_anchor_reference", "adapter threw");
  }
}


function testEmptyInputHandling() {
  try {
    const a = createMerkleAnchorEvidence([], {});
    return a.merkle_root === null
      ? pass("empty_input_handling")
      : fail("empty_input_handling", "unexpected root");
  } catch {
    return fail("empty_input_handling", "adapter threw");
  }
}


function testNeverThrows() {
  try {
    createMerkleAnchorEvidence(null, null);
    createMerkleAnchorEvidence(42, 99);
    createMerkleAnchorEvidence(undefined, undefined);
    return pass("never_throws");
  } catch {
    return fail("never_throws", "adapter threw");
  }
}


/* =============================================================================
 * HELPERS
 * ========================================================================== */


function pass(test) {
  return Object.freeze({
    test,
    status: "pass"
  });
}


function fail(test, message) {
  return Object.freeze({
    test,
    status: "fail",
    message
  });
}


function summarize(results) {
  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;


  return Object.freeze({ passed, failed });
}


/* =============================================================================
 * END
 * ========================================================================== */


merkle_anchor_replay_verifier.js
