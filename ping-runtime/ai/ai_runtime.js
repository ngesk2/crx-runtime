/**
 * AI Runtime — PING Core v1
 * 
 * Universal model routing via LiteLLM pattern.
 * Adding a new model is configuration, not code.
 * 
 * Flow: Application → AI Runtime → Provider (Ollama/Claude/OpenAI/HF)
 * 
 * Desktop agents never select providers directly.
 * Everything flows through this runtime.
 */

class AIRuntime {
  constructor(options = {}) {
    this._providers = new Map();
    this._defaultProvider = options.defaultProvider || 'ollama';
    this._config = options.config || {};
  }

  /**
   * Register an AI provider.
   * @param {string} name — provider name (e.g., 'ollama', 'claude', 'openai')
   * @param {object} provider — must implement chat(), embed(), health()
   * @param {object} metadata — { models, defaultModel, maxTokens, capabilities }
   */
  registerProvider(name, provider, metadata = {}) {
    const required = ['chat', 'embed', 'health'];
    const missing = required.filter(m => typeof provider[m] !== 'function');
    if (missing.length > 0) {
      throw new Error(`Provider '${name}' missing: ${missing.join(', ')}`);
    }

    this._providers.set(name, {
      provider,
      metadata: {
        models: metadata.models || [],
        defaultModel: metadata.defaultModel || null,
        maxTokens: metadata.maxTokens || 4096,
        capabilities: metadata.capabilities || ['chat', 'embed'],
        costPerToken: metadata.costPerToken || null,
      },
    });
  }

  /**
   * Route a chat completion to the best provider.
   * @param {string} prompt — the prompt
   * @param {object} options — { model, provider, temperature, maxTokens }
   */
  async chat(prompt, options = {}) {
    const providerName = options.provider || this._defaultProvider;
    const entry = this._providers.get(providerName);
    if (!entry) {
      return { status: 'error', error: `Provider '${providerName}' not registered` };
    }

    try {
      const result = await entry.provider.chat(prompt, {
        model: options.model || entry.metadata.defaultModel,
        temperature: options.temperature,
        maxTokens: options.maxTokens || entry.metadata.maxTokens,
      });
      return { status: 'ok', provider: providerName, ...result };
    } catch (err) {
      return { status: 'error', provider: providerName, error: err.message };
    }
  }

  /**
   * Generate an embedding.
   * @param {string} text — text to embed
   * @param {object} options — { model, provider, dimensions }
   */
  async embed(text, options = {}) {
    const providerName = options.provider || this._defaultProvider;
    const entry = this._providers.get(providerName);
    if (!entry) {
      return { status: 'error', error: `Provider '${providerName}' not registered` };
    }

    try {
      const result = await entry.provider.embed(text, {
        model: options.model,
        dimensions: options.dimensions,
      });
      return { status: 'ok', provider: providerName, ...result };
    } catch (err) {
      return { status: 'error', provider: providerName, error: err.message };
    }
  }

  /**
   * Health check all providers.
   */
  async healthCheckAll() {
    const results = {};
    for (const [name, entry] of this._providers) {
      try {
        results[name] = await entry.provider.health();
      } catch (err) {
        results[name] = { status: 'error', error: err.message };
      }
    }
    return results;
  }

  /**
   * List all registered providers and models.
   */
  list() {
    const providers = {};
    for (const [name, entry] of this._providers) {
      providers[name] = {
        models: entry.metadata.models,
        defaultModel: entry.metadata.defaultModel,
        capabilities: entry.metadata.capabilities,
        maxTokens: entry.metadata.maxTokens,
      };
    }
    return { defaultProvider: this._defaultProvider, providers };
  }

  /**
   * Select best model for a task.
   * @param {object} requirements — { task, minTokens, preferProvider, preferLocal }
   */
  selectModel(requirements = {}) {
    // If provider specified, use it
    if (requirements.preferProvider && this._providers.has(requirements.preferProvider)) {
      const entry = this._providers.get(requirements.preferProvider);
      return {
        provider: requirements.preferProvider,
        model: entry.metadata.defaultModel,
      };
    }

    // If prefer local and ollama available, use it
    if (requirements.preferLocal && this._providers.has('ollama')) {
      const entry = this._providers.get('ollama');
      return { provider: 'ollama', model: entry.metadata.defaultModel };
    }

    // Default
    const entry = this._providers.get(this._defaultProvider);
    if (!entry) return null;
    return { provider: this._defaultProvider, model: entry.metadata.defaultModel };
  }
}

module.exports = { AIRuntime };
