const { OllamaAdapter } = require('../gateway/ollama_adapter');
const { PromptAuthority } = require('../gateway/prompt_authority');
const { ModelAuthority } = require('../gateway/model_authority');
const { InferenceWitness } = require('../gateway/inference_witness');
const { StreamingAuthority } = require('../gateway/streaming_authority');
const { runtimeAuthority } = require('../gateway/runtime_authority');

/**
 * End-to-End Replay Test
 * 
 * Phase 4.7 — End-to-End Replay Test
 * 
 * Test flow:
 * User prompt
 *   ↓
 * Prompt Authority
 *   ↓
 * Ollama
 *   ↓
 * Completion
 *   ↓
 * Witness
 *   ↓
 * Replay
 *   ↓
 * same completion hash
 */

class OllamaReplayTest {
  constructor() {
    this._ollamaAdapter = new OllamaAdapter();
    this._promptAuthority = new PromptAuthority();
    this._modelAuthority = new ModelAuthority();
    this._inferenceWitness = new InferenceWitness();
    this._streamingAuthority = new StreamingAuthority();
    this._runtimeAuthority = runtimeAuthority;
  }

  /**
   * Run end-to-end replay test
   * @param {Object} testData - Test data
   * @param {string} testData.prompt - User prompt
   * @param {string} testData.model - Model name
   * @param {Object} testData.options - Generation options
   * @returns {Object} Test result
   */
  async runReplayTest(testData) {
    console.log('=== End-to-End Replay Test ===\n');

    // Constitutional requirement: seed must be provided for deterministic replay
    if (!testData.options || testData.options.seed === undefined || testData.options.seed === null) {
      console.error('ERROR: Seed is required for constitutional replay determinism.');
      console.error('seed == null is not constitutionally reproducible.');
      return {
        success: false,
        reason: 'Seed required for deterministic replay'
      };
    }

    // Step 1: Create runtime context
    console.log('Step 1: Creating runtime context...');
    const runtimeContext = this._runtimeAuthority.createRuntimeContext({
      replayId: null
    });
    console.log(`  Runtime context ID: ${runtimeContext.execution_id}\n`);

    // Step 2: Register model
    console.log('Step 2: Registering model...');
    const model = this._modelAuthority.registerModel({
      name: testData.model,
      digest: `sha256:${this._generateModelDigest(testData.model)}`,
      metadata: {}
    });
    console.log(`  Model ID: ${model.constitutional_model_id}\n`);

    // Step 3: Canonicalize prompt
    console.log('Step 3: Canonicalizing prompt...');
    const canonicalPrompt = this._promptAuthority.canonicalizePrompt({
      user: testData.prompt
    });
    console.log(`  Prompt ID: ${canonicalPrompt.prompt_id}`);
    console.log(`  Prompt hash: ${canonicalPrompt.prompt_hash}\n`);

    // Step 4: Generate completion (first run)
    console.log('Step 4: Generating completion (first run)...');
    const firstResult = await this._ollamaAdapter.generateCompletion({
      model: testData.model,
      prompt: testData.prompt,
      options: testData.options || {},
      stream: false
    });
    console.log(`  Inference ID: ${firstResult.inference_id}`);
    console.log(`  Completion hash: ${firstResult.completion_hash}`);
    console.log(`  Token count: ${firstResult.token_count}\n`);

    // Step 5: Create inference witness
    console.log('Step 5: Creating inference witness...');
    const firstWitness = this._inferenceWitness.createInferenceWitness({
      prompt_hash: firstResult.prompt_hash,
      model_digest: firstResult.model_digest,
      options: testData.options || {},
      token_count: firstResult.token_count,
      completion_hash: firstResult.completion_hash,
      runtime_witness: firstResult.witness,
      replay_id: runtimeContext.replay_id
    });
    console.log(`  Witness ID: ${firstWitness.inference_id}\n`);

    // Step 6: Replay with same prompt
    console.log('Step 6: Replaying with same prompt...');
    const secondResult = await this._ollamaAdapter.generateCompletion({
      model: testData.model,
      prompt: testData.prompt,
      options: testData.options || {},
      stream: false
    });
    console.log(`  Inference ID: ${secondResult.inference_id}`);
    console.log(`  Completion hash: ${secondResult.completion_hash}`);
    console.log(`  Token count: ${secondResult.token_count}\n`);

    // Step 7: Create replay witness
    console.log('Step 7: Creating replay witness...');
    const secondWitness = this._inferenceWitness.createInferenceWitness({
      prompt_hash: secondResult.prompt_hash,
      model_digest: secondResult.model_digest,
      options: testData.options || {},
      token_count: secondResult.token_count,
      completion_hash: secondResult.completion_hash,
      runtime_witness: secondResult.witness,
      replay_id: runtimeContext.replay_id
    });
    console.log(`  Witness ID: ${secondWitness.inference_id}\n`);

    // Step 8: Verify replay equivalence
    console.log('Step 8: Verifying replay equivalence...');
    const equivalenceResult = this._inferenceWitness.verifyReplayEquivalence(
      firstWitness,
      secondWitness
    );
    console.log(`  Equivalence: ${equivalenceResult.valid ? 'VALID' : 'INVALID'}`);
    if (!equivalenceResult.valid) {
      console.log(`  Reason: ${equivalenceResult.reason}\n`);
    } else {
      console.log(`  Reason: ${equivalenceResult.reason}\n`);
    }

    // Step 9: Verify completion hash
    console.log('Step 9: Verifying completion hash...');
    const hashMatch = firstResult.completion_hash === secondResult.completion_hash;
    console.log(`  Hash match: ${hashMatch ? 'YES' : 'NO'}`);
    console.log(`  First hash: ${firstResult.completion_hash}`);
    console.log(`  Second hash: ${secondResult.completion_hash}\n`);

    const testResult = {
      success: equivalenceResult.valid && hashMatch,
      first_run: {
        inference_id: firstResult.inference_id,
        completion_hash: firstResult.completion_hash,
        token_count: firstResult.token_count,
        witness: firstWitness
      },
      second_run: {
        inference_id: secondResult.inference_id,
        completion_hash: secondResult.completion_hash,
        token_count: secondResult.token_count,
        witness: secondWitness
      },
      equivalence: equivalenceResult,
      hash_match: hashMatch,
      runtime_context: runtimeContext,
      canonical_prompt: canonicalPrompt,
      model: model
    };

    console.log('=== Test Complete ===');
    console.log(`Overall Result: ${testResult.success ? 'PASSED' : 'FAILED'}\n`);

    return testResult;
  }

  /**
   * Generate model digest (mock)
   * @param {string} modelName - Model name
   * @returns {string} Model digest
   */
  _generateModelDigest(modelName) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(modelName).digest('hex');
  }

  /**
   * Clear all authorities (for testing)
   */
  clear() {
    this._ollamaAdapter.clear();
    this._promptAuthority.clear();
    this._modelAuthority.clear();
    this._inferenceWitness.clear();
    this._streamingAuthority.clear();
    this._runtimeAuthority.clear();
  }
}

/**
 * Run test
 */
async function runTest() {
  const test = new OllamaReplayTest();

  try {
    const result = await test.runReplayTest({
      prompt: 'Hello, how are you?',
      model: 'llama3.1:8b',
      options: {
        temperature: 0.7,
        top_p: 0.9,
        seed: 42
      }
    });

    if (result.success) {
      console.log('✓ Replay test PASSED');
      process.exit(0);
    } else {
      console.log('✗ Replay test FAILED');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  } finally {
    test.clear();
  }
}

// Run if executed directly
if (require.main === module) {
  runTest();
}

module.exports = { OllamaReplayTest, runTest };
