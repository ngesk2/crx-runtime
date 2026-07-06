/**
 * Advisory Lock
 * 
 * Phase A1.5 — Constitutional Advisory Locking
 * 
 * Every mutable aggregate must have one writer.
 * 
 * Implement PostgreSQL advisory locking for:
 * - Mission
 * - Execution
 * - Queue
 * - Schedule
 * 
 * Application mutexes prohibited.
 * Redis locks prohibited.
 * Thread locks prohibited.
 */

class AdvisoryLock {
  constructor(postgresPool, timePort) {
    this._postgres = postgresPool;
    this._timePort = timePort;
  }

  /**
   * Acquire advisory lock
   * @param {string} aggregateType - Aggregate type (mission, execution, queue, schedule)
   * @param {string} aggregateId - Aggregate ID
   * @param {number} timeoutMs - Timeout in milliseconds (default 30000)
   * @returns {Promise<boolean>} True if lock acquired
   */
  async acquire(aggregateType, aggregateId, timeoutMs = 30000) {
    const lockId = this._generateLockId(aggregateType, aggregateId);
    const startTime = await this._timePort.nowMillis();

    while ((await this._timePort.nowMillis()) - startTime < timeoutMs) {
      try {
        const result = await this._postgres.query(
          'SELECT pg_try_advisory_lock($1) as acquired',
          [lockId]
        );

        if (result.rows[0].acquired) {
          console.log(`[AdvisoryLock] Acquired lock for ${aggregateType}:${aggregateId}`);
          return true;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[AdvisoryLock] Error acquiring lock:`, error.message);
        return false;
      }
    }

    console.warn(`[AdvisoryLock] Timeout acquiring lock for ${aggregateType}:${aggregateId}`);
    return false;
  }

  /**
   * Release advisory lock
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @returns {Promise<boolean>} True if lock released
   */
  async release(aggregateType, aggregateId) {
    const lockId = this._generateLockId(aggregateType, aggregateId);

    try {
      const result = await this._postgres.query(
        'SELECT pg_advisory_unlock($1) as released',
        [lockId]
      );

      if (result.rows[0].released) {
        console.log(`[AdvisoryLock] Released lock for ${aggregateType}:${aggregateId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[AdvisoryLock] Error releasing lock:`, error.message);
      return false;
    }
  }

  /**
   * Execute operation with advisory lock
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @param {Function} operation - Operation to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>} Operation result
   */
  async executeWithLock(aggregateType, aggregateId, operation, timeoutMs = 30000) {
    const acquired = await this.acquire(aggregateType, aggregateId, timeoutMs);
    
    if (!acquired) {
      throw new Error(`Failed to acquire lock for ${aggregateType}:${aggregateId}`);
    }

    try {
      return await operation();
    } finally {
      await this.release(aggregateType, aggregateId);
    }
  }

  /**
   * Check if lock is held
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @returns {Promise<boolean>} True if lock is held
   */
  async isLocked(aggregateType, aggregateId) {
    const lockId = this._generateLockId(aggregateType, aggregateId);

    try {
      const result = await this._postgres.query(
        'SELECT pg_advisory_lock($1) as acquired',
        [lockId]
      );

      // If we can acquire it, it wasn't locked
      if (result.rows[0].acquired) {
        await this.release(aggregateType, aggregateId);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[AdvisoryLock] Error checking lock:`, error.message);
      return false;
    }
  }

  /**
   * Generate lock ID from aggregate type and ID
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @returns {number} Lock ID
   */
  _generateLockId(aggregateType, aggregateId) {
    // Hash the aggregate type and ID to generate a numeric lock ID
    const combined = `${aggregateType}:${aggregateId}`;
    let hash = 0;
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}

/**
 * Lock Manager
 * 
 * Manages advisory locks for all aggregate types
 */
class LockManager {
  constructor(postgresPool, timePort) {
    this._advisoryLock = new AdvisoryLock(postgresPool, timePort);
    this._timePort = timePort;
    this._heldLocks = new Map();
  }

  /**
   * Acquire lock for aggregate
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<boolean>} True if lock acquired
   */
  async acquire(aggregateType, aggregateId, timeoutMs = 30000) {
    const lockKey = `${aggregateType}:${aggregateId}`;
    
    // Check if already held by this process
    if (this._heldLocks.has(lockKey)) {
      console.warn(`[LockManager] Lock already held for ${lockKey}`);
      return true;
    }

    const acquired = await this._advisoryLock.acquire(aggregateType, aggregateId, timeoutMs);
    
    if (acquired) {
      this._heldLocks.set(lockKey, await this._timePort.nowMillis());
    }

    return acquired;
  }

  /**
   * Release lock for aggregate
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @returns {Promise<boolean>} True if lock released
   */
  async release(aggregateType, aggregateId) {
    const lockKey = `${aggregateType}:${aggregateId}`;
    
    if (!this._heldLocks.has(lockKey)) {
      console.warn(`[LockManager] Lock not held for ${lockKey}`);
      return false;
    }

    const released = await this._advisoryLock.release(aggregateType, aggregateId);
    
    if (released) {
      this._heldLocks.delete(lockKey);
    }

    return released;
  }

  /**
   * Execute operation with lock
   * @param {string} aggregateType - Aggregate type
   * @param {string} aggregateId - Aggregate ID
   * @param {Function} operation - Operation to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @returns {Promise<any>} Operation result
   */
  async executeWithLock(aggregateType, aggregateId, operation, timeoutMs = 30000) {
    const acquired = await this.acquire(aggregateType, aggregateId, timeoutMs);
    
    if (!acquired) {
      throw new Error(`Failed to acquire lock for ${aggregateType}:${aggregateId}`);
    }

    try {
      return await operation();
    } finally {
      await this.release(aggregateType, aggregateId);
    }
  }

  /**
   * Release all held locks
   */
  async releaseAll() {
    const lockKeys = Array.from(this._heldLocks.keys());
    
    for (const lockKey of lockKeys) {
      const [aggregateType, aggregateId] = lockKey.split(':');
      await this.release(aggregateType, aggregateId);
    }
  }

  /**
   * Get held locks
   * @returns {Promise<Array>} Held locks
   */
  async getHeldLocks() {
    const now = await this._timePort.nowMillis();
    return Array.from(this._heldLocks.entries()).map(([key, acquiredAt]) => ({
      key,
      acquiredAt,
      heldDuration: now - acquiredAt
    }));
  }
}

module.exports = { AdvisoryLock, LockManager };
