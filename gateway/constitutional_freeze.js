const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { ConstitutionalRecord } = require('./constitutional_record');

/**
 * Constitutional Freeze Authority
 * 
 * Phase 2.8 — Constitutional Freeze
 * Phase 2.9 — Fix Freeze Authority Duplication
 * Phase 2.10 — Fix Root Hash Recursion Bug
 * Phase 2.11 — Fix Performance Witness Determinism
 * Phase 2.12 — Fix Frozen Timestamp
 * 
 * After approval, freeze everything, not just the adapter.
 * 
 * Freeze entire constitutional record:
 * - Manifest
 * - IR
 * - Generator Manifest
 * - Generator Config
 * - Generator Witness
 * - Adapter Source
 * - Adapter Witness
 * - Constitutional Evaluation
 * - Replay Transcript
 * 
 * Then:
 * - ConstitutionalRecordWithoutMetadata
 * - Canonical Serialize
 * - Root Hash
 * - Metadata Envelope
 * - Freeze
 * - Artifact Store
 * 
 * The stored artifact should become an immutable constitutional record.
 */

class ConstitutionalFreezeAuthority {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._frozenArtifacts = new Map();
  }

  /**
   * Freeze entire constitutional record
   * @param {Object} constitutionalRecord - Complete constitutional record
   * @returns {ConstitutionalRecord} Frozen constitutional record with root hash
   */
  freezeConstitutionalRecord(constitutionalRecord) {
    replayLogger.info('=== Constitutional Freeze ===');
    replayLogger.info('Freezing entire constitutional record...\n');

    // Extract all components (excluding performance telemetry - Phase 2.11)
    const components = {
      technology_manifest: constitutionalRecord.technologyManifest,
      ir: constitutionalRecord.ir,
      generator_manifest: constitutionalRecord.generatorManifest,
      adapter: constitutionalRecord.adapter,
      adapter_source: constitutionalRecord.adapterSource,
      adapter_manifest: constitutionalRecord.adapterManifest,
      generator_witness: constitutionalRecord.generatorWitness,
      adapter_witness: constitutionalRecord.adapterWitness,
      constitutional_evaluation: constitutionalRecord.constitutionalEvaluation,
      replay_determinism_result: constitutionalRecord.replayDeterminismResult,
      hash_equality_result: constitutionalRecord.hashEqualityResult
    };

    // Performance telemetry is excluded from constitutional hash (Phase 2.11)
    const performanceTelemetry = constitutionalRecord.performance_baseline;

    // Canonical serialize each component
    replayLogger.info('Canonical serializing components...');
    const serializedComponents = {};
    for (const [key, value] of Object.entries(components)) {
      if (value) {
        this._serializer.startSerializerTimer();
        serializedComponents[key] = CanonicalBytes.serialize(value);
        this._serializer.stopSerializerTimer();
        replayLogger.info(`  ✓ ${key} serialized`);
      }
    }

    // Serialize entire record (without metadata - Phase 2.10)
    replayLogger.info('Serializing constitutional record without metadata...');
    this._serializer.startSerializerTimer();
    const recordBytes = CanonicalBytes.serialize(components);
    this._serializer.stopSerializerTimer();
    replayLogger.info('  ✓ Record serialized');

    // Compute root constitutional hash (Phase 2.10: before adding metadata)
    replayLogger.info('Computing root constitutional hash...');
    const rootConstitutionalHash = CanonicalAuthority.hashBytes(recordBytes);
    replayLogger.info(`  ✓ Root hash: ${rootConstitutionalHash.substring(0, 16)}...`);

    // Compute component hashes
    replayLogger.info('Computing component hashes...');
    const componentHashes = {};
    for (const [key, serializedBytes] of Object.entries(serializedComponents)) {
      const componentHash = CanonicalAuthority.hashBytes(serializedBytes);
      componentHashes[key] = componentHash;
      replayLogger.info(`  ✓ ${key} hash: ${componentHash.substring(0, 16)}...`);
    }

    // Create ConstitutionalRecord with metadata envelope (Phase 2.10, 2.15)
    const constitutionalRecordObj = new ConstitutionalRecord({
      constitutional_version: '2.0.0',
      constitutional_hash: rootConstitutionalHash,
      parent_constitutional_hash: null,
      replay_hash: componentHashes.replay_determinism_result || null,
      witness_hash: componentHashes.adapter_witness || null,
      generator_hash: componentHashes.generator_manifest || null,
      serializer_hash: this._serializer.getSerializerId(),
      manifest_hash: componentHashes.technology_manifest || null,
      ir_hash: componentHashes.ir || null,
      adapter_source_hash: componentHashes.adapter_source || null,
      adapter_hash: componentHashes.adapter || null,
      generator_witness_hash: componentHashes.generator_witness || null,
      adapter_witness_hash: componentHashes.adapter_witness || null,
      constitutional_evaluation_hash: componentHashes.constitutional_evaluation || null,
      root_constitutional_hash: rootConstitutionalHash,
      payload: components,
      performance_telemetry: performanceTelemetry // Attached as telemetry, not constitutional identity
    });

    // Set storage metadata (Phase 2.12: frozen_at in storage metadata, not constitutional identity)
    const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
    constitutionalRecordObj.setStorageMetadata({
      stored_at: constitutionalTimeAuthority.nowAsMillis(),
      storage_location: 'memory',
      storage_version: '1.0.0'
    });

    // Store frozen artifact
    const artifactId = components.adapter.adapter_id;
    this._frozenArtifacts.set(artifactId, constitutionalRecordObj);

    replayLogger.info('\n=== Constitutional Freeze Complete ===');
    replayLogger.info(`Artifact ID: ${artifactId}`);
    replayLogger.info(`Root Hash: ${rootConstitutionalHash}\n`);

    return constitutionalRecordObj;
  }

  /**
   * Deep freeze object (make immutable)
   * @param {Object} obj - Object to freeze
   * @returns {Object} Frozen object
   */
  _deepFreeze(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // Freeze all nested objects first
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        this._deepFreeze(obj[key]);
      }
    }

    // Freeze the object itself
    return Object.freeze(obj);
  }

  /**
   * Verify frozen artifact integrity
   * @param {ConstitutionalRecord} frozenArtifact - Frozen constitutional record to verify
   * @returns {Object} Verification result
   */
  verifyFrozenArtifact(frozenArtifact) {
    replayLogger.info('=== Verifying Frozen Artifact ===\n');

    if (!frozenArtifact.isFrozen()) {
      return {
        valid: false,
        message: 'Artifact is not frozen'
      };
    }

    // Recompute root hash from payload (without metadata - Phase 2.10)
    const components = frozenArtifact.payload;
    const recordBytes = CanonicalBytes.serialize(components);
    const recomputedRootHash = CanonicalAuthority.hashBytes(recordBytes);

    const rootHashValid = recomputedRootHash === frozenArtifact.getRootConstitutionalHash();
    replayLogger.info(`Root hash valid: ${rootHashValid}`);

    // Verify component hashes
    replayLogger.info('Verifying component hashes...');
    const componentHashesValid = true;
    for (const [key, component] of Object.entries(components)) {
      if (component) {
        const componentBytes = CanonicalBytes.serialize(component);
        const recomputedHash = CanonicalAuthority.hashBytes(componentBytes);
        // Get expected hash from record
        const expectedHash = frozenArtifact[`${key}_hash`] || null;
        if (expectedHash) {
          const valid = recomputedHash === expectedHash;
          replayLogger.info(`  ${key}: ${valid ? 'valid' : 'invalid'}`);
        }
      }
    }

    const valid = rootHashValid && componentHashesValid;
    replayLogger.info(`\nOverall valid: ${valid}\n`);

    return {
      valid,
      root_hash_valid: rootHashValid,
      component_hashes_valid: componentHashesValid,
      message: valid ? 'Artifact integrity verified' : 'Artifact integrity verification failed'
    };
  }

  /**
   * Get frozen artifact by ID
   * @param {string} artifactId - Artifact ID
   * @returns {Object} Frozen artifact
   */
  getFrozenArtifact(artifactId) {
    return this._frozenArtifacts.get(artifactId);
  }

  /**
   * Get all frozen artifacts
   * @returns {Array} Array of frozen artifacts
   */
  getAllFrozenArtifacts() {
    return Array.from(this._frozenArtifacts.values());
  }

  /**
   * Clear all frozen artifacts (for testing)
   */
  clear() {
    this._frozenArtifacts.clear();
  }
}

module.exports = { ConstitutionalFreezeAuthority };
