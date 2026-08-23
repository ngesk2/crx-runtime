/**
 * Pipeline Witness
 * 
 * Milestone 10 — Pipeline Witness
 * 
 * Constitutional Constraint: Merkle-style certification.
 * 
 * Levels:
 * Object Witness
 *       ↓
 * Stage Witness
 *       ↓
 * Pipeline Witness Root
 *       ↓
 * Pipeline Certificate
 */

const { CanonicalBytes, CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

/**
 * Object Witness
 * 
 * Constitutional witness for a single object
 */
class ObjectWitness {
  constructor(object) {
    this._object = object;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build object witness
   * @returns {Object} Object witness
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Object witness is the canonical hash of the object
    const canonicalData = {
      object_id: this._object.id,
      object_kind: this._object.kind,
      object_canonical_hash: this._object.canonical_hash,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'ObjectWitness');

    // Build lineage
    this._lineage = {
      source_id: this._object.id,
      derivation_path: ['Object', 'ObjectWitness'],
      provenance_chain: [this._object.id],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'ObjectWitness',
      authority: 'PipelineWitness',
      identity: {
        namespace: 'witness',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PipelineWitness',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._object.id,
          relation_type: 'witnesses',
          strength: 1.0,
          metadata: { kind: 'object' },
        },
      ],
      metadata: {
        object_id: this._object.id,
        object_kind: this._object.kind,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

/**
 * Stage Witness
 * 
 * Constitutional witness for a pipeline stage
 */
class StageWitness {
  constructor(stageName, objectWitnesses) {
    this._stageName = stageName;
    this._objectWitnesses = objectWitnesses;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build stage witness
   * @returns {Object} Stage witness
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Sort object witnesses deterministically
    const sortedWitnesses = [...this._objectWitnesses].sort((a, b) => a.id.localeCompare(b.id));

    // Build Merkle tree from object witnesses
    const witnessHashes = sortedWitnesses.map(w => w.canonical_hash);
    const merkleRoot = this._calculateMerkleRoot(witnessHashes);

    // Extract canonical fields
    const canonicalData = {
      stage_name: this._stageName,
      object_count: sortedWitnesses.length,
      object_witness_hashes: witnessHashes,
      merkle_root: merkleRoot,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'StageWitness');

    // Build lineage
    this._lineage = {
      source_id: null,
      derivation_path: ['PipelineStage', 'StageWitness'],
      provenance_chain: sortedWitnesses.map(w => w.id),
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'StageWitness',
      authority: 'PipelineWitness',
      identity: {
        namespace: 'witness',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PipelineWitness',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: sortedWitnesses.map(w => ({
        target_id: w.id,
        relation_type: 'contains',
        strength: 1.0,
        metadata: { kind: 'objectwitness' },
      })),
      metadata: {
        stage_name: this._stageName,
        object_count: sortedWitnesses.length,
        merkle_root: merkleRoot,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }

  /**
   * Calculate Merkle root from hashes
   * @param {Array} hashes - Hashes
   * @returns {string} Merkle root
   */
  _calculateMerkleRoot(hashes) {
    if (hashes.length === 0) {
      return CanonicalAuthority.hashBytes(Buffer.from(''));
    }

    if (hashes.length === 1) {
      return hashes[0];
    }

    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

        const combined = Buffer.concat([
          Buffer.from(left),
          Buffer.from(right),
        ]);

        const hash = CanonicalAuthority.hashBytes(combined);
        nextLevel.push(hash);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }
}

/**
 * Pipeline Witness Root
 * 
 * Constitutional witness for the entire pipeline
 */
class PipelineWitnessRoot {
  constructor(stageWitnesses) {
    this._stageWitnesses = stageWitnesses;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build pipeline witness root
   * @returns {Object} Pipeline witness root
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Sort stage witnesses deterministically by stage name
    const sortedStageWitnesses = [...this._stageWitnesses].sort((a, b) => 
      a.payload.stage_name.localeCompare(b.payload.stage_name)
    );

    // Build Merkle tree from stage witnesses
    const stageHashes = sortedStageWitnesses.map(s => s.canonical_hash);
    const merkleRoot = this._calculateMerkleRoot(stageHashes);

    // Extract canonical fields
    const canonicalData = {
      stage_count: sortedStageWitnesses.length,
      stage_witness_hashes: stageHashes,
      stage_names: sortedStageWitnesses.map(s => s.payload.stage_name),
      merkle_root: merkleRoot,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'PipelineWitnessRoot');

    // Build lineage
    this._lineage = {
      source_id: null,
      derivation_path: ['Pipeline', 'PipelineWitnessRoot'],
      provenance_chain: sortedStageWitnesses.map(s => s.id),
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'PipelineWitnessRoot',
      authority: 'PipelineWitness',
      identity: {
        namespace: 'witness',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PipelineWitness',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: sortedStageWitnesses.map(s => ({
        target_id: s.id,
        relation_type: 'contains',
        strength: 1.0,
        metadata: { kind: 'stagewitness' },
      })),
      metadata: {
        stage_count: sortedStageWitnesses.length,
        merkle_root: merkleRoot,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }

  /**
   * Calculate Merkle root from hashes
   * @param {Array} hashes - Hashes
   * @returns {string} Merkle root
   */
  _calculateMerkleRoot(hashes) {
    if (hashes.length === 0) {
      return CanonicalAuthority.hashBytes(Buffer.from(''));
    }

    if (hashes.length === 1) {
      return hashes[0];
    }

    let currentLevel = [...hashes];

    while (currentLevel.length > 1) {
      const nextLevel = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

        const combined = Buffer.concat([
          Buffer.from(left),
          Buffer.from(right),
        ]);

        const hash = CanonicalAuthority.hashBytes(combined);
        nextLevel.push(hash);
      }

      currentLevel = nextLevel;
    }

    return currentLevel[0];
  }
}

/**
 * Pipeline Certificate
 * 
 * Constitutional certificate for the entire pipeline
 */
class PipelineCertificate {
  constructor(pipelineWitnessRoot, stageRoots) {
    this._pipelineWitnessRoot = pipelineWitnessRoot;
    this._stageRoots = stageRoots;
    this._canonicalBytes = null;
    this._canonicalHash = null;
    this._id = null;
    this._lineage = null;
    this._witness = null;
    this._certificate = null;
  }

  /**
   * Build pipeline certificate
   * @returns {Object} Pipeline certificate
   */
  build() {
    const timestamp = constitutionalTimeAuthority.now();

    // Extract canonical fields
    const canonicalData = {
      pipeline_witness_root: this._pipelineWitnessRoot.payload.merkle_root,
      stage_roots: this._stageRoots,
      pipeline_hash: this._pipelineWitnessRoot.canonical_hash,
    };

    // Generate canonical bytes
    this._canonicalBytes = CanonicalBytes.serialize(canonicalData);
    this._canonicalHash = CanonicalAuthority.hashBytes(this._canonicalBytes);
    this._id = identityAuthority.generateFromCanonicalHash(this._canonicalBytes, 'PipelineCertificate');

    // Build lineage
    this._lineage = {
      source_id: this._pipelineWitnessRoot.id,
      derivation_path: ['PipelineWitnessRoot', 'PipelineCertificate'],
      provenance_chain: [this._pipelineWitnessRoot.id],
    };

    // Build constitutional object
    const constitutionalObject = {
      id: this._id,
      kind: 'PipelineCertificate',
      authority: 'PipelineWitness',
      identity: {
        namespace: 'certificate',
        version: 'v1',
        created_at: timestamp,
        created_by: 'PipelineWitness',
      },
      canonical_hash: this._canonicalHash,
      canonical_bytes: this._canonicalBytes,
      lineage: this._lineage,
      health: 'healthy',
      confidence: 1.0,
      relationships: [
        {
          target_id: this._pipelineWitnessRoot.id,
          relation_type: 'certifies',
          strength: 1.0,
          metadata: { kind: 'pipelinewitnessroot' },
        },
      ],
      metadata: {
        pipeline_witness_root_id: this._pipelineWitnessRoot.id,
        timestamp,
      },
      payload: canonicalData,
      schema_version: '1.0.0',
      constitution_version: '1.0.0',
      witness: this._witness,
      certificate: this._certificate,
    };

    return constitutionalObject;
  }
}

module.exports = {
  ObjectWitness,
  StageWitness,
  PipelineWitnessRoot,
  PipelineCertificate,
};
