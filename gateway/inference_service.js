/**
 * Inference Service (stub)
 * Inference service via Ollama.
 */
class InferenceService {
  constructor(config = {}) {
    this._config = config;
  }
  async initialize() {}
  async health() { return { healthy: true }; }
}
module.exports = { InferenceService };
