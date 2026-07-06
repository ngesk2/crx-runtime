/**
 * Circuit Breaker
 * 
 * Phase 3.12 — Circuit Breaker
 * 
 * Ollama unavailability handling with automatic recovery.
 * 
 * Features:
 * - Trip breaker when Ollama unavailable
 * - Reject requests immediately when tripped
 * - Automatic probing every few seconds
 * - Recover when healthy
 * - Prevent request pileups
 */

class CircuitBreaker {
  constructor(config = {}, timePort) {
    this._failureThreshold = config.failureThreshold || 5;
    this._recoveryTimeout = config.recoveryTimeout || 30000; // 30 seconds
    this._probeInterval = config.probeInterval || 5000; // 5 seconds
    this._timeout = config.timeout || 10000; // 10 seconds
    this._timePort = timePort;
    
    this._state = 'closed'; // closed, open, half-open
    this._failureCount = 0;
    this._lastFailureTime = null;
    this._probeTimer = null;
    this._healthCheckFn = null;
  }

  /**
   * Initialize circuit breaker
   */
  initialize(healthCheckFn) {
    console.log('[CircuitBreaker] Initializing');
    this._healthCheckFn = healthCheckFn;
    console.log('[CircuitBreaker] Initialized');
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute(fn) {
    // Check if circuit is open
    if (this._state === 'open') {
      throw new Error('Circuit breaker is OPEN - service unavailable');
    }

    try {
      const result = await fn();
      
      // Success - reset failure count
      this._onSuccess();
      
      return result;
    } catch (error) {
      // Failure - increment failure count
      await this._onFailure();
      
      throw error;
    }
  }

  /**
   * Handle success
   */
  _onSuccess() {
    this._failureCount = 0;
    
    if (this._state === 'half-open') {
      this._state = 'closed';
      console.log('[CircuitBreaker] Circuit closed (recovery successful)');
    }
  }

  /**
   * Handle failure
   */
  async _onFailure() {
    this._failureCount++;
    this._lastFailureTime = await this._timePort.nowMillis();

    console.log(`[CircuitBreaker] Failure count: ${this._failureCount}/${this._failureThreshold}`);

    // Check if threshold exceeded
    if (this._failureCount >= this._failureThreshold) {
      this._trip();
    }
  }

  /**
   * Trip circuit breaker
   */
  _trip() {
    this._state = 'open';
    console.log('[CircuitBreaker] Circuit tripped (OPEN)');

    // Start recovery probing
    this._startProbing();
  }

  /**
   * Start recovery probing
   */
  _startProbing() {
    if (this._probeTimer) {
      clearInterval(this._probeTimer);
    }

    this._probeTimer = setInterval(async () => {
      console.log('[CircuitBreaker] Probing service health...');
      
      try {
        const isHealthy = await this._healthCheckFn();
        
        if (isHealthy) {
          this._enterHalfOpen();
        }
      } catch (error) {
        console.log('[CircuitBreaker] Probe failed:', error.message);
      }
    }, this._probeInterval);
  }

  /**
   * Enter half-open state
   */
  _enterHalfOpen() {
    this._state = 'half-open';
    console.log('[CircuitBreaker] Circuit half-open (probing)');

    // Stop probing
    if (this._probeTimer) {
      clearInterval(this._probeTimer);
      this._probeTimer = null;
    }

    // Reset failure count for next attempt
    this._failureCount = 0;
  }

  /**
   * Manual reset
   */
  reset() {
    console.log('[CircuitBreaker] Manual reset');

    if (this._probeTimer) {
      clearInterval(this._probeTimer);
      this._probeTimer = null;
    }

    this._state = 'closed';
    this._failureCount = 0;
    this._lastFailureTime = null;
  }

  /**
   * Get state
   */
  getState() {
    return {
      state: this._state,
      failureCount: this._failureCount,
      failureThreshold: this._failureThreshold,
      lastFailureTime: this._lastFailureTime,
      isClosed: this._state === 'closed',
      isOpen: this._state === 'open',
      isHalfOpen: this._state === 'half-open'
    };
  }

  /**
   * Check if circuit is open
   */
  isOpen() {
    return this._state === 'open';
  }

  /**
   * Check if circuit is closed
   */
  isClosed() {
    return this._state === 'closed';
  }

  /**
   * Destroy circuit breaker
   */
  destroy() {
    if (this._probeTimer) {
      clearInterval(this._probeTimer);
      this._probeTimer = null;
    }
    console.log('[CircuitBreaker] Destroyed');
  }
}

module.exports = { CircuitBreaker };
