/**
 * Yjs CRDT Merger Authority
 * 
 * Ω.93.8 — Yjs Integration
 * 
 * Mine CRDT merge algorithms, import only deterministic merge semantics.
 * 
 * Goals:
 * - Mine CRDT merge algorithms from Yjs
 * - Import only deterministic merge semantics
 * - Apply to constitutional object merging
 */

const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { deterministicIdAuthority } = require('./deterministic_id_authority');
const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');

class YjsCRDTMerger {
  constructor(postgresPool) {
    this._postgres = postgresPool;
    this._mergeAlgorithms = new Map(); // algorithm_id → algorithm
    this._mergeSemantics = new Map(); // type → merge semantics
  }

  /**
   * Initialize Yjs CRDT merger
   */
  async initialize() {
    console.log('[YjsCRDTMerger] Initializing Yjs CRDT merger');

    // Load merge algorithms
    await this._loadMergeAlgorithms();

    // Load merge semantics
    await this._loadMergeSemantics();

    console.log('[YjsCRDTMerger] Yjs CRDT merger initialized');
  }

  /**
   * Load merge algorithms
   */
  async _loadMergeAlgorithms() {
    try {
      const result = await this._postgres.query(`
        SELECT algorithm_id, algorithm_data
        FROM crdt_merge_algorithms
      `);

      for (const row of result.rows) {
        this._mergeAlgorithms.set(row.algorithm_id, row.algorithm_data);
      }

      // Load default algorithms if none exist
      if (this._mergeAlgorithms.size === 0) {
        await this._loadDefaultMergeAlgorithms();
      }

      console.log(`[YjsCRDTMerger] Loaded ${this._mergeAlgorithms.size} merge algorithms`);
    } catch (error) {
      console.error('[YjsCRDTMerger] Failed to load merge algorithms:', error.message);
    }
  }

  /**
   * Load merge semantics
   */
  async _loadMergeSemantics() {
    try {
      const result = await this._postgres.query(`
        SELECT type, semantics_data
        FROM crdt_merge_semantics
      `);

      for (const row of result.rows) {
        this._mergeSemantics.set(row.type, row.semantics_data);
      }

      // Load default semantics if none exist
      if (this._mergeSemantics.size === 0) {
        await this._loadDefaultMergeSemantics();
      }

      console.log(`[YjsCRDTMerger] Loaded ${this._mergeSemantics.size} merge semantics`);
    } catch (error) {
      console.error('[YjsCRDTMerger] Failed to load merge semantics:', error.message);
    }
  }

  /**
   * Load default merge algorithms
   */
  async _loadDefaultMergeAlgorithms() {
    const defaultAlgorithms = [
      {
        algorithm_id: 'last_write_wins',
        name: 'Last Write Wins (LWW)',
        description: 'Last write wins merge algorithm',
        deterministic: true,
        implementation: this._getLastWriteWinsImplementation(),
      },
      {
        algorithm_id: 'observed_removed_set',
        name: 'Observed Removed Set (ORS)',
        description: 'Observed removed set merge algorithm',
        deterministic: true,
        implementation: this._getObservedRemovedSetImplementation(),
      },
      {
        algorithm_id: 'sequence_merge',
        name: 'Sequence Merge',
        description: 'Deterministic sequence merge algorithm',
        deterministic: true,
        implementation: this._getSequenceMergeImplementation(),
      },
    ];

    for (const algorithm of defaultAlgorithms) {
      this._mergeAlgorithms.set(algorithm.algorithm_id, algorithm);
      await this._persistMergeAlgorithm(algorithm.algorithm_id, algorithm);
    }

    console.log('[YjsCRDTMerger] Loaded default merge algorithms');
  }

  /**
   * Load default merge semantics
   */
  async _loadDefaultMergeSemantics() {
    const defaultSemantics = [
      {
        type: 'map',
        algorithm: 'last_write_wins',
        description: 'Map type uses last write wins',
      },
      {
        type: 'set',
        algorithm: 'observed_removed_set',
        description: 'Set type uses observed removed set',
      },
      {
        type: 'array',
        algorithm: 'sequence_merge',
        description: 'Array type uses sequence merge',
      },
      {
        type: 'text',
        algorithm: 'sequence_merge',
        description: 'Text type uses sequence merge',
      },
    ];

    for (const semantics of defaultSemantics) {
      this._mergeSemantics.set(semantics.type, semantics);
      await this._persistMergeSemantics(semantics.type, semantics);
    }

    console.log('[YjsCRDTMerger] Loaded default merge semantics');
  }

  /**
   * Get last write wins implementation
   */
  _getLastWriteWinsImplementation() {
    return {
      merge: (left, right) => {
        // Last write wins based on timestamp
        if (left.timestamp > right.timestamp) {
          return left;
        } else if (right.timestamp > left.timestamp) {
          return right;
        } else {
          // Tie-breaker: use deterministic ID
          return left.id > right.id ? left : right;
        }
      },
    };
  }

  /**
   * Get observed removed set implementation
   */
  _getObservedRemovedSetImplementation() {
    return {
      merge: (left, right) => {
        const merged = new Set();
        
        // Add all elements from left that are not removed
        for (const element of left.added) {
          if (!left.removed.has(element)) {
            merged.add(element);
          }
        }
        
        // Add all elements from right that are not removed
        for (const element of right.added) {
          if (!right.removed.has(element)) {
            merged.add(element);
          }
        }
        
        return {
          added: merged,
          removed: new Set([...left.removed, ...right.removed]),
        };
      },
    };
  }

