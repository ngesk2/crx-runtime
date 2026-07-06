/**
 * Publication Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides all publication operations behind a single port.
 * 
 * Constitutional Constraint: Single publication authority for all publication operations.
 * 
 * Publication Port owns:
 * - Event publication
 * - Publication abstraction
 * - Publication guarantees (delivery, ordering, durability)
 * 
 * Note: The constitutional kernel only knows publish(). It never knows what an outbox is.
 * 
 * Implementations:
 * - PostgresOutboxProvider (current)
 * - Future: Kafka, RabbitMQ, etc.
 */

class PublicationPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Publish event
   * @param {Object} event - Event to publish
   * @param {Object} options - Publication options
   * @returns {Promise<void>}
   */
  async publish(event, options = {}) {
    return this._provider.publish(event, options);
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
    return `publication.${providerName.toLowerCase()}`;
  }
}

/**
 * Publication Provider Interface
 * 
 * All publication providers must implement this interface.
 */
class PublicationProvider {
  async publish(event, options) {
    throw new Error('publish() must be implemented');
  }
}

module.exports = {
  PublicationPort,
  PublicationProvider
};
