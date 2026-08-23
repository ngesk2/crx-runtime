/**
 * Constitutional Technology Evaluator
 * 
 * Ω.90 — Repository Evaluation Pipeline
 * 
 * For every discovered repository:
 * 
 * Git Discovery → Clone → Multi-language Parsing → Constitutional Objects → Canonical Graph
 * → Replay → Witness → Embeddings → Reflection → Mission Generation → Technology Evaluation
 * 
 * Technology Evaluation answers:
 * - What new capability exists?
 * - Does PING already implement this capability?
 * - Is the implementation superior?
 * - Can the implementation be simplified?
 * - Can it replace existing code?
 * - Should it become a constitutional authority?
 * - Should it become a compiler stage?
 * - Should it become an infrastructure service?
 * - Should it remain external?
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicIdAuthority } = require('../ping-runtime/authorities/deterministic_id_authority');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class ConstitutionalTechnologyEvaluator {
  constructor(postgresPool, knowledgeAcquisition, ollamaIntegration) {
    this._postgres = postgresPool;
    this._knowledgeAcquisition = knowledgeAcquisition;
    this._ollamaIntegration = ollamaIntegration;
  }

  /**
   * Evaluate discovered repository
   * 
   * @param {string} repoId - Repository ID
   * @param {string} repositoryPath - Repository path
   * @param {Object} discoveryRecord - Discovery record
   * @returns {Object} Technology evaluation result
   */
  async evaluateRepository(repoId, repositoryPath, discoveryRecord) {
    console.log(`[TechnologyEvaluator] Evaluating repository ${repoId}`);

    const startTime = constitutionalTimeAuthority.nowAsMillis();

    try {
      // Step 1: Constitutionalize repository
      const constitutionalization = await this._constitutionalizeRepository(repoId, repositoryPath);

      // Step 2: Analyze capabilities
      const capabilities = await this._analyzeCapabilities(repoId, constitutionalization);

      // Step 3: Compare with PING implementation
      const pingComparison = await this._compareWithPing(repoId, capabilities);

      // Step 4: Evaluate implementation quality
      const qualityEvaluation = await this._evaluateImplementationQuality(repoId, constitutionalization);

      // Step 5: Determine integration strategy
      const integrationStrategy = await this._determineIntegrationStrategy(
        repoId,
        capabilities,
        pingComparison,
        qualityEvaluation
      );

      const evaluation = {
        repo_id: repoId,
        discovery_record: discoveryRecord,
        constitutionalization: constitutionalization,
        capabilities: capabilities,
        ping_comparison: pingComparison,
        quality_evaluation: qualityEvaluation,
        integration_strategy: integrationStrategy,
        evaluated_at: constitutionalTimeAuthority.now(),
        duration_ms: constitutionalTimeAuthority.nowAsMillis() - startTime,
      };

      await this._persistEvaluation(evaluation);

      console.log(`[TechnologyEvaluator] Evaluation complete for ${repoId}: ${integrationStrategy.decision}`);
      return evaluation;
    } catch (error) {
      console.error(`[TechnologyEvaluator] Evaluation failed for ${repoId}:`, error.message);
      throw error;
    }
  }

  /**
   * Constitutionalize repository
   */
  async _constitutionalizeRepository(repoId, repositoryPath) {
    const result = await this._knowledgeAcquisition.digestRepository(repoId, repositoryPath);
    await this._knowledgeAcquisition.buildKnowledgeBase();
    const understanding = await this._knowledgeAcquisition.analyzeRepositoryUnderstanding(repoId);

    return {
      object_count: result.object_count,
      embedding_count: result.embedding_count,
      validation: result.validation,
      understanding: understanding,
    };
  }

  /**
   * Analyze capabilities
   */
  async _analyzeCapabilities(repoId, constitutionalization) {
    const understanding = constitutionalization.understanding;
    const metadata = this._knowledgeAcquisition.getRepositoryMetadata(repoId);

    const capabilities = {
      new_capabilities: [],
      existing_capabilities: [],
      architectural_patterns: [],
      compiler_stages: [],
      infrastructure_components: [],
      ai_components: [],
    };

    // Extract capabilities from constitutional objects
    for (const [objectId, obj] of this._knowledgeAcquisition._knowledgeBase) {
      if (obj.metadata?.repo_id === repoId) {
        if (obj.kind === 'ArchitecturePattern') {
          capabilities.architectural_patterns.push(obj);
        } else if (obj.kind === 'CompilerPattern') {
          capabilities.compiler_stages.push(obj);
        } else if (obj.kind === 'InfrastructurePattern') {
          capabilities.infrastructure_components.push(obj);
        } else if (obj.payload?.ai_related) {
          capabilities.ai_components.push(obj);
        }
      }
    }

    // Use Ollama to identify new capabilities
    const ollamaAnalysis = await this._ollamaIntegration.analyzeConstitutionalObjects(
      Array.from(this._knowledgeAcquisition._knowledgeBase.values()).filter(obj => obj.metadata?.repo_id === repoId),
      'capability_analysis'
    );

    if (ollamaAnalysis.success) {
      for (const obj of ollamaAnalysis.output_objects) {
        if (obj.payload?.new_capability) {
          capabilities.new_capabilities.push(obj);
        }
      }
    }

    return capabilities;
  }

  /**
   * Compare with PING implementation
   */
  async _compareWithPing(repoId, capabilities) {
    const comparison = {
      already_implemented: [],
      not_implemented: [],
      superior_implementation: [],
      inferior_implementation: [],
      equivalent_implementation: [],
    };

    // Get PING's existing capabilities
    const pingCapabilities = await this._getPingCapabilities();

    // Compare each capability
    for (const capability of capabilities.new_capabilities) {
      const capabilityName = capability.payload?.name || capability.id;
      const pingCapability = pingCapabilities.find(c => c.name === capabilityName);

      if (pingCapability) {
        comparison.already_implemented.push({
          capability: capabilityName,
          ping_implementation: pingCapability,
          external_implementation: capability,
        });

        // Compare implementation quality
        const qualityComparison = await this._compareImplementationQuality(
          pingCapability,
          capability
        );

        if (qualityComparison === 'superior') {
          comparison.superior_implementation.push({
            capability: capabilityName,
            reason: 'External implementation is superior',
          });
        } else if (qualityComparison === 'inferior') {
          comparison.inferior_implementation.push({
            capability: capabilityName,
            reason: 'PING implementation is superior',
          });
        } else {
          comparison.equivalent_implementation.push({
            capability: capabilityName,
            reason: 'Implementations are equivalent',
          });
        }
} else {
        comparison.not_implemented.push({
          capability: capabilityName,
          external_implementation: capability,
        });
      }
    }

    return comparison;
  }

  /**
   * Get PING's existing capabilities
   */
  async _getPingCapabilities() {
    const capabilities = [];

    try {
      const result = await this._postgres.query(`
        SELECT object_data
        FROM repository_objects
        WHERE repo_id = 'ping/gateway'
        AND kind IN ('ArchitecturePattern', 'CompilerPattern', 'InfrastructurePattern')
      `);

      for (const row of result.rows) {
        const obj = row.object_data;
        capabilities.push({
          name: obj.payload?.name || obj.id,
          kind: obj.kind,
          authority: obj.authority,
          object: obj,
        });
      }
    } catch (error) {
      console.error('[TechnologyEvaluator] Failed to get PING capabilities:', error.message);
    }

    return capabilities;
  }

  /**
   * Compare implementation quality
   */
  async _compareImplementationQuality(pingCapability, externalCapability) {
    // Placeholder: Implement quality comparison logic
    // This would analyze code complexity, performance, maintainability, etc.
    return 'equivalent';
  }

  /**
   * Evaluate implementation quality
   */
  async _evaluateImplementationQuality(repoId, constitutionalization) {
    const quality = {
      complexity: 'medium',
      maintainability: 'medium',
      performance: 'unknown',
      test_coverage: 'unknown',
      documentation: 'unknown',
      can_be_simplified: false,
      simplification_opportunities: [],
    };

    // Analyze complexity from constitutional objects
    const understanding = constitutionalization.understanding;
    const objectCount = constitutionalization.object_count;

    if (objectCount > 1000) {
      quality.complexity = 'high';
    } else if (objectCount < 100) {
      quality.complexity = 'low';
    }

    // Use Ollama to evaluate quality
    const ollamaAnalysis = await this._ollamaIntegration.analyzeConstitutionalObjects(
      Array.from(this._knowledgeAcquisition._knowledgeBase.values()).filter(obj => obj.metadata?.repo_id === repoId),
      'quality_evaluation'
    );

    if (ollamaAnalysis.success) {
      for (const obj of ollamaAnalysis.output_objects) {
        if (obj.payload?.simplification_opportunity) {
          quality.can_be_simplified = true;
          quality.simplification_opportunities.push(obj);
        }
      }
    }

    return quality;
  }

  /**
   * Determine integration strategy (Delete-Before-Add Philosophy)
   * 
   * Prioritize:
   * 1. Can this delete code?
   * 2. Can this replace code?
   * 3. Can this simplify code?
   * 4. Can this merge authorities?
   * 5. Can this eliminate infrastructure?
   * 
   * Only then:
   * 6. Should we add it?
   */
  async _determineIntegrationStrategy(repoId, capabilities, pingComparison, qualityEvaluation) {
    const strategy = {
      decision: 'external', // authority, compiler_stage, infrastructure_service, replace, merge, reuse, adopt, ignore, external
      reasoning: [],
      expected_benefit: '',
      affected_authorities: [],
      affected_constitutional_objects: [],
      estimated_complexity: 'medium',
      replay_impact: 'low',
      witness_impact: 'low',
      philosophy: 'delete_before_add',
    };

    // Decision logic with delete-before-add philosophy
    const hasSuperiorImplementation = pingComparison.superior_implementation.length > 0;
    const canBeSimplified = qualityEvaluation.can_be_simplified;
    const hasNewCapabilities = capabilities.new_capabilities.length > 0;
    const hasArchitecturalPatterns = capabilities.architectural_patterns.length > 0;
    const hasCompilerStages = capabilities.compiler_stages.length > 0;
    const hasInfrastructure = capabilities.infrastructure_components.length > 0;

    // Priority 1: Can this delete code? (superior implementation that replaces existing)
    if (hasSuperiorImplementation) {
      strategy.decision = 'replace';
      strategy.reasoning.push('DELETE-BEFORE-ADD: External implementation is superior, allows deletion of existing code');
      strategy.expected_benefit = 'Delete existing code and replace with superior implementation';
      strategy.affected_authorities = pingComparison.superior_implementation.map(c => c.ping_implementation.authority);
      strategy.affected_constitutional_objects = pingComparison.superior_implementation.map(c => c.ping_implementation.object.id);
      strategy.estimated_complexity = 'high';
      strategy.replay_impact = 'high';
      strategy.witness_impact = 'high';
      return strategy;
    }

    // Priority 2: Can this simplify code?
    if (canBeSimplified) {
      strategy.decision = 'reuse';
      strategy.reasoning.push('DELETE-BEFORE-ADD: Repository contains simplifiable patterns, allows code simplification');
      strategy.expected_benefit = 'Simplify existing code by reusing external patterns';
      strategy.affected_authorities = qualityEvaluation.simplification_opportunities.map(c => c.authority);
      strategy.affected_constitutional_objects = qualityEvaluation.simplification_opportunities.map(c => c.id);
      strategy.estimated_complexity = 'low';
      strategy.replay_impact = 'low';
      strategy.witness_impact = 'low';
      return strategy;
    }

    // Priority 3: Can this merge authorities?
    if (hasArchitecturalPatterns) {
      strategy.decision = 'merge';
      strategy.reasoning.push('DELETE-BEFORE-ADD: Repository contains architectural patterns that can be merged, potentially eliminating duplicate code');
      strategy.expected_benefit = 'Merge architectural patterns to eliminate duplication';
      strategy.affected_authorities = capabilities.architectural_patterns.map(c => c.authority);
      strategy.affected_constitutional_objects = capabilities.architectural_patterns.map(c => c.id);
      strategy.estimated_complexity = 'medium';
      strategy.replay_impact = 'medium';
      strategy.witness_impact = 'medium';
      return strategy;
    }

    // Priority 4: Can this eliminate infrastructure?
    if (hasInfrastructure) {
      strategy.decision = 'eliminate';
      strategy.reasoning.push('DELETE-BEFORE-ADD: Repository contains infrastructure components that can replace existing infrastructure');
      strategy.expected_benefit = 'Eliminate existing infrastructure by using external components';
      strategy.affected_authorities = capabilities.infrastructure_components.map(c => c.authority);
      strategy.affected_constitutional_objects = capabilities.infrastructure_components.map(c => c.id);
      strategy.estimated_complexity = 'high';
      strategy.replay_impact = 'high';
      strategy.witness_impact = 'high';
      return strategy;
    }

    // Priority 5: Can this improve compiler stages?
    if (hasCompilerStages) {
      strategy.decision = 'improve';
      strategy.reasoning.push('DELETE-BEFORE-ADD: Repository contains compiler stages that can improve existing stages');
      strategy.expected_benefit = 'Improve existing compiler stages using external patterns';
      strategy.affected_authorities = capabilities.compiler_stages.map(c => c.authority);
      strategy.affected_constitutional_objects = capabilities.compiler_stages.map(c => c.id);
      strategy.estimated_complexity = 'medium';
      strategy.replay_impact = 'medium';
      strategy.witness_impact = 'medium';
      return strategy;
    }

    // Priority 6: Only then - Should we add it? (new capabilities)
    if (hasNewCapabilities) {
      strategy.decision = 'adopt';
      strategy.reasoning.push('DELETE-BEFORE-ADD: No deletion opportunities found, but repository contains new capabilities that add value');
      strategy.expected_benefit = 'Add new functionality (lower priority than deletion)';
      strategy.affected_authorities = capabilities.new_capabilities.map(c => c.authority);
      strategy.affected_constitutional_objects = capabilities.new_capabilities.map(c => c.id);
      strategy.estimated_complexity = 'medium';
      strategy.replay_impact = 'medium';
      strategy.witness_impact = 'medium';
      return strategy;
    }

    // No value
    strategy.decision = 'ignore';
    strategy.reasoning.push('DELETE-BEFORE-ADD: No deletion, replacement, simplification, or addition value found');
    strategy.expected_benefit = 'None';
    strategy.estimated_complexity = 'none';
    strategy.replay_impact = 'none';
    strategy.witness_impact = 'none';

    return strategy;
  }

  /**
   * Persist evaluation to PostgreSQL
   */
  async _persistEvaluation(evaluation) {
    try {
      await this._postgres.query(`
        INSERT INTO technology_evaluations (repo_id, evaluation, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (repo_id) DO UPDATE SET
          evaluation = $2,
          updated_at = NOW()
      `, [evaluation.repo_id, JSON.stringify(evaluation)]);
    } catch (error) {
      console.error(`[TechnologyEvaluator] Failed to persist evaluation for ${evaluation.repo_id}:`, error.message);
    }
  }

  /**
   * Get evaluation by repo ID
   */
  async getEvaluation(repoId) {
    try {
      const result = await this._postgres.query(`
        SELECT evaluation
        FROM technology_evaluations
        WHERE repo_id = $1
      `, [repoId]);

      if (result.rows.length > 0) {
        return result.rows[0].evaluation;
      }
      return null;
    } catch (error) {
      console.error(`[TechnologyEvaluator] Failed to get evaluation for ${repoId}:`, error.message);
      return null;
    }
  }

  /**
   * Get all evaluations
   */
  async getAllEvaluations() {
    try {
      const result = await this._postgres.query(`
        SELECT evaluation
        FROM technology_evaluations
        ORDER BY created_at DESC
      `);

      return result.rows.map(row => row.evaluation);
    } catch (error) {
      console.error('[TechnologyEvaluator] Failed to get all evaluations:', error.message);
      return [];
    }
  }
}

module.exports = { ConstitutionalTechnologyEvaluator };
