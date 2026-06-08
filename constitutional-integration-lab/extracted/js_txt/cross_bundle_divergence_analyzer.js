cross_bundle_divergence_analyzer.js
/* ============================================================
   cross_bundle_divergence_analyzer.js
   ------------------------------------------------------------
   Deterministic Multi-Bundle Divergence Court
   Advisory-Only Structural Comparator


   Version: cross_bundle_divergence_analyzer.1.0


   Guarantees:
   - Pure comparison (no mutation)
   - Deterministic (no Date, no randomness)
   - Domain-aware structural analysis
   - Layered divergence classification
   - Severity taxonomy
   - No authority inference
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "./canonical_fingerprint_service.js";


/* ============================================================
   Version
   ============================================================ */


export const CROSS_BUNDLE_DIVERGENCE_ANALYZER_VERSION =
  "cross_bundle_divergence_analyzer.1.0";


/* ============================================================
   Severity Taxonomy
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


function assertBundleStructure(bundle) {
  if (!isPlainObject(bundle)) {
    throw new Error("Bundle must be plain object");
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


function arrayEqualOrdered(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


function setDifference(setA, setB) {
  const diff = [];
  for (const v of setA) {
    if (!setB.has(v)) diff.push(v);
  }
  return diff;
}


/* ============================================================
   Main Divergence Analyzer
   ============================================================ */


