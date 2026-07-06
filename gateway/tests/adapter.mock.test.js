/**
 * Integration Test: Embedding Adapter (Mock)
 * 
 * Tests that adapter.embed() returns one vector using a mock.
 * 
 * This test validates the interface without requiring Ollama to be running.
 */

class MockOllamaProviderAdapter {
  constructor() {
    this.provider = 'ollama-mock';
    this.embeddingModel = 'mock-model';
    this.chatModel = 'mock-chat';
  }

  async embed(text) {
    // Return a deterministic mock vector based on text hash
    const hash = this._simpleHash(text);
    const vector = [];
    
    for (let i = 0; i < 768; i++) {
      vector.push((Math.sin(hash + i) + 1) / 2); // Normalized 0-1
    }
    
    return vector;
  }

  async chat(messages, options = null) {
    return {
      message: {
        content: 'Mock response',
        role: 'assistant'
      },
      model: this.chatModel
    };
  }

  async health() {
    return true;
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

async function runTest() {
  console.log('=== Integration Test: Embedding Adapter (Mock) ===\n');

  try {
    // Step 1: Create mock adapter
    console.log('Step 1: Creating mock adapter...');
    const mockAdapter = new MockOllamaProviderAdapter();
    console.log(`✓ Mock adapter created (provider: ${mockAdapter.provider})\n`);

    // Step 2: Test embedding
    console.log('Step 2: Testing embedding...');
    const testText = 'This is a test sentence for embedding.';
    
    const embedding = await mockAdapter.embed(testText);
    
    if (!embedding) {
      throw new Error('Adapter returned null');
    }

    if (!Array.isArray(embedding)) {
      throw new Error('Embedding is not an array');
    }

    if (embedding.length === 0) {
      throw new Error('Embedding array is empty');
    }

    console.log(`✓ Embedding successful (vector length: ${embedding.length})\n`);

    // Step 3: Verify vector properties
    console.log('Step 3: Verifying vector properties...');
    
    // Check that all values are numbers
    for (let i = 0; i < embedding.length; i++) {
      if (typeof embedding[i] !== 'number') {
        throw new Error(`Embedding[${i}] is not a number: ${typeof embedding[i]}`);
      }
    }

    console.log(`✓ All ${embedding.length} values are numbers\n`);

    // Step 4: Test determinism
    console.log('Step 4: Testing determinism...');
    const embedding2 = await mockAdapter.embed(testText);
    
    if (JSON.stringify(embedding) !== JSON.stringify(embedding2)) {
      throw new Error('Same text should produce same embedding');
    }

    console.log(`✓ Determinism verified\n`);

    // Step 5: Test with different text
    console.log('Step 5: Testing with different text...');
    const testText2 = 'Another test sentence with different content.';
    
    const embedding3 = await mockAdapter.embed(testText2);
    
    if (JSON.stringify(embedding) === JSON.stringify(embedding3)) {
      throw new Error('Different text should produce different embedding');
    }

    console.log(`✓ Different text produces different embedding\n`);

    console.log('=== Integration Test: PASSED ===');
    console.log('Summary:');
    console.log(`  - Provider: ${mockAdapter.provider}`);
    console.log(`  - Vector dimension: ${embedding.length}`);
    console.log(`  - First embedding: ${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
    console.log(`  - Second embedding: ${embedding2.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
    console.log(`  - Third embedding: ${embedding3.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...`);
    
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

module.exports = { runTest, MockOllamaProviderAdapter };
