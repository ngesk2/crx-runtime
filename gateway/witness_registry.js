const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { runtimeFailureAuthority } = require('./runtime_failure_authority');
const { witnessAuthority } = require('./witness_authority');
const { constitutionVersionAuthority } = require('./constitution_version_authority');

/**
 * Witness Registry
 * 
 * Architectural Enhancement 8 — Witness Registry
 * 
 * Replace repetitive verification methods with registry-based generic validators.
 * 
 * Instead of:
 * - _verifyPromptWitness()
 * - _verifyModelWitness()
 * - _verifyCompletionWitness()
 * - _verifyStateWitness()
 * 
 * Use:
 * - verifyWitness(type, witness)
 * 
 * Registry dispatches type-specific rules.
 */

class WitnessRegistry {
  constructor() {
    // Removed serializer reference - use CanonicalAuthority directly
    this._failureAuthority = runtimeFailureAuthority;
    this._witnessAuthority = witnessAuthority;
    this._versionAuthority = constitutionVersionAuthority;
    this._registryId = this._generateRegistryId();
    this._registryVersion = '5.0.0';
    
    // Witness type registry
    this._witnessTypes = new Map();
    this._initializeWitnessTypes();
    
    // Witness invariant rules
    this._invariantRules = new Map();
    this._initializeInvariantRules();
  }

  /**
   * Register witness type
   * @param {string} type - Witness type
   * @param {Object} config - Type configuration
   */
  registerWitnessType(type, config) {
    this._witnessTypes.set(type, {
      type: type,
      required_fields: config.required_fields || [],
      optional_fields: config.optional_fields || [],
      hash_fields: config.hash_fields || [],
      invariant_rules: config.invariant_rules || [],
      custom_validator: config.custom_validator || null
    });
  }

  /**
   * Get witness type configuration
   * @param {string} type - Witness type
   * @returns {Object} Type configuration
   */
  getWitnessType(type) {
    return this._witnessTypes.get(type);
  }

  /**
   * Verify witness by type
   * @param {string} type - Witness type
   * @param {Object} witness - Witness to verify
   * @param {Object} context - Verification context
   * @returns {Object} Verification result
   */
  verifyWitness(type, witness, context = {}) {
    const typeConfig = this._witnessTypes.get(type);
    
    if (!typeConfig) {
      return {
        valid: false,
        reason: `Unknown witness type: ${type}`
      };
    }

    // Check required fields
    const requiredCheck = this._checkRequiredFields(witness, typeConfig.required_fields);
    if (!requiredCheck.valid) {
      return requiredCheck;
    }

    // Use WitnessAuthority for hash verification
    const hashVerification = this._witnessAuthority.verifyWitness(witness);
    if (!hashVerification.valid) {
      return hashVerification;
    }

    // Apply invariant rules
    const invariantCheck = this._checkInvariants(type, witness, context);
    if (!invariantCheck.valid) {
      return invariantCheck;
    }

    // Apply custom validator if present
    if (typeConfig.custom_validator) {
      const customCheck = typeConfig.custom_validator(witness, context);
      if (!customCheck.valid) {
        return customCheck;
      }
    }

    return {
      valid: true,
      reason: `${type} witness verified`
    };
  }

  /**
   * Check required fields
   * @param {Object} witness - Witness to check
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Check result
   */
  _checkRequiredFields(witness, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
      if (witness[field] === undefined || witness[field] === null) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return {
        valid: false,
        reason: 'Missing required fields',
        missing: missing
      };
    }

