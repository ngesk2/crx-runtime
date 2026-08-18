const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch(e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

function main() {
  console.log('=== MigrationEngine event_processing schema alignment ===');

  const enginePath = path.join(__dirname, 'migration_engine.js');
  const source = fs.readFileSync(enginePath, 'utf8');

  const m004 = source.match(/async _migration004\(client\)[\s\S]*?\n  \}/);
  assert.ok(m004, 'migration 004 method found');
  const m011 = source.match(/async _migration011\(client\)[\s\S]*?\n  \}/);
  assert.ok(m011, 'migration 011 method found');

  test('Migration 004 CREATE TABLE includes retries column', () => {
    assert.ok(m004[0].includes('retries INTEGER NOT NULL DEFAULT 0'), '004 should declare retries INTEGER NOT NULL DEFAULT 0');
  });

  test('Migration 004 CREATE TABLE includes last_error column', () => {
    assert.ok(m004[0].includes('last_error TEXT'), '004 should declare last_error TEXT');
  });

  test('Migration 004 CREATE TABLE includes created_at column', () => {
    assert.ok(m004[0].includes('created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()'), '004 should declare created_at TIMESTAMPTZ');
  });

  test('Migration 004 CREATE TABLE includes worker with default', () => {
    assert.ok(m004[0].includes("worker TEXT NOT NULL DEFAULT 'unknown'"), '004 should declare worker with default');
  });

  test('Migration 011 uses ADD COLUMN IF NOT EXISTS (idempotent)', () => {
    const alter = m011[0].match(/ALTER TABLE event_processing[\s\S]*?\n    `/);
    assert.ok(alter, 'ALTER TABLE event_processing block found');
    assert.ok(alter[0].includes('ADD COLUMN IF NOT EXISTS retries'), '011 should idempotently add retries');
    assert.ok(alter[0].includes('ADD COLUMN IF NOT EXISTS last_error'), '011 should idempotently add last_error');
    assert.ok(alter[0].includes('ADD COLUMN IF NOT EXISTS created_at'), '011 should idempotently add created_at');
  });

  test('Migration 011 registered in _registerMigrations', () => {
    const reg = source.match(/this\._migrations\.set\(11,[\s\S]*?\}\);[\s\S]*?this\._currentMigrationVersion = 11;/);
    assert.ok(reg, 'migration 11 should be registered and current version set to 11');
  });

  test('Markers align with EventReadAuthority write columns', () => {
    const authPath = path.join(__dirname, '..', 'runtime', 'kernel', 'event_read_authority.js');
    const auth = fs.readFileSync(authPath, 'utf8');
    for (const col of ['retries', 'last_error']) {
      assert.ok(auth.includes(col), `EventReadAuthority should reference column ${col}`);
      assert.ok(m004[0].includes(col) && m011[0].includes(col), `both migrations should cover column ${col}`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main();
