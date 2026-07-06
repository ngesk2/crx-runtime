/**
 * Phase 3.25 — Certification Test: Artifact Immutability
 * 
 * Asserts that artifacts are immutable after creation.
 * Mutation attempts should throw errors.
 * 
 * Test:
 * - Create artifact using ArtifactBuilder
 * - Deep freeze the artifact
 * - Attempt to mutate properties
 * - Assert mutations throw errors
 */

const { ArtifactBuilder } = require('../../gateway/artifact_builder');

/**
 * Test artifact immutability
 */
function testArtifactImmutability() {
  console.log('[Artifact Immutability Test] Starting artifact immutability check...\n');

  const builder = new ArtifactBuilder();
  const artifact = builder
    .setType('TestArtifact')
    .setData({ test: 'data' })
    .build();

  let allPassed = true;
  const results = [];

  // Test 1: Attempt to modify top-level property
  try {
    artifact.data = 'modified';
    console.log('❌ Top-level property mutation - FAILED (should throw)');
    allPassed = false;
    results.push({ test: 'top-level mutation', passed: false });
  } catch (error) {
    console.log('✅ Top-level property mutation - PASSED (threw error)');
    results.push({ test: 'top-level mutation', passed: true });
  }

  // Test 2: Attempt to modify nested property
  try {
    if (artifact.data && typeof artifact.data === 'object') {
      artifact.data.test = 'modified';
    }
    console.log('❌ Nested property mutation - FAILED (should throw)');
    allPassed = false;
    results.push({ test: 'nested mutation', passed: false });
  } catch (error) {
    console.log('✅ Nested property mutation - PASSED (threw error)');
    results.push({ test: 'nested mutation', passed: true });
  }

  // Test 3: Attempt to add new property
  try {
    artifact.newProperty = 'new';
    console.log('❌ Property addition - FAILED (should throw)');
    allPassed = false;
    results.push({ test: 'property addition', passed: false });
  } catch (error) {
    console.log('✅ Property addition - PASSED (threw error)');
    results.push({ test: 'property addition', passed: true });
  }

  // Test 4: Attempt to delete property
  try {
    delete artifact.artifact_id;
    console.log('❌ Property deletion - FAILED (should throw)');
    allPassed = false;
    results.push({ test: 'property deletion', passed: false });
  } catch (error) {
    console.log('✅ Property deletion - PASSED (threw error)');
    results.push({ test: 'property deletion', passed: true });
  }

  // Test 5: Attempt to modify array element
  try {
    if (Array.isArray(artifact.parents)) {
      artifact.parents.push('new_parent');
    }
    console.log('❌ Array mutation - FAILED (should throw)');
    allPassed = false;
    results.push({ test: 'array mutation', passed: false });
  } catch (error) {
    console.log('✅ Array mutation - PASSED (threw error)');
    results.push({ test: 'array mutation', passed: true });
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ Artifact Immutability Test: PASSED');
    console.log('Artifacts are properly frozen - mutations rejected.');
  } else {
    console.log('❌ Artifact Immutability Test: FAILED');
    console.log('Some artifact mutations were not rejected.');
  }
  console.log('='.repeat(50));

  return {
    passed: allPassed,
    results: results,
  };
}

// Run test if executed directly
if (require.main === module) {
  const result = testArtifactImmutability();
  process.exit(result.passed ? 0 : 1);
}

module.exports = { testArtifactImmutability };