    return {
      valid: true
    };
  }

  /**
   * Check invariants
   * @param {string} type - Witness type
   * @param {Object} witness - Witness to check
   * @param {Object} context - Verification context
   * @returns {Object} Check result
   */
  _checkInvariants(type, witness, context) {
    const typeConfig = this._witnessTypes.get(type);
    const rules = typeConfig.invariant_rules;

    for (const rule of rules) {
      const ruleCheck = this._applyInvariantRule(rule, witness, context);
      if (!ruleCheck.valid) {
        return ruleCheck;
      }
    }

    return {
      valid: true
    };
  }

  /**
   * Apply invariant rule
   * @param {string} rule - Rule name
   * @param {Object} witness - Witness to check
   * @param {Object} context - Verification context
   * @returns {Object} Rule check result
   */
  _applyInvariantRule(rule, witness, context) {
    const ruleHandler = this._invariantRules.get(rule);
    
    if (!ruleHandler) {
      return {
        valid: false,
        reason: `Unknown invariant rule: ${rule}`
      };
    }

    return ruleHandler(witness, context);
  }

  /**
   * Register invariant rule
   * @param {string} rule - Rule name
   * @param {Function} handler - Rule handler function
   */
  registerInvariantRule(rule, handler) {
    this._invariantRules.set(rule, handler);
  }

  /**
   * Verify witness equivalence
   * @param {string} type - Witness type
   * @param {Object} witness1 - First witness
   * @param {Object} witness2 - Second witness
   * @returns {Object} Equivalence result
   */
  verifyWitnessEquivalence(type, witness1, witness2) {
    // Use WitnessAuthority for equivalence verification
    return this._witnessAuthority.verifyWitnessEquivalence(witness1, witness2);
  }

  /**
   * List registered witness types
   * @returns {Array} Array of witness types
   */
  listWitnessTypes() {
    return Array.from(this._witnessTypes.keys());
  }

  /**
   * Get registry ID
   * @returns {string} Registry ID
   */
  getRegistryId() {
    return this._registryId;
  }

  /**
   * Get registry version
   * @returns {string} Registry version
   */
  getRegistryVersion() {
    return this._registryVersion;
  }

  /**
   * Initialize witness types
   */
  _initializeWitnessTypes() {
    // Runtime witness
    this.registerWitnessType('runtime', {
      required_fields: ['runtime_id', 'witness_metadata'],
      optional_fields: ['execution_id', 'replay_id'],
      hash_fields: ['runtime_id'],
      invariant_rules: ['runtime_id_format', 'witness_metadata_structure']
    });

    // Prompt witness
    this.registerWitnessType('prompt', {
      required_fields: ['prompt_id', 'prompt_hash', 'witness_metadata'],
      optional_fields: ['canonical_prompt', 'attachments'],
      hash_fields: ['prompt_id', 'prompt_hash'],
      invariant_rules: ['prompt_hash_format', 'witness_metadata_structure']
    });

    // Model witness
    this.registerWitnessType('model', {
      required_fields: ['constitutional_model_id', 'digest', 'witness_metadata'],
      optional_fields: ['name', 'metadata'],
      hash_fields: ['constitutional_model_id', 'digest'],
      invariant_rules: ['digest_format', 'witness_metadata_structure']
    });

    // Inference witness
    this.registerWitnessType('inference', {
      required_fields: ['inference_id', 'prompt_hash', 'model_digest', 'witness_metadata'],
      optional_fields: ['options', 'completion_hash'],
      hash_fields: ['inference_id', 'prompt_hash', 'model_digest'],
      invariant_rules: ['inference_id_format', 'witness_metadata_structure']
    });

    // Streaming witness
    this.registerWitnessType('streaming', {
      required_fields: ['stream_id', 'completion_witness', 'chunk_witnesses', 'witness_metadata'],
      optional_fields: ['stream_metadata'],
      hash_fields: ['stream_id'],
      invariant_rules: ['chunk_witnesses_array', 'witness_metadata_structure']
    });

    // Tool witness
    this.registerWitnessType('tool', {
      required_fields: ['execution_id', 'tool_id', 'output_hash', 'witness_metadata'],
      optional_fields: ['tool_name', 'parameters_hash'],
      hash_fields: ['execution_id', 'tool_id', 'output_hash'],
      invariant_rules: ['execution_id_format', 'output_hash_format', 'witness_metadata_structure']
    });

    // Completion witness
    this.registerWitnessType('completion', {
      required_fields: ['completion_id', 'completion_hash', 'witness_metadata'],
      optional_fields: ['completion', 'token_count'],
      hash_fields: ['completion_id', 'completion_hash'],
      invariant_rules: ['completion_hash_format', 'witness_metadata_structure']
    });

    // State witness
    this.registerWitnessType('state', {
      required_fields: ['state_id', 'state_hash', 'witness_metadata'],
      optional_fields: ['state_data', 'checkpoint_hash'],
      hash_fields: ['state_id', 'state_hash'],
      invariant_rules: ['state_hash_format', 'witness_metadata_structure']
    });

    // Transcript witness
    this.registerWitnessType('transcript', {
      required_fields: ['transcript_id', 'transcript_hash', 'witness_metadata'],
      optional_fields: ['transcript_data'],
      hash_fields: ['transcript_id', 'transcript_hash'],
      invariant_rules: ['transcript_hash_format', 'witness_metadata_structure']
    });
  }

  /**
   * Initialize invariant rules
   */
  _initializeInvariantRules() {
    // Runtime ID format rule
    this.registerInvariantRule('runtime_id_format', (witness, context) => {
      if (!witness.runtime_id || typeof witness.runtime_id !== 'string') {
        return {
          valid: false,
          reason: 'Invalid runtime_id format'
        };
      }
      if (!witness.runtime_id.startsWith('runtime_')) {
        return {
          valid: false,
          reason: 'runtime_id must start with "runtime_"'
        };
      }
      return { valid: true };
    });

    // Prompt hash format rule
    this.registerInvariantRule('prompt_hash_format', (witness, context) => {
      if (!witness.prompt_hash || typeof witness.prompt_hash !== 'string') {
        return {
          valid: false,
          reason: 'Invalid prompt_hash format'
        };
      }
      if (witness.prompt_hash.length !== 64) {
        return {
          valid: false,
          reason: 'prompt_hash must be 64 characters (SHA-256)'
        };
      }
      return { valid: true };
    });

    // Digest format rule
    this.registerInvariantRule('digest_format', (witness, context) => {
      if (!witness.digest || typeof witness.digest !== 'string') {
        return {
          valid: false,
          reason: 'Invalid digest format'
        };
      }
      if (!witness.digest.startsWith('sha256:')) {
        return {
          valid: false,
          reason: 'digest must start with "sha256:"'
        };
      }
      return { valid: true };
    });

    // Inference ID format rule
    this.registerInvariantRule('inference_id_format', (witness, context) => {
      if (!witness.inference_id || typeof witness.inference_id !== 'string') {
        return {
          valid: false,
          reason: 'Invalid inference_id format'
        };
      }
      if (!witness.inference_id.startsWith('inference_')) {
        return {
          valid: false,
          reason: 'inference_id must start with "inference_"'
        };
      }
      return { valid: true };
    });

    // Chunk witnesses array rule
    this.registerInvariantRule('chunk_witnesses_array', (witness, context) => {
      if (!Array.isArray(witness.chunk_witnesses)) {
        return {
          valid: false,
          reason: 'chunk_witnesses must be an array'
        };
      }
      return { valid: true };
    });

    // Execution ID format rule
    this.registerInvariantRule('execution_id_format', (witness, context) => {
      if (!witness.execution_id || typeof witness.execution_id !== 'string') {
        return {
          valid: false,
          reason: 'Invalid execution_id format'
        };
      }
      if (!witness.execution_id.startsWith('exec_') && !witness.execution_id.startsWith('tool_exec_')) {
        return {
          valid: false,
          reason: 'execution_id must start with "exec_" or "tool_exec_"'
        };
      }
      return { valid: true };
    });

    // Output hash format rule
    this.registerInvariantRule('output_hash_format', (witness, context) => {
      if (!witness.output_hash || typeof witness.output_hash !== 'string') {
        return {
          valid: false,
          reason: 'Invalid output_hash format'
        };
      }
      if (witness.output_hash.length !== 64) {
        return {
          valid: false,
          reason: 'output_hash must be 64 characters (SHA-256)'
        };
      }
      return { valid: true };
    });

    // Completion hash format rule
    this.registerInvariantRule('completion_hash_format', (witness, context) => {
      if (!witness.completion_hash || typeof witness.completion_hash !== 'string') {
        return {
          valid: false,
          reason: 'Invalid completion_hash format'
        };
      }
      if (witness.completion_hash.length !== 64) {
        return {
          valid: false,
          reason: 'completion_hash must be 64 characters (SHA-256)'
        };
      }
      return { valid: true };
    });

    // State hash format rule
    this.registerInvariantRule('state_hash_format', (witness, context) => {
      if (!witness.state_hash || typeof witness.state_hash !== 'string') {
        return {
          valid: false,
          reason: 'Invalid state_hash format'
        };
      }
      if (witness.state_hash.length !== 64) {
        return {
          valid: false,
          reason: 'state_hash must be 64 characters (SHA-256)'
        };
      }
      return { valid: true };
    });

    // Transcript hash format rule
    this.registerInvariantRule('transcript_hash_format', (witness, context) => {
      if (!witness.transcript_hash || typeof witness.transcript_hash !== 'string') {
        return {
          valid: false,
          reason: 'Invalid transcript_hash format'
        };
      }
      if (witness.transcript_hash.length !== 64) {
        return {
          valid: false,
          reason: 'transcript_hash must be 64 characters (SHA-256)'
        };
      }
      return { valid: true };
    });

    // Witness metadata structure rule
    this.registerInvariantRule('witness_metadata_structure', (witness, context) => {
      if (!witness.witness_metadata || typeof witness.witness_metadata !== 'object') {
        return {
          valid: false,
          reason: 'Invalid witness_metadata structure'
        };
      }
      if (!witness.witness_metadata.hash || typeof witness.witness_metadata.hash !== 'string') {
        return {
          valid: false,
          reason: 'witness_metadata must contain hash'
        };
      }
      if (witness.witness_metadata.frozen !== true) {
        return {
          valid: false,
          reason: 'witness_metadata.frozen must be true'
        };
      }
      return { valid: true };
    });
  }

  /**
   * Generate registry ID
   * @returns {string} Registry ID
   */
  _generateRegistryId() {
    const registryData = {
      registry_version: this._registryVersion,
      constitutional_version: '5.0.0'
    };
    const hash = CanonicalAuthority.hash(registryData);
    return `witness_registry_${hash.substring(0, 16)}`;
  }
}

// Singleton instance
const witnessRegistry = new WitnessRegistry();

module.exports = { WitnessRegistry, witnessRegistry };
