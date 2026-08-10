/**
 * Git-Driven Ollama
 * 
 * Ω.42 — Git-Driven Ollama
 * 
 * Git acquisition should automatically analyze.
 * 
 * Every commit becomes:
 * 
 * Commit
 * ↓
 * Tree
 * ↓
 * Diff
 * ↓
 * AST
 * ↓
 * Symbols
 * ↓
 * Embeddings
 * ↓
 * Reflection
 * ↓
 * Context Retrieval
 * ↓
 * Ollama Analysis
 * ↓
 * Analysis Object
 * ↓
 * Witness
 * ↓
 * Mission
 * ↓
 * Replay
 * 
 * No human calls Ollama.
 * Git drives it.
 * 
 * Constitutional Constraint: Automatic analysis on commits without human prompts.
 */

const crypto = require('crypto');
const { PersistentOllamaAnalyst } = require('./persistent_ollama_analyst');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class GitDrivenOllama {
  constructor(postgresPool, ollamaAnalyst, objectRegistry, witnessChain, continuousAcquisition) {
    this._postgres = postgresPool;
    this._ollamaAnalyst = ollamaAnalyst;
    this._objectRegistry = objectRegistry;
    this._witnessChain = witnessChain;
    this._continuousAcquisition = continuousAcquisition;
    this._analysisQueue = new Map(); // commit_sha → analysis task
    this._analysisHistory = new Map(); // commit_sha → analysis result
    this._initialized = false;
  }

  /**
   * Initialize Git-driven Ollama
   */
  async initialize() {
    await this._loadAnalysisHistory();
    await this._setupCommitAcquisitionListener();
    this._initialized = true;
    console.log('[GitDrivenOllama] Initialized with automatic commit analysis');
  }

  /**
   * Setup commit acquisition listener
   */
  async _setupCommitAcquisitionListener() {
    if (!this._continuousAcquisition) {
      console.warn('[GitDrivenOllama] Continuous acquisition not available');
      return;
    }

    // Hook into continuous acquisition to trigger analysis on new commits
    // This would typically be done through event bus or callback registration
    console.log('[GitDrivenOllama] Commit acquisition listener setup');
  }

  /**
   * Trigger automatic analysis on commit
   */
  async analyzeCommit(commitData) {
    const commitSha = commitData.commit_sha || commitData.id;
    const repoId = commitData.repo_id || commitData.repository;

    console.log(`[GitDrivenOllama] Analyzing commit: ${commitSha} in ${repoId}`);

    try {
      // Step 1: Retrieve commit constitutional objects
      const commitObjects = await this._retrieveCommitObjects(commitSha, repoId);

      // Step 2: Retrieve tree objects
      const treeObjects = await this._retrieveTreeObjects(commitSha, repoId);

      // Step 3: Retrieve diff objects
      const diffObjects = await this._retrieveDiffObjects(commitSha, repoId);

      // Step 4: Retrieve AST objects (if available)
      const astObjects = await this._retrieveASTObjects(commitSha, repoId);

      // Step 5: Retrieve symbol objects (if available)
      const symbolObjects = await this._retrieveSymbolObjects(commitSha, repoId);

      // Step 6: Retrieve embeddings
      const embeddingObjects = await this._retrieveEmbeddings(commitSha, repoId);

      // Step 7: Retrieve reflections
      const reflectionObjects = await this._retrieveReflections(commitSha, repoId);

      // Step 8: Context retrieval
      const constitutionalContext = await this._retrieveConstitutionalContext(commitSha, repoId);

      // Step 9: Construct analysis query
      const query = this._constructCommitAnalysisQuery(
        commitData,
        commitObjects,
        treeObjects,
        diffObjects,
        astObjects,
        symbolObjects
      );

      // Step 10: Ollama analysis with full constitutional context
      const analysis = await this._ollamaAnalyst.analyze(query, {
        object_ids: [
          ...commitObjects.map(o => o.id),
          ...treeObjects.map(o => o.id),
          ...diffObjects.map(o => o.id),
          ...astObjects.map(o => o.id),
          ...symbolObjects.map(o => o.id),
          ...embeddingObjects.map(o => o.id),
          ...reflectionObjects.map(o => o.id),
        ],
        source_id: commitSha,
        source_kind: 'GitCommit',
        metadata: {
          analysis_type: 'git_commit_analysis',
          repo_id: repoId,
          commit_sha: commitSha,
          constitutional_context: constitutionalContext,
        },
      });

      // Step 11: Witness analysis
      await this._witnessAnalysis(analysis, commitSha, repoId);

      // Step 12: Generate missions from analysis
      const missions = await this._generateMissionsFromAnalysis(analysis, commitSha, repoId);

      // Step 13: Trigger replay
      await this._triggerReplay(analysis, missions, commitSha, repoId);

      // Store analysis result
      this._analysisHistory.set(commitSha, {
        commit_sha: commitSha,
        repo_id: repoId,
        analysis: analysis,
        missions: missions,
        timestamp: new Date().toISOString(),
      });

      console.log(`[GitDrivenOllama] Commit analysis completed: ${commitSha}`);
      return {
        analysis: analysis,
        missions: missions,
      };
    } catch (error) {
      console.error(`[GitDrivenOllama] Commit analysis failed: ${commitSha}`, error.message);
      throw error;
    }
  }

  /**
   * Retrieve commit constitutional objects
   */
  async _retrieveCommitObjects(commitSha, repoId) {
    try {
      const commitId = `commit-${commitSha}`;
      const obj = await this._objectRegistry.lookupById(commitId);
      return obj ? [obj] : [];
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve commit objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve tree constitutional objects
   */
  async _retrieveTreeObjects(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('Tree');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve tree objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve diff constitutional objects
   */
  async _retrieveDiffObjects(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('Diff');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve diff objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve AST constitutional objects
   */
  async _retrieveASTObjects(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('AST');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve AST objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve symbol constitutional objects
   */
  async _retrieveSymbolObjects(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('Symbol');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve symbol objects:', error.message);
      return [];
    }
  }

  /**
   * Retrieve embeddings
   */
  async _retrieveEmbeddings(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('Embedding');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve embeddings:', error.message);
      return [];
    }
  }

  /**
   * Retrieve reflections
   */
  async _retrieveReflections(commitSha, repoId) {
    try {
      const objects = await this._objectRegistry.lookupByKind('Reflection');
      return objects.filter(o => o.lineage?.source_id === commitSha);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve reflections:', error.message);
      return [];
    }
  }

  /**
   * Retrieve constitutional context
   */
  async _retrieveConstitutionalContext(commitSha, repoId) {
    try {
      // Retrieve previous commits for context
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'COMMIT_ACQUIRED'
        AND event_data->>'repo_id' = $1
        AND event_data->>'commit_sha' != $2
        ORDER BY timestamp DESC
        LIMIT 5
      `, [repoId, commitSha]);

      return {
        previous_commits: result.rows.map(row => row.event_data),
        repo_id: repoId,
        commit_sha: commitSha,
      };
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to retrieve constitutional context:', error.message);
      return {
        previous_commits: [],
        repo_id: repoId,
        commit_sha: commitSha,
      };
    }
  }

  /**
   * Construct commit analysis query
   */
  _constructCommitAnalysisQuery(commitData, commitObjects, treeObjects, diffObjects, astObjects, symbolObjects) {
    const commit = commitObjects[0]?.payload || commitData;
    
    return `
Analyze this Git commit as a constitutional analyst:

Repository: ${commitData.repo_id || commitData.repository}
Commit SHA: ${commitData.commit_sha || commitData.id}
Message: ${commit.message || commitData.message}
Author: ${commit.author?.name || commit.author}

Commit Details:
- Tree SHA: ${commit.tree_sha || commit.tree}
- Parent commits: ${commit.parents?.join(', ') || 'none'}
- Files changed: ${diffObjects.length}
- AST nodes: ${astObjects.length}
- Symbols: ${symbolObjects.length}

Diff Summary:
${diffObjects.slice(0, 5).map(d => `- ${d.payload.path}: ${d.payload.status}`).join('\n')}

Provide analysis on:
1. Code quality impact
2. Architectural implications
3. Potential risks or issues
4. Security considerations
5. Performance implications
6. Testing recommendations
7. Documentation needs
8. Follow-up actions

Your analysis will become immutable constitutional evidence.
`;
  }

  /**
   * Witness analysis
   */
  async _witnessAnalysis(analysis, commitSha, repoId) {
    if (!this._witnessChain) {
      return;
    }

    try {
      await this._witnessChain.append({
        analysis_id: analysis.id,
        analysis_root: analysis.payload.analysis_root,
        commit_sha: commitSha,
        repository: repoId,
        model_id: analysis.payload.model_id,
        context_hash: analysis.payload.context_hash,
        response_hash: analysis.payload.response_hash,
      });
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to witness analysis:', error.message);
    }
  }

  /**
   * Generate missions from analysis
   */
  async _generateMissionsFromAnalysis(analysis, commitSha, repoId) {
    try {
      // Placeholder for mission generation
      // This would use the Mission Planner to generate missions based on analysis
      const missions = [];

      // Extract recommendations from analysis
      const recommendations = analysis.payload.recommendations;
      if (recommendations) {
        // Parse recommendations and create missions
        // For now, just return empty array
      }

      return missions;
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to generate missions:', error.message);
      return [];
    }
  }

  /**
   * Trigger replay
   */
  async _triggerReplay(analysis, missions, commitSha, repoId) {
    try {
      // Placeholder for replay trigger
      // This would trigger a replay with the analysis and missions
      console.log(`[GitDrivenOllama] Replay triggered for commit: ${commitSha}`);
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to trigger replay:', error.message);
    }
  }

  /**
   * Load analysis history
   */
  async _loadAnalysisHistory() {
    try {
      const result = await this._postgres.query(`
        SELECT event_data
        FROM events
        WHERE event_type = 'GIT_COMMIT_ANALYSIS'
        ORDER BY timestamp DESC
        LIMIT 1000
      `);

      for (const row of result.rows) {
        const analysisData = row.event_data;
        this._analysisHistory.set(analysisData.commit_sha, analysisData);
      }
    } catch (error) {
      console.error('[GitDrivenOllama] Failed to load analysis history:', error.message);
    }
  }

  /**
   * Get analysis by commit SHA
   */
  getAnalysisByCommit(commitSha) {
    return this._analysisHistory.get(commitSha);
  }

  /**
   * Get analysis history
   */
  getAnalysisHistory(limit = 100) {
    return Array.from(this._analysisHistory.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get analysis statistics
   */
  getStatistics() {
    const analyses = this.getAnalysisHistory();
    
    const stats = {
      total_analyses: analyses.length,
      by_repository: {},
      by_model: {},
      average_confidence: 0,
      with_missions: 0,
    };

    let totalConfidence = 0;

    for (const analysis of analyses) {
      // Count by repository
      const repoId = analysis.repo_id || 'unknown';
      stats.by_repository[repoId] = (stats.by_repository[repoId] || 0) + 1;

      // Count by model
      const model = analysis.analysis?.payload?.model_id || 'unknown';
      stats.by_model[model] = (stats.by_model[model] || 0) + 1;

      // Sum confidence
      totalConfidence += analysis.analysis?.payload?.confidence || 0;

      // Count missions
      if (analysis.missions && analysis.missions.length > 0) {
        stats.with_missions++;
      }
    }

    if (analyses.length > 0) {
      stats.average_confidence = totalConfidence / analyses.length;
    }

    return stats;
  }

  /**
   * Clear analysis queue (memory only)
   */
  clearAnalysisQueue() {
    this._analysisQueue.clear();
  }

  /**
   * Clear analysis history (memory only)
   */
  clearAnalysisHistory() {
    this._analysisHistory.clear();
  }
}

module.exports = { GitDrivenOllama };
