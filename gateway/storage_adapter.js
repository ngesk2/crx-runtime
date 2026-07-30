/**
 * Storage Adapter Interface
 * 
 * Priority 4: Abstract storage access behind a minimal interface.
 * 
 * No ORM. No query builder. Just:
 * - query(sql, params) → rows
 * - transaction(fn) → result
 * - health() → status
 * - close() → void
 * 
 * Constitutional Constraint:
 * - Registries depend on StorageAdapter, never on Postgres directly
 * - StorageAdapter is the only path to the database
 * - PostgresAdapter is one implementation; others may follow
 */

class StorageAdapter {
  /**
   * Execute a SQL query.
   * 
   * @param {string} sql - SQL statement with $1, $2, ... placeholders
   * @param {Array} params - Parameters
   * @returns {{ rows: Array, rowCount: number }}
   */
  async query(sql, params = []) {
    throw new Error('StorageAdapter.query() must be implemented by subclass');
  }

  /**
   * Execute a function within a transaction.
   * If the function throws, the transaction is rolled back.
   * 
   * @param {Function} fn - async function(client) that performs queries
   * @returns {*} Result of fn
   */
  async transaction(fn) {
    throw new Error('StorageAdapter.transaction() must be implemented by subclass');
  }

  /**
   * Check storage health.
   * 
   * @returns {{ healthy: boolean, latency_ms: number, error?: string }}
   */
  async health() {
    throw new Error('StorageAdapter.health() must be implemented by subclass');
  }

  /**
   * Close the storage connection.
   */
  async close() {
    throw new Error('StorageAdapter.close() must be implemented by subclass');
  }
}

module.exports = { StorageAdapter };
