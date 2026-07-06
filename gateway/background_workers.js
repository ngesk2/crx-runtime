/**
 * Background Workers Registry
 * 
 * Phase 1.9 — Constitutional Worker Registry
 * 
 * Simple registry for background workers.
 * No orchestration. No scheduling. No signal handling.
 * 
 * Orchestration moved to bootstrap/WorkerRuntime.
 * Scheduling moved to Temporal/BullMQ.
 * Signal handling moved to bootstrap.
 */

const { workerRegistry } = require('./worker_registry');

class BackgroundWorkers {
  constructor() {
    this._registry = workerRegistry;
  }

  /**
   * Register worker
   */
  registerWorker(workerId, worker) {
    this._registry.registerWorker(workerId, worker);
  }

  /**
   * Get worker
   */
  getWorker(workerId) {
    return this._registry.getWorker(workerId);
  }

  /**
   * List workers
   */
  listWorkers() {
    return this._registry.listWorkers();
  }
}

module.exports = { BackgroundWorkers };
