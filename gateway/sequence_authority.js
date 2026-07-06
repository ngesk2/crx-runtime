/**
 * Sequence Authority
 * 
 * Phase 45 Patch 45.6 — Sequence Execution Separation
 * 
 * Handles sequential execution of authorities.
 * 
 * Responsibilities:
 * - Execute authorities in sequence
 * - Pass output artifacts as input to next step
 * - Stop sequence on failure
 * 
 * ExecutionAuthority delegates sequencing to this authority.
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { identityAuthority } = require('./identity_authority');

class SequenceAuthority {
  constructor(executionAuthority) {
    this._executionAuthority = executionAuthority;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize sequence authority
   */
  async initialize() {
    console.log('[SequenceAuthority] Initializing sequence authority');
  }

  /**
   * Execute multiple authorities in sequence
   * 
   * @param {Array} executions - Array of {authorityId, node, inputArtifacts}
   * @returns {Object} Sequence execution result
   */
  async executeSequence(executions) {
    console.log(`[SequenceAuthority] Executing sequence of ${executions.length} authorities`);

    const results = [];
    const executionId = identityAuthority.generateId('sequence', {
      sequence: executions.map(e => e.authorityId),
      timestamp: constitutionalTimeAuthority.now(),
    });

    for (let i = 0; i < executions.length; i++) {
      const execution = executions[i];
      console.log(`[SequenceAuthority] Sequence step ${i + 1}/${executions.length}: ${execution.authorityId}`);

      const result = await this._executionAuthority.executeAuthority(
        execution.authorityId,
        execution.node,
        execution.inputArtifacts
      );

      results.push(result);

      // Stop sequence on failure
      if (!result.success) {
        console.log(`[SequenceAuthority] Sequence stopped at step ${i + 1} due to failure`);
        break;
      }

      // Pass output artifacts as input to next step
      if (result.result && result.result.artifacts) {
        for (const nextExecution of executions.slice(i + 1)) {
          nextExecution.inputArtifacts = {
            ...nextExecution.inputArtifacts,
            ...result.result.artifacts.reduce((acc, artifact) => {
              acc[artifact.artifact_id] = artifact;
              return acc;
            }, {}),
          };
        }
      }
    }

    return {
      execution_id: executionId,
      results: results,
      success: results.every(r => r.success),
    };
  }

  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '45.6.0',
      constitutional_version: '45.6.0'
    };
    const hash = require('./canonical_authority').CanonicalAuthority.hash(authorityData);
    return `sequence_${hash.substring(0, 16)}`;
  }
}

module.exports = { SequenceAuthority };
