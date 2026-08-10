/**
 * Condition Authority
 * 
 * Phase 45 Patch 45.3 — Immutable Evaluation Context
 * 
 * Constitutional Constraint: ConditionAuthority has no runtime awareness.
 * 
 * Removed (moved to ExecutionRuntime):
 * - nodeStates access
 * - dependency graph access
 * - ArtifactAuthority dependency
 * 
 * ConditionAuthority receives immutable evaluation context containing:
 * - policy_results: Map of policy decisions
 * - artifact_existence: Set of artifact names that exist
 * - artifact_values: Map of artifact name → value
 * - completed_node_ids: Set of completed node IDs
 * - execution_facts: Map of execution facts
 * 
 * Pure function evaluation with no runtime dependencies.
 */

const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');

class ConditionAuthority {
  constructor() {
    // Pure function authority - no runtime dependencies
  }

  /**
   * Initialize condition authority (no-op for pure function)
   */
  async initialize() {
    console.log('[ConditionAuthority] Initializing condition authority (pure function)');
    console.log('[ConditionAuthority] Condition authority initialized');
  }

  /**
   * Evaluate condition with immutable facts
   * 
   * @param {Object} condition - Condition to evaluate
   * @param {Object} facts - Immutable evaluation facts
   * @param {Object} facts.policy_results - Map of policy decisions
   * @param {Set} facts.artifact_existence - Set of artifact names that exist
   * @param {Map} facts.artifact_values - Map of artifact name → value
   * @param {Set} facts.completed_node_ids - Set of completed node IDs
   * @param {Map} facts.execution_facts - Map of execution facts
   * @returns {Object} Condition result
   */
  async evaluate(condition, facts) {
    console.log('[ConditionAuthority] Evaluating condition with immutable facts');

    const result = this._evaluateCondition(condition, facts);

    return {
      condition_id: identityAuthority.generateId('condition', {
        condition: condition,
        facts: facts,
        timestamp: constitutionalTimeAuthority.now(),
      }),
      condition: condition,
      result: result,
      evaluated_at: constitutionalTimeAuthority.now(),
    };
  }

  /**
   * Evaluate condition logic (synchronous, pure function)
   */
  _evaluateCondition(condition, facts) {
    for (const [key, value] of Object.entries(condition)) {
      if (key === 'gate_decision') {
        // Check policy result from immutable facts
        const policyResults = facts.policy_results || new Map();
        const gateDecision = policyResults.get(value.policy_id);
        if (gateDecision && gateDecision.decision === value.decision) {
          return true;
        }
        return false;
      }

      if (key === 'artifact_exists') {
        // Check artifact existence from immutable facts
        const artifactExistence = facts.artifact_existence || new Set();
        return artifactExistence.has(value);
      }

      if (key === 'artifact_value') {
        // Check artifact value from immutable facts
        const artifactValues = facts.artifact_values || new Map();
        const actualValue = artifactValues.get(value.name);
        if (actualValue === value.expected) {
          return true;
        }
        return false;
      }

      if (key === 'node_completed') {
        // Check node completion from immutable facts
        const completedNodeIds = facts.completed_node_ids || new Set();
        return completedNodeIds.has(value);
      }

      if (key === 'all_dependencies_met') {
        // Check all dependencies from immutable facts
        const dependencies = value.dependencies || [];
        const completedNodeIds = facts.completed_node_ids || new Set();
        const allMet = dependencies.every(depId => completedNodeIds.has(depId));
        return allMet;
      }

      if (key === 'execution_fact') {
        // Check execution fact from immutable facts
        const executionFacts = facts.execution_facts || new Map();
        const factValue = executionFacts.get(value.fact_id);
        if (factValue === value.expected) {
          return true;
        }
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate multiple conditions with immutable facts
   * 
   * @param {Array} conditions - Conditions to evaluate
   * @param {Object} facts - Immutable evaluation facts
   * @returns {Object} Evaluation result
   */
  async evaluateConditions(conditions, facts) {
    console.log(`[ConditionAuthority] Evaluating ${conditions.length} conditions`);

    const results = [];

    for (const condition of conditions) {
      const result = await this.evaluate(condition, facts);
      results.push(result);
    }

    const allMet = results.every(r => r.result);

    return {
      total_conditions: conditions.length,
      all_met: allMet,
      results: results,
      evaluated_at: constitutionalTimeAuthority.now(),
    };
  }

  /**
   * Publish contract
   * 
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: 'condition-authority',
      authority_name: 'ConditionAuthority',
      version: '45.3.0',
      consumes: ['condition', 'immutable_facts'],
      produces: ['ConditionResult'],
      requires: [],
      guarantees: ['pure_function', 'no_runtime_state', 'immutable_evaluation', 'deterministic_evaluation'],
      failure_modes: ['evaluation_error'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { ConditionAuthority };
