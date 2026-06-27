const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { lintGovernance } = require('../scripts/spec-linter');

test('spec linter accepts the governance scaffold', () => {
  const repoRoot = path.resolve(__dirname, '..');
  const result = lintGovernance(repoRoot);

  assert.equal(result.ok, true);
  assert.equal(result.errors.length, 0);
  assert.ok(result.summary.includes('specs'));
});
