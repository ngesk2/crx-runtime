/**
 * Embedding Provider Abstraction
 * 
 * Phase 3 Refactor — Embedding Provider
 * 
 * Provider-agnostic embedding interface.
 * 
 * Supported providers:
 * - OpenAI compatible endpoint
 * - llama.cpp server
 * - Ollama
 * - vLLM (future)
 * 
 * Configuration:
 * config.embedding.provider
 * Default: llama.cpp
 */

class EmbeddingProvider {
  constructor(config = {}) {
    this._provider = config.provider || 'llamacpp';
    this._config = {
      baseURL: config.baseURL || 'http://localhost:8080',
      model: config.model || 'nomic-embed-text',
      timeout: config.timeout || 30000,
      batchSize: config.batchSize || 10
    };
  }

  /**
   * Embed single text
   */
  async embed(text) {
    switch (this._provider) {
      case 'openai':
        return this._embedOpenAI(text);
      case 'llamacpp':
        return this._embedLlamaCpp(text);
      case 'ollama':
        return this._embedOllama(text);
      default:
        throw new Error(`Unknown provider: ${this._provider}`);
    }
  }

  /**
   * Embed batch of texts
   */
  async embedBatch(texts) {
    const batchSize = this._config.batchSize;
    const results = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(text => this.embed(text))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Embed using OpenAI compatible endpoint
   */
  async _embedOpenAI(text) {
    const response = await fetch(`${this._config.baseURL}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this._config.model,
        input: text
      }),
      signal: AbortSignal.timeout(this._config.timeout)
    });

    if (!response.ok) {
      throw new Error(`OpenAI embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  /**
   * Embed using llama.cpp server
   */
  async _embedLlamaCpp(text) {
    const response = await fetch(`${this._config.baseURL}/embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text,
        model: this._config.model
      }),
      signal: AbortSignal.timeout(this._config.timeout)
    });

    if (!response.ok) {
      throw new Error(`llama.cpp embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * Embed using Ollama
   */
  async _embedOllama(text) {
    const response = await fetch(`${this._config.baseURL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this._config.model,
        prompt: text
      }),
      signal: AbortSignal.timeout(this._config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding;
  }

  /**
   * Health check
   */
  async health() {
    try {
      const response = await fetch(`${this._config.baseURL}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get provider info
   */
  getInfo() {
    return {
      provider: this._provider,
      baseURL: this._config.baseURL,
      model: this._config.model,
      timeout: this._config.timeout,
      batchSize: this._config.batchSize
    };
  }
}

module.exports = { EmbeddingProvider };
