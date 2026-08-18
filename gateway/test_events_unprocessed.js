const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS ${name}`); } catch(e) { failed++; console.log(`  FAIL ${name}: ${e.message}`); }
}

function main() {
  console.log('=== Kernel EventReadAuthority getUnprocessedEvents SQL ===');

  const authorityPath = path.join(__dirname, '..', 'runtime', 'kernel', 'event_read_authority.js');
  const source = fs.readFileSync(authorityPath, 'utf8');
  const ddlSource = fs.readFileSync(path.join(__dirname, '..', 'runtime', 'kernel', 'event_repository.js'), 'utf8');

  // Extract the getUnprocessedEvents SELECT block
  const match = source.match(/async getUnprocessedEvents[\s\S]*?LIMIT \$1[\s\S]*?`/);
  assert.ok(match, 'getUnprocessedEvents query block found');
  const query = match[0];

  test('Query references repository_events, not legacy events table', () => {
    assert.ok(query.includes('FROM repository_events e'), 'should select from repository_events');
    assert.ok(!/FROM events\b/.test(query), 'should not select from legacy events table');
  });

  test('Query uses object_id as aggregate_id (real column)', () => {
    assert.ok(query.includes('e.object_id AS aggregate_id'), 'should alias object_id as aggregate_id');
    assert.ok(!/\be\.aggregate_id\b/.test(query), 'should not reference nonexistent e.aggregate_id column');
  });

  test('repository_events DDL has object_id, never aggregate_id', () => {
    assert.ok(ddlSource.includes('object_id TEXT'), 'DDL has object_id');
    assert.ok(!/aggregate_id/.test(ddlSource), 'DDL must not contain aggregate_id column');
  });

  test('LEFT JOIN event_processing + WHERE ep.event_id IS NULL present', () => {
    assert.ok(query.includes('LEFT JOIN event_processing ep ON e.event_id = ep.event_id'), 'join on event_processing');
    assert.ok(query.includes('WHERE ep.event_id IS NULL'), 'unprocessed filter present');
  });

  test('All selected columns exist in repository_events DDL', () => {
    const selected = ['event_id', 'event_type', 'aggregate_type', 'payload', 'timestamp', 'causation_id', 'correlation_id', 'authority', 'authority_version'];
    for (const col of selected) {
      assert.ok(ddlSource.includes(`${col} `) || ddlSource.includes(`${col} TEXT`), `column ${col} present in DDL`);
    }
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
