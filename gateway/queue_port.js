/**
 * Queue Port
 *
 * Phase 2.6 — Authority Purity Fix
 *
 * Port interface for queue operations. Nothing outside this port
 * should know about the specific queue implementation (BullMQ, etc.).
 *
 * Constitutional Queue Port exposes only:
 * - submit()
 * - claim()
 * - complete()
 * - fail()
 *
 * Removed provider-specific semantics:
 * - enqueue/dequeue (BullMQ naming)
 * - deadLetter (BullMQ concept)
 * - pause/resume (BullMQ concept)
 * - initialize/shutdown (lifecycle belongs to bootstrap)
 * - getStats/getJob (provider-specific)
 *
 * Architectural Pattern:
 * QueuePort → BullMQAdapter → BullMQ
 */

class QueuePort {
  /**
   * Submit a job
   * @param {string} jobType - Job type identifier
   * @param {Object} payload - Job payload
   * @param {Object} options - Job options
   * @returns {Promise<string>} Job ID
   */
  async submit(jobType, payload, options = {}) {
    throw new Error('QueuePort.submit must be implemented by adapter');
  }

  /**
   * Claim a job (for worker consumption)
   * @param {string} workerId - Worker ID
   * @param {Array<string>} jobTypes - Job types to accept
   * @returns {Promise<Object|null>} Job or null if no job available
   */
  async claim(workerId, jobTypes) {
    throw new Error('QueuePort.claim must be implemented by adapter');
  }

  /**
   * Complete a job successfully
   * @param {string} jobId - Job ID
   * @param {Object} result - Job result
   * @returns {Promise<void>}
   */
  async complete(jobId, result) {
    throw new Error('QueuePort.complete must be implemented by adapter');
  }

  /**
   * Fail a job with retry
   * @param {string} jobId - Job ID
   * @param {Error} error - Error that caused failure
   * @returns {Promise<void>}
   */
  async fail(jobId, error) {
    throw new Error('QueuePort.fail must be implemented by adapter');
  }
}

module.exports = { QueuePort };
