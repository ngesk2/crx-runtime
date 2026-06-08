runtime_adapter.js
/* ============================================================
   runtime_adapter.js
   ------------------------------------------------------------
   Cross-Runtime Deterministic Execution Abstraction


   Constitutional Guarantees:
   - Runtime-agnostic execution contract
   - Envelope immutability enforcement
   - No hashing inside runtime layer
   - Adapter-based architecture
   - Deterministic replay boundary
   - Audit transcript passthrough
   - No global mutation
   - Capability isolation
   - Explicit runtime selection
   - Extensible without scheduler modification
   ============================================================ */


import { runInIsolation as vmIsolation } from "./plugin_isolation_sandbox.js";


/* ============================================================
   Runtime Adapter Interface Contract
   ============================================================ */


/*
  Adapter must implement:


  async execute({
      plugin,
      envelope,
      options
  }) => {
      artifacts: [],
      audit?: {}
  }
*/


/* ============================================================
   Errors
   ============================================================ */


class RuntimeAdapterError extends Error {
  constructor(message) {
    super(message);
    this.name = "RuntimeAdapterError";
  }
}


/* ============================================================
   Base Adapter Class
   ============================================================ */


class BaseRuntimeAdapter {
  constructor(name) {
    this.name = name;
  }


  async execute() {
    throw new RuntimeAdapterError(
      "execute() not implemented in runtime adapter"
    );
  }
}


/* ============================================================
   VM Runtime Adapter (Default)
   ============================================================ */


class VMRuntimeAdapter extends BaseRuntimeAdapter {
  constructor() {
    super("vm");
  }


  async execute({ plugin, envelope, options = {} }) {
    return await vmIsolation(plugin, envelope, options);
  }
}


/* ============================================================
   Worker Thread Adapter (Stub for Future)
   ============================================================ */


class WorkerRuntimeAdapter extends BaseRuntimeAdapter {
  constructor() {
    super("worker");
  }


  async execute() {
    throw new RuntimeAdapterError(
      "Worker runtime adapter not implemented yet"
    );
  }
}


/* ============================================================
   Subprocess Adapter (Stub for Future)
   ============================================================ */


class SubprocessRuntimeAdapter extends BaseRuntimeAdapter {
  constructor() {
    super("subprocess");
  }


  async execute() {
    throw new RuntimeAdapterError(
      "Subprocess runtime adapter not implemented yet"
    );
  }
}


/* ============================================================
   WASM Adapter (Stub for Future)
   ============================================================ */


class WasmRuntimeAdapter extends BaseRuntimeAdapter {
  constructor() {
    super("wasm");
  }


  async execute() {
    throw new RuntimeAdapterError(
      "WASM runtime adapter not implemented yet"
    );
  }
}


/* ============================================================
   Runtime Registry
   ============================================================ */


const runtimeRegistry = new Map();


/* Register default adapters */
runtimeRegistry.set("vm", new VMRuntimeAdapter());
runtimeRegistry.set("worker", new WorkerRuntimeAdapter());
runtimeRegistry.set("subprocess", new SubprocessRuntimeAdapter());
runtimeRegistry.set("wasm", new WasmRuntimeAdapter());


/* ============================================================
   Public API
   ============================================================ */


/**
 * Registers a custom runtime adapter.
 * Allows future remote or distributed runtimes.
 */
export function registerRuntimeAdapter(name, adapterInstance) {
  if (!name || typeof name !== "string") {
    throw new RuntimeAdapterError(
      "Runtime adapter name must be string"
    );
  }


  if (!adapterInstance || typeof adapterInstance.execute !== "function") {
    throw new RuntimeAdapterError(
      "Adapter must implement execute()"
    );
  }


  runtimeRegistry.set(name, adapterInstance);
}


/**
 * Executes plugin using selected runtime.
 */
