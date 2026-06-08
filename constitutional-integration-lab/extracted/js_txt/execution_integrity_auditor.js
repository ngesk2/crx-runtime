execution_integrity_auditor.js
/* ============================================================
   execution_integrity_auditor.js
   ------------------------------------------------------------
   Formal Deterministic Replay Verifier
   Advisory-Only Integrity Court


   Version: execution_integrity_auditor.1.0


   Guarantees:
   - Pure replay verification (no mutation)
   - Domain-strict fingerprint recomputation
   - Snapshot integrity validation
   - Scheduler binding validation
   - Execution ID recomputation
   - Artifact fingerprint verification
   - Failure artifact validation
   - Summary artifact validation
   - Drift classification (advisory)
   - No Date / no randomness / no side effects
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "./canonical_fingerprint_service.js";


/* ============================================================
   Version
   ============================================================ */


export const EXECUTION_INTEGRITY_AUDITOR_VERSION =
  "execution_integrity_auditor.1.0";


/* ============================================================
   Drift Severity
   ============================================================ */


const SEVERITY = Object.freeze({
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
});


/* ============================================================
   Utilities
   ============================================================ */


function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}


function deepClone(obj) {
  return structuredClone(obj);
}


function assertStructure(bundle) {
  if (!isPlainObject(bundle)) {
    throw new Error("Execution bundle must be plain object");
  }


  if (!Array.isArray(bundle.artifacts)) {
    throw new Error("Bundle missing artifacts array");
  }


  if (!Array.isArray(bundle.execution_records)) {
    throw new Error("Bundle missing execution_records array");
  }


  if (!Array.isArray(bundle.failures)) {
    throw new Error("Bundle missing failures array");
  }
}


/* ============================================================
   Snapshot Verification
   ============================================================ */


async function verifySnapshot(bundle, checks, drift) {
  const recomputed =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SNAPSHOT,
      bundle.snapshot
    );


  const ok = recomputed === bundle.snapshot_fingerprint;


  checks.snapshot = { ok, recomputed };


  if (!ok) {
    drift.push({
      type: "SNAPSHOT_DRIFT",
      severity: SEVERITY.CRITICAL
    });
  }
}


/* ============================================================
   Scheduler Verification
   ============================================================ */


async function verifyScheduler(bundle, checks, drift) {
  const summary = bundle.artifacts.find(
    a => a.artifact_type === "scheduler.execution_summary"
  );


  if (!summary) {
    drift.push({
      type: "SUMMARY_MISSING",
      severity: SEVERITY.CRITICAL
    });
    checks.scheduler = { ok: false };
    return;
  }


  const binding = {
    snapshot_fingerprint: bundle.snapshot_fingerprint,
    scheduler_version: summary.scheduler_version,
    plugin_order:
      bundle.execution_records.map(r => ({
        plugin_id: r.plugin_id,
        version: r.version
      }))
  };


  const recomputed =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SCHEDULER,
      binding
    );


  const ok = recomputed === bundle.scheduler_fingerprint;


  checks.scheduler = { ok, recomputed };


  if (!ok) {
    drift.push({
      type: "SCHEDULER_DRIFT",
      severity: SEVERITY.CRITICAL
    });
  }
}


/* ============================================================
   Artifact Verification
   ============================================================ */


async function verifyArtifacts(bundle, checks, drift) {
  const artifactMap = new Map();
  const artifactChecks = [];


  for (const artifact of bundle.artifacts) {
    if (!isPlainObject(artifact)) {
      drift.push({
        type: "ARTIFACT_STRUCTURE_INVALID",
        severity: SEVERITY.CRITICAL
      });
      continue;
    }


    if (!artifact.artifact_type) {
      drift.push({
        type: "ARTIFACT_TYPE_MISSING",
        severity: SEVERITY.CRITICAL
      });
    }


    const fp =
      await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.ARTIFACT,
        artifact
      );


    artifactMap.set(fp, artifact);


    artifactChecks.push({
      artifact_type: artifact.artifact_type,
      fingerprint: fp
    });
  }


  checks.artifacts = artifactChecks;
  return artifactMap;
}


/* ============================================================
   Execution Record Verification
   ============================================================ */


async function verifyExecutionRecords(
  bundle,
  artifactMap,
  checks,
  drift
) {
  const recordChecks = [];


  for (const record of bundle.execution_records) {


    const recomputedExecutionId =
      await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.EXECUTION_ID,
        {
          snapshot_fingerprint: bundle.snapshot_fingerprint,
          plugin_id: record.plugin_id,
          version: record.version,
          seed: record.seed || null
        }
      );


    const idOk =
      recomputedExecutionId === record.execution_id;


    if (!idOk) {
      drift.push({
        type: "EXECUTION_ID_DRIFT",
        severity: SEVERITY.CRITICAL,
        plugin_id: record.plugin_id
      });
    }


    const artifactFingerprintSet =
      new Set(record.artifact_fingerprints || []);


    for (const fp of artifactFingerprintSet) {
      if (!artifactMap.has(fp)) {
        drift.push({
          type: "ARTIFACT_MISSING",
          severity: SEVERITY.CRITICAL,
          plugin_id: record.plugin_id
        });
      }
    }


    recordChecks.push({
      plugin_id: record.plugin_id,
      ok: idOk
    });
  }


  checks.execution_records = recordChecks;
}


/* ============================================================
   Failure Verification
   ============================================================ */


async function verifyFailures(bundle, drift) {
  for (const failure of bundle.failures) {
    if (
      failure.artifact_type !== "execution.failure"
    ) {
      drift.push({
        type: "FAILURE_DRIFT",
        severity: SEVERITY.HIGH
      });
    }
  }
}


/* ============================================================
   Summary Verification
   ============================================================ */


function verifySummary(bundle, checks, drift) {
  const summary = bundle.artifacts.find(
    a => a.artifact_type === "scheduler.execution_summary"
  );


  if (!summary) return;


  const ok =
    summary.scheduler_fingerprint ===
    bundle.scheduler_fingerprint;


  checks.summary = { ok };


  if (!ok) {
    drift.push({
      type: "SUMMARY_DRIFT",
      severity: SEVERITY.HIGH
    });
  }
}


/* ============================================================
   Public API
   ============================================================ */


export async function auditExecution(
  executionBundle,
  options = {}
) {
  const bundle = deepClone(executionBundle);


  assertStructure(bundle);


  const checks = {};
  const drift = [];


  await verifySnapshot(bundle, checks, drift);
  await verifyScheduler(bundle, checks, drift);


  const artifactMap =
    await verifyArtifacts(bundle, checks, drift);


  await verifyExecutionRecords(
    bundle,
    artifactMap,
    checks,
    drift
  );


  await verifyFailures(bundle, drift);
  verifySummary(bundle, checks, drift);


  const valid = drift.length === 0;


  return Object.freeze({
    valid,
    auditor_version:
      EXECUTION_INTEGRITY_AUDITOR_VERSION,
    checks,
    drift
  });
}
cross_bundle_divergence_analyzer.js
