/**
 * Constitutional Verification Authority
 * 
 * Milestone 1 — Single Runtime Gatekeeper
 * 
 * Constitutional Constraint: Every constitutional artifact must pass verification before reaching:
 * - RepositoryStore
 * - Replay
 * - Knowledge extraction
 * - Graph
 * - Ollama
 * - Temporal
 * 
 * Verification Pipeline:
 * verifyArtifact()
 *         │
 *         ▼
 * Canonical Bytes
 * Canonical Hash
 * Identity
 * Authority
 * Lineage
 * Schema Version
 * Constitution Version
 * Witness
 * Certificate
 *         │
 *         ▼
 * PASS or FAIL
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { identityAuthority } = require('./identity_authority');

/**
 * Deterministic failure codes
 * Every failure receives a stable replay code
 */
const CONSTITUTIONAL_FAILURE_CODES = {
  INVALID_BYTES: 'CONSTITUTION_INVALID_BYTES',
  INVALID_HASH: 'CONSTITUTION_INVALID_HASH',
  INVALID_ID: 'CONSTITUTION_INVALID_ID',
  INVALID_WITNESS: 'CONSTITUTION_INVALID_WITNESS',
  INVALID_CERTIFICATE: 'CONSTITUTION_INVALID_CERTIFICATE',
  INVALID_SCHEMA: 'CONSTITUTION_INVALID_SCHEMA',
  INVALID_LINEAGE: 'CONSTITUTION_INVALID_LINEAGE',
  INVALID_AUTHORITY: 'CONSTITUTION_INVALID_AUTHORITY',
  INVALID_VERSION: 'CONSTITUTION_INVALID_VERSION',
  MISSING_FIELD: 'CONSTITUTION_MISSING_FIELD',
};

/**
 * Constitutional Artifact Interface
 * 
 * interface ConstitutionalArtifact {
 *   canonical_bytes: Buffer
 *   canonical_hash: string
 *   id: string
 *   authority: string
 *   lineage: Lineage
 *   schema_version: string
 *   constitution_version: string
 *   witness: Witness
 *   certificate: Certificate
 * }
 */

class ConstitutionalVerificationAuthority {
  constructor() {
    this._constitutionVersion = '1.0.0';
    this._requiredFields = [
      'canonical_bytes',
      'canonical_hash',
      'id',
      'authority',
      'lineage',
      'schema_version',
      'constitution_version',
      'witness',
      'certificate',
    ];
  }

  /**
   * Verify constitutional artifact
   * 
   * @param {Object} artifact - Constitutional artifact to verify
   * @returns {Object} Verification result
   */
  verifyArtifact(artifact) {
    // Check for missing fields
    const missingFields = this._checkRequiredFields(artifact);
    if (missingFields.length > 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.MISSING_FIELD,
        reason: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
      };
    }

    // Verify each constitutional field
    const canonicalBytesResult = this.verifyCanonicalBytes(artifact);
    if (!canonicalBytesResult.valid) {
      return canonicalBytesResult;
    }

    const canonicalHashResult = this.verifyCanonicalHash(artifact);
    if (!canonicalHashResult.valid) {
      return canonicalHashResult;
    }

    const identityResult = this.verifyIdentity(artifact);
    if (!identityResult.valid) {
      return identityResult;
    }

    const authorityResult = this.verifyAuthority(artifact);
    if (!authorityResult.valid) {
      return authorityResult;
    }

    const lineageResult = this.verifyLineage(artifact);
    if (!lineageResult.valid) {
      return lineageResult;
    }

    const schemaVersionResult = this.verifySchemaVersion(artifact);
    if (!schemaVersionResult.valid) {
      return schemaVersionResult;
    }

    const constitutionVersionResult = this.verifyConstitutionVersion(artifact);
    if (!constitutionVersionResult.valid) {
      return constitutionVersionResult;
    }

    const witnessResult = this.verifyWitness(artifact);
    if (!witnessResult.valid) {
      return witnessResult;
    }

