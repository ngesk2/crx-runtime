/**
 * Ollama Session Authority
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Centralizes Ollama session persistence.
 * 
 * Responsibilities:
 * - conversation_id
 * - context window
 * - checkpointing
 * - summaries
 * - replay
 * - token accounting
 * 
 * Persist into PostgreSQL.
 * 
 * Schema:
 * ollama_sessions
 * ----------------
 * session_id
 * model
 * system_prompt
 * created_at
 * updated_at
 * context_hash
 * 
 * ollama_messages
 * ----------------
 * id
 * session_id
 * role
 * content
 * embedding_id
 * created_at
 * 
 * ollama_summaries
 * ----------------
 * session_id
 * summary
 * token_range
 * summary_hash
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class OllamaSessionAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._sessions = new Map();
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
      CREATE TABLE IF NOT EXISTS ollama_sessions (
        session_id VARCHAR(64) PRIMARY KEY,
        model VARCHAR(100) NOT NULL,
        system_prompt TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        context_hash VARCHAR(64)
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS ollama_messages (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL REFERENCES ollama_sessions(session_id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        embedding_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS ollama_summaries (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(64) NOT NULL REFERENCES ollama_sessions(session_id) ON DELETE CASCADE,
        summary TEXT NOT NULL,
        token_range JSONB NOT NULL,
        summary_hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * Create session
   * @param {string} model - Model name
   * @param {string} systemPrompt - System prompt
   * @returns {string} Session ID
   */
  async createSession(model, systemPrompt) {
    const sessionId = this._generateSessionId(model, systemPrompt);
    const contextHash = CanonicalAuthority.hash({ model, system_prompt: systemPrompt });

    await this._postgres.query(`
      INSERT INTO ollama_sessions (session_id, model, system_prompt, context_hash)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, model, systemPrompt, contextHash]);

    return sessionId;
  }

  /**
   * Resume session
   * @param {string} sessionId - Session ID
   * @returns {Object} Session data
   */
  async resumeSession(sessionId) {
    const sessionResult = await this._postgres.query(`
      SELECT session_id, model, system_prompt, context_hash
      FROM ollama_sessions
      WHERE session_id = $1
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const session = sessionResult.rows[0];

    // Load recent context
    const messagesResult = await this._postgres.query(`
      SELECT role, content, embedding_id
      FROM ollama_messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [sessionId]);

    // Load latest summary
    const summaryResult = await this._postgres.query(`
      SELECT summary, token_range
      FROM ollama_summaries
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [sessionId]);

    return {
      session_id: session.session_id,
      model: session.model,
      system_prompt: session.system_prompt,
      context_hash: session.context_hash,
      recent_messages: messagesResult.rows.reverse(),
      summary: summaryResult.rows.length > 0 ? summaryResult.rows[0] : null
    };
  }

  /**
   * Add message to session
   * @param {string} sessionId - Session ID
   * @param {string} role - Role (user, assistant, system)
   * @param {string} content - Message content
   * @param {string} embeddingId - Optional embedding ID
   */
  async addMessage(sessionId, role, content, embeddingId = null) {
    await this._postgres.query(`
      INSERT INTO ollama_messages (session_id, role, content, embedding_id)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, role, content, embeddingId]);

    // Update session timestamp
    await this._postgres.query(`
      UPDATE ollama_sessions
      SET updated_at = NOW()
      WHERE session_id = $1
    `, [sessionId]);
  }

  /**
   * Create checkpoint summary
   * @param {string} sessionId - Session ID
   * @param {string} summary - Summary text
   * @param {Object} tokenRange - Token range {start, end}
   */
  async createSummary(sessionId, summary, tokenRange) {
    const summaryHash = CanonicalAuthority.hash({ summary, token_range: tokenRange });

    await this._postgres.query(`
      INSERT INTO ollama_summaries (session_id, summary, token_range, summary_hash)
      VALUES ($1, $2, $3, $4)
    `, [sessionId, summary, JSON.stringify(tokenRange), summaryHash]);
  }

  /**
   * Get session messages
   * @param {string} sessionId - Session ID
   * @param {number} limit - Message limit
   * @returns {Array} Messages
   */
  async getMessages(sessionId, limit = 100) {
    const result = await this._postgres.query(`
      SELECT role, content, embedding_id, created_at
      FROM ollama_messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      LIMIT $2
    `, [sessionId, limit]);

    return result.rows;
  }

  /**
   * Get session summaries
   * @param {string} sessionId - Session ID
   * @returns {Array} Summaries
   */
  async getSummaries(sessionId) {
    const result = await this._postgres.query(`
      SELECT summary, token_range, summary_hash, created_at
      FROM ollama_summaries
      WHERE session_id = $1
      ORDER BY created_at ASC
    `, [sessionId]);

    return result.rows;
  }

  /**
   * Account tokens for session
   * @param {string} sessionId - Session ID
   * @param {number} inputTokens - Input tokens
   * @param {number} outputTokens - Output tokens
   */
  async accountTokens(sessionId, inputTokens, outputTokens) {
    // TODO: Implement token accounting table
    // For now, just update session timestamp
    await this._postgres.query(`
      UPDATE ollama_sessions
      SET updated_at = NOW()
      WHERE session_id = $1
    `, [sessionId]);
  }

  /**
   * Get session
   * @param {string} sessionId - Session ID
   * @returns {Object|null} Session
   */
  async getSession(sessionId) {
    const result = await this._postgres.query(`
      SELECT session_id, model, system_prompt, created_at, updated_at, context_hash
      FROM ollama_sessions
      WHERE session_id = $1
    `, [sessionId]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * List sessions
   * @param {string} model - Optional model filter
   * @returns {Array} Sessions
   */
  async listSessions(model = null) {
    let query = `
      SELECT session_id, model, system_prompt, created_at, updated_at, context_hash
      FROM ollama_sessions
    `;
    const params = [];

    if (model) {
      query += ' WHERE model = $1';
      params.push(model);
    }

    query += ' ORDER BY updated_at DESC';

    const result = await this._postgres.query(query, params);
    return result.rows;
  }

  /**
   * Delete session
   * @param {string} sessionId - Session ID
   */
  async deleteSession(sessionId) {
    await this._postgres.query(`
      DELETE FROM ollama_sessions
      WHERE session_id = $1
    `, [sessionId]);
  }

  /**
   * Generate session ID
   * @param {string} model - Model name
   * @param {string} systemPrompt - System prompt
   * @returns {string} Session ID
   */
  _generateSessionId(model, systemPrompt) {
    const sessionData = {
      model: model,
      system_prompt: systemPrompt,
      timestamp: constitutionalTimeAuthority.now()
    };
    const hash = CanonicalAuthority.hash(sessionData);
    return `ollama_session_${hash.substring(0, 16)}`;
  }
}

module.exports = { OllamaSessionAuthority };
