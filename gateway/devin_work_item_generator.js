/**
 * Devin Work Item Generator
 * 
 * Ω.90 — Devin Work Item Generation
 * 
 * Generate ready-to-run implementation prompts with:
 * - Repository
 * - Discovery
 * - Missing capability
 * - Recommendation
 * - Complexity
 * - LOC removed
 * - Risk
 * - Replay impact
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');

class DevinWorkItemGenerator {
  constructor(postgresPool, gapAnalysis, refactoringMissions) {
    this._postgres = postgresPool;
    this._gapAnalysis = gapAnalysis;
    this._refactoringMissions = refactoringMissions;
  }

  /**
   * Generate Devin work item from mission
   * 
   * @param {Object} mission - Refactoring mission
   * @param {Object} gapAnalysis - Gap analysis result
   * @returns {Object} Devin work item
   */
  async generateWorkItem(mission, gapAnalysis) {
    console.log(`[DevinGenerator] Generating work item for mission ${mission.mission_id}`);

    const workItem = {
      work_item_id: deterministicIdAuthority.generateIdFromObject({
        mission_id: mission.mission_id,
        timestamp: constitutionalTimeAuthority.now(),
      }),
      mission_id: mission.mission_id,
      repo_id: mission.repo_id,
      type: mission.type,
      title: mission.title,
      description: mission.description,
      
      // Repository information
      repository: {
        repo_id: mission.repo_id,
        url: `https://github.com/${mission.repo_id}`,
      },
      
      // Discovery information
      discovery: {
        source: mission.metadata?.discovery_source || 'unknown',
        discovered_at: mission.created_at,
      },
      
      // Missing capability
      missing_capability: this._extractMissingCapability(mission, gapAnalysis),
      
      // Recommendation
      recommendation: this._generateRecommendation(mission, gapAnalysis),
      
      // Complexity
      complexity: mission.estimated_complexity,
      
      // LOC removed
      loc_removed: this._estimateLOCRemoved(mission, gapAnalysis),
      
      // Risk
      risk: this._assessRisk(mission, gapAnalysis),
      
      // Replay impact
      replay_impact: mission.replay_impact,
      
      // Witness impact
      witness_impact: mission.witness_impact,
      
      // Devin prompt
      devin_prompt: this._generateDevinPrompt(mission, gapAnalysis),
      
      // Affected authorities
      affected_authorities: mission.affected_authorities,
      
      // Affected constitutional objects
      affected_constitutional_objects: mission.affected_constitutional_objects,
      
      // Expected benefit
      expected_benefit: mission.expected_benefit,
      
      // Status
      status: 'pending',
      
      // Metadata
      metadata: {
        generated_at: constitutionalTimeAuthority.now(),
        gap_analysis_id: gapAnalysis?.repo_id || null,
      },
    };

    await this._persistWorkItem(workItem);

    console.log(`[DevinGenerator] Work item generated: ${workItem.work_item_id}`);
    return workItem;
  }

  /**
   * Extract missing capability
   */
  _extractMissingCapability(mission, gapAnalysis) {
    if (!gapAnalysis) {
      return null;
    }

    const missingCapability = gapAnalysis.missing_capabilities?.[0];
    if (missingCapability) {
      return {
        capability: missingCapability.capability,
        description: missingCapability.description,
        impact: missingCapability.impact,
      };
    }

    return null;
  }

  /**
   * Generate recommendation
   */
  _generateRecommendation(mission, gapAnalysis) {
    const recommendations = {
      replace: 'Replace current subsystem with external implementation',
      merge: 'Merge architectural pattern from external repository',
      reuse: 'Reuse parser/pattern from external repository',
      adopt: 'Adopt new capability from external repository',
      improve: 'Improve compiler stage with external implementation',
      introduce: 'Introduce new constitutional authority from external repository',
      ignore: 'Ignore repository (no value)',
    };

    return {
      action: mission.type,
      description: recommendations[mission.type] || 'Unknown action',
    };
  }

  /**
   * Estimate LOC removed
   */
  _estimateLOCRemoved(mission, gapAnalysis) {
    if (!gapAnalysis) {
      return 0;
    }

    let totalLOC = 0;

    for (const removal of gapAnalysis.code_removal_opportunities) {
      totalLOC += removal.estimated_loc_removed || 0;
    }

    for (const elimination of gapAnalysis.subsystem_eliminations) {
      totalLOC += elimination.estimated_loc_removed || 0;
    }

    return totalLOC;
  }

  /**
   * Assess risk
   */
  _assessRisk(mission, gapAnalysis) {
    let risk = 'medium';

    // High risk if replay impact is high
    if (mission.replay_impact === 'high') {
      risk = 'high';
    }

    // High risk if witness impact is high
    if (mission.witness_impact === 'high') {
      risk = 'high';
    }

    // Low risk if complexity is low
    if (mission.estimated_complexity === 'low') {
      risk = 'low';
    }

    // Very high risk if subsystem elimination
    if (gapAnalysis && gapAnalysis.subsystem_eliminations.length > 0) {
      risk = 'high';
    }

    return risk;
  }

  /**
   * Generate Devin prompt with constraints
   */
  _generateDevinPrompt(mission, gapAnalysis) {
    const prompts = {
      replace: this._generateReplacePromptWithConstraints(mission, gapAnalysis),
      merge: this._generateMergePromptWithConstraints(mission, gapAnalysis),
      reuse: this._generateReusePromptWithConstraints(mission, gapAnalysis),
      adopt: this._generateAdoptPromptWithConstraints(mission, gapAnalysis),
      improve: this._generateImprovePromptWithConstraints(mission, gapAnalysis),
      introduce: this._generateIntroducePromptWithConstraints(mission, gapAnalysis),
      ignore: this._generateIgnorePrompt(mission, gapAnalysis),
    };

    return prompts[mission.type] || 'Unknown mission type';
  }

  /**
   * Generate replace prompt with constraints
   */
  _generateReplacePromptWithConstraints(mission, gapAnalysis) {
    const targetAuthority = mission.affected_authorities[0] || 'unknown';
    const locRemoved = this._estimateLOCRemoved(mission, gapAnalysis);

    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Delete obsolete ${targetAuthority} (${locRemoved} LOC)
• Produce migration report
• Run constitutional replay verification

Refactor ${targetAuthority} to use implementation from ${mission.repo_id} while preserving replay law and witness determinism.`;
  }

  /**
   * Generate merge prompt with constraints
   */
  _generateMergePromptWithConstraints(mission, gapAnalysis) {
    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Merge architectural patterns without duplication
• Produce migration report
• Run constitutional replay verification

Merge architectural pattern from ${mission.repo_id} into PING. Preserve existing constitutional authorities and ensure replay determinism.`;
  }

  /**
   * Generate reuse prompt with constraints
   */
  _generateReusePromptWithConstraints(mission, gapAnalysis) {
    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Simplify existing code without breaking replay
• Produce migration report
• Run constitutional replay verification

Reuse parser/pattern from ${mission.repo_id} in PING. Simplify existing code while maintaining replay law and witness determinism.`;
  }

  /**
   * Generate adopt prompt with constraints
   */
  _generateAdoptPromptWithConstraints(mission, gapAnalysis) {
    const missingCapability = this._extractMissingCapability(mission, gapAnalysis);

    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Integrate new capability without breaking existing replay
• Produce migration report
• Run constitutional replay verification

Adopt new capability "${missingCapability?.capability || 'unknown'}" from ${mission.repo_id}. Integrate as constitutional authority while preserving replay law and witness determinism.`;
  }

  /**
   * Generate improve prompt with constraints
   */
  _generateImprovePromptWithConstraints(mission, gapAnalysis) {
    const targetStage = mission.affected_constitutional_objects[0] || 'unknown';

    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Improve compiler stage without breaking replay
• Produce migration report
• Run constitutional replay verification

Improve compiler stage ${targetStage} using concepts from ${mission.repo_id}. Preserve replay law and witness determinism.`;
  }

  /**
   * Generate introduce prompt with constraints
   */
  _generateIntroducePromptWithConstraints(mission, gapAnalysis) {
    const newAuthority = mission.affected_authorities[0] || 'unknown';

    return `Implement Mission-${mission.mission_id}

Constraints:
• Preserve replay proof
• Preserve witness hashes
• Preserve canonical serialization
• Introduce new authority without breaking existing replay
• Produce migration report
• Run constitutional replay verification

Introduce new constitutional authority ${newAuthority} based on ${mission.repo_id}. Ensure replay law and witness determinism.`;
  }

  /**
   * Generate replace prompt
   */
  _generateReplacePrompt(mission, gapAnalysis) {
    const targetAuthority = mission.affected_authorities[0] || 'unknown';
    const locRemoved = this._estimateLOCRemoved(mission, gapAnalysis);

    return `Refactor ${targetAuthority} to use implementation from ${mission.repo_id} while preserving replay law and witness determinism. This will remove approximately ${locRemoved} LOC. Ensure all constitutional objects are updated and replay validation passes.`;
  }

  /**
   * Generate merge prompt
   */
  _generateMergePrompt(mission, gapAnalysis) {
    return `Merge architectural pattern from ${mission.repo_id} into PING. Preserve existing constitutional authorities and ensure replay determinism. Update affected constitutional objects and validate replay.`;
  }

  /**
   * Generate reuse prompt
   */
  _generateReusePrompt(mission, gapAnalysis) {
    return `Reuse parser/pattern from ${mission.repo_id} in PING. Simplify existing code while maintaining replay law and witness determinism. Update affected constitutional objects and validate replay.`;
  }

  /**
   * Generate adopt prompt
   */
  _generateAdoptPrompt(mission, gapAnalysis) {
    const missingCapability = this._extractMissingCapability(mission, gapAnalysis);

    return `Adopt new capability "${missingCapability?.capability || 'unknown'}" from ${mission.repo_id}. Integrate as constitutional authority while preserving replay law and witness determinism. Generate new constitutional objects and validate replay.`;
  }

  /**
   * Generate improve prompt
   */
  _generateImprovePrompt(mission, gapAnalysis) {
    const targetStage = mission.affected_constitutional_objects[0] || 'unknown';

    return `Improve compiler stage ${targetStage} using concepts from ${mission.repo_id}. Preserve replay law and witness determinism. Update affected constitutional objects and validate replay.`;
  }

  /**
   * Generate introduce prompt
   */
  _generateIntroducePrompt(mission, gapAnalysis) {
    const newAuthority = mission.affected_authorities[0] || 'unknown';

    return `Introduce new constitutional authority ${newAuthority} based on ${mission.repo_id}. Ensure replay law and witness determinism. Generate new constitutional objects and validate replay.`;
  }

  /**
   * Generate ignore prompt
   */
  _generateIgnorePrompt(mission, gapAnalysis) {
    return `Ignore repository ${mission.repo_id}. No value for integration. Reason: ${mission.metadata?.reasoning?.join('; ') || 'No significant value'}.`;
  }

  /**
   * Persist work item
   */
  async _persistWorkItem(workItem) {
    try {
      await this._postgres.query(`
        INSERT INTO devin_work_items (work_item_id, work_item, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (work_item_id) DO UPDATE SET
          work_item = $2,
          updated_at = NOW()
      `, [workItem.work_item_id, JSON.stringify(workItem)]);
    } catch (error) {
      console.error(`[DevinGenerator] Failed to persist work item ${workItem.work_item_id}:`, error.message);
    }
  }

  /**
   * Generate work items from gap analysis
   */
  async generateWorkItemsFromGapAnalysis(repoId, gapAnalysis) {
    const workItems = [];

    // Generate work items for code removal opportunities
    for (const removal of gapAnalysis.code_removal_opportunities) {
      const workItem = await this._generateCodeRemovalWorkItem(removal, gapAnalysis);
      workItems.push(workItem);
    }

    // Generate work items for authority replacements
    for (const replacement of gapAnalysis.authority_replacements) {
      const workItem = await this._generateAuthorityReplacementWorkItem(replacement, gapAnalysis);
      workItems.push(workItem);
    }

    // Generate work items for subsystem eliminations
    for (const elimination of gapAnalysis.subsystem_eliminations) {
      const workItem = await this._generateSubsystemEliminationWorkItem(elimination, gapAnalysis);
      workItems.push(workItem);
    }

    return workItems;
  }

  /**
   * Generate code removal work item
   */
  async _generateCodeRemovalWorkItem(removal, gapAnalysis) {
    const workItemId = deterministicIdAuthority.generateIdFromObject({
      type: 'code_removal',
      capability: removal.capability,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const workItem = {
      work_item_id: workItemId,
      type: 'code_removal',
      title: `Remove code for ${removal.capability}`,
      description: `Remove ${removal.estimated_loc_removed} LOC by replacing with external implementation`,
      repository: {
        repo_id: gapAnalysis.repo_id,
      },
      recommendation: {
        action: 'replace',
        description: 'Replace current implementation with external implementation',
      },
      complexity: 'medium',
      loc_removed: removal.estimated_loc_removed,
      risk: 'low',
      replay_impact: 'low',
      witness_impact: 'low',
      devin_prompt: `Remove ${removal.estimated_loc_removed} LOC for ${removal.capability} by replacing with implementation from ${gapAnalysis.repo_id}. Preserve replay law and witness determinism.`,
      affected_authorities: [removal.authority],
      affected_constitutional_objects: [removal.ping_object_id],
      status: 'pending',
      generated_at: constitutionalTimeAuthority.now(),
    };

    await this._persistWorkItem(workItem);
    return workItem;
  }

  /**
   * Generate authority replacement work item
   */
  async _generateAuthorityReplacementWorkItem(replacement, gapAnalysis) {
    const workItemId = deterministicIdAuthority.generateIdFromObject({
      type: 'authority_replacement',
      current_authority: replacement.current_authority,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const workItem = {
      work_item_id: workItemId,
      type: 'authority_replacement',
      title: `Replace ${replacement.current_authority}`,
      description: replacement.reason,
      repository: {
        repo_id: gapAnalysis.repo_id,
      },
      recommendation: {
        action: 'replace',
        description: replacement.reason,
      },
      complexity: 'high',
      loc_removed: 0,
      risk: 'high',
      replay_impact: 'high',
      witness_impact: 'high',
      devin_prompt: `Replace ${replacement.current_authority} with ${replacement.replacement_authority} from ${gapAnalysis.repo_id} while preserving replay law and witness determinism. Update all affected constitutional objects and validate replay.`,
      affected_authorities: [replacement.current_authority, replacement.replacement_authority],
      affected_constitutional_objects: [],
      status: 'pending',
      generated_at: constitutionalTimeAuthority.now(),
    };

    await this._persistWorkItem(workItem);
    return workItem;
  }

  /**
   * Generate subsystem elimination work item
   */
  async _generateSubsystemEliminationWorkItem(elimination, gapAnalysis) {
    const workItemId = deterministicIdAuthority.generateIdFromObject({
      type: 'subsystem_elimination',
      subsystem: elimination.subsystem,
      timestamp: constitutionalTimeAuthority.now(),
    });

    const workItem = {
      work_item_id: workItemId,
      type: 'subsystem_elimination',
      title: `Eliminate ${elimination.subsystem}`,
      description: elimination.reason,
      repository: {
        repo_id: gapAnalysis.repo_id,
      },
      recommendation: {
        action: 'eliminate',
        description: elimination.reason,
      },
      complexity: 'high',
      loc_removed: elimination.estimated_loc_removed,
      risk: 'high',
      replay_impact: 'high',
      witness_impact: 'high',
      devin_prompt: `Eliminate ${elimination.subsystem} subsystem (${elimination.estimated_loc_removed} LOC) by using implementation from ${gapAnalysis.repo_id}. Preserve replay law and witness determinism. Update all affected constitutional objects and validate replay.`,
      affected_authorities: [elimination.subsystem],
      affected_constitutional_objects: [],
      status: 'pending',
      generated_at: constitutionalTimeAuthority.now(),
    };

    await this._persistWorkItem(workItem);
    return workItem;
  }

  /**
   * Get work item by ID
   */
  async getWorkItem(workItemId) {
    try {
      const result = await this._postgres.query(`
        SELECT work_item
        FROM devin_work_items
        WHERE work_item_id = $1
      `, [workItemId]);

      if (result.rows.length > 0) {
        return result.rows[0].work_item;
      }
      return null;
    } catch (error) {
      console.error(`[DevinGenerator] Failed to get work item ${workItemId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all work items
   */
  async getAllWorkItems() {
    try {
      const result = await this._postgres.query(`
        SELECT work_item
        FROM devin_work_items
        ORDER BY created_at DESC
      `);

      return result.rows.map(row => row.work_item);
    } catch (error) {
      console.error('[DevinGenerator] Failed to get all work items:', error.message);
      return [];
    }
  }

  /**
   * Get work items by status
   */
  async getWorkItemsByStatus(status) {
    try {
      const result = await this._postgres.query(`
        SELECT work_item
        FROM devin_work_items
        WHERE work_item->>'status' = $1
        ORDER BY created_at DESC
      `, [status]);

      return result.rows.map(row => row.work_item);
    } catch (error) {
      console.error(`[DevinGenerator] Failed to get work items with status ${status}:`, error.message);
      return [];
    }
  }

  /**
   * Update work item status
   */
  async updateWorkItemStatus(workItemId, status, metadata = {}) {
    const workItem = await this.getWorkItem(workItemId);
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    workItem.status = status;
    workItem.status_updated_at = constitutionalTimeAuthority.now();
    workItem.metadata = { ...workItem.metadata, ...metadata };

    await this._persistWorkItem(workItem);
    return workItem;
  }
}

module.exports = { DevinWorkItemGenerator };
