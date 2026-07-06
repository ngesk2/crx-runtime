/**
 * Apache Tika Adapter
 * 
 * Infrastructure adapter for Apache Tika document extraction
 * 
 * Responsibilities:
 * - request(endpoint, file, options)
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 * Tika already implements the behavior.
 */

class TikaAdapter {
  constructor(serverUrl = 'http://localhost:9998') {
    this._serverUrl = serverUrl;
  }

  /**
   * Make request to Tika endpoint
   * 
   * @param {string} endpoint - Tika endpoint
   * @param {Buffer|string} file - File buffer or path
   * @param {Object} options - Request options
   * @returns {string|Object} Response
   */
  async request(endpoint, file, options = {}) {
    try {
      const formData = new FormData();
      
      if (Buffer.isBuffer(file)) {
        formData.append('file', new Blob([file]));
      } else {
        formData.append('file', file);
      }

      const response = await fetch(`${this._serverUrl}${endpoint}`, {
        method: 'PUT',
        body: formData,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`Tika request failed: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      throw new Error(`Tika request failed: ${error.message}`);
    }
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      const response = await fetch(`${this._serverUrl}/tika`);
      
      if (response.ok) {
        return {
          healthy: true,
        };
      }

      return {
        healthy: false,
        error: response.statusText,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

module.exports = { TikaAdapter };
