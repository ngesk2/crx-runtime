const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * Runtime Failure Authority
 * 
 * Phase 3.4 — Runtime Failure Authority (original)
 * Phase 11.9 — Failure Classification, Failure Recording, Failure Witness Creation
 * 
 * Replace all remaining throw new Error(...) with deterministic constitutional failures.
 * 
 * Every failure must include:
 * - FailureCode
 * - ReplayPhase
 * - ConstitutionalVersion
 * 
 * Phase 11.9 Enhancement:
 * - Enhanced failure classification (categories, severity, recoverability)
 * - Failure recording with statistics
 * - Failure witness creation
 * - Failure analysis and reporting
 * - Separation of constitutional FailureRecord from runtime JavaScript Error
 * 
 * Runtime messages must never leak into constitutional hashes.
 * 
 * Constitutional: FailureRecord (immutable, hashable)
 * Runtime: JavaScript Error (operational, not constitutional)
 */

class RuntimeFailureAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureCodes = new Map();
    this._failureHistory = new Map(); // failure_id → FailureRecord (constitutional)
    this._failureCategories = new Map();
    this._failureStatistics = new Map();
    this._constitutionalVersion = '11.0.0';
    this._initializeFailureCategories();
  }

  /**
   * Initialize failure categories
   */
  _initializeFailureCategories() {
    this._failureCategories.set('network', {
      category: 'network',
      severity: 'medium',
      recoverable: true
    });
    
    this._failureCategories.set('validation', {
      category: 'validation',
      severity: 'low',
      recoverable: false
    });
    
    this._failureCategories.set('execution', {
      category: 'execution',
      severity: 'high',
      recoverable: true
    });
    
    this._failureCategories.set('constitutional', {
      category: 'constitutional',
      severity: 'critical',
      recoverable: false
    });
    
    this._failureCategories.set('infrastructure', {
      category: 'infrastructure',
      severity: 'high',
      recoverable: true
    });
  }

  /**
   * Record constitutional failure
   * @param {string} failureCode - Failure code
   * @param {string} replayPhase - Replay phase
   * @param {Object} context - Failure context
   * @returns {Object} FailureRecord (constitutional) and runtime Error
   */
  recordFailure(failureCode, replayPhase, context = {}) {
    const replayId = context.replay_id || null;
    const executionId = context.execution_id || null;
    const category = context.category || this._classifyFailure(failureCode);
    
    // Create constitutional FailureRecord (immutable, hashable)
    const failureRecord = {
      failure_code: failureCode,
      replay_phase: replayPhase,
      constitutional_version: this._constitutionalVersion,
      failure_id: this._generateFailureId(failureCode, replayPhase, replayId, executionId),
      category: category,
      context: this._sanitizeContext(context)
    };
    
    // Add category information
    const categoryInfo = this._failureCategories.get(category);
    if (categoryInfo) {
      failureRecord.severity = categoryInfo.severity;
      failureRecord.recoverable = categoryInfo.recoverable;
    }
    
    // Compute witness hash using WitnessAuthority
    const { witnessAuthority } = require('./witness_authority');
    failureRecord.witness_hash = witnessAuthority.createWitness(failureRecord, {
      authority: 'RuntimeFailureAuthority',
      authority_version: '11.0.0'
    }).witness_metadata.hash;
    
    // Record constitutional failure
    this._recordFailure(failureRecord);
    
    // Update statistics
    this._updateFailureStatistics(failureCode, category);
    
    // Create runtime Error (operational, not constitutional)
    const runtimeError = new Error(failureCode);
    runtimeError.failure_id = failureRecord.failure_id;
    
    return {
      failure_record: failureRecord,
      runtime_error: runtimeError
    };
  }

  /**
   * Create constitutional failure (legacy method for backward compatibility)
   * @param {string} failureCode - Failure code
   * @param {string} replayPhase - Replay phase
   * @param {Object} context - Failure context
   * @returns {Error} Runtime error with failure record attached
   */
  createFailure(failureCode, replayPhase, context = {}) {
    const result = this.recordFailure(failureCode, replayPhase, context);
    
    // Attach failure record to runtime error for backward compatibility
    result.runtime_error.failureRecord = result.failure_record;
    
    return result.runtime_error;
  }

  /**
   * Classify failure by code
   * @param {string} failureCode - Failure code
   * @returns {string} Category
   */
  _classifyFailure(failureCode) {
    const codeLower = failureCode.toLowerCase();
    
    if (codeLower.includes('network') || codeLower.includes('connection') || codeLower.includes('timeout')) {
      return 'network';
    } else if (codeLower.includes('invalid') || codeLower.includes('validation')) {
      return 'validation';
    } else if (codeLower.includes('execution') || codeLower.includes('runtime')) {
      return 'execution';
    } else if (codeLower.includes('constitutional') || codeLower.includes('replay') || codeLower.includes('witness')) {
      return 'constitutional';
    } else {
      return 'infrastructure';
    }
  }

  /**
   * Update failure statistics
   * @param {string} failureCode - Failure code
   * @param {string} category - Category
   */
  _updateFailureStatistics(failureCode, category) {
    if (!this._failureStatistics.has(failureCode)) {
      this._failureStatistics.set(failureCode, {
        failure_code: failureCode,
        category: category,
        count: 0,
        first_occurrence: constitutionalTimeAuthority.nowAsMillis(),
        last_occurrence: null
      });
    }
    
    const stats = this._failureStatistics.get(failureCode);
    stats.count++;
    stats.last_occurrence = constitutionalTimeAuthority.nowAsMillis();
  }

  /**
   * Get failure statistics
   * @returns {Object} Failure statistics
   */
  getFailureStatistics() {
    return {
      total_failures: Array.from(this._failureStatistics.values()).reduce((sum, stats) => sum + stats.count, 0),
      by_category: this._getStatisticsByCategory(),
      by_code: Array.from(this._failureStatistics.values())
    };
  }

  /**
   * Get statistics by category
   * @returns {Object} Statistics by category
   */
  _getStatisticsByCategory() {
    const byCategory = {};
    
    for (const stats of this._failureStatistics.values()) {
      if (!byCategory[stats.category]) {
        byCategory[stats.category] = 0;
      }
      byCategory[stats.category] += stats.count;
    }
    
    return byCategory;
  }

  /**
   * Get failure category
   * @param {string} category - Category name
   * @returns {Object} Category information
   */
  getFailureCategory(category) {
    return this._failureCategories.get(category);
  }

  /**
   * Register failure category
   * @param {string} category - Category name
   * @param {Object} categoryInfo - Category information
   */
  registerFailureCategory(category, categoryInfo) {
    this._failureCategories.set(category, {
      category: category,
      severity: categoryInfo.severity || 'medium',
      recoverable: categoryInfo.recoverable !== undefined ? categoryInfo.recoverable : true
    });
  }

  /**
   * Get failure classification for retry decision
   * @param {string} failureId - Failure ID
   * @returns {Object} Failure classification
   */
  getFailureClassification(failureId) {
    const failure = this._failureHistory.get(failureId);
    if (!failure) {
      return null;
    }

    return {
      failure_code: failure.failure_code,
      category: failure.category,
      severity: failure.severity,
      recoverable: failure.recoverable,
      failure_id: failure.failure_id
    };
  }

  /**
   * Sanitize context to prevent message leakage into hashes
   * @param {Object} context - Raw context
   * @returns {Object} Sanitized context
   */
  _sanitizeContext(context) {
    const sanitized = {};
    const allowedKeys = ['execution_id', 'replay_id', 'runtime_id', 'component'];
    
    for (const key of allowedKeys) {
      if (context[key] !== undefined) {
        sanitized[key] = context[key];
      }
    }

    return sanitized;
  }

  /**
   * Record failure
   * @param {Object} failureRecord - Constitutional FailureRecord
   */
  _recordFailure(failureRecord) {
    this._failureHistory.set(failureRecord.failure_id, {
      failure_code: failureRecord.failure_code,
      replay_phase: failureRecord.replay_phase,
      constitutional_version: failureRecord.constitutional_version,
      failure_id: failureRecord.failure_id,
      category: failureRecord.category,
      severity: failureRecord.severity,
      recoverable: failureRecord.recoverable,
      context: failureRecord.context,
      witness_hash: failureRecord.witness_hash
    });
  }

  /**
   * Get failure by ID
   * @param {string} failureId - Failure ID
   * @returns {Object} Failure record
   */
  getFailure(failureId) {
    return this._failureHistory.get(failureId);
  }

  /**
   * Get failures by code
   * @param {string} failureCode - Failure code
   * @returns {Array} Array of failures
   */
  getFailuresByCode(failureCode) {
    const failures = [];
    for (const record of this._failureHistory.values()) {
      if (record.failure_code === failureCode) {
        failures.push(record);
      }
    }
    return failures;
  }

  /**
   * Get failures by replay phase
   * @param {string} replayPhase - Replay phase
   * @returns {Array} Array of failures
   */
  getFailuresByPhase(replayPhase) {
    const failures = [];
    for (const record of this._failureHistory.values()) {
      if (record.replay_phase === replayPhase) {
        failures.push(record);
      }
    }
    return failures;
  }

  /**
   * Generate failure ID from constitutional data only
   * @param {string} failureCode - Failure code
   * @param {string} replayPhase - Replay phase
   * @param {string} replayId - Replay ID (optional)
   * @param {string} executionId - Execution ID (optional)
   * @returns {string} Failure ID
   */
  _generateFailureId(failureCode, replayPhase, replayId = null, executionId = null) {
    const failureData = {
      failure_code: failureCode,
      replay_phase: replayPhase,
      constitutional_version: this._constitutionalVersion,
      replay_id: replayId,
      execution_id: executionId
    };
    const hash = CanonicalAuthority.hash(failureData);
    return `fail_${hash.substring(0, 16)}`;
  }

  /**
   * Clear all failures (for testing)
   */
  clear() {
    this._failureHistory.clear();
  }

  /**
   * Get all failures
   * @returns {Array} Array of all failures
   */
  getAllFailures() {
    return Array.from(this._failureHistory.values());
  }

  /**
   * Predefined failure codes
   */
  static FAILURE_CODES = {
    NO_ACTIVE_CONTEXT: 'NO_ACTIVE_CONTEXT',
    INVALID_EXECUTION_ID: 'INVALID_EXECUTION_ID',
    CONTEXT_CREATION: 'CONTEXT_CREATION',
    EXECUTION_LIFECYCLE: 'EXECUTION_LIFECYCLE',
    SCHEDULER_VIOLATION: 'SCHEDULER_VIOLATION',
    STATE_MUTATION: 'STATE_MUTATION',
    ALIASING_DETECTED: 'ALIASING_DETECTED',
    IDENTITY_REUSE: 'IDENTITY_REUSE',
    SHARED_MUTABLE_REFERENCE: 'SHARED_MUTABLE_REFERENCE',
    REPLAY_MISMATCH: 'REPLAY_MISMATCH',
    ENVIRONMENT_DEPENDENCY: 'ENVIRONMENT_DEPENDENCY',
    RANDOMNESS_DETECTED: 'RANDOMNESS_DETECTED',
    IO_DURING_REPLAY: 'IO_DURING_REPLAY',
    CHECKPOINT_INVALID: 'CHECKPOINT_INVALID',
    RECOVERY_FAILED: 'RECOVERY_FAILED'
  };

  static REPLAY_PHASES = {
    CONTEXT_CREATION: 'CONTEXT_CREATION',
    EXECUTION_LIFECYCLE: 'EXECUTION_LIFECYCLE',
    SCHEDULING: 'SCHEDULING',
    STATE_TRANSITION: 'STATE_TRANSITION',
    REPLAY_VERIFICATION: 'REPLAY_VERIFICATION',
    ENVIRONMENT_SETUP: 'ENVIRONMENT_SETUP',
    CHECKPOINT: 'CHECKPOINT',
    RECOVERY: 'RECOVERY'
  };
}

// Singleton instance
const runtimeFailureAuthority = new RuntimeFailureAuthority();

module.exports = { RuntimeFailureAuthority, runtimeFailureAuthority };
