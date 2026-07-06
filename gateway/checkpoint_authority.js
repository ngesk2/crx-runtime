/**
 * Checkpoint Authority
 * 
 * Phase 12 — Persistent Ollama Runtime
 * 
 * Centralizes automatic checkpointing.
 * 
 * Checkpoints include:
 * - conversation
 * - summary
 * - embeddings
 * - active goals
 * - active missions
 * - constitutional state
 * - tool state
 * - execution graph
 * 
 * A restart resumes instantly.
 */

const { CanonicalAuthority } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { authorityRepository } = require('./authority_repository');

class CheckpointAuthority {
  constructor(postgresPool, qdrantClient) {
    this._postgres = postgresPool;
    this._qdrant = qdrantClient;
    this._repository = authorityRepository;
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
      CREATE TABLE IF NOT EXISTS checkpoints (
        checkpoint_id VARCHAR(64) PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL,
        checkpoint_type VARCHAR(50) NOT NULL,
        checkpoint_data JSONB NOT NULL,
        checkpoint_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_checkpoints_session ON checkpoints(session_id)
    `);
  }

  /**
   * Create checkpoint
   * @param {Object} checkpointData - Checkpoint data
   * @returns {Object} Checkpoint
   */
  async createCheckpoint(checkpointData) {
    const checkpointHash = CanonicalAuthority.hash(checkpointData);
    const checkpointId = this._generateCheckpointId(checkpointHash);

    // Create checkpoint witness
    const checkpointWitness = witnessAuthority.createWitness({
      checkpoint_id: checkpointId,
      checkpoint_data: checkpointData,
      checkpoint_hash: checkpointHash
    }, {
      authority: 'CheckpointAuthority',
      authority_version: '12.0.0'
    });

    const checkpoint = {
      checkpoint_id: checkpointId,
      session_id: checkpointData.session_id,
      checkpoint_type: checkpointData.type || 'full',
      checkpoint_data: checkpointData,
      checkpoint_hash: checkpointHash,
      checkpoint_witness: checkpointWitness,
      created_at: constitutionalTimeAuthority.now()
    };

    // Store in PostgreSQL
    await this._postgres.query(`
      INSERT INTO checkpoints (checkpoint_id, session_id, checkpoint_type, checkpoint_data, checkpoint_hash)
      VALUES ($1, $2, $3, $4, $5)
    `, [checkpointId, checkpointData.session_id, checkpoint.checkpoint_type, JSON.stringify(checkpointData), checkpointHash]);

    // Store embeddings if present
    if (checkpointData.embeddings) {
      await this._storeEmbeddings(checkpointId, checkpointData.embeddings);
    }

    return checkpoint;
  }

  /**
   * Create conversation checkpoint
   * @param {string} sessionId - Session ID
   * @param {Array} messages - Messages
   * @returns {Object} Checkpoint
   */
  async createConversationCheckpoint(sessionId, messages) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'conversation',
      messages: messages,
      message_count: messages.length
    });
  }

  /**
   * Create summary checkpoint
   * @param {string} sessionId - Session ID
   * @param {string} summary - Summary text
   * @param {Object} summaryMetadata - Summary metadata
   * @returns {Object} Checkpoint
   */
  async createSummaryCheckpoint(sessionId, summary, summaryMetadata = {}) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'summary',
      summary: summary,
      summary_metadata: summaryMetadata
    });
  }

  /**
   * Create goals checkpoint
   * @param {string} sessionId - Session ID
   * @param {Array} goals - Active goals
   * @returns {Object} Checkpoint
   */
  async createGoalsCheckpoint(sessionId, goals) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'goals',
      goals: goals,
      goal_count: goals.length
    });
  }

  /**
   * Create missions checkpoint
   * @param {string} sessionId - Session ID
   * @param {Array} missions - Active missions
   * @returns {Object} Checkpoint
   */
  async createMissionsCheckpoint(sessionId, missions) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'missions',
      missions: missions,
      mission_count: missions.length
    });
  }

  /**
   * Create constitutional state checkpoint
   * @param {string} sessionId - Session ID
   * @param {Object} constitutionalState - Constitutional state
   * @returns {Object} Checkpoint
   */
  async createConstitutionalCheckpoint(sessionId, constitutionalState) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'constitutional',
      constitutional_state: constitutionalState
    });
  }

  /**
   * Create tool state checkpoint
   * @param {string} sessionId - Session ID
   * @param {Object} toolState - Tool state
   * @returns {Object} Checkpoint
   */
  async createToolStateCheckpoint(sessionId, toolState) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'tool_state',
      tool_state: toolState
    });
  }

  /**
   * Create execution graph checkpoint
   * @param {string} sessionId - Session ID
   * @param {Object} executionGraph - Execution graph
   * @returns {Object} Checkpoint
   */
  async createExecutionGraphCheckpoint(sessionId, executionGraph) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'execution_graph',
      execution_graph: executionGraph
    });
  }

  /**
   * Create full checkpoint (all state)
   * @param {string} sessionId - Session ID
   * @param {Object} fullState - Full state object
   * @returns {Object} Checkpoint
   */
  async createFullCheckpoint(sessionId, fullState) {
    return await this.createCheckpoint({
      session_id: sessionId,
      type: 'full',
      conversation: fullState.conversation,
      summary: fullState.summary,
      goals: fullState.goals,
      missions: fullState.missions,
      constitutional_state: fullState.constitutional_state,
      tool_state: fullState.tool_state,
      execution_graph: fullState.execution_graph,
      embeddings: fullState.embeddings
    });
  }

  /**
   * Restore checkpoint
   * @param {string} checkpointId - Checkpoint ID
   * @returns {Object} Restored state
   */
  async restoreCheckpoint(checkpointId) {
    const result = await this._postgres.query(`
      SELECT checkpoint_id, session_id, checkpoint_type, checkpoint_data, checkpoint_hash, created_at
      FROM checkpoints
      WHERE checkpoint_id = $1
    `, [checkpointId]);

    if (result.rows.length === 0) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const row = result.rows[0];

    // Verify checkpoint hash
    const computedHash = CanonicalAuthority.hash(row.checkpoint_data);
    if (computedHash !== row.checkpoint_hash) {
      throw new Error('Checkpoint hash verification failed');
    }

    // Load embeddings if present
    if (row.checkpoint_data.embeddings) {
      row.checkpoint_data.embeddings = await this._loadEmbeddings(checkpointId);
    }

    return {
      checkpoint_id: row.checkpoint_id,
      session_id: row.session_id,
      checkpoint_type: row.checkpoint_type,
      checkpoint_data: row.checkpoint_data,
      checkpoint_hash: row.checkpoint_hash,
      created_at: row.created_at
    };
  }

  /**
   * Get latest checkpoint for session
   * @param {string} sessionId - Session ID
   * @param {string} checkpointType - Optional checkpoint type filter
   * @returns {Object|null} Latest checkpoint
   */
  async getLatestCheckpoint(sessionId, checkpointType = null) {
    let query = `
      SELECT checkpoint_id, session_id, checkpoint_type, checkpoint_data, checkpoint_hash, created_at
      FROM checkpoints
      WHERE session_id = $1
    `;
    const params = [sessionId];

    if (checkpointType) {
      query += ' AND checkpoint_type = $2';
      params.push(checkpointType);
    }

    query += ' ORDER BY created_at DESC LIMIT 1';

    const result = await this._postgres.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      checkpoint_id: row.checkpoint_id,
      session_id: row.session_id,
      checkpoint_type: row.checkpoint_type,
      checkpoint_data: row.checkpoint_data,
      checkpoint_hash: row.checkpoint_hash,
      created_at: row.created_at
    };
  }

  /**
   * List checkpoints for session
   * @param {string} sessionId - Session ID
   * @returns {Array} Checkpoints
   */
  async listCheckpoints(sessionId) {
    const result = await this._postgres.query(`
      SELECT checkpoint_id, session_id, checkpoint_type, checkpoint_hash, created_at
      FROM checkpoints
      WHERE session_id = $1
      ORDER BY created_at DESC
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Delete checkpoint
   * @param {string} checkpointId - Checkpoint ID
   */
  async deleteCheckpoint(checkpointId) {
    await this._postgres.query(`
      DELETE FROM checkpoints
      WHERE checkpoint_id = $1
    `, [checkpointId]);

    // Delete embeddings
    await this._deleteEmbeddings(checkpointId);
  }

  /**
   * Store embeddings
   * @param {string} checkpointId - Checkpoint ID
   * @param {Array} embeddings - Embeddings
   */
  async _storeEmbeddings(checkpointId, embeddings) {
    for (const embedding of embeddings) {
      await this._qdrant.upsert({
        collection_name: 'checkpoints',
        points: [
          {
            id: checkpointId,
            vector: embedding.vector,
            payload: {
              checkpoint_id: checkpointId,
              text: embedding.text,
              metadata: embedding.metadata || {}
            }
          }
        ]
      });
    }
  }

  /**
   * Load embeddings
   * @param {string} checkpointId - Checkpoint ID
   * @returns {Array} Embeddings
   */
  async _loadEmbeddings(checkpointId) {
    const result = await this._qdrant.search({
      collection_name: 'checkpoints',
      query_vector: new Array(1536).fill(0), // Dummy vector for filtering
      query_filter: {
        must: [
          { key: 'checkpoint_id', match: { value: checkpointId } }
        ]
      },
      limit: 100
    });

    return result.map(r => ({
      vector: r.vector,
      text: r.payload.text,
      metadata: r.payload.metadata
    }));
  }

  /**
   * Delete embeddings
   * @param {string} checkpointId - Checkpoint ID
   */
  async _deleteEmbeddings(checkpointId) {
    await this._qdrant.delete({
      collection_name: 'checkpoints',
      points: [checkpointId]
    });
  }

  /**
   * Generate checkpoint ID
   * @param {string} checkpointHash - Checkpoint hash
   * @returns {string} Checkpoint ID
   */
  _generateCheckpointId(checkpointHash) {
    return `checkpoint_${checkpointHash.substring(0, 16)}`;
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
    return `checkpoint_${hash.substring(0, 16)}`;
  }
}

module.exports = { CheckpointAuthority };
