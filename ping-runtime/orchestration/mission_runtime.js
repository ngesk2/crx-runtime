/**
 * Mission Runtime — PING Core v1
 * 
 * Single canonical mission system. Missions are work units dispatched by Orca,
 * executed by workers, tracked here. Replaces 12 dead mission implementations.
 * 
 * Mission lifecycle: created → assigned → running → completed/failed → archived
 * 
 * Mission Control navigates these via events/queues, not CRUD.
 */

class MissionRuntime {
  /**
   * @param {object} options
   * @param {object} options.pool — pg.Pool
   * @param {object} options.eventRuntime — UnifiedEventRuntime instance
   */
  constructor(options = {}) {
    this._pool = options.pool || null;
    this._eventRuntime = options.eventRuntime || null;
    this._activeMissions = new Map();
  }

  /**
   * Initialize mission tables.
   */
  async initialize() {
    if (!this._pool) return;
    await this._pool.query(`
      CREATE TABLE IF NOT EXISTS ping_missions (
        mission_id VARCHAR(255) PRIMARY KEY,
        mission_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'created',
        priority INTEGER DEFAULT 0,
        payload JSONB NOT NULL DEFAULT '{}',
        result JSONB,
        assigned_to VARCHAR(255),
        created_by VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        error TEXT,
        retries INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_pm_status ON ping_missions(status);
      CREATE INDEX IF NOT EXISTS idx_pm_type ON ping_missions(mission_type);
      CREATE INDEX IF NOT EXISTS idx_pm_priority ON ping_missions(priority DESC);
      CREATE INDEX IF NOT EXISTS idx_pm_assigned ON ping_missions(assigned_to);
    `);
  }

  /**
   * Create a new mission.
   */
  async create(missionType, payload = {}, options = {}) {
    const crypto = require('crypto');
    const missionId = crypto.createHash('sha256')
      .update(`${missionType}:${Date.now()}:${JSON.stringify(payload)}`)
      .digest('hex').slice(0, 16);

    await this._pool.query(
      `INSERT INTO ping_missions (mission_id, mission_type, payload, priority, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [missionId, missionType, JSON.stringify(payload), options.priority || 0, options.createdBy || null]
    );

    if (this._eventRuntime) {
      await this._eventRuntime.emit('MISSION_CREATED', 'mission-runtime', {
        missionId, missionType, payload, priority: options.priority || 0,
      });
    }

    return missionId;
  }

  /**
   * Assign a mission to a worker.
   */
  async assign(missionId, workerName) {
    await this._pool.query(
      `UPDATE ping_missions SET status = 'assigned', assigned_to = $1 WHERE mission_id = $2`,
      [workerName, missionId]
    );

    if (this._eventRuntime) {
      await this._eventRuntime.emit('MISSION_ASSIGNED', 'mission-runtime', {
        missionId, assignedTo: workerName,
      });
    }
  }

  /**
   * Start a mission.
   */
  async start(missionId) {
    await this._pool.query(
      `UPDATE ping_missions SET status = 'running', started_at = NOW() WHERE mission_id = $1`,
      [missionId]
    );

    if (this._eventRuntime) {
      await this._eventRuntime.emit('MISSION_STARTED', 'mission-runtime', { missionId });
    }
  }

  /**
   * Complete a mission.
   */
  async complete(missionId, result = {}) {
    // Calculate duration from started_at
    let duration_ms = null;
    try {
      const row = await this._pool.query(
        `SELECT started_at FROM ping_missions WHERE mission_id = $1`,
        [missionId]
      );
      if (row.rows[0] && row.rows[0].started_at) {
        duration_ms = Date.now() - new Date(row.rows[0].started_at).getTime();
      }
    } catch (_) {}

    await this._pool.query(
      `UPDATE ping_missions SET status = 'completed', result = $1, completed_at = NOW() WHERE mission_id = $2`,
      [JSON.stringify({ ...result, duration_ms }), missionId]
    );

    if (this._eventRuntime) {
      await this._eventRuntime.emit('MISSION_COMPLETED', 'mission-runtime', { missionId, result, duration_ms });
    }
  }

  /**
   * Fail a mission.
   */
  async fail(missionId, error) {
    await this._pool.query(
      `UPDATE ping_missions SET status = 'failed', error = $1, completed_at = NOW() WHERE mission_id = $2`,
      [error, missionId]
    );

    if (this._eventRuntime) {
      await this._eventRuntime.emit('MISSION_FAILED', 'mission-runtime', { missionId, error });
    }
  }

  /**
   * Get pending missions (for Orca scheduler).
   */
  async getPending(limit = 10) {
    const result = await this._pool.query(
      `SELECT * FROM ping_missions WHERE status = 'created' ORDER BY priority DESC, created_at ASC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  /**
   * Get active missions.
   */
  async getActive() {
    const result = await this._pool.query(
      `SELECT * FROM ping_missions WHERE status IN ('assigned', 'running') ORDER BY priority DESC`
    );
    return result.rows;
  }

  /**
   * Get mission stats.
   */
  async getStats() {
    const result = await this._pool.query(
      `SELECT status, COUNT(*) as count FROM ping_missions GROUP BY status`
    );
    const stats = {};
    for (const row of result.rows) {
      stats[row.status] = parseInt(row.count);
    }
    return stats;
  }

  /**
   * Get full trace for a mission — evidence bundle.
   */
  async getTrace(missionId) {
    const mission = await this._pool.query(
      `SELECT * FROM ping_missions WHERE mission_id = $1`,
      [missionId]
    );
    if (!mission.rows[0]) return null;

    // Get all events related to this mission
    const events = await this._pool.query(
      `SELECT * FROM ping_events WHERE metadata->>'correlation_id' = $1 ORDER BY timestamp ASC`,
      [missionId]
    );

    return {
      mission: mission.rows[0],
      events: events.rows,
      eventCount: events.rowCount,
    };
  }

  /**
   * Get all traces — for evidence bundles.
   */
  async getAllTraces() {
    const missions = await this._pool.query(
      `SELECT * FROM ping_missions ORDER BY created_at ASC`
    );
    const traces = [];
    for (const m of missions.rows) {
      const trace = await this.getTrace(m.mission_id);
      if (trace) traces.push(trace);
    }
    return traces;
  }
}

module.exports = { MissionRuntime };
