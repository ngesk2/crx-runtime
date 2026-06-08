deterministic_replay_harness.js
/* ============================================================
   deterministic_replay_harness.js
   ------------------------------------------------------------
   Constitutional Proof Engine


   Version: replay.3.0


   Guarantees:
   - Double-execution determinism enforcement
   - Registry fingerprint binding
   - Invariant topology binding
   - Scheduler fingerprint stability
   - Artifact order stability
   - Runtime identity binding
   - Strict replay mode
   - Structural diff reporting
   - Immutable proof boundary
   ============================================================ */


import {
  fingerprintWithDomain,
  verifyFingerprint,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


import { executePlugins } from "./plugin_execution_scheduler.js";
import { verifyInvariantGraph } from "./formal_invariant_graph_verifier.js";


/* ============================================================ */


function deepFreeze(obj) {
  if (!obj || typeof obj !== "object" || Object.isFrozen(obj))
    return obj;


  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}


function isPlainObject(obj) {
  return obj &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype;
}


function stableStringify(obj) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}


function diffArrays(a, b) {
  const missing = a.filter(x => !b.includes(x));
  const extra = b.filter(x => !a.includes(x));
  return { missing, extra };
}


/* ============================================================ */


export async function runDeterministicReplay({


  snapshot,
  snapshot_fingerprint,
  execution_context = {},
  registryEntries,
  enabled_plugin_ids = [],
  invariantNodes,
  invariantEdges,
  runtime = "vm",
  runtime_options = {},
  strict = true


}) {


  /* ============================================================
     1?? Structural Validation
     ============================================================ */


  if (!isPlainObject(snapshot))
    throw new Error("Snapshot must be plain object");


  if (!Array.isArray(registryEntries))
    throw new Error("registryEntries must be array");


  if (!Array.isArray(invariantNodes) ||
      !Array.isArray(invariantEdges))
    throw new Error("Invariant graph required");


  /* ============================================================
     2?? Snapshot Verification
     ============================================================ */


  const snapshotValid = await verifyFingerprint(
    snapshot,
    snapshot_fingerprint,
    { domain: FINGERPRINT_DOMAINS.SNAPSHOT }
  );


  if (!snapshotValid)
    throw new Error("Snapshot fingerprint mismatch");


  /* ============================================================
     3?? Registry Fingerprint
     ============================================================ */


  const registryFingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.REGISTRY,
      registryEntries
        .map(r => ({
          plugin_id: r.plugin_id,
          version: r.version,
          determinism_class: r.determinism_class
        }))
        .sort((a,b)=>
          a.plugin_id.localeCompare(b.plugin_id)
        )
    );


  /* ============================================================
     4?? Invariant Graph Verification
     ============================================================ */


  const invariantResult =
    await verifyInvariantGraph({
      declaredNodes: invariantNodes,
      declaredEdges: invariantEdges
    });


  const invariant_graph_fingerprint =
    invariantResult.invariant_graph_fingerprint;


  /* ============================================================
     5?? Runtime Identity Binding
     ============================================================ */


  const runtime_identity =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.RUNTIME,
      { runtime, runtime_options }
    );


  /* ============================================================
     6?? Double Scheduler Execution
     ============================================================ */


  const resultA = await executePlugins({
    snapshot,
    snapshot_fingerprint,
    execution_context,
    registryEntries,
    enabled_plugin_ids,
    runtime,
    runtime_options
  });


  const resultB = await executePlugins({
    snapshot,
    snapshot_fingerprint,
    execution_context,
    registryEntries,
    enabled_plugin_ids,
    runtime,
    runtime_options
  });


  /* ============================================================
     7?? Determinism Enforcement
     ============================================================ */


  const artifactsA = resultA.artifacts;
  const artifactsB = resultB.artifacts;


  const fpA = resultA.scheduler_output_fingerprint;
  const fpB = resultB.scheduler_output_fingerprint;


  if (fpA !== fpB) {
    return {
      valid: false,
      reason: "Scheduler output fingerprint mismatch",
      diff: { fpA, fpB }
    };
  }


  if (strict) {
    const strA = stableStringify(artifactsA);
    const strB = stableStringify(artifactsB);


    if (strA !== strB) {
      return {
        valid: false,
        reason: "Artifact structural mismatch",
        diff: diffArrays(
          artifactsA.map(a => JSON.stringify(a)),
          artifactsB.map(a => JSON.stringify(a))
        )
      };
    }
  }


  /* ============================================================
     8?? Artifact Fingerprint Aggregation
     ============================================================ */


  const artifactFingerprints = [];


  for (const artifact of artifactsA) {
    const fp = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.ARTIFACT,
      artifact
    );
    artifactFingerprints.push(fp);
  }


  artifactFingerprints.sort();


  /* ============================================================
     9?? Final Replay Proof
     ============================================================ */


  const replay_proof_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.REPLAY,
      {
        snapshot_fingerprint,
        registryFingerprint,
        invariant_graph_fingerprint,
        runtime_identity,
        scheduler_output_fingerprint: fpA,
        artifactFingerprints
      }
    );


  /* ============================================================
     ?? Immutable Proof Boundary
     ============================================================ */


  return deepFreeze({
    valid: true,
    strict,
    snapshot_fingerprint,
    registryFingerprint,
    invariant_graph_fingerprint,
    runtime_identity,
    scheduler_output_fingerprint: fpA,
    replay_proof_fingerprint,
    artifact_count: artifactsA.length
  });
}
structural_identity_stability_test_suite.js
