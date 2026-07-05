/**
 * Repository Store
 * 
 * Phase 45 Patch 45.7 — Pure Persistence Layer
 * 
 * Constitutional Constraint: RepositoryStore is pure persistence only.
 * 
 * Removed:
 * - CanonicalBytes serialization (canonical logic)
 * - identityAuthority dependency (ID generation moved to caller)
 * - replay logic
 * - witness logic
 * - artifact assembly
 * 
 * Fixed:
 * - BYTEA vs JSONB ambiguity → canonical_bytes is BYTEA (single constitutional representation)
 * - duplicate indexes → single index per column
 * - migration ordering → versioned migrations
 * - schema ownership → explicit schema definition
 * - transaction boundaries → proper client management
 * 
 * RepositoryStore now provides only:
 * - PostgreSQL persistence
 * - JSONB for structured data
 * - BYTEA for canonical_bytes
 * - versioned migrations
 * - transaction support
 * 
 * Milestone 1: Constitutional Verification Enforcement
 * - VerificationAuthority.verify(object) before RepositoryStore.append(object)
 * - Persistence never stores unconstitutional artifacts
 */
const { RepositoryInterface } = require('./repository_interface');
const { MigrationEngine } = require('./migration_engine');
const { constitutionalVerificationAuthority } = require('./constitutional_verification_authority');

class RepositoryStore extends RepositoryInterface {
  constructor(pool) {
    this.pool = pool;
    this._migrationEngine = new MigrationEngine(pool);
  }

  /**
   * Initialize repository store with versioned migrations
   */
  async initialize() {
    await this._migrationEngine.initialize();
  }

  /**
   * Append object to repository (pure persistence)
   * 
   * Milestone 1: Constitutional Verification Enforcement
   * - VerificationAuthority.verify(object) before RepositoryStore.append(object)
   * - Persistence never stores unconstitutional artifacts
   * 
   * @param {Object} object - Object to store
   * @param {Object} options - Options
   * @param {Object} options.client - Optional client for transaction
   * @returns {string} Object ID
   */
  async append(object, options = {}) {
    const { client } = options;
    const useClient = client || this.pool;

    // Milestone 1: Constitutional Verification Enforcement
    const verification = constitutionalVerificationAuthority.verifyArtifact(object);
    if (!verification.valid) {
      const error = new Error(`Constitutional verification failed: ${verification.reason}`);
      error.code = verification.code;
      error.verification = verification;
      throw error;
    }

    const id = object.object_id;
    if (!id) {
      throw new Error('object_id is required (ID generation moved to caller)');
    }

    // Constitutional Constraint: Persistence requires canonical_bytes from caller
    // RepositoryStore must not manufacture canonical state
    if (!object.canonical_bytes) {
      throw new Error('RepositoryStore requires canonical_bytes from the caller');
    }

    const metadata = object.metadata || {};
    const version = (metadata.version || 0) + 1;
    const canonicalBytes = object.canonical_bytes;

    await useClient.query(`
      INSERT INTO repository_objects (object_id, kind, data, metadata, canonical_bytes, version)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (object_id) DO UPDATE SET
        data = EXCLUDED.data,
        metadata = EXCLUDED.metadata,
        canonical_bytes = EXCLUDED.canonical_bytes,
        version = EXCLUDED.version,
        updated_at = NOW()
    `, [id, object.kind, object.data, { ...metadata, version }, canonicalBytes, version]);

    return id;
  }

  /**
   * Load object by ID (pure persistence)
   * 
   * @param {string} objectId - Object ID
   * @returns {Object|null} Object or null if not found
   */
  async load(objectId) {
    const result = await this.pool.query(
      'SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects WHERE object_id = $1',
      [objectId]
    );
    if (result.rows.length === 0) return null;
    return this._rowToObject(result.rows[0]);
  }

