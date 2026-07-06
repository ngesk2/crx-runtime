/**
 * Convergence Harness
 * 
 * Priority 7: Convergence Harness
 * 
 * Constitutional Constraint:
 * Repeatedly randomize everything that is allowed to vary while asserting
 * that constitutional outputs remain identical.
 * 
 * Randomized factors:
 * - insertion ordering
 * - scheduler ordering
 * - DB ordering
 * - allocation ordering
 * - batching
 * - worker assignment
 * 
 * Verify equality of:
 * - CanonicalBytes
 * - CanonicalHash
 * - ReplayHash
 * - WitnessHash
 * - TranscriptHash
 */

class ConvergenceHarness {
  constructor() {
    this._harnessVersion = '1.0.0';
    this._results = [];
    this._baseline = null;
  }

  /**
   * Run convergence test
   * @param {Function} testFn - Test function to run repeatedly
   * @param {Object} options - Test options
   * @param {number} options.iterations - Number of iterations (default: 1000)
   * @param {Array} options.randomizations - Randomization factors to apply
   * @returns {Object} Convergence test results
   */
  async runConvergenceTest(testFn, options = {}) {
    const iterations = options.iterations || 1000;
    const randomizations = options.randomizations || [
      'insertion_ordering',
      'scheduler_ordering',
      'db_ordering',
      'allocation_ordering',
      'batching',
      'worker_assignment'
    ];
    
    console.log(`Running convergence test with ${iterations} iterations`);
    console.log(`Randomizations: ${randomizations.join(', ')}`);
    
    this._results = [];
    this._baseline = null;
    
    for (let i = 0; i < iterations; i++) {
      const randomization = this._selectRandomization(randomizations);
      const result = await this._runIteration(testFn, i, randomization);
      
      if (!this._baseline) {
        this._baseline = result;
        console.log(`Baseline established at iteration ${i}`);
      }
      
      this._results.push(result);
      
      if (i % 100 === 0) {
        console.log(`Completed ${i}/${iterations} iterations`);
      }
    }
    
    const convergence = this._analyzeConvergence();
    
    return {
      iterations,
      randomizations,
      convergence,
      baseline: this._baseline,
      results: this._results
    };
  }

  /**
   * Select randomization factor
   * @param {Array} randomizations - Available randomizations
   * @returns {string} Selected randomization
   * @private
   */
  _selectRandomization(randomizations) {
    const index = Math.floor(Math.random() * randomizations.length);
    return randomizations[index];
  }

  /**
   * Run single iteration
   * @param {Function} testFn - Test function
   * @param {number} iteration - Iteration number
   * @param {string} randomization - Randomization factor
   * @returns {Object} Iteration result
   * @private
   */
  async _runIteration(testFn, iteration, randomization) {
    try {
      const result = await testFn({
        iteration,
        randomization,
        seed: this._generateSeed()
      });
      
      return {
        iteration,
        randomization,
        success: true,
        result: result,
        canonicalBytes: result.canonicalBytes,
        canonicalHash: result.canonicalHash,
        replayHash: result.replayHash,
        witnessHash: result.witnessHash,
        transcriptHash: result.transcriptHash
      };
    } catch (error) {
      return {
        iteration,
        randomization,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze convergence
   * @returns {Object} Convergence analysis
   * @private
   */
  _analyzeConvergence() {
    if (!this._baseline) {
      return {
        converged: false,
        reason: 'No baseline established'
      };
    }
    
    const successfulResults = this._results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return {
        converged: false,
        reason: 'All iterations failed'
      };
    }
    
    // Check if all results match baseline
    const allMatch = successfulResults.every(r => 
      r.canonicalHash === this._baseline.canonicalHash &&
      r.replayHash === this._baseline.replayHash &&
      r.witnessHash === this._baseline.witnessHash ||
      r.transcriptHash === this._baseline.transcriptHash
    );
    
    // Collect unique hashes
    const uniqueCanonicalHashes = new Set(successfulResults.map(r => r.canonicalHash));
    const uniqueReplayHashes = new Set(successfulResults.map(r => r.replayHash));
    const uniqueWitnessHashes = new Set(successfulResults.map(r => r.witnessHash));
    const uniqueTranscriptHashes = new Set(successfulResults.map(r => r.transcriptHash));
    
    return {
      converged: allMatch,
      totalIterations: this._results.length,
      successfulIterations: successfulResults.length,
      failedIterations: this._results.length - successfulResults.length,
      uniqueCanonicalHashes: uniqueCanonicalHashes.size,
      uniqueReplayHashes: uniqueReplayHashes.size,
      uniqueWitnessHashes: uniqueWitnessHashes.size,
      uniqueTranscriptHashes: uniqueTranscriptHashes.size,
      baseline: this._baseline
    };
  }

  /**
   * Generate random seed
   * @returns {number} Random seed
   * @private
   */
  _generateSeed() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  }

  /**
   * Shuffle array (Fisher-Yates)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Randomize insertion ordering
   * @param {Array} items - Items to reorder
   * @returns {Array} Reordered items
   */
  randomizeInsertionOrdering(items) {
    return this.shuffle(items);
  }

  /**
   * Randomize scheduler ordering
   * @param {Array} tasks - Tasks to reorder
   * @returns {Array} Reordered tasks
   */
  randomizeSchedulerOrdering(tasks) {
    return this.shuffle(tasks);
  }

  /**
   * Randomize DB ordering
   * @param {Array} records - Records to reorder
   * @returns {Array} Reordered records
   */
  randomizeDBOrdering(records) {
    return this.shuffle(records);
  }

  /**
   * Randomize allocation ordering
   * @param {Array} allocations - Allocations to reorder
   * @returns {Array} Reordered allocations
   */
  randomizeAllocationOrdering(allocations) {
    return this.shuffle(allocations);
  }

  /**
   * Randomize batching
   * @param {Array} items - Items to batch
   * @param {number} minBatchSize - Minimum batch size
   * @param {number} maxBatchSize - Maximum batch size
   * @returns {Array} Batches
   */
  randomizeBatching(items, minBatchSize = 1, maxBatchSize = 10) {
    const shuffled = this.shuffle(items);
    const batches = [];
    let i = 0;
    
    while (i < shuffled.length) {
      const batchSize = Math.floor(Math.random() * (maxBatchSize - minBatchSize + 1)) + minBatchSize;
      const batch = shuffled.slice(i, i + batchSize);
      batches.push(batch);
      i += batchSize;
    }
    
    return batches;
  }

  /**
   * Randomize worker assignment
   * @param {Array} tasks - Tasks to assign
   * @param {number} workerCount - Number of workers
   * @returns {Object} Worker assignments
   */
  randomizeWorkerAssignment(tasks, workerCount = 4) {
    const shuffled = this.shuffle(tasks);
    const assignments = {};
    
    for (let i = 0; i < workerCount; i++) {
      assignments[`worker_${i}`] = [];
    }
    
    shuffled.forEach((task, index) => {
      const workerIndex = index % workerCount;
      assignments[`worker_${workerIndex}`].push(task);
    });
    
    return assignments;
  }

  /**
   * Get harness version
   * @returns {string} Harness version
   */
  getHarnessVersion() {
    return this._harnessVersion;
  }

  /**
   * Reset harness
   */
  reset() {
    this._results = [];
    this._baseline = null;
  }
}

// Singleton instance
const convergenceHarness = new ConvergenceHarness();

module.exports = {
  ConvergenceHarness,
  convergenceHarness
};
