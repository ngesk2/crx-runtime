/**
 * Transaction Boundary
 * 
 * Phase A1.1 — Constitutional Transaction Boundary
 * 
 * Every state transition must execute inside one constitutional transaction.
 * 
 * Requirements:
 * - Exactly one transaction per state transition
 * - Automatic rollback on failure
 * - No partial persistence
 * - No side effects before commit
 * - Nested transactions prohibited unless implemented through savepoints
 * 
 * Transaction Context holds:
 * - client: PostgreSQL transaction client
 * - outbox: Event outbox for transactional event publication
 * - repository: Repository store for aggregate persistence
 * - identityAuthority: Deterministic ID generation
 * - timeAuthority: Deterministic time
 * - witnessAuthority: Witness generation
 */

const { identityAuthority } = require('./identity_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { StandardEventSchema } = require('./standard_event_schema');

class TransactionBoundary {
  constructor(postgresPool, outbox, repository) {
    this._postgres = postgresPool;
    this._outbox = outbox;
    this._repository = repository;
    this._activeTransaction = null;
    this._transactionDepth = 0;
  }

  /**
   * Execute operation within transaction boundary
   * @param {Function} operation - Operation to execute
   * @param {Object} options - Transaction options
   * @returns {Promise<any>} Operation result
   */
  async execute(operation, options = {}) {
    if (this._activeTransaction) {
      throw new Error('Nested transactions are prohibited. Use savepoints if needed.');
    }

    const client = await this._postgres.connect();
    this._activeTransaction = client;
    this._transactionDepth = 1;

    try {
      await client.query('BEGIN');
      
      const result = await operation(this._createTransactionContext(client));
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      this._activeTransaction = null;
      this._transactionDepth = 0;
      client.release();
    }
  }

  /**
   * Execute operation with savepoint (for nested operations)
   * @param {string} savepointName - Savepoint name
   * @param {Function} operation - Operation to execute
   * @returns {Promise<any>} Operation result
   */
  async withSavepoint(savepointName, operation) {
    if (!this._activeTransaction) {
      throw new Error('Savepoints require an active transaction');
    }

    const client = this._activeTransaction;
    this._transactionDepth++;

    try {
      await client.query(`SAVEPOINT ${savepointName}`);
      
      const result = await operation(this._createTransactionContext(client));
      
      await client.query(`RELEASE SAVEPOINT ${savepointName}`);
      
      return result;
    } catch (error) {
      await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
      throw error;
    } finally {
      this._transactionDepth--;
    }
  }

  /**
   * Get active transaction context
   * @returns {Object|null} Transaction context
   */
  getTransactionContext() {
    if (!this._activeTransaction) {
      return null;
    }
    return this._createTransactionContext(this._activeTransaction);
  }

  /**
   * Check if transaction is active
   * @returns {boolean} True if transaction active
   */
  isTransactionActive() {
    return this._activeTransaction !== null;
  }

  /**
   * Get transaction depth
   * @returns {number} Transaction depth
   */
  getTransactionDepth() {
    return this._transactionDepth;
  }

  /**
   * Create transaction context
   * @param {Object} client - PostgreSQL client
   * @returns {Object} Transaction context
   */
  _createTransactionContext(client) {
    return {
      client: client,
      query: async (sql, params) => {
        if (!this._activeTransaction) {
          throw new Error('No active transaction');
        }
        return await client.query(sql, params);
      },
      outbox: {
        append: async (eventType, aggregateId, aggregateType, payload, authority, options = {}) => {
          const event = StandardEventSchema.create(eventType, aggregateId, aggregateType, payload, authority, options);
          const witness = witnessAuthority.createWitness(event);
          await this._outbox.write(client, event, witness);
          return event;
        }
      },
      repository: {
        append: async (object) => {
          return await this._repository.append(object, { client });
        },
        load: async (objectId) => {
          return await this._repository.load(objectId);
        }
      },
      identityAuthority: identityAuthority,
      timeAuthority: constitutionalTimeAuthority,
      witnessAuthority: witnessAuthority,
      withSavepoint: this.withSavepoint.bind(this),
      isTransactionActive: this.isTransactionActive.bind(this),
      getTransactionDepth: this.getTransactionDepth.bind(this)
    };
  }
}

/**
 * Transaction Middleware
 * 
 * Express middleware for transaction boundaries
 */
class TransactionMiddleware {
  constructor(transactionBoundary) {
    this._transactionBoundary = transactionBoundary;
  }

  /**
   * Create middleware
   * @returns {Function} Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const result = await this._transactionBoundary.execute(async (tx) => {
          req.tx = tx;
          const response = await next();
          return response;
        });
        
        // If next() didn't send response, send the result
        if (!res.headersSent) {
          res.json(result);
        }
      } catch (error) {
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        }
        next(error);
      }
    };
  }
}

module.exports = { TransactionBoundary, TransactionMiddleware };
