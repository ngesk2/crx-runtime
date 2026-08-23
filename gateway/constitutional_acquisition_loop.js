/**
 * Constitutional Acquisition Loop
 * 
 * Ω.89 — Constitutional Acquisition Loop
 * 
 * Repository
 *   │
 *   ▼
 * Constitutionalize
 *   │
 *   ▼
 * Replay
 *   │
 *   ▼
 * Witness
 *   │
 *   ▼
 * Embed
 *   │
 *   ▼
 * Compare against every previous repository
 *   │
 *   ▼
 * Structured Report:
 *   - Compatibility Score
 *   - Reusable Components
 *   - Authority Reuse
 *   - Mission Suggestions
 *   - Architectural Drift
 *   - Missing Compiler Stages
 *   - Replay Risks
 *   - Canonical Violations
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { ConstitutionalKnowledgeAcquisition } = require('./constitutional_knowledge_acquisition');
const { ConstitutionalCompatibilityScorer } = require('./constitutional_compatibility_scorer');
const { ConstitutionalOllamaIntegration } = require('./constitutional_ollama_integration');

class ConstitutionalAcquisitionLoop {
  constructor(postgresPool, knowledgeAcquisition, compatibilityScorer, ollamaIntegration) {
    this._postgres = postgresPool;
    this._knowledgeAcquisition = knowledgeAcquisition;
    this._compatibilityScorer = compatibilityScorer;
    this._ollamaIntegration = ollamaIntegration;
    this._previousRepositories = new Map(); // repo_id → metadata
  }

  /**
   * Load previous repositories from PostgreSQL
   */
  async loadPreviousRepositories() {
    try {
      const result = await this._postgres.query(`
        SELECT repo_id, metadata
        FROM repository_metadata
      `);

      for (const row of result.rows) {
        this._previousRepositories.set(row.repo_id, row.metadata);
      }

      console.log(`[AcquisitionLoop] Loaded ${this._previousRepositories.size} previous repositories`);
    } catch (error) {
      console.error('[AcquisitionLoop] Failed to load previous repositories:', error.message);
    }
  }

  /**
   * Run constitutional acquisition loop for a new repository
   * 
   * @param {string} repoId - Repository ID
   * @param {string} repositoryPath - Repository path
   * @returns {Object} Structured report
   */
  async runAcquisitionLoop(repoId, repositoryPath) {
    console.log(`[AcquisitionLoop] Running constitutional acquisition loop for ${repoId}`);

    const startTime = constitutionalTimeAuthority.nowAsMillis();
    const loopId = deterministicIdAuthority.generateIdFromObject({ repoId, timestamp: startTime });

    const report = {
      loop_id: loopId,
      repo_id: repoId,
      repository_path: repositoryPath,
      started_at: constitutionalTimeAuthority.now(),
      stages: {},
    };

    try {
      // Stage 1: Constitutionalize
      console.log('[AcquisitionLoop] Stage 1: Constitutionalize');
      report.stages.constitutionalize = await this._constitutionalize(repoId, repositoryPath);

      // Stage 2: Replay
      console.log('[AcquisitionLoop] Stage 2: Replay');
      report.stages.replay = await this._replay(repoId);

      // Stage 3: Witness
      console.log('[AcquisitionLoop] Stage 3: Witness');
      report.stages.witness = await this._witness(repoId);

      // Stage 4: Embed
      console.log('[AcquisitionLoop] Stage 4: Embed');
      report.stages.embed = await this._embed(repoId);

      // Stage 5: Compare against every previous repository
      console.log('[AcquisitionLoop] Stage 5: Compare');
      report.stages.compare = await this._compare(repoId);

      // Stage 6: Generate structured report
      console.log('[AcquisitionLoop] Stage 6: Generate Report');
      report.stages.report = await this._generateStructuredReport(repoId, report.stages);

      // Add to previous repositories
      const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);
      if (metadata) {
        this._previousRepositories.set(repoId, metadata);
      }

      report.completed_at = constitutionalTimeAuthority.now();
      report.success = true;
      report.duration_ms = constitutionalTimeAuthority.nowAsMillis() - startTime;

      console.log(`[AcquisitionLoop] Acquisition loop complete for ${repoId} (${report.duration_ms}ms)`);
      return report;
    } catch (error) {
      console.error(`[AcquisitionLoop] Acquisition loop failed for ${repoId}:`, error.message);
      report.completed_at = constitutionalTimeAuthority.now();
      report.success = false;
      report.error = error.message;
      throw error;
    }
  }

  /**
   * Stage 1: Constitutionalize
   */
  async _constitutionalize(repoId, repositoryPath) {
    const result = await this._knowledgeAcquisition.digestRepository(repoId, repositoryPath);
    await this._knowledgeAcquisition.buildKnowledgeBase();
    await this._knowledgeAcquisition.analyzeRepositoryUnderstanding(repoId);

    return {
      success: true,
      object_count: result.object_count,
      embedding_count: result.embedding_count,
      validation: result.validation,
    };
  }

  /**
   * Stage 2: Replay
   */
  async _replay(repoId) {
    // Replay is handled automatically during constitutionalization
    // This stage verifies replay determinism
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);

    return {
      success: true,
      replay_root: metadata?.validation_results?.replay_root || null,
      replay_hashes: metadata?.validation_results?.replay_hashes || [],
      replay_deterministic: metadata?.validation_results?.validation?.replay_deterministic || false,
    };
  }

  /**
   * Stage 3: Witness
   */
  async _witness(repoId) {
    // Witness is handled automatically during constitutionalization
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);

    return {
      success: true,
      witness_root: metadata?.validation_results?.witness_root || null,
      witness_hashes: metadata?.validation_results?.witness_hashes || [],
      witness_deterministic: metadata?.validation_results?.validation?.witness_deterministic || false,
    };
  }

  /**
   * Stage 4: Embed
   */
  async _embed(repoId) {
    // Embeddings are handled automatically during constitutionalization
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);

    return {
      success: true,
      embedding_count: metadata?.embedding_count || 0,
      embedding_root: metadata?.validation_results?.embedding_root || null,
    };
  }

  /**
   * Stage 5: Compare against every previous repository
   */
  async _compare(repoId) {
    const comparisons = [];
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);

    if (!metadata) {
      return {
        success: false,
        error: 'Repository metadata not found',
        comparisons: [],
      };
    }

    for (const [prevRepoId, prevMetadata] of this._previousRepositories) {
      if (prevRepoId === repoId) continue;

      try {
        const compatibility = await this._compatibilityScorer.computeCompatibility(
          repoId,
          prevRepoId,
          metadata,
          prevMetadata
        );

        comparisons.push({
          repo_id: prevRepoId,
          compatibility: compatibility,
        });
      } catch (error) {
        console.error(`[AcquisitionLoop] Failed to compare with ${prevRepoId}:`, error.message);
      }
    }

    return {
      success: true,
      comparisons: comparisons,
      total_comparisons: comparisons.length,
    };
  }

  /**
   * Stage 6: Generate structured report
   */
  async _generateStructuredReport(repoId, stages) {
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);
    const compareStage = stages.compare;

    // Aggregate compatibility scores
    const compatibilityScores = compareStage.comparisons.map(c => c.compatibility.overall);
    const avgCompatibility = compatibilityScores.length > 0
      ? compatibilityScores.reduce((a, b) => a + b, 0) / compatibilityScores.length
      : 0;

    // Find best match
    const bestMatch = compareStage.comparisons.length > 0
      ? compareStage.comparisons.reduce((best, current) =>
          current.compatibility.overall > best.compatibility.overall ? current : best
        )
      : null;

    // Aggregate evidence
    const aggregatedEvidence = this._aggregateEvidence(compareStage.comparisons);

    // Generate mission suggestions
    const missionSuggestions = await this._generateMissionSuggestions(repoId, compareStage.comparisons);

    const structuredReport = {
      repository: {
        repo_id: repoId,
        object_count: stages.constitutionalize.object_count,
        embedding_count: stages.constitutionalize.embedding_count,
      },

      constitutionalization: {
        success: stages.constitutionalize.success,
        validation: stages.constitutionalize.validation,
      },

      replay: {
        success: stages.replay.success,
        replay_root: stages.replay.replay_root,
        deterministic: stages.replay.replay_deterministic,
      },

      witness: {
        success: stages.witness.success,
        witness_root: stages.witness.witness_root,
        deterministic: stages.witness.witness_deterministic,
      },

      embedding: {
        success: stages.embed.success,
        embedding_count: stages.embed.embedding_count,
      },

      compatibility: {
        total_comparisons: compareStage.total_comparisons,
        average_compatibility: Math.round(avgCompatibility),
        best_match: bestMatch ? {
          repo_id: bestMatch.repo_id,
          score: bestMatch.compatibility.overall,
          breakdown: bestMatch.compatibility.compatibility,
        } : null,
        all_comparisons: compareStage.comparisons.map(c => ({
          repo_id: c.repo_id,
          score: c.compatibility.overall,
          breakdown: c.compatibility.compatibility,
        })),
      },

      evidence: aggregatedEvidence,

      mission_suggestions: missionSuggestions,

      architectural_drift: aggregatedEvidence.architectural_drift || [],
      missing_compiler_stages: aggregatedEvidence.missing_compiler_stages || [],
      replay_risks: aggregatedEvidence.replay_risks || [],
      canonical_violations: aggregatedEvidence.canonical_violations || [],

      generated_at: constitutionalTimeAuthority.now(),
    };

    return structuredReport;
  }

  /**
   * Aggregate evidence from comparisons
   */
  _aggregateEvidence(comparisons) {
    const aggregated = {
      graph_isomorphism: [],
      architectural_motifs: [],
      reusable_components: [],
      authority_reuse_details: [],
      mission_suggestions: [],
      architectural_drift: [],
      missing_compiler_stages: [],
      replay_risks: [],
      canonical_violations: [],
    };

    for (const comparison of comparisons) {
      const evidence = comparison.compatibility.evidence;

      if (evidence.graph_isomorphism) {
        aggregated.graph_isomorphism.push({
          repo_id: comparison.repo_id,
          ...evidence.graph_isomorphism,
        });
      }

      if (evidence.architectural_motifs) {
        aggregated.architectural_motifs.push({
          repo_id: comparison.repo_id,
          motifs: evidence.architectural_motifs,
        });
      }

      if (evidence.reusable_components) {
        aggregated.reusable_components.push({
          repo_id: comparison.repo_id,
          components: evidence.reusable_components,
        });
      }

      if (evidence.authority_reuse_details) {
        aggregated.authority_reuse_details.push({
          repo_id: comparison.repo_id,
          details: evidence.authority_reuse_details,
        });
      }

      if (evidence.architectural_drift) {
        aggregated.architectural_drift.push({
          repo_id: comparison.repo_id,
          drift: evidence.architectural_drift,
        });
      }

      if (evidence.missing_compiler_stages) {
        aggregated.missing_compiler_stages.push({
          repo_id: comparison.repo_id,
          stages: evidence.missing_compiler_stages,
        });
      }

      if (evidence.replay_risks) {
        aggregated.replay_risks.push({
          repo_id: comparison.repo_id,
          risks: evidence.replay_risks,
        });
      }

      if (evidence.canonical_violations) {
        aggregated.canonical_violations.push({
          repo_id: comparison.repo_id,
          violations: evidence.canonical_violations,
        });
      }
    }

    return aggregated;
  }

  /**
   * Generate mission suggestions based on comparisons
   */
  async _generateMissionSuggestions(repoId, comparisons) {
    const suggestions = [];

    // Aggregate suggestions from all comparisons
    for (const comparison of comparisons) {
      const evidence = comparison.compatibility.evidence;

      if (evidence.mission_suggestions) {
        for (const suggestion of evidence.mission_suggestions) {
          suggestions.push({
            ...suggestion,
            source_repo: comparison.repo_id,
          });
        }
      }
    }

    // Add suggestions based on aggregated evidence
    if (comparisons.length === 0) {
      suggestions.push({
        type: 'first_repository',
        priority: 'low',
        description: 'First repository in the knowledge base - no comparisons available',
      });
    }

    return suggestions;
  }

  /**
   * Run Ollama constitutional knowledge accumulation after acquisition loop
   */
  async runOllamaAccumulation(repoId) {
    console.log(`[AcquisitionLoop] Running Ollama constitutional knowledge accumulation for ${repoId}`);

    const results = await this._ollamaIntegration.runConstitutionalKnowledgeAccumulation(repoId);

    return results;
  }

  /**
   * Run complete acquisition loop with Ollama accumulation
   */
  async runCompleteLoop(repoId, repositoryPath, options = {}) {
    console.log(`[AcquisitionLoop] Running complete acquisition loop for ${repoId}`);

    // Load previous repositories
    await this.loadPreviousRepositories();

    // Run acquisition loop
    const loopReport = await this.runAcquisitionLoop(repoId, repositoryPath);

    // Run Ollama accumulation (if requested)
    if (options.runOllamaAccumulation) {
      loopReport.ollama_accumulation = await this.runOllamaAccumulation(repoId);
    }

    // Run knowledge growth (if requested)
    if (options.runKnowledgeGrowth) {
      loopReport.knowledge_growth = await this._knowledgeAcquisition.growKnowledge();
    }

    return loopReport;
  }

  /**
   * Get previous repositories
   */
  getPreviousRepositories() {
    return Array.from(this._previousRepositories.keys());
  }

  /**
   * Clear previous repositories cache
   */
  clearPreviousRepositories() {
    this._previousRepositories.clear();
  }
}

module.exports = { ConstitutionalAcquisitionLoop };
