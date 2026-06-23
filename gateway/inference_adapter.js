/**
 * Inference Adapter - Single Constitutional Authority (Node.js)
 * 
 * Constitutional Law: Exactly one inference authority may exist.
 * Adapters are allowed. Competing authorities are forbidden.
 * 
 * This is the SINGLE inference authority for CRX.
 * All inference must flow through this adapter.
 * Provider adapters (Ollama, vLLM) are subordinate to this authority.
 * 
 * Architecture:
 *   Business Logic → Inference Adapter → Provider Adapter → Provider
 *   (Gateway) → (THIS FILE) → (Ollama/vLLM) → (Ollama/vLLM API)
 */

const ProviderType = {
  OLLAMA: 'ollama',
  OPENAI: 'openai'
};

// Configuration
const INFERENCE_PROVIDER = process.env.INFERENCE_PROVIDER || 'ollama';
const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://localhost:11434';
const DEFAULT_EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text';
const DEFAULT_CHAT_MODEL = process.env.CHAT_MODEL || 'llama3';

class InferenceAdapter {
  constructor(
    provider = INFERENCE_PROVIDER,
    baseUrl = INFERENCE_BASE_URL,
    embeddingModel = DEFAULT_EMBEDDING_MODEL,
    chatModel = DEFAULT_CHAT_MODEL
  ) {
    this.provider = provider;
    this.baseUrl = baseUrl;
    this.embeddingModel = embeddingModel;
    this.chatModel = chatModel;
    
    // Initialize provider adapter
    if (this.provider === ProviderType.OLLAMA) {
      const { OllamaProviderAdapter } = require('./ollama_provider_adapter');
      this.providerAdapter = new OllamaProviderAdapter(baseUrl, embeddingModel, chatModel);
    } else if (this.provider === ProviderType.OPENAI) {
      const { OpenAIProviderAdapter } = require('./openai_provider_adapter');
      this.providerAdapter = new OpenAIProviderAdapter(baseUrl, embeddingModel, chatModel);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }
  }
  
  async embed(text) {
    /**
     * Generate embedding for text.
     * 
     * Constitutional Constraint: This is the ONLY authority for embedding generation.
     */
    return this.providerAdapter.embed(text);
  }
  
  async chat(messages, options = null) {
    /**
     * Generate chat completion.
     * 
     * Constitutional Constraint: This is the ONLY authority for chat completion.
     */
    return this.providerAdapter.chat(messages, options);
  }
  
  async health() {
    return this.providerAdapter.health();
  }
  
  async modelCapability(model, capability) {
    return this.providerAdapter.modelCapability(model, capability);
  }
}

// Singleton instance
let _inferenceInstance = null;

function getInferenceAdapter() {
  if (_inferenceInstance === null) {
    _inferenceInstance = new InferenceAdapter();
  }
  return _inferenceInstance;
}

module.exports = { InferenceAdapter, getInferenceAdapter, ProviderType };