export async function analyzeDivergence(
  bundleAInput,
  bundleBInput,
  options = {}
) {
  const mode = options.mode || "strict";


  const bundleA = deepClone(bundleAInput);
  const bundleB = deepClone(bundleBInput);


  assertBundleStructure(bundleA);
  assertBundleStructure(bundleB);


  const divergences = [];
  const layers = {
    snapshot: { equal: true },
    scheduler: { equal: true },
    runtime: { equal: true },
    execution_records: { equal: true },
    artifacts: { equal: true },
    failures: { equal: true },
    summary: { equal: true }
  };


  /* ============================================================
     SNAPSHOT LAYER
     ============================================================ */


  if (
    bundleA.snapshot_fingerprint !==
    bundleB.snapshot_fingerprint
  ) {
    layers.snapshot.equal = false;
    divergences.push({
      type: "SNAPSHOT_MISMATCH",
      severity: SEVERITY.CRITICAL,
      layer: "snapshot"
    });
  }


  /* ============================================================
     SCHEDULER LAYER
     ============================================================ */


  if (
    bundleA.scheduler_fingerprint !==
    bundleB.scheduler_fingerprint
  ) {
    layers.scheduler.equal = false;
    divergences.push({
      type: "SCHEDULER_FINGERPRINT_DIVERGENCE",
      severity: SEVERITY.HIGH,
      layer: "scheduler"
    });
  }


  if (
    bundleA.scheduler_version !==
    bundleB.scheduler_version
  ) {
    layers.scheduler.equal = false;
    divergences.push({
      type: "SCHEDULER_VERSION_DIVERGENCE",
      severity: SEVERITY.HIGH,
      layer: "scheduler"
    });
  }


  /* ============================================================
     RUNTIME LAYER
     ============================================================ */


  if (
    bundleA.runtime_version !==
    bundleB.runtime_version
  ) {
    layers.runtime.equal = false;


    if (mode === "strict") {
      divergences.push({
        type: "RUNTIME_VERSION_DIVERGENCE",
        severity: SEVERITY.HIGH,
        layer: "runtime"
      });
    }
  }


  /* ============================================================
     EXECUTION RECORD LAYER
     ============================================================ */


  const mapA = new Map();
  const mapB = new Map();


  for (const r of bundleA.execution_records) {
    mapA.set(r.execution_id, r);
  }


  for (const r of bundleB.execution_records) {
    mapB.set(r.execution_id, r);
  }


  for (const [id, recordA] of mapA.entries()) {
    if (!mapB.has(id)) {
      layers.execution_records.equal = false;
      divergences.push({
        type: "EXECUTION_RECORD_MISSING_IN_B",
        severity: SEVERITY.CRITICAL,
        layer: "execution_records",
        execution_id: id
      });
    }
  }


  for (const [id, recordB] of mapB.entries()) {
    if (!mapA.has(id)) {
      layers.execution_records.equal = false;
      divergences.push({
        type: "EXECUTION_RECORD_EXTRA_IN_B",
        severity: SEVERITY.CRITICAL,
        layer: "execution_records",
        execution_id: id
      });
    }
  }


  /* Order divergence */


  const orderA = bundleA.execution_records.map(
    r => r.execution_id
  );
  const orderB = bundleB.execution_records.map(
    r => r.execution_id
  );


  if (!arrayEqualOrdered(orderA, orderB)) {
    layers.execution_records.equal = false;


    if (mode === "strict") {
      divergences.push({
        type: "EXECUTION_ORDER_DIVERGENCE",
        severity: SEVERITY.MEDIUM,
        layer: "execution_records"
      });
    }
  }


  /* ============================================================
     ARTIFACT LAYER
     ============================================================ */


  const artifactSetA = new Set();
  const artifactSetB = new Set();


  for (const a of bundleA.artifacts) {
    const fp = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.ARTIFACT,
      a
    );
    artifactSetA.add(fp);
  }


  for (const a of bundleB.artifacts) {
    const fp = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.ARTIFACT,
      a
    );
    artifactSetB.add(fp);
  }


  const missingInB = setDifference(artifactSetA, artifactSetB);
  const extraInB = setDifference(artifactSetB, artifactSetA);


  if (missingInB.length > 0 || extraInB.length > 0) {
    layers.artifacts.equal = false;


    divergences.push({
      type: "ARTIFACT_SET_DIVERGENCE",
      severity: SEVERITY.CRITICAL,
      layer: "artifacts",
      missing_in_B: missingInB,
      extra_in_B: extraInB
    });
  }


  /* Order divergence (optional) */


  const artifactOrderA = bundleA.artifacts.map(a =>
    JSON.stringify(a)
  );
  const artifactOrderB = bundleB.artifacts.map(a =>
    JSON.stringify(a)
  );


  if (
    mode === "strict" &&
    !arrayEqualOrdered(artifactOrderA, artifactOrderB)
  ) {
    layers.artifacts.equal = false;
    divergences.push({
      type: "ARTIFACT_ORDER_DIVERGENCE",
      severity: SEVERITY.MEDIUM,
      layer: "artifacts"
    });
  }


  /* ============================================================
     FAILURE LAYER
     ============================================================ */


  const failureSetA = new Set(
    bundleA.failures.map(f => JSON.stringify(f))
  );
  const failureSetB = new Set(
    bundleB.failures.map(f => JSON.stringify(f))
  );


  const failureMissing =
    setDifference(failureSetA, failureSetB);
  const failureExtra =
    setDifference(failureSetB, failureSetA);


  if (failureMissing.length || failureExtra.length) {
    layers.failures.equal = false;


    divergences.push({
      type: "FAILURE_SET_DIVERGENCE",
      severity: SEVERITY.HIGH,
      layer: "failures"
    });
  }


  /* ============================================================
     SUMMARY LAYER
     ============================================================ */


  const summaryA = bundleA.artifacts.find(
    a => a.artifact_type === "scheduler.execution_summary"
  );


  const summaryB = bundleB.artifacts.find(
    a => a.artifact_type === "scheduler.execution_summary"
  );


  if (
    JSON.stringify(summaryA) !==
    JSON.stringify(summaryB)
  ) {
    layers.summary.equal = false;


    divergences.push({
      type: "SUMMARY_DIVERGENCE",
      severity: SEVERITY.HIGH,
      layer: "summary"
    });
  }


  /* ============================================================
     Final Result
     ============================================================ */


  const equivalent = divergences.length === 0;


  return Object.freeze({
    equivalent,
    divergence_count: divergences.length,
    analyzer_version:
      CROSS_BUNDLE_DIVERGENCE_ANALYZER_VERSION,
    divergence_layers: layers,
    divergences
  });
}
determinism_stress_harness.js
