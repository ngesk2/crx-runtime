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
const INFERENCE_BASE_URL = process.env.INFERENCE_BASE_URL || 'http://brain-ollama:11434';
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

  async analyze(knowledgeObjects, prompt, options = null) {
    /**
     * Analyze KnowledgeObjects and produce AnalysisObject.
     * 
     * Constitutional Constraint: InferenceAuthority must consume KnowledgeObjects only.
     * Constitutional Constraint: InferenceAuthority must NOT consume raw files or GitHub payloads.
     * Constitutional Constraint: Every analysis stores model, prompt hash, object IDs, evidence references, confidence, timestamp.
     */
    const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
    const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
    const { identityAuthority } = require('./identity_authority');
    
    if (!Array.isArray(knowledgeObjects) || knowledgeObjects.length === 0) {
      throw new Error('InferenceAuthority.analyze requires at least one KnowledgeObject');
    }
    
    // Validate inputs are KnowledgeObjects
    for (const obj of knowledgeObjects) {
      if (!obj.id || !obj.kind || !obj.payload) {
        throw new Error('Invalid KnowledgeObject: missing id, kind, or payload');
      }
    }
    
    // Build analysis prompt from KnowledgeObjects
    const context = knowledgeObjects.map(obj => ({
      id: obj.id,
      kind: obj.kind,
      payload: obj.payload,
    }));
    
    const analysisPrompt = CanonicalBytes.serialize({
      context,
      prompt,
    });
    
    // Generate prompt hash for replayability
    const promptHash = CanonicalAuthority.hash(analysisPrompt);
    
    // Execute inference
    const messages = [
      { role: 'system', content: 'You are a constitutional analysis engine. Analyze the provided KnowledgeObjects and respond with structured analysis.' },
      { role: 'user', content: analysisPrompt },
    ];
    
    const response = await this.chat(messages, options);
    
    // Create AnalysisObject
    const analysisId = identityAuthority.generateId('analysis', {
      namespace: 'inference',
      prompt_hash: promptHash,
      knowledge_ids: knowledgeObjects.map(obj => obj.id)
    });
    const timestamp = constitutionalTimeAuthority.now();
    
    const analysisObject = {
      id: analysisId,
      kind: 'Analysis',
      authority: 'InferenceAuthority',
      identity: {
        namespace: 'inference',
        version: 'v1',
        created_at: timestamp,
        created_by: 'InferenceAdapter',
      },
      canonical_hash: CanonicalAuthority.hash(response),
      lineage: {
        source_id: knowledgeObjects[0].id,
        derivation_path: ['KnowledgeObject', 'InferenceAuthority', 'AnalysisObject'],
        provenance_chain: knowledgeObjects.map(obj => obj.id),
      },
      health: 'healthy',
      confidence: 0.8,
      relationships: knowledgeObjects.map(obj => ({
        target_id: obj.id,
        relation_type: 'analyzes',
        strength: 1.0,
        metadata: {},
      })),
      metadata: {
        model: this.chatModel,
        provider: this.provider,
      },
      payload: {
        model: this.chatModel,
        prompt_hash: promptHash,
        object_ids: knowledgeObjects.map(obj => obj.id),
        evidence_references: knowledgeObjects.map(obj => obj.id),
        confidence: 0.8,
        timestamp,
        result: response,
      },
    };
    
    return analysisObject;
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
