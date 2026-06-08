worker_runtime_entry.js
/* ============================================================
   worker_runtime_entry.js
   ------------------------------------------------------------
   Worker Thread Deterministic Execution Entry


   Runs inside isolated V8 instance.
   ============================================================ */


import { parentPort, workerData } from "worker_threads";
import { runInIsolation } from "./plugin_isolation_sandbox.js";


/* ============================================================
   Defensive Global Cleanup
   ============================================================ */


global.Date = undefined;
global.eval = undefined;
global.Function = undefined;
global.WebAssembly = undefined;
global.Proxy = undefined;
global.process = undefined;
global.global = undefined;


/* ============================================================
   Execution
   ============================================================ */


(async () => {


  try {


    const { plugin, envelope, options } = workerData;


    const result = await runInIsolation(
      plugin,
      envelope,
      options
    );


    parentPort.postMessage(result);


  } catch (err) {


    parentPort.postMessage({
      error: String(err.message || err)
    });


  }


})();


Tab 45


evaluation_context_assembler.js
