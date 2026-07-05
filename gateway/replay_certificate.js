const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

/**
 * Replay Certificate
 * 
 * Phase 5.8 — Constitutional Certificate
 * 
 * At the end produce:
 * 
 * ReplayCertificate
 * {
 *   transcript hash
 *   witness hash
 *   runtime hash
 *   replay verifier version
 *   constitutional version
 * }
 * 
 * Now replay becomes independently verifiable
 */

class ReplayCertificate {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._certificateVersion = '5.0.0';
  }

  /**
   * Create replay certificate
   * @param {Object} certificateData - Certificate data
   * @param {string} certificateData.transcript_hash - Transcript hash
   * @param {string} certificateData.witness_hash - Witness hash
   * @param {string} certificateData.runtime_hash - Runtime hash
   * @param {string} certificateData.verifier_version - Verifier version
   * @param {string} certificateData.constitutional_version - Constitutional version
   * @param {Object} certificateData.verification_result - Verification result
   * @returns {Object} Replay certificate
   */
  createCertificate(certificateData) {
    const certificate = {
      certificate_id: this._generateCertificateId(certificateData),
      certificate_version: this._certificateVersion,
      constitutional_version: certificateData.constitutional_version || '5.0.0',
      
      // Core hashes
      transcript_hash: certificateData.transcript_hash,
      witness_hash: certificateData.witness_hash,
      runtime_hash: certificateData.runtime_hash,
      
      // Version information
      verifier_version: certificateData.verifier_version || '5.0.0',
      replay_engine_version: certificateData.replay_engine_version || '5.0.0',
      
      // Verification result
      verification_result: certificateData.verification_result,
      
      // Certificate metadata
      certificate_metadata: {
        created_by: 'ReplayCertificate',
        frozen: true,
        hash: null,
        created_at: constitutionalTimeAuthority.now()
      }
    };

    // Compute certificate hash
    const certificateForHash = { ...certificate };
    delete certificateForHash.certificate_metadata.hash;
    delete certificateForHash.certificate_metadata.created_at;
    
    certificate.certificate_metadata.hash = CanonicalAuthority.hash(certificateForHash);
    
    // Create certificate witness
    const certificateWitness = this._witnessAuthority.createWitness(certificate, {
      authority: 'ReplayCertificate',
      authority_version: this._certificateVersion
    });
    
    certificate.certificate_witness = certificateWitness;

    // Deep freeze
    return this._freezeCertificate(certificate);
  }

  /**
   * Create certificate from verification result
   * @param {Object} transcript - Replay transcript
   * @param {Object} verificationResult - Verification result
   * @returns {Object} Replay certificate
   */
  createFromVerification(transcript, verificationResult) {
    return this.createCertificate({
      transcript_hash: transcript.transcript_metadata.hash,
      witness_hash: transcript.transcript_witness.witness_metadata.hash,
      runtime_hash: transcript.runtime.witness_metadata.hash,
      verifier_version: verificationResult.verifier_version,
      replay_engine_version: verificationResult.verifier_version,
      constitutional_version: transcript.constitutional_version,
      verification_result: verificationResult
    });
  }

  /**
   * Verify certificate
   * @param {Object} certificate - Replay certificate
   * @returns {Object} Verification result
   */
  verifyCertificate(certificate) {
    // Verify certificate hash
    const certificateForHash = { ...certificate };
    delete certificateForHash.certificate_metadata.hash;
    delete certificateForHash.certificate_metadata.created_at;
    delete certificateForHash.certificate_witness;
    
    const computedHash = CanonicalAuthority.hash(certificateForHash);
    
    if (computedHash !== certificate.certificate_metadata.hash) {
      return {
        valid: false,
        reason: 'Certificate hash mismatch',
        expected: certificate.certificate_metadata.hash,
        actual: computedHash
      };
    }

    // Verify certificate witness
    const witnessVerification = this._witnessAuthority.verifyWitness(certificate.certificate_witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }

    return {
      valid: true,
      reason: 'Certificate verified'
    };
  }

  /**
   * Compare two certificates
   * @param {Object} certificate1 - First certificate
   * @param {Object} certificate2 - Second certificate
   * @returns {Object} Comparison result
   */
  compareCertificates(certificate1, certificate2) {
    const differences = [];

    // Compare transcript hashes
    if (certificate1.transcript_hash !== certificate2.transcript_hash) {
      differences.push({
        field: 'transcript_hash',
        certificate1: certificate1.transcript_hash,
        certificate2: certificate2.transcript_hash
      });
    }

    // Compare witness hashes
    if (certificate1.witness_hash !== certificate2.witness_hash) {
      differences.push({
        field: 'witness_hash',
        certificate1: certificate1.witness_hash,
        certificate2: certificate2.witness_hash
      });
    }

    // Compare runtime hashes
    if (certificate1.runtime_hash !== certificate2.runtime_hash) {
      differences.push({
        field: 'runtime_hash',
        certificate1: certificate1.runtime_hash,
        certificate2: certificate2.runtime_hash
      });
    }

    // Compare constitutional versions
    if (certificate1.constitutional_version !== certificate2.constitutional_version) {
      differences.push({
        field: 'constitutional_version',
        certificate1: certificate1.constitutional_version,
        certificate2: certificate2.constitutional_version
      });
    }

    return {
      equivalent: differences.length === 0,
      differences: differences
    };
  }

  /**
   * Serialize certificate to canonical bytes
   * @param {Object} certificate - Replay certificate
   * @returns {string} Canonical bytes
   */
  serializeCertificate(certificate) {
    return CanonicalBytes.serialize(certificate);
  }

  /**
   * Deserialize certificate from canonical bytes
   * @param {string} canonicalBytes - Canonical bytes
   * @returns {Object} Replay certificate
   */
  deserializeCertificate(canonicalBytes) {
    const certificate = JSON.parse(canonicalBytes);
    
    // Verify integrity after deserialization
    const verification = this.verifyCertificate(certificate);
    if (!verification.valid) {
      throw this._failureAuthority.createFailure(
        'CERTIFICATE_DESERIALIZATION_FAILED',
        'REPLAY_VERIFICATION',
        { 
          reason: verification.reason
        }
      );
    }

    return certificate;
  }

  /**
   * Export certificate to JSON
   * @param {Object} certificate - Replay certificate
   * @returns {string} JSON string
   */
  exportCertificate(certificate) {
    return JSON.stringify(certificate, null, 2);
  }

  /**
   * Import certificate from JSON
   * @param {string} jsonString - JSON string
   * @returns {Object} Replay certificate
   */
  importCertificate(jsonString) {
    const certificateData = JSON.parse(jsonString);
    
    // Verify certificate
    const verification = this.verifyCertificate(certificateData);
    if (!verification.valid) {
      throw this._failureAuthority.createFailure(
        'CERTIFICATE_IMPORT_FAILED',
        'REPLAY_VERIFICATION',
        { 
          reason: verification.reason
        }
      );
    }

    return certificateData;
  }

  /**
   * Get certificate ID
   * @param {Object} certificate - Replay certificate
   * @returns {string} Certificate ID
   */
  getCertificateId(certificate) {
    return certificate.certificate_id;
  }

  /**
   * Get certificate hash
   * @param {Object} certificate - Replay certificate
   * @returns {string} Certificate hash
   */
  getCertificateHash(certificate) {
    return certificate.certificate_metadata.hash;
  }

  /**
   * Get certificate version
   * @returns {string} Certificate version
   */
  getCertificateVersion() {
    return this._certificateVersion;
  }

  /**
   * Generate certificate ID
   * @param {Object} certificateData - Certificate data
   * @returns {string} Certificate ID
   */
  _generateCertificateId(certificateData) {
    /**
     * Generate certificate ID from canonical bytes.
     * 
     * Constitutional Constraint: Certificates must consume canonical_bytes, not objects.
     * This guarantees certificates survive serializer evolution.
     * 
     * Pattern: canonical_bytes → hashBytes() → CertificateID
     */
    if (!certificateData.canonical_bytes) {
      throw new Error('Certificate requires canonical_bytes for constitutional ID generation');
    }

    const hash = CanonicalAuthority.hashBytes(certificateData.canonical_bytes);
    return `certificate_${hash.substring(0, 16)}`;
  }

  /**
   * Deep freeze certificate to make immutable
   * @param {Object} certificate - Replay certificate
   * @returns {Object} Frozen certificate
   */
  _freezeCertificate(certificate) {
    const freeze = (obj) => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        obj.forEach(freeze);
        Object.freeze(obj);
        return obj;
      }

      Object.keys(obj).forEach(key => {
        freeze(obj[key]);
      });

      Object.freeze(obj);
      return obj;
    };

    return freeze(certificate);
  }
}

// Singleton instance
const replayCertificate = new ReplayCertificate();

module.exports = { ReplayCertificate, replayCertificate };
