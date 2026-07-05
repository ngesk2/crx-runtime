/**
 * Repository Interface
 * 
 * Ω.49 — Repository Interface
 * 
 * Abstract interface for repository persistence.
 * 
 * Separates persistence contract from implementation.
 * Allows for multiple backends (PostgreSQL, SQLite, in-memory, etc.).
 */

class RepositoryInterface {
  /**
   * Initialize repository
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Append object to repository
   * @param {Object} object - Object to store
   * @param {Object} options - Options
   * @param {Object} options.client - Optional client for transaction
   * @returns {string} Object ID
   */
  async append(object, options = {}) {
    throw new Error('append() must be implemented by subclass');
  }

  /**
   * Load object by ID
   * @param {string} objectId - Object ID
   * @returns {Object|null} Object or null if not found
   */
  async load(objectId) {
    throw new Error('load() must be implemented by subclass');
  }

  /**
   * Load multiple objects by IDs
   * @param {Array<string>} objectIds - Object IDs
   * @returns {Array<Object>} Objects
   */
  async loadMany(objectIds) {
    throw new Error('loadMany() must be implemented by subclass');
  }

  /**
   * Query objects by kind
   * @param {string} kind - Object kind
   * @returns {Array<Object>} Objects
   */
  async queryByKind(kind) {
    throw new Error('queryByKind() must be implemented by subclass');
  }

  /**
   * Query objects by metadata
   * @param {Object} metadata - Metadata query
   * @returns {Array<Object>} Objects
   */
  async queryByMetadata(metadata) {
    throw new Error('queryByMetadata() must be implemented by subclass');
  }

  /**
   * Delete object by ID
   * @param {string} objectId - Object ID
   * @returns {boolean} True if deleted
   */
  async delete(objectId) {
    throw new Error('delete() must be implemented by subclass');
  }

  /**
   * Begin transaction
   * @returns {Object} Transaction client
   */
  async beginTransaction() {
    throw new Error('beginTransaction() must be implemented by subclass');
  }

  /**
   * Commit transaction
   * @param {Object} client - Transaction client
   */
  async commitTransaction(client) {
    throw new Error('commitTransaction() must be implemented by subclass');
  }

  /**
   * Rollback transaction
   * @param {Object} client - Transaction client
   */
  async rollbackTransaction(client) {
    throw new Error('rollbackTransaction() must be implemented by subclass');
  }

  /**
   * Get repository statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    throw new Error('getStatistics() must be implemented by subclass');
  }

  /**
   * Close repository connection
   */
  async close() {
    throw new Error('close() must be implemented by subclass');
  }
}

module.exports = { RepositoryInterface };
