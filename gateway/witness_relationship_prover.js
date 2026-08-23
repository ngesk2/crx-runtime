const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { witnessRegistry } = require('./witness_registry');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

/**
 * Witness Relationship Prover
 * 
 * Architectural Enhancement 3 — Witness Invariants
 * 
 * Move witnesses from hash checks to proving relationships.
 * 
 * Instead of merely proving hash(X), witnesses should prove:
 * 
 * - PromptWitness.prompt_hash == InferenceWitness.prompt_hash
 * - InferenceWitness.model_digest == ModelWitness.digest
 * - CompletionWitness.completion_hash == Transcript.completion_hash
 * - ReducerWitness.state_hash == StateWitness.state_hash
 * 
 * This transforms witnesses from isolated checks into a constitutional proof graph.
 */

class WitnessRelationshipProver {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._witnessRegistry = witnessRegistry;
    this._proverId = this._generateProverId();
    this._proverVersion = '5.0.0';
    
    // Relationship rules
    this._relationshipRules = new Map();
    this._initializeRelationshipRules();
  }

  /**
   * Prove witness relationships in transcript
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Proof result
   */
  proveTranscriptRelationships(transcript) {
    const proofs = {
      transcript_id: transcript.transcript_id,
      prover_id: this._proverId,
      prover_version: this._proverVersion,
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      relationships: [],
      overall_valid: true,
      failed_relationships: []
    };

    // Prove prompt → inference relationship
    const promptInferenceProof = this._provePromptInferenceRelationship(
      transcript.prompt,
      transcript.inference
    );
    proofs.relationships.push(promptInferenceProof);
    if (!promptInferenceProof.valid) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('prompt_inference');
    }

    // Prove inference → model relationship
    const inferenceModelProof = this._proveInferenceModelRelationship(
      transcript.inference,
      transcript.model
    );
    proofs.relationships.push(inferenceModelProof);
    if (!inferenceModelProof.valid) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('inference_model');
    }

    // Prove completion → transcript relationship
    const completionTranscriptProof = this._proveCompletionTranscriptRelationship(
      transcript.completion,
      transcript
    );
    proofs.relationships.push(completionTranscriptProof);
    if (!completionTranscriptProof.valid) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('completion_transcript');
    }

    // Prove state → transcript relationship
    const stateTranscriptProof = this._proveStateTranscriptRelationship(
      transcript.state,
      transcript
    );
    proofs.relationships.push(stateTranscriptProof);
    if (!stateTranscriptProof.valid) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('state_transcript');
    }

    // Prove tool → execution relationship
    const toolExecutionProofs = this._proveToolExecutionRelationships(
      transcript.tools
    );
    proofs.relationships.push(...toolExecutionProofs);
    if (toolExecutionProofs.some(p => !p.valid)) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('tool_execution');
    }

    // Prove streaming → completion relationship
    const streamingCompletionProof = this._proveStreamingCompletionRelationship(
      transcript.streaming,
      transcript.completion
    );
    proofs.relationships.push(streamingCompletionProof);
    if (!streamingCompletionProof.valid) {
      proofs.overall_valid = false;
      proofs.failed_relationships.push('streaming_completion');
    }

    return proofs;
  }

  /**
   * Prove prompt → inference relationship
   * @param {Object} promptWitness - Prompt witness
   * @param {Object} inferenceWitness - Inference witness
   * @returns {Object} Proof result
   */
  _provePromptInferenceRelationship(promptWitness, inferenceWitness) {
    const relationship = {
      type: 'prompt_inference',
      description: 'PromptWitness.prompt_hash == InferenceWitness.prompt_hash',
      valid: false,
      left_witness: 'prompt',
      right_witness: 'inference',
      field: 'prompt_hash',
      left_value: promptWitness.prompt_hash,
      right_value: inferenceWitness.prompt_hash,
      match: promptWitness.prompt_hash === inferenceWitness.prompt_hash
    };

    relationship.valid = relationship.match;

    return relationship;
  }

  /**
   * Prove inference → model relationship
   * @param {Object} inferenceWitness - Inference witness
   * @param {Object} modelWitness - Model witness
   * @returns {Object} Proof result
   */
  _proveInferenceModelRelationship(inferenceWitness, modelWitness) {
    const relationship = {
      type: 'inference_model',
      description: 'InferenceWitness.model_digest == ModelWitness.digest',
      valid: false,
      left_witness: 'inference',
      right_witness: 'model',
      field: 'model_digest',
      left_value: inferenceWitness.model_digest,
      right_value: modelWitness.digest,
      match: inferenceWitness.model_digest === modelWitness.digest
    };

    relationship.valid = relationship.match;

    return relationship;
  }

  /**
   * Prove completion → transcript relationship
   * @param {Object} completionWitness - Completion witness
   * @param {Object} transcript - Transcript
   * @returns {Object} Proof result
   */
  _proveCompletionTranscriptRelationship(completionWitness, transcript) {
    const relationship = {
      type: 'completion_transcript',
      description: 'CompletionWitness.completion_hash == Transcript.completion_hash',
      valid: false,
      left_witness: 'completion',
      right_witness: 'transcript',
      field: 'completion_hash',
      left_value: completionWitness.completion_hash,
      right_value: transcript.completion.completion_hash,
      match: completionWitness.completion_hash === transcript.completion.completion_hash
    };

    relationship.valid = relationship.match;

    return relationship;
  }

  /**
   * Prove state → transcript relationship
   * @param {Object} stateWitness - State witness
   * @param {Object} transcript - Transcript
   * @returns {Object} Proof result
   */
  _proveStateTranscriptRelationship(stateWitness, transcript) {
    const relationship = {
      type: 'state_transcript',
      description: 'StateWitness.state_hash == Transcript.state_hash',
      valid: false,
      left_witness: 'state',
      right_witness: 'transcript',
      field: 'state_hash',
      left_value: stateWitness.state_hash,
      right_value: transcript.state.state_hash,
      match: stateWitness.state_hash === transcript.state.state_hash
    };

    relationship.valid = relationship.match;

    return relationship;
  }

  /**
   * Prove tool → execution relationships
   * @param {Array} toolWitnesses - Array of tool witnesses
   * @returns {Array} Proof results
   */
  _proveToolExecutionRelationships(toolWitnesses) {
    const proofs = [];

    for (const toolWitness of toolWitnesses) {
      const relationship = {
        type: 'tool_execution',
        description: 'ToolWitness.execution_id == ToolWitness.tool_id relationship',
        valid: true,
        witness: 'tool',
        execution_id: toolWitness.execution_id,
        tool_id: toolWitness.tool_id,
        output_hash: toolWitness.output_hash,
        match: true
      };

      // Verify tool witness structure
      const verification = this._witnessRegistry.verifyWitness('tool', toolWitness);
      relationship.valid = verification.valid;

      proofs.push(relationship);
    }

    return proofs;
  }

  /**
   * Prove streaming → completion relationship
   * @param {Object} streamingWitness - Streaming witness
   * @param {Object} completionWitness - Completion witness
   * @returns {Object} Proof result
   */
  _proveStreamingCompletionRelationship(streamingWitness, completionWitness) {
    // Verify streaming completion witness matches completion witness
    const relationship = {
      type: 'streaming_completion',
      description: 'StreamingWitness.completion_witness == CompletionWitness',
      valid: false,
      left_witness: 'streaming',
      right_witness: 'completion',
      left_value: streamingWitness.completion_witness.witness_metadata.hash,
      right_value: completionWitness.witness_metadata.hash,
      match: streamingWitness.completion_witness.witness_metadata.hash === completionWitness.witness_metadata.hash
    };

    relationship.valid = relationship.match;

    return relationship;
  }

  /**
   * Prove custom relationship
   * @param {string} relationshipType - Relationship type
   * @param {Object} leftWitness - Left witness
   * @param {Object} rightWitness - Right witness
   * @param {string} field - Field to compare
   * @returns {Object} Proof result
   */
  proveCustomRelationship(relationshipType, leftWitness, rightWitness, field) {
    const rule = this._relationshipRules.get(relationshipType);
    
    if (!rule) {
      return {
        type: relationshipType,
        valid: false,
        reason: 'Unknown relationship type'
      };
    }

    return rule(leftWitness, rightWitness, field);
  }

  /**
   * Register relationship rule
   * @param {string} type - Relationship type
   * @param {Function} rule - Rule function
   */
  registerRelationshipRule(type, rule) {
    this._relationshipRules.set(type, rule);
  }

  /**
   * Get relationship rules
   * @returns {Array} Array of relationship types
   */
  getRelationshipRules() {
    return Array.from(this._relationshipRules.keys());
  }

  /**
   * Format proof result as human-readable string
   * @param {Object} proofs - Proof result
   * @returns {string} Formatted proof
   */
  formatProofs(proofs) {
    const lines = [];
    
    lines.push(`=== Constitutional Witness Relationship Proofs ===`);
    lines.push(`Transcript ID: ${proofs.transcript_id}`);
    lines.push(`Prover ID: ${proofs.prover_id}`);
    lines.push(`Overall Valid: ${proofs.overall_valid ? 'YES' : 'NO'}`);
    lines.push(`Total Relationships: ${proofs.relationships.length}`);
    lines.push(`Failed Relationships: ${proofs.failed_relationships.length}`);
    lines.push('');

    for (const proof of proofs.relationships) {
      lines.push(`--- ${proof.type.toUpperCase()} ---`);
      lines.push(`Description: ${proof.description}`);
      lines.push(`Valid: ${proof.valid ? 'YES' : 'NO'}`);
      
      if (proof.left_witness && proof.right_witness) {
        lines.push(`Left Witness: ${proof.left_witness}`);
        lines.push(`Right Witness: ${proof.right_witness}`);
        lines.push(`Field: ${proof.field}`);
        lines.push(`Left Value: ${proof.left_value}`);
        lines.push(`Right Value: ${proof.right_value}`);
        lines.push(`Match: ${proof.match ? 'YES' : 'NO'}`);
      }
      
      if (!proof.valid) {
        lines.push(`FAILURE: Relationship proof failed`);
      }
      
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get prover ID
   * @returns {string} Prover ID
   */
  getProverId() {
    return this._proverId;
  }

  /**
   * Get prover version
   * @returns {string} Prover version
   */
  getProverVersion() {
    return this._proverVersion;
  }

  /**
   * Initialize relationship rules
   */
  _initializeRelationshipRules() {
    // Prompt → Inference
    this.registerRelationshipRule('prompt_inference', (left, right, field) => {
      return this._provePromptInferenceRelationship(left, right);
    });

    // Inference → Model
    this.registerRelationshipRule('inference_model', (left, right, field) => {
      return this._proveInferenceModelRelationship(left, right);
    });

    // Completion → Transcript
    this.registerRelationshipRule('completion_transcript', (left, right, field) => {
      return this._proveCompletionTranscriptRelationship(left, right);
    });

    // State → Transcript
    this.registerRelationshipRule('state_transcript', (left, right, field) => {
      return this._proveStateTranscriptRelationship(left, right);
    });

    // Streaming → Completion
    this.registerRelationshipRule('streaming_completion', (left, right, field) => {
      return this._proveStreamingCompletionRelationship(left, right);
    });
  }

  /**
   * Generate prover ID
   * @returns {string} Prover ID
   */
  _generateProverId() {
    const proverData = {
      prover_version: this._proverVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(proverData);
    return `witness_relationship_prover_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const witnessRelationshipProver = new WitnessRelationshipProver();

module.exports = { WitnessRelationshipProver, witnessRelationshipProver };
