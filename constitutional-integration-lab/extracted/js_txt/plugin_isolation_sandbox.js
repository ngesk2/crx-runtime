plugin_isolation_sandbox.js
/* ============================================================
   plugin_isolation_sandbox.js
   ------------------------------------------------------------
   Deterministic Execution Capsule
   Constitutional Firewall Layer


   Runtime Version: runtime.2.0


   Guarantees:
   - Envelope immutability + re-fingerprint
   - Deterministic PRNG (seeded, replay-stable)
   - Additive capability injection
   - No host mutation
   - No Date / eval / Function / dynamic code
   - Strict artifact structural validation
   - Deep freeze of artifacts
   - Optional audit transcript
   - Adapter-ready architecture (VM implemented)
   ============================================================ */


import vm from "vm";


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "./canonical_fingerprint_service.js";


/* ============================================================
   Runtime Version
   ============================================================ */


export const DETERMINISTIC_RUNTIME_VERSION = "runtime.2.0";


/* ============================================================
   Errors
   ============================================================ */


class SandboxError extends Error {
  constructor(message) {
    super(message);
    this.name = "SandboxError";
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
   Deterministic PRNG (xorshift32)
   ============================================================ */


function createDeterministicRandom(seedHex) {
  let seed = 0;


  for (let i = 0; i < seedHex.length; i++) {
    seed ^= seedHex.charCodeAt(i);
    seed = (seed << 5) - seed;
    seed |= 0;
  }


  if (seed === 0) seed = 0x6d2b79f5;


  return function random() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) / 4294967296);
  };
}


/* ============================================================
   Artifact Structural Validator
   ============================================================ */


function validateArtifactStructure(value, seen = new WeakSet(), depth = 0) {
  if (depth > 100) {
    throw new SandboxError("Artifact depth exceeded");
  }


  if (value === null) return;


  const t = typeof value;


  if (t === "boolean" || t === "string") return;


  if (t === "number") {
    if (!Number.isFinite(value)) {
      throw new SandboxError("Non-finite number in artifact");
    }
    return;
  }


  if (
    t === "undefined" ||
    t === "function" ||
    t === "symbol" ||
    t === "bigint"
  ) {
    throw new SandboxError(`Illegal artifact type: ${t}`);
  }


  if (Array.isArray(value)) {
    if (seen.has(value)) {
      throw new SandboxError("Circular artifact structure");
    }
    seen.add(value);


    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) {
        throw new SandboxError("Sparse arrays not allowed");
      }
      validateArtifactStructure(value[i], seen, depth + 1);
    }


    return;
  }


  if (isPlainObject(value)) {
    if (seen.has(value)) {
      throw new SandboxError("Circular artifact structure");
    }
    seen.add(value);


    for (const key of Object.keys(value)) {
      validateArtifactStructure(value[key], seen, depth + 1);
    }


    return;
  }


  throw new SandboxError("Unsupported artifact structure");
}


/* ============================================================
   Capability Injector (Additive Model)
   ============================================================ */


function injectCapabilities(sandbox, plugin, seed, audit) {
  const caps = plugin.capability_scope || {};


  /* Console */
  if (caps.console === true) {
    sandbox.console = Object.freeze({
      log: (...args) => {
        if (audit) audit.console.push(args);
      },
      error: (...args) => {
        if (audit) audit.console.push(args);
      }
    });
  }


  /* Math */
  const mathClone = Object.create(null);


  for (const key of Object.getOwnPropertyNames(Math)) {
    const desc = Object.getOwnPropertyDescriptor(Math, key);
    Object.defineProperty(mathClone, key, desc);
  }


  if (plugin.determinism_class === "probabilistic_bounded") {
    const rand = createDeterministicRandom(seed);
    mathClone.random = () => {
      const r = rand();
      if (audit) audit.random.push(r);
      return r;
    };
  } else {
    delete mathClone.random;
  }


  sandbox.Math = Object.freeze(mathClone);


  /* structuredClone */
  if (caps.structured_clone === true) {
    sandbox.structuredClone = structuredClone;
  }


  return sandbox;
}


/* ============================================================
   VM Adapter
   ============================================================ */


async function executeInVM(plugin, envelope, seed, audit) {
  const sandbox = Object.create(null);


  sandbox.executionEnvelope = envelope;
  sandbox.__plugin = plugin.entry_point;


  injectCapabilities(sandbox, plugin, seed, audit);


  /* Remove unsafe globals */
  sandbox.Date = undefined;
  sandbox.eval = undefined;
  sandbox.Function = undefined;
  sandbox.WebAssembly = undefined;
  sandbox.Proxy = undefined;
  sandbox.Reflect = undefined;
  sandbox.process = undefined;
  sandbox.global = undefined;
  sandbox.globalThis = undefined;


  const context = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false }
  });


  const script = new vm.Script(`
    (async () => {
      return await __plugin(executionEnvelope);
    })()
  `);


  return await script.runInContext(context);
}


/* ============================================================
   Invariant Enforcement Wrapper
   ============================================================ */


export async function runInIsolation(
  plugin,
  executionEnvelope,
  options = {}
) {
  if (!plugin || typeof plugin !== "object") {
    throw new SandboxError("Invalid plugin object");
  }


  const auditEnabled = options.audit === true;


  const audit = auditEnabled
    ? { console: [], random: [] }
    : null;


  const envelopeClone = structuredClone(executionEnvelope);
  deepFreeze(envelopeClone);


  const preFingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
      envelopeClone
    );


  const seed = envelopeClone.seed || "";


  let result;


  try {
    result = await executeInVM(
      plugin,
      envelopeClone,
      seed,
      audit
    );
  } catch (err) {
    throw new SandboxError(
      `Sandbox execution error: ${err.message}`
    );
  }


  if (!result || !Array.isArray(result.artifacts)) {
    throw new SandboxError(
      "Plugin must return { artifacts: [] }"
    );
  }


  const artifacts = [];


  for (const artifact of result.artifacts) {
    if (!isPlainObject(artifact)) {
      throw new SandboxError("Artifact must be plain object");
    }


    if (!artifact.artifact_type) {
      throw new SandboxError(
        "Artifact missing artifact_type"
      );
    }


    if (artifact.declaredNonAuthoritative !== true) {
      throw new SandboxError(
        "Artifact must declare declaredNonAuthoritative === true"
      );
    }


    validateArtifactStructure(artifact);
    deepFreeze(artifact);


    artifacts.push(artifact);
  }


  deepFreeze(artifacts);


  const postFingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
      envelopeClone
    );


  if (preFingerprint !== postFingerprint) {
    throw new SandboxError(
      "Envelope mutation detected inside sandbox"
    );
  }


  const response = { artifacts };


  if (auditEnabled) {
    response.audit = deepFreeze(audit);
  }


  return deepFreeze(response);
}


plugin_contract_validator.js
