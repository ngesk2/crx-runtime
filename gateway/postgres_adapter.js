/**
 * Postgres Storage Adapter
 * 
 * Priority 4: Concrete implementation of StorageAdapter for PostgreSQL.
 * 
 * Wraps a pg.Pool. Provides query, transaction, health, close.
 * 
 * Constitutional Constraint:
 * - Only this adapter touches pg.Pool
 * - All registries receive StorageAdapter, not Pool
 * - Connection pooling is managed here, not in registries
 */

const { StorageAdapter } = require('./storage_adapter');

class PostgresAdapter extends StorageAdapter {
  /**
   * @param {Object} poolConfig - pg.Pool configuration
   */
  constructor(poolConfig = {}) {
    super();
    this._poolConfig = poolConfig;
    this._pool = null;
    this._dependencies = [];
  }

  get dependencies() {
    return this._dependencies;
  }

  /**
   * Initialize the connection pool.
   */
  async initialize() {
    const { Pool } = require('pg');
    this._pool = new Pool(this._poolConfig);
    console.log('[PostgresAdapter] Connection pool initialized');
  }

  /**
   * Execute a SQL query.
   * 
   * @param {string} sql - SQL statement
   * @param {Array} params - Parameters
   * @returns {{ rows: Array, rowCount: number }}
   */
  async query(sql, params = []) {
    if (!this._pool) {
      throw new Error('[PostgresAdapter] Pool not initialized. Call initialize() first.');
    }
    return this._pool.query(sql, params);
  }

  /**
   * Execute a function within a transaction.
   * 
   * @param {Function} fn - async function(client) that performs queries
   * @returns {*} Result of fn
   */
  async transaction(fn) {
    if (!this._pool) {
      throw new Error('[PostgresAdapter] Pool not initialized. Call initialize() first.');
    }

    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check storage health.
   * 
   * @returns {{ healthy: boolean, latency_ms: number, error?: string }}
   */
  async health() {
    if (!this._pool) {
      return { healthy: false, latency_ms: 0, error: 'Pool not initialized' };
    }

    const start = Date.now();
    try {
      await this._pool.query('SELECT 1');
      return { healthy: true, latency_ms: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency_ms: Date.now() - start, error: error.message };
    }
  }

  /**
   * Close the connection pool.
   */
  async close() {
    if (this._pool) {
      await this._pool.end();
      this._pool = null;
      console.log('[PostgresAdapter] Connection pool closed');
    }
  }

  /**
   * Get pool statistics.
   */
  getStats() {
    if (!this._pool) return null;
    return {
      totalCount: this._pool.totalCount,
      idleCount: this._pool.idleCount,
      waitingCount: this._pool.waitingCount,
    };
  }
}

module.exports = { PostgresAdapter };
