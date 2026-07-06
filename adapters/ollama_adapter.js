/**
 * Ollama Adapter
 * 
 * Infrastructure adapter for Ollama API
 * 
 * Responsibilities:
 * - generate(text, model, options)
 * - embed(text, model)
 * - health()
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class OllamaAdapter {
  constructor(baseUrl = 'http://localhost:11434') {
    this._baseUrl = baseUrl;
  }

  /**
   * Generate text completion
   * 
   * @param {string} prompt - Text prompt
   * @param {string} model - Model name
   * @param {Object} options - Generation options
   * @returns {Object} Generation response
   */
  async generate(prompt, model, options = {}) {
    const response = await fetch(`${this._baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama generate failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate embeddings
   * 
   * @param {string} text - Text to embed
   * @param {string} model - Model name
   * @returns {Object} Embedding response
   */
  async embed(text, model) {
    const response = await fetch(`${this._baseUrl}/api/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embed failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check health
   * 
   * @returns {Object} Health status
   */
  async health() {
    try {
      const response = await fetch(`${this._baseUrl}/api/tags`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          models: data.models || [],
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

  /**
   * List available models
   * 
   * @returns {Array} Available models
   */
  async listModels() {
    const response = await fetch(`${this._baseUrl}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama list models failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.models || [];
  }

  /**
   * Get model info
   * 
   * @param {string} model - Model name
   * @returns {Object} Model info
   */
  async getModelInfo(model) {
    const response = await fetch(`${this._baseUrl}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: model,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama get model info failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

module.exports = { OllamaAdapter };
