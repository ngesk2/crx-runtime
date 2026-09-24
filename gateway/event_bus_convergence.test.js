'use strict';
/**
 * ConstitutionalEventBus convergence pins (2026-09-24, stream 2 Phase 0).
 *
 * Declared direction: UnifiedEventRuntime (ping_events) is the sole canonical
 * event authority. ConstitutionalEventBus (gateway/event_bus.js) is a legacy
 * competing path that writes its own `events` table with self-minted IDs and
 * bypasses UER. These tests pin the direction without changing behavior:
 *
 * 1. publish() still persists to the `events` table (behavior frozen for any
 *    existing consumer; this test guards against accidental breakage).
 * 2. subscribe/pattern dispatch still works (in-memory contract preserved).
 * 3. The module carries a deprecation marker naming UER as canonical.
 * 4. Sole-writer invariant: outside tests and evals, the only production
 *    module containing `INSERT INTO ping_events` is unified_event_runtime.js.
 *
 * Run: node --test event_bus_convergence.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { ConstitutionalEventBus } = require('./event_bus.js');

const REPO_ROOT = path.resolve(__dirname, '..');

function mockPool(captured) {
  return {
    query: async (sql, params) => {
      captured.push({ sql, params });
      return { rows: [] };
    },
  };
}

test('publish() persists to the legacy events table (behavior frozen)', async () => {
  const captured = [];
  const bus = new ConstitutionalEventBus(mockPool(captured));
  const out = await bus.publish({ event_type: 'TEST_EVENT', aggregate_type: 'TEST' });
  assert.equal(captured.length, 1);
  assert.match(captured[0].sql, /INSERT INTO events/);
  assert.ok(out.event_id, 'published event carries an event_id');
  assert.ok(out.timestamp, 'published event carries a timestamp');
  assert.ok(out.correlation_id, 'published event carries a correlation_id');
});

test('subscribe/pattern dispatch contract is preserved', async () => {
  const bus = new ConstitutionalEventBus(mockPool([]));
  const seen = [];
  bus.subscribe('COMPILER_*', async (e) => { seen.push(e.event_type); });
  bus.subscribe('*', async (e) => { seen.push('wild:' + e.event_type); });
  await bus.publish({ event_type: 'COMPILER_PASS_DONE' });
  await bus.publish({ event_type: 'UNRELATED' });
  assert.deepEqual(seen, ['COMPILER_PASS_DONE', 'wild:COMPILER_PASS_DONE', 'wild:UNRELATED']);
});

test('event_bus carries a deprecation marker naming UER as canonical', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'gateway/event_bus.js'), 'utf8');
  assert.ok(src.includes('mission/event-bus convergence stream'), 'missing convergence marker');
  assert.ok(src.includes('UnifiedEventRuntime'), 'marker must name the canonical authority');
  assert.ok(src.includes('ping_events'), 'marker must name the canonical journal');
});

test('UER is the sole production writer of ping_events', () => {
  const SKIP_DIRS = new Set(['node_modules', 'worktrees', '.git', '.hg']);
  const hits = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && /\.(js|ts)$/.test(entry.name)) {
        const full = path.join(dir, entry.name);
        let src;
        try { src = fs.readFileSync(full, 'utf8'); } catch { continue; }
        if (src.includes('INSERT INTO ping_events')) hits.push(path.relative(REPO_ROOT, full));
      }
    }
  };
  walk(REPO_ROOT);
  const allowed = (rel) => {
    const norm = rel.split(path.sep).join('/');
    if (norm.endsWith('ping-runtime/events/unified_event_runtime.js')) return true;
    if (norm.includes('evals/')) return true; // eval harnesses seed their own fixtures
    if (/(^|\/)test[^/]*\.(js|ts)$/.test(norm) || norm.includes('.test.')) return true;
    return false;
  };
  const violations = hits.filter((h) => !allowed(h));
  assert.deepEqual(violations, [], `non-UER production writers of ping_events: ${violations.join(', ')}`);
});
