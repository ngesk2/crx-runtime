/**
 * Regression test: EventReadAuthority.getRecentEvents timestamp computation.
 *
 * Prior defect: getRecentEvents computed
 *   constitutionalTimeAuthority.now() - (minutes * 60 * 1000)
 * now() returns an ISO STRING, so the subtraction always produced NaN,
 * the `WHERE timestamp >= $1` query always failed, the catch returned [],
 * and routes/events.js masked it with a Date.now() fallback.
 *
 * This test proves a valid ISO cutoff (derived from nowAsMillis()) is
 * passed to Postgres.
 */

const assert = require('assert');
const {
  EventReadAuthority: KernelEventReadAuthority,
} = require('../runtime/kernel/event_read_authority');

function buildAuthority({ onQuery }) {
  const pool = {
    async query(sql, params) {
      if (onQuery) return onQuery(sql, params);
      return { rows: [] };
    },
  };
  return new KernelEventReadAuthority(pool);
}

async function main() {
  let captured = null;

  const authority = buildAuthority({
    onQuery(sql, params) {
      captured = { sql, params };
      return {
        rows: [
          {
            event_id: 'evt-1',
            event_type: 'TEST_EVENT',
            timestamp: new Date().toISOString(),
            stream: 'obj-1',
            aggregate_type: 'test',
            payload: { key: 'value' },
          },
        ],
      };
    },
  });

  const events = await authority.getRecentEvents(60, 100);

  assert.strictEqual(captured.params.length, 2, 'two bind params');
  const cutoff = captured.params[0];

  assert.strictEqual(typeof cutoff, 'string', 'cutoff is a string (ISO)');
  assert.ok(!Number.isNaN(Date.parse(cutoff)), `cutoff parses as a date (was: ${cutoff})`);
  assert.ok(cutoff.endsWith('Z') || cutoff.includes('+'), 'ISO timestamp has zone suffix');
  assert.ok(captured.params[1] === 100, 'limit bound');

  const cutoffMillis = Date.parse(cutoff);
  const nowMillis = Date.now();
  assert.ok(cutoffMillis <= nowMillis, 'cutoff is in the past');
  assert.ok(nowMillis - cutoffMillis <= 70 * 60 * 1000, 'cutoff within ~70min of now');
  assert.ok(nowMillis - cutoffMillis >= 50 * 60 * 1000, 'cutoff at least ~50min back');

  assert.strictEqual(events.length, 1);
  assert.strictEqual(events[0].event_id, 'evt-1');
  assert.strictEqual(events[0].stream, 'obj-1');

  console.log('PASS: getRecentEvents passes valid ISO cutoff + maps rows');
  console.log(`  cutoff=${cutoff}`);
  console.log(`  ageMs=${nowMillis - cutoffMillis}`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('FAIL:', err.message);
  process.exit(1);
});
