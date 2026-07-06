/**
 * Provider Interface
 * 
 * Phase 1.1 — Provider Interface
 * 
 * All LLM providers must implement this interface:
 * 
 * interface Provider {
 *   generate(request): Response
 *   embed(text): Vector
 *   health(): HealthStatus
 *   listModels(): Model[]
 * }
 * 
 * Provider adapters:
 * - Ollama
 * - vLLM
 * - OpenAI
 * - Anthropic
 * - DeepSeek
 * - Kimi
 * 
 * Everything above this interface becomes provider-independent.
 */

class ProviderInterface {
  /**
   * Generate completion
   * 
   * @param {Object} request - Generation request
   * @returns {Object} Response
   */
  async generate(request) {
    throw new Error('generate() must be implemented by provider adapter');
  }

  /**
   * Generate embedding
   * 
   * @param {string} text - Text to embed
   * @returns {Array} Vector
   */
  async embed(text) {
    throw new Error('embed() must be implemented by provider adapter');
  }

  /**
   * Check provider health
   * 
   * @returns {Object} Health status
   */
  async health() {
    throw new Error('health() must be implemented by provider adapter');
  }

  /**
   * List available models
   * 
   * @returns {Array} Models
   */
  async listModels() {
    throw new Error('listModels() must be implemented by provider adapter');
  }

  /**
   * Generate streaming completion
   * 
   * @param {Object} request - Generation request
   * @param {Function} onToken - Token callback
   * @returns {Object} Response
   */
  async generateStream(request, onToken) {
    throw new Error('generateStream() must be implemented by provider adapter');
  }
}

/**
 * Generation request structure
 */
class GenerationRequest {
  constructor(model, prompt, options = {}) {
    this.model = model;
    this.prompt = prompt;
    this.messages = options.messages || [];
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 2048;
    this.topP = options.topP || 0.9;
    this.frequencyPenalty = options.frequencyPenalty || 0;
    this.presencePenalty = options.presencePenalty || 0;
    this.stop = options.stop || [];
    this.tools = options.tools || [];
    this.context = options.context || [];
  }
}

/**
 * Generation response structure
 */
class GenerationResponse {
  constructor() {
    this.id = null;
    this.model = null;
    this.content = null;
    this.finishReason = null;
    this.usage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
    this.toolCalls = [];
    this.metrics = {
      latency: 0,
      tokensPerSecond: 0,
    };
    this.timestamp = null;
  }
}

/**
 * Embedding response structure
 */
class EmbeddingResponse {
  constructor() {
    this.id = null;
    this.model = null;
    this.embedding = [];
    this.dimension = 0;
    this.timestamp = null;
  }
}

/**
 * Health status structure
 */
class HealthStatus {
  constructor() {
    this.healthy = false;
    this.message = '';
    this.latency = 0;
    this.version = '';
  }
}

/**
 * Model information structure
 */
class ModelInfo {
  constructor() {
    this.id = '';
    this.name = '';
    this.provider = '';
    this.contextWindow = 0;
    this.maxTokens = 0;
    this.supportsEmbedding = false;
    this.supportsTools = false;
    this.supportsStreaming = false;
  }
}

module.exports = {
  ProviderInterface,
  GenerationRequest,
  GenerationResponse,
  EmbeddingResponse,
  HealthStatus,
  ModelInfo,
};
