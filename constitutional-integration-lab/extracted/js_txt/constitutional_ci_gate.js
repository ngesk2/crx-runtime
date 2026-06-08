constitutional_ci_gate.js
"use strict";


/**
 * constitutional_ci_gate.js
 *
 * Version: constitutional_ci_gate.3.0
 *
 * Sovereign Constitutional Deployment Gate
 *
 * Determinism-first.
 * Domain-separated.
 * Authority-contained.
 * Replay-verified.
 * Source-tree-bound.
 * Registry-bound.
 * Topology-verified.
 * Environment-neutral.
 *
 * Blocks deployment if ANY invariant fails.
 */
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
const { proveAuthorityBoundary } = require("../invariants/authority_boundary_prover");


const authorityProof = await proveAuthorityBoundary({
  snapshotIsolationReport,
  projectionContainmentReport,
  artifacts,
  structuralReport,
  schedulerReport,
  replayReport,
  registrySnapshot,
  domainSeparationReport,
  entropyReport
});


console.log("Authority Proof:", authorityProof.authority_proof_fingerprint);
const fs = require("fs");
const path = require("path");


const {
  fingerprintWithDomain,
  DOMAIN_REGISTRY
} = require("./canonical_fingerprint_service");


const {
  verifyInvariantGraph
} = require("./formal_invariant_graph_verifier");


// ============================================================
// VERSION
// ============================================================


const CI_VERSION = "constitutional_ci_gate.3.0";


// ============================================================
// DOMAIN EXTRACTION (NO RAW STRINGS)
// ============================================================


const {
  CI_VERIFICATION,
  SOURCE_TREE_FINGERPRINT,
  REGISTRY_SNAPSHOT,
  AUTHORITY_GRAPH
} = DOMAIN_REGISTRY;


if (!CI_VERIFICATION ||
    !SOURCE_TREE_FINGERPRINT ||
    !REGISTRY_SNAPSHOT ||
    !AUTHORITY_GRAPH) {
  throw new Error("Required domain missing in DOMAIN_REGISTRY");
}


// ============================================================
// ERROR TYPE
// ============================================================


class ConstitutionalViolationError extends Error {
  constructor(payload) {
    super("Constitutional CI Gate Failed");
    this.name = "ConstitutionalViolationError";
    this.payload = payload;
  }
}


// ============================================================
// DETERMINISTIC FILE DISCOVERY
// ============================================================


function walkDirectoryDeterministic(dir, collected = []) {
  const entries = fs.readdirSync(dir).sort();


  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);


    if (stat.isDirectory()) {
      walkDirectoryDeterministic(full, collected);
    } else if (full.endsWith(".js")) {
      collected.push(full);
    }
  }


  return collected;
}


function normalizeContent(content) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "");
}


function loadSourceFiles(source_code_paths) {
  const files = [];
  const sortedPaths = [...source_code_paths].sort();


  for (const p of sortedPaths) {
    if (!fs.existsSync(p)) continue;


    const stat = fs.statSync(p);


    if (stat.isDirectory()) {
      files.push(...walkDirectoryDeterministic(p));
    } else if (p.endsWith(".js")) {
      files.push(p);
    }
  }


  return files
    .sort()
    .map(file => ({
      file,
      content: normalizeContent(
        fs.readFileSync(file, "utf8")
      )
    }));
}


// ============================================================
// SOURCE TREE FINGERPRINT
// ============================================================


async function computeSourceTreeFingerprint(sourceFiles) {
  const canonical = sourceFiles
    .slice()
    .sort((a, b) => a.file.localeCompare(b.file));


  return await fingerprintWithDomain(
    SOURCE_TREE_FINGERPRINT,
    canonical
  );
}


// ============================================================
// STATIC ANALYSIS
// ============================================================


