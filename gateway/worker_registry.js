/**
 * Worker Registry
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * Phase 36 PATCH 6 — Event-Sourced Worker Registry
 * 
 * Centralizes worker registration and lookup.
 * 
 * Responsibilities:
 * - Register workers
 * - Unregister workers
 * - Get worker by ID
 * - List all workers
 * 
 * All worker registration flows through this service.
 * 
 * Phase 36 PATCH 6: Event-sourced worker lifecycle
 * - WorkerRegistered events
 * - WorkerUnregistered events
 * - Replayable worker state reconstruction
 */

const { StandardEventSchema } = require('../ping-runtime/events/standard_event_schema');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class WorkerRegistry {
  constructor(options = {}) {
    // Phase 36 PATCH 6: Event-sourced state
    this._workers = new Map();
    this._eventPort = options.eventPort;
    this._aggregateId = options.aggregateId || 'worker_registry';
  }

  /**
   * Register worker
   * Phase 36 PATCH 6 Refinement: Granular lifecycle events only
   * @param {string} workerId - Worker ID
   * @param {Object} workerMetadata - Worker metadata (not instance)
   */
  async registerWorker(workerId, workerMetadata = {}) {
    // Phase 36 PATCH 6 Refinement: Store only metadata, not instances
    this._workers.set(workerId, {
      worker_id: workerId,
      worker_type: workerMetadata.type || 'unknown',
      worker_metadata: workerMetadata,
      status: 'registered',
      registered_at: constitutionalTimeAuthority.now()
    });
    
    // Phase 36 PATCH 6: Emit WorkerRegistered event
    if (this._eventPort) {
      await this._emitWorkerRegisteredEvent(workerId, workerMetadata);
    }
  }

  /**
   * Start worker
   * Phase 36 PATCH 6 Refinement: Granular lifecycle event
   * @param {string} workerId - Worker ID
   */
  async startWorker(workerId) {
    const worker = this._workers.get(workerId);
    if (worker) {
      worker.status = 'started';
      worker.started_at = constitutionalTimeAuthority.now();
      
      // Emit WorkerStarted event
      if (this._eventPort) {
        await this._emitWorkerStartedEvent(workerId);
      }
    }
  }

  /**
   * Complete worker
   * Phase 36 PATCH 6 Refinement: Granular lifecycle event
   * @param {string} workerId - Worker ID
   * @param {Object} result - Worker result
   */
  async completeWorker(workerId, result = {}) {
    const worker = this._workers.get(workerId);
    if (worker) {
      worker.status = 'completed';
      worker.completed_at = constitutionalTimeAuthority.now();
      worker.result = result;
      
      // Emit WorkerCompleted event
      if (this._eventPort) {
        await this._emitWorkerCompletedEvent(workerId, result);
      }
    }
  }

  /**
   * Fail worker
   * Phase 36 PATCH 6 Refinement: Granular lifecycle event
   * @param {string} workerId - Worker ID
   * @param {Object} error - Worker error
   */
  async failWorker(workerId, error = {}) {
    const worker = this._workers.get(workerId);
    if (worker) {
      worker.status = 'failed';
      worker.failed_at = constitutionalTimeAuthority.now();
      worker.error = error;
      
      // Emit WorkerFailed event
      if (this._eventPort) {
        await this._emitWorkerFailedEvent(workerId, error);
      }
    }
  }

  /**
   * Unregister worker
   * Phase 36 PATCH 6: Event-sourced unregistration
   * @param {string} workerId - Worker ID
   */
  async unregisterWorker(workerId) {
    this._workers.delete(workerId);
    
    // Phase 36 PATCH 6: Emit WorkerUnregistered event
    if (this._eventPort) {
      await this._emitWorkerUnregisteredEvent(workerId);
    }
  }

  /**
   * Emit WorkerRegistered event
   * Phase 36 PATCH 6
   * @param {string} workerId - Worker ID
   * @param {Object} workerMetadata - Worker metadata
   */
  async _emitWorkerRegisteredEvent(workerId, workerMetadata) {
    const event = StandardEventSchema.create(
      'WorkerRegistered',
      this._aggregateId,
      'WorkerRegistry',
      {
        worker_id: workerId,
        worker_type: workerMetadata.type || 'unknown',
        worker_metadata: workerMetadata
      },
      'WorkerRegistry'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Emit WorkerStarted event
   * Phase 36 PATCH 6 Refinement
   * @param {string} workerId - Worker ID
   */
  async _emitWorkerStartedEvent(workerId) {
    const event = StandardEventSchema.create(
      'WorkerStarted',
      this._aggregateId,
      'WorkerRegistry',
      {
        worker_id: workerId
      },
      'WorkerRegistry'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Emit WorkerCompleted event
   * Phase 36 PATCH 6 Refinement
   * @param {string} workerId - Worker ID
   * @param {Object} result - Worker result
   */
  async _emitWorkerCompletedEvent(workerId, result) {
    const event = StandardEventSchema.create(
      'WorkerCompleted',
      this._aggregateId,
      'WorkerRegistry',
      {
        worker_id: workerId,
        result: result
      },
      'WorkerRegistry'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Emit WorkerFailed event
   * Phase 36 PATCH 6 Refinement
   * @param {string} workerId - Worker ID
   * @param {Object} error - Worker error
   */
  async _emitWorkerFailedEvent(workerId, error) {
    const event = StandardEventSchema.create(
      'WorkerFailed',
      this._aggregateId,
      'WorkerRegistry',
      {
        worker_id: workerId,
        error: error
      },
      'WorkerRegistry'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Emit WorkerUnregistered event
   * Phase 36 PATCH 6
   * @param {string} workerId - Worker ID
   */
  async _emitWorkerUnregisteredEvent(workerId) {
    const event = StandardEventSchema.create(
      'WorkerUnregistered',
      this._aggregateId,
      'WorkerRegistry',
      {
        worker_id: workerId
      },
      'WorkerRegistry'
    );
    
    await this._eventPort.appendEvent(event);
  }

  /**
   * Reconstruct worker state from event stream
   * Phase 36 PATCH 6 Refinement: Reconstruct from granular lifecycle events
   * @param {Array} events - Event stream
   * @returns {Object} Reconstructed worker state
   */
  reconstructFromEvents(events) {
    const reconstructedWorkers = new Map();
    
    for (const event of events) {
      switch (event.event_type) {
        case 'WorkerRegistered':
          reconstructedWorkers.set(event.payload.worker_id, {
            worker_id: event.payload.worker_id,
            worker_type: event.payload.worker_type,
            worker_metadata: event.payload.worker_metadata,
            status: 'registered',
            registered_at: event.timestamp
          });
          break;
          
        case 'WorkerStarted':
          const startedWorker = reconstructedWorkers.get(event.payload.worker_id);
          if (startedWorker) {
            startedWorker.status = 'started';
            startedWorker.started_at = event.timestamp;
          }
          break;
          
        case 'WorkerCompleted':
          const completedWorker = reconstructedWorkers.get(event.payload.worker_id);
          if (completedWorker) {
            completedWorker.status = 'completed';
            completedWorker.completed_at = event.timestamp;
            completedWorker.result = event.payload.result;
          }
          break;
          
        case 'WorkerFailed':
          const failedWorker = reconstructedWorkers.get(event.payload.worker_id);
          if (failedWorker) {
            failedWorker.status = 'failed';
            failedWorker.failed_at = event.timestamp;
            failedWorker.error = event.payload.error;
          }
          break;
          
        case 'WorkerUnregistered':
          reconstructedWorkers.delete(event.payload.worker_id);
          break;
      }
    }
    
    return reconstructedWorkers;
  }

  /**
   * Get worker
   * @param {string} workerId - Worker ID
   * @returns {Object|null} Worker instance
   */
  getWorker(workerId) {
    return this._workers.get(workerId) || null;
  }

  /**
   * List all workers
   * @returns {Array} Worker IDs
   */
  listWorkers() {
    return Array.from(this._workers.keys());
  }

  /**
   * Get worker count
   * @returns {number} Worker count
   */
  getWorkerCount() {
    return this._workers.size;
  }

  /**
   * Check if worker exists
   * @param {string} workerId - Worker ID
   * @returns {boolean} Worker exists
   */
  hasWorker(workerId) {
    return this._workers.has(workerId);
  }

  /**
   * Clear all workers
   */
  clear() {
    this._workers.clear();
  }
}

// Singleton instance
const workerRegistry = new WorkerRegistry();

module.exports = {
  WorkerRegistry,
  workerRegistry,
};
