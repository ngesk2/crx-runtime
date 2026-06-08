authority_boundary_prover.js
"use strict";


/**
 * authority_boundary_prover.js
 *
 * FORMAL CONSTITUTIONAL AUTHORITY BOUNDARY PROVER
 *
 * Deterministically verifies:
 *  - Snapshot isolation
 *  - Projection containment
 *  - Artifact neutrality
 *  - Structural identity stability
 *  - Scheduler determinism
 *  - Replay equivalence
 *  - Registry sovereignty
 *  - Domain separation
 *  - Entropy containment
 *
 * Produces:
 *  - Structured domain proof results
 *  - AUTHORITY_PROOF fingerprint
 *
 * Deterministic.
 * Replay-safe.
 * CI-enforceable.
 */


const { fingerprintWithDomain } = require("../core/canonical_fingerprint_service");
const { FINGERPRINT_DOMAINS } = require("../core/canonical_domain_registry");


// ============================================================
// CONFIGURATION
// ============================================================


const STRICT_CONSTITUTIONAL_MODE = true;


const PROOF_VERSION = "1.0.0";


const FORBIDDEN_AUTHORITY_KEYS = [
  "score",
  "rank",
  "percentile",
  "confidence",
  "probability",
  "mastery_score",
  "accuracy",
  "rating"
];


// ============================================================
// CANONICAL SERIALIZER (STRICT + DETERMINISTIC)
// ============================================================


function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    if (typeof value === "string") {
      return value.normalize("NFC");
    }
    return value;
  }


  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }


  const sortedKeys = Object.keys(value)
    .filter(k => value[k] !== undefined)
    .sort();


  const result = {};
  for (const key of sortedKeys) {
    result[key] = canonicalize(value[key]);
  }
  return result;
}


function canonicalJSONStringify(value) {
  return JSON.stringify(canonicalize(value));
}


// ============================================================
// DEEP FREEZE VALIDATION
// ============================================================


function assertDeepFrozen(obj, path = "root") {
  if (!Object.isFrozen(obj)) {
    throw new Error(`Object not frozen at ${path}`);
  }


  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === "object") {
      assertDeepFrozen(value, `${path}.${key}`);
    }
  }
}


// ============================================================
// PROOF DOMAINS
// ============================================================


function proveSnapshotIsolation(report) {
  if (!report || report.pass !== true) {
    throw new Error("Snapshot isolation report invalid or failed");
  }


  return {
    domain: "SNAPSHOT_ISOLATION",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveProjectionContainment(report) {
  if (!report || report.pass !== true) {
    throw new Error("Projection containment report invalid or failed");
  }


  return {
    domain: "PROJECTION_CONTAINMENT",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveArtifactNeutrality(artifacts) {
  if (!Array.isArray(artifacts)) {
    throw new Error("Artifacts must be an array");
  }


  for (const artifact of artifacts) {
    if (artifact.declaredNonAuthoritative !== true) {
      throw new Error("Artifact missing declaredNonAuthoritative === true");
    }


    for (const key of Object.keys(artifact)) {
      if (FORBIDDEN_AUTHORITY_KEYS.includes(key)) {
        throw new Error(`Forbidden authority key detected: ${key}`);
      }
    }
  }


  return {
    domain: "ARTIFACT_NEUTRALITY",
    pass: true,
    fingerprint: null
  };
}


function proveStructuralStability(report) {
  if (!report || report.pass !== true) {
    throw new Error("Structural identity stability failed");
  }


  return {
    domain: "STRUCTURAL_IDENTITY_STABILITY",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveSchedulerDeterminism(report) {
  if (!report || report.pass !== true) {
    throw new Error("Scheduler determinism proof failed");
  }


  return {
    domain: "SCHEDULER_DETERMINISM",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveReplayEquivalence(report) {
  if (!report || report.pass !== true) {
    throw new Error("Replay equivalence proof failed");
  }


  return {
    domain: "REPLAY_EQUIVALENCE",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveRegistrySovereignty(registry) {
  if (!registry || !Array.isArray(registry.plugins)) {
    throw new Error("Registry invalid structure");
  }


  const ids = new Set();
  for (const plugin of registry.plugins) {
    if (!plugin.id || !plugin.version) {
      throw new Error("Registry plugin missing id or version");
    }


    if (ids.has(plugin.id)) {
      throw new Error(`Duplicate plugin id: ${plugin.id}`);
    }


    ids.add(plugin.id);
  }


  assertDeepFrozen(registry);


  return {
    domain: "REGISTRY_SOVEREIGNTY",
    pass: true,
    fingerprint: registry.fingerprint
  };
}


function proveDomainSeparation(report) {
  if (!report || report.pass !== true) {
    throw new Error("Domain separation violation");
  }


  return {
    domain: "DOMAIN_SEPARATION",
    pass: true,
    fingerprint: report.fingerprint
  };
}


function proveEntropyContainment(report) {
  if (!report || report.pass !== true) {
    throw new Error("Entropy containment failed");
  }


  if (report.calls_used > report.calls_allowed) {
    throw new Error("Entropy usage exceeded allowed budget");
  }


  return {
    domain: "ENTROPY_CONTAINMENT",
    pass: true,
    fingerprint: report.fingerprint
  };
}


// ============================================================
// MAIN PROVER
// ============================================================


async function proveAuthorityBoundary({
  snapshotIsolationReport,
  projectionContainmentReport,
  artifacts,
  structuralReport,
  schedulerReport,
  replayReport,
  registrySnapshot,
  domainSeparationReport,
  entropyReport
}) {
  const domainProofs = [];


  domainProofs.push(proveSnapshotIsolation(snapshotIsolationReport));
  domainProofs.push(proveProjectionContainment(projectionContainmentReport));
  domainProofs.push(proveArtifactNeutrality(artifacts));
  domainProofs.push(proveStructuralStability(structuralReport));
  domainProofs.push(proveSchedulerDeterminism(schedulerReport));
  domainProofs.push(proveReplayEquivalence(replayReport));
  domainProofs.push(proveRegistrySovereignty(registrySnapshot));
  domainProofs.push(proveDomainSeparation(domainSeparationReport));
  domainProofs.push(proveEntropyContainment(entropyReport));


  const canonicalPayload = canonicalJSONStringify({
    proof_version: PROOF_VERSION,
    strict_mode: STRICT_CONSTITUTIONAL_MODE,
    domains: domainProofs.map(p => ({
      domain: p.domain,
      pass: p.pass,
      fingerprint: p.fingerprint
    }))
  });


  const authorityFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.AUTHORITY_PROOF,
    canonicalPayload
  );


  return Object.freeze({
    proof_version: PROOF_VERSION,
    strict_mode: STRICT_CONSTITUTIONAL_MODE,
    domains: domainProofs,
    authority_proof_fingerprint: authorityFingerprint
  });
}


module.exports = {
  proveAuthorityBoundary
};
constitutional_ci_gate.js
