'use strict';
/**
 * PgStub — a minimal, documented-faithful in-memory stand-in for pg.Pool.
 *
 * SCOPE (read this before citing it): this stub implements ONLY the SQL
 * statement shapes issued by UnifiedEventRuntime.emit and MissionRuntime
 * on the paths exercised by the PR property tier:
 *   - CREATE TABLE / CREATE INDEX / ALTER TABLE (no-op: schema assumed)
 *   - INSERT INTO ping_events ... ON CONFLICT (event_id) DO NOTHING
 *   - SELECT payload FROM ping_events WHERE event_id = $1
 *   - SELECT * FROM ping_events WHERE event_id = $1
 *   - INSERT INTO ping_missions ... ON CONFLICT (mission_id) DO NOTHING
 *   - conditional UPDATEs on ping_missions (assign/start/complete/fail/failWithRetry)
 *   - SELECT started_at|retries|tenant_id|* FROM ping_missions WHERE mission_id = $1
 *
 * It is a TEST DOUBLE for the pg wire protocol, not a second event store:
 * it owns no PING semantics (no governance, no verdict admission, no
 * identity minting). Real Postgres semantics (transactions, constraints,
 * ON CONFLICT races, concurrency) are certified by the integration lane
 * (tests/integration/, real ping-postgres / Testcontainers), never by this stub.
 * A green property over the stub proves the RUNTIME's logic; the integration
 * lane proves the DATABASE's behavior.
 */
class PgStub {
  constructor() {
    this.events = new Map();   // event_id -> row
    this.missions = new Map(); // mission_id -> row
    this.queryCount = 0;
  }

  _rowCount(n) { return { rowCount: n, rows: [] }; }

  async query(sql, params = []) {
    this.queryCount++;
    const s = sql.replace(/\s+/g, ' ').trim();

    if (/^(CREATE TABLE|CREATE INDEX|ALTER TABLE|CREATE SCHEMA|SET )/.test(s)) {
      return this._rowCount(0);
    }

    // ---- ping_events -------------------------------------------------
    if (s.startsWith('INSERT INTO ping_events')) {
      const [event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id] = params;
      if (this.events.has(event_id)) return { rowCount: 0, rows: [] }; // ON CONFLICT DO NOTHING
      this.events.set(event_id, { event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id });
      return { rowCount: 1, rows: [] };
    }
    if (s.startsWith('SELECT payload FROM ping_events WHERE event_id')) {
      const row = this.events.get(params[0]);
      return { rowCount: row ? 1 : 0, rows: row ? [{ payload: row.payload }] : [] };
    }
    if (s.startsWith('SELECT * FROM ping_events WHERE event_id')) {
      const row = this.events.get(params[0]);
      return { rowCount: row ? 1 : 0, rows: row ? [row] : [] };
    }
    if (s.startsWith('SELECT event_id, event_type, source, timestamp, payload, metadata, namespace, tenant_id FROM ping_events')) {
      return { rowCount: this.events.size, rows: [...this.events.values()] };
    }

    // ---- ping_missions -----------------------------------------------
    if (s.startsWith('INSERT INTO ping_missions')) {
      const [mission_id, mission_type, payload, priority, created_by, tenant_id] = params;
      if (this.missions.has(mission_id)) return { rowCount: 0, rows: [] }; // ON CONFLICT DO NOTHING
      this.missions.set(mission_id, {
        mission_id, mission_type, payload, priority, created_by, tenant_id,
        status: 'created', result: null, assigned_to: null, error: null,
        retries: 0, retry_at: null, lease_until: null, claimed_at: null,
        started_at: null, completed_at: null, hold_at: null,
      });
      return { rowCount: 1, rows: [] };
    }
    const mission = (id) => this.missions.get(id);
    if (/^UPDATE ping_missions SET status = 'assigned'/.test(s)) {
      const [assigned_to, mission_id] = params;
      const m = mission(mission_id);
      if (m && m.status === 'created' && m.hold_at == null) {
        m.status = 'assigned'; m.assigned_to = assigned_to;
        m.claimed_at = new Date().toISOString(); m.lease_until = new Date().toISOString();
        return { rowCount: 1, rows: [{ mission_id }] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (/^UPDATE ping_missions SET status = 'running'/.test(s) && s.includes("started_at")) {
      const [mission_id] = params;
      const m = mission(mission_id);
      if (m && m.status === 'assigned') {
        m.status = 'running'; m.started_at = new Date().toISOString();
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (/^UPDATE ping_missions SET status = 'completed'/.test(s)) {
      const [result, mission_id] = params;
      const m = mission(mission_id);
      const heldDisjunct = m && m.hold_at != null && (m.status === 'assigned' || m.status === 'created');
      if (m && (m.status === 'running' || heldDisjunct)) {
        m.status = 'completed'; m.result = result; m.completed_at = new Date().toISOString();
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (/^UPDATE ping_missions SET status = 'failed'/.test(s) && s.includes('completed_at')) {
      // fail() and failWithRetry() exhausted branch share this shape
      const [error, mission_id] = params.length === 2 ? params : [params[0], params[2]];
      const retries = params.length === 3 ? params[1] : undefined;
      const m = mission(mission_id);
      if (m && ['running', 'assigned', 'retry_pending'].includes(m.status)) {
        m.status = 'failed'; m.error = error; m.completed_at = new Date().toISOString();
        if (retries !== undefined) m.retries = retries;
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (/^UPDATE ping_missions SET status = 'retry_pending'/.test(s)) {
      const [error, retries, , mission_id] = params;
      const m = mission(mission_id);
      if (m && ['running', 'assigned', 'retry_pending'].includes(m.status)) {
        m.status = 'retry_pending'; m.error = error; m.retries = retries;
        return { rowCount: 1, rows: [] };
      }
      return { rowCount: 0, rows: [] };
    }
    if (s.startsWith('SELECT started_at FROM ping_missions')) {
      const m = mission(params[0]);
      return { rowCount: m ? 1 : 0, rows: m ? [{ started_at: m.started_at }] : [] };
    }
    if (s.startsWith('SELECT retries FROM ping_missions')) {
      const m = mission(params[0]);
      return { rowCount: m ? 1 : 0, rows: m ? [{ retries: m.retries }] : [] };
    }
    if (s.startsWith('SELECT tenant_id FROM ping_missions')) {
      const m = mission(params[0]);
      return { rowCount: m ? 1 : 0, rows: m ? [{ tenant_id: m.tenant_id }] : [] };
    }
    if (s.startsWith('SELECT * FROM ping_missions WHERE mission_id')) {
      const m = mission(params[0]);
      return { rowCount: m ? 1 : 0, rows: m ? [{ ...m }] : [] };
    }

    throw new Error(`PgStub: unsupported SQL (add it deliberately, do not widen silently): ${s.slice(0, 140)}`);
  }

  async end() { /* no-op: no real connection */ }
}

module.exports = { PgStub };
