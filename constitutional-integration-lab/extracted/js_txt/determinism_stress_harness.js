determinism_stress_harness.js
/* ============================================================
   determinism_stress_harness.js
   ------------------------------------------------------------
   Deterministic Execution Stability Prover
   Advisory-Only Stress Validation Layer


   Version: determinism_stress_harness.1.0


   Guarantees:
   - Repeated execution stability validation
   - Parallel execution divergence detection
   - Cross-run fingerprint equivalence analysis
   - No mutation of execution bundles
   - No authority inference
   - Deterministic comparison logic
   - Domain-aware structural validation
   ============================================================ */


import { executePlugins } from "./plugin_execution_scheduler.js";
import { analyzeDivergence } from "./cross_bundle_divergence_analyzer.js";


/* ============================================================
   Version
   ============================================================ */


export const DETERMINISM_STRESS_HARNESS_VERSION =
  "determinism_stress_harness.1.0";


/* ============================================================
   Utilities
   ============================================================ */


function deepClone(obj) {
  return structuredClone(obj);
}


function assertPositiveInteger(n, name) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${name} must be positive integer`);
  }
}


function freezeResult(obj) {
  return Object.freeze(obj);
}


/* ============================================================
   Internal: Execute Single Run
   ============================================================ */


async function executeSingleRun(config) {
  const {
    snapshot,
    snapshot_fingerprint,
    execution_context,
    registryEntries,
    enabled_plugin_ids
  } = config;


  return await executePlugins({
    snapshot: deepClone(snapshot),
    snapshot_fingerprint,
    execution_context: deepClone(execution_context),
    registryEntries,
    enabled_plugin_ids
  });
}


/* ============================================================
   Sequential Mode
   ============================================================ */


async function runSequential(config, runs) {
  const bundles = [];


  for (let i = 0; i < runs; i++) {
    const result = await executeSingleRun(config);
    bundles.push(result);
  }


  return bundles;
}


/* ============================================================
   Parallel Mode
   ============================================================ */


async function runParallel(config, runs) {
  const promises = [];


  for (let i = 0; i < runs; i++) {
    promises.push(executeSingleRun(config));
  }


  return await Promise.all(promises);
}


/* ============================================================
   Divergence Matrix Builder
   ============================================================ */


async function buildDivergenceMatrix(bundles) {
  const matrix = [];
  let divergenceCount = 0;


  for (let i = 0; i < bundles.length; i++) {
    for (let j = i + 1; j < bundles.length; j++) {
      const result = await analyzeDivergence(
        bundles[i],
        bundles[j],
        { mode: "strict" }
      );


      if (!result.equivalent) {
        divergenceCount++;
        matrix.push({
          pair: [i, j],
          divergences: result.divergences
        });
      }
    }
  }


  return { matrix, divergenceCount };
}


/* ============================================================
   Entropy Detection Heuristic
   ============================================================ */


function detectEntropy(bundles) {
  const schedulerFingerprints = new Set(
    bundles.map(b => b.scheduler_fingerprint)
  );


  return schedulerFingerprints.size > 1;
}


/* ============================================================
   Public API
   ============================================================ */


export async function runDeterminismStressTest(
  config,
  options = {}
) {
  const mode = options.mode || "sequential";
  const runs = options.runs || 5;


  assertPositiveInteger(runs, "runs");


  let bundles;


  if (mode === "sequential") {
    bundles = await runSequential(config, runs);
  } else if (mode === "parallel") {
    bundles = await runParallel(config, runs);
  } else {
    throw new Error(
      `Unsupported mode: ${mode}`
    );
  }


  const { matrix, divergenceCount } =
    await buildDivergenceMatrix(bundles);


  const entropyDetected =
    detectEntropy(bundles);


  const stable =
    divergenceCount === 0 && !entropyDetected;


  return freezeResult({
    stable,
    runs,
    mode,
    divergence_count: divergenceCount,
    entropy_detected: entropyDetected,
    divergence_matrix: matrix,
    harness_version:
      DETERMINISM_STRESS_HARNESS_VERSION
  });
}
capability_scope_auditor.js
