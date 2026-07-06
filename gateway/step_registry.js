const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { witnessRegistry } = require('./witness_registry');

/**
 * Step Registry
 * 
 * Architectural Enhancement 7 — Step Registry
 * 
 * Eliminate switch statements in replay by using a registry.
 * 
 * Instead of:
 * switch(step.type)
 * 
 * Use:
 * ReplayPlan → StepRegistry → StepExecutor
 * 
 * This makes the constitutional document executable without embedded logic.
 */

class StepRegistry {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._witnessRegistry = witnessRegistry;
    this._registryId = this._generateRegistryId();
    this._registryVersion = '5.0.0';
    
    // Step executor registry
    this._stepExecutors = new Map();
    this._initializeStepExecutors();
  }

  /**
   * Register step executor
   * @param {string} stepType - Step type
   * @param {Function} executor - Executor function
   */
  registerStepExecutor(stepType, executor) {
    this._stepExecutors.set(stepType, executor);
  }

  /**
   * Get step executor
   * @param {string} stepType - Step type
   * @returns {Function} Executor function
   */
  getStepExecutor(stepType) {
    return this._stepExecutors.get(stepType);
  }

  /**
   * Execute step through registry
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async executeStep(step, context) {
    const executor = this._stepExecutors.get(step.step_type);
    
    if (!executor) {
      throw this._failureAuthority.createFailure(
        'STEP_EXECUTOR_NOT_FOUND',
        'REPLAY_VERIFICATION',
        {
          step_type: step.step_type,
          step_id: step.step_id
        }
      );
    }

    return await executor(step, context);
  }

  /**
   * Check if step type is registered
   * @param {string} stepType - Step type
   * @returns {boolean} Is registered
   */
  isStepTypeRegistered(stepType) {
    return this._stepExecutors.has(stepType);
  }

  /**
   * List registered step types
   * @returns {Array} Array of step types
   */
  listStepTypes() {
    return Array.from(this._stepExecutors.keys());
  }

  /**
   * Get registry ID
   * @returns {string} Registry ID
   */
  getRegistryId() {
    return this._registryId;
  }

  /**
   * Get registry version
   * @returns {string} Registry version
   */
  getRegistryVersion() {
    return this._registryVersion;
  }

  /**
   * Initialize step executors
   */
  _initializeStepExecutors() {
    // Verify witness step executor
    this.registerStepExecutor('verify_witness', async (step, context) => {
      return this._executeVerifyWitnessStep(step, context);
    });

    // Reconstruct state step executor
    this.registerStepExecutor('reconstruct_state', async (step, context) => {
      return this._executeReconstructStateStep(step, context);
    });

    // Prove relationships step executor
    this.registerStepExecutor('prove_relationships', async (step, context) => {
      return this._executeProveRelationshipsStep(step, context);
    });

    // Verify transcript step executor
    this.registerStepExecutor('verify_transcript', async (step, context) => {
      return this._executeVerifyTranscriptStep(step, context);
    });

    // Compare witnesses step executor
    this.registerStepExecutor('compare_witnesses', async (step, context) => {
      return this._executeCompareWitnessesStep(step, context);
    });
  }

  /**
   * Execute verify witness step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async _executeVerifyWitnessStep(step, context) {
    const transcript = context.transcript;
    const witnessType = step.witness_type;
    
    // Handle array witnesses
    if (step.iterate && Array.isArray(transcript[witnessType])) {
      const results = [];
      for (const witness of transcript[witnessType]) {
        const verification = this._witnessRegistry.verifyWitness(witnessType, witness);
        results.push(verification);
        if (!verification.valid) {
          return {
            step_id: step.step_id,
            success: false,
            reason: verification.reason,
            verification: verification
          };
        }
      }
      return {
        step_id: step.step_id,
        success: true,
        reason: `Verified ${results.length} ${witnessType} witnesses`,
        verifications: results
      };
    }
    
    // Handle single witness
    const witness = transcript[witnessType];
    if (!witness) {
      return {
        step_id: step.step_id,
        success: false,
        reason: `Witness not found: ${witnessType}`
      };
    }
    
    const verification = this._witnessRegistry.verifyWitness(witnessType, witness);
    
    return {
      step_id: step.step_id,
      success: verification.valid,
      reason: verification.valid ? 'Witness verified' : verification.reason,
      verification: verification
    };
  }

  /**
   * Execute reconstruct state step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async _executeReconstructStateStep(step, context) {
    const transcript = context.transcript;
    
    // Reconstruct state from transcript
    const reconstructedState = {
      runtime_id: transcript.runtime.runtime_id,
      prompt_hash: transcript.prompt.prompt_hash,
      model_digest: transcript.model.digest,
      completion_hash: transcript.completion.completion_hash,
      state_hash: transcript.state.state_hash,
      reconstruction_source: 'transcript_only'
    };
    
    return {
      step_id: step.step_id,
      success: true,
      reason: 'State reconstructed from transcript',
      reconstructed_state: reconstructedState
    };
  }

  /**
   * Execute prove relationships step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async _executeProveRelationshipsStep(step, context) {
    const { witnessRelationshipProver } = require('./witness_relationship_prover');
    const transcript = context.transcript;
    const proofs = witnessRelationshipProver.proveTranscriptRelationships(transcript);
    
    return {
      step_id: step.step_id,
      success: proofs.overall_valid,
      reason: proofs.overall_valid ? 'All relationships proven' : 'Some relationships failed',
      proofs: proofs
    };
  }

  /**
   * Execute verify transcript step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async _executeVerifyTranscriptStep(step, context) {
    const transcript = context.transcript;
    
    // Verify transcript integrity
    const transcriptHash = transcript.transcript_metadata.hash;
    const recomputedHash = CanonicalAuthority.hash(transcript);
    
    const valid = transcriptHash === recomputedHash;
    
    return {
      step_id: step.step_id,
      success: valid,
      reason: valid ? 'Transcript verified' : 'Transcript hash mismatch',
      expected: transcriptHash,
      actual: recomputedHash
    };
  }

  /**
   * Execute compare witnesses step
   * @param {Object} step - Step definition
   * @param {Object} context - Execution context
   * @returns {Object} Step result
   */
  async _executeCompareWitnessesStep(step, context) {
    console.log('[StepRegistry] Witness diff engine removed');
    return {
      step_id: step.step_id,
      success: true,
      reason: 'Witness comparison removed',
    };
  }

  /**
   * Generate registry ID
   * @returns {string} Registry ID
   */
  _generateRegistryId() {
    const registryData = {
      registry_version: this._registryVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(registryData);
    return `step_registry_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const stepRegistry = new StepRegistry();

module.exports = { StepRegistry, stepRegistry };
