const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { witnessAuthority } = require('./witness_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

/**
 * Retry Authority
 * 
 * Phase 11.8 — Retry Policy Enforcement and Retry Witness Creation
 * 
 * Enforces retry policies for failed operations:
 * - Retry policy enforcement (max attempts, backoff strategy)
 * - Retry attempt tracking
 * - Retry witness creation
 * - Retry state management
 * 
 * Constitutional Requirements:
 * - Retry decisions must be deterministic
 * - Retry witnesses must be replayable
 * - Retry policies are constitutional data
 * 
 * Pipeline:
 * Operation Failed → RetryAuthority → Retry Decision → Retry Witness → Retry Execution
 */

class RetryAuthority {
  constructor(postgresPool, eventAuthority) {
    this._postgres = postgresPool;
    this._eventAuthority = eventAuthority;
    this._witnessAuthority = witnessAuthority;
    // Removed serializer reference - use CanonicalAuthority directly
    this._retryPolicies = new Map(); // policy_id → retry policy
    this._retryAttempts = new Map(); // execution_id → retry attempts
    this._constitutionalVersion = '11.0.0';
    this._initializeDefaultPolicies();
  }

  /**
   * Initialize default retry policies
   */
  _initializeDefaultPolicies() {
    // Default policy: 3 attempts with exponential backoff
    this._retryPolicies.set('default', {
      policy_id: 'default',
      max_attempts: 3,
      backoff_strategy: 'exponential',
      backoff_base: 1000, // 1 second
      backoff_multiplier: 2
    });

    // No retry policy
    this._retryPolicies.set('no_retry', {
      policy_id: 'no_retry',
      max_attempts: 1,
      backoff_strategy: 'none',
      backoff_base: 0,
      backoff_multiplier: 1
    });

    // Aggressive retry policy
    this._retryPolicies.set('aggressive', {
      policy_id: 'aggressive',
      max_attempts: 5,
      backoff_strategy: 'linear',
      backoff_base: 500, // 500ms
      backoff_multiplier: 1
    });
  }

  /**
   * Initialize retry authority
   */
  async initialize() {
    console.log('[RetryAuthority] Initializing retry authority');
    console.log('[RetryAuthority] Retry authority initialized');
  }

  /**
   * Register retry policy
   * @param {Object} policy - Retry policy
   * @returns {Object} Registered policy
   */
  registerRetryPolicy(policy) {
    const policyId = policy.policy_id || this._generatePolicyId(policy);
    
    const retryPolicy = {
      policy_id: policyId,
      max_attempts: policy.max_attempts || 3,
      backoff_strategy: policy.backoff_strategy || 'exponential',
      backoff_base: policy.backoff_base || 1000,
      backoff_multiplier: policy.backoff_multiplier || 2,
      retryable_errors: policy.retryable_errors || ['network_error', 'timeout']
    };

    this._retryPolicies.set(policyId, retryPolicy);

    return retryPolicy;
  }

  /**
   * Get retry policy
   * @param {string} policyId - Policy ID
   * @returns {Object} Retry policy
   */
  getRetryPolicy(policyId) {
    return this._retryPolicies.get(policyId) || this._retryPolicies.get('default');
  }

  /**
   * Should retry operation
   * @param {string} executionId - Execution ID
   * @param {Object} failureClassification - Failure classification from FailureAuthority
   * @param {string} policyId - Policy ID
   * @returns {Object} Retry decision
   */
  shouldRetry(executionId, failureClassification, policyId = 'default') {
    const policy = this.getRetryPolicy(policyId);
    const attempts = this._retryAttempts.get(executionId) || 0;

    // Check if max attempts reached
    if (attempts >= policy.max_attempts) {
      return {
        should_retry: false,
        reason: 'max_attempts_reached',
        attempts: attempts,
        max_attempts: policy.max_attempts
      };
    }

    // Check if failure is retryable based on FailureAuthority classification
    if (!failureClassification.retryable) {
      return {
        should_retry: false,
        reason: 'failure_not_retryable',
        failure_category: failureClassification.category,
        severity: failureClassification.severity
      };
    }

    // Calculate backoff delay
    const backoffDelay = this._calculateBackoffDelay(policy, attempts);

    return {
      should_retry: true,
      reason: 'retry_allowed',
      attempts: attempts,
      next_attempt: attempts + 1,
      backoff_delay: backoffDelay
    };
  }

  /**
   * Record retry attempt
   * @param {string} executionId - Execution ID
   * @param {Object} failureClassification - Failure classification from FailureAuthority
   * @returns {Object} Retry attempt record
   */
  recordRetryAttempt(executionId, failureClassification) {
    const attempts = this._retryAttempts.get(executionId) || 0;
    this._retryAttempts.set(executionId, attempts + 1);

    const retryAttempt = {
      execution_id: executionId,
      attempt_number: attempts + 1,
      failure_category: failureClassification.category,
      failure_code: failureClassification.failure_code,
      timestamp: constitutionalTimeAuthority.now()
    };

    // Create retry witness
    const retryWitness = this._createRetryWitness(retryAttempt);

    return {
      retry_attempt: retryAttempt,
      witness: retryWitness
    };
  }

  /**
   * Clear retry attempts for execution
   * @param {string} executionId - Execution ID
   */
  clearRetryAttempts(executionId) {
    this._retryAttempts.delete(executionId);
  }

  /**
   * Get retry attempts for execution
   * @param {string} executionId - Execution ID
   * @returns {number} Retry attempts
   */
  getRetryAttempts(executionId) {
    return this._retryAttempts.get(executionId) || 0;
  }

  /**
   * Calculate backoff delay
   * @param {Object} policy - Retry policy
   * @param {number} attempts - Current attempt count
   * @returns {number} Backoff delay in milliseconds
   */
  _calculateBackoffDelay(policy, attempts) {
    if (policy.backoff_strategy === 'none') {
      return 0;
    } else if (policy.backoff_strategy === 'linear') {
      return policy.backoff_base * (attempts + 1);
    } else if (policy.backoff_strategy === 'exponential') {
      return policy.backoff_base * Math.pow(policy.backoff_multiplier, attempts);
    } else {
      return policy.backoff_base;
    }
  }

  /**
   * Create retry witness
   * @param {Object} retryAttempt - Retry attempt
   * @returns {Object} Retry witness
   */
  _createRetryWitness(retryAttempt) {
    const witnessData = {
      execution_id: retryAttempt.execution_id,
      attempt_number: retryAttempt.attempt_number,
      failure_category: retryAttempt.failure_category,
      failure_code: retryAttempt.failure_code,
      constitutional_version: this._constitutionalVersion
    };

    const witness = this._witnessAuthority.createWitness(witnessData, {
      authority: 'RetryAuthority',
      authority_version: this._constitutionalVersion
    });

    return witness;
  }

  /**
   * Generate policy ID
   * @param {Object} policy - Policy
   * @returns {string} Policy ID
   */
  _generatePolicyId(policy) {
    const policyData = {
      max_attempts: policy.max_attempts,
      backoff_strategy: policy.backoff_strategy,
      retryable_errors: policy.retryable_errors
    };
    const hash = CanonicalAuthority.hash(policyData);
    return `retry_policy_${hash.substring(0, 16)}`;
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Retry authority operational',
      policies_count: this._retryPolicies.size,
      active_retries: this._retryAttempts.size
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'retry-authority',
      authority_name: 'RetryAuthority',
      version: '11.0.0',
      consumes: ['ExecutionFailed'],
      produces: ['RetryDecision', 'RetryAttemptRecorded', 'RetryWitnessCreated'],
      replay_inputs: ['RetryPolicyVersion', 'ExecutionId'],
      requires: ['event_authority', 'witness_authority'],
      guarantees: ['retry_policy_enforcement', 'retry_attempt_tracking', 'retry_witness_creation', 'deterministic_retry_decisions'],
      failure_modes: ['policy_not_found', 'max_attempts_exceeded'],
      rollback: 'none',
      determinism: 'deterministic',
      constitutional_outputs: ['retry_decision', 'retry_attempt', 'witness']
    };
  }
}

module.exports = { RetryAuthority };
