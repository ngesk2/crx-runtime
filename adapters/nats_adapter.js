/**
 * NATS Adapter
 * 
 * Infrastructure adapter for NATS JetStream
 * 
 * Responsibilities:
 * - publish(subject, message)
 * - subscribe(subject, callback)
 * - stream(streamName, config)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class NATSAdapter {
  constructor(url = 'nats://localhost:4222') {
    this._url = url;
    this._nc = null;
    this._js = null;
  }

  /**
   * Initialize NATS connection
   */
  async initialize() {
    const { connect } = require('nats');
    
    this._nc = await connect({ servers: this._url });
    this._js = this._nc.jetstream();
    
    console.log('[NATSAdapter] Connected to NATS');
  }

  /**
   * Publish message
   * 
   * @param {string} subject - Subject to publish to
   * @param {Object} message - Message to publish
   * @returns {Object} Publish result
   */
  async publish(subject, message) {
    try {
      const data = JSON.stringify(message);
      await this._nc.publish(subject, data);
      
      return {
        success: true,
        subject: subject,
      };
    } catch (error) {
      throw new Error(`NATS publish failed: ${error.message}`);
    }
  }

  /**
   * Subscribe to subject
   * 
   * @param {string} subject - Subject to subscribe to
   * @param {Function} callback - Callback function
   * @returns {Object} Subscription
   */
  async subscribe(subject, callback) {
    try {
      const sub = this._nc.subscribe(subject);
      
      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(msg.data);
            await callback(data, msg);
          } catch (error) {
            console.error('[NATSAdapter] Message processing error:', error.message);
          }
        }
      })();

      return sub;
    } catch (error) {
      throw new Error(`NATS subscribe failed: ${error.message}`);
    }
  }

  /**
   * Create or get stream
   * 
   * @param {string} streamName - Stream name
   * @param {Object} config - Stream configuration
   * @returns {Object} Stream info
   */
  async stream(streamName, config = {}) {
    try {
      const streamConfig = {
        name: streamName,
        subjects: [`${streamName}.>`],
        ...config,
      };

      try {
        await this._js.streams.add(streamConfig);
      } catch (error) {
        // Stream might already exist
        if (!error.message.includes('stream name already in use')) {
          throw error;
        }
      }

      const streamInfo = await this._js.streams.info(streamName);
      return streamInfo;
    } catch (error) {
      throw new Error(`NATS stream failed: ${error.message}`);
    }
  }

  /**
   * Publish to stream
   * 
   * @param {string} streamName - Stream name
   * @param {string} subject - Subject
   * @param {Object} message - Message
   * @returns {Object} Publish result
   */
  async publishToStream(streamName, subject, message) {
    try {
      const data = JSON.stringify(message);
      const ack = await this._js.publish(subject, data);
      
      return {
        success: true,
        stream: streamName,
        subject: subject,
        seq: ack.seq,
      };
    } catch (error) {
      throw new Error(`NATS publish to stream failed: ${error.message}`);
    }
  }

  /**
   * Create consumer
   * 
   * @param {string} streamName - Stream name
   * @param {string} consumerName - Consumer name
   * @param {Object} config - Consumer configuration
   * @returns {Object} Consumer info
   */
  async createConsumer(streamName, consumerName, config = {}) {
    try {
      const consumerConfig = {
        name: consumerName,
        ack_policy: 'explicit',
        ...config,
      };

      await this._js.consumers.add(streamName, consumerConfig);
      
      const consumerInfo = await this._js.consumers.info(streamName, consumerName);
      return consumerInfo;
    } catch (error) {
      throw new Error(`NATS create consumer failed: ${error.message}`);
    }
  }

  /**
   * Consume from stream
   * 
   * @param {string} streamName - Stream name
   * @param {string} consumerName - Consumer name
   * @param {Function} callback - Callback function
   */
  async consume(streamName, consumerName, callback) {
    try {
      const consumer = await this._js.consumers.get(streamName, consumerName);
      
      (async () => {
        for await (const msg of consumer) {
          try {
            const data = JSON.parse(msg.data);
            await callback(data, msg);
            msg.ack();
          } catch (error) {
            console.error('[NATSAdapter] Message processing error:', error.message);
            msg.nak();
          }
        }
      })();
    } catch (error) {
      throw new Error(`NATS consume failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      if (!this._nc) {
        return {
          healthy: false,
          error: 'Not connected',
        };
      }

      const status = this._nc.status;
      
      return {
        healthy: status.type === 'WebSocket' || status.type === 'TCP',
        type: status.type,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this._nc) {
      await this._nc.close();
      console.log('[NATSAdapter] Closed NATS connection');
    }
  }
}

module.exports = { NATSAdapter };
