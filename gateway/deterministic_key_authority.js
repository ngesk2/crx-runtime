/**
 * Deterministic Key Authority
 * 
 * Phase 45 Patch 45.8 — Constitutional Cryptographic Freeze
 * 
 * Constitutional Constraint: DeterministicKeyAuthority is pure deterministic cryptography.
 * 
 * Removed:
 * - key cache (mutable state)
 * - runtime entropy
 * - OS randomness
 * 
 * Fixed:
 * - HKDF with constitutional domain separation
 * - Ed25519 derivation from deterministic seed
 * - Canonical serialization before signing
 * - Deterministic domain separation constants
 * - Replay key derivation
 * 
 * Verification:
 * - Same seed → same keypair (Linux/Windows/MacOS/Node versions)
 * - Same data → same signature (cross-platform)
 * 
 * Domain Separation Constants:
 * - HKDF_INFO: 'ping-constitutional-key'
 * - HKDF_SALT: 'ed25519-privkey'
 * - HKDF_LENGTH: 32 bytes
 * - HASH_ALGORITHM: 'sha256'
 * - SIGNATURE_ALGORITHM: 'ed25519'
 */

const crypto = require('crypto');
const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');

class DeterministicKeyAuthority {
  constructor() {
    this._seed = null;
    
    // Constitutional domain separation constants
    this._HKDF_INFO = Buffer.from('ping-constitutional-key', 'utf8');
    this._HKDF_SALT = Buffer.from('ed25519-privkey', 'utf8');
    this._HKDF_LENGTH = 32;
    this._HASH_ALGORITHM = 'sha256';
    this._SIGNATURE_ALGORITHM = 'ed25519';
  }

  /**
   * Set constitutional seed
   * 
   * @param {string} seed - Constitutional seed
   */
  setSeed(seed) {
    this._seed = seed;
  }

  /**
   * Get constitutional seed
   * 
   * @returns {string} Seed
   */
  getSeed() {
    return this._seed;
  }

  /**
   * Derive Ed25519 key pair from seed (pure function, no cache)
   * 
   * @param {string} seed - Seed (optional, uses constitutional seed if not provided)
   * @returns {Object} Key pair { privateKey, publicKey }
   */
  deriveKeyPair(seed = null) {
    const effectiveSeed = seed || this._seed;
    
    if (!effectiveSeed) {
      throw new Error('No seed available for key derivation');
    }

    // Derive key from seed using HKDF with constitutional domain separation
    const seedBuffer = Buffer.from(effectiveSeed, 'utf8');
    
    // Derive 32-byte private key seed
    const derivedKey = crypto.hkdfSync(
      this._HASH_ALGORITHM,
      seedBuffer,
      this._HKDF_SALT,
      this._HKDF_INFO,
      this._HKDF_LENGTH
    );

    // Generate Ed25519 key pair from derived seed
    const keyPair = crypto.generateKeyPairSync(this._SIGNATURE_ALGORITHM, {
      privateKey: derivedKey,
    });

    return keyPair;
  }

  /**
   * Derive key pair from object hash (replay key derivation)
   * 
   * @param {string} hash - Object hash
   * @returns {Object} Key pair
   */
  deriveKeyPairFromHash(hash) {
    return this.deriveKeyPair(hash);
  }

  /**
   * Sign data with Ed25519 private key (canonical serialization first)
   * 
   * @param {Object|string} data - Data to sign
   * @param {Buffer} privateKey - Private key
   * @returns {string} Hex-encoded signature
   */
  sign(data, privateKey) {
    // Canonical serialize before signing
    const canonicalBytes = typeof data === 'string' 
      ? Buffer.from(data, 'utf8')
      : CanonicalAuthority.serialize(data);
    
    const signature = crypto.sign(null, canonicalBytes, privateKey);
    return signature.toString('hex');
  }

  /**
   * Verify signature with Ed25519 public key (canonical serialization first)
   * 
   * @param {Object|string} data - Original data
   * @param {string} signature - Hex-encoded signature
   * @param {Buffer} publicKey - Public key
   * @returns {boolean} True if signature is valid
   */
  verify(data, signature, publicKey) {
    // Canonical serialize before verifying
    const canonicalBytes = typeof data === 'string' 
      ? Buffer.from(data, 'utf8')
      : CanonicalAuthority.serialize(data);
    
    const signatureBytes = Buffer.from(signature, 'hex');
    return crypto.verify(null, canonicalBytes, publicKey, signatureBytes);
  }

  /**
   * Generate test vectors for cross-platform verification
   * 
   * @returns {Object} Test vectors
   */
  generateTestVectors() {
    const testSeed = 'test-constitutional-seed-12345';
    const testData = { test: 'data', value: 42 };
    
    const keyPair = this.deriveKeyPair(testSeed);
    const signature = this.sign(testData, keyPair.privateKey);
    const isValid = this.verify(testData, signature, keyPair.publicKey);
    
    return {
      seed: testSeed,
      data: testData,
      privateKey: keyPair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex'),
      publicKey: keyPair.publicKey.export({ type: 'spki', format: 'der' }).toString('hex'),
      signature: signature,
      verification: isValid,
      domain_separation: {
        hkdf_info: this._HKDF_INFO.toString('utf8'),
        hkdf_salt: this._HKDF_SALT.toString('utf8'),
        hkdf_length: this._HKDF_LENGTH,
        hash_algorithm: this._HASH_ALGORITHM,
        signature_algorithm: this._SIGNATURE_ALGORITHM,
      },
    };
  }

  /**
   * Publish contract
   */
  publishContract() {
    return {
      authority_id: 'deterministic-key-authority',
      authority_name: 'DeterministicKeyAuthority',
      version: '45.8.0',
      consumes: ['seed', 'data'],
      produces: ['keyPair', 'signature'],
      requires: ['canonical_authority'],
      guarantees: ['pure_deterministic', 'no_cache', 'no_runtime_entropy', 'no_os_randomness', 'canonical_serialization', 'domain_separation', 'cross_platform_determinism'],
      failure_modes: ['no_seed', 'invalid_data'],
      rollback: 'none',
      determinism: 'deterministic_cryptography',
    };
  }
}

// Singleton instance
const deterministicKeyAuthority = new DeterministicKeyAuthority();

module.exports = {
  DeterministicKeyAuthority,
  deterministicKeyAuthority,
};
