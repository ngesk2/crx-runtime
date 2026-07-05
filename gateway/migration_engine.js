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
    // Migration 1: Repository objects table
    this._migrations.set(1, {
      description: 'Create repository_objects table with canonical_bytes BYTEA',
      up: this._migration001.bind(this),
    });

    // Migration 2: Event outbox table
    this._migrations.set(2, {
      description: 'Create event_outbox table for event publishing',
      up: this._migration002.bind(this),
    });

    // Migration 3: Repository events table
    this._migrations.set(3, {
      description: 'Create repository_events table for event storage',
      up: this._migration003.bind(this),
    });

    // Migration 4: Event processing table
    this._migrations.set(4, {
      description: 'Create event_processing table for event tracking',
      up: this._migration004.bind(this),
    });

    // Migration 5: Execution graphs table
    this._migrations.set(5, {
      description: 'Create execution_graphs table for execution tracking',
      up: this._migration005.bind(this),
    });

    // Migration 6: Graph node states table
    this._migrations.set(6, {
      description: 'Create graph_node_states table for node state tracking',
      up: this._migration006.bind(this),
    });

    // Migration 7: Repository snapshots table
    this._migrations.set(7, {
      description: 'Create repository_snapshots table for snapshot storage',
      up: this._migration007.bind(this),
    });

    // Migration 8: Mission events table
    this._migrations.set(8, {
      description: 'Create mission_events table for mission event tracking',
      up: this._migration008.bind(this),
    });

    // Migration 9: Mission executions table
    this._migrations.set(9, {
      description: 'Create mission_executions table for mission execution tracking',
      up: this._migration009.bind(this),
    });

    // Migration 10: Telemetry metrics table
    this._migrations.set(10, {
      description: 'Create telemetry_metrics table for telemetry storage',
      up: this._migration010.bind(this),
    });

    this._currentMigrationVersion = 10;
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
   * Migration 002: Create event_outbox table
   */
  async _migration002(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_outbox (
        id SERIAL PRIMARY KEY,
        aggregate_id TEXT NOT NULL,
        aggregate_type TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL DEFAULT '{}',
        published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id TEXT,
        causation_id TEXT
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_outbox_published ON event_outbox(published)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_outbox_created ON event_outbox(created_at)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_outbox_aggregate ON event_outbox(aggregate_id, aggregate_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_outbox_correlation ON event_outbox(correlation_id)`);
  }

  /**
   * Migration 003: Create repository_events table
   */
  async _migration003(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS repository_events (
        event_id TEXT PRIMARY KEY,
        object_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}',
        witness JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        RuntimeID TEXT
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_object ON repository_events(object_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_sequence ON repository_events(object_id, sequence)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_type ON repository_events(event_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_timestamp ON repository_events(timestamp)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_runtime ON repository_events(RuntimeID)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_events_chain ON repository_events(object_id, sequence, CanonicalEventHash)`);
  }

  /**
   * Migration 004: Create event_processing table
   */
  async _migration004(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS event_processing (
        event_id TEXT PRIMARY KEY,
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        worker TEXT,
        processed_at TIMESTAMPTZ
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_event_processing_processed ON event_processing(processed)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_event_processing_worker ON event_processing(worker)`);
  }

  /**
   * Migration 005: Create execution_graphs table
   */
  async _migration005(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS execution_graphs (
        graph_id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        graph_status TEXT NOT NULL,
        graph_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_graphs_mission ON execution_graphs(mission_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_graphs_status ON execution_graphs(graph_status)`);
  }

  /**
   * Migration 006: Create graph_node_states table
   */
  async _migration006(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS graph_node_states (
        node_id TEXT PRIMARY KEY,
        graph_id TEXT NOT NULL,
        node_status TEXT NOT NULL,
        node_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_node_states_graph ON graph_node_states(graph_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_node_states_status ON graph_node_states(node_status)`);
  }

  /**
   * Migration 007: Create repository_snapshots table
   */
  async _migration007(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS repository_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        object_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_snapshots_object ON repository_snapshots(object_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_repo_snapshots_version ON repository_snapshots(version)`);
  }

  /**
   * Migration 008: Create mission_events table
   */
  async _migration008(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_events (
        event_id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL DEFAULT '{}',
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_type ON mission_events(event_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_events_processed ON mission_events(processed)`);
  }

  /**
   * Migration 009: Create mission_executions table
   */
  async _migration009(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS mission_executions (
        execution_id TEXT PRIMARY KEY,
        mission_id TEXT NOT NULL,
        execution_status TEXT NOT NULL,
        execution_data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_executions_mission ON mission_executions(mission_id)`);
  }

  /**
   * Migration 010: Create telemetry_metrics table
   */
  async _migration010(client) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS telemetry_metrics (
        metric_id SERIAL PRIMARY KEY,
        metric_name TEXT NOT NULL,
        metric_value NUMERIC NOT NULL,
        tags JSONB NOT NULL DEFAULT '{}',
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_name ON telemetry_metrics(metric_name)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_timestamp ON telemetry_metrics(timestamp)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_telemetry_metrics_name_timestamp ON telemetry_metrics(metric_name, timestamp)`);
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
