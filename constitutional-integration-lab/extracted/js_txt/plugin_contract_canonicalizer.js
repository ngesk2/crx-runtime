plugin_contract_canonicalizer.js
/**
 * PATCH-2
 * plugin_contract_canonicalizer.js
 *
 * Deterministic structural canonicalizer for plugin contracts.
 *
 * Purpose:
 * - Normalize contract structure
 * - Remove undefined values
 * - Normalize optional fields to explicit defaults
 * - Sort keys deterministically (deep)
 * - Enforce JSON-safe structure
 * - Produce deep-frozen canonical object
 *
 * This module does NOT:
 * - Enforce policy ceilings
 * - Perform capability governance
 * - Validate runtime semantics
 * - Execute code
 */


import { FINGERPRINT_DOMAINS } from "../core/canonical_fingerprint_service.js";


/* ============================================================
   Canonicalization Schema Version
   ============================================================ */


export const CONTRACT_CANONICAL_SCHEMA_VERSION = "contract.canonical.v1";


/* ============================================================
   Utilities
   ============================================================ */


function assert(condition, message) {
  if (!condition) throw new Error(message);
}


function isPlainObject(obj) {
  return (
    obj &&
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


/* ============================================================
   JSON Safety Enforcement
   ============================================================ */


function ensureJsonSafe(value, path = "contract", seen = new WeakSet()) {


  if (value === null) return;


  const t = typeof value;


  if (t === "string" || t === "boolean") return;


  if (t === "number") {
    assert(Number.isFinite(value), `${path} contains non-finite number`);
    return;
  }


  if (t === "undefined" || t === "function" || t === "symbol" || t === "bigint") {
    throw new Error(`${path} contains invalid type`);
  }


  if (seen.has(value)) {
    throw new Error(`${path} contains circular reference`);
  }


  seen.add(value);


  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      ensureJsonSafe(value[i], `${path}[${i}]`, seen);
    }
    return;
  }


  if (!isPlainObject(value)) {
    throw new Error(`${path} must contain plain objects only`);
  }


  for (const [k, v] of Object.entries(value)) {
    ensureJsonSafe(v, `${path}.${k}`, seen);
  }
}


/* ============================================================
   Deep Key Sort (Deterministic)
   ============================================================ */


function deepSort(value) {


  if (Array.isArray(value)) {
    return value.map(deepSort);
  }


  if (isPlainObject(value)) {
    const sorted = {};
    const keys = Object.keys(value).sort();
    for (const key of keys) {
      sorted[key] = deepSort(value[key]);
    }
    return sorted;
  }


  return value;
}


/* ============================================================
   Normalize Optional Fields
   ============================================================ */


function normalizeDefaults(contract) {


  const normalized = { ...contract };


  // Normalize capability_scope explicitly
  normalized.capability_scope = {
    network_access: !!contract.capability_scope?.network_access,
    file_system_access: !!contract.capability_scope?.file_system_access,
    cross_snapshot_access: !!contract.capability_scope?.cross_snapshot_access
  };


  // Normalize resource_limits explicitly
  normalized.resource_limits = {
    timeout_ms: contract.resource_limits?.timeout_ms ?? 0,
    max_artifacts: contract.resource_limits?.max_artifacts ?? 0,
    max_artifact_size_kb: contract.resource_limits?.max_artifact_size_kb ?? 0,
    max_depth: contract.resource_limits?.max_depth ?? 0
  };


  // Normalize artifact_contract arrays
  normalized.artifact_contract = {
    allowed_types: [...(contract.artifact_contract?.allowed_types || [])],
    required_fields: [...(contract.artifact_contract?.required_fields || [])],
    prohibited_fields: [...(contract.artifact_contract?.prohibited_fields || [])]
  };


  if (contract.metadata !== undefined) {
    normalized.metadata = contract.metadata;
  }


  // runtime-specific normalization
  if (contract.runtime_type === "vm") {
    normalized.entry_point = contract.entry_point;
  }


  if (contract.runtime_type === "python_subprocess") {
    normalized.python_path = contract.python_path;
  }


  return normalized;
}


/* ============================================================
   Strip Undefined Values
   ============================================================ */


function stripUndefined(value) {


  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }


  if (isPlainObject(value)) {
    const cleaned = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned;
  }


  return value;
}


/* ============================================================
   Public Canonicalizer
   ============================================================ */


export function canonicalizePluginContract(contract) {


  assert(isPlainObject(contract), "Contract must be plain object");


  // Defensive clone (structuredClone for stability)
  const cloned = structuredClone(contract);


  // Remove undefined recursively
  const stripped = stripUndefined(cloned);


  // JSON safety enforcement (except entry_point function)
  const { entry_point, ...jsonSafePart } = stripped;
  ensureJsonSafe(jsonSafePart);


  // Normalize defaults
  const normalized = normalizeDefaults(stripped);


  // Deep sort keys
  const sorted = deepSort(normalized);


  // Attach canonical schema version
  const canonical = {
    _canonical_schema_version: CONTRACT_CANONICAL_SCHEMA_VERSION,
    ...sorted
  };


  return deepFreeze(canonical);
}
execution_integrity_auditor.js
