plugin_execution_scheduler.js
/* ============================================================
   plugin_execution_scheduler.js
   ------------------------------------------------------------
   Constitutional Integrated Edition


   Version: scheduler.3.1


   Guarantees:
   - Deterministic lexicographic ordering
   - Snapshot immutability
   - No time leakage
   - No hidden registry coupling
   - Runtime-enforced timeout
   - Contract validation preserved
   - Snapshot binding preserved
   - Entropy guard compatible
   - Domain-separated fingerprinting
   - Replay-safe output
   - Immutable return boundary
   ============================================================ */


import {
  fingerprintWithDomain,
  verifyFingerprint,
  FINGERPRINT_SCHEMA_VERSION,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


import { validateArtifactsAgainstContract } from "./plugin_contract_validator.js";
import { bindArtifactsToSnapshot } from "./artifact_snapshot_binding.js";
import { executeInRuntime } from "./runtime_adapter.js";
import { enforceEntropyBudget } from "./entropy_budget_guard.js";


export const SCHEDULER_VERSION = "scheduler.3.1";


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


function deepFreeze(obj) {
  if (
    obj === null ||
    typeof obj !== "object" ||
    Object.isFrozen(obj)
  ) return obj;


  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}


function assertDeterminismClass(value) {
  if (
    value !== "deterministic" &&
    value !== "probabilistic_bounded"
  ) {
    throw new Error(`Invalid determinism_class: ${value}`);
  }
}


function stableSort(registryEntries, enabledIds) {
  const enabledSet = new Set(enabledIds);


  return registryEntries
    .filter(p => enabledSet.has(p.plugin_id))
    .sort((a, b) => {
      const keyA = `${a.plugin_id}::${a.version}`;
      const keyB = `${b.plugin_id}::${b.version}`;
      return keyA.localeCompare(keyB);
    });
}


/* ============================================================
   Scheduler Entry
   ============================================================ */


export async function executePlugins({
  snapshot,
  snapshot_fingerprint,
  execution_context = {},
  registryEntries,
  enabled_plugin_ids = [],
  runtime = "vm",
  runtime_options = {}
}) {


  /* ------------------------------------------------------------
     Structural Validation
     ------------------------------------------------------------ */


  if (!isPlainObject(snapshot)) {
    throw new Error("Snapshot must be plain object");
  }


  if (!Array.isArray(registryEntries)) {
    throw new Error("registryEntries must be array");
  }


  /* ------------------------------------------------------------
     Snapshot Verification
     ------------------------------------------------------------ */


  const snapshotValid = await verifyFingerprint(
    snapshot,
    snapshot_fingerprint,
    { domain: FINGERPRINT_DOMAINS.SNAPSHOT }
  );


  if (!snapshotValid) {
    throw new Error("Snapshot fingerprint mismatch");
  }


  /* ------------------------------------------------------------
     Clone + Freeze Inputs
     ------------------------------------------------------------ */


  const frozenSnapshot = deepFreeze(structuredClone(snapshot));
  const frozenContext = deepFreeze(structuredClone(execution_context));


  /* ------------------------------------------------------------
     Deterministic Ordering
     ------------------------------------------------------------ */


  const sortedPlugins =
    stableSort(registryEntries, enabled_plugin_ids);


  /* ------------------------------------------------------------
     Scheduler Fingerprint
     ------------------------------------------------------------ */


  const scheduler_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SCHEDULER,
      {
        snapshot_fingerprint,
        scheduler_version: SCHEDULER_VERSION,
        fingerprint_schema: FINGERPRINT_SCHEMA_VERSION,
        plugin_order: sortedPlugins.map(p => ({
          plugin_id: p.plugin_id,
          version: p.version
        }))
      }
    );


  const artifacts = [];
  const execution_records = [];
  const failures = [];


  /* ============================================================
     Execution Loop
     ============================================================ */


  for (const plugin of sortedPlugins) {


    assertDeterminismClass(plugin.determinism_class);


    const seed =
      plugin.determinism_class === "probabilistic_bounded"
        ? await fingerprintWithDomain(
            FINGERPRINT_DOMAINS.PLUGIN_SEED,
            {
              snapshot_fingerprint,
              plugin_id: plugin.plugin_id,
              version: plugin.version
            }
          )
        : null;


    const execution_id =
      await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.EXECUTION_ID,
        {
          snapshot_fingerprint,
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          seed
        }
      );


    const envelope = deepFreeze({
      snapshot: frozenSnapshot,
      snapshot_fingerprint,
      scheduler_fingerprint,
      execution_id,
      plugin_id: plugin.plugin_id,
      version: plugin.version,
      seed,
      execution_context: frozenContext
    });


    try {


      /* --------------------------------------------------------
         Runtime Execution (Timeout enforced inside runtime)
         -------------------------------------------------------- */


      const result =
        await executeInRuntime({
          runtime,
          plugin,
          envelope,
          options: {
            timeout_ms: plugin.resource_limits?.timeout_ms,
            ...runtime_options
          }
        });


      if (!result || !Array.isArray(result.artifacts)) {
        throw new Error("Invalid runtime result");
      }


      /* --------------------------------------------------------
         Optional Entropy Enforcement
         -------------------------------------------------------- */


      if (result.audit) {
        enforceEntropyBudget({
          plugin,
          seed,
          audit: result.audit
        });
      }


      /* --------------------------------------------------------
         Contract Validation
         -------------------------------------------------------- */


      validateArtifactsAgainstContract(
        plugin,
        result.artifacts
      );


      /* --------------------------------------------------------
         Snapshot Binding
         -------------------------------------------------------- */


      const boundArtifacts =
        bindArtifactsToSnapshot({
          artifacts: result.artifacts,
          snapshot_fingerprint,
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          execution_id
        });


      const artifactFingerprints = [];


      for (const artifact of boundArtifacts) {


        if (!isPlainObject(artifact)) {
          throw new Error("Artifact must be plain object");
        }


        const fp =
          await fingerprintWithDomain(
            FINGERPRINT_DOMAINS.ARTIFACT,
            artifact
          );


        artifactFingerprints.push(fp);
        artifacts.push(deepFreeze(artifact));
      }


      execution_records.push(
        deepFreeze({
          artifact_type: "execution.record",
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          execution_id,
          artifact_count: artifactFingerprints.length,
          artifact_fingerprints: artifactFingerprints,
          declaredNonAuthoritative: true
        })
      );


    } catch (err) {


      const failureArtifact = deepFreeze({
        artifact_type: "execution.failure",
        plugin_id: plugin.plugin_id,
        version: plugin.version,
        execution_id,
        error_message: String(err.message),
        declaredNonAuthoritative: true
      });


      failures.push(failureArtifact);
      artifacts.push(failureArtifact);
    }
  }


  /* ------------------------------------------------------------
     Scheduler Output Fingerprint
     ------------------------------------------------------------ */


  const scheduler_output_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SCHEDULER_SUMMARY,
      {
        scheduler_fingerprint,
        artifacts,
        execution_records
      }
    );


  return deepFreeze({
    scheduler_version: SCHEDULER_VERSION,
    scheduler_fingerprint,
    scheduler_output_fingerprint,
    artifacts,
    execution_records,
    failures
  });
}


plugin_isolation_sandbox.js
