/**
 * Replay Certificate Authority
 * 
 * Phase 36 Constitutional Refinement
 * 
 * Produces verifiable replay attestations.
 * 
 * Constitutional Constraint:
 * Every replay must produce cryptographic proof of convergence.
 * 
 * Architecture:
 * ReplayCertificateAuthority
 *   ↓
 * ReplayCertificate
 *     RuntimeID
 *     ReplayHash
 *     ReducerHash
 *     EventChainRoot
 *     WitnessRoot
 *     ConstitutionVersion
 *     ReplaySucceeded
 *   ↓
 * Cryptographic signature
 *   ↓
 * Verifiable replay proof
 * 
 * This becomes the constitutional proof that replay converged
 * with the same state as the original execution.
 */

const { CanonicalAuthority, CanonicalBytes } = require('../ping-runtime/authorities/canonical_authority.js');
const { witnessAuthority } = require('./witness_authority');
const { runtimeIdentityAuthority } = require('./runtime_identity_authority');
const { reducerAuthority } = require('./reducer_authority');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');

class ReplayCertificateAuthority {
  constructor() {
    this._authorityVersion = '1.0.0';
  }

  /**
   * Create replay certificate
   * @param {Object} replayData - Replay execution data
   * @returns {Object} Replay certificate
   */
  createCertificate(replayData) {
    const certificate = {
      certificate_id: this._generateCertificateId(),
      runtime_id: runtimeIdentityAuthority.getRuntimeId(),
      
      // Replay metadata
      replay_id: replayData.replay_id,
      original_lifecycle_id: replayData.original_lifecycle_id,
      replay_timestamp: replayData.replay_timestamp,
      
      // Cryptographic chain roots
      event_chain_root: replayData.event_chain_root,
      witness_root: replayData.witness_root,
      reducer_hash: replayData.reducer_hash,
      
      // Constitutional versions
      constitution_version: replayData.constitution_version,
      canonical_version: replayData.canonical_version,
      
      // Replay result
      replay_succeeded: replayData.replay_succeeded,
      replay_error: replayData.replay_error || null,
      
      // State convergence proof
      state_hash: replayData.state_hash,
      original_state_hash: replayData.original_state_hash,
      state_converged: replayData.state_hash === replayData.original_state_hash,
      
      // Authority metadata
      authority: 'ReplayCertificateAuthority',
      authority_version: this._authorityVersion,
      created_at: constitutionalTimeAuthority.now(),
      
      // Witness placeholder
      witness: null,
      witness_hash: null
    };
    
    // Compute replay hash
    certificate.replay_hash = this._computeReplayHash(certificate);
    
    // Create witness
    const certificateWitness = witnessAuthority.createWitness(certificate, {
      authority: 'ReplayCertificateAuthority',
      authority_version: this._authorityVersion,
      replay_id: replayData.replay_id
    });
    
    certificate.witness = certificateWitness;
    certificate.witness_hash = certificateWitness.witness_metadata?.hash || CanonicalAuthority.hash(certificateWitness);
    
    return certificate;
  }

  /**
   * Verify replay certificate
   * @param {Object} certificate - Replay certificate to verify
   * @returns {Object} Verification result
   */
  verifyCertificate(certificate) {
    // Verify certificate structure
    const requiredFields = [
      'certificate_id', 'runtime_id', 'replay_id', 'event_chain_root',
      'witness_root', 'reducer_hash', 'constitution_version',
      'replay_succeeded', 'replay_hash', 'witness_hash'
    ];
    
    for (const field of requiredFields) {
      if (!certificate[field]) {
        return {
          valid: false,
          reason: `Missing required field: ${field}`
        };
      }
    }
    
    // Verify replay hash
    const computedHash = this._computeReplayHash(certificate);
    if (computedHash !== certificate.replay_hash) {
      return {
        valid: false,
        reason: 'Replay hash mismatch - certificate has been tampered with'
      };
    }
    
    // Verify witness
    const witnessVerification = witnessAuthority.verifyWitness(certificate.witness);
    if (!witnessVerification.valid) {
      return witnessVerification;
    }
    
    // Verify state convergence
    if (certificate.replay_succeeded && !certificate.state_converged) {
      return {
        valid: false,
        reason: 'Replay succeeded but state did not converge - constitutional drift detected'
      };
    }
    
    // Verify reducer integrity
    const reducerVerification = reducerAuthority.verifyReducer(certificate.reducer_hash);
    if (!reducerVerification.valid) {
      return {
        valid: false,
        reason: `Reducer verification failed: ${reducerVerification.reason}`
      };
    }
    
    return {
      valid: true,
      reason: 'Replay certificate verified'
    };
  }

  /**
   * Compute replay hash
   * @param {Object} certificate - Certificate data
   * @returns {string} Replay hash
   */
  _computeReplayHash(certificate) {
    const canonicalData = {
      runtime_id: certificate.runtime_id,
      replay_id: certificate.replay_id,
      original_lifecycle_id: certificate.original_lifecycle_id,
      event_chain_root: certificate.event_chain_root,
      witness_root: certificate.witness_root,
      reducer_hash: certificate.reducer_hash,
      constitution_version: certificate.constitution_version,
      canonical_version: certificate.canonical_version,
      replay_succeeded: certificate.replay_succeeded,
      state_hash: certificate.state_hash,
      original_state_hash: certificate.original_state_hash
    };
    return CanonicalAuthority.hash(canonicalData);
  }

  /**
   * Generate certificate ID
   * @returns {string} Certificate ID
   */
  _generateCertificateId() {
    const data = {
      runtime_id: runtimeIdentityAuthority.getRuntimeId(),
      timestamp: constitutionalTimeAuthority.nowAsMillis(),
      authority_version: this._authorityVersion
    };
    const hash = CanonicalAuthority.hash(data);
    return `replay_cert_${hash.substring(0, 16)}`;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }
}

// Singleton instance
const replayCertificateAuthority = new ReplayCertificateAuthority();

module.exports = {
  ReplayCertificateAuthority,
  replayCertificateAuthority
};
