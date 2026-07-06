/**
 * Constitutional Mission Control
 * 
 * Ω.90 — Mission Control Integration
 * 
 * Mission Control dashboard for autonomous evolution of PING.
 * 
 * Displays:
 * - Newly discovered repositories
 * - Technology score
 * - Refactor opportunities
 * - Active acquisition missions
 * - Accepted architectural imports
 * - Rejected technologies with reasoning
 * - Trending ecosystem changes
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');

class ConstitutionalMissionControl {
  constructor(postgresPool, discoverySystem, technologyEvaluator, refactoringMissions) {
    this._postgres = postgresPool;
    this._discoverySystem = discoverySystem;
    this._technologyEvaluator = technologyEvaluator;
    this._refactoringMissions = refactoringMissions;
  }

  /**
   * Get Mission Control dashboard data
   * 
   * @returns {Object} Dashboard data
   */
  async getDashboardData() {
    console.log('[MissionControl] Getting dashboard data');

    const dashboard = {
      discovered_repositories: await this._getDiscoveredRepositories(),
      technology_scores: await this._getTechnologyScores(),
      refactor_opportunities: await this._getRefactorOpportunities(),
      active_missions: await this._getActiveMissions(),
      accepted_imports: await this._getAcceptedImports(),
      rejected_technologies: await this._getRejectedTechnologies(),
      trending_changes: await this._getTrendingChanges(),
      statistics: await this._getStatistics(),
      generated_at: constitutionalTimeAuthority.now(),
    };

    return dashboard;
  }

  /**
   * Get newly discovered repositories
   */
  async _getDiscoveredRepositories() {
    const queue = this._discoverySystem.getDiscoveryQueue(20);

    return queue.map(record => ({
      repo_id: record.repo_id,
      source: record.source,
      language: record.language,
      score: Math.round(record.score * 100),
      status: record.status,
      discovered_at: record.discovered_at,
      release: record.release,
      trending: record.trending,
    }));
  }

  /**
   * Get technology scores
   */
  async _getTechnologyScores() {
    const evaluations = await this._technologyEvaluator.getAllEvaluations();

    return evaluations.slice(0, 20).map(evaluation => ({
      repo_id: evaluation.repo_id,
      technology_score: this._computeTechnologyScore(evaluation),
      capabilities_count: evaluation.capabilities.new_capabilities.length,
      integration_decision: evaluation.integration_strategy.decision,
      evaluated_at: evaluation.evaluated_at,
    }));
  }

  /**
   * Compute technology score from evaluation
   */
  _computeTechnologyScore(evaluation) {
    let score = 0;

    // New capabilities
    score += evaluation.capabilities.new_capabilities.length * 20;

    // Superior implementation
    score += evaluation.ping_comparison.superior_implementation.length * 30;

    // Quality
    if (evaluation.quality_evaluation.can_be_simplified) {
      score += 10;
    }

    // Architectural patterns
    score += evaluation.capabilities.architectural_patterns.length * 15;

    // Normalize to 0-100
    return Math.min(100, score);
  }

  /**
   * Get refactor opportunities
   */
  async _getRefactorOpportunities() {
    const missions = await this._refactoringMissions.getMissionsByStatus('pending');

    return missions.slice(0, 20).map(mission => ({
      mission_id: mission.mission_id,
      type: mission.type,
      title: mission.title,
      repo_id: mission.repo_id,
      priority: mission.priority,
      expected_benefit: mission.expected_benefit,
      estimated_complexity: mission.estimated_complexity,
      created_at: mission.created_at,
    }));
  }

  /**
   * Get active missions
   */
  async _getActiveMissions() {
    const inProgress = await this._refactoringMissions.getMissionsByStatus('in_progress');

    return inProgress.map(mission => ({
      mission_id: mission.mission_id,
      type: mission.type,
      title: mission.title,
      repo_id: mission.repo_id,
      priority: mission.priority,
      status_updated_at: mission.status_updated_at,
      affected_authorities: mission.affected_authorities,
      affected_objects_count: mission.affected_constitutional_objects.length,
    }));
  }

  /**
   * Get accepted architectural imports
   */
  async _getAcceptedImports() {
    try {
      const result = await this._postgres.query(`
        SELECT evaluation
        FROM technology_evaluations
        WHERE evaluation->>'integration_strategy'->>'decision' IN ('adopt', 'merge', 'reuse', 'introduce')
        ORDER BY created_at DESC
        LIMIT 20
      `);

      return result.rows.map(row => {
        const evaluation = row.evaluation;
        const strategy = evaluation.integration_strategy;

        return {
          repo_id: evaluation.repo_id,
          decision: strategy.decision,
          expected_benefit: strategy.expected_benefit,
          affected_authorities: strategy.affected_authorities,
          accepted_at: evaluation.evaluated_at,
        };
      });
    } catch (error) {
      console.error('[MissionControl] Failed to get accepted imports:', error.message);
      return [];
    }
  }

  /**
   * Get rejected technologies with reasoning
   */
  async _getRejectedTechnologies() {
    try {
      const result = await this._postgres.query(`
        SELECT evaluation
        FROM technology_evaluations
        WHERE evaluation->>'integration_strategy'->>'decision' = 'ignore'
        ORDER BY created_at DESC
        LIMIT 20
      `);

      return result.rows.map(row => {
        const evaluation = row.evaluation;
        const strategy = evaluation.integration_strategy;

        return {
          repo_id: evaluation.repo_id,
          decision: strategy.decision,
          reasoning: strategy.reasoning,
          rejected_at: evaluation.evaluated_at,
        };
      });
    } catch (error) {
      console.error('[MissionControl] Failed to get rejected technologies:', error.message);
      return [];
    }
  }

  /**
   * Get trending ecosystem changes
   */
  async _getTrendingChanges() {
    const discoveryStats = this._discoverySystem.getDiscoveryStats();

    const trending = {
      by_language: discoveryStats.by_language,
      by_source: discoveryStats.by_source,
      total_discovered: discoveryStats.total_discovered,
      recent_discoveries: discoveryStats.queued,
    };

    return trending;
  }

  /**
   * Get statistics
   */
  async _getStatistics() {
    const discoveryStats = this._discoverySystem.getDiscoveryStats();
    const missionStats = this._refactoringMissions.getMissionStats();

    const stats = {
      discovery: discoveryStats,
      missions: missionStats,
      evaluation: {
        total_evaluated: await this._getTotalEvaluated(),
        accepted: await this._getAcceptedCount(),
        rejected: await this._getRejectedCount(),
      },
    };

    return stats;
  }

  /**
   * Get total evaluated count
   */
  async _getTotalEvaluated() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM technology_evaluations
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get accepted count
   */
  async _getAcceptedCount() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM technology_evaluations
        WHERE evaluation->>'integration_strategy'->>'decision' IN ('adopt', 'merge', 'reuse', 'introduce', 'replace', 'improve')
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get rejected count
   */
  async _getRejectedCount() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM technology_evaluations
        WHERE evaluation->>'integration_strategy'->>'decision' = 'ignore'
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(repoId) {
    const evaluation = await this._technologyEvaluator.getEvaluation(repoId);
    const discoveryRecord = this._discoveryQueue.get(repoId);
    const missions = await this._refactoringMissions.getAllMissions().then(missions =>
      missions.filter(m => m.repo_id === repoId)
    );

    return {
      repo_id: repoId,
      evaluation: evaluation,
      discovery: discoveryRecord,
      missions: missions,
    };
  }

  /**
   * Get mission details
   */
  async getMissionDetails(missionId) {
    const mission = await this._refactoringMissions.getMission(missionId);

    if (!mission) {
      return null;
    }

    const evaluation = await this._technologyEvaluator.getEvaluation(mission.repo_id);

    return {
      mission: mission,
      evaluation: evaluation,
    };
  }

  /**
   * Update mission status
   */
  async updateMissionStatus(missionId, status, metadata = {}) {
    await this._refactoringMissions.updateMissionStatus(missionId, status, metadata);
    return await this.getMissionDetails(missionId);
  }

  /**
   * Run complete acquisition pipeline for discovered repository
   */
  async runAcquisitionPipeline(repoId, repositoryPath) {
    console.log(`[MissionControl] Running acquisition pipeline for ${repoId}`);

    // Update discovery status
    await this._discoverySystem.updateDiscoveryStatus(repoId, 'processing');

    try {
      // Evaluate repository
      const evaluation = await this._technologyEvaluator.evaluateRepository(
        repoId,
        repositoryPath,
        this._discoveryQueue.get(repoId)
      );

      // Generate missions
      const missions = await this._refactoringMissions.generateMissionsFromEvaluation(evaluation);

      // Update discovery status
      await this._discoverySystem.updateDiscoveryStatus(repoId, 'completed', {
        evaluation_id: evaluation.repo_id,
        mission_count: missions.length,
      });

      return {
        success: true,
        evaluation: evaluation,
        missions: missions,
      };
    } catch (error) {
      console.error(`[MissionControl] Acquisition pipeline failed for ${repoId}:`, error.message);
      await this._discoverySystem.updateDiscoveryStatus(repoId, 'failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Process next discovery from queue
   */
  async processNextDiscovery() {
    const discovery = this._discoverySystem.getNextDiscovery();

    if (!discovery) {
      return {
        success: false,
        message: 'No discoveries in queue',
      };
    }

    console.log(`[MissionControl] Processing next discovery: ${discovery.repo_id}`);

    // Clone repository (placeholder)
    const repositoryPath = `./temp/${discovery.repo_id}`;

    // Run acquisition pipeline
    const result = await this.runAcquisitionPipeline(discovery.repo_id, repositoryPath);

    return result;
  }

  /**
   * Process multiple discoveries from queue
   */
  async processDiscoveryQueue(limit = 10) {
    console.log(`[MissionControl] Processing discovery queue (limit: ${limit})`);

    const results = [];
    const queue = this._discoverySystem.getDiscoveryQueue(limit);

    for (const discovery of queue) {
      if (discovery.status !== 'queued') {
        continue;
      }

      try {
        const result = await this.processNextDiscovery();
        results.push(result);
      } catch (error) {
        console.error(`[MissionControl] Failed to process ${discovery.repo_id}:`, error.message);
        results.push({
          success: false,
          repo_id: discovery.repo_id,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = { ConstitutionalMissionControl };
