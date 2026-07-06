/**
 * Persistence Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides all persistence operations behind a single port.
 * 
 * Constitutional Constraint: Single persistence authority for all persistence operations.
 * 
 * Persistence Port owns:
 * - All persistence operations
 * - Persistence abstraction
 * - Persistence guarantees (durability, consistency)
 * 
 * Note: Transactions are NOT owned by PersistencePort.
 * TransactionPort coordinates persistence operations.
 * 
 * Implementations:
 * - PostgreSQLPersistenceProvider (current)
 * - Future: EventStoreDB, MongoDB, etc.
 */

class PersistencePort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Persist data
   * @param {Object} data - Data to persist
   * @param {Object} options - Persistence options
   * @returns {Promise<Object>} Persisted data
   */
  async persist(data, options = {}) {
    return this._provider.persist(data, options);
  }

  /**
   * Retrieve data
   * @param {string} id - Data ID
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} Retrieved data
   */
  async retrieve(id, options = {}) {
    return this._provider.retrieve(id, options);
  }

  /**
   * Update data
   * @param {string} id - Data ID
   * @param {Object} data - Data to update
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Updated data
   */
  async update(id, data, options = {}) {
    return this._provider.update(id, data, options);
  }

  /**
   * Delete data
   * @param {string} id - Data ID
   * @param {Object} options - Delete options
   * @returns {Promise<void>}
   */
  async delete(id, options = {}) {
    return this._provider.delete(id, options);
  }

  /**
   * Query data
   * @param {Object} query - Query parameters
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Query results
   */
  async query(query, options = {}) {
    return this._provider.query(query, options);
  }

  /**
   * Get port ID
   * @returns {string} Port ID
   */
  getPortId() {
    return this._portId;
  }

  /**
   * Generate port ID
   * @returns {string} Port ID
   */
  _generatePortId() {
    const providerName = this._provider.constructor.name;
    return `persistence.${providerName.toLowerCase()}`;
  }
}

/**
 * Persistence Provider Interface
 * 
 * All persistence providers must implement this interface.
 */
class PersistenceProvider {
  async persist(data, options) {
    throw new Error('persist() must be implemented');
  }

  async retrieve(id, options) {
    throw new Error('retrieve() must be implemented');
  }

  async update(id, data, options) {
    throw new Error('update() must be implemented');
  }

  async delete(id, options) {
    throw new Error('delete() must be implemented');
  }

  async query(query, options) {
    throw new Error('query() must be implemented');
  }
}

module.exports = {
  PersistencePort,
  PersistenceProvider
};
