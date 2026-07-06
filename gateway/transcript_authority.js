const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { authorityRepository } = require('./authority_repository');

/**
 * Transcript Authority
 * 
 * Phase 12 — Persistent Ollama Runtime
 * 
 * One authority owns:
 * 
 * Transcript
 *   ↓
 * canonical ordering
 *   ↓
 * canonical bytes
 *   ↓
 * transcript hash
 *   ↓
 * transcript witness
 * 
 * Every transcript produces TranscriptWitness.
 * Replay consumes exactly one transcript.
 */

class TranscriptAuthority {
  constructor() {
    this._repository = authorityRepository;
    this._authorityId = this._generateAuthorityId();
    this._authorityVersion = '12.0.0';
  }

  /**
   * Create and register transcript
   * @param {Object} transcriptData - Transcript data
   * @returns {Object} Registered transcript
   */
  createTranscript(transcriptData) {
    // Build canonical transcript
    const canonicalTranscript = this._buildCanonicalTranscript(transcriptData);
    
    // Compute transcript hash
    const transcriptHash = CanonicalAuthority.hash(canonicalTranscript);
    
    // Generate transcript ID
    const transcriptId = this._generateTranscriptId(transcriptHash);
    
    // Create transcript witness
    const transcriptWitness = witnessAuthority.createWitness(canonicalTranscript, {
      authority: 'TranscriptAuthority',
      authority_version: '12.0.0'
    });
    
    const transcript = {
      transcript_id: transcriptId,
      canonical_transcript: canonicalTranscript,
      transcript_hash: transcriptHash,
      authority_id: this._authorityId,
      transcript_witness: transcriptWitness,
      transcript_metadata: {
        created_by: 'TranscriptAuthority',
        created_at: constitutionalTimeAuthority.now(),
        message_count: canonicalTranscript.messages.length
      }
    };
    
    // Store in repository
    this._repository.registerTranscript(transcriptId, transcript);
    
    return transcript;
  }

  /**
   * Build canonical transcript
   * @param {Object} transcriptData - Raw transcript data
   * @returns {Object} Canonical transcript
   */
  _buildCanonicalTranscript(transcriptData) {
    const canonical = {
      version: '12.0.0',
      messages: []
    };

    // Add messages in canonical order
    if (transcriptData.messages && Array.isArray(transcriptData.messages)) {
      canonical.messages = transcriptData.messages.map(msg => ({
        role: msg.role,
        content: this._normalizeContent(msg.content),
        timestamp: msg.timestamp || constitutionalTimeAuthority.now()
      }));
    }

    // Add prompt/completion references if present
    if (transcriptData.prompt_id) {
      canonical.prompt_id = transcriptData.prompt_id;
    }
    if (transcriptData.completion_id) {
      canonical.completion_id = transcriptData.completion_id;
    }

    return canonical;
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

    // Normalize line endings
    content = content.replace(/\r\n/g, '\n');
    content = content.replace(/\r/g, '\n');

    return content;
  }

  /**
   * Get transcript by ID
   * @param {string} transcriptId - Transcript ID
   * @returns {Object} Transcript
   */
  getTranscript(transcriptId) {
    return this._repository.getTranscript(transcriptId);
  }

  /**
   * Get transcript hash
   * @param {string} transcriptId - Transcript ID
   * @returns {string} Transcript hash
   */
  getTranscriptHash(transcriptId) {
    const transcript = this.getTranscript(transcriptId);
    if (!transcript) {
      return null;
    }
    return transcript.transcript_hash;
  }

  /**
   * Verify transcript
   * @param {string} transcriptId - Transcript ID
   * @returns {Object} Verification result
   */
  verifyTranscript(transcriptId) {
    const transcript = this.getTranscript(transcriptId);
    if (!transcript) {
      return {
        valid: false,
        reason: 'Transcript not found'
      };
    }

    // Verify hash
    const computedHash = CanonicalAuthority.hash(transcript.canonical_transcript);
    const valid = computedHash === transcript.transcript_hash;

    return {
      valid: valid,
      reason: valid ? 'Hash verified' : 'Hash mismatch'
    };
  }

  /**
   * Compare two transcripts
   * @param {string} transcriptId1 - First transcript ID
   * @param {string} transcriptId2 - Second transcript ID
   * @returns {Object} Comparison result
   */
  compareTranscripts(transcriptId1, transcriptId2) {
    const transcript1 = this.getTranscript(transcriptId1);
    const transcript2 = this.getTranscript(transcriptId2);

    if (!transcript1 || !transcript2) {
      return {
        equivalent: false,
        reason: 'One or both transcripts not found'
      };
    }

    const equivalent = transcript1.transcript_hash === transcript2.transcript_hash;

    return {
      equivalent: equivalent,
      reason: equivalent ? 'Transcripts are equivalent' : 'Transcripts differ'
    };
  }

  /**
   * Get transcripts by prompt
   * @param {string} promptId - Prompt ID
   * @returns {Array} Transcripts
   */
  getTranscriptsByPrompt(promptId) {
    return this._repository.getTranscriptsByPrompt(promptId);
  }

  /**
   * Get transcripts by completion
   * @param {string} completionId - Completion ID
   * @returns {Array} Transcripts
   */
  getTranscriptsByCompletion(completionId) {
    return this._repository.getTranscriptsByCompletion(completionId);
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
   * Generate transcript ID from hash
   * @param {string} transcriptHash - Transcript hash
   * @returns {string} Transcript ID
   */
  _generateTranscriptId(transcriptHash) {
    return `transcript_${transcriptHash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: this._authorityVersion,
      constitutional_version: '12.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `transcript_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const transcriptAuthority = new TranscriptAuthority();

module.exports = { TranscriptAuthority, transcriptAuthority };
