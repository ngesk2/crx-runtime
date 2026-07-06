const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { witnessRegistry } = require('./witness_registry');
const { constitutionVersionAuthority } = require('./constitution_version_authority');
const { stepRegistry } = require('./step_registry');

/**
 * Replay Plan Authority
 * 
 * Architectural Enhancement 5 — Execution Plan Authority
 * 
 * Replay plan should describe replay steps instead of hardcoding orchestration in ReplayEngine.
 * 
 * Example ExecutionPlan:
 * 
 * Step 1: Verify Prompt Witness
 * Step 2: Verify Model Witness
 * Step 3: Verify Streaming Witness
 * Step 4: Verify Completion Witness
 * Step 5: Verify State Witness
 * Step 6: Reconstruct State
 * 
 * Then ReplayEngine simply executes the plan.
 * No constitutional knowledge remains inside ReplayEngine.
 */

class ReplayPlanAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._witnessRegistry = witnessRegistry;
    this._versionAuthority = constitutionVersionAuthority;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '5.0.0';
    this._replayPlans = new Map();
  }

  /**
   * Create replay plan
   * @param {Object} planData - Plan data
   * @returns {Object} Replay plan
   */
  createReplayPlan(planData) {
    const planId = this._generatePlanId(planData);

    const plan = {
      plan_id: planId,
      plan_version: this._authorityVersion,
      constitutional_version: this._versionAuthority.getVersion('constitutional_schema'),
      
      // Plan steps
      steps: this._createDefaultSteps(),
      
      // Plan metadata
      plan_metadata: {
        created_by: 'ReplayPlanAuthority',
        frozen: true,
        hash: null
      },
      
      // Version manifest
      version_manifest: this._versionAuthority.createVersionManifest()
    };

    // Compute plan hash
    const planForHash = { ...plan };
    delete planForHash.plan_metadata.hash;
    plan.plan_metadata.hash = CanonicalAuthority.hash(planForHash);

    // Create plan witness
    const planWitness = this._witnessAuthority.createWitness(plan, {
      authority: 'ReplayPlanAuthority',
      authority_version: this._authorityVersion
    });
    plan.plan_witness = planWitness;

    // Deep freeze
    const frozenPlan = this._freezePlan(plan);
    
    // Store plan
    this._replayPlans.set(planId, frozenPlan);

    return frozenPlan;
  }

  /**
   * Create custom replay plan with specific steps
   * @param {Array} steps - Custom steps
   * @returns {Object} Replay plan
   */
  createCustomReplayPlan(steps) {
    const planId = this._generatePlanId({ steps });

    const plan = {
      plan_id: planId,
      plan_version: this._authorityVersion,
      constitutional_version: this._versionAuthority.getVersion('constitutional_schema'),
      
      // Custom steps
      steps: steps,
      
      // Plan metadata
      plan_metadata: {
        created_by: 'ReplayPlanAuthority',
        frozen: true,
        hash: null
      },
      
      // Version manifest
      version_manifest: this._versionAuthority.createVersionManifest()
    };

    // Compute plan hash
    const planForHash = { ...plan };
    delete planForHash.plan_metadata.hash;
    plan.plan_metadata.hash = CanonicalAuthority.hash(planForHash);

    // Create plan witness
    const planWitness = this._witnessAuthority.createWitness(plan, {
      authority: 'ReplayPlanAuthority',
      authority_version: this._authorityVersion
    });
    plan.plan_witness = planWitness;

    // Deep freeze
    const frozenPlan = this._freezePlan(plan);
    
    // Store plan
    this._replayPlans.set(planId, frozenPlan);

    return frozenPlan;
  }

  /**
   * Create default replay steps
   * @returns {Array} Default steps
   */
  _createDefaultSteps() {
    return [
      {
        step_id: 'step_1',
        step_type: 'verify_witness',
        witness_type: 'runtime',
        description: 'Verify Runtime Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_2',
        step_type: 'verify_witness',
        witness_type: 'prompt',
        description: 'Verify Prompt Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_3',
        step_type: 'verify_witness',
        witness_type: 'model',
        description: 'Verify Model Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_4',
        step_type: 'verify_witness',
        witness_type: 'streaming',
        description: 'Verify Streaming Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_5',
        step_type: 'verify_witness',
        witness_type: 'tool',
        description: 'Verify Tool Witnesses',
        authority: 'WitnessRegistry',
        required: true,
        iterate: true
      },
      {
        step_id: 'step_6',
        step_type: 'verify_witness',
        witness_type: 'completion',
        description: 'Verify Completion Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_7',
        step_type: 'verify_witness',
        witness_type: 'state',
        description: 'Verify State Witness',
        authority: 'WitnessRegistry',
        required: true
      },
      {
        step_id: 'step_8',
        step_type: 'reconstruct_state',
        description: 'Reconstruct Final State',
        authority: 'ReplayEngine',
        required: true
      }
    ];
  }

  /**
   * Get replay plan
   * @param {string} planId - Plan ID
   * @returns {Object} Replay plan
   */
  getReplayPlan(planId) {
    return this._replayPlans.get(planId);
  }

  /**
   * Execute replay plan through ReplayExecutor
   * @param {string} planId - Plan ID
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Execution result
   */
  async executeReplayPlan(planId, transcript) {
    const { ReplayAuthority } = require('./replay_authority');
    const plan = this._replayPlans.get(planId);
    
    if (!plan) {
      throw this._failureAuthority.createFailure(
        'REPLAY_PLAN_NOT_FOUND',
        'REPLAY_VERIFICATION',
        { plan_id: planId }
      );
    }

    return await replayExecutor.executeReplayPlan(plan, transcript);
  }

  /**
   * Execute single step through StepRegistry
   * @param {Object} step - Step definition
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Step result
   */
  async _executeStep(step, transcript) {
    const context = { transcript };
    return await stepRegistry.executeStep(step, context);
  }

  /**
   * Verify plan integrity
   * @param {string} planId - Plan ID
   * @returns {Object} Verification result
   */
  verifyPlanIntegrity(planId) {
    const plan = this._replayPlans.get(planId);
    
    if (!plan) {
      return {
        valid: false,
        reason: 'Plan not found'
      };
    }

    // Verify plan hash
    const planForHash = { ...plan };
    delete planForHash.plan_metadata.hash;
    delete planForHash.plan_witness;
    
    const computedHash = CanonicalAuthority.hash(planForHash);
    
    if (computedHash !== plan.plan_metadata.hash) {
      return {
        valid: false,
        reason: 'Plan hash mismatch',
        expected: plan.plan_metadata.hash,
        actual: computedHash
      };
    }

    // Verify plan witness
    const witnessVerification = this._witnessAuthority.verifyWitness(plan.plan_witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }

    return {
      valid: true,
      reason: 'Plan verified'
    };
  }

  /**
   * List all replay plans
   * @returns {Array} Array of plan IDs
   */
  listReplayPlans() {
    return Array.from(this._replayPlans.keys());
  }

  /**
   * Clear all replay plans
   */
  clearPlans() {
    this._replayPlans.clear();
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }

  /**
   * Generate plan ID
   * @param {Object} planData - Plan data
   * @returns {string} Plan ID
   */
  _generatePlanId(planData) {
    const idData = {
      authority_version: this._authorityVersion,
      constitutional_version: this._versionAuthority.getVersion('constitutional_schema'),
      steps_count: planData.steps ? planData.steps.length : 8
    };
    const hash = CanonicalAuthority.hash(idData);
    return `replay_plan_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze plan
   * @param {Object} plan - Replay plan
   * @returns {Object} Frozen plan
   */
  _freezePlan(plan) {
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        obj.forEach(freeze);
        Object.freeze(obj);
        return obj;
      }

      Object.keys(obj).forEach(key => {
        freeze(obj[key]);
      });

      Object.freeze(obj);
      return obj;
    };

    return freeze(plan);
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `replay_plan_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const replayPlanAuthority = new ReplayPlanAuthority();

module.exports = { ReplayPlanAuthority, replayPlanAuthority };
