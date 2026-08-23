/**
 * Constitutional Code Retrieval
 * 
 * Ω.54 — Constitutional Code Retrieval
 * 
 * Instead of RAG over text:
 * 
 * query
 * ↓
 * Symbol Graph
 * ↓
 * Call Graph
 * ↓
 * Type Graph
 * ↓
 * Pattern Graph
 * ↓
 * Reflection Graph
 * ↓
 * Mission Graph
 * ↓
 * only then
 * ↓
 * LLM
 * 
 * The LLM becomes the last stage, not the first.
 * 
 * Constitutional Constraint: Code retrieval uses constitutional graphs before LLM inference.
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalCodeRetrieval {
  constructor(postgresPool, objectRegistry, witnessChain, symbolGraph, callGraph, typeGraph, patternDatabase, ollamaAnalyst) {
    this._postgres = postgresPool;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._symbolGraph = symbolGraph;
    this._callGraph = callGraph;
    this._typeGraph = typeGraph;
    this._patternDatabase = patternDatabase;
    this._ollamaAnalyst = ollamaAnalyst;
    this._retrievalCache = new Map(); // query_id → retrieval result
    this._initialized = false;
  }

  /**
   * Initialize constitutional code retrieval
   */
  async initialize() {
    await this._loadRetrievalCache();
    this._initialized = true;
    console.log('[ConstitutionalCodeRetrieval] Initialized with', this._retrievalCache.size, 'retrieval results');
  }

  /**
   * Perform constitutional code retrieval
   */
  async retrieveCode(query, options = {}) {
    console.log(`[ConstitutionalCodeRetrieval] Retrieving code for query: ${query}`);

    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
    const queryId = `retrieval-${CanonicalAuthority.hash({ query, options, timestamp: constitutionalTimeAuthority.nowAsMillis() })}`;

    const retrieval = {
      query_id: queryId,
      query: query,
      options: options,
      stages: {},
      retrieved_objects: [],
      llm_context: null,
      llm_response: null,
      generated_at: constitutionalTimeAuthority.now(),
    };

    try {
      // Stage 1: Symbol Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 1: Symbol Graph');
      retrieval.stages.symbol_graph = await this._retrieveFromSymbolGraph(query, options);
      retrieval.retrieved_objects.push(...retrieval.stages.symbol_graph.objects);

      // Stage 2: Call Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 2: Call Graph');
      retrieval.stages.call_graph = await this._retrieveFromCallGraph(query, options, retrieval.stages.symbol_graph);
      retrieval.retrieved_objects.push(...retrieval.stages.call_graph.objects);

      // Stage 3: Type Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 3: Type Graph');
      retrieval.stages.type_graph = await this._retrieveFromTypeGraph(query, options, retrieval.stages.symbol_graph);
      retrieval.retrieved_objects.push(...retrieval.stages.type_graph.objects);

      // Stage 4: Pattern Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 4: Pattern Graph');
      retrieval.stages.pattern_graph = await this._retrieveFromPatternGraph(query, options);
      retrieval.retrieved_objects.push(...retrieval.stages.pattern_graph.objects);

      // Stage 5: Reflection Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 5: Reflection Graph');
      retrieval.stages.reflection_graph = await this._retrieveFromReflectionGraph(query, options);
      retrieval.retrieved_objects.push(...retrieval.stages.reflection_graph.objects);

      // Stage 6: Mission Graph Retrieval
      console.log('[ConstitutionalCodeRetrieval] Stage 6: Mission Graph');
      retrieval.stages.mission_graph = await this._retrieveFromMissionGraph(query, options);
      retrieval.retrieved_objects.push(...retrieval.stages.mission_graph.objects);

      // Stage 7: Build LLM Context
      console.log('[ConstitutionalCodeRetrieval] Stage 7: Build LLM Context');
      retrieval.llm_context = this._buildLLMContext(retrieval);

      // Stage 8: LLM Inference (if requested)
      if (options.useLLM !== false) {
        console.log('[ConstitutionalCodeRetrieval] Stage 8: LLM Inference');
        retrieval.llm_response = await this._performLLMInference(query, retrieval.llm_context);
      }

      // Cache retrieval
      this._retrievalCache.set(queryId, retrieval);
      await this._persistRetrieval(retrieval);

      console.log(`[ConstitutionalCodeRetrieval] Retrieval completed: ${queryId}`);
      return retrieval;
    } catch (error) {
      console.error('[ConstitutionalCodeRetrieval] Retrieval failed:', error.message);
      throw error;
    }
  }

  /**
   * Retrieve from Symbol Graph
   */
  async _retrieveFromSymbolGraph(query, options) {
    const results = {
      objects: [],
      strategy: 'symbol_match',
      count: 0,
    };

    // Search symbols by name
    const symbolMatches = this._symbolGraph.searchSymbolsByName(query);
    results.objects.push(...symbolMatches);

    // Search by kind if specified
    if (options.symbolKind) {
      const kindMatches = this._symbolGraph.getSymbolsByKind(options.symbolKind);
      results.objects.push(...kindMatches);
    }

    // Search by language if specified
    if (options.language) {
      const languageMatches = this._symbolGraph.getSymbolsByLanguage(options.language);
      results.objects.push(...languageMatches);
    }

    results.count = results.objects.length;
    return results;
  }

  /**
   * Retrieve from Call Graph
   */
  async _retrieveFromCallGraph(query, options, symbolGraphResults) {
    const results = {
      objects: [],
      strategy: 'call_analysis',
      count: 0,
    };

    // Get call graphs for repositories containing matched symbols
    const repoIds = new Set();
    for (const symbol of symbolGraphResults.objects) {
      if (symbol.payload.repository) {
        repoIds.add(symbol.payload.repository);
      }
    }

    for (const repoId of repoIds) {
      const callGraph = this._callGraph.getCallGraph(repoId);
      if (callGraph) {
        results.objects.push({
          kind: 'CallGraph',
          repo_id: repoId,
          data: callGraph,
        });
      }
    }

    results.count = results.objects.length;
    return results;
  }

  /**
   * Retrieve from Type Graph
   */
  async _retrieveFromTypeGraph(query, options, symbolGraphResults) {
    const results = {
      objects: [],
      strategy: 'type_analysis',
      count: 0,
    };

    // Get type graphs for repositories containing matched symbols
    const repoIds = new Set();
    for (const symbol of symbolGraphResults.objects) {
      if (symbol.payload.repository) {
        repoIds.add(symbol.payload.repository);
      }
    }

    for (const repoId of repoIds) {
      const typeGraph = this._typeGraph.getTypeGraph(repoId);
      if (typeGraph) {
        results.objects.push({
          kind: 'TypeGraph',
          repo_id: repoId,
          data: typeGraph,
        });
      }
    }

    results.count = results.objects.length;
    return results;
  }

  /**
   * Retrieve from Pattern Graph
   */
  async _retrieveFromPatternGraph(query, options) {
    const results = {
      objects: [],
      strategy: 'pattern_match',
      count: 0,
    };

    // Search patterns by problem
    const patternMatches = this._patternDatabase.searchPatternsByProblem(query);
    results.objects.push(...patternMatches);

    // Search by category if specified
    if (options.patternCategory) {
      const categoryMatches = this._patternDatabase.getPatternsByCategory(options.patternCategory);
      results.objects.push(...categoryMatches);
    }

    // Get top patterns by usage
    if (options.topPatterns) {
      const topPatterns = this._patternDatabase.getTopPatternsByUsage(options.topPatterns);
      results.objects.push(...topPatterns);
    }

    results.count = results.objects.length;
    return results;
  }

  /**
   * Retrieve from Reflection Graph
   */
  async _retrieveFromReflectionGraph(query, options) {
    const results = {
      objects: [],
      strategy: 'reflection_match',
      count: 0,
    };

    // Retrieve reflection objects from object registry
    const reflections = await this._objectRegistry.lookupByKind('Reflection');
    
    // Filter reflections by query relevance
    const queryLower = query.toLowerCase();
    const relevantReflections = reflections.filter(r => 
      r.payload.reasoning?.toLowerCase().includes(queryLower) ||
      r.payload.insights?.some(i => i.toLowerCase().includes(queryLower))
    );

    results.objects.push(...relevantReflections.slice(0, options.reflectionLimit || 10));
    results.count = results.objects.length;

    return results;
  }

  /**
   * Retrieve from Mission Graph
   */
  async _retrieveFromMissionGraph(query, options) {
    const results = {
      objects: [],
      strategy: 'mission_match',
      count: 0,
    };

    // Retrieve mission objects from object registry
    const missions = await this._objectRegistry.lookupByKind('Mission');
    
    // Filter missions by query relevance
    const queryLower = query.toLowerCase();
    const relevantMissions = missions.filter(m => 
      m.payload.reasoning?.toLowerCase().includes(queryLower) ||
      m.payload.description?.toLowerCase().includes(queryLower)
    );

    results.objects.push(...relevantMissions.slice(0, options.missionLimit || 10));
    results.count = results.objects.length;

    return results;
  }

  /**
   * Build LLM context
   */
  _buildLLMContext(retrieval) {
    const context = {
      query: retrieval.query,
      symbol_context: this._formatSymbolContext(retrieval.stages.symbol_graph),
      call_context: this._formatCallContext(retrieval.stages.call_graph),
      type_context: this._formatTypeContext(retrieval.stages.type_graph),
      pattern_context: this._formatPatternContext(retrieval.stages.pattern_graph),
      reflection_context: this._formatReflectionContext(retrieval.stages.reflection_graph),
      mission_context: this._formatMissionContext(retrieval.stages.mission_graph),
      summary: this._generateRetrievalSummary(retrieval),
    };

    return context;
  }

  /**
   * Format symbol context
   */
  _formatSymbolContext(symbolGraphResults) {
    if (!symbolGraphResults || symbolGraphResults.objects.length === 0) {
      return 'No symbols retrieved.';
    }

    return symbolGraphResults.objects.slice(0, 5).map(s => 
      `- ${s.payload.canonical_name} (${s.payload.kind})`
    ).join('\n');
  }

  /**
   * Format call context
   */
  _formatCallContext(callGraphResults) {
    if (!callGraphResults || callGraphResults.objects.length === 0) {
      return 'No call graphs retrieved.';
    }

    return callGraphResults.objects.map(c => 
      `- Repository: ${c.repo_id}, Functions: ${c.data.nodes.length}, Calls: ${c.data.calls.length}`
    ).join('\n');
  }

  /**
   * Format type context
   */
  _formatTypeContext(typeGraphResults) {
    if (!typeGraphResults || typeGraphResults.objects.length === 0) {
      return 'No type graphs retrieved.';
    }

    return typeGraphResults.objects.map(t => 
      `- Repository: ${t.repo_id}, Types: ${t.data.nodes.length}, Relationships: ${t.data.edges.length}`
    ).join('\n');
  }

  /**
   * Format pattern context
   */
  _formatPatternContext(patternGraphResults) {
    if (!patternGraphResults || patternGraphResults.objects.length === 0) {
      return 'No patterns retrieved.';
    }

    return patternGraphResults.objects.slice(0, 5).map(p => 
      `- ${p.payload.name} (${p.payload.category}): ${p.payload.problem}`
    ).join('\n');
  }

  /**
   * Format reflection context
   */
  _formatReflectionContext(reflectionGraphResults) {
    if (!reflectionGraphResults || reflectionGraphResults.objects.length === 0) {
      return 'No reflections retrieved.';
    }

    return reflectionGraphResults.objects.slice(0, 3).map(r => 
      `- Reflection: ${r.id.substring(0, 20)}...`
    ).join('\n');
  }

  /**
   * Format mission context
   */
  _formatMissionContext(missionGraphResults) {
    if (!missionGraphResults || missionGraphResults.objects.length === 0) {
      return 'No missions retrieved.';
    }

    return missionGraphResults.objects.slice(0, 3).map(m => 
      `- Mission: ${m.payload.description}`
    ).join('\n');
  }

  /**
   * Generate retrieval summary
   */
  _generateRetrievalSummary(retrieval) {
    const summary = [];
    
    summary.push(`Retrieved ${retrieval.stages.symbol_graph.count} symbols`);
    summary.push(`Retrieved ${retrieval.stages.call_graph.count} call graphs`);
    summary.push(`Retrieved ${retrieval.stages.type_graph.count} type graphs`);
    summary.push(`Retrieved ${retrieval.stages.pattern_graph.count} patterns`);
    summary.push(`Retrieved ${retrieval.stages.reflection_graph.count} reflections`);
    summary.push(`Retrieved ${retrieval.stages.mission_graph.count} missions`);
    summary.push(`Total objects: ${retrieval.retrieved_objects.length}`);

    return summary.join('\n');
  }

  /**
   * Perform LLM inference
   */
  async _performLLMInference(query, context) {
    const prompt = this._constructLLMPrompt(query, context);
    
    const analysis = await this._ollamaAnalyst.analyze(prompt, {
      metadata: {
        retrieval_type: 'constitutional_code_retrieval',
        context_summary: context.summary,
      },
    });

    return analysis;
  }

  /**
   * Construct LLM prompt
   */
  _constructLLMPrompt(query, context) {
    return `
You are a Constitutional Code Analyst. Answer the user's query using the constitutional context provided.

Query: ${query}

Constitutional Context:

Symbol Context:
${context.symbol_context}

Call Context:
${context.call_context}

Type Context:
${context.type_context}

Pattern Context:
${context.pattern_context}

Reflection Context:
${context.reflection_context}

Mission Context:
${context.mission_context}

Retrieval Summary:
${context.summary}

Provide your answer based on the constitutional evidence above. Cite specific symbols, patterns, and repositories when relevant.
`;
  }

  /**
   * Get retrieval by ID
   */
  getRetrieval(queryId) {
    return this._retrievalCache.get(queryId);
  }

  /**
   * Get all retrievals
   */
  getAllRetrievals() {
    return Array.from(this._retrievalCache.values());
  }

  /**
   * Get retrieval statistics
   */
  getStatistics() {
    const retrievals = Array.from(this._retrievalCache.values());
    
    const stats = {
      total_queries: retrievals.length,
      average_objects_retrieved: 0,
      average_llm_confidence: 0,
      with_llm_response: 0,
      by_stage: {
        symbol_graph: 0,
        call_graph: 0,
        type_graph: 0,
        pattern_graph: 0,
        reflection_graph: 0,
        mission_graph: 0,
      },
    };

    let totalObjects = 0;
    let totalConfidence = 0;

    for (const retrieval of retrievals) {
      totalObjects += retrieval.retrieved_objects.length;
      
      if (retrieval.llm_response) {
        stats.with_llm_response++;
        totalConfidence += retrieval.llm_response.payload.confidence || 0;
      }

      // Count by stage
      if (retrieval.stages.symbol_graph) {
        stats.by_stage.symbol_graph += retrieval.stages.symbol_graph.count;
      }
      if (retrieval.stages.call_graph) {
        stats.by_stage.call_graph += retrieval.stages.call_graph.count;
      }
      if (retrieval.stages.type_graph) {
        stats.by_stage.type_graph += retrieval.stages.type_graph.count;
      }
      if (retrieval.stages.pattern_graph) {
        stats.by_stage.pattern_graph += retrieval.stages.pattern_graph.count;
      }
      if (retrieval.stages.reflection_graph) {
        stats.by_stage.reflection_graph += retrieval.stages.reflection_graph.count;
      }
      if (retrieval.stages.mission_graph) {
        stats.by_stage.mission_graph += retrieval.stages.mission_graph.count;
      }
    }

    if (retrievals.length > 0) {
      stats.average_objects_retrieved = totalObjects / retrievals.length;
    }
    
    if (stats.with_llm_response > 0) {
      stats.average_llm_confidence = totalConfidence / stats.with_llm_response;
    }
    return stats;
  }

  /**
   * Persist retrieval
   */
  async _persistRetrieval(retrieval) {
    try {
      await this._postgres.query(`
        INSERT INTO code_retrievals (query_id, retrieval_data, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (query_id) DO UPDATE SET
          retrieval_data = $2,
          updated_at = NOW()
      `, [retrieval.query_id, JSON.stringify(retrieval)]);
    } catch (error) {
      console.error('[ConstitutionalCodeRetrieval] Failed to persist retrieval:', error.message);
    }
  }

  /**
   * Load retrieval cache
   */
  async _loadRetrievalCache() {
    try {
      const result = await this._postgres.query(`
        SELECT query_id, retrieval_data
        FROM code_retrievals
        ORDER BY updated_at DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        this._retrievalCache.set(row.query_id, row.retrieval_data);
      }
    } catch (error) {
      console.error('[ConstitutionalCodeRetrieval] Failed to load retrieval cache:', error.message);
    }
  }

  /**
   * Clear retrieval cache (memory only)
   */
  clearRetrievalCache() {
    this._retrievalCache.clear();
  }
}

module.exports = { ConstitutionalCodeRetrieval };
