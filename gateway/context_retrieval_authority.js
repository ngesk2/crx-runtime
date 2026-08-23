/**
 * Context Retrieval Authority
 * 
 * Phase 16 — Constitutional Retrieval Pipeline
 * 
 * Pipeline:
 * Mission
 * ↓
 * Repository
 * ↓
 * Current File
 * ↓
 * Neighbor Files
 * ↓
 * Architecture Memory
 * ↓
 * Facts
 * ↓
 * Patterns
 * ↓
 * Previous Failures
 * ↓
 * Successful Fixes
 * ↓
 * Goals
 * ↓
 * Mission
 * ↓
 * Compressed Transcript
 * ↓
 * PromptAuthority
 * 
 * Every retrieval is witnessed, ranked, and deterministic.
 * No random RAG.
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { promptAuthority } = require('./prompt_authority');

class ContextRetrievalAuthority {
  constructor(postgresPool, qdrantClient, memoryAuthority, contextCompressionAuthority) {
    this._postgres = postgresPool;
    this._qdrant = qdrantClient;
    this._memoryAuthority = memoryAuthority;
    this._contextCompression = contextCompressionAuthority;
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
      CREATE TABLE IF NOT EXISTS context_retrievals (
        retrieval_id VARCHAR(64) PRIMARY KEY,
        mission_id VARCHAR(64),
        retrieval_hash VARCHAR(64) NOT NULL,
        retrieval_data JSONB NOT NULL,
        witness_hash VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_retrievals_mission ON context_retrievals(mission_id)
    `);
  }

  /**
   * Retrieve context for mission
   * @param {Object} request - Retrieval request
   * @returns {Object} Retrieved context
   */
  async retrieveContext(request) {
    const retrievalId = this._generateRetrievalId(request.mission.mission_id);
    const startTime = constitutionalTimeAuthority.now();

    const context = {
      mission_id: request.mission.mission_id,
      retrieval_id: retrievalId,
      mission: null,
      repository: null,
      current_file: null,
      neighbor_files: [],
      architecture_memory: [],
      facts: [],
      patterns: [],
      previous_failures: [],
      successful_fixes: [],
      goals: [],
      compressed_transcript: null,
      retrieval_metadata: {
        started_at: startTime,
        completed_at: null
      }
    };

    // Step 1: Mission
    context.mission = await this._retrieveMission(request.mission.mission_id);

    // Step 2: Repository
    context.repository = await this._retrieveRepository(context.mission.repo_id);

    // Step 3: Current File
    context.current_file = await this._retrieveCurrentFile(context.mission);

    // Step 4: Neighbor Files
    context.neighbor_files = await this._retrieveNeighborFiles(context.current_file);

    // Step 5: Architecture Memory
    context.architecture_memory = await this._retrieveArchitectureMemory(context.mission.repo_id);

    // Step 6: Facts
    context.facts = await this._retrieveFacts(context.mission.repo_id);

    // Step 7: Patterns
    context.patterns = await this._retrievePatterns(context.mission.repo_id);

    // Step 8: Previous Failures
    context.previous_failures = await this._retrievePreviousFailures(context.mission.repo_id);

    // Step 9: Successful Fixes
    context.successful_fixes = await this._retrieveSuccessfulFixes(context.mission.repo_id);

    // Step 10: Goals
    context.goals = await this._retrieveGoals(context.mission.repo_id);

    // Step 11: Compressed Transcript
    context.compressed_transcript = await this._retrieveCompressedTranscript(request.mission.session_id);

    context.retrieval_metadata.completed_at = constitutionalTimeAuthority.now();
    context.retrieval_metadata.duration = context.retrieval_metadata.completed_at - startTime;

    // Compute retrieval hash
    const retrievalHash = CanonicalAuthority.hash(context);
    context.retrieval_hash = retrievalHash;

    // Create retrieval witness
    const witness = witnessAuthority.createWitness(context, {
      authority: 'ContextRetrievalAuthority',
      authority_version: '16.0.0'
    });

    // Store retrieval
    await this._postgres.query(`
      INSERT INTO context_retrievals (retrieval_id, mission_id, retrieval_hash, retrieval_data, witness_hash)
      VALUES ($1, $2, $3, $4, $5)
    `, [retrievalId, request.mission.mission_id, retrievalHash, JSON.stringify(context), witness.witness_metadata.hash]);

    context.witness = witness;

    return context;
  }

  /**
   * Retrieve mission
   * @param {string} missionId - Mission ID
   * @returns {Object} Mission
   */
  async _retrieveMission(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM missions WHERE mission_id = $1
    `, [missionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Retrieve repository
   * @param {string} repoId - Repository ID
   * @returns {Object} Repository
   */
  async _retrieveRepository(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_repositories WHERE repository_id = $1
    `, [repoId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Retrieve current file
   * @param {Object} mission - Mission
   * @returns {Object} Current file
   */
  async _retrieveCurrentFile(mission) {
    // Placeholder - in production, retrieve actual file
    if (mission.target_file) {
      return {
        file_path: mission.target_file,
        file_content: '// File content placeholder',
        file_hash: CanonicalAuthority.hash(mission.target_file)
      };
    }
    return null;
  }

  /**
   * Retrieve neighbor files
   * @param {Object} currentFile - Current file
   * @returns {Array} Neighbor files
   */
  async _retrieveNeighborFiles(currentFile) {
    if (!currentFile) {
      return [];
    }

    // Placeholder - in production, retrieve actual neighbor files
    return [
      {
        file_path: './neighbor1.js',
        file_hash: CanonicalAuthority.hash('./neighbor1.js')
      },
      {
        file_path: './neighbor2.js',
        file_hash: CanonicalAuthority.hash('./neighbor2.js')
      }
    ];
  }

  /**
   * Retrieve architecture memory
   * @param {string} repoId - Repository ID
   * @returns {Array} Architecture memory
   */
  async _retrieveArchitectureMemory(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_architecture WHERE repository_id = $1
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve facts
   * @param {string} repoId - Repository ID
   * @returns {Array} Facts
   */
  async _retrieveFacts(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_facts WHERE source_id = $1 ORDER BY confidence DESC LIMIT 50
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve patterns
   * @param {string} repoId - Repository ID
   * @returns {Array} Patterns
   */
  async _retrievePatterns(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_patterns WHERE repository_id = $1 ORDER BY pattern_frequency DESC LIMIT 20
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve previous failures
   * @param {string} repoId - Repository ID
   * @returns {Array} Previous failures
   */
  async _retrievePreviousFailures(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_failures WHERE repository_id = $1 ORDER BY occurred_at DESC LIMIT 20
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve successful fixes
   * @param {string} repoId - Repository ID
   * @returns {Array} Successful fixes
   */
  async _retrieveSuccessfulFixes(repoId) {
    const result = await this._postgres.query(`
      SELECT f.* FROM memory_fixes f
      JOIN memory_errors e ON f.error_id = e.error_id
      WHERE e.repository_id = $1 AND f.fix_verified = TRUE
      ORDER BY f.fix_applied_at DESC
      LIMIT 20
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve goals
   * @param {string} repoId - Repository ID
   * @returns {Array} Goals
   */
  async _retrieveGoals(repoId) {
    const result = await this._postgres.query(`
      SELECT * FROM memory_goals WHERE project_id IN (
        SELECT project_id FROM memory_projects WHERE repository_id = $1
      ) AND goal_status = 'active'
      ORDER BY priority DESC
      LIMIT 10
    `, [repoId]);

    return result.rows;
  }

  /**
   * Retrieve compressed transcript
   * @param {string} sessionId - Session ID
   * @returns {Object} Compressed transcript
   */
  async _retrieveCompressedTranscript(sessionId) {
    if (!sessionId) {
      return null;
    }

    return await this._contextCompression.retrieveCompressedContext(sessionId);
  }

  /**
   * Retrieve context by ID
   * @param {string} retrievalId - Retrieval ID
   * @returns {Object} Context
   */
  async getRetrieval(retrievalId) {
    const result = await this._postgres.query(`
      SELECT * FROM context_retrievals WHERE retrieval_id = $1
    `, [retrievalId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].retrieval_data;
  }

  /**
   * Retrieve context by mission
   * @param {string} missionId - Mission ID
   * @returns {Array} Contexts
   */
  async getRetrievalsByMission(missionId) {
    const result = await this._postgres.query(`
      SELECT * FROM context_retrievals WHERE mission_id = $1 ORDER BY created_at DESC
    `, [missionId]);

    return result.rows;
  }

  /**
   * Verify retrieval hash
   * @param {string} retrievalId - Retrieval ID
   * @returns {Object} Verification result
   */
  async verifyRetrievalHash(retrievalId) {
    const result = await this._postgres.query(`
      SELECT retrieval_data, retrieval_hash FROM context_retrievals WHERE retrieval_id = $1
    `, [retrievalId]);

    if (result.rows.length === 0) {
      return { valid: false, reason: 'Retrieval not found' };
    }

    const retrieval = result.rows[0];
    const computedHash = CanonicalAuthority.hash(retrieval.retrieval_data);
    const valid = computedHash === retrieval.retrieval_hash;

    return {
      valid: valid,
      reason: valid ? 'Hash verified' : 'Hash mismatch'
    };
  }

  /**
   * Generate retrieval ID
   * @param {string} missionId - Mission ID
   * @returns {string} Retrieval ID
   */
  _generateRetrievalId(missionId) {
    const data = { mission_id: missionId, timestamp: constitutionalTimeAuthority.now() };
    const hash = CanonicalAuthority.hash(data);
    return `retrieval_${hash.substring(0, 16)}`;
  }

  /**
   * Generate authority ID
   * @returns {string} Authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '16.0.0',
      constitutional_version: '16.0.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `context_retrieval_${hash.substring(0, 16)}`;
  }
}

module.exports = { ContextRetrievalAuthority };
