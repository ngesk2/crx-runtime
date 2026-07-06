/**
 * Constitutional Authority
 * 
 * Phase 11.14 — Constitutional Service Architecture
 * 
 * Constitutional orchestration authority.
 * 
 * Delegates to:
 * - AuthorityIdentityService (registration, manifests, metadata)
 * - AuthoritySigningService (sign, verify)
 * - AuthorityVerificationService (verification)
 * - AuthorityRepository (storage)
 * 
 * Exposes only orchestration methods:
 * - evaluate()
 * - approve()
 * - reject()
 * - orchestrate()
 * - status()
 */

const { authorityIdentityService } = require('./authority_identity_service');
const { authoritySigningService } = require('./authority_signing_service');
const { authorityVerificationService } = require('./authority_verification_service');
const { authorityRepository } = require('./authority_repository');
const { deterministicKeyAuthority } = require('./deterministic_key_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');

class ConstitutionalAuthority {
  constructor() {
    this._identityService = authorityIdentityService;
    this._signingService = authoritySigningService;
    this._verificationService = authorityVerificationService;
    this._repository = authorityRepository;
    this._initialized = false;
  }

  /**
   * Initialize constitutional authority
   */
  async initialize() {
    // Set signing identity
    this._signingService.setIdentity('ping-constitutional-authority-seed');
    
    // Register self as authority
    this._identityService.registerAuthority({
      authority_name: 'ConstitutionalAuthority',
      authority_type: 'orchestration',
      authority_version: '11.14.0',
      capabilities: ['evaluate', 'approve', 'reject', 'orchestrate', 'status']
    });
    
    this._initialized = true;
  }

  /**
   * Evaluate constitutional object
   * @param {Object} obj - Constitutional object to evaluate
   * @returns {Object} Evaluation result
   */
  evaluate(obj) {
    if (!this._initialized) {
      throw new Error('ConstitutionalAuthority not initialized');
    }

    // Delegate to verification service
    const verification = this._verificationService.verifyConstitutionalObject(obj);
    
    return {
      valid: verification.valid,
      reason: verification.reason,
      evaluated_at: new Date(constitutionalTimeAuthority.now()).toISOString()
    };
  }

  /**
   * Approve constitutional object
   * @param {Object} obj - Constitutional object to approve
   * @returns {Object} Approved object with signature
   */
  approve(obj) {
    if (!this._initialized) {
      throw new Error('ConstitutionalAuthority not initialized');
    }

    // Verify first
    const evaluation = this.evaluate(obj);
    if (!evaluation.valid) {
      throw new Error(`Cannot approve invalid object: ${evaluation.reason}`);
    }

    // Sign the object
    const signature = this._signingService.sign(JSON.stringify(obj));
    
    // Add signature to object
    const approvedObj = {
      ...obj,
      signature: {
        signature: signature,
        public_key: this._signingService.getPublicKey().toString('hex'),
        algorithm: 'ed25519'
      },
      approved_at: new Date(constitutionalTimeAuthority.now()).toISOString()
    };

    // Store in repository
    this._repository.registerObject(obj.id, approvedObj);

    return approvedObj;
  }

  /**
   * Reject constitutional object
   * @param {Object} obj - Constitutional object to reject
   * @param {string} reason - Rejection reason
   * @returns {Object} Rejection result
   */
  reject(obj, reason) {
    if (!this._initialized) {
      throw new Error('ConstitutionalAuthority not initialized');
    }

    const rejection = {
      object_id: obj.id,
      rejected_at: new Date(constitutionalTimeAuthority.now()).toISOString(),
      reason: reason || 'Rejected by constitutional authority'
    };

    // Store rejection in repository
    this._repository.registerObject(`rejection_${obj.id}`, rejection);

    return rejection;
  }

  /**
   * Orchestrate constitutional operation
   * @param {string} operation - Operation to orchestrate
   * @param {Object} params - Operation parameters
   * @returns {Object} Orchestration result
   */
  async orchestrate(operation, params) {
    if (!this._initialized) {
      throw new Error('ConstitutionalAuthority not initialized');
    }

    const operations = {
      'register_authority': () => this._orchestrateRegisterAuthority(params),
      'verify_witness': () => this._orchestrateVerifyWitness(params),
      'verify_manifest': () => this._orchestrateVerifyManifest(params),
      'verify_proposal': () => this._orchestrateVerifyProposal(params),
      'sign_object': () => this._orchestrateSignObject(params)
    };

    const handler = operations[operation];
    if (!handler) {
      throw new Error(`Unknown operation: ${operation}`);
    }

    return await handler();
  }

  /**
   * Get authority status
   * @returns {Object} Status information
   */
  status() {
    return {
      initialized: this._initialized,
      authorities_registered: this._repository.listAuthorities().length,
      objects_stored: this._repository.listObjects().length,
      signing_identity: this._signingService.getIdentity(),
      public_key: this._signingService.getPublicKey()?.toString('hex')
    };
  }

  // Private orchestration methods

  async _orchestrateRegisterAuthority(params) {
    return this._identityService.registerAuthority(params);
  }

  async _orchestrateVerifyWitness(params) {
    return this._verificationService.verifyWitness(params.witness);
  }

  async _orchestrateVerifyManifest(params) {
    return this._verificationService.verifyManifest(params.manifest);
  }

  async _orchestrateVerifyProposal(params) {
    return this._verificationService.verifyProposal(params.proposal);
  }

  async _orchestrateSignObject(params) {
    return this._signingService.sign(params.data);
  }
}

// Singleton instance
const constitutionalAuthority = new ConstitutionalAuthority();

module.exports = {
  ConstitutionalAuthority,
  constitutionalAuthority,
};
