snapshot_lineage_integrity_guard.js
/* ============================================================
   snapshot_lineage_integrity_guard.js
   ------------------------------------------------------------
   Constitutional Role:
   - Enforce immutable snapshot ancestry
   - Guarantee replay-safe fingerprint chain
   - Prevent projection residue contamination
   - Detect parent rewriting
   - Detect lineage drift
   - Domain-separated hashing only
   - Async hashing only
   - No sync crypto
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS,
  CanonicalizationError
} from "./canonical_fingerprint_service.js";


/* ============================================================
   Required Domains (Absolute Separation)
   ============================================================ */


const REQUIRED_DOMAINS = Object.freeze({
  SNAPSHOT: FINGERPRINT_DOMAINS.SNAPSHOT,
  LINEAGE_LINK: FINGERPRINT_DOMAINS.LINEAGE_LINK
});


/* ============================================================
   Errors
   ============================================================ */


export class SnapshotLineageIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = "SnapshotLineageIntegrityError";
  }
}


/* ============================================================
   Deep Freeze Utility
   ============================================================ */


function deepFreeze(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (seen.has(obj)) return obj;


  seen.add(obj);


  Object.getOwnPropertyNames(obj).forEach((prop) => {
    deepFreeze(obj[prop], seen);
  });


  return Object.freeze(obj);
}


/* ============================================================
   Snapshot Structural Validation
   ============================================================ */


function validateSnapshotShape(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    throw new SnapshotLineageIntegrityError(
      "Snapshot must be a plain object"
    );
  }


  const allowedFields = [
    "document_text",
    "structural_graph_fingerprint",
    "character_offsets",
    "interaction_events",
    "parent_snapshot_fingerprint",
    "snapshot_fingerprint"
  ];


  const keys = Object.keys(snapshot);


  for (const key of keys) {
    if (!allowedFields.includes(key)) {
      throw new SnapshotLineageIntegrityError(
        `Illegal field in snapshot: ${key}`
      );
    }
  }


  if (typeof snapshot.document_text !== "string") {
    throw new SnapshotLineageIntegrityError(
      "Snapshot document_text must be string"
    );
  }


  if (typeof snapshot.snapshot_fingerprint !== "string") {
    throw new SnapshotLineageIntegrityError(
      "Snapshot fingerprint missing"
    );
  }
}


/* ============================================================
   Projection Residue Detection
   ============================================================ */


function detectProjectionResidue(snapshot) {
  const forbiddenPatterns = [
    "suggestion_artifacts",
    "UI_highlights",
    "projection",
    "overlay",
    "render_plan"
  ];


  const serialized = JSON.stringify(snapshot);


  for (const pattern of forbiddenPatterns) {
    if (serialized.includes(pattern)) {
      throw new SnapshotLineageIntegrityError(
        `Projection residue detected in snapshot: ${pattern}`
      );
    }
  }
}


/* ============================================================
   Parent Fingerprint Validation
   ============================================================ */


async function validateParentLink(snapshot, parentSnapshot) {
  if (!snapshot.parent_snapshot_fingerprint) {
    if (parentSnapshot) {
      throw new SnapshotLineageIntegrityError(
        "Parent provided but child has no parent reference"
      );
    }
    return;
  }


  if (!parentSnapshot) {
    throw new SnapshotLineageIntegrityError(
      "Parent snapshot required but missing"
    );
  }


  if (
    parentSnapshot.snapshot_fingerprint !==
    snapshot.parent_snapshot_fingerprint
  ) {
    throw new SnapshotLineageIntegrityError(
      "Parent fingerprint mismatch"
    );
  }


  const recomputedParentFingerprint = await fingerprintWithDomain(
    REQUIRED_DOMAINS.SNAPSHOT,
    {
      document_text: parentSnapshot.document_text,
      structural_graph_fingerprint:
        parentSnapshot.structural_graph_fingerprint,
      character_offsets: parentSnapshot.character_offsets,
      interaction_events: parentSnapshot.interaction_events,
      parent_snapshot_fingerprint:
        parentSnapshot.parent_snapshot_fingerprint || null
    }
  );


  if (
    recomputedParentFingerprint !==
    parentSnapshot.snapshot_fingerprint
  ) {
    throw new SnapshotLineageIntegrityError(
      "Parent snapshot fingerprint invalid — possible mutation"
    );
  }
}


/* ============================================================
   Snapshot Fingerprint Revalidation
   ============================================================ */


async function validateSnapshotFingerprint(snapshot) {
  const recomputed = await fingerprintWithDomain(
    REQUIRED_DOMAINS.SNAPSHOT,
    {
      document_text: snapshot.document_text,
      structural_graph_fingerprint:
        snapshot.structural_graph_fingerprint,
      character_offsets: snapshot.character_offsets,
      interaction_events: snapshot.interaction_events,
      parent_snapshot_fingerprint:
        snapshot.parent_snapshot_fingerprint || null
    }
  );


  if (recomputed !== snapshot.snapshot_fingerprint) {
    throw new SnapshotLineageIntegrityError(
      "Snapshot fingerprint mismatch — snapshot mutated"
    );
  }
}


/* ============================================================
   Lineage Link Fingerprint (Chain Hash)
   ============================================================ */


async function computeLineageLink(snapshot) {
  return await fingerprintWithDomain(
    REQUIRED_DOMAINS.LINEAGE_LINK,
    {
      parent: snapshot.parent_snapshot_fingerprint || null,
      current: snapshot.snapshot_fingerprint
    }
  );
}


/* ============================================================
   Public Guard API
   ============================================================ */


export async function enforceSnapshotLineageIntegrity({
  snapshot,
  parentSnapshot = null
}) {
  validateSnapshotShape(snapshot);


  detectProjectionResidue(snapshot);


  await validateSnapshotFingerprint(snapshot);


  await validateParentLink(snapshot, parentSnapshot);


  const lineageLink = await computeLineageLink(snapshot);


  deepFreeze(snapshot);


  return {
    snapshot_fingerprint: snapshot.snapshot_fingerprint,
    lineage_link_fingerprint: lineageLink
  };
}
plugin_registry_integrity_guard.js
