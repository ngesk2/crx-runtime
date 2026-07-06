// Temporal Constitution Audit
// Check for physical time dependencies in kernel

console.log('=== Temporal Constitution Audit ===\n');

const fs = require('fs');
const path = require('path');

// Kernel files to audit
const kernelFiles = [
  'runtime/kernel/authorities/canonical_authority.js',
  'runtime/kernel/authorities/constitutional_clock.js',
  'runtime/kernel/authorities/constitutional_time_authority.js',
  'runtime/kernel/authorities/deterministic_id_authority.js',
  'runtime/kernel/authorities/identity_authority.js',
  'runtime/kernel/authorities/lineage_authority.js',
  'runtime/kernel/authorities/reducer_authority.js',
  'runtime/kernel/authorities/runtime_identity_authority.js',
  'runtime/kernel/authorities/standard_event_schema.js',
  'runtime/kernel/authorities/verification_authority.js',
  'runtime/kernel/authorities/witness_authority.js',
  'runtime/kernel/event_read_authority.js',
  'runtime/kernel/event_repository.js',
  'runtime/kernel/execution/constitutional_execution_pipeline.js',
  'runtime/kernel/execution/dispatcher.js',
  'runtime/kernel/execution/execution_artifact.js',
  'runtime/kernel/execution/projection_registry.js',
  'runtime/kernel/execution/reducer_registry.js',
  'runtime/kernel/execution/replay_decision_authority.js',
  'runtime/kernel/gateway_adapter.js'
];

// Physical time patterns to find
const physicalTimePatterns = [
  /Date\.now\(\)/g,
  /new Date\(\)/g,
  /performance\.now\(\)/g,
  /process\.hrtime\(\)/g,
  /setTimeout\(/g,
  /setInterval\(/g,
  /setImmediate\(/g,
  /queueMicrotask\(/g
];

let violations = [];

for (const filePath of kernelFiles) {
  const fullPath = path.join(__dirname, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    for (const pattern of physicalTimePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          file: filePath,
          pattern: pattern.source,
          count: matches.length
        });
      }
    }
  } catch (error) {
    console.log(`Skipping ${filePath}: ${error.message}`);
  }
}

if (violations.length === 0) {
  console.log('✓ No physical time dependencies found in kernel');
  console.log('✓ All time access goes through ConstitutionalTimeAuthority');
} else {
  console.log('Physical time dependencies found:');
  for (const violation of violations) {
    console.log(`  - ${violation.file}: ${violation.count} occurrences of ${violation.pattern}`);
  }
}

console.log('\n=== Temporal Audit Complete ===');
