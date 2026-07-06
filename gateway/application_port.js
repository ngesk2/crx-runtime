/**
 * Application Port
 *
 * Phase 2.7.11 — Constitutional Boundary Collapse
 *
 * Port interface for application operations.
 *
 * Constitutional Constraint:
 * - Express becomes transport only
 * - Routes delegate to this port
 * - Port delegates to authorities
 */

class ApplicationPort {
  /**
   * Get health status
   * @returns {Promise<Object>} Health status
   */
  async getHealth() {
    throw new Error('ApplicationPort.getHealth must be implemented by adapter');
  }

  /**
   * Get stats
   * @returns {Promise<Object>} Stats
   */
  async getStats() {
    throw new Error('ApplicationPort.getStats must be implemented by adapter');
  }

  /**
   * Chat endpoint (RAG)
   * @param {Object} request - Chat request
   * @returns {Promise<Object>} Chat response
   */
  async chat(request) {
    throw new Error('ApplicationPort.chat must be implemented by adapter');
  }

  /**
   * Ingest endpoint
   * @param {Object} request - Ingest request
   * @returns {Promise<Object>} Ingest response
   */
  async ingest(request) {
    throw new Error('ApplicationPort.ingest must be implemented by adapter');
  }

  /**
   * Backup endpoint
   * @returns {Promise<Object>} Backup response
   */
  async backup() {
    throw new Error('ApplicationPort.backup must be implemented by adapter');
  }
}

module.exports = { ApplicationPort };
