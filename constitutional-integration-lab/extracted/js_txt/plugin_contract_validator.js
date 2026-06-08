plugin_contract_validator.js
/**
 * PATCH-1
 * plugin_contract_validator.js
 *
 * Constitutional governance firewall for plugin contracts.
 *
 * Guarantees:
 * - Strict structural validation
 * - Runtime compatibility enforcement
 * - Determinism governance
 * - Capability containment
 * - Resource ceiling enforcement
 * - Artifact vocabulary governance
 * - JSON-safe metadata enforcement
 * - Replay-safe fingerprinting
 * - Deep-frozen validated output
 */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================
   Default Policy (Overrideable)
   ============================================================ */


export const DEFAULT_CONTRACT_POLICY = Object.freeze({
  max_timeout_ms: 15000,
  max_artifacts: 250,
  max_artifact_size_kb: 1024,
  max_depth: 64,


  allow_vm_network: false,
  allow_vm_filesystem: false,


  allow_python_network: false,
  allow_python_filesystem: false
});


/* ============================================================
   Allowed Enumerations
   ============================================================ */


const ALLOWED_RUNTIME_TYPES = Object.freeze([
  "vm",
  "python_subprocess"
]);


const ALLOWED_DETERMINISM_CLASSES = Object.freeze([
  "deterministic",
  "probabilistic_bounded"
]);


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
   JSON Safety Validation
   ============================================================ */


function validateJsonSafe(value, path = "contract", seen = new WeakSet()) {


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
      validateJsonSafe(value[i], `${path}[${i}]`, seen);
    }
    return;
  }


  if (!isPlainObject(value)) {
    throw new Error(`${path} must contain plain objects only`);
  }


  for (const [k, v] of Object.entries(value)) {
    validateJsonSafe(v, `${path}.${k}`, seen);
  }
}


/* ============================================================
   Structural Validation
   ============================================================ */


function validateStructure(plugin) {


  assert(isPlainObject(plugin), "Plugin must be plain object");


  const allowedFields = new Set([
    "plugin_id",
    "version",
    "runtime_type",
    "determinism_class",
    "entry_point",
    "python_path",
    "capability_scope",
    "resource_limits",
    "artifact_contract",
    "metadata"
  ]);


  for (const key of Object.keys(plugin)) {
    assert(allowedFields.has(key), `Unknown contract field: ${key}`);
  }


  const required = [
    "plugin_id",
    "version",
    "runtime_type",
    "determinism_class",
    "capability_scope",
    "resource_limits",
    "artifact_contract"
  ];


  for (const field of required) {
    assert(field in plugin, `Missing required field: ${field}`);
  }


  assert(typeof plugin.plugin_id === "string", "plugin_id must be string");
  assert(typeof plugin.version === "string", "version must be string");


  assert(
    ALLOWED_RUNTIME_TYPES.includes(plugin.runtime_type),
    "Invalid runtime_type"
  );


  assert(
    ALLOWED_DETERMINISM_CLASSES.includes(plugin.determinism_class),
    "Invalid determinism_class"
  );
}


/* ============================================================
   Runtime Compatibility
   ============================================================ */


function validateRuntime(plugin) {


  if (plugin.runtime_type === "vm") {
    assert(typeof plugin.entry_point === "function",
      "VM runtime requires entry_point function");
    assert(plugin.python_path === undefined,
      "VM runtime cannot declare python_path");
  }


  if (plugin.runtime_type === "python_subprocess") {
    assert(typeof plugin.python_path === "string",
      "Python runtime requires python_path");
    assert(plugin.entry_point === undefined,
      "Python runtime cannot declare entry_point");
    assert(!plugin.python_path.includes(".."),
      "Invalid python_path traversal");
  }
}


/* ============================================================
   Determinism Governance
   ============================================================ */


