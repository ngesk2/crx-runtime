/**
 * Constitutional Result
 * 
 * Phase 11.1.1 — Constitutional Result Definition
 * 
 * The single constitutional interface between authorities and the execution pipeline.
 * 
 * Every authority must return exactly this structure.
 * 
 * Constitutional Principles:
 * - Only constitutional information (no runtime state, no provider-specific objects)
 * - No JavaScript Error objects
 * - No transport data
 * - No HTTP data
 * - No infrastructure handles
 * - Immutable (frozen after creation)
 * - Replay-safe (deterministic serialization)
 * 
 * Pipeline:
 * Authority → ConstitutionalResult → ExecutionAuthority → WitnessAuthority → VerificationAuthority
 */

/**
 * Constitutional Result Schema
 * 
 * @typedef {Object} ConstitutionalResult
 * @property {string} authority_id - Which authority produced this result
 * @property {string} execution_id - Execution identifier (for tracking)
 * @property {Object} inputs - Constitutional inputs (artifact IDs only, no raw data)
 * @property {Object} outputs - Constitutional outputs (artifact IDs only, no raw data)
 * @property {Array} canonical_artifacts - Full artifacts produced by this execution
 * @property {Array} events - Constitutional events (immutable, replay-safe)
 * @property {Object} metrics - Constitutional metrics (performance, resource usage)
 * @property {Object} lineage - Lineage information (parent execution IDs, dependency edges)
 * @property {Object} replay_inputs - Inputs required for replay (minimal subset)
 * @property {string} constitutional_version - Constitutional version of this result
 * @property {Object} authority_metadata - Authority-specific metadata (version, config)
 * @property {boolean} success - Whether execution succeeded
 */

class ConstitutionalResult {
  /**
   * Create constitutional result
   * 
   * @param {Object} params - Constitutional result parameters
   * @param {string} params.authority_id - Which authority produced this result
   * @param {string} params.execution_id - Execution identifier
   * @param {Object} params.inputs - Constitutional inputs (artifact IDs only)
   * @param {Object} params.outputs - Constitutional outputs (artifact IDs only)
   * @param {Array} params.canonical_artifacts - Full artifacts produced
   * @param {Array} params.events - Constitutional events
   * @param {Object} params.metrics - Constitutional metrics
   * @param {Object} params.lineage - Lineage information
   * @param {Object} params.replay_inputs - Inputs required for replay
   * @param {string} params.constitutional_version - Constitutional version
   * @param {Object} params.authority_metadata - Authority-specific metadata
   * @param {boolean} params.success - Whether execution succeeded
   * @returns {ConstitutionalResult} Frozen constitutional result
   */
  static create(params) {
    const result = {
      authority_id: params.authority_id,
      execution_id: params.execution_id,
      inputs: params.inputs || {},
      outputs: params.outputs || {},
      canonical_artifacts: params.canonical_artifacts || [],
      events: params.events || [],
      metrics: params.metrics || {},
      lineage: params.lineage || {},
      replay_inputs: params.replay_inputs || {},
      constitutional_version: params.constitutional_version || '11.0.0',
      authority_metadata: params.authority_metadata || {},
      success: params.success !== undefined ? params.success : true
    };

    // Validate required fields
    if (!result.authority_id) {
      throw new Error('ConstitutionalResult requires authority_id');
    }
    if (!result.execution_id) {
      throw new Error('ConstitutionalResult requires execution_id');
    }

    // Freeze result to ensure immutability
    return Object.freeze(result);
  }

  /**
   * Validate constitutional result
   * 
   * @param {Object} result - Result to validate
   * @returns {Object} Validation result
   */
  static validate(result) {
    const errors = [];

    if (!result.authority_id) {
      errors.push('Missing authority_id');
    }
    if (!result.execution_id) {
      errors.push('Missing execution_id');
    }
    if (!result.constitutional_version) {
      errors.push('Missing constitutional_version');
    }
    if (result.success === undefined) {
      errors.push('Missing success field');
    }

    // Validate inputs are artifact IDs only (no raw data)
    if (result.inputs) {
      for (const [key, value] of Object.entries(result.inputs)) {
        if (typeof value === 'object' && value !== null) {
          if (!value.artifact_id) {
            errors.push(`Input ${key} is not an artifact reference`);
          }
        }
      }
    }

    // Validate outputs are artifact IDs only (no raw data)
    if (result.outputs) {
      for (const [key, value] of Object.entries(result.outputs)) {
        if (typeof value === 'object' && value !== null) {
          if (!value.artifact_id) {
            errors.push(`Output ${key} is not an artifact reference`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Extract replay inputs from constitutional result
   * 
   * @param {ConstitutionalResult} result - Constitutional result
   * @returns {Object} Replay inputs
   */
  static extractReplayInputs(result) {
    return result.replay_inputs || {};
  }

  /**
   * Extract artifact IDs from constitutional result
   * 
   * @param {ConstitutionalResult} result - Constitutional result
   * @returns {Array} Artifact IDs
   */
  static extractArtifactIds(result) {
    const artifactIds = [];

    // Extract from canonical_artifacts
    if (result.canonical_artifacts) {
      for (const artifact of result.canonical_artifacts) {
        if (artifact.artifact_id) {
          artifactIds.push(artifact.artifact_id);
        }
      }
    }

    // Extract from inputs
    if (result.inputs) {
      for (const value of Object.values(result.inputs)) {
        if (typeof value === 'object' && value !== null && value.artifact_id) {
          artifactIds.push(value.artifact_id);
        }
      }
    }

    // Extract from outputs
    if (result.outputs) {
      for (const value of Object.values(result.outputs)) {
        if (typeof value === 'object' && value !== null && value.artifact_id) {
          artifactIds.push(value.artifact_id);
        }
      }
    }

    return [...new Set(artifactIds)]; // Deduplicate
  }

  /**
   * Get constitutional version
   * 
   * @param {ConstitutionalResult} result - Constitutional result
   * @returns {string} Constitutional version
   */
  static getVersion(result) {
    return result.constitutional_version || '11.0.0';
  }

  /**
   * Check if result is successful
   * 
   * @param {ConstitutionalResult} result - Constitutional result
   * @returns {boolean} Success status
   */
  static isSuccess(result) {
    return result.success === true;
  }
}

module.exports = { ConstitutionalResult };
