/**
 * Policy IR (Intermediate Representation)
 * 
 * Ω.97.7 — Separate Policy Execution
 * 
 * Policy Compiler → Policy IR → Policy Runtime → Decision Artifact
 * 
 * Same separation as Workflow IR.
 * Everything should become IR first.
 */

const { CanonicalAuthority } = require('./canonical_authority');

class PolicyIR {
  constructor() {
    this.ir = null;
  }

  /**
   * Create Policy IR from compiled policy
   * 
   * @param {Object} compiledPolicy - Compiled policy
   * @returns {Object} Policy IR
   */
  createIR(compiledPolicy) {
    console.log(`[PolicyIR] Creating Policy IR for ${compiledPolicy.policy_id}`);

    const ir = {
      ir_id: `policy-ir-${compiledPolicy.policy_id}`,
      policy_id: compiledPolicy.policy_id,
      policy_type: compiledPolicy.policy_type,
      version: compiledPolicy.version,
      rules: this._compileRulesToIR(compiledPolicy.compiled_rules),
      metadata: {
        total_rules: compiledPolicy.compiled_rules.length,
        created_at: compiledPolicy.compiled_at,
      },
      canonical_hash: null, // Will be set after canonical serialization
    };

    // Set canonical hash
    ir.canonical_hash = CanonicalAuthority.hash(ir);

    this.ir = ir;

    console.log(`[PolicyIR] Created Policy IR ${ir.ir_id}`);
    return ir;
  }

  /**
   * Compile rules to IR
   */
  _compileRulesToIR(compiledRules) {
    return compiledRules.map(rule => ({
      rule_id: rule.rule_id,
      condition_ir: this._compileConditionToIR(rule.condition),
      action: rule.action,
      priority: rule.priority,
      executable: rule.executable,
    }));
  }

  /**
   * Compile condition to IR
   */
  _compileConditionToIR(compiledCondition) {
    return {
      original: compiledCondition.original,
      ast: compiledCondition.compiled,
      variables: compiledCondition.compiled.variables,
      type: 'expression',
    };
  }

  /**
   * Get IR
   * 
   * @returns {Object} Policy IR
   */
  getIR() {
    return this.ir;
  }

  /**
   * Validate IR structure
   * 
   * @returns {Object} Validation result
   */
  validateIR() {
    if (!this.ir) {
      return {
        valid: false,
        errors: ['IR is null'],
      };
    }

    const errors = [];

    const required = ['ir_id', 'policy_id', 'policy_type', 'version', 'rules'];
    for (const field of required) {
      if (!(field in this.ir)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate rules
    for (const rule of this.ir.rules) {
      if (!rule.rule_id) {
        errors.push('Rule missing rule_id');
      }
      if (!rule.condition_ir) {
        errors.push('Rule missing condition_ir');
      }
      if (!rule.action) {
        errors.push('Rule missing action');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Serialize IR
   * 
   * @returns {string} Serialized IR
   */
  serialize() {
    if (!this.ir) {
      throw new Error('IR is null');
    }

    return JSON.stringify(this.ir);
  }

  /**
   * Deserialize IR
   * 
   * @param {string} serialized - Serialized IR
   * @returns {Object} Policy IR
   */
  deserialize(serialized) {
    this.ir = JSON.parse(serialized);
    return this.ir;
  }

  /**
   * Publish contract
   * 
   * @returns {Object} Authority contract
   */
  publishContract() {
    return {
      authority_id: 'policy-ir',
      authority_name: 'PolicyIR',
      version: '1.0.0',
      consumes: ['CompiledPolicy'],
      produces: ['PolicyIR'],
      requires: [],
      guarantees: ['deterministic_ir_generation'],
      failure_modes: ['ir_generation_error'],
      rollback: 'none',
      determinism: 'deterministic',
    };
  }
}

module.exports = { PolicyIR };
