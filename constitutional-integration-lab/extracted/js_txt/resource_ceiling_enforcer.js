resource_ceiling_enforcer.js
/* ============================================================
   resource_ceiling_enforcer.js
   ------------------------------------------------------------
   Deterministic Resource Governance Layer


   Version: resource_ceiling_enforcer.1.0


   Guarantees:
   - Deterministic ceiling enforcement
   - No artifact mutation
   - No artifact dropping
   - Structured deterministic failure artifacts
   - Policy-bound validation
   - No entropy injection
   ============================================================ */


export const RESOURCE_CEILING_ENFORCER_VERSION =
  "resource_ceiling_enforcer.1.0";


/* ============================================================
   System Policy (Hard Upper Bounds)
   ============================================================ */


export const SYSTEM_RESOURCE_POLICY = Object.freeze({
  max_timeout_ms: 10000,
  max_artifacts: 100,
  max_artifact_size_kb: 512,
  max_depth: 50,
  max_memory_mb: 256,
  max_total_artifact_kb: 4096
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


function byteSizeOfObject(obj) {
  return Buffer.byteLength(
    JSON.stringify(obj),
    "utf8"
  );
}


function calculateDepth(obj, depth = 0) {
  if (
    obj === null ||
    typeof obj !== "object"
  ) return depth;


  let max = depth;


  for (const key of Object.keys(obj)) {
    const d = calculateDepth(obj[key], depth + 1);
    if (d > max) max = d;
  }


  return max;
}


function freeze(obj) {
  return Object.freeze(obj);
}


/* ============================================================
   Deterministic Failure Artifact Generator
   ============================================================ */


function createFailureArtifact({
  plugin_id,
  version,
  execution_id,
  reason,
  details
}) {
  return freeze({
    artifact_type: "execution.resource_violation",
    plugin_id,
    version,
    execution_id,
    reason,
    details
  });
}


/* ============================================================
   Main Enforcement Function
   ============================================================ */


export function enforceResourceCeilings({
  plugin,
  execution_id,
  runtimeResult
}) {
  if (!plugin || !runtimeResult) {
    throw new Error("Invalid enforcement input");
  }


  if (!Array.isArray(runtimeResult.artifacts)) {
    throw new Error("Runtime result missing artifacts");
  }


  const limits = plugin.resource_limits || {};


  /* ============================================================
     Merge With System Policy (Hard Caps)
     ============================================================ */


  const effectiveLimits = {
    timeout_ms: Math.min(
      limits.timeout_ms ?? SYSTEM_RESOURCE_POLICY.max_timeout_ms,
      SYSTEM_RESOURCE_POLICY.max_timeout_ms
    ),
    max_artifacts: Math.min(
      limits.max_artifacts ?? SYSTEM_RESOURCE_POLICY.max_artifacts,
      SYSTEM_RESOURCE_POLICY.max_artifacts
    ),
    max_artifact_size_kb: Math.min(
      limits.max_artifact_size_kb ??
        SYSTEM_RESOURCE_POLICY.max_artifact_size_kb,
      SYSTEM_RESOURCE_POLICY.max_artifact_size_kb
    ),
    max_depth: Math.min(
      limits.max_depth ??
        SYSTEM_RESOURCE_POLICY.max_depth,
      SYSTEM_RESOURCE_POLICY.max_depth
    ),
    max_memory_mb: Math.min(
      limits.max_memory_mb ??
        SYSTEM_RESOURCE_POLICY.max_memory_mb,
      SYSTEM_RESOURCE_POLICY.max_memory_mb
    ),
    max_total_artifact_kb: Math.min(
      limits.max_total_artifact_kb ??
        SYSTEM_RESOURCE_POLICY.max_total_artifact_kb,
      SYSTEM_RESOURCE_POLICY.max_total_artifact_kb
    )
  };


  const artifacts = runtimeResult.artifacts;


  /* ============================================================
     Artifact Count Enforcement
     ============================================================ */


  if (artifacts.length > effectiveLimits.max_artifacts) {
    return freeze({
      violated: true,
      failure: createFailureArtifact({
        plugin_id: plugin.plugin_id,
        version: plugin.version,
        execution_id,
        reason: "MAX_ARTIFACT_COUNT_EXCEEDED",
        details: {
          produced: artifacts.length,
          limit: effectiveLimits.max_artifacts
        }
      })
    });
  }


  /* ============================================================
     Artifact Size + Depth Enforcement
     ============================================================ */


  let totalBytes = 0;


  for (const artifact of artifacts) {
    if (!isPlainObject(artifact)) {
      return freeze({
        violated: true,
        failure: createFailureArtifact({
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          execution_id,
          reason: "INVALID_ARTIFACT_STRUCTURE"
        })
      });
    }


    const sizeBytes = byteSizeOfObject(artifact);
    totalBytes += sizeBytes;


    if (
      sizeBytes >
      effectiveLimits.max_artifact_size_kb * 1024
    ) {
      return freeze({
        violated: true,
        failure: createFailureArtifact({
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          execution_id,
          reason: "ARTIFACT_SIZE_EXCEEDED",
          details: {
            size_kb: sizeBytes / 1024,
            limit_kb:
              effectiveLimits.max_artifact_size_kb
          }
        })
      });
    }


    const depth = calculateDepth(artifact);


    if (depth > effectiveLimits.max_depth) {
      return freeze({
        violated: true,
        failure: createFailureArtifact({
          plugin_id: plugin.plugin_id,
          version: plugin.version,
          execution_id,
          reason: "ARTIFACT_DEPTH_EXCEEDED",
          details: {
            depth,
            limit: effectiveLimits.max_depth
          }
        })
      });
    }
  }


  /* ============================================================
     Total Artifact Size Enforcement
     ============================================================ */


  if (
    totalBytes >
    effectiveLimits.max_total_artifact_kb * 1024
  ) {
    return freeze({
      violated: true,
      failure: createFailureArtifact({
        plugin_id: plugin.plugin_id,
        version: plugin.version,
        execution_id,
        reason: "TOTAL_ARTIFACT_SIZE_EXCEEDED",
        details: {
          total_kb: totalBytes / 1024,
          limit_kb:
            effectiveLimits.max_total_artifact_kb
        }
      })
    });
  }


  /* ============================================================
     No Violations
     ============================================================ */


  return freeze({
    violated: false,
    artifacts
  });
}


consensus_quorum_validator.js