    const certificateResult = this.verifyCertificate(artifact);
    if (!certificateResult.valid) {
      return certificateResult;
    }

    return {
      valid: true,
      reason: 'Constitutional artifact verified',
    };
  }

  /**
   * Check for missing required fields
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Array<string>} Missing fields
   */
  _checkRequiredFields(artifact) {
    return this._requiredFields.filter(field => !(field in artifact) || artifact[field] === undefined || artifact[field] === null);
  }

  /**
   * Verify canonical bytes
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyCanonicalBytes(artifact) {
    if (!Buffer.isBuffer(artifact.canonical_bytes)) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_BYTES,
        reason: 'canonical_bytes must be a Buffer',
      };
    }

    if (artifact.canonical_bytes.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_BYTES,
        reason: 'canonical_bytes cannot be empty',
      };
    }

    return { valid: true };
  }

  /**
   * Verify canonical hash
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyCanonicalHash(artifact) {
    if (typeof artifact.canonical_hash !== 'string') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_HASH,
        reason: 'canonical_hash must be a string',
      };
    }

    if (artifact.canonical_hash.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_HASH,
        reason: 'canonical_hash cannot be empty',
      };
    }

    // Verify hash matches canonical bytes
    const computedHash = CanonicalAuthority.hashBytes(artifact.canonical_bytes);
    if (computedHash !== artifact.canonical_hash) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_HASH,
        reason: 'canonical_hash does not match canonical_bytes',
        expected: computedHash,
        actual: artifact.canonical_hash,
      };
    }

    return { valid: true };
  }

  /**
   * Verify identity (ID)
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyIdentity(artifact) {
    if (typeof artifact.id !== 'string') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_ID,
        reason: 'id must be a string',
      };
    }

    if (artifact.id.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_ID,
        reason: 'id cannot be empty',
      };
    }

    // Verify ID matches canonical hash
    const computedId = identityAuthority.generateFromCanonicalHash(artifact.canonical_bytes, artifact.kind || 'object');
    if (computedId !== artifact.id) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_ID,
        reason: 'id does not match canonical_bytes',
        expected: computedId,
        actual: artifact.id,
      };
    }

    return { valid: true };
  }

  /**
   * Verify authority
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyAuthority(artifact) {
    if (typeof artifact.authority !== 'string') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_AUTHORITY,
        reason: 'authority must be a string',
      };
    }

    if (artifact.authority.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_AUTHORITY,
        reason: 'authority cannot be empty',
      };
    }

    // Known authorities (can be extended)
    const knownAuthorities = [
      'CanonicalAuthority',
      'IdentityAuthority',
      'CanonicalObjectAuthority',
      'RepositoryStore',
      'MigrationEngine',
      'AppendOrchestrator',
      'WitnessRecorder',
      'ReplayCertificate',
      'GitHubSnapshot',
      'ReplayAuthority',
    ];

    // Optional: Enforce known authorities only
    // if (!knownAuthorities.includes(artifact.authority)) {
    //   return {
    //     valid: false,
    //     code: CONSTITUTIONAL_FAILURE_CODES.INVALID_AUTHORITY,
    //     reason: `Unknown authority: ${artifact.authority}`,
    //   };
    // }

    return { valid: true };
  }

  /**
   * Verify lineage
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyLineage(artifact) {
    if (!artifact.lineage) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_LINEAGE,
        reason: 'lineage is required',
      };
    }

    if (typeof artifact.lineage !== 'object') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_LINEAGE,
        reason: 'lineage must be an object',
      };
    }

    // Lineage should contain source_id and derivation_path
    if (!artifact.lineage.source_id && !artifact.lineage.derivation_path) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_LINEAGE,
        reason: 'lineage must contain source_id or derivation_path',
      };
    }

    return { valid: true };
  }

  /**
   * Verify schema version
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifySchemaVersion(artifact) {
    if (typeof artifact.schema_version !== 'string') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_SCHEMA,
        reason: 'schema_version must be a string',
      };
    }

    if (artifact.schema_version.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_SCHEMA,
        reason: 'schema_version cannot be empty',
      };
    }

    // Optional: Enforce semantic version format
    // const semverRegex = /^\d+\.\d+\.\d+$/;
    // if (!semverRegex.test(artifact.schema_version)) {
    //   return {
    //     valid: false,
    //     code: CONSTITUTIONAL_FAILURE_CODES.INVALID_SCHEMA,
    //     reason: 'schema_version must be in semantic version format (x.y.z)',
    //   };
    // }

    return { valid: true };
  }

  /**
   * Verify constitution version
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyConstitutionVersion(artifact) {
    if (typeof artifact.constitution_version !== 'string') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_VERSION,
        reason: 'constitution_version must be a string',
      };
    }

    if (artifact.constitution_version.length === 0) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_VERSION,
        reason: 'constitution_version cannot be empty',
      };
    }

    // Optional: Enforce current constitution version
    // if (artifact.constitution_version !== this._constitutionVersion) {
    //   return {
    //     valid: false,
    //     code: CONSTITUTIONAL_FAILURE_CODES.INVALID_VERSION,
    //     reason: `constitution_version mismatch: expected ${this._constitutionVersion}, got ${artifact.constitution_version}`,
    //   };
    // }

    return { valid: true };
  }

  /**
   * Verify witness
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyWitness(artifact) {
    if (!artifact.witness) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_WITNESS,
        reason: 'witness is required',
      };
    }

    if (typeof artifact.witness !== 'object') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_WITNESS,
        reason: 'witness must be an object',
      };
    }

    // Witness should contain canonical_hash
    if (!artifact.witness.canonical_hash) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_WITNESS,
        reason: 'witness must contain canonical_hash',
      };
    }

    return { valid: true };
  }

  /**
   * Verify certificate
   * 
   * @param {Object} artifact - Constitutional artifact
   * @returns {Object} Verification result
   */
  verifyCertificate(artifact) {
    if (!artifact.certificate) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_CERTIFICATE,
        reason: 'certificate is required',
      };
    }

    if (typeof artifact.certificate !== 'object') {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_CERTIFICATE,
        reason: 'certificate must be an object',
      };
    }

    // Certificate should contain canonical_bytes_hash
    if (!artifact.certificate.canonical_bytes_hash) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_CERTIFICATE,
        reason: 'certificate must contain canonical_bytes_hash',
      };
    }

    // Verify certificate hash matches artifact hash
    if (artifact.certificate.canonical_bytes_hash !== artifact.canonical_hash) {
      return {
        valid: false,
        code: CONSTITUTIONAL_FAILURE_CODES.INVALID_CERTIFICATE,
        reason: 'certificate canonical_bytes_hash does not match artifact canonical_hash',
        expected: artifact.canonical_hash,
        actual: artifact.certificate.canonical_bytes_hash,
      };
    }

    return { valid: true };
  }

  /**
   * Verify pipeline stages
   * 
   * @param {Object} pipelineStages - Pipeline stages to verify
   * @returns {Object} Verification result
   */
  verifyPipeline(pipelineStages) {
    const results = {};
    let allPassed = true;

    for (const [stageName, artifact] of Object.entries(pipelineStages)) {
      const result = this.verifyArtifact(artifact);
      results[stageName] = result;

      if (!result.valid) {
        allPassed = false;
      }
    }

    return {
      valid: allPassed,
      results,
      reason: allPassed ? 'All pipeline stages verified' : 'Pipeline verification failed',
    };
  }

  /**
   * Get constitution version
   * 
   * @returns {string} Constitution version
   */
  getConstitutionVersion() {
    return this._constitutionVersion;
  }
}

// Singleton instance
const constitutionalVerificationAuthority = new ConstitutionalVerificationAuthority();

module.exports = {
  ConstitutionalVerificationAuthority,
  constitutionalVerificationAuthority,
  CONSTITUTIONAL_FAILURE_CODES,
};
