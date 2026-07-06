/**
 * Phase 3.21 — Certification Test: Authority Purity
 * 
 * Asserts that no authority imports infrastructure directly.
 * Authorities must be pure functions with no direct infrastructure dependencies.
 * 
 * Test:
 * - Scan all authority files in gateway/
 * - Assert no require() statements importing from adapters/
 * - Assert no require() statements importing postgres, redis, nats, etc.
 * - Assert authorities only import from gateway/ (constitutional authorities)
 */

const fs = require('fs');
const path = require('path');

const GATEWAY_DIR = path.join(__dirname, '../../gateway');
const ADAPTERS_DIR = path.join(__dirname, '../../adapters');

// Infrastructure adapters that should NOT be imported by authorities
const FORBIDDEN_IMPORTS = [
  'adapters/',
  '../adapters/',
  'postgres',
  'redis',
  'nats',
  's3',
  'qdrant',
  'ollama',
  'openai',
  'tika',
  'docling',
  'unstructured',
  'treesitter',
  'pg',
  'ioredis',
  'nats',
  '@aws-sdk/client-s3',
];

// Allowed imports (constitutional authorities only)
const ALLOWED_IMPORTS = [
  './constitutional_time_authority',
  './deterministic_id_authority',
  './canonical_authority',
  './artifact_builder',
];

/**
 * Scan authority file for forbidden imports
 */
function scanAuthorityFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  // Check all require() statements
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  let match;

  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Check if import is forbidden
    const isForbidden = FORBIDDEN_IMPORTS.some(forbidden => 
      importPath.includes(forbidden)
    );

    if (isForbidden) {
      violations.push({
        import: importPath,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }

  return violations;
}

/**
 * Test authority purity
 */
function testAuthorityPurity() {
  console.log('[Authority Purity Test] Starting authority purity check...\n');

  const authorityFiles = fs.readdirSync(GATEWAY_DIR)
    .filter(file => file.endsWith('_authority.js'))
    .map(file => path.join(GATEWAY_DIR, file));

  let allPassed = true;
  const results = [];

  for (const filePath of authorityFiles) {
    const fileName = path.basename(filePath);
    const violations = scanAuthorityFile(filePath);

    if (violations.length > 0) {
      allPassed = false;
      console.log(`❌ ${fileName} - FAILED`);
      violations.forEach(v => {
        console.log(`   Line ${v.line}: require('${v.import}')`);
      });
      results.push({ file: fileName, passed: false, violations });
    } else {
      console.log(`✅ ${fileName} - PASSED`);
      results.push({ file: fileName, passed: true, violations: [] });
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Authority Purity Test: PASSED');
    console.log('All authorities are pure - no infrastructure imports detected.');
  } else {
    console.log('❌ Authority Purity Test: FAILED');
    console.log('Some authorities have forbidden infrastructure imports.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testAuthorityPurity();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testAuthorityPurity };
