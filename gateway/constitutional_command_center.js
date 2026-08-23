/**
 * Constitutional Command Center
 * 
 * Ω.90 — Command Center (formerly Mission Control)
 * 
 * The constitutional brain of the system.
 * 
 * Dashboard displays:
 * 🔍 New GitHub releases since last scan
 * 🧠 Top architectural discoveries
 * 🔄 Recommended refactors
 * 🗑 Code that can be deleted
 * 🏗 Authorities that should be merged
 * ⚙ Compiler stages that should be introduced
 * 📊 Replay risk analysis
 * 🤖 Ready-to-run Devin implementation prompts
 * ✅ Accepted imports
 * ❌ Rejected technologies with constitutional reasoning
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');

class ConstitutionalCommandCenter {
  constructor(postgresPool, discoverySystem, ecosystemIntelligence, technologyEvaluator, gapAnalysis, refactoringMissions, devinGenerator, githubWatcher, rfcGenerator, missionQueue, replaySandbox) {
    this._postgres = postgresPool;
    this._discoverySystem = discoverySystem;
    this._ecosystemIntelligence = ecosystemIntelligence;
    this._technologyEvaluator = technologyEvaluator;
    this._gapAnalysis = gapAnalysis;
    this._refactoringMissions = refactoringMissions;
    this._devinGenerator = devinGenerator;
    this._githubWatcher = githubWatcher;
    this._rfcGenerator = rfcGenerator;
    this._missionQueue = missionQueue;
    this._replaySandbox = replaySandbox;
  }

  /**
   * Get Command Center dashboard data
   * 
   * @returns {Object} Dashboard data
   */
  async getDashboardData() {
    console.log('[CommandCenter] Getting Command Center dashboard data');

    const dashboard = {
      new_github_releases: await this._getNewGitHubReleases(),
      top_architectural_discoveries: await this._getTopArchitecturalDiscoveries(),
      recommended_refactors: await this._getRecommendedRefactors(),
      deletable_code: await this._getDeletableCode(),
      mergeable_authorities: await this._getMergeableAuthorities(),
      introducible_compiler_stages: await this._getIntroducibleCompilerStages(),
      replay_risk_analysis: await this._getReplayRiskAnalysis(),
      devin_prompts: await this._getDevinPrompts(),
      accepted_imports: await this._getAcceptedImports(),
      rejected_technologies: await this._getRejectedTechnologies(),
      statistics: await this._getStatistics(),
      generated_at: constitutionalTimeAuthority.now(),
    };

    return dashboard;
  }

  /**
   * Get new GitHub releases since last scan
   */
  async _getNewGitHubReleases() {
    try {
      const result = await this._postgres.query(`
        SELECT release_data
        FROM processed_releases
        WHERE processed_at > NOW() - INTERVAL '7 days'
        ORDER BY processed_at DESC
        LIMIT 20
      `);

      return result.rows.map(row => {
        const release = row.release_data;
        return {
          repo_id: `${release.owner}/${release.name}`,
          tag_name: release.tag_name,
          published_at: release.published_at,
          description: release.description,
          category: release.category,
        };
      });
    } catch (error) {
      console.error('[CommandCenter] Failed to get new GitHub releases:', error.message);
      return [];
    }
  }

  /**
   * Get top architectural discoveries
   */
  async _getTopArchitecturalDiscoveries() {
    const discoveries = await this._ecosystemIntelligence.getTopDiscoveries(20);

    return discoveries.filter(d => d.category === 'compiler_frameworks' || d.category === 'replay_engines').slice(0, 10);
  }

  /**
   * Get recommended refactors
   */
  async _getRecommendedRefactors() {
    const missions = await this._refactoringMissions.getMissionsByStatus('pending');

    return missions.slice(0, 20).map(mission => ({
      mission_id: mission.mission_id,
      type: mission.type,
      title: mission.title,
      repo_id: mission.repo_id,
      priority: mission.priority,
      expected_benefit: mission.expected_benefit,
      estimated_complexity: mission.estimated_complexity,
      philosophy: mission.metadata?.philosophy || 'unknown',
      created_at: mission.created_at,
    }));
  }

  /**
   * Get code that can be deleted
   */
  async _getDeletableCode() {
    try {
      const result = await this._postgres.query(`
        SELECT gap_analysis
        FROM constitutional_gap_analysis
        ORDER BY gap_analysis->>'overall_gap_score' DESC
        LIMIT 20
      `);

      const deletable = [];
      for (const row of result.rows) {
        const gaps = row.gap_analysis;
        
        for (const removal of gaps.code_removal_opportunities) {
          deletable.push({
            repo_id: gaps.repo_id,
            capability: removal.capability,
            authority: removal.authority,
            estimated_loc_removed: removal.estimated_loc_removed,
            ping_object_id: removal.ping_object_id,
          });
        }

        for (const elimination of gaps.subsystem_eliminations) {
          deletable.push({
            repo_id: gaps.repo_id,
            subsystem: elimination.subsystem,
            estimated_loc_removed: elimination.estimated_loc_removed,
            reason: elimination.reason,
          });
        }
      }

      return deletable.slice(0, 20);
    } catch (error) {
      console.error('[CommandCenter] Failed to get deletable code:', error.message);
      return [];
    }
  }

  /**
   * Get authorities that should be merged
   */
  async _getMergeableAuthorities() {
    const missions = await this._refactoringMissions.getMissionsByStatus('pending');

    return missions
      .filter(m => m.type === 'merge')
      .slice(0, 10)
      .map(mission => ({
        mission_id: mission.mission_id,
        repo_id: mission.repo_id,
        title: mission.title,
        affected_authorities: mission.affected_authorities,
        expected_benefit: mission.expected_benefit,
      }));
  }

  /**
   * Get compiler stages that should be introduced
   */
  async _getIntroducibleCompilerStages() {
    try {
      const result = await this._postgres.query(`
        SELECT gap_analysis
        FROM constitutional_gap_analysis
        ORDER BY gap_analysis->>'overall_gap_score' DESC
        LIMIT 20
      `);

      const stages = [];
      for (const row of result.rows) {
        const gaps = row.gap_analysis;
        
        for (const replacement of gaps.compiler_stage_replacements) {
          stages.push({
            repo_id: gaps.repo_id,
            current_stage: replacement.current_stage,
            replacement_stage: replacement.replacement_stage,
            reason: replacement.reason,
          });
        }
      }

      return stages.slice(0, 10);
    } catch (error) {
      console.error('[CommandCenter] Failed to get introducible compiler stages:', error.message);
      return [];
    }
  }

  /**
   * Get replay risk analysis
   */
  async _getReplayRiskAnalysis() {
    const missions = await this._refactoringMissions.getAllMissions();

    const risks = missions
      .filter(m => m.replay_impact === 'high' || m.replay_impact === 'medium')
      .slice(0, 20)
      .map(mission => ({
        mission_id: mission.mission_id,
        repo_id: mission.repo_id,
        type: mission.type,
        title: mission.title,
        replay_impact: mission.replay_impact,
        witness_impact: mission.witness_impact,
        estimated_complexity: mission.estimated_complexity,
      }));

    return risks;
  }

  /**
   * Get ready-to-run Devin implementation prompts
   */
  async _getDevinPrompts() {
    const workItems = await this._devinGenerator.getWorkItemsByStatus('pending');

    return workItems.slice(0, 20).map(workItem => ({
      work_item_id: workItem.work_item_id,
      type: workItem.type,
      title: workItem.title,
      repo_id: workItem.repository.repo_id,
      devin_prompt: workItem.devin_prompt,
      complexity: workItem.complexity,
      loc_removed: workItem.loc_removed,
      risk: workItem.risk,
      replay_impact: workItem.replay_impact,
    }));
  }

  /**
   * Get accepted imports
   */
  async _getAcceptedImports() {
    try {
      const result = await this._postgres.query(`
        SELECT evaluation
        FROM technology_evaluations
        WHERE evaluation->>'integration_strategy'->>'decision' IN ('replace', 'merge', 'reuse', 'adopt', 'improve', 'introduce')
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
          philosophy: strategy.philosophy,
          accepted_at: evaluation.evaluated_at,
        };
      });
    } catch (error) {
      console.error('[CommandCenter] Failed to get accepted imports:', error.message);
      return [];
    }
  }

  /**
   * Get rejected technologies with constitutional reasoning
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
          philosophy: strategy.philosophy,
          rejected_at: evaluation.evaluated_at,
        };
      });
    } catch (error) {
      console.error('[CommandCenter] Failed to get rejected technologies:', error.message);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async _getStatistics() {
    const discoveryStats = this._discoverySystem.getDiscoveryStats();
    const ecosystemStats = await this._ecosystemIntelligence.getDiscoveryStats();
    const missionStats = this._refactoringMissions.getMissionStats();
    const githubStats = this._githubWatcher.getReleaseStats();
    const devinStats = {
      total: (await this._devinGenerator.getAllWorkItems()).length,
      pending: (await this._devinGenerator.getWorkItemsByStatus('pending')).length,
      in_progress: (await this._devinGenerator.getWorkItemsByStatus('in_progress')).length,
      completed: (await this._devinGenerator.getWorkItemsByStatus('completed')).length,
    };

    const stats = {
      discovery: discoveryStats,
      ecosystem: ecosystemStats,
      missions: missionStats,
      github: githubStats,
      devin: devinStats,
      evaluation: {
        total_evaluated: await this._getTotalEvaluated(),
        accepted: await this._getAcceptedCount(),
        rejected: await this._getRejectedCount(),
      },
      gap_analysis: {
        total_analyzed: await this._getTotalGapAnalyzed(),
        total_loc_removed: await this._getTotalLOCRemoved(),
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
        WHERE evaluation->>'integration_strategy'->>'decision' IN ('replace', 'merge', 'reuse', 'adopt', 'improve', 'introduce')
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
   * Get total gap analyzed
   */
  async _getTotalGapAnalyzed() {
    try {
      const result = await this._postgres.query(`
        SELECT COUNT(*) as count
        FROM constitutional_gap_analysis
      `);
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get total LOC removed
   */
  async _getTotalLOCRemoved() {
    try {
      const result = await this._postgres.query(`
        SELECT gap_analysis
        FROM constitutional_gap_analysis
      `);

      let totalLOC = 0;
      for (const row of result.rows) {
        const gaps = row.gap_analysis;
        
        for (const removal of gaps.code_removal_opportunities) {
          totalLOC += removal.estimated_loc_removed || 0;
        }

        for (const elimination of gaps.subsystem_eliminations) {
          totalLOC += elimination.estimated_loc_removed || 0;
        }
      }

      return totalLOC;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Run complete Command Center pipeline for discovered repository
   * 
   * New Pipeline:
   * Discovery → Evaluation → Gap Analysis → RFC → Human Approval → Mission Queue → Replay Sandbox → Implementation → Replay Verification → Integration
   */
  async runCommandCenterPipeline(repoId, repositoryPath, options = {}) {
    console.log(`[CommandCenter] Running Command Center pipeline for ${repoId}`);

    // Update discovery status
    await this._discoverySystem.updateDiscoveryStatus(repoId, 'processing');

    try {
      // Stage 1: Evaluation
      console.log(`[CommandCenter] Stage 1: Evaluation`);
      const evaluation = await this._technologyEvaluator.evaluateRepository(
        repoId,
        repositoryPath,
        this._discoverySystem._discoveryQueue.get(repoId)
      );

      // Stage 2: Gap Analysis
      console.log(`[CommandCenter] Stage 2: Gap Analysis`);
      const gaps = await this._gapAnalysis.analyzeGaps(repoId, evaluation);

      // Stage 3: RFC Generation
      console.log(`[CommandCenter] Stage 3: RFC Generation`);
      const rfc = await this._rfcGenerator.generateRFC(repoId, evaluation, gaps);

      // Stage 4: Human Approval (optional)
      if (options.requireHumanApproval) {
        console.log(`[CommandCenter] Stage 4: Human Approval Required`);
        await this._discoverySystem.updateDiscoveryStatus(repoId, 'awaiting_approval', {
          rfc_id: rfc.rfc_id,
          rfc_number: rfc.rfc_number,
        });

        return {
          success: true,
          stage: 'awaiting_approval',
          evaluation: evaluation,
          gaps: gaps,
          rfc: rfc,
          message: 'Awaiting human approval for RFC',
        };
      }

      // Auto-approve if not requiring human approval
      await this._rfcGenerator.approveRFC(rfc.rfc_id, 'constitutional_system', 'Auto-approved by system');

      // Stage 5: Mission Queue
      console.log(`[CommandCenter] Stage 5: Mission Queue`);
      const missions = await this._refactoringMissions.generateMissionsFromEvaluation(evaluation);
      
      for (const mission of missions) {
        await this._missionQueue.enqueueMission(mission);
      }

      // Stage 6: Generate Devin work items
      console.log(`[CommandCenter] Stage 6: Devin Work Items`);
      const workItems = [];
      for (const mission of missions) {
        const workItem = await this._devinGenerator.generateWorkItem(mission, gaps);
        workItems.push(workItem);
      }

      // Update discovery status
      await this._discoverySystem.updateDiscoveryStatus(repoId, 'completed', {
        evaluation_id: evaluation.repo_id,
        rfc_id: rfc.rfc_id,
        rfc_number: rfc.rfc_number,
        mission_count: missions.length,
        work_item_count: workItems.length,
        gap_score: gaps.overall_gap_score,
      });

      return {
        success: true,
        evaluation: evaluation,
        gaps: gaps,
        rfc: rfc,
        missions: missions,
        work_items: workItems,
      };
    } catch (error) {
      console.error(`[CommandCenter] Command Center pipeline failed for ${repoId}:`, error.message);
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

    console.log(`[CommandCenter] Processing next discovery: ${discovery.repo_id}`);

    // Clone repository (placeholder)
    const repositoryPath = `./temp/${discovery.repo_id}`;

    // Run Command Center pipeline
    const result = await this.runCommandCenterPipeline(discovery.repo_id, repositoryPath);

    return result;
  }

  /**
   * Process multiple discoveries from queue
   */
  async processDiscoveryQueue(limit = 10) {
    console.log(`[CommandCenter] Processing discovery queue (limit: ${limit})`);

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
        console.error(`[CommandCenter] Failed to process ${discovery.repo_id}:`, error.message);
        results.push({
          success: false,
          repo_id: discovery.repo_id,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(repoId) {
    const evaluation = await this._technologyEvaluator.getEvaluation(repoId);
    const gaps = await this._gapAnalysis.getGapAnalysis(repoId);
    const discoveryRecord = this._discoverySystem._discoveryQueue.get(repoId);
    const missions = await this._refactoringMissions.getAllMissions().then(missions =>
      missions.filter(m => m.repo_id === repoId)
    );
    const workItems = await this._devinGenerator.getAllWorkItems().then(items =>
      items.filter(w => w.repo_id === repoId)
    );

    return {
      repo_id: repoId,
      evaluation: evaluation,
      gaps: gaps,
      discovery: discoveryRecord,
      missions: missions,
      work_items: workItems,
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
    const gaps = await this._gapAnalysis.getGapAnalysis(mission.repo_id);
    const workItem = await this._devinGenerator.getWorkItem(missionId);

    return {
      mission: mission,
      evaluation: evaluation,
      gaps: gaps,
      work_item: workItem,
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
   * Update work item status
   */
  async updateWorkItemStatus(workItemId, status, metadata = {}) {
    await this._devinGenerator.updateWorkItemStatus(workItemId, status, metadata);
    return await this._devinGenerator.getWorkItem(workItemId);
  }
}

module.exports = { ConstitutionalCommandCenter };
