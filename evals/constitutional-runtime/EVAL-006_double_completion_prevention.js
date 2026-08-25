/**
 * EVAL-006: Mission Double-Completion Prevention
 *
 * Proves INV-035 (forward-only transitions).
 *
 * Two complete() calls on same running mission:
 * First succeeds, second no-ops.
 */

let pass = 0;
let fail = 0;
function assert(condition, msg) {
  if (condition) { pass++; } else { fail++; console.log(`    FAIL: ${msg}`); }
}

async function run() {
  const { MissionRuntime } = require('../../ping-runtime/orchestration/mission_runtime');

  let missions = {};
  const mockPool = {
    query(sql, params) {
      if (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX') || sql.includes('ALTER TABLE')) {
        return Promise.resolve({});
      }
      // INSERT — ON CONFLICT DO NOTHING, returns { rows: [{ missionId }], rowCount }
      if (sql.includes('INSERT INTO ping_missions')) {
        const mid = params[0];
        if (missions[mid]) return Promise.resolve({ rowCount: 0 });
        missions[mid] = {
          mission_id: mid,
          mission_type: params[1],
          status: 'created',
          priority: params[3] || 0,
          payload: typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2],
          retries: 0,
          max_attempts: 3,
        };
        return Promise.resolve({ rowCount: 1 });
      }
      // SELECT by mission_id (for started_at lookup in complete())
      if (sql.includes('SELECT started_at FROM ping_missions')) {
        const mid = params[0];
        const m = missions[mid];
        return Promise.resolve({ rows: m ? [{ started_at: m.started_at }] : [], rowCount: m ? 1 : 0 });
      }
      // SELECT for getPending/getActive/getStats
      if (sql.includes('SELECT') && sql.includes('ping_missions')) {
        if (sql.includes('GROUP BY status')) {
          const counts = {};
          for (const m of Object.values(missions)) {
            counts[m.status] = (counts[m.status] || 0) + 1;
          }
          return Promise.resolve({ rows: Object.entries(counts).map(([status, count]) => ({ status, count: String(count) })) });
        }
        const rows = Object.values(missions);
        return Promise.resolve({ rows, rowCount: rows.length });
      }
      // UPDATE
      if (sql.includes('UPDATE ping_missions')) {
        const mid = params[params.length - 1];
        const m = missions[mid];
        if (!m) return Promise.resolve({ rowCount: 0 });

        if (sql.includes("status = 'assigned'") && m.status === 'created') {
          m.status = 'assigned';
          m.assigned_to = params[0];
          m.claimed_at = new Date();
          m.lease_until = new Date(Date.now() + 60000);
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql.includes("status = 'running'") && m.status === 'assigned') {
          m.status = 'running';
          m.started_at = new Date();
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql.includes("status = 'completed'") && m.status === 'running') {
          m.status = 'completed';
          m.result = typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0];
          return Promise.resolve({ rowCount: 1 });
        }
        if (sql.includes("status = 'failed'") && ['running', 'assigned', 'retry_pending'].includes(m.status)) {
          m.status = 'failed';
          m.error = params[0];
          return Promise.resolve({ rowCount: 1 });
        }
        return Promise.resolve({ rowCount: 0 });
      }
      return Promise.resolve({ rowCount: 0, rows: [] });
    },
  };

  const runtime = new MissionRuntime({ pool: mockPool });

  await runtime.create('EVAL_TEST', { test: true }, { priority: 1 });
  const mid = Object.keys(missions)[0];
  await runtime.assign(mid, 'eval-worker');
  await runtime.start(mid);

  assert(missions[mid].status === 'running', 'mission is running');

  // INV-035: First complete succeeds (returns void, check via missions map)
  await runtime.complete(mid, { output: 'first' });
  assert(missions[mid].status === 'completed', 'mission completed');

  // INV-035: Second complete is a no-op (WHERE status = 'running' doesn't match)
  await runtime.complete(mid, { output: 'second' });
  assert(missions[mid].result?.output === 'first', 'result not overwritten');

  // INV-035: Cannot start completed mission
  await runtime.start(mid);
  assert(missions[mid].status === 'completed', 'still completed after start attempt');

  return { pass, fail };
}

module.exports = { run };
