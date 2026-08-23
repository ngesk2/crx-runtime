/**
 * Memory Persistence Authority
 * 
 * Phase 45 Patch 45.4 — Memory Persistence Separation
 * 
 * Handles PostgreSQL persistence for memory types.
 * 
 * Responsibilities:
 * - PostgreSQL reads
 * - PostgreSQL writes
 * - table initialization
 * 
 * MemoryAuthority delegates persistence to this authority.
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { witnessAuthority } = require('./witness_authority');

class MemoryPersistenceAuthority {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._authorityId = this._generateAuthorityId();
  }

  /**
   * Initialize persistence authority
   */
  async initialize() {
    await this._createTables();
  }

  /**
   * Create tables
   */
  async _createTables() {
    // Facts table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_facts (
        fact_id VARCHAR(64) PRIMARY KEY,
        fact_text TEXT NOT NULL,
        fact_category VARCHAR(100),
        confidence FLOAT DEFAULT 1.0,
        source_type VARCHAR(50),
        source_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Goals table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_goals (
        goal_id VARCHAR(64) PRIMARY KEY,
        goal_text TEXT NOT NULL,
        goal_status VARCHAR(50) DEFAULT 'active',
        priority INTEGER DEFAULT 5,
        project_id VARCHAR(64),
        due_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Projects table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_projects (
        project_id VARCHAR(64) PRIMARY KEY,
        project_name VARCHAR(255) NOT NULL,
        project_description TEXT,
        project_status VARCHAR(50) DEFAULT 'active',
        repository_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Repositories table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_repositories (
        repository_id VARCHAR(64) PRIMARY KEY,
        repository_name VARCHAR(255) NOT NULL,
        repository_url TEXT,
        repository_type VARCHAR(50),
        last_analyzed TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // People table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_people (
        person_id VARCHAR(64) PRIMARY KEY,
        person_name VARCHAR(255) NOT NULL,
        person_role VARCHAR(100),
        person_email VARCHAR(255),
        person_context TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // APIs table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_apis (
        api_id VARCHAR(64) PRIMARY KEY,
        api_name VARCHAR(255) NOT NULL,
        api_endpoint TEXT,
        api_method VARCHAR(10),
        api_description TEXT,
        authentication_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Errors table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_errors (
        error_id VARCHAR(64) PRIMARY KEY,
        error_message TEXT NOT NULL,
        error_type VARCHAR(100),
        error_stack TEXT,
        error_context JSONB,
        repository_id VARCHAR(64),
        occurred_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Fixes table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_fixes (
        fix_id VARCHAR(64) PRIMARY KEY,
        error_id VARCHAR(64),
        fix_description TEXT NOT NULL,
        fix_code TEXT,
        fix_applied_at TIMESTAMP,
        fix_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Architecture table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_architecture (
        architecture_id VARCHAR(64) PRIMARY KEY,
        architecture_name VARCHAR(255) NOT NULL,
        architecture_type VARCHAR(100),
        architecture_description TEXT,
        architecture_diagram TEXT,
        repository_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Preferences table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_preferences (
        preference_id VARCHAR(64) PRIMARY KEY,
        preference_key VARCHAR(255) NOT NULL,
        preference_value TEXT,
        preference_category VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Patterns table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_patterns (
        pattern_id VARCHAR(64) PRIMARY KEY,
        pattern_name VARCHAR(255) NOT NULL,
        pattern_type VARCHAR(100),
        pattern_description TEXT,
        pattern_code TEXT,
        pattern_frequency INTEGER DEFAULT 1,
        repository_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Failures table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_failures (
        failure_id VARCHAR(64) PRIMARY KEY,
        failure_description TEXT NOT NULL,
        failure_type VARCHAR(100),
        failure_context JSONB,
        repository_id VARCHAR(64),
        occurred_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Witnesses table
    await this._postgres.query(`
      CREATE TABLE IF NOT EXISTS memory_witnesses (
        witness_id VARCHAR(64) PRIMARY KEY,
        witness_type VARCHAR(100) NOT NULL,
        witness_data JSONB NOT NULL,
        witness_hash VARCHAR(64) NOT NULL,
        related_memory_id VARCHAR(64),
        related_memory_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create indexes
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_facts_category ON memory_facts(fact_category)`);
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_goals_status ON memory_goals(goal_status)`);
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_projects_status ON memory_projects(project_status)`);
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_errors_type ON memory_errors(error_type)`);
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_fixes_error ON memory_fixes(error_id)`);
    await this._postgres.query(`CREATE INDEX IF NOT EXISTS idx_patterns_type ON memory_patterns(pattern_type)`);
  }

  /**
   * Store memory record
   * 
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @param {Object} data - Record data
   * @param {string} memoryType - Memory type for witness
   * @returns {Object} Stored record with witness
   */
  async storeMemory(table, id, data, memoryType) {
    const hash = CanonicalAuthority.hash(data);

    // Build column names and values
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    await this._postgres.query(`
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
    `, values);

    // Create witness
    const witness = witnessAuthority.createWitness(data, {
      authority: 'MemoryPersistenceAuthority',
      authority_version: '45.4.0',
      memory_type: memoryType
    });

    // Store witness
    await this._postgres.query(`
      INSERT INTO memory_witnesses (witness_id, witness_type, witness_data, witness_hash, related_memory_id, related_memory_type)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [witness.witness_metadata.hash, memoryType, CanonicalBytes.serialize(witness), witness.witness_metadata.hash, id, memoryType]);

    return { id: id, hash: hash, witness: witness };
  }

  /**
   * Get memory record
   * 
   * @param {string} table - Table name
   * @param {string} id - Record ID
   * @returns {Object|null} Record or null if not found
   */
  async getMemory(table, id) {
    const result = await this._postgres.query(`
      SELECT * FROM ${table} WHERE ${table}_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Generate authority ID
   */
  _generateAuthorityId() {
    const authorityData = {
      authority_version: '45.4.0',
      constitutional_version: '45.4.0'
    };
    const hash = CanonicalAuthority.hash(authorityData);
    return `memory_persistence_${hash.substring(0, 16)}`;
  }
}

module.exports = { MemoryPersistenceAuthority };
