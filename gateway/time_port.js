/**
 * Time Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides time operations behind a constitutional port.
 * 
 * Constitutional Constraint: Single time authority for all time operations.
 * 
 * Time Port owns:
 * - Infrastructure timing
 * - Timeout tracking
 * - Duration measurement
 * 
 * Note: ConstitutionalTimeAuthority provides deterministic time for replay.
 * TimePort provides infrastructure timing for operations, locks, etc.
 * 
 * Implementations:
 * - SystemTimeProvider (current)
 * - Future: NTPTimeProvider, etc.
 */

class TimePort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Get current time in milliseconds
   * @returns {number} Milliseconds
   */
  async nowMillis() {
    return this._provider.nowMillis();
  }

  /**
   * Get current timestamp
   * @returns {string} ISO timestamp
   */
  async now() {
    return this._provider.now();
  }

  /**
   * Measure duration
   * @param {Function} operation - Operation to measure
   * @returns {Promise<{result: any, durationMs: number}>} Result and duration
   */
  async measureDuration(operation) {
    return this._provider.measureDuration(operation);
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
    return `time.${providerName.toLowerCase()}`;
  }
}

/**
 * Time Provider Interface
 * 
 * All time providers must implement this interface.
 */
class TimeProvider {
  async nowMillis() {
    throw new Error('nowMillis() must be implemented');
  }

  async now() {
    throw new Error('now() must be implemented');
  }

  async measureDuration(operation) {
    const startTime = Date.now();
    const result = await operation();
    const durationMs = Date.now() - startTime;
    return { result, durationMs };
  }
}

module.exports = {
  TimePort,
  TimeProvider
};
