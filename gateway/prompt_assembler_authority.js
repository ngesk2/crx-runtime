/**
 * Prompt Assembler Authority
 * 
 * Phase 17 — Constitutional Prompt Builder
 * 
 * Instead of giant string prompts, create structured, reproducible prompts.
 * 
 * Sections:
 * SYSTEM
 * ↓
 * Constitution
 * ↓
 * Mission
 * ↓
 * Current Repository
 * ↓
 * Architecture
 * ↓
 * Relevant Memories
 * ↓
 * Relevant Patterns
 * ↓
 * Relevant APIs
 * ↓
 * Transcript
 * ↓
 * Current File
 * ↓
 * Requested Output
 * ↓
 * Witness Hash
 * 
 * Every prompt becomes reproducible.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { promptAuthority } = require('./prompt_authority');

class PromptAssemblerAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize authority
   */
  async initialize() {
    await this._createTables();
  }

  /**
   * Create tables
   */
  async _createTables() {
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS assembled_prompts (
        prompt_id VARCHAR(64) PRIMARY KEY,
        mission_id VARCHAR(64),
        prompt_hash VARCHAR(64) NOT NULL,
        prompt_sections JSONB NOT NULL,
        witness_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_assembled_prompts_mission ON assembled_prompts(mission_id)
    `);
  }

  /**
   * Assemble prompt
   * @param {Object} request - Assembly request
   * @returns {Object} Assembled prompt
   */
  async assemblePrompt(request) {
    const promptId = this._generatePromptId(request.mission.mission_id);

    const sections = {
      system: await this._assembleSystemSection(),
      constitution: await this._assembleConstitutionSection(),
      mission: await this._assembleMissionSection(request.mission),
      current_repository: await this._assembleRepositorySection(request.context.repository),
      architecture: await this._assembleArchitectureSection(request.context.architecture_memory),
      relevant_memories: await this._assembleMemoriesSection(request.context.facts),
      relevant_patterns: await this._assemblePatternsSection(request.context.patterns),
      relevant_apis: await this._assembleAPIsSection(request.context.repository),
      transcript: await this._assembleTranscriptSection(request.context.compressed_transcript),
      current_file: await this._assembleCurrentFileSection(request.context.current_file),
      requested_output: await this._assembleOutputSection(request.mission)
    };

    // Build canonical prompt data
    const canonicalPrompt = {
      version: '17.0.0',
      sections: sections,
      assembled_at: constitutionalTimeAuthority.now()
    };

    // Compute prompt hash
    const promptHash = CanonicalAuthority.hash(canonicalPrompt);

    // Create prompt witness
    const witness = witnessAuthority.createWitness(canonicalPrompt, {
      authority: 'PromptAssemblerAuthority',
      authority_version: '17.0.0'
    });

    // Store assembled prompt
    await this._postgres.query(`
      INSERT INTO assembled_prompts (prompt_id, mission_id, prompt_hash, prompt_sections, witness_hash)
      VALUES ($1, $2, $3, $4, $5)
    `, [promptId, request.mission.mission_id, promptHash, JSON.stringify(sections), witness.witness_metadata.hash]);

    // Canonicalize through PromptAuthority
    const canonicalized = promptAuthority.canonicalizePrompt({
      system: sections.system,
      constitutional: sections.constitution,
      user: this._buildUserPrompt(sections)
    });

    return {
      prompt_id: promptId,
      canonical_prompt: canonicalized,
      sections: sections,
      prompt_hash: promptHash,
      witness: witness,
      prompt_metadata: {
        mission_id: request.mission.mission_id,
        section_count: Object.keys(sections).length,
        assembled_at: constitutionalTimeAuthority.now()
      }
    };
  }

  /**
   * Assemble system section
   * @returns {string} System section
   */
  async _assembleSystemSection() {
    return `You are a constitutional AI assistant. All actions must be deterministic, reproducible, and witness-backed.`;
  }

  /**
   * Assemble constitution section
   * @returns {string} Constitution section
   */
  async _assembleConstitutionSection() {
    return `Constitutional Principles:
1. All code must be deterministic and reproducible
2. All changes must be witnessed and verifiable
3. All patches must pass validation and tests
4. All commits must be approved before merging
5. All retrieval must be ranked and witnessed`;
  }

  /**
   * Assemble mission section
   * @param {Object} mission - Mission
   * @returns {string} Mission section
   */
  async _assembleMissionSection(mission) {
    return `Mission:
Type: ${mission.mission_type}
Description: ${mission.mission_description}
Priority: ${mission.priority}
Feasibility: ${mission.feasibility_score}`;
  }

  /**
   * Assemble repository section
   * @param {Object} repository - Repository
   * @returns {string} Repository section
   */
  async _assembleRepositorySection(repository) {
    if (!repository) {
      return 'Repository: None';
    }

    return `Repository:
Name: ${repository.repository_name}
URL: ${repository.repository_url}
Type: ${repository.repository_type}`;
  }

  /**
   * Assemble architecture section
   * @param {Array} architectureMemory - Architecture memory
   * @returns {string} Architecture section
   */
  async _assembleArchitectureSection(architectureMemory) {
    if (!architectureMemory || architectureMemory.length === 0) {
      return 'Architecture: None';
    }

    const architectures = architectureMemory.map(arch => 
      `- ${arch.architecture_name}: ${arch.architecture_description}`
    ).join('\n');

    return `Architecture:\n${architectures}`;
  }

  /**
   * Assemble memories section
   * @param {Array} facts - Facts
   * @returns {string} Memories section
   */
  async _assembleMemoriesSection(facts) {
    if (!facts || facts.length === 0) {
      return 'Relevant Memories: None';
    }

    const memories = facts.slice(0, 10).map(fact => 
      `- [${fact.confidence}] ${fact.fact_text}`
    ).join('\n');

    return `Relevant Memories:\n${memories}`;
  }

  /**
   * Assemble patterns section
   * @param {Array} patterns - Patterns
   * @returns {string} Patterns section
   */
  async _assemblePatternsSection(patterns) {
    if (!patterns || patterns.length === 0) {
      return 'Relevant Patterns: None';
    }

    const patternList = patterns.slice(0, 5).map(pattern => 
      `- [${pattern.pattern_frequency}x] ${pattern.pattern_name}: ${pattern.pattern_description}`
    ).join('\n');

    return `Relevant Patterns:\n${patternList}`;
  }

  /**
   * Assemble APIs section
   * @param {Object} repository - Repository
   * @returns {string} APIs section
   */
  async _assembleAPIsSection(repository) {
    // Placeholder - in production, retrieve actual APIs
    return 'Relevant APIs: None';
  }

  /**
   * Assemble transcript section
   * @param {Object} compressedTranscript - Compressed transcript
   * @returns {string} Transcript section
   */
  async _assembleTranscriptSection(compressedTranscript) {
    if (!compressedTranscript) {
      return 'Transcript: None';
    }

    return `Transcript Summary:
Summary Count: ${compressedTranscript.summary_count}
Fact Count: ${compressedTranscript.fact_count}
Entity Count: ${compressedTranscript.entity_count}`;
  }

  /**
   * Assemble current file section
   * @param {Object} currentFile - Current file
   * @returns {string} Current file section
   */
  async _assembleCurrentFileSection(currentFile) {
    if (!currentFile) {
      return 'Current File: None';
    }

    return `Current File:
Path: ${currentFile.file_path}
Hash: ${currentFile.file_hash}`;
  }

  /**
   * Assemble output section
   * @param {Object} mission - Mission
   * @returns {string} Output section
   */
  async _assembleOutputSection(mission) {
    return `Requested Output Format:
{
  "analysis": "...",
  "changes": [
    {
      "file_path": "...",
      "change_type": "add|modify|delete",
      "content": "..."
    }
  ],
  "tests": [
    {
      "file_path": "...",
      "test_name": "...",
      "test_code": "..."
    }
  ],
  "reasoning": ["..."],
  "confidence": 0.92,
  "requires_human": false
}`;
  }

  /**
   * Build user prompt from sections
   * @param {Object} sections - Prompt sections
   * @returns {string} User prompt
   */
  _buildUserPrompt(sections) {
    return Object.entries(sections)
      .map(([key, value]) => `${key.toUpperCase()}\n${value}`)
      .join('\n\n');
  }

  /**
   * Get assembled prompt
   * @param {string} promptId - Prompt ID
   * @returns {Object} Assembled prompt
   */
  async getAssembledPrompt(promptId) {
    const result = await this._postgres.query(`
      SELECT * FROM assembled_prompts WHERE prompt_id = $1
    `, [promptId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Get prompts for mission
   * @param {string} missionId - Mission ID
   * @returns {Array} Prompts
   */
  async getPromptsForMission(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM assembled_prompts WHERE mission_id = $1 ORDER BY created_at DESC
    `, [missionId]);

    return result.rows;
  }

  /**
   * Verify prompt hash
   * @param {string} promptId - Prompt ID
   * @returns {Object} Verification result
   */
  async verifyPromptHash(promptId) {
    const result = await this._postgres.query(`
      SELECT prompt_sections, prompt_hash FROM assembled_prompts WHERE prompt_id = $1
    `, [promptId]);

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Prompt not found' };
    }

    const prompt = result.rows[0];
    const computedHash = CanonicalAuthority.hash(prompt.prompt_sections);
    const valid = computedHash === prompt.prompt_hash;

    return {
      valid: valid,
      reason: valid ? 'Hash verified' : 'Hash mismatch'
    };
  }

  /**
   * Generate prompt ID
   * @param {string} missionId - Mission ID
   * @returns {string} Prompt ID
   */
  _generatePromptId(missionId) {
    const data = { mission_id: missionId, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `assembled_prompt_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '17.0.0',
      constitutional_version: '17.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `prompt_assembler_${hash.substring(0, 16)}`;
  }
}

module.exports = { PromptAssemblerAuthority };
