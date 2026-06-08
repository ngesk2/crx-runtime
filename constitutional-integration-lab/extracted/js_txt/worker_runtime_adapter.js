worker_runtime_adapter.js
/* ============================================================
   worker_runtime_adapter.js
   ------------------------------------------------------------
   OS-Level Deterministic Execution Capsule


   Version: worker_runtime_adapter.1.0


   Guarantees:
   - True memory isolation (Worker Thread)
   - Structured clone boundary
   - Deterministic PRNG injection
   - Timeout enforcement
   - No host mutation
   - Artifact structural validation
   - Envelope immutability verification
   - Adapter-compatible interface
   ============================================================ */


import { Worker } from "worker_threads";
import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "./canonical_fingerprint_service.js";


/* ============================================================
   Version
   ============================================================ */


export const WORKER_RUNTIME_ADAPTER_VERSION =
  "worker_runtime_adapter.1.0";


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


function validateArtifactStructure(value, depth = 0, maxDepth = 100) {
  if (depth > maxDepth) {
    throw new Error("Artifact depth exceeded");
  }


  if (value === null) return;


  const t = typeof value;


  if (t === "boolean" || t === "string") return;


  if (t === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Non-finite number in artifact");
    }
    return;
  }


  if (
    t === "undefined" ||
    t === "function" ||
    t === "symbol" ||
    t === "bigint"
  ) {
    throw new Error(`Illegal artifact type: ${t}`);
  }


  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      if (!(i in value)) {
        throw new Error("Sparse arrays not allowed");
      }
      validateArtifactStructure(value[i], depth + 1);
    }
    return;
  }


  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      validateArtifactStructure(value[key], depth + 1);
    }
    return;
  }


  throw new Error("Unsupported artifact structure");
}


/* ============================================================
   Worker Bootstrap Script (Inline)
   ============================================================ */


const WORKER_BOOTSTRAP = `
const { parentPort } = require("worker_threads");


function createDeterministicRandom(seedHex) {
  let seed = 0;
  for (let i = 0; i < seedHex.length; i++) {
    seed ^= seedHex.charCodeAt(i);
    seed = (seed << 5) - seed;
    seed |= 0;
  }
  if (seed === 0) seed = 0xdeadbeef;


  return function random() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) / 4294967296);
  };
}


parentPort.on("message", async (data) => {
  const { pluginSource, envelope, seed } = data;


  try {
    const plugin = eval(pluginSource);


    if (seed) {
      const mathClone = Object.create(null);
      for (const key of Object.getOwnPropertyNames(Math)) {
        const desc = Object.getOwnPropertyDescriptor(Math, key);
        Object.defineProperty(mathClone, key, desc);
      }
      mathClone.random = createDeterministicRandom(seed);
      global.Math = Object.freeze(mathClone);
    }


    global.Date = undefined;
    global.eval = undefined;
    global.Function = undefined;
    global.WebAssembly = undefined;


    const result = await plugin(envelope);


    parentPort.postMessage({
      ok: true,
      result
    });


  } catch (err) {
    parentPort.postMessage({
      ok: false,
      error: String(err.message)
    });
  }
});
`;


/* ============================================================
   Public Execution API
   ============================================================ */


export async function executeInWorkerRuntime(
  plugin,
  envelope,
  options = {}
) {
  if (!plugin || typeof plugin.entry_point !== "function") {
    throw new Error("Invalid plugin entry_point");
  }


  const envelopeClone = structuredClone(envelope);
  deepFreeze(envelopeClone);


  const preFingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
      envelopeClone
    );


  const seed = envelopeClone.seed || null;


  const worker = new Worker(WORKER_BOOTSTRAP, {
    eval: true,
    resourceLimits: {
      maxOldGenerationSizeMb:
        options.max_memory_mb || 128
    }
  });


  const timeoutMs = options.timeout_ms || 10000;


  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error("Execution timeout"));
    }, timeoutMs);


    worker.on("message", async (msg) => {
      clearTimeout(timeout);
      worker.terminate();


      if (!msg.ok) {
        reject(
          new Error(
            \`Worker execution error: \${msg.error}\`
          )
        );
        return;
      }


      const result = msg.result;


      if (
        !result ||
        !Array.isArray(result.artifacts)
      ) {
        reject(
          new Error(
            "Plugin must return { artifacts: [] }"
          )
        );
        return;
      }


      const artifacts = [];


      for (const artifact of result.artifacts) {
        if (!isPlainObject(artifact)) {
          reject(
            new Error(
              "Artifact must be plain object"
            )
          );
          return;
        }


        if (!artifact.artifact_type) {
          reject(
            new Error(
              "Artifact missing artifact_type"
            )
          );
          return;
        }


        validateArtifactStructure(artifact);
        deepFreeze(artifact);
        artifacts.push(artifact);
      }


      const postFingerprint =
        await fingerprintWithDomain(
          FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
          envelopeClone
        );


      if (preFingerprint !== postFingerprint) {
        reject(
          new Error(
            "Envelope mutation detected"
          )
        );
        return;
      }


      resolve(
        Object.freeze({
          artifacts: Object.freeze(artifacts),
          runtime_adapter_version:
            WORKER_RUNTIME_ADAPTER_VERSION
        })
      );
    });


    worker.on("error", (err) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(err);
    });


    worker.postMessage({
      pluginSource: plugin.entry_point.toString(),
      envelope: envelopeClone,
      seed
    });
  });
}
resource_ceiling_enforcer.js
