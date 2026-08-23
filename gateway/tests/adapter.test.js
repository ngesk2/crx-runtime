/**
 * Integration Test: Embedding Adapter
 * 
 * Tests that adapter.embed() returns one vector.
 * 
 * This is the foundational test before building higher-level abstractions.
 */

const { getInferenceAdapter } = require('../../ping-runtime/ai/inference_adapter');

async function runTest() {
  console.log('=== Integration Test: Embedding Adapter ===\n');

  try {
    // Step 1: Initialize adapter
    console.log('Step 1: Initializing inference adapter...');
    const adapter = getInferenceAdapter();
    console.log(`✓ Adapter initialized (provider: ${adapter.provider})\n`);

    // Step 2: Test embedding
    console.log('Step 2: Testing embedding...');
    const testText = 'This is a test sentence for embedding.';
    
    const response = await adapter.embed(testText);
    
    if (!response) {
      throw new Error('Adapter returned null');
    }

    if (!response.embedding) {
      throw new Error('Adapter returned object without embedding field');
    }

    if (!Array.isArray(response.embedding)) {
      throw new Error('Embedding is not an array');
    }

    if (response.embedding.length === 0) {
      throw new Error('Embedding array is empty');
    }

    console.log(`✓ Embedding successful (vector length: ${response.embedding.length})\n`);

    // Step 3: Verify vector properties
    console.log('Step 3: Verifying vector properties...');
    
    // Check that all values are numbers
    for (let i = 0; i < response.embedding.length; i++) {
      if (typeof response.embedding[i] !== 'number') {
        throw new Error(`Embedding[${i}] is not a number: ${typeof response.embedding[i]}`);
      }
    }

    console.log(`✓ All ${response.embedding.length} values are numbers\n`);

    // Step 4: Test with different text
    console.log('Step 4: Testing with different text...');
    const testText2 = 'Another test sentence with different content.';
    
    const response2 = await adapter.embed(testText2);
    
    if (!response2 || !response2.embedding) {
      throw new Error('Second embedding failed');
    }

    // Vectors should be different
    let sumDiff = 0;
    for (let i = 0; i < Math.min(response.embedding.length, response2.embedding.length); i++) {
      sumDiff += Math.abs(response.embedding[i] - response2.embedding[i]);
    }

    if (sumDiff === 0) {
      throw new Error('Vectors are identical (should be different for different text)');
    }

    console.log(`✓ Second embedding successful (vector difference: ${sumDiff.toFixed(2)})\n`);

    console.log('=== Integration Test: PASSED ===');
    console.log('Summary:');
    console.log(`  - Provider: ${adapter.provider}`);
    console.log(`  - Vector dimension: ${response.embedding.length}`);
    console.log(`  - First embedding: ${response.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
    console.log(`  - Second embedding: ${response2.embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
    
    return true;

  } catch (error) {
    console.error(`\n=== Integration Test: FAILED ===`);
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  runTest().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { runTest };
