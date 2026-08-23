const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeIOAuthority } = require('./runtime_io_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');

/**
 * Ollama Adapter
 * 
 * Phase 4.1 — Ollama Adapter
 * 
 * Responsibilities:
 * - Call Ollama HTTP API
 * - Stream tokens
 * - Capture model metadata
 * - Record prompt hash
 * - Record completion hash
 * - Record model digest
 * - Produce constitutional witness
 */

class OllamaAdapter {
  constructor(config = {}) {
    this._ioAuthority = runtimeIOAuthority;
    this._failureAuthority = runtimeFailureAuthority;
    this._baseUrl = config.baseUrl || 'http://localhost:11434';
    this._timeout = config.timeout || 30000;
    this._inferenceHistory = new Map();
    this._adapterId = this._generateAdapterId();
  }

  /**
   * Generate completion
   * @param {Object} params - Generation parameters
   * @param {string} params.model - Model name
   * @param {string} params.prompt - Prompt text
   * @param {Object} params.options - Generation options (temperature, top_p, seed, etc.)
   * @param {boolean} params.stream - Whether to stream tokens
   * @returns {Object} Completion result with witness
   */
  async generateCompletion(params) {
    const inferenceId = this._generateInferenceId();
    
    // Record prompt hash
    const promptHash = CanonicalAuthority.hash(params.prompt);
    
    // Record model digest
    const modelDigest = await this._getModelDigest(params.model);
    
    // Canonicalize parameters
    const canonicalParams = this._canonicalizeParams(params);
    
    // Call Ollama API
    const ioOperation = this._ioAuthority.recordHTTPRequest(
      `${this._baseUrl}/api/generate`,
      'POST'
    );
    
    let completion = '';
    let tokenCount = 0;
    let modelMetadata = null;
    
    try {
      if (params.stream) {
        // Stream tokens
        const streamResult = await this._streamCompletion(canonicalParams, inferenceId);
        completion = streamResult.completion;
        tokenCount = streamResult.tokenCount;
        modelMetadata = streamResult.modelMetadata;
      } else {
        // Single request
        const response = await this._makeRequest('/api/generate', canonicalParams);
        completion = response.response;
        tokenCount = response.eval_count || 0;
        modelMetadata = this._extractModelMetadata(response);
      }
      
      // Record completion hash
      const completionHash = CanonicalAuthority.hash(completion);
      
      // Create inference witness
      const witness = this._createInferenceWitness({
        inference_id: inferenceId,
        prompt_hash: promptHash,
        model_digest: modelDigest,
        model_name: params.model,
        options: canonicalParams.options,
        token_count: tokenCount,
        completion_hash: completionHash,
        completion: completion,
        model_metadata: modelMetadata,
        io_operation: ioOperation
      });
      
      const result = {
        inference_id: inferenceId,
        completion: completion,
        token_count: tokenCount,
        model_metadata: modelMetadata,
        witness: witness,
        prompt_hash: promptHash,
        completion_hash: completionHash,
        model_digest: modelDigest
      };
      
      this._inferenceHistory.set(inferenceId, result);
      
      return result;
      
    } catch (error) {
      throw this._failureAuthority.createFailure(
        'OLLAMA_API_ERROR',
        'STATE_TRANSITION',
        { inference_id: inferenceId, error: error.message }
      );
    }
  }

