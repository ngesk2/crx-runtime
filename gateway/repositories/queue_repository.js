/**
 * Queue Repository
 * 
 * Phase 21 — Repository Pattern for SQL Centralization
 * 
 * Centralizes all queue-related SQL queries.
 */

class QueueRepository {
  constructor(postgresPool) {
    this._postgres = postgresPool;
  }

  /**
   * Enqueue mission
   * @param {Object} queueEntry - Queue entry data
   * @returns {Object} Queue entry
   */
  async enqueue(queueEntry) {
    const result = await this._postgres.query(`
      INSERT INTO mission_queue (
        queue_id, mission_id, queue_status, priority
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      queueEntry.queue_id,
      queueEntry.mission_id,
      queueEntry.queue_status || 'queued',
      queueEntry.priority || 5
    ]);

    return result.rows[0];
  }

  /**
   * Claim mission
   * @param {string} schedulerId - Scheduler ID
   * @param {Date} leaseExpiration - Lease expiration
   * @returns {Object|null} Claimed queue entry
   */
  async claim(schedulerId, leaseExpiration) {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET queue_status = 'claimed', 
          scheduler_id = $1, 
          claimed_at = NOW(),
          lease_expiration = $2,
          last_heartbeat = NOW()
      WHERE queue_id = (
        SELECT queue_id FROM mission_queue
        WHERE queue_status = 'queued'
        ORDER BY priority ASC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING *
    `, [schedulerId, leaseExpiration]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Renew lease
   * @param {string} queueId - Queue ID
   * @param {string} schedulerId - Scheduler ID
   * @param {Date} leaseExpiration - Lease expiration
   * @returns {Object|null} Queue entry
   */
  async renewLease(queueId, schedulerId, leaseExpiration) {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET lease_expiration = $1, last_heartbeat = NOW()
      WHERE queue_id = $2 
        AND scheduler_id = $3
        AND queue_status = 'claimed'
      RETURNING *
    `, [leaseExpiration, queueId, schedulerId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Send heartbeat
   * @param {string} queueId - Queue ID
   * @param {string} schedulerId - Scheduler ID
   * @returns {boolean} True if successful
   */
  async heartbeat(queueId, schedulerId) {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET last_heartbeat = NOW()
      WHERE queue_id = $1 
        AND scheduler_id = $2
        AND queue_status = 'claimed'
        AND lease_expiration > NOW()
      RETURNING queue_id
    `, [queueId, schedulerId]);

    return result.rows.length > 0;
  }

  /**
   * Start execution
   * @param {string} queueId - Queue ID
   * @returns {Object} Queue entry
   */
  async startExecution(queueId) {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET queue_status = 'executing', started_at = NOW()
      WHERE queue_id = $1
      RETURNING *
    `, [queueId]);

    return result.rows[0];
  }

  /**
   * Complete execution
   * @param {string} queueId - Queue ID
   * @returns {Object} Queue entry
   */
  async completeExecution(queueId) {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET queue_status = 'completed', completed_at = NOW()
      WHERE queue_id = $1
      RETURNING *
    `, [queueId]);

    return result.rows[0];
  }

  /**
   * Fail execution
   * @param {string} queueId - Queue ID
   * @param {string} errorMessage - Error message
   * @param {number} retryCount - Retry count
   * @param {number} maxRetries - Max retries
   * @returns {Object} Queue entry
   */
  async failExecution(queueId, errorMessage, retryCount, maxRetries) {
    if (retryCount >= maxRetries) {
      const result = await this._postgres.query(`
        UPDATE mission_queue
        SET queue_status = 'failed', retry_count = $1, error_message = $2, completed_at = NOW()
        WHERE queue_id = $3
        RETURNING *
      `, [retryCount, errorMessage, queueId]);
      return result.rows[0];
    } else {
      const result = await this._postgres.query(`
        UPDATE mission_queue
        SET queue_status = 'queued', retry_count = $1, error_message = $2, 
            scheduler_id = NULL, claimed_at = NULL, started_at = NULL
        WHERE queue_id = $3
        RETURNING *
      `, [retryCount, errorMessage, queueId]);
      return result.rows[0];
    }
  }

  /**
   * Reclaim expired leases
   * @returns {number} Number of reclaimed entries
   */
  async reclaimExpiredLeases() {
    const result = await this._postgres.query(`
      UPDATE mission_queue
      SET queue_status = 'queued', 
          scheduler_id = NULL, 
          claimed_at = NULL,
          lease_expiration = NULL,
          last_heartbeat = NULL
      WHERE queue_status = 'claimed'
      AND lease_expiration < NOW()
      RETURNING queue_id
    `, []);

    return result.rows.length;
  }

  /**
   * Get queue entry
   * @param {string} queueId - Queue ID
   * @returns {Object|null} Queue entry
   */
  async getById(queueId) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_queue WHERE queue_id = $1
    `, [queueId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get queue entries by status
   * @param {string} status - Queue status
   * @param {number} limit - Result limit
   * @returns {Array} Queue entries
   */
  async getByStatus(status, limit = 100) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_queue
      WHERE queue_status = $1
      ORDER BY priority ASC, created_at ASC
      LIMIT $2
    `, [status, limit]);

    return result.rows;
  }

  /**
   * Get queue entries for scheduler
   * @param {string} schedulerId - Scheduler ID
   * @returns {Array} Queue entries
   */
  async getByScheduler(schedulerId) {
    const result = await this._postgres.query(`
      SELECT * FROM mission_queue
      WHERE scheduler_id = $1
      ORDER BY claimed_at DESC
    `, [schedulerId]);

    return result.rows;
  }

  /**
   * Get queue statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    const result = await this._postgres.query(`
      SELECT 
        queue_status,
        COUNT(*) as count
      FROM mission_queue
      GROUP BY queue_status
    `, []);

    const stats = {};
    for (const row of result.rows) {
      stats[row.queue_status] = parseInt(row.count);
    }

    return stats;
  }
}

module.exports = { QueueRepository };