  /**
   * Load multiple objects by IDs (pure persistence)
   * 
   * @param {Array<string>} objectIds - Object IDs
   * @returns {Array<Object>} Objects
   */
  async loadMany(objectIds) {
    if (objectIds.length === 0) return [];
    const placeholders = objectIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.pool.query(
      `SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects WHERE object_id IN (${placeholders})`,
      objectIds
    );
    return result.rows.map(r => this._rowToObject(r));
  }

  /**
   * Search objects (pure persistence)
   * 
   * @param {Object} filters - Search filters
   * @param {string} filters.kind - Filter by kind
   * @param {number} filters.limit - Result limit
   * @returns {Array<Object>} Objects
   */
  async search({ kind, limit }) {
    let sql = 'SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (kind) {
      sql += ` AND kind = $${paramIndex++}`;
      params.push(kind);
    }

    sql += ' ORDER BY created_at DESC';

    if (limit && limit > 0) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(r => this._rowToObject(r));
  }

  /**
   * Delete object (pure persistence)
   * 
   * @param {string} objectId - Object ID
   * @returns {boolean} True if deleted
   */
  async delete(objectId) {
    const result = await this.pool.query('DELETE FROM repository_objects WHERE object_id = $1', [objectId]);
    return result.rowCount > 0;
  }

  /**
   * Query objects by kind
   * @param {string} kind - Object kind
   * @returns {Array<Object>} Objects
   */
  async queryByKind(kind) {
    const result = await this.pool.query(
      'SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects WHERE kind = $1',
      [kind]
    );
    return result.rows.map(r => this._rowToObject(r));
  }

  /**
   * Query objects by metadata
   * @param {Object} metadata - Metadata query
   * @returns {Array<Object>} Objects
   */
  async queryByMetadata(metadata) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(metadata)) {
      conditions.push(`metadata->>'${key}' = $${paramIndex++}`);
      params.push(value);
    }

    const sql = conditions.length > 0
      ? `SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects WHERE ${conditions.join(' AND ')}`
      : 'SELECT object_id, kind, data, metadata, canonical_bytes, version, created_at, updated_at FROM repository_objects';

    const result = await this.pool.query(sql, params);
    return result.rows.map(r => this._rowToObject(r));
  }

  /**
   * Begin transaction
   * @returns {Object} Transaction client
   */
  async beginTransaction() {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit transaction
   * @param {Object} client - Transaction client
   */
  async commitTransaction(client) {
    await client.query('COMMIT');
    client.release();
  }

  /**
   * Rollback transaction
   * @param {Object} client - Transaction client
   */
  async rollbackTransaction(client) {
    await client.query('ROLLBACK');
    client.release();
  }

  /**
   * Get repository statistics
   * @returns {Object} Statistics
   */
  async getStatistics() {
    const result = await this.pool.query(`
      SELECT 
        COUNT(*) as total_objects,
        COUNT(DISTINCT kind) as unique_kinds,
        COUNT(DISTINCT version) as unique_versions
      FROM repository_objects
    `);

    const kindResult = await this.pool.query(`
      SELECT kind, COUNT(*) as count
      FROM repository_objects
      GROUP BY kind
      ORDER BY count DESC
    `);

    return {
      total_objects: parseInt(result.rows[0].total_objects),
      unique_kinds: parseInt(result.rows[0].unique_kinds),
      unique_versions: parseInt(result.rows[0].unique_versions),
      by_kind: kindResult.rows.map(r => ({
        kind: r.kind,
        count: parseInt(r.count),
      })),
    };
  }

  /**
   * Close repository connection
   */
  async close() {
    await this.pool.end();
  }

  /**
   * Convert database row to object (pure persistence, no deserialization)
   */
  _rowToObject(row) {
    return {
      id: row.object_id,
      object_id: row.object_id,
      kind: row.kind,
      data: row.data, // JSONB from database
      metadata: row.metadata, // JSONB from database
      canonical_bytes: row.canonical_bytes, // BYTEA from database
      version: row.version,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

module.exports = { RepositoryStore };
