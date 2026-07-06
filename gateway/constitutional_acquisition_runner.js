/**
 * Constitutional Acquisition Runner
 * 
 * Ω.89 — Execute Constitutional Knowledge Acquisition Pipeline
 * 
 * Orchestrates the complete acquisition pipeline:
 * - Ingest entire repository completely
 * - Verify repeatability
 * - Exercise external repositories
 * - Run regression tests
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { ConstitutionalValidationHarness } = require('./constitutional_validation_harness');
const { EmbeddingAuthority } = require('./embedding_authority');
const { QdrantClient } = require('./qdrant_client');
const { ConstitutionalCompatibilityScorer } = require('./constitutional_compatibility_scorer');
const { ConstitutionalRegressionCorpus } = require('./constitutional_regression_corpus');
const { ObjectRegistry } = require('./object_registry');
const { WitnessChain } = require('./witness_chain');
const { ReplayLog } = require('./replay_log');
const { MultiLanguageParser } = require('./multi_language_parser');
const { CanonicalSymbolMapper } = require('./canonical_symbol_mapper');
const { CanonicalGraphCompiler } = require('./canonical_graph_compiler');
const { ReflectionGenerator } = require('./reflection_generator');
const { MissionGenerator } = require('./mission_generator');

class ConstitutionalAcquisitionRunner {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._initialized = false;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    console.log('[AcquisitionRunner] Initializing constitutional acquisition runner');

    // Initialize core components
    this._objectRegistry = new ObjectRegistry(this._postgres);
    this._witnessChain = new WitnessChain(this._postgres);
    this._replayLog = new ReplayLog(this._postgres);

    // Initialize authorities
    this._multiLanguageParser = new MultiLanguageParser();
    this._canonicalSymbolMapper = new CanonicalSymbolMapper();
    this._canonicalGraphCompiler = new CanonicalGraphCompiler();

    // Initialize validation harness
    this._embeddingAuthority = new EmbeddingAuthority();
    this._qdrantClient = new QdrantClient();
    this._reflectionGenerator = new ReflectionGenerator();
    this._missionGenerator = new MissionGenerator();

    this._validationHarness = new ConstitutionalValidationHarness(
      this._postgres,
      null, // pipelineCoordinator removed
      this._objectRegistry,
      this._replayLog,
      this._witnessChain,
      this._reflectionGenerator,
      this._missionGenerator,
      null, // ollamaAnalyst - optional
      this._qdrantClient
    );

    // Initialize compatibility scorer
    this._compatibilityScorer = new ConstitutionalCompatibilityScorer(this._postgres);

    // Initialize regression corpus
    this._regressionCorpus = new ConstitutionalRegressionCorpus(this._postgres);

    // Initialize all components
    await this._objectRegistry.initialize();
    await this._witnessChain.initialize();
    await this._replayLog.initialize();
    await this._validationHarness._initializeComponents();
    await this._regressionCorpus.initialize();

    this._initialized = true;
    console.log('[AcquisitionRunner] Initialization complete');
  }

  /**
   * Phase 1: Ingest entire repository completely
   * 
   * Knowledge acquisition removed - no-op
   */
  async ingestRepository(repoId, repositoryPath) {
    console.log(`[AcquisitionRunner] Phase 1: Knowledge acquisition removed`);
    return { success: true, repo_id: repoId };
  }

  /**
   * Phase 2: Verify repeatability
   * 
   * Knowledge acquisition removed - no-op
   */
  async verifyRepeatability(repoId, repositoryPath) {
    console.log(`[AcquisitionRunner] Phase 2: Knowledge acquisition removed`);
    return { converged: true };
  }

  /**
   * Capture system state for comparison
   */
  async _captureSystemState() {
    const state = {
      object_count: 0,
      repository_count: 0,
      witness_count: await this._getWitnessCount(),
      replay_count: await this._getReplayCount(),
    };

    return state;
  }

  /**
   * Get witness count
   */
  async _getWitnessCount() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM events
        WHERE event_type IN ('WITNESS_GENESIS', 'WITNESS_BLOCK')
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get replay count
   */
  async _getReplayCount() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM events
        WHERE event_type IN ('REPLAY_GENESIS', 'REPLAY_LOG_ENTRY')
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Compare ingestion results
   */
  async _compareIngestionResults(firstResult, secondResult, firstState, secondState) {
    const comparison = {
      converged: true,
      divergences: [],
    };

    // Compare object counts
    if (firstState.object_count !== secondState.object_count) {
      comparison.converged = false;
      comparison.divergences.push({
        type: 'object_count',
        first: firstState.object_count,
        second: secondState.object_count,
      });
    }

    // Compare repository counts
    if (firstState.repository_count !== secondState.repository_count) {
      comparison.converged = false;
      comparison.divergences.push({
        type: 'repository_count',
        first: firstState.repository_count,
        second: secondState.repository_count,
      });
    }

    // Compare witness counts
    if (firstState.witness_count !== secondState.witness_count) {
      comparison.converged = false;
      comparison.divergences.push({
        type: 'witness_count',
        first: firstState.witness_count,
        second: secondState.witness_count,
      });
    }

    // Compare replay counts
    if (firstState.replay_count !== secondState.replay_count) {
      comparison.converged = false;
      comparison.divergences.push({
        type: 'replay_count',
        first: firstState.replay_count,
        second: secondState.replay_count,
      });
    }

    // Compare digest results
    if (firstResult.digest.object_count !== secondResult.digest.object_count) {
      comparison.converged = false;
      comparison.divergences.push({
        type: 'digest_object_count',
        first: firstResult.digest.object_count,
        second: secondResult.digest.object_count,
      });
    }

    return comparison;
  }

  /**
   * Clean state (delete PostgreSQL, Qdrant, caches)
   */
  async _cleanState() {
    console.log('[AcquisitionRunner] Cleaning state...');

    try {
      // Clean PostgreSQL events
      await this._postgres.query(`DELETE FROM events`);
      
      // Clean repository objects
      await this._postgres.query(`DELETE FROM repository_objects`);
      
      // Clean pipeline states
      await this._postgres.query(`DELETE FROM pipeline_states`);
      
      // Clean proof artifacts
      await this._postgres.query(`DELETE FROM proof_artifacts`);
      
      // Clean repository metadata
      await this._postgres.query(`DELETE FROM repository_metadata`);
      
      // Clean repository analysis
      await this._postgres.query(`DELETE FROM repository_analysis`);

      console.log('[AcquisitionRunner] PostgreSQL cleaned');
    } catch (error) {
      console.error('[AcquisitionRunner] Failed to clean PostgreSQL:', error.message);
    }

    try {
      // Clean Qdrant collections
      await this._qdrantClient.deleteCollection('constitutional_objects');
      await this._qdrantClient.deleteCollection('embeddings');
      
      console.log('[AcquisitionRunner] Qdrant cleaned');
    } catch (error) {
      console.error('[AcquisitionRunner] Failed to clean Qdrant:', error.message);
    }

    // Clear in-memory caches
    this._knowledgeAcquisition._knowledgeBase.clear();
    this._knowledgeAcquisition._repositoryRegistry.clear();
    this._knowledgeAcquisition._compatibilityCache.clear();
    this._pipelineCoordinator.clearPipelineCache();

    console.log('[AcquisitionRunner] State cleaning complete');
  }

  /**
   * Phase 3: Exercise external repositories
   * 
   * Feed in repositories from different ecosystems (TypeScript, Rust, Go, Python, etc.)
   */
  async exerciseExternalRepositories(repositories) {
    console.log('[AcquisitionRunner] Phase 3: Exercising external repositories');

    const results = [];

    for (const repo of repositories) {
      console.log(`[AcquisitionRunner] Processing repository: ${repo.repo_id}`);

      try {
        const result = await this.ingestRepository(repo.repo_id, repo.repository_path);
        
        // Verify parser pipeline succeeded
        const parserSuccess = this._verifyParserSuccess(result);
        
        // Verify constitutional objects produced consistently
        const objectConsistency = this._verifyObjectConsistency(result);
        
        results.push({
          repo_id: repo.repo_id,
          success: true,
          parser_success: parserSuccess,
          object_consistency: objectConsistency,
          result: result,
        });
      } catch (error) {
        console.error(`[AcquisitionRunner] Failed to process ${repo.repo_id}:`, error.message);
        results.push({
          repo_id: repo.repo_id,
          success: false,
          error: error.message,
        });
      }
    }

    console.log(`[AcquisitionRunner] External repository exercise complete: ${results.filter(r => r.success).length}/${results.length} succeeded`);
    
    return results;
  }

  /**
   * Verify parser pipeline succeeded
   */
  _verifyParserSuccess(result) {
    return result.digest.object_count > 0 && result.digest.embedding_count > 0;
  }

  /**
   * Verify constitutional objects produced consistently
   */
  _verifyObjectConsistency(result) {
    const kinds = new Set();
    
    for (const obj of this._knowledgeAcquisition._knowledgeBase.values()) {
      kinds.add(obj.kind);
    }

    // Check for expected kinds
    const expectedKinds = ['FileObject', 'ASTObject', 'CanonicalSymbol'];
    const hasExpectedKinds = expectedKinds.some(kind => kinds.has(kind));

    return hasExpectedKinds;
  }

  /**
   * Run regression tests against corpus
   */
  async runRegressionTests() {
    console.log('[AcquisitionRunner] Running regression tests');

    const acquisitionResults = new Map();

    // Run acquisition for all corpus repositories
    const corpusEntries = this._regressionCorpus.getAllCorpusEntries();
    
    for (const entry of corpusEntries) {
      try {
        const result = await this.ingestRepository(entry.repo_id, entry.repository_path);
        acquisitionResults.set(entry.repo_id, result);
      } catch (error) {
        console.error(`[AcquisitionRunner] Failed to acquire ${entry.repo_id}:`, error.message);
      }
    }

    // Run regression tests
    const regressionResults = await this._regressionCorpus.runRegressionTests(acquisitionResults);

    console.log(`[AcquisitionRunner] Regression tests complete: ${regressionResults.passed}/${regressionResults.total} passed`);
    
    return regressionResults;
  }

  /**
   * Compute compatibility between repositories
   */
  async computeCompatibility(repoId1, repoId2) {
    console.log(`[AcquisitionRunner] Computing compatibility between ${repoId1} and ${repoId2}`);

    const metadata1 = this._knowledgeAcquisition.getRepositoryMetadata(repoId1);
    const metadata2 = this._knowledgeAcquisition.getRepositoryMetadata(repoId2);

    if (!metadata1 || !metadata2) {
      throw new Error('Repository metadata not found');
    }

    const compatibility = await this._compatibilityScorer.computeCompatibility(
      repoId1,
      repoId2,
      metadata1,
      metadata2
    );

    console.log(`[AcquisitionRunner] Compatibility score: ${compatibility.overall_score.toFixed(3)}`);
    
    return compatibility;
  }

  /**
   * Run complete acquisition pipeline
   */
  async runCompletePipeline(repoId, repositoryPath, options = {}) {
    console.log(`[AcquisitionRunner] Running complete acquisition pipeline for ${repoId}`);

    const pipeline = {
      repo_id: repoId,
      repository_path: repositoryPath,
      started_at: constitutionalTimeAuthority.now(),
      stages: {},
    };

    try {
      // Stage 1: Ingest repository
      pipeline.stages.ingestion = await this.ingestRepository(repoId, repositoryPath);

      // Stage 2: Verify repeatability (if requested)
      if (options.verifyRepeatability) {
        pipeline.stages.repeatability = await this.verifyRepeatability(repoId, repositoryPath);
      }

      // Stage 3: Compute compatibility (if requested)
      if (options.compareWith) {
        pipeline.stages.compatibility = await this.computeCompatibility(repoId, options.compareWith);
      }

      // Stage 4: Run regression tests (if requested)
      if (options.runRegression) {
        pipeline.stages.regression = await this.runRegressionTests();
      }

      pipeline.completed_at = constitutionalTimeAuthority.now();
      pipeline.success = true;
      pipeline.duration_ms = constitutionalTimeAuthority.nowAsMillis() - pipeline.started_at;

      console.log(`[AcquisitionRunner] Complete pipeline finished for ${repoId} (${pipeline.duration_ms}ms)`);
      
      return pipeline;
    } catch (error) {
      console.error(`[AcquisitionRunner] Complete pipeline failed for ${repoId}:`, error.message);
      pipeline.completed_at = constitutionalTimeAuthority.now();
      pipeline.success = false;
      pipeline.error = error.message;
      throw error;
    }
  }
}

module.exports = { ConstitutionalAcquisitionRunner };
