/**
 * Trace Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides tracing behind a constitutional port.
 * 
 * Constitutional Constraint: Single trace authority for all tracing operations.
 * 
 * Trace Port owns:
 * - Trace creation
 * - Span management
 * - Trace export
 * 
 * Note: The constitutional kernel never emits OpenTelemetry directly.
 * Kernel emits constitutional traces through TracePort.
 * 
 * Implementations:
 * - OpenTelemetryTraceProvider
 * - JaegerTraceProvider
 * - ZipkinTraceProvider
 */

class TracePort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Start span
   * @param {string} name - Span name
   * @param {Object} options - Span options
   * @returns {Promise<Object>} Span context
   */
  async startSpan(name, options = {}) {
    return this._provider.startSpan(name, options);
  }

  /**
   * End span
   * @param {Object} span - Span context
   * @param {Object} options - End options
   * @returns {Promise<void>}
   */
  async endSpan(span, options = {}) {
    return this._provider.endSpan(span, options);
  }

  /**
   * Add event to span
   * @param {Object} span - Span context
   * @param {string} eventName - Event name
   * @param {Object} attributes - Event attributes
   * @returns {Promise<void>}
   */
  async addEvent(span, eventName, attributes = {}) {
    return this._provider.addEvent(span, eventName, attributes);
  }

  /**
   * Set span attribute
   * @param {Object} span - Span context
   * @param {string} key - Attribute key
   * @param {any} value - Attribute value
   * @returns {Promise<void>}
   */
  async setAttribute(span, key, value) {
    return this._provider.setAttribute(span, key, value);
  }

  /**
   * Record exception
   * @param {Object} span - Span context
   * @param {Error} exception - Exception to record
   * @param {Object} options - Record options
   * @returns {Promise<void>}
   */
  async recordException(span, exception, options = {}) {
    return this._provider.recordException(span, exception, options);
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
    return `trace.${providerName.toLowerCase()}`;
  }
}

/**
 * Trace Provider Interface
 * 
 * All trace providers must implement this interface.
 */
class TraceProvider {
  async startSpan(name, options) {
    throw new Error('startSpan() must be implemented');
  }

  async endSpan(span, options) {
    throw new Error('endSpan() must be implemented');
  }

  async addEvent(span, eventName, attributes) {
    throw new Error('addEvent() must be implemented');
  }

  async setAttribute(span, key, value) {
    throw new Error('setAttribute() must be implemented');
  }

  async recordException(span, exception, options) {
    throw new Error('recordException() must be implemented');
  }
}

module.exports = {
  TracePort,
  TraceProvider
};
