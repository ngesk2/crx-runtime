/**
 * Messaging Port
 * 
 * Tier 2 — Constitutional Port
 * 
 * Hides all messaging operations behind a single port.
 * 
 * Constitutional Constraint: Single messaging authority for all messaging operations.
 * 
 * Messaging Port owns:
 * - All messaging operations
 * - Messaging abstraction
 * - Messaging guarantees (delivery, ordering, durability)
 * 
 * Implementations:
 * - NATSMessagingProvider (current)
 * - Future: Kafka, RabbitMQ, etc.
 */

class MessagingPort {
  constructor(provider) {
    this._provider = provider;
    this._portId = this._generatePortId();
  }

  /**
   * Publish message
   * @param {string} topic - Topic to publish to
   * @param {Object} message - Message to publish
   * @param {Object} options - Publish options
   * @returns {Promise<void>}
   */
  async publish(topic, message, options = {}) {
    return this._provider.publish(topic, message, options);
  }

  /**
   * Subscribe to topic
   * @param {string} topic - Topic to subscribe to
   * @param {Function} callback - Callback for messages
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} Subscription handle
   */
  async subscribe(topic, callback, options = {}) {
    return this._provider.subscribe(topic, callback, options);
  }

  /**
   * Unsubscribe from topic
   * @param {Object} subscription - Subscription handle
   * @returns {Promise<void>}
   */
  async unsubscribe(subscription) {
    return this._provider.unsubscribe(subscription);
  }

  /**
   * Request-reply pattern
   * @param {string} topic - Topic to send request to
   * @param {Object} request - Request message
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response message
   */
  async request(topic, request, options = {}) {
    return this._provider.request(topic, request, options);
  }

  /**
   * Create queue
   * @param {string} queueName - Queue name
   * @param {Object} options - Queue options
   * @returns {Promise<void>}
   */
  async createQueue(queueName, options = {}) {
    return this._provider.createQueue(queueName, options);
  }

  /**
   * Delete queue
   * @param {string} queueName - Queue name
   * @returns {Promise<void>}
   */
  async deleteQueue(queueName) {
    return this._provider.deleteQueue(queueName);
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
    return `messaging.${providerName.toLowerCase()}`;
  }
}

/**
 * Messaging Provider Interface
 * 
 * All messaging providers must implement this interface.
 */
class MessagingProvider {
  async publish(topic, message, options) {
    throw new Error('publish() must be implemented');
  }

  async subscribe(topic, callback, options) {
    throw new Error('subscribe() must be implemented');
  }

  async unsubscribe(subscription) {
    throw new Error('unsubscribe() must be implemented');
  }

  async request(topic, request, options) {
    throw new Error('request() must be implemented');
  }

  async createQueue(queueName, options) {
    throw new Error('createQueue() must be implemented');
  }

  async deleteQueue(queueName) {
    throw new Error('deleteQueue() must be implemented');
  }
}

module.exports = {
  MessagingPort,
  MessagingProvider
};
