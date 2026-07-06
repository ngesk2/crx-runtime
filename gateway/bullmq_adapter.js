/**
 * BullMQ Adapter
 *
 * Phase 3.2.9 — Constitutional OSS Continuation
 *
 * BullMQ implementation of QueuePort.
 *
 * Constitutional Constraint:
 * - No BullMQ object escapes
 * - Adapter satisfies QueuePort exactly
 * - Constitutional language only (submit, claim, complete, fail)
 */

const { Queue, Worker } = require('bullmq');
const { QueuePort } = require('./queue_port');

class BullMQAdapter extends QueuePort {
  constructor(options = {}) {
    super();
    this._connection = null;
    this._queues = new Map();
    this._workers = new Map();
    this._options = {
      host: options.host || 'localhost',
      port: options.port || 6379,
      ...options,
    };
  }

  /**
   * Initialize connection (called by bootstrap)
   */
  async initialize() {
    const IORedis = require('ioredis');
    this._connection = new IORedis({
      host: this._options.host,
      port: this._options.port,
    });
  }

  /**
   * Get or create queue
   * @param {string} jobType - Job type
   * @returns {Queue} BullMQ queue
   */
  _getQueue(jobType) {
    if (!this._queues.has(jobType)) {
      const queue = new Queue(jobType, { connection: this._connection });
      this._queues.set(jobType, queue);
    }
    return this._queues.get(jobType);
  }

  /**
   * Submit a job
   * @param {string} jobType - Job type identifier
   * @param {Object} payload - Job payload
   * @param {Object} options - Job options
   * @returns {Promise<string>} Job ID
   */
  async submit(jobType, payload, options = {}) {
    const queue = this._getQueue(jobType);
    const job = await queue.add(jobType, payload, options);
    return job.id;
  }

  /**
   * Claim a job (for worker consumption)
   * @param {string} workerId - Worker ID
   * @param {Array<string>} jobTypes - Job types to accept
   * @returns {Promise<Object|null>} Job or null if no job available
   */
  async claim(workerId, jobTypes) {
    // BullMQ workers handle claiming automatically via processor
    // This is a no-op for BullMQ - workers are registered with processors
    return null;
  }

  /**
   * Register worker processor (BullMQ-specific pattern)
   * @param {string} jobType - Job type
   * @param {Function} processor - Job processor function
   */
  async registerWorker(jobType, processor) {
    if (this._workers.has(jobType)) {
      return;
    }

    const worker = new Worker(
      jobType,
      async (job) => {
        const result = await processor(job.data);
        return result;
      },
      { connection: this._connection }
    );

    this._workers.set(jobType, worker);
  }

  /**
   * Complete a job successfully (handled by BullMQ worker)
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   * @returns {Promise<void>}
   */
  async complete(jobId, result) {
    // BullMQ handles completion automatically when processor returns
    // This is a no-op for BullMQ
  }

  /**
   * Fail a job with retry (handled by BullMQ worker)
   * @param {string} jobId - Job ID
   * @param {Error} error - Error that caused failure
   * @returns {Promise<void>}
   */
  async fail(jobId, error) {
    // BullMQ handles failure automatically when processor throws
    // This is a no-op for BullMQ
  }

  /**
   * Shutdown (called by bootstrap)
   */
  async shutdown() {
    for (const worker of this._workers.values()) {
      await worker.close();
    }
    this._workers.clear();

    for (const queue of this._queues.values()) {
      await queue.close();
    }
    this._queues.clear();

    if (this._connection) {
      await this._connection.quit();
      this._connection = null;
    }
  }
}

module.exports = { BullMQAdapter };
