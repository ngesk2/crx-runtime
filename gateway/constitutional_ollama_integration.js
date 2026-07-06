/**
 * Constitutional Ollama Integration
 * 
 * Ω.89 — Ollama Constitutional Knowledge Accumulation
 * 
 * Feed constitutional objects to Ollama, not raw source code.
 * 
 * Pipeline:
 * Repository
 *   ↓
 * Canonical Objects
 *   ↓
 * Canonical Graph
 *   ↓
 * Embeddings
 *   ↓
 * Qdrant
 * 
 * Ollama retrieves:
 * - Object A
 * - Object B
 * - Object C
 * 
 * ↓
 * 
 * Produces:
 * - ReflectionObject
 * - MissionObject
 * - ArchitecturePattern
 * - CompilerPattern
 * - ReplayPattern
 * 
 * ↓
 * 
 * Those become Constitutional Objects
 * ↓
 * Replay
 * ↓
 * Witness
 * ↓
 * Stored forever
 * 
 * This creates a self-growing constitutional memory instead of a growing pile of text summaries.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { QdrantClient } = require('./qdrant_client');

class ConstitutionalOllamaIntegration {
  constructor(postgresPool, qdrantClient, ollamaClient) {
    this._postgres = postgresPool;
    this._qdrantClient = qdrantClient;
    this._ollamaClient = ollamaClient;
    this._model = 'llama3';
    this._modelVersion = '1.0.0';
  }

  /**
   * Retrieve constitutional objects from Qdrant for Ollama analysis
   * 
   * @param {string} repoId - Repository ID
   * @param {Object} query - Query parameters
   * @returns {Array} Retrieved constitutional objects
   */
  async retrieveConstitutionalObjects(repoId, query = {}) {
    console.log(`[OllamaIntegration] Retrieving constitutional objects for ${repoId}`);

    try {
      // Search Qdrant for relevant constitutional objects
      const searchResults = await this._qdrantClient.search({
        collection_name: 'constitutional_objects',
        query_vector: query.vector || null,
        query_filter: {
          must: [
            { key: 'repo_id', match: { value: repoId } },
          ],
        },
        limit: query.limit || 10,
      });

      // Retrieve full objects from PostgreSQL
      const objectIds = searchResults.map(r => r.id);
      const objects = await this._retrieveObjectsByIds(objectIds);

      console.log(`[OllamaIntegration] Retrieved ${objects.length} constitutional objects`);
      return objects;
    } catch (error) {
      console.error('[OllamaIntegration] Failed to retrieve constitutional objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve objects by IDs from PostgreSQL
   */
  async _retrieveObjectsByIds(objectIds) {
    if (objectIds.length === 0) {
      return [];
    }

    try {
      const placeholders = objectIds.map((_, i) => `$${i + 1}`).join(',');
      const result = await this._postgres.query(`
        SELECT object_data
        FROM repository_objects
        WHERE object_id IN (${placeholders})
      `, objectIds);

      return result.rows.map(row => row.object_data);
    } catch (error) {
      console.error('[OllamaIntegration] Failed to retrieve objects by IDs:', error.message);
      return [];
    }
  }

  /**
   * Feed constitutional objects to Ollama for analysis
   * 
   * @param {Array} constitutionalObjects - Constitutional objects to analyze
   * @param {string} analysisType - Type of analysis (reflection, mission, architecture, compiler, replay)
   * @returns {Object} Ollama analysis result
   */
  async analyzeConstitutionalObjects(conststitutionalObjects, analysisType) {
    console.log(`[OllamaIntegration] Analyzing ${constitutionalObjects.length} constitutional objects (type: ${analysisType})`);

    // Build constitutional context from objects
    const constitutionalContext = this._buildConstitutionalContext(conststitutionalObjects);

    // Build prompt based on analysis type
    const prompt = this._buildAnalysisPrompt(analysisType, constitutionalContext);

    try {
      // Call Ollama API
      const response = await this._callOllama(prompt);

      // Parse response into constitutional objects
      const newConstitutionalObjects = this._parseOllamaResponse(response, analysisType);

      console.log(`[OllamaIntegration] Generated ${newConstitutionalObjects.length} new constitutional objects`);
      
      return {
        success: true,
        analysis_type: analysisType,
        input_objects: constitutionalObjects.map(o => o.id),
        output_objects: newConstitutionalObjects,
        model: this._model,
        model_version: this._modelVersion,
        analyzed_at: constitutionalTimeAuthority.now(),
      };
    } catch (error) {
      console.error('[OllamaIntegration] Failed to analyze constitutional objects:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Build constitutional context from objects
   */
  _buildConstitutionalContext(objects) {
    const context = {
      objects: objects.map(obj => ({
        id: obj.id,
        kind: obj.kind,
        canonical_hash: obj.canonical_hash,
        authority: obj.authority,
        payload: obj.payload,
        metadata: obj.metadata,
      })),
      graph: this._extractGraphStructure(objects),
      authorities: this._extractAuthorityStructure(objects),
    };

    return context;
  }

  /**
   * Extract graph structure from objects
   */
  _extractGraphStructure(objects) {
    const graph = {
      nodes: objects.map(obj => obj.id),
      edges: [],
    };

    // Extract relationships from objects
    for (const obj of objects) {
      if (obj.relationships) {
        for (const rel of obj.relationships) {
          graph.edges.push({
            from: obj.id,
            to: rel.target_id,
            type: rel.type,
          });
        }
      }
    }

    return graph;
  }

  /**
   * Extract authority structure from objects
   */
  _extractAuthorityStructure(objects) {
    const authorities = {};

    for (const obj of objects) {
      if (!authorities[obj.authority]) {
        authorities[obj.authority] = [];
      }
      authorities[obj.authority].push(obj.id);
    }

    return authorities;
  }

  /**
   * Build analysis prompt based on type
   */
  _buildAnalysisPrompt(analysisType, constitutionalContext) {
    const contextSummary = JSON.stringify(conststitutionalContext, null, 2);

    const prompts = {
      reflection: `You are a Constitutional Reflection Authority. Analyze the following constitutional objects and produce reflection objects.\n\nConstitutional Context:\n${contextSummary}\n\nProduce a JSON response with reflection objects that identify patterns, insights, and architectural observations. Each reflection object must have: kind, payload (description, insight, pattern), authority (ReflectionAuthority), and metadata.`,
      
      mission: `You are a Constitutional Mission Authority. Analyze the following constitutional objects and produce mission objects.\n\nConstitutional Context:\n${contextSummary}\n\nProduce a JSON response with mission objects that define actionable improvements. Each mission object must have: kind, payload (description, priority, affected_objects), authority (MissionAuthority), and metadata.`,
      
      architecture: `You are a Constitutional Architecture Authority. Analyze the following constitutional objects and produce architecture pattern objects.\n\nConstitutional Context:\n${contextSummary}\n\nProduce a JSON response with architecture pattern objects that identify reusable architectural structures. Each architecture pattern object must have: kind, payload (pattern_name, description, components), authority (KnowledgeGrowthAuthority), and metadata.`,
      
      compiler: `You are a Constitutional Compiler Authority. Analyze the following constitutional objects and produce compiler pattern objects.\n\nConstitutional Context:\n${contextSummary}\n\nProduce a JSON response with compiler pattern objects that identify reusable compiler structures. Each compiler pattern object must have: kind, payload (pattern_name, description, stages), authority (KnowledgeGrowthAuthority), and metadata.`,
      
      replay: `You are a Constitutional Replay Authority. Analyze the following constitutional objects and produce replay pattern objects.\n\nConstitutional Context:\n${contextSummary}\n\nProduce a JSON response with replay pattern objects that identify reusable replay structures. Each replay pattern object must have: kind, payload (pattern_name, description, events), authority (KnowledgeGrowthAuthority), and metadata.`,
    };

    return prompts[analysisType] || prompts.reflection;
  }

  /**
   * Call Ollama API
   */
  async _callOllama(prompt) {
    try {
      const response = await this._ollamaClient.generate({
        model: this._model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      });

      return response.response;
    } catch (error) {
      console.error('[OllamaIntegration] Ollama API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse Ollama response into constitutional objects
   */
  _parseOllamaResponse(response, analysisType) {
    const objects = [];

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[OllamaIntegration] No JSON found in Ollama response');
        return objects;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Convert parsed data into constitutional objects
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const obj = this._createConstitutionalObjectFromParsed(item, analysisType);
          if (obj) {
            objects.push(obj);
          }
        }
      } else if (parsed.objects && Array.isArray(parsed.objects)) {
        for (const item of parsed.objects) {
          const obj = this._createConstitutionalObjectFromParsed(item, analysisType);
          if (obj) {
            objects.push(obj);
          }
        }
      }

      return objects;
    } catch (error) {
      console.error('[OllamaIntegration] Failed to parse Ollama response:', error.message);
      return objects;
    }
  }

  /**
   * Create constitutional object from parsed item
   */
  _createConstitutionalObjectFromParsed(item, analysisType) {
    const kindMap = {
      reflection: 'ReflectionObject',
      mission: 'MissionObject',
      architecture: 'ArchitecturePattern',
      compiler: 'CompilerPattern',
      replay: 'ReplayPattern',
    };

    const authorityMap = {
      reflection: 'ReflectionAuthority',
      mission: 'MissionAuthority',
      architecture: 'KnowledgeGrowthAuthority',
      compiler: 'KnowledgeGrowthAuthority',
      replay: 'KnowledgeGrowthAuthority',
    };

    const objectId = deterministicIdAuthority.generateIdFromObject(item);
    const canonicalHash = CanonicalAuthority.hash(item);

    const constitutionalObject = {
      id: objectId,
      kind: kindMap[analysisType] || 'ConstitutionalObject',
      canonical_hash: canonicalHash,
      payload: item,
      authority: authorityMap[analysisType] || 'KnowledgeGrowthAuthority',
      lineage: {
        source_id: 'ollama_analysis',
        source_kind: analysisType,
      },
      metadata: {
        model: this._model,
        model_version: this._modelVersion,
        analysis_type: analysisType,
        generated_at: constitutionalTimeAuthority.now(),
      },
      created_at: constitutionalTimeAuthority.now(),
    };

    return constitutionalObject;
  }

  /**
   * Constitutionalize Ollama-generated objects
   * 
   * Store objects in knowledge base, generate replay events, generate witnesses
   */
  async constitutionalizeOllamaObjects(objects, repoId) {
    console.log(`[OllamaIntegration] Constitutionalizing ${objects.length} Ollama-generated objects`);

    const constitutionalized = [];

    for (const obj of objects) {
      try {
        // Store in PostgreSQL
        await this._storeConstitutionalObject(obj, repoId);

        // Generate embedding
        const embedding = await this._generateEmbedding(obj);

        // Store embedding in Qdrant
        await this._storeEmbedding(obj, embedding);

        // Generate replay event
        await this._generateReplayEvent(obj);

        // Generate witness
        await this._generateWitness(obj);

        constitutionalized.push(obj);
      } catch (error) {
        console.error(`[OllamaIntegration] Failed to constitutionalize object ${obj.id}:`, error.message);
      }
    }

    console.log(`[OllamaIntegration] Constitutionalized ${constitutionalized.length} objects`);
    return constitutionalized;
  }

  /**
   * Store constitutional object in PostgreSQL
   */
  async _storeConstitutionalObject(obj, repoId) {
    try {
      await this._postgres.query(`
        INSERT INTO repository_objects (object_id, repo_id, kind, object_data, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (object_id) DO UPDATE SET
          object_data = $4,
          updated_at = NOW()
      `, [obj.id, repoId, obj.kind, JSON.stringify(obj)]);
    } catch (error) {
      console.error(`[OllamaIntegration] Failed to store object ${obj.id}:`, error.message);
      throw error;
    }
  }

  /**
   * Generate embedding for constitutional object
   */
  async _generateEmbedding(obj) {
    // Placeholder: Use embedding authority
    return {
      vector: new Array(1536).fill(0), // Placeholder 1536-dim embedding
      model: this._model,
      version: this._modelVersion,
    };
  }

  /**
   * Store embedding in Qdrant
   */
  async _storeEmbedding(obj, embedding) {
    try {
      await this._qdrantClient.upsertPoint({
        collection_name: 'constitutional_objects',
        id: obj.id,
        vector: embedding.vector,
        payload: {
          object_id: obj.id,
          object_hash: obj.canonical_hash,
          object_kind: obj.kind,
          authority: obj.authority,
          model: embedding.model,
          version: embedding.version,
        },
      });
    } catch (error) {
      console.error(`[OllamaIntegration] Failed to store embedding for ${obj.id}:`, error.message);
    }
  }

  /**
   * Generate replay event for constitutional object
   */
  async _generateReplayEvent(obj) {
    try {
      await this._postgres.query(`
        INSERT INTO events (event_id, event_type, event_data, created_at)
        VALUES ($1, 'OLLAMA_GENERATION', $2, NOW())
      `, [deterministicIdAuthority.generateIdFromObject(obj), JSON.stringify(obj)]);
    } catch (error) {
      console.error(`[OllamaIntegration] Failed to generate replay event for ${obj.id}:`, error.message);
    }
  }

  /**
   * Generate witness for constitutional object
   */
  async _generateWitness(obj) {
    try {
      await this._postgres.query(`
        INSERT INTO knowledge_growth_witnesses (object_id, witness_data, created_at)
        VALUES ($1, $2, NOW())
      `, [obj.id, JSON.stringify({
        object_id: obj.id,
        object_hash: obj.canonical_hash,
        authority: obj.authority,
        witnessed_at: constitutionalTimeAuthority.now(),
      })]);
    } catch (error) {
      console.error(`[OllamaIntegration] Failed to generate witness for ${obj.id}:`, error.message);
    }
  }

  /**
   * Run complete constitutional knowledge accumulation pipeline
   * 
   * Repository
   *   ↓
   * Canonical Objects
   *   ↓
   * Canonical Graph
   *   ↓
   * Embeddings
   *   ↓
   * Qdrant
   * 
   * Ollama retrieves
   *   ↓
   * Produces new Constitutional Objects
   *   ↓
   * Replay
   *   ↓
   * Witness
   *   ↓
   * Stored forever
   */
  async runConstitutionalKnowledgeAccumulation(repoId, analysisTypes = ['reflection', 'mission', 'architecture']) {
    console.log(`[OllamaIntegration] Running constitutional knowledge accumulation for ${repoId}`);

    const results = [];

    for (const analysisType of analysisTypes) {
      // Retrieve constitutional objects
      const objects = await this.retrieveConstitutionalObjects(repoId);

      if (objects.length === 0) {
        console.log(`[OllamaIntegration] No objects found for ${analysisType} analysis`);
        continue;
      }

      // Analyze with Ollama
      const analysis = await this.analyzeConstitutionalObjects(objects, analysisType);

      if (!analysis.success) {
        console.error(`[OllamaIntegration] Analysis failed for ${analysisType}:`, analysis.error);
        continue;
      }

      // Constitutionalize new objects
      const constitutionalized = await this.constitutionalizeOllamaObjects(analysis.output_objects, repoId);

      results.push({
        analysis_type: analysisType,
        input_count: objects.length,
        output_count: constitutionalized.length,
        constitutionalized: constitutionalized.map(o => o.id),
      });
    }

    console.log(`[OllamaIntegration] Constitutional knowledge accumulation complete for ${repoId}`);
    return results;
  }
}

module.exports = { ConstitutionalOllamaIntegration };
