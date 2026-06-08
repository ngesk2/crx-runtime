projection_layer_isolation_guard.js
/* ============================================================
   projection_layer_isolation_guard.js
   ------------------------------------------------------------
   Constitutional Ephemerality Enforcement Layer


   Guarantees:
   - Snapshot purity (no projection contamination)
   - Projection isolation (no structural mutation)
   - Domain-separated hashing
   - Async verification only
   - Snapshot lineage protection
   - Deep freeze boundary
   - Replay-safe determinism
   - No silent coercion
   ============================================================ */


import {
  fingerprintWithDomain,
  verifyFingerprint,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================
   Errors
   ============================================================ */


class ProjectionIsolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProjectionIsolationError";
  }
}


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


/* ============================================================
   Snapshot Purity Check
   ============================================================ */


function assertSnapshotPurity(snapshot) {
  if (!isPlainObject(snapshot)) {
    throw new ProjectionIsolationError(
      "Snapshot must be a plain object"
    );
  }


  const forbiddenKeys = [
    "artifacts",
    "projection",
    "projection_layer",
    "scheduler_fingerprint",
    "execution_records",
    "failures",
    "overlay",
    "ui_overlay"
  ];


  for (const key of Object.keys(snapshot)) {
    if (forbiddenKeys.includes(key)) {
      throw new ProjectionIsolationError(
        `Snapshot contamination detected: forbidden key "${key}"`
      );
    }
  }
}


/* ============================================================
   Projection Structure Check
   ============================================================ */


function assertProjectionStructure(projectionLayer) {
  if (!isPlainObject(projectionLayer)) {
    throw new ProjectionIsolationError(
      "Projection layer must be plain object"
    );
  }


  if (!Array.isArray(projectionLayer.artifacts)) {
    throw new ProjectionIsolationError(
      "Projection layer must contain artifacts array"
    );
  }


  if (!projectionLayer.snapshot_fingerprint) {
    throw new ProjectionIsolationError(
      "Projection layer missing snapshot_fingerprint"
    );
  }


  for (const artifact of projectionLayer.artifacts) {
    if (!isPlainObject(artifact)) {
      throw new ProjectionIsolationError(
        "Projection artifact must be plain object"
      );
    }


    if (!artifact.artifact_type) {
      throw new ProjectionIsolationError(
        "Projection artifact missing artifact_type"
      );
    }


    if (artifact.declaredNonAuthoritative !== true) {
      throw new ProjectionIsolationError(
        "Projection artifact must declare declaredNonAuthoritative === true"
      );
    }
  }
}


/* ============================================================
   Snapshot Fingerprint Verification
   ============================================================ */


async function verifySnapshotIntegrity(
  snapshot,
  snapshot_fingerprint
) {
  const valid = await verifyFingerprint(
    snapshot,
    snapshot_fingerprint,
    { domain: FINGERPRINT_DOMAINS.SNAPSHOT }
  );


  if (!valid) {
    throw new ProjectionIsolationError(
      "Snapshot fingerprint mismatch"
    );
  }
}


/* ============================================================
   Projection Fingerprint Binding
   ============================================================ */


async function computeProjectionFingerprint(
  projectionLayer
) {
  return await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.PROJECTION_LAYER,
    {
      snapshot_fingerprint:
        projectionLayer.snapshot_fingerprint,
      artifacts: projectionLayer.artifacts
    }
  );
}


/* ============================================================
   Lineage Guard (Lightweight Cross-Check)
   ============================================================ */


function assertNoProjectionInLineage(snapshot) {
  if (snapshot.parent_snapshot) {
    if (
      snapshot.parent_snapshot.artifacts ||
      snapshot.parent_snapshot.projection_layer
    ) {
      throw new ProjectionIsolationError(
        "Projection contamination detected in snapshot lineage"
      );
    }
  }
}


/* ============================================================
   Public Enforcement Entry
   ============================================================ */


export async function enforceProjectionIsolation({
  snapshot,
  snapshot_fingerprint,
  projectionLayer
}) {


  /* ----------------------------------------------------------
     1?? Snapshot Purity
     ---------------------------------------------------------- */


  assertSnapshotPurity(snapshot);


  /* ----------------------------------------------------------
     2?? Snapshot Fingerprint Verification
     ---------------------------------------------------------- */


  await verifySnapshotIntegrity(
    snapshot,
    snapshot_fingerprint
  );


  /* ----------------------------------------------------------
     3?? Lineage Guard
     ---------------------------------------------------------- */


  assertNoProjectionInLineage(snapshot);


  /* ----------------------------------------------------------
     4?? Projection Structural Validation
     ---------------------------------------------------------- */


  assertProjectionStructure(projectionLayer);


  if (
    projectionLayer.snapshot_fingerprint !==
    snapshot_fingerprint
  ) {
    throw new ProjectionIsolationError(
      "Projection layer references wrong snapshot"
    );
  }


  /* ----------------------------------------------------------
     5?? Projection Fingerprint (Domain-Separated)
     ---------------------------------------------------------- */


  const projection_fingerprint =
    await computeProjectionFingerprint(
      projectionLayer
    );


  /* ----------------------------------------------------------
     6?? Freeze Projection Boundary
     ---------------------------------------------------------- */


  deepFreeze(projectionLayer);


  /* ----------------------------------------------------------
     7?? Return Immutable Boundary Object
     ---------------------------------------------------------- */


  return deepFreeze({
    projection_fingerprint,
    snapshot_fingerprint,
    artifact_count:
      projectionLayer.artifacts.length
  });
}
runtime_adapter.js
