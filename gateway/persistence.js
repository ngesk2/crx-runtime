/**
 * Persistence (stub)
 * File-based state persistence.
 */
class Persistence {
  constructor(config = {}) {
    this._config = config;
  }
  async initialize() {}
  async health() { return { healthy: true }; }
}
module.exports = { Persistence };
