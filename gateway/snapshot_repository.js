/**
 * Snapshot Repository
 * 
 * Constitutional repository for performance optimization snapshots.
 * 
 * Handles repository_snapshots table for aggregate state snapshots.
 */

const { CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');

class SnapshotRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async initialize() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS repository_snapshots (
          snapshot_id TEXT PRIMARY KEY,
          object_id TEXT NOT NULL,
          version INTEGER NOT NULL,
          snapshot_data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT fk_snapshots_object FOREIGN KEY (object_id) REFERENCES repository_objects(object_id) ON DELETE CASCADE,
          CONSTRAINT uq_object_snapshot UNIQUE (object_id, version)
        );
        CREATE INDEX IF NOT EXISTS idx_repo_snapshots_object ON repository_snapshots(object_id);
        CREATE INDEX IF NOT EXISTS idx_repo_snapshots_version ON repository_snapshots(version);
      `);
    } finally {
      client.release();
    }
  }

  async saveSnapshot(objectId, version, data) {
    const snapshotId = identityAuthority.generateSnapshotId(objectId, version);
    
    await this.pool.query(`
      INSERT INTO repository_snapshots (snapshot_id, object_id, version, snapshot_data)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (object_id, version) DO UPDATE SET
        snapshot_data = EXCLUDED.snapshot_data,
        created_at = NOW()
    `, [snapshotId, objectId, version, CanonicalBytes.serialize(data)]);
    
    return snapshotId;
  }

  async getLatestSnapshot(objectId) {
    const result = await this.pool.query(
      'SELECT * FROM repository_snapshots WHERE object_id = $1 ORDER BY version DESC LIMIT 1',
      [objectId]
    );
    if (result.rows.length === 0) return null;
    return this._rowToSnapshot(result.rows[0]);
  }

  async getSnapshot(objectId, version) {
    const result = await this.pool.query(
      'SELECT * FROM repository_snapshots WHERE object_id = $1 AND version = $2',
      [objectId, version]
    );
    if (result.rows.length === 0) return null;
    return this._rowToSnapshot(result.rows[0]);
  }

  _rowToSnapshot(row) {
    return {
      snapshot_id: row.snapshot_id,
      object_id: row.object_id,
      version: row.version,
      snapshot_data: row.snapshot_data,
      created_at: row.created_at
    };
  }
}

module.exports = { SnapshotRepository };
