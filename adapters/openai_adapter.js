/**
 * OpenAI Adapter
 * 
 * Infrastructure adapter for OpenAI-compatible APIs
 * 
 * Responsibilities:
 * - generate(text, model, options)
 * - embed(text, model)
 * - health()
 * 
 * This adapter is infrastructure-only. No constitutional logic.
 */

class OpenAIAdapter {
  constructor(apiKey, baseUrl = 'https://api.openai.com/v1') {
    this._apiKey = apiKey;
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
    const response = await fetch(`${this._baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        ...options,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI generate failed: ${response.statusText}`);
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
    const response = await fetch(`${this._baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this._apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embed failed: ${response.statusText}`);
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
      const response = await fetch(`${this._baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this._apiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          healthy: true,
          models: data.data || [],
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
    const response = await fetch(`${this._baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${this._apiKey}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI list models failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  }
}

module.exports = { OpenAIAdapter };