function validateDeterminism(plugin) {


  const caps = plugin.capability_scope;


  if (plugin.determinism_class === "deterministic") {
    assert(caps.network_access === false,
      "Deterministic plugin cannot access network");
    assert(caps.file_system_access === false,
      "Deterministic plugin cannot access filesystem");
    assert(caps.cross_snapshot_access === false,
      "Deterministic plugin cannot access cross_snapshot");
  }
}


/* ============================================================
   Capability Governance
   ============================================================ */


function validateCapabilities(plugin, policy) {


  const caps = plugin.capability_scope;


  assert(isPlainObject(caps), "capability_scope must be object");


  const allowedKeys = [
    "network_access",
    "file_system_access",
    "cross_snapshot_access"
  ];


  for (const key of Object.keys(caps)) {
    assert(allowedKeys.includes(key),
      `Unknown capability flag: ${key}`);
    assert(typeof caps[key] === "boolean",
      `Capability ${key} must be boolean`);
  }


  if (plugin.runtime_type === "vm") {
    if (caps.network_access && !policy.allow_vm_network)
      throw new Error("VM network not allowed by policy");
    if (caps.file_system_access && !policy.allow_vm_filesystem)
      throw new Error("VM filesystem not allowed by policy");
  }


  if (plugin.runtime_type === "python_subprocess") {
    if (caps.network_access && !policy.allow_python_network)
      throw new Error("Python network not allowed by policy");
    if (caps.file_system_access && !policy.allow_python_filesystem)
      throw new Error("Python filesystem not allowed by policy");
  }
}


/* ============================================================
   Resource Limits Governance
   ============================================================ */


function validateResources(plugin, policy) {


  const r = plugin.resource_limits;


  assert(isPlainObject(r), "resource_limits must be object");


  const fields = [
    "timeout_ms",
    "max_artifacts",
    "max_artifact_size_kb",
    "max_depth"
  ];


  for (const f of fields) {
    assert(typeof r[f] === "number" && r[f] > 0,
      `${f} must be positive number`);
  }


  assert(r.timeout_ms <= policy.max_timeout_ms,
    "timeout exceeds policy");
  assert(r.max_artifacts <= policy.max_artifacts,
    "max_artifacts exceeds policy");
  assert(r.max_artifact_size_kb <= policy.max_artifact_size_kb,
    "artifact size exceeds policy");
  assert(r.max_depth <= policy.max_depth,
    "max_depth exceeds policy");
}


/* ============================================================
   Artifact Contract Governance
   ============================================================ */


function validateArtifactContract(plugin) {


  const c = plugin.artifact_contract;


  assert(isPlainObject(c), "artifact_contract must be object");


  assert(Array.isArray(c.allowed_types) && c.allowed_types.length > 0,
    "allowed_types must be non-empty array");


  assert(Array.isArray(c.required_fields),
    "required_fields must be array");


  assert(Array.isArray(c.prohibited_fields),
    "prohibited_fields must be array");


  assert(c.required_fields.includes("artifact_type"),
    "artifact_type must be required");


  const requiredSet = new Set(c.required_fields);


  for (const f of c.prohibited_fields) {
    assert(!requiredSet.has(f),
      "Field cannot be both required and prohibited");
  }
}


/* ============================================================
   Public API
   ============================================================ */


export async function validatePluginContract(
  plugin,
  policy = DEFAULT_CONTRACT_POLICY
) {


  validateStructure(plugin);
  validateRuntime(plugin);
  validateDeterminism(plugin);
  validateCapabilities(plugin, policy);
  validateResources(plugin, policy);
  validateArtifactContract(plugin);


  if (plugin.metadata !== undefined) {
    validateJsonSafe(plugin.metadata, "metadata");
  }


  const fingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.PLUGIN_CONTRACT,
    plugin
  );


  return deepFreeze({
    valid: true,
    contract_fingerprint: fingerprint,
    normalized_contract: plugin
  });
}
plugin_contract_canonicalizer.js
