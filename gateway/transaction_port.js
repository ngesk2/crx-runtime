/**
 * Transaction Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides all transaction operations behind a single port.
 * 
 * Constitutional Constraint: Single transaction authority for all transaction operations.
 * 
 * Transaction Port owns:
 * - Transaction coordination
 * - Transaction abstraction
 * - Transaction guarantees (atomicity, consistency, isolation, durability)
 * 
 * TransactionPort coordinates PersistencePort, not vice versa.
 * 
 * Implementations:
 * - PostgreSQLTransactionProvider (current)
 * - Future: Other database transactions
 */

class TransactionPort {
  constructor(provider, persistencePort) {
    this._provider = provider;
    this._persistencePort = persistencePort;
    this._portId = this._generatePortId();
  }

  /**
   * Begin transaction
   * @param {Object} options - Transaction options
   * @returns {Promise<Object>} Transaction context
   */
  async begin(options = {}) {
    return this._provider.begin(options);
  }

  /**
   * Commit transaction
   * @param {Object} transaction - Transaction context
   * @returns {Promise<void>}
   */
  async commit(transaction) {
    return this._provider.commit(transaction);
  }

  /**
   * Rollback transaction
   * @param {Object} transaction - Transaction context
   * @returns {Promise<void>}
   */
  async rollback(transaction) {
    return this._provider.rollback(transaction);
  }

  /**
   * Execute within transaction
   * @param {Function} callback - Callback to execute within transaction
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} Callback result
   */
  async execute(callback, options = {}) {
    const transaction = await this.begin(options);
    try {
      const result = await callback(transaction);
      await this.commit(transaction);
      return result;
    } catch (error) {
      await this.rollback(transaction);
      throw error;
    }
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
    return `transaction.${providerName.toLowerCase()}`;
  }
}

/**
 * Transaction Provider Interface
 * 
 * All transaction providers must implement this interface.
 */
class TransactionProvider {
  async begin(options) {
    throw new Error('begin() must be implemented');
  }

  async commit(transaction) {
    throw new Error('commit() must be implemented');
  }

  async rollback(transaction) {
    throw new Error('rollback() must be implemented');
  }
}

module.exports = {
  TransactionPort,
  TransactionProvider
};
