/**
 * Integration Test: Full Ingestion Pipeline
 * 
 * Tests the complete pipeline:
 * README.md → chunk → embed → insert → query → assert
 */

const fs = require('fs');
const path = require('path');
const { SemanticChunker } = require('../semantic_chunker');
const { MetadataExtractor } = require('../metadata_extractor');
const { getInferenceAdapter } = require('../../ping-runtime/ai/inference_adapter');
const { QdrantClient } = require('../qdrant_client');

// Test configuration
const TEST_COLLECTION = 'test_ingest';
const TEST_FILE = path.join(__dirname, 'test_document.md');

async function runTest() {
  console.log('=== Integration Test: Full Ingestion Pipeline ===\n');

  let qdrantClient = null;

  try {
    // Step 1: Read README.md
    console.log('Step 1: Reading README.md...');
    if (!fs.existsSync(TEST_FILE)) {
      throw new Error(`Test file not found: ${TEST_FILE}`);
    }
    const content = fs.readFileSync(TEST_FILE, 'utf-8');
    console.log(`✓ Read ${content.length} characters\n`);

    // Step 2: Chunk content
    console.log('Step 2: Chunking content...');
    const chunker = new SemanticChunker({ maxTokens: 500, overlap: 50 });
    const chunks = chunker.chunk(TEST_FILE, content);
    console.log(`✓ Created ${chunks.length} chunks\n`);

    if (chunks.length === 0) {
      throw new Error('No chunks generated');
    }

    // Step 3: Extract metadata
    console.log('Step 3: Extracting metadata...');
    const metadataExtractor = new MetadataExtractor();
    const metadata = metadataExtractor.extract(TEST_FILE);
    console.log(`✓ Extracted metadata: ${metadata.filename}, ${metadata.language}\n`);

    // Step 4: Initialize Qdrant client
    console.log('Step 4: Initializing Qdrant client...');
    qdrantClient = new QdrantClient();
    await qdrantClient.ensureCollection(TEST_COLLECTION, 768);
    console.log('✓ Qdrant collection ready\n');

    // Step 5: Embed chunks
    console.log('Step 5: Embedding chunks...');
    const inferenceAdapter = getInferenceAdapter();
    const embeddings = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`  Embedding chunk ${i + 1}/${chunks.length}...`);
      
      try {
        const response = await inferenceAdapter.embed(chunks[i].text);
        
        if (response && response.embedding) {
          embeddings.push(response.embedding);
          console.log(`  ✓ Chunk ${i + 1} embedded (vector length: ${response.embedding.length})`);
        } else {
          throw new Error(`Embedding returned null for chunk ${i + 1}`);
        }
      } catch (error) {
        console.error(`  ✗ Chunk ${i + 1} failed: ${error.message}`);
        throw error;
      }
    }

    console.log(`✓ Embedded ${embeddings.length} chunks\n`);

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: ${embeddings.length} vs ${chunks.length}`);
    }

    // Step 6: Insert into Qdrant
    console.log('Step 6: Inserting into Qdrant...');
    const points = chunks.map((chunk, index) => ({
      id: `test-chunk-${index}`,
      vector: embeddings[index],
      payload: {
        text: chunk.text,
        file_path: TEST_FILE,
        chunk_index: index,
        ...metadata
      }
    }));

    await qdrantClient.upsert(TEST_COLLECTION, points);
    console.log(`✓ Upserted ${points.length} points\n`);

    // Step 7: Query Qdrant
    console.log('Step 7: Querying Qdrant...');
    const queryText = chunks[0].text.substring(0, 100);
    console.log(`  Query text: "${queryText}..."`);

    const queryEmbedding = await inferenceAdapter.embed(queryText);
    
    if (!queryEmbedding || !queryEmbedding.embedding) {
      throw new Error('Query embedding failed');
    }

    const results = await qdrantClient.search(TEST_COLLECTION, queryEmbedding.embedding, 3);
    console.log(`✓ Found ${results.length} results\n`);

    if (results.length === 0) {
      throw new Error('No results returned from Qdrant');
    }

    // Step 8: Assert results
    console.log('Step 8: Asserting results...');
    const topResult = results[0];
    console.log(`  Top result score: ${topResult.score}`);
    console.log(`  Top result text: "${topResult.payload.text.substring(0, 100)}..."`);

    // Assert that the returned chunk contains expected text
    const expectedText = chunks[0].text.substring(0, 50);
    const actualText = topResult.payload.text;

    if (!actualText.includes(expectedText)) {
      throw new Error(`Assertion failed: expected text "${expectedText}" not found in result`);
    }

    console.log(`✓ Assertion passed: result contains expected text\n`);

    // Cleanup
    console.log('Cleanup: Deleting test collection...');
    await qdrantClient.deleteCollection(TEST_COLLECTION);
    console.log('✓ Test collection deleted\n');

    console.log('=== Integration Test: PASSED ===');
    return true;

  } catch (error) {
    console.error(`\n=== Integration Test: FAILED ===`);
    console.error(`Error: ${error.message}`);
    console.error(error.stack);

    // Cleanup on failure
    if (qdrantClient) {
      try {
        console.log('\nCleanup: Deleting test collection...');
        await qdrantClient.deleteCollection(TEST_COLLECTION);
        console.log('✓ Test collection deleted');
      } catch (cleanupError) {
        console.error('Cleanup failed:', cleanupError.message);
      }
    }

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
