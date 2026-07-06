/**
 * Retry Policy
 * 
 * Phase A2.2 — Constitutional Retry Policy
 * Phase 36F: Entropy Sealing - Use deterministic jitter
 * 
 * Centralizes retry logic. No worker should invent retry logic.
 * 
 * Supports:
 * - Exponential backoff
 * - Jitter
 * - Retry limits
 * - Permanent failure detection
 * - Dead letter transition
 * 
 * Retry Strategy:
 * 
 * Attempt 1: 1s delay
 * Attempt 2: 2s delay
 * Attempt 3: 4s delay
 * Attempt 4: 8s delay
 * Attempt 5: 16s delay
 * Attempt 6: 32s delay (max)
 * 
 * With 50% jitter to prevent thundering herd.
 */

class RetryPolicy {
  constructor(options = {}) {
    this._options = {
      maxRetries: options.maxRetries || 5,
      baseDelay: options.baseDelay || 1000, // 1 second
      maxDelay: options.maxDelay || 60000, // 1 minute
      jitterFactor: options.jitterFactor || 0.5, // 50% jitter
      ...options
    };
    this._retryCount = 0;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   * @param {number} retryCount - Current retry count (0-based)
   * @returns {number} Delay in milliseconds
   */
  calculateDelay(retryCount) {
    const exponentialDelay = Math.min(
      this._options.baseDelay * Math.pow(2, retryCount),
      this._options.maxDelay
    );
    
    // Phase 36F: Use deterministic jitter based on retry count
    const jitter = (retryCount * 0.618033988749895) % 1 * this._options.jitterFactor * exponentialDelay;
    
    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Check if job should be retried
   * @param {number} retryCount - Current retry count
   * @param {Error} error - Error that caused failure
   * @returns {boolean} True if should retry
   */
  shouldRetry(retryCount, error) {
    // Check retry limit
    if (retryCount >= this._options.maxRetries) {
      return false;
    }

    // Check for non-retryable errors
    if (this._isNonRetryable(error)) {
      return false;
    }

    return true;
  }

  /**
   * Check if error is non-retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if non-retryable
   */
  _isNonRetryable(error) {
    // Non-retryable error patterns
    const nonRetryablePatterns = [
      'validation',
      'authentication',
      'authorization',
      'not found',
      'already exists',
      'constraint',
      'duplicate',
      'invalid',
      'malformed'
    ];

    const errorMessage = error.message.toLowerCase();
    
    for (const pattern of nonRetryablePatterns) {
      if (errorMessage.includes(pattern)) {
        return true;
      }
    }

    // Check error code if available
    if (error.code) {
      const nonRetryableCodes = [
        '23505', // unique_violation
        '23503', // foreign_key_violation
        '23502', // not_null_violation
        '42501', // insufficient_privilege
        '28000', // invalid_authorization_specification
        '28P01', // invalid_password
        '3D000'  // invalid_catalog_name
      ];

      if (nonRetryableCodes.includes(error.code)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get retry metadata
   * @param {number} retryCount - Current retry count
   * @param {Error} error - Error that caused failure
   * @returns {Object} Retry metadata
   */
  getRetryMetadata(retryCount, error) {
    const shouldRetry = this.shouldRetry(retryCount, error);
    const delay = shouldRetry ? this.calculateDelay(retryCount) : 0;
    const isFinal = !shouldRetry || retryCount >= this._options.maxRetries - 1;

    return {
      shouldRetry,
      delay,
      retryCount,
      maxRetries: this._options.maxRetries,
      isFinal,
      isNonRetryable: this._isNonRetryable(error),
      errorType: this._classifyError(error)
    };
  }

  /**
   * Classify error type
   * @param {Error} error - Error to classify
   * @returns {string} Error type
   */
  _classifyError(error) {
    if (this._isNonRetryable(error)) {
      return 'non_retryable';
    }

    if (error.message.includes('timeout') || error.message.includes('deadline')) {
      return 'timeout';
    }

    if (error.message.includes('connection') || error.message.includes('network')) {
      return 'network';
    }

    if (error.message.includes('rate limit') || error.message.includes('throttle')) {
      return 'rate_limit';
    }

    return 'retryable';
  }

  /**
   * Determine failure reason (for dead letter classification)
   * @param {Error} error - Error
   * @returns {string} Failure reason
   */
  determineFailureReason(error) {
    if (error.message.includes('timeout')) {
      return 'timeout';
    }
    if (error.message.includes('connection') || error.message.includes('network')) {
      return 'network';
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return 'validation';
    }
    if (error.message.includes('authentication') || error.message.includes('authorization')) {
      return 'authorization';
    }
    if (error.message.includes('not found')) {
      return 'not_found';
    }
    if (error.message.includes('constraint') || error.message.includes('duplicate')) {
      return 'constraint';
    }
    if (error.message.includes('rate limit') || error.message.includes('throttle')) {
      return 'rate_limit';
    }
    return 'unknown';
  }

  /**
   * Check if error is replayable (for dead letter classification)
   * @param {Error} error - Error
   * @returns {boolean} True if replayable
   */
  isReplayable(error) {
    const nonReplayableReasons = [
      'validation',
      'authorization',
      'constraint',
      'not_found'
    ];

    const reason = this.determineFailureReason(error);
    return !nonReplayableReasons.includes(reason);
  }

  /**
   * Create retry policy for specific job type
   * @param {string} jobType - Job type
   * @param {Object} options - Job-specific options
   * @returns {RetryPolicy} Configured retry policy
   */
  static forJobType(jobType, options = {}) {
    const jobTypeDefaults = {
      mission: {
        maxRetries: 3,
        baseDelay: 2000,
        maxDelay: 30000
      },
      execution: {
        maxRetries: 5,
        baseDelay: 1000,
        maxDelay: 60000
      },
      inference: {
        maxRetries: 2,
        baseDelay: 5000,
        maxDelay: 120000
      },
      replay: {
        maxRetries: 1,
        baseDelay: 1000,
        maxDelay: 5000
      },
      cleanup: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      snapshot: {
        maxRetries: 2,
        baseDelay: 2000,
        maxDelay: 30000
      }
    };

    const defaults = jobTypeDefaults[jobType] || {};
    return new RetryPolicy({ ...defaults, ...options });
  }
}

module.exports = { RetryPolicy };
