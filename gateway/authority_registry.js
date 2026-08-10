/**
 * Authority Registry
 * 
 * Constitutional Authority Registration System
 * 
 * Constitutional Constraint: Every authority is registered once.
 * Constitutional Constraint: Nothing instantiates authorities directly.
 * 
 * Benefits:
 * - Dependency inversion
 * - Constitutional introspection
 * - Authority auditing
 * - Runtime verification
 * - Constitutional boot ordering
 * 
 * Authority Chain:
 * Raw Transport
 *         ↓
 * Normalization
 *         ↓
 * Canonical Bytes
 *         ↓
 * Canonical Hash
 *         ↓
 * Identity
 *         ↓
 * Canonical Object
 *         ↓
 * Persistence
 *         ↓
 * Replay
 *         ↓
 * Witness
 *         ↓
 * Certificate
 *         ↓
 * Temporal (future)
 *         ↓
 * Verification
 */

const { CanonicalAuthority } = require('../ping-runtime/authorities/canonical_authority.js');
const { identityAuthority } = require('../ping-runtime/authorities/identity_authority.js');
const { constitutionalTimeAuthority } = require('../ping-runtime/authorities/constitutional_time_authority.js');
const { deterministicKeyAuthority } = require('./deterministic_key_authority');
const { canonicalObjectAuthority } = require('./canonical_object_authority');
const { MigrationEngine } = require('./migration_engine');
const { RepositoryStore } = require('../ping-runtime/events/repository_store');
const { AppendOrchestrator } = require('./append_orchestrator');
const { WitnessRecorder } = require('./witness_recorder');
const { ReplayCertificate } = require('./replay_certificate');
const { constitutionalVerificationAuthority } = require('../ping-runtime/evidence/constitutional_verification_authority');

class AuthorityRegistry {
  constructor() {
    this._authorities = new Map();
    this._bootOrder = [];
    this._initialized = false;
  }

  /**
   * Register an authority
   * 
   * @param {string} name - Authority name
   * @param {Object} authority - Authority instance
   * @param {Object} metadata - Authority metadata
   * @param {string} metadata.version - Authority version
   * @param {string} metadata.layer - Constitutional layer
   * @param {Array<string>} metadata.dependencies - Authority dependencies
   * @param {string} metadata.description - Authority description
   */
  register(name, authority, metadata = {}) {
    if (this._authorities.has(name)) {
      throw new Error(`Authority '${name}' already registered`);
    }

    this._authorities.set(name, {
      instance: authority,
      metadata: {
        version: metadata.version || '1.0.0',
        layer: metadata.layer || 'unknown',
        dependencies: metadata.dependencies || [],
        description: metadata.description || '',
        registered_at: constitutionalTimeAuthority.nowISO(),
      },
    });

    this._bootOrder.push(name);
  }

  /**
   * Get authority by name
   * 
   * @param {string} name - Authority name
   * @returns {Object} Authority instance
   */
  get(name) {
    const authority = this._authorities.get(name);
    if (!authority) {
      throw new Error(`Authority '${name}' not registered`);
    }
    return authority.instance;
  }

  /**
   * Check if authority is registered
   * 
   * @param {string} name - Authority name
   * @returns {boolean} True if registered
   */
  has(name) {
    return this._authorities.has(name);
  }

  /**
   * Get all registered authorities
   * 
   * @returns {Array<Object>} Array of authority info
   */
  getAll() {
    return Array.from(this._authorities.entries()).map(([name, data]) => ({
      name,
      ...data.metadata,
    }));
  }

  /**
   * Get boot order
   * 
   * @returns {Array<string>} Boot order
   */
  getBootOrder() {
    return [...this._bootOrder];
  }

