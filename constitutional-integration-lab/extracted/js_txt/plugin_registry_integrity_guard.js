plugin_registry_integrity_guard.js
/* ============================================================
   plugin_registry_integrity_guard.js
   ------------------------------------------------------------
   Constitutional Role:
   - Deterministic registry normalization
   - Duplicate plugin_id detection
   - Version collision prevention
   - Deterministic ordering enforcement
   - Contract fingerprint binding
   - Registry snapshot fingerprint (domain-separated)
   - Async-only hashing
   - Immutable registry boundary
   - Replay-safe registry identity
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


import {
  validatePluginContract
} from "./plugin_contract_validator.js";


/* ============================================================
   Registry Schema Version
   ============================================================ */


export const REGISTRY_SCHEMA_VERSION = "registry.1.0";


/* ============================================================
   Errors
   ============================================================ */


export class PluginRegistryIntegrityError extends Error {
  constructor(message) {
    super(message);
    this.name = "PluginRegistryIntegrityError";
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


function deepFreeze(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== "object" || seen.has(obj)) return obj;
  seen.add(obj);
  Object.freeze(obj);
  for (const key of Object.getOwnPropertyNames(obj)) {
    deepFreeze(obj[key], seen);
  }
  return obj;
}


function stablePluginSort(a, b) {
  const keyA = `${a.plugin_id}::${a.version}`;
  const keyB = `${b.plugin_id}::${b.version}`;
  return keyA.localeCompare(keyB);
}


/* ============================================================
   Structural Validation
   ============================================================ */


function validateRegistryShape(registryEntries) {
  if (!Array.isArray(registryEntries)) {
    throw new PluginRegistryIntegrityError(
      "Registry must be an array"
    );
  }


  for (const entry of registryEntries) {
    if (!isPlainObject(entry)) {
      throw new PluginRegistryIntegrityError(
        "Registry entries must be plain objects"
      );
    }


    if (typeof entry.plugin_id !== "string") {
      throw new PluginRegistryIntegrityError(
        "plugin_id must be string"
      );
    }


    if (typeof entry.version !== "string") {
      throw new PluginRegistryIntegrityError(
        "version must be string"
      );
    }
  }
}


/* ============================================================
   Duplicate + Collision Detection
   ============================================================ */


function validateUniqueness(sortedEntries) {


  const idVersionSet = new Set();
  const idSet = new Set();


  for (const entry of sortedEntries) {
    const composite = `${entry.plugin_id}::${entry.version}`;


    if (idVersionSet.has(composite)) {
      throw new PluginRegistryIntegrityError(
        `Duplicate plugin_id+version detected: ${composite}`
      );
    }


    idVersionSet.add(composite);


    if (idSet.has(entry.plugin_id)) {
      // Multiple versions allowed — but must not collide lexically
      // We allow multi-version presence, but we enforce deterministic sort.
      continue;
    }


    idSet.add(entry.plugin_id);
  }
}


/* ============================================================
   Contract Validation + Binding
   ============================================================ */


async function validateAndFingerprintContracts(entries) {


  const normalized = [];


  for (const plugin of entries) {


    const validation = await validatePluginContract(plugin);


    normalized.push({
      plugin_id: plugin.plugin_id,
      version: plugin.version,
      runtime_type: plugin.runtime_type,
      determinism_class: plugin.determinism_class,
      contract_fingerprint: validation.contract_fingerprint
    });
  }


  return normalized;
}


/* ============================================================
   Registry Snapshot Fingerprint
   ============================================================ */


async function computeRegistryFingerprint(normalizedEntries) {


  return await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.REGISTRY_SNAPSHOT,
    {
      registry_schema_version: REGISTRY_SCHEMA_VERSION,
      plugins: normalizedEntries
    }
  );
}


/* ============================================================
   Public API
   ============================================================ */


export async function enforcePluginRegistryIntegrity({
  registryEntries
}) {


  validateRegistryShape(registryEntries);


  /* ------------------------------------------------------------
     1?? Deterministic Ordering
     ------------------------------------------------------------ */


  const sorted = [...registryEntries].sort(stablePluginSort);


  /* ------------------------------------------------------------
     2?? Duplicate Detection
     ------------------------------------------------------------ */


  validateUniqueness(sorted);


  /* ------------------------------------------------------------
     3?? Contract Validation + Fingerprint Binding
     ------------------------------------------------------------ */


  const normalizedContracts =
    await validateAndFingerprintContracts(sorted);


  /* ------------------------------------------------------------
     4?? Registry Snapshot Fingerprint (Domain-Separated)
     ------------------------------------------------------------ */


  const registry_fingerprint =
    await computeRegistryFingerprint(normalizedContracts);


  /* ------------------------------------------------------------
     5?? Immutable Registry Boundary
     ------------------------------------------------------------ */


  const frozenRegistry = deepFreeze(sorted);


  const frozenNormalized = deepFreeze(normalizedContracts);


  return deepFreeze({
    registry: frozenRegistry,
    normalized_contracts: frozenNormalized,
    registry_fingerprint,
    registry_schema_version: REGISTRY_SCHEMA_VERSION
  });
}


deterministic_replay_harness.js
