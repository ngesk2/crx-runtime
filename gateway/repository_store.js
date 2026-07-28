const crypto = require('crypto');

class RepositoryStore {
  constructor(pool) {
    this.pool = pool;
  }

  async initialize() {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS repository_objects (
          object_id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          data JSONB NOT NULL DEFAULT '{}',
          metadata JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_repo_objects_kind ON repository_objects(kind);
        CREATE INDEX IF NOT EXISTS idx_repo_objects_data ON repository_objects USING gin(data);
      `);
    } finally {
      client.release();
    }
  }

  generateId(namespace, value) {
    const hash = crypto.createHash('sha256').update(`${namespace}:${JSON.stringify(value)}`).digest('hex');
    return `${namespace}_${hash.substring(0, 16)}`;
  }

  async append(object) {
    const id = object.object_id || this.generateId(object.kind, object.data);
    const metadata = object.metadata || {};
    const version = (metadata.version || 0) + 1;

    await this.pool.query(`
      INSERT INTO repository_objects (object_id, kind, data, metadata)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (object_id) DO UPDATE SET
        data = EXCLUDED.data,
        metadata = repository_objects.metadata || jsonb_build_object('version', $5, 'updated_at', NOW()::text),
        updated_at = NOW()
    `, [id, object.kind, JSON.stringify(object.data), JSON.stringify({ ...metadata, version }), version]);

    return id;
  }

  async load(objectId) {
    const result = await this.pool.query(
      'SELECT object_id, kind, data, metadata, created_at, updated_at FROM repository_objects WHERE object_id = $1',
      [objectId]
    );
    if (result.rows.length === 0) return null;
    return this._rowToObject(result.rows[0]);
  }

  async loadMany(objectIds) {
    if (objectIds.length === 0) return [];
    const placeholders = objectIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.pool.query(
      `SELECT object_id, kind, data, metadata, created_at, updated_at FROM repository_objects WHERE object_id IN (${placeholders})`,
      objectIds
    );
    return result.rows.map(r => this._rowToObject(r));
  }

  async search({ kind, query, filters, limit }) {
    let sql = 'SELECT object_id, kind, data, metadata, created_at, updated_at FROM repository_objects WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (kind) {
      sql += ` AND kind = $${paramIndex++}`;
      params.push(kind);
    }

    if (query) {
      sql += ` AND (data::text ILIKE $${paramIndex} OR metadata::text ILIKE $${paramIndex})`;
      params.push(`%${query}%`);
      paramIndex++;
    }

    if (filters) {
      for (const [field, value] of Object.entries(filters)) {
        sql += ` AND data->>'${field.replace(/'/g, "''")}' = $${paramIndex++}`;
        params.push(String(value));
      }
    }

    sql += ' ORDER BY created_at DESC';

    if (limit && limit > 0) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    const result = await this.pool.query(sql, params);
    return result.rows.map(r => ({
      object_id: r.object_id,
      kind: r.kind,
      data: r.data,
      metadata: r.metadata,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async delete(objectId) {
    await this.pool.query('DELETE FROM repository_objects WHERE object_id = $1', [objectId]);
  }

  _rowToObject(row) {
    return {
      id: row.object_id,
      object_id: row.object_id,
      kind: row.kind,
      data: row.data,
      metadata: { ...row.metadata, created_at: row.created_at, updated_at: row.updated_at },
    };
  }
}

module.exports = { RepositoryStore };