  /**
   * Verify authority dependencies
   * 
   * @returns {Object} Verification result
   */
  verifyDependencies() {
    const errors = [];
    const warnings = [];

    for (const [name, data] of this._authorities) {
      for (const dependency of data.metadata.dependencies) {
        if (!this._authorities.has(dependency)) {
          errors.push(`Authority '${name}' depends on '${dependency}' which is not registered`);
        }
      }
    }

    // Check for circular dependencies
    const visited = new Set();
    const recursionStack = new Set();

    const hasCycle = (name) => {
      if (recursionStack.has(name)) return true;
      if (visited.has(name)) return false;

      visited.add(name);
      recursionStack.add(name);

      const authority = this._authorities.get(name);
      for (const dependency of authority.metadata.dependencies) {
        if (hasCycle(dependency)) return true;
      }

      recursionStack.delete(name);
      return false;
    };

    for (const name of this._authorities.keys()) {
      if (hasCycle(name)) {
        errors.push(`Circular dependency detected involving '${name}'`);
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get authority metadata
   * 
   * @param {string} name - Authority name
   * @returns {Object} Authority metadata
   */
  getMetadata(name) {
    const authority = this._authorities.get(name);
    if (!authority) {
      throw new Error(`Authority '${name}' not registered`);
    }
    return authority.metadata;
  }

  /**
   * Initialize all constitutional authorities
   * 
   * @param {Object} config - Configuration
   * @param {Object} config.postgresPool - PostgreSQL pool
   */
  initialize(config = {}) {
    if (this._initialized) {
      throw new Error('AuthorityRegistry already initialized');
    }

    // Layer 0: Foundation Authorities
    this.register('CanonicalAuthority', CanonicalAuthority, {
      version: '1.0.0',
      layer: 'foundation',
      dependencies: [],
      description: 'Single serialization and hashing authority',
    });

    this.register('IdentityAuthority', identityAuthority, {
      version: '1.0.0',
      layer: 'foundation',
      dependencies: ['CanonicalAuthority'],
      description: 'Single ID generation authority',
    });

    this.register('ConstitutionalTimeAuthority', constitutionalTimeAuthority, {
      version: '1.0.0',
      layer: 'foundation',
      dependencies: [],
      description: 'Constitutional time authority',
    });

    this.register('DeterministicKeyAuthority', deterministicKeyAuthority, {
      version: '1.0.0',
      layer: 'foundation',
      dependencies: [],
      description: 'Deterministic cryptographic key authority',
    });

    this.register('ConstitutionalVerificationAuthority', constitutionalVerificationAuthority, {
      version: '1.0.0',
      layer: 'foundation',
      dependencies: ['CanonicalAuthority', 'IdentityAuthority'],
      description: 'Single constitutional verification authority',
    });

    // Layer 1: Object Creation
    this.register('CanonicalObjectAuthority', canonicalObjectAuthority, {
      version: '1.0.0',
      layer: 'object_creation',
      dependencies: ['CanonicalAuthority', 'IdentityAuthority', 'ConstitutionalTimeAuthority'],
      description: 'Single constitutional object creation authority',
    });

    // Layer 2: Persistence
    const migrationEngine = new MigrationEngine(config.postgresPool);
    this.register('MigrationEngine', migrationEngine, {
      version: '1.0.0',
      layer: 'persistence',
      dependencies: [],
      description: 'Single migration authority',
    });

    const repositoryStore = new RepositoryStore(config.postgresPool);
    this.register('RepositoryStore', repositoryStore, {
      version: '1.0.0',
      layer: 'persistence',
      dependencies: ['MigrationEngine'],
      description: 'Pure persistence layer',
    });

    // Layer 3: Transaction Coordination
    const appendOrchestrator = new AppendOrchestrator(repositoryStore);
    this.register('AppendOrchestrator', appendOrchestrator, {
      version: '1.0.0',
      layer: 'transaction',
      dependencies: ['RepositoryStore'],
      description: 'Single transaction coordinator',
    });

    // Layer 4: Witness
    const witnessRecorder = new WitnessRecorder();
    this.register('WitnessRecorder', witnessRecorder, {
      version: '1.0.0',
      layer: 'witness',
      dependencies: ['CanonicalAuthority', 'IdentityAuthority', 'ConstitutionalTimeAuthority', 'DeterministicKeyAuthority'],
      description: 'Witness recording authority',
    });

    // Layer 5: Certificate
    const replayCertificate = new ReplayCertificate();
    this.register('ReplayCertificate', replayCertificate, {
      version: '1.0.0',
      layer: 'certificate',
      dependencies: ['CanonicalAuthority', 'IdentityAuthority'],
      description: 'Replay certificate authority',
    });

    // Verify dependencies
    const verification = this.verifyDependencies();
    if (!verification.valid) {
      throw new Error(`Authority dependency verification failed: ${JSON.stringify(verification.errors)}`);
    }

    this._initialized = true;
  }

  /**
   * Check if initialized
   * 
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this._initialized;
  }

  /**
   * Reset registry (for testing only)
   */
  _reset() {
    this._authorities.clear();
    this._bootOrder = [];
    this._initialized = false;
  }
}

// Singleton instance
const authorityRegistry = new AuthorityRegistry();

module.exports = { AuthorityRegistry, authorityRegistry };