export async function executeInRuntime({
  runtime = "vm",
  plugin,
  envelope,
  options = {}
}) {
  if (!runtimeRegistry.has(runtime)) {
    throw new RuntimeAdapterError(
      `Runtime adapter "${runtime}" not registered`
    );
  }


  if (!plugin || typeof plugin !== "object") {
    throw new RuntimeAdapterError(
      "Invalid plugin object"
    );
  }


  if (!envelope || typeof envelope !== "object") {
    throw new RuntimeAdapterError(
      "Invalid execution envelope"
    );
  }


  const adapter = runtimeRegistry.get(runtime);


  const result = await adapter.execute({
    plugin,
    envelope,
    options
  });


  /* Structural safety boundary */


  if (!result || !Array.isArray(result.artifacts)) {
    throw new RuntimeAdapterError(
      "Runtime adapter returned invalid result"
    );
  }


  return result;
}


/* ============================================================
   Introspection API
   ============================================================ */


export function listRegisteredRuntimes() {
  return Array.from(runtimeRegistry.keys());
}
worker_runtime_adapter.j
/* ============================================================
   worker_runtime_adapter.js
   ------------------------------------------------------------
   Hardened Deterministic Worker Thread Runtime


   Guarantees:
   - True memory isolation (separate V8 instance)
   - No shared heap
   - Strict message protocol
   - Deterministic replay boundary
   - Timeout enforced externally
   - Crash-safe termination
   - Structured clone only
   - No Date / eval / dynamic code
   - Audit transcript passthrough
   ============================================================ */


import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";


/* ============================================================
   Errors
   ============================================================ */


class WorkerRuntimeError extends Error {
  constructor(message) {
    super(message);
    this.name = "WorkerRuntimeError";
  }
}


/* ============================================================
   Worker Script Path Resolution
   ============================================================ */


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const WORKER_SCRIPT_PATH = path.join(
  __dirname,
  "worker_runtime_entry.js"
);


/* ============================================================
   Worker Runtime Adapter
   ============================================================ */


export class WorkerRuntimeAdapter {


  constructor({ timeout_ms = 5000 } = {}) {
    this.timeout_ms = timeout_ms;
    this.name = "worker";
  }


  async execute({ plugin, envelope, options = {} }) {


    if (!plugin || typeof plugin !== "object") {
      throw new WorkerRuntimeError("Invalid plugin object");
    }


    if (!envelope || typeof envelope !== "object") {
      throw new WorkerRuntimeError("Invalid execution envelope");
    }


    return new Promise((resolve, reject) => {


      const worker = new Worker(WORKER_SCRIPT_PATH, {
        workerData: {
          plugin,
          envelope,
          options
        }
      });


      let finished = false;


      const timeoutHandle = setTimeout(() => {
        if (!finished) {
          finished = true;
          worker.terminate();
          reject(
            new WorkerRuntimeError(
              "Worker execution timeout"
            )
          );
        }
      }, this.timeout_ms);


      worker.on("message", (message) => {


        if (finished) return;


        finished = true;
        clearTimeout(timeoutHandle);
        worker.terminate();


        if (!message || message.error) {
          reject(
            new WorkerRuntimeError(
              message?.error || "Worker execution failed"
            )
          );
          return;
        }


        if (!Array.isArray(message.artifacts)) {
          reject(
            new WorkerRuntimeError(
              "Worker returned invalid artifacts"
            )
          );
          return;
        }


        resolve(message);
      });


      worker.on("error", (err) => {
        if (finished) return;


        finished = true;
        clearTimeout(timeoutHandle);
        worker.terminate();


        reject(
          new WorkerRuntimeError(
            `Worker thread error: ${err.message}`
          )
        );
      });


      worker.on("exit", (code) => {
        if (!finished && code !== 0) {
          finished = true;
          clearTimeout(timeoutHandle);
          reject(
            new WorkerRuntimeError(
              `Worker exited unexpectedly with code ${code}`
            )
          );
        }
      });


    });
  }
}
worker_runtime_entry.js
