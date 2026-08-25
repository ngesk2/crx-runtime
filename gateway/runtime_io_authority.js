/**
 * Runtime I/O Authority
 * Records I/O operations for observability and provenance.
 *
 * PRESERVED: constitutional-convergence 563a4113 (EXACTLY_INTEGRATE)
 * Imported by: gateway/ollama_adapter.js, gateway/tool_gateway.js (dormant)
 */

class RuntimeIOAuthority {
  constructor() {
    this._nextId = 1;
  }

  /**
   * Record an HTTP/I/O operation.
   * @param {string} url - The URL or endpoint being accessed.
   * @param {string} method - The HTTP method (e.g., 'GET', 'POST').
   * @returns {Object} An operation record containing url, method, and a unique identifier.
   */
  recordHTTPRequest(url, method) {
    const id = this._nextId++;
    return { url, method, id };
  }
}

// Singleton instance
const runtimeIOAuthority = new RuntimeIOAuthority();

module.exports = {
  RuntimeIOAuthority,
  runtimeIOAuthority,
};
