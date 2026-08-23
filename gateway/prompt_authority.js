const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { authorityRepository } = require('./authority_repository');

/**
 * Prompt Authority
 * 
 * Phase 12 — Persistent Ollama Runtime
 * 
 * Canonicalize:
 * - system
 * - developer
 * - constitutional
 * - user
 * - attachments
 * - tool outputs
 * 
 * into canonical prompt bytes before Ollama ever sees it.
 * 
 * Every prompt produces PromptWitness.
 */

class PromptAuthority {
  constructor() {
    this._repository = authorityRepository;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Canonicalize prompt
   * @param {Object} promptData - Prompt data
   * @param {string} promptData.system - System message
   * @param {string} promptData.developer - Developer message
   * @param {string} promptData.constitutional - Constitutional message
   * @param {string} promptData.user - User message
   * @param {Array} promptData.attachments - Attachments
   * @param {Array} promptData.tool_outputs - Tool outputs
   * @returns {Object} Canonical prompt with hash
   */
  canonicalizePrompt(promptData) {
    // Build canonical prompt structure
    const canonicalPrompt = this._buildCanonicalPrompt(promptData);
    
    // Compute prompt hash using CanonicalAuthority
    const promptHash = CanonicalAuthority.hash(canonicalPrompt);
    
    // Generate prompt ID
    const promptId = this._generatePromptId(promptHash);
    
    // Create prompt witness
    const promptWitness = witnessAuthority.createWitness(canonicalPrompt, {
      authority: 'PromptAuthority',
      authority_version: '12.0.0'
    });
    
    const result = {
      prompt_id: promptId,
      canonical_prompt: canonicalPrompt,
      prompt_hash: promptHash,
      authority_id: this._authorityId,
      prompt_witness: promptWitness,
      prompt_metadata: {
        created_by: 'PromptAuthority',
        frozen: true,
        hash: promptHash,
        created_at: constitutionalTimeAuthority.now()
      }
    };
    
    // Store in repository
    this._repository.registerPrompt(promptId, result);
    
    return result;
  }

  /**
   * Build canonical prompt structure
   * @param {Object} promptData - Raw prompt data
   * @returns {Object} Canonical prompt
   */
  _buildCanonicalPrompt(promptData) {
    const canonical = {
      version: '12.0.0',
      messages: []
    };

    // Add system message if present
    if (promptData.system) {
      canonical.messages.push({
        role: 'system',
        content: this._normalizeContent(promptData.system)
      });
    }

    // Add developer message if present
    if (promptData.developer) {
      canonical.messages.push({
        role: 'developer',
        content: this._normalizeContent(promptData.developer)
      });
    }

    // Add constitutional message if present
    if (promptData.constitutional) {
      canonical.messages.push({
        role: 'constitutional',
        content: this._normalizeContent(promptData.constitutional)
      });
    }

    // Add user message if present
    if (promptData.user) {
      canonical.messages.push({
        role: 'user',
        content: this._normalizeContent(promptData.user)
      });
    }

    // Add attachments if present
    if (promptData.attachments && Array.isArray(promptData.attachments)) {
      canonical.attachments = promptData.attachments.map(attachment => ({
        type: attachment.type,
        name: attachment.name,
        content_hash: CanonicalAuthority.hash(attachment.content),
        metadata: attachment.metadata || {}
      }));
    }

    // Add tool outputs if present
    if (promptData.tool_outputs && Array.isArray(promptData.tool_outputs)) {
      canonical.tool_outputs = promptData.tool_outputs.map(output => ({
        tool_id: output.tool_id,
        tool_name: output.tool_name,
        output_hash: CanonicalAuthority.hash(output.output),
        metadata: output.metadata || {}
      }));
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
   * Get prompt by ID
   * @param {string} promptId - Prompt ID
   * @returns {Object} Prompt result
   */
  getPrompt(promptId) {
    return this._repository.getPrompt(promptId);
  }

  /**
   * Verify prompt hash
   * @param {string} promptId - Prompt ID
   * @param {string} expectedHash - Expected hash
   * @returns {boolean} True if valid
   */
  verifyPromptHash(promptId, expectedHash) {
    const prompt = this.getPrompt(promptId);
    if (!prompt) {
      return false;
    }

    return prompt.prompt_hash === expectedHash;
  }

  /**
   * Get authority ID
   * @returns {string} Authority ID
   */
  getAuthorityId() {
    return this._authorityId;
  }

  /**
   * Generate prompt ID from hash
   * @param {string} promptHash - Prompt hash
   * @returns {string} Prompt ID
   */
  _generatePromptId(promptHash) {
    return `prompt_${promptHash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '12.0.0',
      constitutional_version: '12.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `prompt_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const promptAuthority = new PromptAuthority();

module.exports = { PromptAuthority, promptAuthority };