  /**
   * Get sequence merge implementation
   */
  _getSequenceMergeImplementation() {
    return {
      merge: (left, right) => {
        // Deterministic sequence merge using canonical ordering
        const merged = [];
        const leftIndex = new Map();
        const rightIndex = new Map();
        
        // Build indices
        left.forEach((item, i) => leftIndex.set(item.id, i));
        right.forEach((item, i) => rightIndex.set(item.id, i));
        
        // Merge using deterministic rules
        const allItems = [...left, ...right];
        const seen = new Set();
        
        for (const item of allItems) {
          if (seen.has(item.id)) {
            continue;
          }
          seen.add(item.id);
          
          const leftPos = leftIndex.get(item.id);
          const rightPos = rightIndex.get(item.id);
          
          if (leftPos !== undefined && rightPos !== undefined) {
            // Item exists in both, use higher timestamp
            const leftItem = left[leftPos];
            const rightItem = right[rightPos];
            merged.push(leftItem.timestamp > rightItem.timestamp ? leftItem : rightItem);
          } else if (leftPos !== undefined) {
            merged.push(left[leftPos]);
          } else {
            merged.push(right[rightPos]);
          }
        }
        
        return merged;
      },
    };
  }

  /**
   * Merge constitutional objects using CRDT semantics
   * 
   * @param {Object} left - Left constitutional object
   * @param {Object} right - Right constitutional object
   * @returns {Object} Merged constitutional object
   */
  async mergeConstitutionalObjects(left, right) {
    console.log(`[YjsCRDTMerger] Merging constitutional objects ${left.id} and ${right.id}`);

    const mergedId = deterministicIdAuthority.generateIdFromObject({
      left_id: left.id,
      right_id: right.id,
      timestamp: constitutionalTimeAuthority.now(),
    });

    // Determine merge semantics based on object type
    const semantics = this._mergeSemantics.get(left.kind);
    if (!semantics) {
      // Default to last write wins
      const algorithm = this._mergeAlgorithms.get('last_write_wins');
      return this._applyMergeAlgorithm(algorithm, left, right);
    }

    // Apply merge algorithm
    const algorithm = this._mergeAlgorithms.get(semantics.algorithm);
    const merged = this._applyMergeAlgorithm(algorithm, left, right);

    // Set merged ID
    merged.id = mergedId;
    merged.canonical_hash = CanonicalAuthority.hash(merged);

    console.log(`[YjsCRDTMerger] Merged constitutional objects into ${mergedId}`);
    return merged;
  }

  /**
   * Apply merge algorithm
   */
  _applyMergeAlgorithm(algorithm, left, right) {
    const implementation = algorithm.implementation;
    
    if (algorithm.algorithm_id === 'last_write_wins') {
      return implementation.merge(left, right);
    } else if (algorithm.algorithm_id === 'observed_removed_set') {
      return implementation.merge(left, right);
    } else if (algorithm.algorithm_id === 'sequence_merge') {
      return implementation.merge(left, right);
    }

    // Default: return left
    return left;
  }

  /**
   * Verify merge determinism
   * 
   * @param {Object} left - Left object
   * @param {Object} right - Right object
   * @returns {Object} Determinism verification
   */
  async verifyMergeDeterminism(left, right) {
    console.log(`[YjsCRDTMerger] Verifying merge determinism for ${left.id} and ${right.id}`);

    // Merge multiple times and verify results are identical
    const iterations = 10;
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const merged = await this.mergeConstitutionalObjects(left, right);
      results.push(merged.canonical_hash);
    }

    const allIdentical = results.every(hash => hash === results[0]);

    return {
      deterministic: allIdentical,
      iterations: iterations,
      hash: results[0],
    };
  }

  /**
   * Persist merge algorithm
   */
  async _persistMergeAlgorithm(algorithmId, algorithm) {
    try {
      await this._postgres.query(`
        INSERT INTO crdt_merge_algorithms (algorithm_id, algorithm_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (algorithm_id) DO UPDATE SET
          algorithm_data = $2,
          updated_at = NOW()
      `, [algorithmId, JSON.stringify(algorithm)]);
    } catch (error) {
      console.error(`[YjsCRDTMerger] Failed to persist merge algorithm ${algorithmId}:`, error.message);
    }
  }

  /**
   * Persist merge semantics
   */
  async _persistMergeSemantics(type, semantics) {
    try {
      await this._postgres.query(`
        INSERT INTO crdt_merge_semantics (type, semantics_data, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (type) DO UPDATE SET
          semantics_data = $2,
          updated_at = NOW()
      `, [type, JSON.stringify(semantics)]);
    } catch (error) {
      console.error(`[YjsCRDTMerger] Failed to persist merge semantics for ${type}:`, error.message);
    }
  }

  /**
   * Get merge algorithm
   */
  getMergeAlgorithm(algorithmId) {
    return this._mergeAlgorithms.get(algorithmId);
  }

  /**
   * Get merge semantics
   */
  getMergeSemantics(type) {
    return this._mergeSemantics.get(type);
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      total_algorithms: this._mergeAlgorithms.size,
      total_semantics: this._mergeSemantics.size,
      deterministic_algorithms: Array.from(this._mergeAlgorithms.values()).filter(a => a.deterministic).length,
    };
  }
}

module.exports = { YjsCRDTMerger };
