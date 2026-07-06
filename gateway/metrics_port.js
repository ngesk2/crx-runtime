/**
 * Metrics Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides metrics collection behind a constitutional port.
 * 
 * Constitutional Constraint: Single metrics authority for all metrics operations.
 * 
 * Metrics Port owns:
 * - Metric collection
 * - Metric aggregation
 * - Metric export
 * 
 * Note: The constitutional kernel never emits Prometheus directly.
 * Kernel emits constitutional metrics through MetricsPort.
 * 
 * Implementations:
 * - PrometheusMetricsProvider
 * - OpenTelemetryMetricsProvider
 * - StatsDMetricsProvider
 */

class MetricsPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Increment counter
   * @param {string} name - Metric name
   * @param {Object} labels - Metric labels
   * @param {number} value - Increment value
   * @returns {Promise<void>}
   */
  async increment(name, labels = {}, value = 1) {
    return this._provider.increment(name, labels, value);
  }

  /**
   * Record gauge
   * @param {string} name - Metric name
   * @param {Object} labels - Metric labels
   * @param {number} value - Gauge value
   * @returns {Promise<void>}
   */
  async gauge(name, labels = {}, value) {
    return this._provider.gauge(name, labels, value);
  }

  /**
   * Record histogram
   * @param {string} name - Metric name
   * @param {Object} labels - Metric labels
   * @param {number} value - Histogram value
   * @returns {Promise<void>}
   */
  async histogram(name, labels = {}, value) {
    return this._provider.histogram(name, labels, value);
  }

  /**
   * Record timing
   * @param {string} name - Metric name
   * @param {Object} labels - Metric labels
   * @param {number} durationMs - Duration in milliseconds
   * @returns {Promise<void>}
   */
  async timing(name, labels = {}, durationMs) {
    return this._provider.timing(name, labels, durationMs);
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
    return `metrics.${providerName.toLowerCase()}`;
  }
}

/**
 * Metrics Provider Interface
 * 
 * All metrics providers must implement this interface.
 */
class MetricsProvider {
  async increment(name, labels, value) {
    throw new Error('increment() must be implemented');
  }

  async gauge(name, labels, value) {
    throw new Error('gauge() must be implemented');
  }

  async histogram(name, labels, value) {
    throw new Error('histogram() must be implemented');
  }

  async timing(name, labels, durationMs) {
    throw new Error('timing() must be implemented');
  }
}

module.exports = {
  MetricsPort,
  MetricsProvider
};
