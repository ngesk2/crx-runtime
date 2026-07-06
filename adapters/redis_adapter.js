/**
 * Redis Adapter
 * 
 * Infrastructure adapter for Redis cache
 * 
 * Responsibilities:
 * - get(key)
 * - set(key, value, ttl)
 * - delete(key)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class RedisAdapter {
  constructor(host = 'localhost', port = 6379) {
    this._host = host;
    this._port = port;
    this._client = null;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    const redis = require('redis');
    this._client = redis.createClient({
      socket: {
        host: this._host,
        port: this._port,
      },
    });

    await this._client.connect();
    console.log('[RedisAdapter] Connected to Redis');
  }

  /**
   * Get value by key
   * 
   * @param {string} key - Key to retrieve
   * @returns {string|null} Value
   */
  async get(key) {
    try {
      const value = await this._client.get(key);
      
      if (value === null) {
        return null;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      throw new Error(`Redis get failed: ${error.message}`);
    }
  }

  /**
   * Set value by key
   * 
   * @param {string} key - Key to set
   * @param {*} value - Value to set
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} Set success
   */
  async set(key, value, ttl = null) {
    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      
      if (ttl) {
        await this._client.setEx(key, ttl, serialized);
      } else {
        await this._client.set(key, serialized);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Redis set failed: ${error.message}`);
    }
  }

  /**
   * Delete key
   * 
   * @param {string} key - Key to delete
   * @returns {boolean} Delete success
   */
  async delete(key) {
    try {
      const result = await this._client.del(key);
      return result > 0;
    } catch (error) {
      throw new Error(`Redis delete failed: ${error.message}`);
    }
  }

  /**
   * Check if key exists
   * 
   * @param {string} key - Key to check
   * @returns {boolean} Key exists
   */
  async exists(key) {
    try {
      const result = await this._client.exists(key);
      return result > 0;
    } catch (error) {
      throw new Error(`Redis exists failed: ${error.message}`);
    }
  }

  /**
   * Set expiration on key
   * 
   * @param {string} key - Key to expire
   * @param {number} ttl - Time to live in seconds
   * @returns {boolean} Expire success
   */
  async expire(key, ttl) {
    try {
      const result = await this._client.expire(key, ttl);
      return result > 0;
    } catch (error) {
      throw new Error(`Redis expire failed: ${error.message}`);
    }
  }

  /**
   * Get all keys matching pattern
   * 
   * @param {string} pattern - Key pattern
   * @returns {Array} Matching keys
   */
  async keys(pattern) {
    try {
      const keys = await this._client.keys(pattern);
      return keys;
    } catch (error) {
      throw new Error(`Redis keys failed: ${error.message}`);
    }
  }

  /**
   * Delete multiple keys
   * 
   * @param {Array} keys - Keys to delete
   * @returns {number} Number of keys deleted
   */
  async deleteMultiple(keys) {
    try {
      const result = await this._client.del(keys);
      return result;
    } catch (error) {
      throw new Error(`Redis delete multiple failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      await this._client.ping();
      return {
        healthy: true,
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
    if (this._client) {
      await this._client.quit();
      console.log('[RedisAdapter] Closed Redis connection');
    }
  }
}

module.exports = { RedisAdapter };