  /**
   * Stream completion
   * @param {Object} params - Generation parameters
   * @param {string} inferenceId - Inference ID
   * @returns {Object} Stream result
   */
  async _streamCompletion(params, inferenceId) {
    const response = await fetch(`${this._baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completion = '';
    let tokenCount = 0;
    let modelMetadata = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const data = JSON.parse(line);
          
          if (data.response) {
            completion += data.response;
            tokenCount++;
          }
          
          if (data.done) {
            modelMetadata = this._extractModelMetadata(data);
            break;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    return {
      completion,
      tokenCount,
      modelMetadata
    };
  }

  /**
   * Make non-streaming request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {Object} Response
   */
  async _makeRequest(endpoint, params) {
    const response = await fetch(`${this._baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get model digest
   * @param {string} modelName - Model name
   * @returns {string} Model digest
   */
  async _getModelDigest(modelName) {
    try {
      const response = await this._makeRequest('/api/show', { name: modelName });
      const modelInfo = response.modelfile || '';
      const digest = CanonicalAuthority.hash(modelInfo);
      return digest;
    } catch (error) {
      // Fallback to hash of model name if API fails
      return CanonicalAuthority.hash({ model_name: modelName });
    }
  }

  /**
   * Canonicalize parameters
   * @param {Object} params - Raw parameters
   * @returns {Object} Canonical parameters
   */
  _canonicalizeParams(params) {
    return {
      model: params.model,
      prompt: params.prompt,
      stream: params.stream || false,
      options: {
        temperature: params.options?.temperature || 0.7,
        top_p: params.options?.top_p || 0.9,
        seed: params.options?.seed || null,
        num_predict: params.options?.num_predict || -1,
        top_k: params.options?.top_k || 40,
        repeat_penalty: params.options?.repeat_penalty || 1.1
      }
    };
  }

  /**
   * Extract model metadata
   * @param {Object} response - API response
   * @returns {Object} Model metadata
   */
  _extractModelMetadata(response) {
    return {
      model: response.model,
      created_at: response.created_at || null,
      total_duration: response.total_duration || null,
      load_duration: response.load_duration || null,
      prompt_eval_count: response.prompt_eval_count || null,
      prompt_eval_duration: response.prompt_eval_duration || null,
      eval_count: response.eval_count || null,
      eval_duration: response.eval_duration || null
    };
  }

  /**
   * Create inference witness
   * @param {Object} witnessData - Witness data
   * @returns {Object} Inference witness
   */
  _createInferenceWitness(witnessData) {
    const witness = {
      inference_id: witnessData.inference_id,
      prompt_hash: witnessData.prompt_hash,
      model_digest: witnessData.model_digest,
      model_name: witnessData.model_name,
      options: witnessData.options,
      token_count: witnessData.token_count,
      completion_hash: witnessData.completion_hash,
      completion: witnessData.completion,
      model_metadata: witnessData.model_metadata,
      adapter_id: this._adapterId,
      witness_metadata: {
        created_by: 'OllamaAdapter',
        frozen: true,
        hash: null
      }
    };

    // Exclude completion from hash (too large, use completion_hash instead)
    const witnessForHash = { ...witness };
    delete witnessForHash.completion;
    
    witness.witness_metadata.hash = CanonicalAuthority.hash(witnessForHash);
    
    return witness;
  }

  /**
   * Get inference history
   * @param {string} inferenceId - Inference ID
   * @returns {Object} Inference result
   */
  getInference(inferenceId) {
    return this._inferenceHistory.get(inferenceId);
  }

  /**
   * Get adapter ID
   * @returns {string} Adapter ID
   */
  getAdapterId() {
    return this._adapterId;
  }

  /**
   * Clear history (for testing)
   */
  clear() {
    this._inferenceHistory.clear();
  }

  /**
   * Generate inference ID
   * @returns {string} Inference ID
   */
  _generateInferenceId() {
    const inferenceData = {
      adapter_id: this._adapterId,
      sequence: this._inferenceHistory.size
    };
    const hash = CanonicalAuthority.hash(inferenceData);
    return `ollama_${hash.substring(0, 16)}`;
  }

  /**
   * Generate adapter ID
   * @returns {string} Adapter ID
   */
  _generateAdapterId() {
    const adapterData = {
      adapter_version: '4.0.0',
      constitutional_version: '4.0.0',
      base_url: this._baseUrl
    };
    const hash = CanonicalAuthority.hash(adapterData);
    return `ollama_adapter_${hash.substring(0, 16)}`;
  }
}

module.exports = { OllamaAdapter };
