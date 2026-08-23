const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');

/**
 * Replay Transcript
 * 
 * Phase 5.2 — Constitutional Transcript
 * 
 * Single immutable object containing entire execution:
 * 
 * ReplayTranscript
 * {
 *   runtime
 *   prompt
 *   inference
 *   streaming
 *   tools
 *   reducer
 *   checkpoints
 *   completion
 *   witnesses
 * }
 * 
 * Entire execution.
 * Single canonical artifact.
 * Single canonical hash.
 */

class ReplayTranscript {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._transcriptVersion = '5.0.0';
  }

  /**
   * Create replay transcript
   * @param {Object} transcriptData - Transcript data
   * @param {Object} transcriptData.runtime - Runtime witness
   * @param {Object} transcriptData.prompt - Prompt witness
   * @param {Object} transcriptData.model - Model witness
   * @param {Object} transcriptData.inference - Inference witness
   * @param {Object} transcriptData.streaming - Streaming witness
   * @param {Array} transcriptData.tools - Tool witnesses
   * @param {Object} transcriptData.reducer - Reducer witness
   * @param {Array} transcriptData.checkpoints - Checkpoint witnesses
   * @param {Object} transcriptData.completion - Completion witness
   * @param {Object} transcriptData.state - State witness
   * @returns {Object} Immutable replay transcript
   */
  createTranscript(transcriptData) {
    const transcriptId = this._generateTranscriptId(transcriptData);

    const transcript = {
      transcript_id: transcriptId,
      transcript_version: this._transcriptVersion,
      constitutional_version: '5.0.0',
      
      // Constitutional witnesses
      runtime: transcriptData.runtime,
      prompt: transcriptData.prompt,
      model: transcriptData.model,
      inference: transcriptData.inference,
      streaming: transcriptData.streaming,
      tools: transcriptData.tools || [],
      reducer: transcriptData.reducer,
      checkpoints: transcriptData.checkpoints || [],
      completion: transcriptData.completion,
      state: transcriptData.state,
      
      // Transcript metadata
      transcript_metadata: {
        created_by: 'ReplayTranscript',
        frozen: true,
        hash: null
      }
    };

    // Compute transcript hash (without hash field)
    const transcriptForHash = { ...transcript };
    delete transcriptForHash.transcript_metadata.hash;
    
    transcript.transcript_metadata.hash = CanonicalAuthority.hash(transcriptForHash);
    
    // Create transcript witness
    const transcriptWitness = this._witnessAuthority.createWitness(transcript, {
      authority: 'ReplayTranscript',
      authority_version: '5.0.0'
    });
    
    transcript.transcript_witness = transcriptWitness;

    // Deep freeze to make immutable
    return this._freezeTranscript(transcript);
  }

  /**
   * Create transcript from execution
   * @param {Object} executionData - Execution data
   * @returns {Object} Immutable replay transcript
   */
  createFromExecution(executionData) {
    return this.createTranscript({
      runtime: executionData.runtime_witness,
      prompt: executionData.prompt_witness,
      model: executionData.model_witness,
      inference: executionData.inference_witness,
      streaming: executionData.streaming_witness,
      tools: executionData.tool_witnesses,
      reducer: executionData.reducer_witness,
      checkpoints: executionData.checkpoint_witnesses,
      completion: executionData.completion_witness,
      state: executionData.state_witness
    });
  }

  /**
   * Get transcript hash
   * @param {Object} transcript - Replay transcript
   * @returns {string} Transcript hash
   */
  getTranscriptHash(transcript) {
    return transcript.transcript_metadata.hash;
  }

  /**
   * Get transcript witness
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Transcript witness
   */
  getTranscriptWitness(transcript) {
    return transcript.transcript_witness;
  }

  /**
   * Verify transcript integrity
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Verification result
   */
  verifyTranscript(transcript) {
    // Verify transcript hash
    const transcriptForHash = { ...transcript };
    delete transcriptForHash.transcript_metadata.hash;
    delete transcriptForHash.transcript_witness;
    
    const computedHash = CanonicalAuthority.hash(transcriptForHash);
    
    if (computedHash !== transcript.transcript_metadata.hash) {
      return {
        valid: false,
        reason: 'Transcript hash mismatch',
        expected: transcript.transcript_metadata.hash,
        actual: computedHash
      };
    }

    // Verify transcript witness
    const witnessVerification = this._witnessAuthority.verifyWitness(transcript.transcript_witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }

    return {
      valid: true,
      reason: 'Transcript verified'
    };
  }

  /**
   * Compare two transcripts
   * @param {Object} transcript1 - First transcript
   * @param {Object} transcript2 - Second transcript
   * @returns {Object} Comparison result
   */
  compareTranscripts(transcript1, transcript2) {
    // Compare transcript hashes
    if (transcript1.transcript_metadata.hash !== transcript2.transcript_metadata.hash) {
      return {
        equivalent: false,
        reason: 'Transcript hashes differ',
        transcript1: transcript1.transcript_metadata.hash,
        transcript2: transcript2.transcript_metadata.hash
      };
    }

    // Compare completion hashes
    if (transcript1.completion.completion_hash !== transcript2.completion.completion_hash) {
      return {
        equivalent: false,
        reason: 'Completion hashes differ',
        transcript1: transcript1.completion.completion_hash,
        transcript2: transcript2.completion.completion_hash
      };
    }

    // Compare witness hashes
    const witnessEquivalence = this._witnessAuthority.verifyWitnessEquivalence(
      transcript1.transcript_witness,
      transcript2.transcript_witness
    );

    if (!witnessEquivalence.valid) {
      return {
        equivalent: false,
        reason: 'Witness hashes differ',
        ...witnessEquivalence
      };
    }

    return {
      equivalent: true,
      reason: 'Transcripts are equivalent'
    };
  }

  /**
   * Serialize transcript to canonical bytes
   * @param {Object} transcript - Replay transcript
   * @returns {string} Canonical bytes
   */
  serializeTranscript(transcript) {
    return CanonicalBytes.serialize(transcript);
  }

  /**
   * Deserialize transcript from canonical bytes
   * @param {string} canonicalBytes - Canonical bytes
   * @returns {Object} Replay transcript
   */
  deserializeTranscript(canonicalBytes) {
    const transcript = JSON.parse(canonicalBytes);
    
    // Verify integrity after deserialization
    const verification = this.verifyTranscript(transcript);
    if (!verification.valid) {
      throw this._failureAuthority.createFailure(
        'TRANSCRIPT_DESERIALIZATION_FAILED',
        'REPLAY_VERIFICATION',
        { 
          reason: verification.reason
        }
      );
    }

    return transcript;
  }

  /**
   * Generate transcript ID from constitutional data
   * @param {Object} transcriptData - Transcript data
   * @returns {string} Transcript ID
   */
  _generateTranscriptId(transcriptData) {
    const idData = {
      runtime_hash: transcriptData.runtime?.witness_metadata?.hash,
      prompt_hash: transcriptData.prompt?.prompt_hash,
      model_digest: transcriptData.model?.digest,
      inference_hash: transcriptData.inference?.witness_metadata?.hash,
      completion_hash: transcriptData.completion?.completion_hash
    };
    const hash = CanonicalAuthority.hash(idData);
    return `transcript_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze transcript to make immutable
   * @param {Object} transcript - Replay transcript
   * @returns {Object} Frozen transcript
   */
  _freezeTranscript(transcript) {
    // Deep freeze the transcript object
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

    return freeze(transcript);
  }

  /**
   * Get transcript version
   * @returns {string} Transcript version
   */
  getTranscriptVersion() {
    return this._transcriptVersion;
  }
}

// Singleton instance
const replayTranscript = new ReplayTranscript();

module.exports = { ReplayTranscript, replayTranscript };
