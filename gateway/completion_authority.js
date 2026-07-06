/**
 * Completion Authority
 * 
 * Phase 18 — Structured Ollama Output
 * 
 * Manages completion generation and witnessing.
 * 
 * Every completion produces:
 * - CompletionWitness
 * - ContextWitness
 * - ModelWitness
 * 
 * No completion exists without witnesses.
 * 
 * Structured output format:
 * {
 *   "analysis": "...",
 *   "changes": [...],
 *   "tests": [...],
 *   "reasoning": [...],
 *   "confidence": 0.92,
 *   "requires_human": false
 * }
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { authorityRepository } = require('./authority_repository');

class CompletionAuthority {
  constructor() {
    this._repository = authorityRepository;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Generate completion with witnesses
   * @param {Object} completionData - Completion data
   * @param {string} completionData.prompt_id - Prompt ID
   * @param {string} completionData.model - Model name
   * @param {string} completionData.completion - Completion text
   * @param {Object} completionData.context - Context data
   * @param {Object} completionData.metadata - Additional metadata
   * @returns {Object} Completion with witnesses
   */
  generateCompletion(completionData) {
    const completionHash = CanonicalAuthority.hash(completionData.completion);
    const completionId = this._generateCompletionId(completionHash);

    // Create completion witness
    const completionWitness = witnessAuthority.createWitness({
      completion_id: completionId,
      completion: completionData.completion,
      completion_hash: completionHash
    }, {
      authority: 'CompletionAuthority',
      authority_version: '12.0.0'
    });

    // Create context witness
    const contextWitness = witnessAuthority.createWitness({
      completion_id: completionId,
      context: completionData.context,
      context_hash: CanonicalAuthority.hash(completionData.context)
    }, {
      authority: 'CompletionAuthority',
      authority_version: '12.0.0',
      witness_type: 'context'
    });

    // Create model witness
    const modelWitness = witnessAuthority.createWitness({
      completion_id: completionId,
      model: completionData.model,
      model_digest: this._computeModelDigest(completionData.model)
    }, {
      authority: 'CompletionAuthority',
      authority_version: '12.0.0',
      witness_type: 'model'
    });

    const result = {
      completion_id: completionId,
      prompt_id: completionData.prompt_id,
      model: completionData.model,
      completion: completionData.completion,
      completion_hash: completionHash,
      authority_id: this._authorityId,
      completion_witness: completionWitness,
      context_witness: contextWitness,
      model_witness: modelWitness,
      completion_metadata: {
        created_by: 'CompletionAuthority',
        created_at: constitutionalTimeAuthority.now(),
        token_count: this._estimateTokenCount(completionData.completion),
        context_size: this._estimateContextSize(completionData.context)
      }
    };

    // Store in repository
    this._repository.registerCompletion(completionId, result);

    return result;
  }

  /**
   * Compute model digest
   * @param {string} model - Model name
   * @returns {string} Model digest
   */
  _computeModelDigest(model) {
    return CanonicalAuthority.hash({ model, version: '12.0.0' });
  }

  /**
   * Estimate token count
   * @param {string} text - Text to estimate
   * @returns {number} Estimated token count
   */
  _estimateTokenCount(text) {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimate context size
   * @param {Object} context - Context object
   * @returns {number} Estimated context size in tokens
   */
  _estimateContextSize(context) {
    const contextString = JSON.stringify(context);
    return this._estimateTokenCount(contextString);
  }

  /**
   * Get completion by ID
   * @param {string} completionId - Completion ID
   * @returns {Object} Completion
   */
  getCompletion(completionId) {
    return this._repository.getCompletion(completionId);
  }

  /**
   * Verify completion hash
   * @param {string} completionId - Completion ID
   * @param {string} expectedHash - Expected hash
   * @returns {boolean} True if valid
   */
  verifyCompletionHash(completionId, expectedHash) {
    const completion = this.getCompletion(completionId);
    if (!completion) {
      return false;
    }

    return completion.completion_hash === expectedHash;
  }

  /**
   * Verify structured output format
   * @param {string} completionId - Completion ID
   * @returns {Object} Verification result
   */
  verifyStructuredOutput(completionId) {
    const completion = this.getCompletion(completionId);
    if (!completion) {
      return {
        valid: false,
        reason: 'Completion not found'
      };
    }

    try {
      const parsed = JSON.parse(completion.completion);
      
      // Verify required fields
      const requiredFields = ['analysis', 'changes', 'tests', 'reasoning', 'confidence', 'requires_human'];
      const missingFields = requiredFields.filter(field => !(field in parsed));
      
      if (missingFields.length > 0) {
        return {
          valid: false,
          reason: `Missing required fields: ${missingFields.join(', ')}`
        };
      }

      // Verify types
      if (typeof parsed.analysis !== 'string') {
        return { valid: false, reason: 'analysis must be a string' };
      }
      if (!Array.isArray(parsed.changes)) {
        return { valid: false, reason: 'changes must be an array' };
      }
      if (!Array.isArray(parsed.tests)) {
        return { valid: false, reason: 'tests must be an array' };
      }
      if (!Array.isArray(parsed.reasoning)) {
        return { valid: false, reason: 'reasoning must be an array' };
      }
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
        return { valid: false, reason: 'confidence must be a number between 0 and 1' };
      }
      if (typeof parsed.requires_human !== 'boolean') {
        return { valid: false, reason: 'requires_human must be a boolean' };
      }

      // Verify change structure
      for (const change of parsed.changes) {
        if (!change.file_path || !change.change_type || !('content' in change)) {
          return { valid: false, reason: 'Each change must have file_path, change_type, and content' };
        }
        if (!['add', 'modify', 'delete'].includes(change.change_type)) {
          return { valid: false, reason: 'change_type must be add, modify, or delete' };
        }
      }

      // Verify test structure
      for (const test of parsed.tests) {
        if (!test.file_path || !test.test_name || !test.test_code) {
          return { valid: false, reason: 'Each test must have file_path, test_name, and test_code' };
        }
      }

      return {
        valid: true,
        parsed: parsed,
        reason: 'Structured output is valid'
      };

    } catch (error) {
      return {
        valid: false,
        reason: `Failed to parse completion as JSON: ${error.message}`
      };
    }
  }

  /**
   * Get completions by prompt
   * @param {string} promptId - Prompt ID
   * @returns {Array} Completions
   */
  getCompletionsByPrompt(promptId) {
    return this._repository.getCompletionsByPrompt(promptId);
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Generate completion ID from hash
   * @param {string} completionHash - Completion hash
   * @returns {string} Completion ID
   */
  _generateCompletionId(completionHash) {
    return `completion_${completionHash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '18.0.0',
      constitutional_version: '18.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `completion_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const completionAuthority = new CompletionAuthority();

module.exports = { CompletionAuthority, completionAuthority };
