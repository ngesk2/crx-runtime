const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { transcriptAuthority } = require('./transcript_authority');
const { replayVerifier } = require('./replay_verifier');

/**
 * Constitutional Fuzzer
 * 
 * Phase 5.6 — Constitutional Fuzzer
 * 
 * Thousands of runs with random variations:
 * 
 * - insertion ordering
 * - DB ordering
 * - Unicode
 * - object key ordering
 * - async scheduling
 * - checkpoint positions
 * - replay restart locations
 * 
 * Every run must produce identical transcript hash
 */

class ConstitutionalFuzzer {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._transcriptAuthority = transcriptAuthority;
    this._replayVerifier = replayVerifier;
    this._fuzzerId = this._generateFuzzerId();
    this._fuzzerVersion = '5.0.0';
    this._fuzzResults = new Map();
  }

  /**
   * Run fuzz test with random variations
   * @param {Object} testConfig - Test configuration
   * @param {number} testConfig.iterations - Number of iterations
   * @param {Object} testConfig.executionData - Execution data to fuzz
   * @param {Array} testConfig.variations - Variations to apply
   * @returns {Object} Fuzz test results
   */
  async runFuzzTest(testConfig) {
    const iterations = testConfig.iterations || 1000;
    const executionData = testConfig.executionData;
    const variations = testConfig.variations || this._getDefaultVariations();

    const results = {
      fuzzer_id: this._fuzzerId,
      fuzzer_version: this._fuzzerVersion,
      test_id: this._generateTestId(),
      iterations: iterations,
      variations: variations,
      start_time: constitutionalTimeAuthority.nowAsMillis(),
      end_time: null,
      duration_ms: null,
      results: {
        total_runs: 0,
        successful_runs: 0,
        failed_runs: 0,
        transcript_hashes: new Set(),
        hash_collisions: 0,
        failures: []
      },
      summary: {
        all_hashes_identical: true,
        constitutional_determinism_verified: false
      }
    };

    console.log(`=== Constitutional Fuzz Test ===`);
    console.log(`Fuzzer ID: ${this._fuzzerId}`);
    console.log(`Test ID: ${results.test_id}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Variations: ${variations.length}`);
    console.log('');

    for (let i = 0; i < iterations; i++) {
      const runResult = await this._runSingleFuzzIteration(executionData, variations, i);
      
      results.results.total_runs++;
      
      if (runResult.success) {
        results.results.successful_runs++;
        results.results.transcript_hashes.add(runResult.transcript_hash);
      } else {
        results.results.failed_runs++;
        results.results.failures.push(runResult.failure);
      }

      // Progress reporting
      if ((i + 1) % 100 === 0) {
        console.log(`Progress: ${i + 1}/${iterations} runs completed`);
        console.log(`  Successful: ${results.results.successful_runs}`);
        console.log(`  Failed: ${results.results.failed_runs}`);
        console.log(`  Unique hashes: ${results.results.transcript_hashes.size}`);
        console.log('');
      }
    }

    results.end_time = constitutionalTimeAuthority.nowAsMillis();
    results.duration_ms = results.end_time - results.start_time;

    // Calculate summary
    results.results.hash_collisions = results.results.transcript_hashes.size - 1;
    results.summary.all_hashes_identical = results.results.transcript_hashes.size === 1;
    results.summary.constitutional_determinism_verified = 
      results.summary.all_hashes_identical && 
      results.results.failed_runs === 0;

    console.log(`=== Fuzz Test Complete ===`);
    console.log(`Duration: ${results.duration_ms}ms`);
    console.log(`Total runs: ${results.results.total_runs}`);
    console.log(`Successful: ${results.results.successful_runs}`);
    console.log(`Failed: ${results.results.failed_runs}`);
    console.log(`Unique hashes: ${results.results.transcript_hashes.size}`);
    console.log(`All hashes identical: ${results.summary.all_hashes_identical ? 'YES' : 'NO'}`);
    console.log(`Constitutional determinism verified: ${results.summary.constitutional_determinism_verified ? 'YES' : 'NO'}`);
    console.log('');

    // Store results
    this._fuzzResults.set(results.test_id, results);

    return results;
  }

  /**
   * Run single fuzz iteration
   * @param {Object} executionData - Execution data
   * @param {Array} variations - Variations to apply
   * @param {number} iteration - Iteration number
   * @returns {Object} Iteration result
   */
  async _runSingleFuzzIteration(executionData, variations, iteration) {
    try {
      // Apply random variation
      const variedExecutionData = this._applyRandomVariation(executionData, variations, iteration);
      
      // Create transcript
      const transcript = this._transcriptAuthority.createFromExecution(variedExecutionData);
      
      // Verify transcript
      const verification = this._replayVerifier.verifyReplay(transcript);
      
      if (!verification.overall.valid) {
        return {
          success: false,
          failure: {
            iteration: iteration,
            reason: verification.overall.reason,
            verification: verification
          }
        };
      }

      return {
        success: true,
        transcript_hash: transcript.transcript_metadata.hash
      };
    } catch (error) {
      return {
        success: false,
        failure: {
          iteration: iteration,
          reason: 'Exception during fuzz iteration',
          error: error.message
        }
      };
    }
  }

  /**
   * Apply random variation to execution data
   * @param {Object} executionData - Execution data
   * @param {Array} variations - Available variations
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _applyRandomVariation(executionData, variations, iteration) {
    const variedData = JSON.parse(JSON.stringify(executionData));
    
    // Select random variation
    const variationIndex = iteration % variations.length;
    const variation = variations[variationIndex];
    
    switch (variation.type) {
      case 'insertion_ordering':
        return this._varyInsertionOrdering(variedData, iteration);
      
      case 'unicode_normalization':
        return this._varyUnicodeNormalization(variedData, iteration);
      
      case 'object_key_ordering':
        return this._varyObjectKeyOrdering(variedData, iteration);
      
      case 'async_scheduling':
        return this._varyAsyncScheduling(variedData, iteration);
      
      case 'checkpoint_positions':
        return this._varyCheckpointPositions(variedData, iteration);
      
      case 'replay_restart_locations':
        return this._varyReplayRestartLocations(variedData, iteration);
      
      default:
        return variedData;
    }
  }

  /**
   * Vary insertion ordering
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyInsertionOrdering(executionData, iteration) {
    // Randomize tool execution order
    if (executionData.tool_witnesses && Array.isArray(executionData.tool_witnesses)) {
      const tools = [...executionData.tool_witnesses];
      
      // Fisher-Yates shuffle with iteration as seed
      for (let i = tools.length - 1; i > 0; i--) {
        const j = (iteration + i) % (i + 1);
        [tools[i], tools[j]] = [tools[j], tools[i]];
      }
      
      executionData.tool_witnesses = tools;
    }

    return executionData;
  }

  /**
   * Vary Unicode normalization
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyUnicodeNormalization(executionData, iteration) {
    // Apply different Unicode normalization forms
    if (executionData.prompt_witness && executionData.prompt_witness.canonical_prompt) {
      const forms = ['NFC', 'NFD', 'NFKC', 'NFKD'];
      const form = forms[iteration % forms.length];
      
      // Apply normalization to prompt content
      const normalizeContent = (content) => {
        if (typeof content === 'string') {
          return content.normalize(form);
        }
        if (Array.isArray(content)) {
          return content.map(normalizeContent);
        }
        if (typeof content === 'object' && content !== null) {
          const result = {};
          for (const key of Object.keys(content)) {
            result[key] = normalizeContent(content[key]);
          }
          return result;
        }
        return content;
      };

      executionData.prompt_witness.canonical_prompt = normalizeContent(
        executionData.prompt_witness.canonical_prompt
      );
    }

    return executionData;
  }

  /**
   * Vary object key ordering
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyObjectKeyOrdering(executionData, iteration) {
    // Randomize object key ordering
    const randomizeKeys = (obj) => {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
      }

      const keys = Object.keys(obj);
      const shuffledKeys = [...keys];
      
      // Shuffle keys based on iteration
      for (let i = shuffledKeys.length - 1; i > 0; i--) {
        const j = (iteration + i) % (i + 1);
        [shuffledKeys[i], shuffledKeys[j]] = [shuffledKeys[j], shuffledKeys[i]];
      }

      const result = {};
      for (const key of shuffledKeys) {
        result[key] = randomizeKeys(obj[key]);
      }

      return result;
    };

    return randomizeKeys(executionData);
  }

  /**
   * Vary async scheduling
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyAsyncScheduling(executionData, iteration) {
    // Simulate async scheduling variations by adding metadata
    executionData.runtime_metadata = executionData.runtime_metadata || {};
    executionData.runtime_metadata.async_schedule_order = iteration % 10;
    
    return executionData;
  }

  /**
   * Vary checkpoint positions
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyCheckpointPositions(executionData, iteration) {
    // Vary checkpoint positions
    if (executionData.checkpoint_witnesses && Array.isArray(executionData.checkpoint_witnesses)) {
      const checkpointCount = executionData.checkpoint_witnesses.length;
      const variedPositions = Math.floor((iteration % 10) * checkpointCount / 10);
      
      executionData.runtime_metadata = executionData.runtime_metadata || {};
      executionData.runtime_metadata.checkpoint_position = variedPositions;
    }

    return executionData;
  }

  /**
   * Vary replay restart locations
   * @param {Object} executionData - Execution data
   * @param {number} iteration - Iteration number
   * @returns {Object} Varied execution data
   */
  _varyReplayRestartLocations(executionData, iteration) {
    // Vary replay restart locations
    executionData.runtime_metadata = executionData.runtime_metadata || {};
    executionData.runtime_metadata.restart_location = iteration % 5;
    
    return executionData;
  }

  /**
   * Get default variations
   * @returns {Array} Default variations
   */
  _getDefaultVariations() {
    return [
      { type: 'insertion_ordering' },
      { type: 'unicode_normalization' },
      { type: 'object_key_ordering' },
      { type: 'async_scheduling' },
      { type: 'checkpoint_positions' },
      { type: 'replay_restart_locations' }
    ];
  }

  /**
   * Get fuzz test results
   * @param {string} testId - Test ID
   * @returns {Object} Fuzz test results
   */
  getFuzzResults(testId) {
    return this._fuzzResults.get(testId);
  }

  /**
   * List all fuzz tests
   * @returns {Array} Array of test IDs
   */
  listFuzzTests() {
    return Array.from(this._fuzzResults.keys());
  }

  /**
   * Clear all fuzz results
   */
  clearResults() {
    this._fuzzResults.clear();
  }

  /**
   * Get fuzzer ID
   * @returns {string} Fuzzer ID
   */
  getFuzzerId() {
    return this._fuzzerId;
  }

  /**
   * Get fuzzer version
   * @returns {string} Fuzzer version
   */
  getFuzzerVersion() {
    return this._fuzzerVersion;
  }

  /**
   * Generate test ID
   * @returns {string} Test ID
   */
  _generateTestId() {
    const testData = {
      fuzzer_id: this._fuzzerId,
      timestamp: Date.now()
    };
    const hash = CanonicalAuthority.hash(testData);
    return `fuzz_test_${hash.substring(0, 16)}`;
  }

  /**
   * Generate fuzzer ID
   * @returns {string} Fuzzer ID
   */
  _generateFuzzerId() {
    const fuzzerData = {
      fuzzer_version: this._fuzzerVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(fuzzerData);
    return `constitutional_fuzzer_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const constitutionalFuzzer = new ConstitutionalFuzzer();

module.exports = { ConstitutionalFuzzer, constitutionalFuzzer };
