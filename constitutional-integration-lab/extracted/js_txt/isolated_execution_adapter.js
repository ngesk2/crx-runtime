isolated_execution_adapter.js
/* ============================================================
   isolated_execution_adapter.js (Hardened Constitutional)
   ------------------------------------------------------------
   Guarantees:
   - Cross-runtime deterministic abstraction
   - Canonical envelope fingerprinting
   - Deep immutability enforcement
   - Adapter identity binding
   - Execution ID binding
   - Artifact canonicalization
   - Firewall enforcement
   - Resource containment
   - Cross-runtime replay stability
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


import {
  validateArtifactsAgainstContract
} from "./plugin_contract_validator.js";


import {
  enforceArtifactFirewall
} from "./artifact_firewall.js";


/* ============================================================ */


import { JsVmAdapter } from "./runtime_adapters/js_vm_adapter.js";
import { WorkerThreadAdapter } from "./runtime_adapters/worker_thread_adapter.js";
import { PythonSubprocessAdapter } from "./runtime_adapters/python_subprocess_adapter.js";


/* ============================================================ */


export const EXECUTION_CAPSULE_VERSION = "execution_capsule.2.0";


/* ============================================================ */


export class ExecutionIsolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExecutionIsolationError";
  }
}


/* ============================================================
   Canonicalization
   ============================================================ */


function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }


  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(value[key]);
        return acc;
      }, {});
  }


  return value;
}


/* ============================================================
   Deep Freeze
   ============================================================ */


function deepFreeze(obj) {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      deepFreeze(obj[key]);
    }
  }
  return obj;
}


/* ============================================================
   Adapter Selection
   ============================================================ */


function selectRuntimeAdapter(plugin) {


  switch (plugin.runtime_type) {


    case "vm":
      return new JsVmAdapter();


    case "worker_thread":
      return new WorkerThreadAdapter();


    case "python_subprocess":
      return new PythonSubprocessAdapter();


    default:
      throw new ExecutionIsolationError(
        `Unsupported runtime_type: ${plugin.runtime_type}`
      );
  }
}


/* ============================================================
   Envelope Fingerprint
   ============================================================ */


async function computeEnvelopeFingerprint(envelope) {
  return fingerprintWithDomain(
    FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
    canonicalize(envelope)
  );
}


/* ============================================================
   Artifact Sanitization (Strict)
   ============================================================ */


function assertPlainObject(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new ExecutionIsolationError(
      "Artifact must be plain object"
    );
  }
}


function sanitizeArtifacts(artifacts) {


  if (!Array.isArray(artifacts)) {
    throw new ExecutionIsolationError(
      "Artifacts must be array"
    );
  }


  return artifacts.map(a => {
    assertPlainObject(a);


    const clean = {};


    for (const key of Object.keys(a).sort()) {
      const value = a[key];


      if (
        typeof value === "function" ||
        typeof value === "symbol" ||
        typeof value === "undefined"
      ) {
        throw new ExecutionIsolationError(
          "Invalid artifact value type"
        );
      }


      clean[key] = value;
    }


    return clean;
  });
}


/* ============================================================
   Resource Enforcement
   ============================================================ */


function enforceResourceLimits(plugin, artifacts) {


  const limits = plugin.resource_limits || {};


  if (
    typeof limits.max_artifacts === "number" &&
    artifacts.length > limits.max_artifacts
  ) {
    throw new ExecutionIsolationError(
      "Artifact count exceeds declared limit"
    );
  }
}


/* ============================================================
   Main Execution Entry
   ============================================================ */


export async function runIsolatedExecution({
  plugin,
  executionEnvelope,
  execution_id
}) {


  if (!plugin || !executionEnvelope || !execution_id) {
    throw new ExecutionIsolationError(
      "plugin, executionEnvelope, execution_id required"
    );
  }


  /* ------------------------------------------------------------
     1?? Canonical Freeze + Pre-Fingerprint
     ------------------------------------------------------------ */


  const canonicalEnvelope = canonicalize(executionEnvelope);
  deepFreeze(canonicalEnvelope);


  const preFingerprint =
    await computeEnvelopeFingerprint(canonicalEnvelope);


  /* ------------------------------------------------------------
     2?? Adapter Selection
     ------------------------------------------------------------ */


  const adapter = selectRuntimeAdapter(plugin);


  if (!adapter || typeof adapter.execute !== "function") {
    throw new ExecutionIsolationError(
      "Invalid runtime adapter"
    );
  }


  /* ------------------------------------------------------------
     3?? Execute Inside Adapter
     ------------------------------------------------------------ */


  const result = await adapter.execute({
    plugin,
    envelope: canonicalEnvelope,
    execution_id,
    resource_limits: plugin.resource_limits,
    determinism_class: plugin.determinism_class
  });


  if (!result || !Array.isArray(result.artifacts)) {
    throw new ExecutionIsolationError(
      "Adapter returned invalid result"
    );
  }


  /* ------------------------------------------------------------
     4?? Artifact Sanitization + Canonicalization
     ------------------------------------------------------------ */


  const sanitizedArtifacts =
    sanitizeArtifacts(result.artifacts)
      .map(a => canonicalize(a));


  /* ------------------------------------------------------------
     5?? Contract Validation
     ------------------------------------------------------------ */


  validateArtifactsAgainstContract(
    plugin,
    sanitizedArtifacts
  );


  /* ------------------------------------------------------------
     6?? Firewall Enforcement
     ------------------------------------------------------------ */


  enforceArtifactFirewall(sanitizedArtifacts);


  /* ------------------------------------------------------------
     7?? Resource Enforcement
     ------------------------------------------------------------ */


  enforceResourceLimits(plugin, sanitizedArtifacts);


  /* ------------------------------------------------------------
     8?? Envelope Integrity Recheck
     ------------------------------------------------------------ */


  const postFingerprint =
    await computeEnvelopeFingerprint(canonicalEnvelope);


  if (postFingerprint !== preFingerprint) {
    throw new ExecutionIsolationError(
      "Execution envelope mutated"
    );
  }


  /* ------------------------------------------------------------
     9?? Execution Runtime Fingerprint (Bound to Execution ID)
     ------------------------------------------------------------ */


  const execution_runtime_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_RECORD,
      canonicalize({
        plugin_id: plugin.plugin_id,
        version: plugin.version,
        runtime_type: plugin.runtime_type,
        execution_id,
        capsule_version: EXECUTION_CAPSULE_VERSION,
        artifact_count: sanitizedArtifacts.length
      })
    );


  return Object.freeze({
    artifacts: Object.freeze(
      sanitizedArtifacts.map(a => Object.freeze(a))
    ),
    execution_runtime_fingerprint,
    capsule_version: EXECUTION_CAPSULE_VERSION
  });
}
adversarial_red_team_harness.js
