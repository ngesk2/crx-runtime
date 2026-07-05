/**
 * Migration Engine
 * 
 * Ω.49 — Migration Engine
 * 
 * Schema evolution engine for repository persistence.
 * 
 * Separates migration logic from repository implementation.
 * This engine handles versioned schema migrations.
 */

class MigrationEngine {
  constructor(pool) {
    this.pool = pool;
    this._currentMigrationVersion = 1;
    this._migrations = new Map();
    this._registerMigrations();
  }

  /**
   * Register migration definitions
   */
  _registerMigrations() {
    this._migrations.set(1, {
      description: 'Create repository_objects table with canonical_bytes BYTEA',
      up: this._migration001.bind(this),
    });
  }

  /**
   * Initialize migration engine
   */
  async initialize() {
    await this._ensureSchemaTable();
    await this._runPendingMigrations();
  }

  /**
   * Ensure schema migrations table exists
   */
  async _ensureSchemaTable() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS repository_store_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        description TEXT NOT NULL
      )
    `);
  }

  /**
   * Get current migration version
   */
  async _getCurrentMigrationVersion() {
    const result = await this.pool.query(
      'SELECT COALESCE(MAX(version), 0) as version FROM repository_store_migrations'
    );
    return parseInt(result.rows[0].version);
  }

  /**
   * Run pending migrations
   */
  async _runPendingMigrations() {
    const currentVersion = await this._getCurrentMigrationVersion();
    
    for (let version = currentVersion + 1; version <= this._currentMigrationVersion; version++) {
      await this._applyMigration(version);
    }
  }

  /**
   * Apply migration
   */
  async _applyMigration(version) {
    const migration = this._migrations.get(version);
    if (!migration) {
      throw new Error(`Unknown migration version: ${version}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      await migration.up(client);
      
      await client.query(
        'INSERT INTO repository_store_migrations (version, description) VALUES ($1, $2)',
        [version, migration.description]
      );
      
      await client.query('COMMIT');
      console.log(`[MigrationEngine] Applied migration ${version}: ${migration.description}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Migration 001: Create repository_objects table
   */
  async _migration001(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS repository_objects (
        object_id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        metadata JSONB NOT NULL DEFAULT '{}',
        canonical_bytes BYTEA,
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    
    // Single index per column (no duplicates)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_objects_kind ON repository_objects(kind)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_objects_version ON repository_objects(version)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_objects_created_at ON repository_objects(created_at)`);
  }

  /**
   * Get migration description
   */
  getMigrationDescription(version) {
    const migration = this._migrations.get(version);
    return migration ? migration.description : 'Unknown migration';
  }

  /**
   * Get current migration version
   */
  getCurrentVersion() {
    return this._currentMigrationVersion;
  }

  /**
   * Get all registered migrations
   */
  getMigrations() {
    return Array.from(this._migrations.entries()).map(([version, migration]) => ({
      version,
      description: migration.description,
    }));
  }

  /**
   * Register custom migration
   */
  registerMigration(version, description, upFn) {
    this._migrations.set(version, { description, up: upFn });
    if (version > this._currentMigrationVersion) {
      this._currentMigrationVersion = version;
    }
  }
}

module.exports = { MigrationEngine };
