const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');

/**
 * Streaming Authority
 * 
 * Phase 4.5 — Streaming Authority
 * 
 * Instead of:
 * stream -> console
 * 
 * produce:
 * stream
 *   ↓
 * canonical chunk
 *   ↓
 * chunk witness
 *   ↓
 * assembled completion
 *   ↓
 * completion witness
 */

class StreamingAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._chunkHistory = new Map();
    this._completionHistory = new Map();
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Process stream chunk
   * @param {Object} chunkData - Chunk data
   * @param {string} chunkData.stream_id - Stream ID
   * @param {number} chunkData.chunk_index - Chunk index
   * @param {string} chunkData.content - Chunk content
   * @param {string} chunkData.replay_id - Replay ID
   * @returns {Object} Chunk with witness
   */
  processChunk(chunkData) {
    const chunkId = this._generateChunkId(chunkData.stream_id, chunkData.chunk_index);
    
    // Canonicalize chunk
    const canonicalChunk = this._canonicalizeChunk(chunkData);
    
    // Create chunk witness
    const chunkWitness = this._createChunkWitness({
      chunk_id: chunkId,
      stream_id: chunkData.stream_id,
      chunk_index: chunkData.chunk_index,
      canonical_chunk: canonicalChunk,
      replay_id: chunkData.replay_id
    });
    
    const result = {
      chunk_id: chunkId,
      stream_id: chunkData.stream_id,
      chunk_index: chunkData.chunk_index,
      content: chunkData.content,
      canonical_chunk: canonicalChunk,
      chunk_witness: chunkWitness,
      authority_id: this._authorityId
    };
    
    this._chunkHistory.set(chunkId, result);
    
    return result;
  }

  /**
   * Assemble completion from chunks
   * @param {Array} chunks - Array of chunks
   * @param {string} streamId - Stream ID
   * @param {string} replayId - Replay ID
   * @returns {Object} Assembled completion with witness
   */
  assembleCompletion(chunks, streamId, replayId) {
    // Sort chunks by index with chunk_id as tie breaker (immutable sort)
    const sortedChunks = [...chunks].sort((a, b) => {
      if (a.chunk_index !== b.chunk_index) {
        return a.chunk_index - b.chunk_index;
      }
      // Use chunk_id as bytewise comparator tie breaker
      return a.chunk_id.localeCompare(b.chunk_id);
    });
    
    // Assemble completion
    const completion = sortedChunks.map(chunk => chunk.content).join('');
    
    // Create completion witness
    const completionWitness = this._createCompletionWitness({
      stream_id: streamId,
      chunk_count: sortedChunks.length,
      completion: completion,
      chunk_witnesses: sortedChunks.map(chunk => chunk.chunk_witness),
      replay_id: replayId
    });
    
    const result = {
      stream_id: streamId,
      completion: completion,
      chunk_count: sortedChunks.length,
      completion_witness: completionWitness,
      authority_id: this._authorityId
    };
    
    this._completionHistory.set(streamId, result);
    
    return result;
  }

  /**
   * Canonicalize chunk
   * @param {Object} chunkData - Raw chunk data
   * @returns {Object} Canonical chunk
   */
  _canonicalizeChunk(chunkData) {
    return {
      stream_id: chunkData.stream_id,
      chunk_index: chunkData.chunk_index,
      content: this._normalizeContent(chunkData.content),
      content_hash: CanonicalAuthority.hash(chunkData.content)
    };
  }

  /**
   * Normalize content
   * @param {string} content - Content to normalize
   * @returns {string} Normalized content
   */
  _normalizeContent(content) {
    if (typeof content !== 'string') {
      content = String(content);
    }

    // UTF-8 normalization (NFC)
    content = content.normalize('NFC');

    // Normalize line endings (CRLF → LF)
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(/\r/g, '\n');

    // No other modifications - preserve exact model output
    return content;
  }

  /**
   * Create chunk witness
   * @param {Object} witnessData - Witness data
   * @returns {Object} Chunk witness
   */
  _createChunkWitness(witnessData) {
    const witness = {
      chunk_id: witnessData.chunk_id,
      stream_id: witnessData.stream_id,
      chunk_index: witnessData.chunk_index,
      content_hash: witnessData.canonical_chunk.content_hash,
      authority_id: this._authorityId,
      witness_metadata: {
        created_by: 'StreamingAuthority',
        frozen: true,
        hash: null
      }
    };

    // Use WitnessAuthority for hashing
    witness.witness_metadata.hash = witnessAuthority.createWitness(witness, {
      authority: 'StreamingAuthority',
      authority_version: '4.0.0'
    }).witness_metadata.hash;
    
    return witness;
  }

  /**
   * Create completion witness
   * @param {Object} witnessData - Witness data
   * @returns {Object} Completion witness
   */
  _createCompletionWitness(witnessData) {
    const completionHash = CanonicalAuthority.hash(witnessData.completion);
    
    const witness = {
      stream_id: witnessData.stream_id,
      chunk_count: witnessData.chunk_count,
      completion_hash: completionHash,
      chunk_witness_hashes: witnessData.chunk_witnesses.map(w => w.witness_metadata.hash),
      authority_id: this._authorityId,
      witness_metadata: {
        created_by: 'StreamingAuthority',
        frozen: true,
        hash: null
      }
    };

    // Use WitnessAuthority for hashing
    witness.witness_metadata.hash = witnessAuthority.createWitness(witness, {
      authority: 'StreamingAuthority',
      authority_version: '4.0.0'
    }).witness_metadata.hash;
    
    return witness;
  }

  /**
   * Verify chunk witness
   * @param {Object} witness - Chunk witness to verify
   * @returns {Object} Verification result
   */
  verifyChunkWitness(witness) {
    // Use WitnessAuthority to verify (hashes copy with hash removed)
    return witnessAuthority.verifyWitness(witness);
  }

  /**
   * Verify completion witness
   * @param {Object} witness - Completion witness to verify
   * @param {string} completion - Completion to verify against
   * @returns {Object} Verification result
   */
  verifyCompletionWitness(witness, completion) {
    // Use WitnessAuthority to verify (hashes copy with hash removed)
    const witnessVerification = witnessAuthority.verifyWitness(witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }

    const completionHash = CanonicalAuthority.hash(completion);
    
    if (completionHash !== witness.completion_hash) {
      return {
        valid: false,
        reason: 'Completion hash mismatch',
        expected: witness.completion_hash,
        actual: completionHash
      };
    }

    return {
      valid: true,
      reason: 'Completion witness verified'
    };
  }

  /**
   * Verify stream replay equivalence
   * @param {Object} completion1 - First completion
   * @param {Object} completion2 - Second completion
   * @returns {Object} Verification result
   */
  verifyStreamReplayEquivalence(completion1, completion2) {
    // Check completion hash
    if (completion1.completion_witness.completion_hash !== 
        completion2.completion_witness.completion_hash) {
      return {
        valid: false,
        reason: 'Completion hash mismatch',
        completion1: completion1.completion_witness.completion_hash,
        completion2: completion2.completion_witness.completion_hash
      };
    }

    // Check chunk count
    if (completion1.chunk_count !== completion2.chunk_count) {
      return {
        valid: false,
        reason: 'Chunk count mismatch',
        completion1: completion1.chunk_count,
        completion2: completion2.chunk_count
      };
    }

    // Check chunk witness hashes
    for (let i = 0; i < completion1.completion_witness.chunk_witness_hashes.length; i++) {
      if (completion1.completion_witness.chunk_witness_hashes[i] !== 
          completion2.completion_witness.chunk_witness_hashes[i]) {
        return {
          valid: false,
          reason: 'Chunk witness hash mismatch at index',
          index: i,
          completion1: completion1.completion_witness.chunk_witness_hashes[i],
          completion2: completion2.completion_witness.chunk_witness_hashes[i]
        };
      }
    }

    return {
      valid: true,
      reason: 'Stream replay equivalence verified'
    };
  }

  /**
   * Get chunk by ID
   * @param {string} chunkId - Chunk ID
   * @returns {Object} Chunk
   */
  getChunk(chunkId) {
    return this._chunkHistory.get(chunkId);
  }

  /**
   * Get completion by stream ID
   * @param {string} streamId - Stream ID
   * @returns {Object} Completion
   */
  getCompletion(streamId) {
    return this._completionHistory.get(streamId);
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Clear history (for testing)
   */
  clear() {
    this._chunkHistory.clear();
    this._completionHistory.clear();
  }

  /**
   * Generate chunk ID
   * @param {string} streamId - Stream ID
   * @param {number} chunkIndex - Chunk index
   * @returns {string} Chunk ID
   */
  _generateChunkId(streamId, chunkIndex) {
    const chunkData = {
      stream_id: streamId,
      chunk_index: chunkIndex
    };
    const hash = CanonicalAuthority.hash(chunkData);
    return `chunk_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '4.0.0',
      constitutional_version: '4.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `streaming_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const streamingAuthority = new StreamingAuthority();

module.exports = { StreamingAuthority, streamingAuthority };