function scanForSyncHashing(sourceFiles) {
  const violations = [];
  const forbidden = [
    /crypto\.createHash\s*\(/,
    /\.digest\s*\(/,
    /\.update\s*\(/
  ];


  for (const file of sourceFiles) {
    for (const pattern of forbidden) {
      if (pattern.test(file.content)) {
        violations.push({
          invariant_id: "ASYNC_HASH_ONLY",
          module: file.file,
          evidence: pattern.toString()
        });
      }
    }
  }


  return violations;
}


function scanForLiteralDomainUsage(sourceFiles) {
  const violations = [];
  const pattern = /fingerprintWithDomain\s*\(\s*["']/;


  for (const file of sourceFiles) {
    if (pattern.test(file.content)) {
      violations.push({
        invariant_id: "LITERAL_DOMAIN_USAGE",
        module: file.file,
        evidence: pattern.toString()
      });
    }
  }


  return violations;
}


function scanForForbiddenRuntime(sourceFiles) {
  const violations = [];
  const forbidden = [
    /\bDate\b/,
    /Math\.random\s*\(/,
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bWebAssembly\b/,
    /\bProxy\b/,
    /\bReflect\b/,
    /crypto\.randomUUID\s*\(/
  ];


  for (const file of sourceFiles) {
    for (const pattern of forbidden) {
      if (pattern.test(file.content)) {
        violations.push({
          invariant_id: "FORBIDDEN_RUNTIME_CONSTRUCT",
          module: file.file,
          evidence: pattern.toString()
        });
      }
    }
  }


  return violations;
}


function scanForAuthorityLeakage(sourceFiles) {
  const violations = [];
  const pattern =
    /\b(score|rank|grade|confidence|percentile|probability|severity|rating)\s*:/i;


  for (const file of sourceFiles) {
    if (pattern.test(file.content)) {
      violations.push({
        invariant_id: "AUTHORITY_FIELD_LEAK",
        module: file.file,
        evidence: pattern.toString()
      });
    }
  }


  return violations;
}


// ============================================================
// DOMAIN REGISTRY VALIDATION
// ============================================================


async function fingerprintDomainRegistry() {
  const sorted = Object.values(DOMAIN_REGISTRY).sort();


  return await fingerprintWithDomain(
    REGISTRY_SNAPSHOT,
    sorted
  );
}


function scanForDomainReuse() {
  const violations = [];
  const seen = new Set();


  const domains = Object.values(DOMAIN_REGISTRY).sort();


  for (const domain of domains) {
    if (seen.has(domain)) {
      violations.push({
        invariant_id: "DOMAIN_REUSE",
        module: "canonical_fingerprint_service",
        evidence: domain
      });
    }
    seen.add(domain);
  }


  return violations;
}


// ============================================================
// SUITE WRAPPER
// ============================================================


async function runSuite(suite, invariant_id, module_name) {
  if (!suite || typeof suite.run !== "function") {
    return [];
  }


  const result = await suite.run();


  if (!result.pass || !result.fingerprint) {
    return [{
      invariant_id,
      module: module_name,
      evidence: "Suite failed or fingerprint missing"
    }];
  }


  return [];
}


// ============================================================
// REGISTRY INTEGRITY
// ============================================================


async function verifyRegistryIntegrity(registry_snapshot) {
  const violations = [];
  const seen = new Set();


  const sorted =
    registry_snapshot.plugins
      .slice()
      .sort((a, b) =>
        (a.plugin_id + a.version)
          .localeCompare(b.plugin_id + b.version)
      );


  for (const plugin of sorted) {
    const key = `${plugin.plugin_id}@${plugin.version}`;


    if (seen.has(key)) {
      violations.push({
        invariant_id: "REGISTRY_DUPLICATE_VERSION",
        module: "plugin_registry",
        evidence: key
      });
    }


    seen.add(key);
  }


  return violations;
}


// ============================================================
// SORTING
// ============================================================


function sortViolations(violations) {
  return violations.slice().sort((a, b) => {
    const aKey = `${a.invariant_id}|${a.module}`;
    const bKey = `${b.invariant_id}|${b.module}`;
    return aKey.localeCompare(bKey);
  });
}


// ============================================================
// MAIN EXECUTION
// ============================================================


async function runConstitutionalCIGate(config) {


  if (process.env.NODE_ENV) {
    throw new Error(
      "Environment-dependent execution forbidden in CI"
    );
  }


  const {
    source_code_paths,
    registry_snapshot,
    deterministic_replay_suite,
    structural_test_suite,
    entropy_budget_suite,
    invariant_graph_spec
  } = config;


  const violations = [];


  const sourceFiles = loadSourceFiles(source_code_paths);


  violations.push(...scanForSyncHashing(sourceFiles));
  violations.push(...scanForLiteralDomainUsage(sourceFiles));
  violations.push(...scanForForbiddenRuntime(sourceFiles));
  violations.push(...scanForAuthorityLeakage(sourceFiles));
  violations.push(...scanForDomainReuse());
  violations.push(...await verifyRegistryIntegrity(registry_snapshot));


  violations.push(...await runSuite(
    deterministic_replay_suite,
    "REPLAY_NONDETERMINISM",
    "deterministic_replay_harness"
  ));


  violations.push(...await runSuite(
    structural_test_suite,
    "STRUCTURAL_IDENTITY_DRIFT",
    "structural_identity_stability_test_suite"
  ));


  violations.push(...await runSuite(
    entropy_budget_suite,
    "ENTROPY_BUDGET_EXCEEDED",
    "entropy_budget_guard"
  ));


  const graphResult =
    await verifyInvariantGraph(invariant_graph_spec);


  const sortedViolations = sortViolations(violations);


  const source_tree_fingerprint =
    await computeSourceTreeFingerprint(sourceFiles);


  const registry_fingerprint =
    await fingerprintWithDomain(
      REGISTRY_SNAPSHOT,
      registry_snapshot
    );


  const domain_registry_fingerprint =
    await fingerprintDomainRegistry();


  const canonical_payload = Object.freeze({
    ci_version: CI_VERSION,
    ci_passed: sortedViolations.length === 0,
    violations: sortedViolations,
    source_tree_fingerprint,
    registry_fingerprint,
    domain_registry_fingerprint,
    invariant_graph_fingerprint:
      graphResult.invariant_graph_fingerprint
  });


  const ci_fingerprint =
    await fingerprintWithDomain(
      CI_VERIFICATION,
      canonical_payload
    );


  const result = Object.freeze({
    ...canonical_payload,
    ci_fingerprint
  });


  if (!canonical_payload.ci_passed) {
    throw new ConstitutionalViolationError(result);
  }


  return result;
}


// ============================================================
// EXPORTS
// ============================================================


module.exports = {
  runConstitutionalCIGate,
  ConstitutionalViolationError
};


domain_lockfile_fingerprint_guard.js
