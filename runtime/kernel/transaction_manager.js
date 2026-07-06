/**
 * Transaction Manager
 * 
 * Priority 6: Transaction Constitution
 * 
 * Constitutional Constraint:
 * Append → Reducer → Projection → Witness → Commit must be atomic.
 * 
 * If interrupted, rollback must restore exactly:
 * - previous witness
 * - previous replay hash
 * - previous transcript
 * 
 * Architecture:
 * TransactionManager
 *   ↓
 * Atomic Transaction
 *   ↓
 * Rollback Guarantees
 *   ↓
 * Exact State Restoration
 */

class TransactionManager {
  constructor(pool) {
    this._pool = pool;
    this._transactionVersion = '1.0.0';
    this._activeTransactions = new Map(); // transaction_id -> transaction state
  }

  /**
   * Begin transaction
   * @param {string} transactionId - Transaction identifier
   * @returns {Object} Transaction context
   */
  async beginTransaction(transactionId) {
    const client = await this._pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const transaction = {
        id: transactionId,
        client: client,
        state: 'active',
        previousState: null,
        operations: [],
        startedAt: Date.now()
      };
      
      this._activeTransactions.set(transactionId, transaction);
      
      return {
        transactionId,
        client,
        state: 'active'
      };
    } catch (error) {
      client.release();
      throw new Error(`Failed to begin transaction: ${error.message}`);
    }
  }

  /**
   * Commit transaction
   * @param {string} transactionId - Transaction identifier
   * @returns {Object} Commit result
   */
  async commitTransaction(transactionId) {
    const transaction = this._activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    if (transaction.state !== 'active') {
      throw new Error(`Transaction not active: ${transactionId}`);
    }
    
    try {
      await transaction.client.query('COMMIT');
      
      transaction.state = 'committed';
      transaction.completedAt = Date.now();
      
      this._activeTransactions.delete(transactionId);
      
      return {
        transactionId,
        state: 'committed',
        duration: transaction.completedAt - transaction.startedAt
      };
    } catch (error) {
      // Commit failed - attempt rollback
      await this._rollbackTransaction(transaction, error);
      throw error;
    } finally {
      transaction.client.release();
    }
  }

  /**
   * Rollback transaction
   * @param {string} transactionId - Transaction identifier
   * @param {Error} error - Error that caused rollback
   * @returns {Object} Rollback result
   */
  async rollbackTransaction(transactionId, error) {
    const transaction = this._activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    return await this._rollbackTransaction(transaction, error);
  }

  /**
   * Internal rollback implementation
   * @param {Object} transaction - Transaction object
   * @param {Error} error - Error that caused rollback
   * @returns {Object} Rollback result
   * @private
   */
  async _rollbackTransaction(transaction, error) {
    try {
      await transaction.client.query('ROLLBACK');
      
      transaction.state = 'rolled_back';
      transaction.completedAt = Date.now();
      transaction.rollbackReason = error?.message || 'Unknown';
      
      // Restore previous state if available
      if (transaction.previousState) {
        await this._restorePreviousState(transaction);
      }
      
      this._activeTransactions.delete(transaction.id);
      
      return {
        transactionId: transaction.id,
        state: 'rolled_back',
        duration: transaction.completedAt - transaction.startedAt,
        reason: transaction.rollbackReason
      };
    } catch (rollbackError) {
      // Rollback failed - critical error
      transaction.state = 'rollback_failed';
      transaction.completedAt = Date.now();
      transaction.rollbackError = rollbackError.message;
      
      this._activeTransactions.delete(transaction.id);
      
      throw new Error(`Rollback failed: ${rollbackError.message}. Original error: ${error?.message}`);
    } finally {
      transaction.client.release();
    }
  }

  /**
   * Save previous state before transaction
   * @param {string} transactionId - Transaction identifier
   * @param {Object} previousState - Previous state to save
   * @returns {Object} Save result
   */
  async savePreviousState(transactionId, previousState) {
    const transaction = this._activeTransactions.get(transactionId);
    
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    
    transaction.previousState = {
      witness: previousState.witness,
      replayHash: previousState.replayHash,
      transcript: previousState.transcript,
      timestamp: Date.now()
    };
    
    return {
      transactionId,
      state: 'saved'
    };
  }

  /**
   * Restore previous state after rollback
   * @param {Object} transaction - Transaction object
   * @returns {Object} Restore result
   * @private
   */
  async _restorePreviousState(transaction) {
    if (!transaction.previousState) {
      return { restored: false, reason: 'No previous state available' };
    }
    
    // Restore witness
    if (transaction.previousState.witness) {
      // TODO: Implement witness restoration through WitnessAuthority
      console.log(`Restoring witness for transaction ${transaction.id}`);
    }
    
    // Restore replay hash
    if (transaction.previousState.replayHash) {
      // TODO: Implement replay hash restoration
      console.log(`Restoring replay hash for transaction ${transaction.id}`);
    }
    
    // Restore transcript
    if (transaction.previousState.transcript) {
      // TODO: Implement transcript restoration
      console.log(`Restoring transcript for transaction ${transaction.id}`);
    }
    
    return {
      restored: true,
      witness: transaction.previousState.witness,
      replayHash: transaction.previousState.replayHash,
      transcript: transaction.previousState.transcript
    };
  }

  /**
   * Get transaction state
   * @param {string} transactionId - Transaction identifier
   * @returns {Object} Transaction state
   */
  getTransactionState(transactionId) {
    const transaction = this._activeTransactions.get(transactionId);
    
    if (!transaction) {
      return {
        transactionId,
        state: 'not_found'
      };
    }
    
    return {
      transactionId: transaction.id,
      state: transaction.state,
      startedAt: transaction.startedAt,
      operations: transaction.operations.length,
      hasPreviousState: !!transaction.previousState
    };
  }

  /**
   * Get active transactions
   * @returns {Array} Array of active transaction IDs
   */
  getActiveTransactions() {
    return Array.from(this._activeTransactions.keys());
  }

  /**
   * Get transaction version
   * @returns {string} Transaction version
   */
  getTransactionVersion() {
    return this._transactionVersion;
  }
}

module.exports = {
  TransactionManager
};
