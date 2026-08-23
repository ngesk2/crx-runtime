/**
 * Constitutional Record
 * 
 * Phase 2.15 — Constitutional Root Object
 * 
 * Dedicated immutable type for constitutional records.
 * Everything downstream consumes only this object.
 */

class ConstitutionalRecord {
  constructor(params) {
    this.constitutional_version = params.constitutional_version || '2.0.0';
    this.constitutional_hash = params.constitutional_hash;
    this.parent_constitutional_hash = params.parent_constitutional_hash || null;
    this.replay_hash = params.replay_hash;
    this.witness_hash = params.witness_hash;
    this.generator_hash = params.generator_hash;
    this.serializer_hash = params.serializer_hash;
    this.manifest_hash = params.manifest_hash;
    this.ir_hash = params.ir_hash;
    this.adapter_source_hash = params.adapter_source_hash;
    this.adapter_hash = params.adapter_hash;
    this.generator_witness_hash = params.generator_witness_hash;
    this.adapter_witness_hash = params.adapter_witness_hash;
    this.constitutional_evaluation_hash = params.constitutional_evaluation_hash;
    this.root_constitutional_hash = params.root_constitutional_hash;
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
    this.created_at = params.created_at || constitutionalTimeAuthority.nowAsMillis();
    this.frozen = true;

    // Constitutional payload (without metadata)
    this.payload = params.payload;

    // Storage metadata (not part of constitutional identity)
    this.storage_metadata = {
      stored_at: null,
      storage_location: null,
      storage_version: null
    };

    // Performance telemetry (not part of constitutional identity)
    this.performance_telemetry = params.performance_telemetry || null;

    // Deep freeze the record
    this._freeze();
  }

  /**
   * Deep freeze the record
   */
  _freeze() {
    const freezeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          freezeObject(obj[key]);
        }
      }

      return Object.freeze(obj);
    };

    freezeObject(this);
  }

  /**
   * Get constitutional hash
   * @returns {string} Constitutional hash
   */
  getConstitutionalHash() {
    return this.constitutional_hash;
  }

  /**
   * Get root constitutional hash
   * @returns {string} Root constitutional hash
   */
  getRootConstitutionalHash() {
    return this.root_constitutional_hash;
  }

  /**
   * Check if record is frozen
   * @returns {boolean} True if frozen
   */
  isFrozen() {
    return this.frozen;
  }

  /**
   * Get storage metadata
   * @returns {Object} Storage metadata
   */
  getStorageMetadata() {
    return this.storage_metadata;
  }

  /**
   * Set storage metadata
   * @param {Object} metadata - Storage metadata
   */
  setStorageMetadata(metadata) {
    if (this.frozen) {
      throw new Error('Cannot modify frozen constitutional record');
    }
    this.storage_metadata = { ...metadata };
  }

  /**
   * Get performance telemetry
   * @returns {Object} Performance telemetry
   */
  getPerformanceTelemetry() {
    return this.performance_telemetry;
  }

  /**
   * Verify constitutional integrity
   * @param {string} expectedHash - Expected root hash
   * @returns {boolean} True if valid
   */
  verifyIntegrity(expectedHash) {
    return this.root_constitutional_hash === expectedHash;
  }

  /**
   * To JSON (excludes storage metadata and performance telemetry)
   * @returns {Object} JSON representation
   */
  toJSON() {
    const json = {
      constitutional_version: this.constitutional_version,
      constitutional_hash: this.constitutional_hash,
      parent_constitutional_hash: this.parent_constitutional_hash,
      replay_hash: this.replay_hash,
      witness_hash: this.witness_hash,
      generator_hash: this.generator_hash,
      serializer_hash: this.serializer_hash,
      manifest_hash: this.manifest_hash,
      ir_hash: this.ir_hash,
      adapter_source_hash: this.adapter_source_hash,
      adapter_hash: this.adapter_hash,
      generator_witness_hash: this.generator_witness_hash,
      adapter_witness_hash: this.adapter_witness_hash,
      constitutional_evaluation_hash: this.constitutional_evaluation_hash,
      root_constitutional_hash: this.root_constitutional_hash,
      created_at: this.created_at,
      frozen: this.frozen,
      payload: this.payload
    };

    return json;
  }
}

module.exports = { ConstitutionalRecord };
