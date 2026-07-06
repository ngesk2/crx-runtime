/**
 * Model Registry
 * 
 * Fix 3.1 — Model Registry
 * 
 * Pipeline:
 * Mission → Requirements → Registry → Model → Provider
 * 
 * Enables automatic provider switching:
 * - Ollama
 * - vLLM
 * - OpenAI
 * - Anthropic
 * - DeepSeek
 * - Kimi
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class ModelRegistry {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._providers = new Map(); // provider_id → provider instance
    this._models = new Map(); // model_id → model descriptor
    this._requirements = new Map(); // requirement_id → model requirements
  }

  /**
   * Initialize model registry
   */
  async initialize() {
    console.log('[ModelRegistry] Initializing model registry');

    // Load model descriptors
    await this._loadModelDescriptors();

    // Load requirement mappings
    await this._loadRequirementMappings();

    console.log('[ModelRegistry] Model registry initialized');
  }

  /**
   * Register provider
   * 
   * @param {string} providerId - Provider identifier
   * @param {Object} provider - Provider instance
   */
  registerProvider(providerId, provider) {
    console.log(`[ModelRegistry] Registering provider: ${providerId}`);
    this._providers.set(providerId, provider);
  }

  /**
   * Register model
   * 
   * @param {Object} modelDescriptor - Model descriptor
   */
  registerModel(modelDescriptor) {
    console.log(`[ModelRegistry] Registering model: ${modelDescriptor.model_id}`);
    this._models.set(modelDescriptor.model_id, modelDescriptor);
  }

  /**
   * Register requirement mapping
   * 
   * @param {string} requirementId - Requirement identifier
   * @param {string} modelId - Model identifier
   */
  registerRequirement(requirementId, modelId) {
    console.log(`[ModelRegistry] Registering requirement: ${requirementId} → ${modelId}`);
    this._requirements.set(requirementId, modelId);
  }

  /**
   * Select model for mission
   * 
   * @param {Object} mission - Mission descriptor
   * @returns {Object} Model selection
   */
  async selectModel(mission) {
    console.log(`[ModelRegistry] Selecting model for mission: ${mission.mission_id}`);

    // Get mission requirements
    const requirements = mission.requirements || {};

    // Find matching model
    const modelId = await this._findMatchingModel(requirements);
    
    if (!modelId) {
      throw new Error('No model found matching mission requirements');
    }

    const model = this._models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Get provider
    const provider = this._providers.get(model.provider_id);
    if (!provider) {
      throw new Error(`Provider not found: ${model.provider_id}`);
    }

    return {
      model_id: model.model_id,
      model_name: model.name,
      provider_id: model.provider_id,
      provider: provider,
      capabilities: model.capabilities,
    };
  }

  /**
   * Find matching model for requirements
   */
  async _findMatchingModel(requirements) {
    const requiredCapabilities = requirements.capabilities || [];
    const minContextWindow = requirements.context_window || 0;
    const maxTokens = requirements.max_tokens || 0;
    const supportsEmbedding = requirements.supports_embedding || false;
    const supportsTools = requirements.supports_tools || false;
    const supportsStreaming = requirements.supports_streaming || false;

    // Find models that match all requirements
    for (const [modelId, model] of this._models) {
      const provider = this._providers.get(model.provider_id);
      if (!provider) continue;

      // Check provider health
      const health = await provider.health();
      if (!health.healthy) continue;

      // Check capabilities
      const hasAllCapabilities = requiredCapabilities.every(cap => 
        model.capabilities.includes(cap)
      );

      if (!hasAllCapabilities) continue;

      // Check context window
      if (model.context_window < minContextWindow) continue;

      // Check max tokens
      if (model.max_tokens < maxTokens) continue;

      // Check embedding support
      if (supportsEmbedding && !model.supports_embedding) continue;

      // Check tool support
      if (supportsTools && !model.supports_tools) continue;

      // Check streaming support
      if (supportsStreaming && !model.supports_streaming) continue;

      return modelId;
    }

    return null;
  }

  /**
   * Load model descriptors
   */
  async _loadModelDescriptors() {
    // Load default models if database is empty
    if (this._models.size === 0) {
      await this._loadDefaultModels();
    }
  }

  /**
   * Load default models
   */
  async _loadDefaultModels() {
    const defaultModels = [
      {
        model_id: 'llama2-7b',
        name: 'Llama 2 7B',
        provider_id: 'ollama',
        context_window: 4096,
        max_tokens: 4096,
        capabilities: ['chat', 'completion'],
        supports_embedding: false,
        supports_tools: true,
        supports_streaming: true,
      },
      {
        model_id: 'llama2-13b',
        name: 'Llama 2 13B',
        provider_id: 'ollama',
        context_window: 4096,
        max_tokens: 4096,
        capabilities: ['chat', 'completion'],
        supports_embedding: false,
        supports_tools: true,
        supports_streaming: true,
      },
      {
        model_id: 'nomic-embed-text',
        name: 'Nomic Embed Text',
        provider_id: 'ollama',
        context_window: 8192,
        max_tokens: 8192,
        capabilities: ['embedding'],
        supports_embedding: true,
        supports_tools: false,
        supports_streaming: false,
      },
    ];

    for (const model of defaultModels) {
      this.registerModel(model);
    }

    console.log(`[ModelRegistry] Loaded ${defaultModels.length} default models`);
  }

  /**
   * Load requirement mappings
   */
  async _loadRequirementMappings() {
    // Load default requirement mappings
    if (this._requirements.size === 0) {
      await this._loadDefaultRequirements();
    }
  }

  /**
   * Load default requirements
   */
  async _loadDefaultRequirements() {
    const defaultRequirements = [
      {
        requirement_id: 'chat-default',
        model_id: 'llama2-7b',
      },
      {
        requirement_id: 'chat-high-quality',
        model_id: 'llama2-13b',
      },
      {
        requirement_id: 'embedding-default',
        model_id: 'nomic-embed-text',
      },
    ];

    for (const req of defaultRequirements) {
      this.registerRequirement(req.requirement_id, req.model_id);
    }

    console.log(`[ModelRegistry] Loaded ${defaultRequirements.length} default requirement mappings`);
  }

  /**
   * List all models
   * 
   * @returns {Array} Model descriptors
   */
  listModels() {
    return Array.from(this._models.values());
  }

  /**
   * List all providers
   * 
   * @returns {Array} Provider IDs
   */
  listProviders() {
    return Array.from(this._providers.keys());
  }

  /**
   * Get model by ID
   * 
   * @param {string} modelId - Model identifier
   * @returns {Object} Model descriptor
   */
  getModel(modelId) {
    return this._models.get(modelId);
  }

  /**
   * Get provider by ID
   * 
   * @param {string} providerId - Provider identifier
   * @returns {Object} Provider instance
   */
  getProvider(providerId) {
    return this._providers.get(providerId);
  }

  /**
   * Check health
   */
  async health() {
    const providerHealths = {};

    for (const [providerId, provider] of this._providers) {
      try {
        const health = await provider.health();
        providerHealths[providerId] = health;
      } catch (error) {
        providerHealths[providerId] = {
          healthy: false,
          message: error.message,
        };
      }
    }

    const allHealthy = Object.values(providerHealths).every(h => h.healthy);

    return {
      healthy: allHealthy,
      providers: providerHealths,
      total_models: this._models.size,
      total_providers: this._providers.size,
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'model-registry',
      authority_name: 'ModelRegistry',
      version: '1.0.0',
      consumes: ['mission', 'requirements'],
      produces: ['model_selection', 'provider'],
      requires: ['providers'],
      guarantees: ['automatic_provider_selection', 'requirement_matching'],
      failure_modes: ['no_matching_model', 'provider_unavailable'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ModelRegistry };
