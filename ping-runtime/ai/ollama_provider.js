/**
 * Ollama Provider — AI Runtime v1
 * 
 * Wraps existing inference_adapter.js into the AI Runtime provider interface.
 * This is how PING routes AI calls through the unified runtime.
 */

class OllamaProvider {
  /**
   * @param {object} options
   * @param {string} options.baseUrl — Ollama API URL (default: http://ping-ollama:11434)
   * @param {string} options.defaultModel — default model name
   */
  constructor(options = {}) {
    this._baseUrl = options.baseUrl || process.env.INFERENCE_BASE_URL || 'http://localhost:11434';
    this._defaultModel = options.defaultModel || 'qwen2.5-coder:7b';
  }

  /**
   * Chat completion.
   */
  async chat(prompt, options = {}) {
    const model = options.model || this._defaultModel;
    const response = await fetch(`${this._baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 4096,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama chat failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.response,
      model: data.model,
      tokens: { prompt: data.prompt_eval_count, completion: data.eval_count },
    };
  }

  /**
   * Generate embedding.
   */
  async embed(text, options = {}) {
    const model = options.model || 'nomic-embed-text';
    const response = await fetch(`${this._baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embed failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      embedding: data.embedding,
      model: data.model,
      dimensions: data.embedding.length,
    };
  }

  /**
   * Health check.
   */
  async health() {
    try {
      const response = await fetch(`${this._baseUrl}/api/tags`, { method: 'GET' });
      if (!response.ok) {
        return { status: 'error', error: `HTTP ${response.status}` };
      }
      const data = await response.json();
      return {
        status: 'healthy',
        models: (data.models || []).map(m => m.name),
        url: this._baseUrl,
      };
    } catch (err) {
      return { status: 'error', error: err.message, url: this._baseUrl };
    }
  }
}

module.exports = { OllamaProvider };
