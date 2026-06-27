const test = require('node:test');
const assert = require('node:assert/strict');
const { auditRepositoryOwnership } = require('../dist/caos/caos-audit.js');

test('classifies commodity and constitutional paths', () => {
  const report = auditRepositoryOwnership([
    'frontends/typescript/ts-frontend.ts',
    'engines/ownership-engine.ts',
    'graph/graph-engine.ts',
    'caos/caos-audit.ts',
  ]);

  assert.ok(report.commodityPaths.includes('frontends/typescript/ts-frontend.ts'));
  assert.ok(report.constitutionalPaths.includes('engines/ownership-engine.ts'));
  assert.ok(report.commodityPaths.includes('graph/graph-engine.ts'));
  assert.ok(report.deferredPaths.includes('caos/caos-audit.ts'));
});
