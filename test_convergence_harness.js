// Convergence Harness Test
// Test the convergence harness with a simple deterministic function

console.log('=== Convergence Harness Test ===\n');

const { convergenceHarness } = require('./runtime/kernel/convergence_harness');
const { CanonicalAuthority, CanonicalBytes } = require('./runtime/kernel/authorities/canonical_authority');

// Simple deterministic test function
async function testDeterministicFunction(context) {
  const { iteration, randomization, seed } = context;
  
  // Use the same data for all iterations (simulating same event stream)
  const data = {
    event_type: 'TEST_EVENT',
    aggregate_id: 'test-123',
    aggregate_type: 'TestAggregate',
    sequence: 1,
    payload: { data: 'test' }
  };
  
  // Apply randomization to processing (simulating different ordering)
  // This simulates that events might be processed in different orders
  // but the constitutional data should remain the same
  if (randomization === 'insertion_ordering') {
    // Simulate different insertion order - but data stays same
    // In a real system, this would affect processing order but not the event data
  } else if (randomization === 'scheduler_ordering') {
    // Simulate different scheduler order - but data stays same
  }
  
  // Compute canonical bytes on the original data (not processing metadata)
  const canonicalBytes = CanonicalBytes.serialize(data);
  
  // Compute canonical hash on the original data
  const canonicalHash = CanonicalAuthority.hash(data);
  
  // Compute replay hash (same as canonical for this simple test)
  const replayHash = canonicalHash;
  
  // Compute witness hash (same as canonical for this simple test)
  const witnessHash = canonicalHash;
  
  // Compute transcript hash (same as canonical for this simple test)
  const transcriptHash = canonicalHash;
  
  return {
    canonicalBytes: canonicalBytes.toString('hex'),
    canonicalHash,
    replayHash,
    witnessHash,
    transcriptHash
  };
}

// Main test function
async function runTest() {
  // Run convergence test with 100 iterations
  console.log('Running convergence test with 100 iterations...\n');

  const results = await convergenceHarness.runConvergenceTest(testDeterministicFunction, {
    iterations: 100,
    randomizations: ['insertion_ordering', 'scheduler_ordering']
  });

  console.log('\n=== Convergence Test Results ===');
  console.log(`Total iterations: ${results.iterations}`);
  console.log(`Successful iterations: ${results.convergence.successfulIterations}`);
  console.log(`Failed iterations: ${results.convergence.failedIterations}`);
  console.log(`Converged: ${results.convergence.converged}`);
  console.log(`Unique canonical hashes: ${results.convergence.uniqueCanonicalHashes}`);
  console.log(`Unique replay hashes: ${results.convergence.uniqueReplayHashes}`);
  console.log(`Unique witness hashes: ${results.convergence.uniqueWitnessHashes}`);
  console.log(`Unique transcript hashes: ${results.convergence.uniqueTranscriptHashes}`);

  if (results.convergence.converged) {
    console.log('\n✓ Convergence test passed - all iterations produced identical constitutional outputs');
  } else {
    console.log('\n✗ Convergence test failed - iterations produced different constitutional outputs');
  }

  // Test shuffle function
  console.log('\n=== Testing Shuffle Function ===');
  const testArray = [1, 2, 3, 4, 5];
  console.log('Original array:', testArray);
  console.log('Shuffled array:', convergenceHarness.shuffle(testArray));
  console.log('Shuffled again:', convergenceHarness.shuffle(testArray));

  // Test batching function
  console.log('\n=== Testing Batching Function ===');
  const testItems = Array.from({ length: 20 }, (_, i) => i + 1);
  const batches = convergenceHarness.randomizeBatching(testItems, 2, 5);
  console.log(`Split ${testItems.length} items into ${batches.length} batches`);
  batches.forEach((batch, i) => {
    console.log(`  Batch ${i}: ${batch.length} items`);
  });

  console.log('\n=== Convergence Harness Test Complete ===');
}

runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
