/**
 * Ollama Provider Adapter
 * 
 * Phase 1.2 — Ollama Adapter
 * Phase 36F: Entropy Sealing - Use constitutional authorities
 * 
 * Implements Provider Interface for Ollama.
 * 
 * Ollama API:
 * - POST /api/generate
 * - POST /api/embed
 * - GET /api/tags
 * - GET /api/version
 */

const { ProviderInterface, GenerationRequest, GenerationResponse, EmbeddingResponse, HealthStatus, ModelInfo } = require('./provider_interface');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class OllamaProvider extends ProviderInterface {
  constructor(baseUrl = 'http://localhost:11434') {
    super();
    this._baseUrl = baseUrl;
  }

  /**
   * Generate completion
   */
  async generate(request) {
    console.log(`[OllamaProvider] Generating with model: ${request.model}`);

    const startTime = constitutionalTimeAuthority.nowAsMillis();

    try {
      // Use messages format if available, otherwise use prompt
      const body = request.messages && request.messages.length > 0 
        ? {
            model: request.model,
            messages: request.messages,
            stream: false,
            options: {
              temperature: request.temperature,
              num_predict: request.maxTokens,
              top_p: request.topP,
              frequency_penalty: request.frequencyPenalty,
              presence_penalty: request.presencePenalty,
              stop: request.stop,
            },
          }
        : {
            model: request.model,
            prompt: request.prompt,
            stream: false,
            options: {
              temperature: request.temperature,
              num_predict: request.maxTokens,
              top_p: request.topP,
              frequency_penalty: request.frequencyPenalty,
              presence_penalty: request.presencePenalty,
              stop: request.stop,
            },
          };

      const response = await fetch(`${this._baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      const latency = constitutionalTimeAuthority.nowAsMillis() - startTime;

      const generationResponse = new GenerationResponse();
      generationResponse.id = this._generateId();
      generationResponse.model = request.model;
      generationResponse.content = data.response;
      generationResponse.finishReason = data.done ? 'stop' : 'length';
      generationResponse.usage = {
        promptTokens: data.prompt_eval_count || 0,
        completionTokens: data.eval_count || 0,
        totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      };
      generationResponse.metrics = {
        latency: latency,
        tokensPerSecond: data.eval_count ? (data.eval_count / (latency / 1000)) : 0,
      };
      generationResponse.timestamp = constitutionalTimeAuthority.now();

      console.log(`[OllamaProvider] Generation complete: ${generationResponse.usage.totalTokens} tokens in ${latency}ms`);
      return generationResponse;
    } catch (error) {
      console.error('[OllamaProvider] Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate embedding
   */
  async embed(text) {
    console.log('[OllamaProvider] Generating embedding');

    try {
      const response = await fetch(`${this._baseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          input: text,
        }),
      });

      const data = await response.json();

      const embeddingResponse = new EmbeddingResponse();
      embeddingResponse.id = this._generateId();
      embeddingResponse.model = 'nomic-embed-text';
      embeddingResponse.embedding = data.embedding;
      embeddingResponse.dimension = data.embedding.length;
      embeddingResponse.timestamp = constitutionalTimeAuthority.now();

      console.log(`[OllamaProvider] Embedding complete: ${embeddingResponse.dimension} dimensions`);
      return embeddingResponse;
    } catch (error) {
      console.error('[OllamaProvider] Embedding failed:', error.message);
      throw error;
    }
  }

  /**
   * Check provider health
   */
  async health() {
    try {
      const startTime = constitutionalTimeAuthority.nowAsMillis();
      const response = await fetch(`${this._baseUrl}/api/version`);
      const data = await response.json();
      const latency = constitutionalTimeAuthority.nowAsMillis() - startTime;

      const healthStatus = new HealthStatus();
      healthStatus.healthy = true;
      healthStatus.message = 'Ollama is running';
      healthStatus.latency = latency;
      healthStatus.version = data.version || 'unknown';

      return healthStatus;
    } catch (error) {
      const healthStatus = new HealthStatus();
      healthStatus.healthy = false;
      healthStatus.message = `Ollama health check failed: ${error.message}`;
      healthStatus.latency = 0;
      healthStatus.version = 'unknown';

      return healthStatus;
    }
  }

  /**
   * Get provider information
   * Returns provider identity for constitutional artifact provenance
   */
  async getInfo() {
    try {
      const versionResponse = await fetch(`${this._baseUrl}/api/version`);
      const versionData = await versionResponse.json();

      const tagsResponse = await fetch(`${this._baseUrl}/api/tags`);
      const tagsData = await tagsResponse.json();

      // Get first embedding model as default
      const embeddingModel = tagsData.models.find(m => m.name.includes('embed')) || tagsData.models[0];

      return {
        provider_id: 'ollama',
        version: versionData.version || 'unknown',
        model: embeddingModel?.name || 'nomic-embed-text',
        model_digest: embeddingModel?.digest || 'unknown',
        base_url: this._baseUrl,
      };
    } catch (error) {
      // Fallback to defaults if API is unavailable
      return {
        provider_id: 'ollama',
        version: 'unknown',
        model: 'nomic-embed-text',
        model_digest: 'unknown',
        base_url: this._baseUrl,
      };
    }
  }

  /**
   * List available models
   */
  async listModels() {
    try {
      const response = await fetch(`${this._baseUrl}/api/tags`);
      const data = await response.json();

      return data.models.map(model => {
        const modelInfo = new ModelInfo();
        modelInfo.id = model.name;
        modelInfo.name = model.name;
        modelInfo.provider = 'ollama';
        modelInfo.contextWindow = model.details?.context_length || 2048;
        modelInfo.maxTokens = model.details?.context_length || 2048;
        modelInfo.supportsEmbedding = model.name.includes('embed');
        modelInfo.supportsTools = true; // Ollama supports tools
        modelInfo.supportsStreaming = true; // Ollama supports streaming
        return modelInfo;
      });
    } catch (error) {
      console.error('[OllamaProvider] Failed to list models:', error.message);
      return [];
    }
  }

  /**
   * Generate streaming completion
   */
  async generateStream(request, onToken) {
    console.log(`[OllamaProvider] Generating stream with model: ${request.model}`);

    const startTime = Date.now();
    let totalTokens = 0;

    try {
      // Use messages format if available, otherwise use prompt
      const body = request.messages && request.messages.length > 0 
        ? {
            model: request.model,
            messages: request.messages,
            stream: true,
            options: {
              temperature: request.temperature,
              num_predict: request.maxTokens,
              top_p: request.topP,
              frequency_penalty: request.frequencyPenalty,
              presence_penalty: request.presencePenalty,
              stop: request.stop,
            },
          }
        : {
            model: request.model,
            prompt: request.prompt,
            stream: true,
            options: {
              temperature: request.temperature,
              num_predict: request.maxTokens,
              top_p: request.topP,
              frequency_penalty: request.frequencyPenalty,
              presence_penalty: request.presencePenalty,
              stop: request.stop,
            },
          };

      const response = await fetch(`${this._baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Stream response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullContent += data.response;
              totalTokens++;
              if (onToken) {
                onToken(data.response);
              }
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      const latency = Date.now() - startTime;

      const generationResponse = new GenerationResponse();
      generationResponse.id = this._generateId();
      generationResponse.model = request.model;
      generationResponse.content = fullContent;
      generationResponse.finishReason = 'stop';
      generationResponse.usage = {
        promptTokens: 0, // Ollama doesn't provide prompt tokens in stream
        completionTokens: totalTokens,
        totalTokens: totalTokens,
      };
      generationResponse.metrics = {
        latency: latency,
        tokensPerSecond: totalTokens / (latency / 1000),
      };
      generationResponse.timestamp = new Date().toISOString();

      console.log(`[OllamaProvider] Stream complete: ${totalTokens} tokens in ${latency}ms`);
      return generationResponse;
    } catch (error) {
      console.error('[OllamaProvider] Stream generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate ID
   * Phase 36F: Use constitutional authorities for ID generation
   */
  _generateId() {
    const data = {
      provider: 'ollama',
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority_version: '1.0.0'
    };
    const hash = CanonicalAuthority.hash(data);
    return `ollama_${hash.substring(0, 16)}`;
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'ollama-provider',
      authority_name: 'OllamaProvider',
      version: '1.0.0',
      consumes: ['GenerationRequest', 'text'],
      produces: ['GenerationResponse', 'EmbeddingResponse'],
      requires: ['ollama'],
      guarantees: ['streaming', 'embeddings', 'tools'],
      failure_modes: ['ollama_unavailable', 'model_not_found'],
      rollback: 'none',
      determinism: 'non_deterministic',
    };
  }
}

module.exports = { OllamaProvider };
