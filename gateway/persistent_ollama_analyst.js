/**
 * Persistent Ollama Analyst
 * 
 * Ω.37 — Ollama Constitutional Memory
 * 
 * Ollama becomes another constitutional subsystem.
 * 
 * Every Ollama invocation should emit AnalysisObject with full model execution evidence:
 * - id
 * - model_id
 * - model_digest
 * - prompt_hash
 * - system_prompt_hash
 * - temperature
 * - context_object_ids
 * - context_hash
 * - retrieved_embedding_ids
 * - retrieval_hash
 * - response_hash
 * - response_tokens
 * - confidence
 * - reasoning
 * - recommendations
 * - canonical_hash
 * - analysis_root
 * - timestamp
 * 
 * Constitutional Constraint: Model execution itself becomes replayable evidence.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class PersistentOllamaAnalyst {
  constructor(postgresPool, objectRegistry, gatewayClient, qdrantClient) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._gatewayClient = gatewayClient;
    this._qdrantClient = qdrantClient;
    this._analysisHistory = new Map(); // analysis_id → analysis object
    this._initialized = false;
  }

  /**
   * Initialize persistent analyst
   */
  async initialize() {
    // Load analysis history from PostgreSQL
    await this._loadAnalysisHistory();
    
    this._initialized = true;
    console.log('[PersistentOllamaAnalyst] Initialized with', this._analysisHistory.size, 'analyses');
  }

  /**
   * Perform analysis with full model execution evidence
   */
  async analyze(query, context = {}, modelParams = {}) {
    const analysisId = `analysis-${CanonicalAuthority.hash({ query, context, modelParams, timestamp: constitutionalTimeAuthority.nowAsMillis() })}`;

    // Retrieve constitutional context
    const constitutionalContext = await this._retrieveConstitutionalContext(query, context);

    // Construct analysis prompt with constitutional context
    const prompt = this._constructPrompt(query, constitutionalContext, context);

    // Call Ollama with deterministic parameters
    const ollamaResponse = await this._callOllamaDeterministic(prompt, modelParams);

    // Compute hashes for reproducibility
    const promptHash = CanonicalAuthority.hash(prompt);
    const contextHash = CanonicalAuthority.hash(conststitutionalContext);
    const responseHash = CanonicalAuthority.hash(ollamaResponse.response);
    const retrievalHash = CanonicalAuthority.hash({
      embedding_ids: constitutionalContext.embedding_ids,
      reflection_ids: constitutionalContext.reflection_ids,
      mission_ids: constitutionalContext.mission_ids,
      analysis_ids: constitutionalContext.analysis_ids,
    });

    // Create AnalysisObject with full model execution evidence
    const analysisObj = await this._createAnalysisObject(
      analysisId,
      query,
      context,
      constitutionalContext,
      ollamaResponse,
      modelParams,
      promptHash,
      contextHash,
      responseHash,
      retrievalHash
    );

    // Register analysis object
    await this._objectRegistry.register(analysisObj);
    this._analysisHistory.set(analysisId, analysisObj);

    // Emit analysis event
    await this._emitAnalysisEvent(analysisObj);

    console.log('[PersistentOllamaAnalyst] Analysis completed:', analysisId);
    return analysisObj;
  }

  /**
   * Retrieve constitutional context (embeddings, reflections, missions, analyses)
   */
  async _retrieveConstitutionalContext(query, context) {
    const constitutionalContext = {
      embedding_ids: [],
      reflection_ids: [],
      mission_ids: [],
      analysis_ids: [],
      objects: [],
    };

    // Retrieve relevant embeddings
    if (this._qdrantClient) {
      try {
        const embeddingResults = await this._qdrantClient.search(query, {
          limit: context.embedding_limit || 10,
          collection: context.collection || 'constitutional_documents',
        });
        constitutionalContext.embedding_ids = embeddingResults.map(r => r.id);
        constitutionalContext.objects.push(...embeddingResults);
      } catch (error) {
        console.error('[PersistentOllamaAnalyst] Failed to retrieve embeddings:', error.message);
      }
    }

    // Retrieve relevant reflections
    if (context.retrieve_reflections !== false) {
      const reflections = await this._objectRegistry.lookupByKind('Reflection');
      constitutionalContext.reflection_ids = reflections.slice(0, context.reflection_limit || 5).map(r => r.id);
      constitutionalContext.objects.push(...reflections.slice(0, context.reflection_limit || 5));
    }

    // Retrieve relevant missions
    if (context.retrieve_missions !== false) {
      const missions = await this._objectRegistry.lookupByKind('Mission');
      constitutionalContext.mission_ids = missions.slice(0, context.mission_limit || 5).map(m => m.id);
      constitutionalContext.objects.push(...missions.slice(0, context.mission_limit || 5));
    }

    // Retrieve relevant analyses
    if (context.retrieve_analyses !== false) {
      const analyses = await this._objectRegistry.lookupByKind('Analysis');
      constitutionalContext.analysis_ids = analyses.slice(0, context.analysis_limit || 5).map(a => a.id);
      constitutionalContext.objects.push(...analyses.slice(0, context.analysis_limit || 5));
    }

    return constitutionalContext;
  }

  /**
   * Construct analysis prompt with constitutional context
   */
  _constructPrompt(query, constitutionalContext, context) {
    const contextSection = this._formatConstitutionalContext(constitutionalContext);
    
    return `
You are a Constitutional Analyst. Your analysis becomes part of the immutable constitutional record.

Query: ${query}

Constitutional Context:
${contextSection}

Additional Context:
${JSON.stringify(context.metadata || {}, null, 2)}

Provide your analysis as:
1. Direct answer to the query
2. Evidence from constitutional objects (cite object IDs)
3. Reasoning chain
4. Confidence level (0-1)
5. Recommended actions (if applicable)

Your response will be persisted as a Constitutional Object with full model execution evidence.
`;
  }

  /**
   * Format constitutional context for prompt
   */
  _formatConstitutionalContext(conststitutionalContext) {
    const parts = [];

    if (constitutionalContext.embedding_ids.length > 0) {
      parts.push(`Embeddings: ${constitutionalContext.embedding_ids.join(', ')}`);
    }

    if (constitutionalContext.reflection_ids.length > 0) {
      parts.push(`Reflections: ${constitutionalContext.reflection_ids.join(', ')}`);
    }

    if (constitutionalContext.mission_ids.length > 0) {
      parts.push(`Missions: ${constitutionalContext.mission_ids.join(', ')}`);
    }

    if (constitutionalContext.analysis_ids.length > 0) {
      parts.push(`Analyses: ${constitutionalContext.analysis_ids.join(', ')}`);
    }

    if (parts.length === 0) {
      return 'No constitutional context retrieved.';
    }

    return parts.join('\n');
  }

  /**
   * Call Ollama with deterministic parameters
   * 
   * Ω.38 — Ollama Determinism
   * 
   * Pin:
   * - model digest
   * - GGUF hash
   * - Ollama version
   * - prompt template hash
   * - sampler
   * - temperature
   * - seed
   * - top_p
   * - top_k
   * - repeat penalty
   * - context window
   * - stop tokens
   */
  async _callOllamaDeterministic(prompt, modelParams = {}) {
    const INFERENCE_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const MODEL = modelParams.model_id || process.env.OLLAMA_MODEL || 'llama2';
    
    // Deterministic parameters
    const temperature = modelParams.temperature !== undefined ? modelParams.temperature : 0.7;
    const seed = modelParams.seed !== undefined ? modelParams.seed : 42;
    const top_p = modelParams.top_p !== undefined ? modelParams.top_p : 0.9;
    const top_k = modelParams.top_k !== undefined ? modelParams.top_k : 40;
    const repeat_penalty = modelParams.repeat_penalty !== undefined ? modelParams.repeat_penalty : 1.1;

    try {
      const response = await fetch(`${INFERENCE_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          prompt: prompt,
          stream: false,
          options: {
            temperature: temperature,
            seed: seed,
            top_p: top_p,
            top_k: top_k,
            repeat_penalty: repeat_penalty,
            num_ctx: modelParams.context_window || 4096,
            stop: modelParams.stop_tokens || [],
          },
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      return {
        response: data.response,
        model: MODEL,
        model_digest: modelParams.model_digest || null,
        gguf_hash: modelParams.gguf_hash || null,
        ollama_version: modelParams.ollama_version || null,
        prompt_template_hash: modelParams.prompt_template_hash || null,
        sampler: modelParams.sampler || 'default',
        temperature: temperature,
        seed: seed,
        top_p: top_p,
        top_k: top_k,
        repeat_penalty: repeat_penalty,
        context_window: modelParams.context_window || 4096,
        stop_tokens: modelParams.stop_tokens || [],
        done: data.done,
        context: data.context,
        eval_count: data.eval_count,
        prompt_eval_count: data.prompt_eval_count,
      };
    } catch (error) {
      console.error('[PersistentOllamaAnalyst] Ollama call failed:', error.message);
      throw error;
    }
  }

  /**
   * Create AnalysisObject with full model execution evidence
   */
  async _createAnalysisObject(
    analysisId,
    query,
    context,
    constitutionalContext,
    ollamaResponse,
    modelParams,
    promptHash,
    contextHash,
    responseHash,
    retrievalHash
  ) {
    const { CanonicalAuthority } = require('./canonical_authority');
    
    // Compute analysis root (Merkle root of all analysis fields)
    const analysisRoot = this._computeAnalysisRoot({
      model_id: ollamaResponse.model,
      model_digest: ollamaResponse.model_digest,
      prompt_hash: promptHash,
      context_hash: contextHash,
      response_hash: responseHash,
      retrieval_hash: retrievalHash,
      temperature: ollamaResponse.temperature,
      seed: ollamaResponse.seed,
    });

    return {
      id: analysisId,
      kind: 'Analysis',
      canonical_hash: CanonicalAuthority.hash({
        analysis_root: analysisRoot,
        query,
        context,
        model_params: modelParams,
        constitutional_context: constitutionalContext,
        response: ollamaResponse.response,
      }),
      payload: {
        query: query,
        context: context,
        model_id: ollamaResponse.model,
        model_digest: ollamaResponse.model_digest,
        gguf_hash: ollamaResponse.gguf_hash,
        ollama_version: ollamaResponse.ollama_version,
        prompt_template_hash: ollamaResponse.prompt_template_hash,
        sampler: ollamaResponse.sampler,
        prompt_hash: promptHash,
        system_prompt_hash: modelParams.system_prompt_hash || null,
        temperature: ollamaResponse.temperature,
        seed: ollamaResponse.seed,
        top_p: ollamaResponse.top_p,
        top_k: ollamaResponse.top_k,
        repeat_penalty: ollamaResponse.repeat_penalty,
        context_window: ollamaResponse.context_window,
        stop_tokens: ollamaResponse.stop_tokens,
        context_object_ids: constitutionalContext.objects.map(o => o.id),
        context_hash: contextHash,
        retrieved_embedding_ids: constitutionalContext.embedding_ids,
        retrieved_reflection_ids: constitutionalContext.reflection_ids,
        retrieved_mission_ids: constitutionalContext.mission_ids,
        retrieved_analysis_ids: constitutionalContext.analysis_ids,
        retrieval_hash: retrievalHash,
        response_hash: responseHash,
        response: ollamaResponse.response,
        response_tokens: ollamaResponse.eval_count || 0,
        prompt_tokens: ollamaResponse.prompt_eval_count || 0,
        confidence: this._extractConfidence(ollamaResponse.response),
        reasoning: this._extractReasoning(ollamaResponse.response),
        recommendations: this._extractRecommendations(ollamaResponse.response),
        analysis_root: analysisRoot,
      },
      authority: 'PersistentOllamaAnalyst',
      identity: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
      },
      lineage: {
        source_id: context.source_id || null,
        source_kind: context.source_kind || 'Query',
      },
      relationships: [
        ...constitutionalContext.objects.map(obj => ({
          target_id: obj.id,
          relation: 'analyzed',
        })),
      ],
      metadata: {
        schema_version: '1.0.0',
        ollama_model: ollamaResponse.model,
        model_digest: ollamaResponse.model_digest,
        analysis_root: analysisRoot,
      },
    };
  }

  /**
   * Compute analysis root (Merkle root of analysis fields)
   */
  _computeAnalysisRoot(fields) {
    const { CanonicalAuthority } = require('./canonical_authority');
    
    // Sort keys for canonical ordering
    const sortedKeys = Object.keys(fields).sort();
    const leafHashes = sortedKeys.map(key => CanonicalAuthority.hash(fields[key]));
    
    // Compute Merkle root
    return this._computeMerkleRootFromLeaves(leafHashes);
  }

  /**
   * Compute Merkle root from leaf hashes
   */
  _computeMerkleRootFromLeaves(hashes) {
    if (hashes.length === 0) {
      return null;
    }
    
    if (hashes.length === 1) {
      return hashes[0];
    }
    
    // Pair and hash
    const nextLevel = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = (i + 1 < hashes.length) ? hashes[i + 1] : hashes[i];
      const combined = left + right;
      const hash = CanonicalAuthority.hash(combined);
      nextLevel.push(hash);
    }
    
    return this._computeMerkleRootFromLeaves(nextLevel);
  }

  /**
   * Extract confidence from analysis response
   */
  _extractConfidence(response) {
    const confidenceMatch = response.match(/confidence[:\s]*(\d+\.?\d*)/i);
    if (confidenceMatch) {
      return parseFloat(confidenceMatch[1]);
    }
    return 0.5; // Default confidence
  }

  /**
   * Extract reasoning from analysis response
   */
  _extractReasoning(response) {
    const reasoningMatch = response.match(/reasoning[:\s]*([^\n]+)/i);
    if (reasoningMatch) {
      return reasoningMatch[1].trim();
    }
    return null;
  }

  /**
   * Extract recommendations from analysis response
   */
  _extractRecommendations(response) {
    const recommendationsMatch = response.match(/recommendations[:\s]*([^\n]+)/i);
    if (recommendationsMatch) {
      return recommendationsMatch[1].trim();
    }
    return null;
  }

  /**
   * Emit analysis event
   */
  async _emitAnalysisEvent(analysisObj) {
    // This would emit to the event bus
    // For now, just log
    console.log('[PersistentOllamaAnalyst] Analysis event emitted:', analysisObj.id);
  }

  /**
   * Load analysis history from PostgreSQL
   */
  async _loadAnalysisHistory() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'ANALYSIS_CREATED'
        ORDER BY timestamp DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        const analysis = row.event_data;
        this._analysisHistory.set(analysis.id, analysis);
      }
    } catch (error) {
      console.error('[PersistentOllamaAnalyst] Failed to load analysis history:', error.message);
    }
  }

  /**
   * Get analysis by ID
   */
  async getAnalysis(analysisId) {
    // Check memory first
    if (this._analysisHistory.has(analysisId)) {
      return this._analysisHistory.get(analysisId);
    }

    // Check object registry
    const obj = await this._objectRegistry.lookupById(analysisId);
    if (obj && obj.kind === 'Analysis') {
      this._analysisHistory.set(analysisId, obj);
      return obj;
    }

    return null;
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(limit = 100) {
    return Array.from(this._analysisHistory.values())
      .sort((a, b) => new Date(b.identity.created_at) - new Date(a.identity.created_at))
      .slice(0, limit);
  }

  /**
   * Get analyses by query
   */
  async getAnalysesByQuery(queryPattern, limit = 50) {
    const allAnalyses = this.getAnalysisHistory();
    const regex = new RegExp(queryPattern, 'i');
    
    return allAnalyses
      .filter(analysis => regex.test(analysis.payload.query))
      .slice(0, limit);
  }

  /**
   * Get analyses by object reference
   */
  async getAnalysesByObject(objectId, limit = 50) {
    const allAnalyses = this.getAnalysisHistory();
    
    return allAnalyses
      .filter(analysis => 
        analysis.payload.context_object_ids.includes(objectId) ||
        analysis.relationships.some(r => r.target_id === objectId)
      )
      .slice(0, limit);
  }

  /**
   * Perform reflection on analysis
   */
  async reflectOnAnalysis(analysisId) {
    const analysis = await this.getAnalysis(analysisId);
    if (!analysis) {
      throw new Error(`Analysis not found: ${analysisId}`);
    }

    // Create reflection query
    const reflectionQuery = `
Reflect on this analysis:
- Query: ${analysis.payload.query}
- Analysis: ${analysis.payload.response}
- Confidence: ${analysis.payload.confidence}
- Analysis Root: ${analysis.payload.analysis_root}

Evaluate:
1. Reasoning quality
2. Evidence sufficiency
3. Action appropriateness
4. Potential improvements
`;

    // Perform reflection analysis
    const reflection = await this.analyze(reflectionQuery, {
      object_ids: [analysisId],
      source_id: analysisId,
      source_kind: 'Analysis',
      metadata: {
        reflection_type: 'analysis_reflection',
      },
    });

    return reflection;
  }

  /**
   * Get analysis statistics
   */
  getStatistics() {
    const analyses = this.getAnalysisHistory();
    
    const stats = {
      total_analyses: analyses.length,
      by_model: {},
      average_confidence: 0,
      with_reasoning: 0,
      with_recommendations: 0,
      average_response_tokens: 0,
    };

    let totalConfidence = 0;
    let totalResponseTokens = 0;

    for (const analysis of analyses) {
      // Count by model
      const model = analysis.payload.model_id || 'unknown';
      stats.by_model[model] = (stats.by_model[model] || 0) + 1;

      // Sum confidence
      totalConfidence += analysis.payload.confidence || 0;

      // Sum response tokens
      totalResponseTokens += analysis.payload.response_tokens || 0;

      // Count reasoning
      if (analysis.payload.reasoning) {
        stats.with_reasoning++;
      }

      // Count recommendations
      if (analysis.payload.recommendations) {
        stats.with_recommendations++;
      }
    }

    if (analyses.length > 0) {
      stats.average_confidence = totalConfidence / analyses.length;
      stats.average_response_tokens = totalResponseTokens / analyses.length;
    }

    return stats;
  }
}

module.exports = { PersistentOllamaAnalyst };
