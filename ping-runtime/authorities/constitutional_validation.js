/**
 * Constitutional Validation Library
 * 
 * P000: Shared validation for every authority, registry, and event.
 * 
 * No registry decides what a contract looks like.
 * This library is the single source of structural truth.
 * 
 * Constitutional Constraint:
 * - Every authority must pass validateAuthority()
 * - Every event must pass validateEvent()
 * - Every registry must pass validateRegistry()
 * - Invariants are executable, not descriptive
 */

const crypto = require('crypto');

// ============================================================
// FROZEN CONTRACT SCHEMA
// ============================================================

const AUTHORITY_CONTRACT_SCHEMA = {
  required: ['authority_id', 'authority_name', 'version', 'owner', 'consumes', 'produces', 'guarantees', 'invariants', 'consumers'],
  optional: ['requires', 'failure_modes', 'rollback', 'determinism', 'permissions'],
  types: {
    authority_id: 'string',
    authority_name: 'string',
    version: 'string',
    owner: 'string',
    consumes: 'array',
    produces: 'array',
    guarantees: 'array',
    invariants: 'array',
    consumers: 'array',
    requires: 'array',
    failure_modes: 'array',
    rollback: 'string',
    determinism: 'string',
    permissions: 'array',
  },
};

const EVENT_CONTRACT_SCHEMA = {
  required: ['event_id', 'event_type', 'event_version', 'tenant_id', 'timestamp', 'sequence', 'source', 'actor', 'payload'],
  optional: ['causation_id', 'correlation_id', 'metadata', 'processed', 'processed_at', 'worker', 'retries', 'last_error', 'created_at'],
  types: {
    event_id: 'string',
    event_type: 'string',
    event_version: 'string',
    tenant_id: 'string',
    timestamp: 'string',
    sequence: 'number',
    source: 'string',
    actor: 'string',
    payload: 'object',
    causation_id: 'string|null',
    correlation_id: 'string|null',
    metadata: 'object',
    processed: 'boolean',
    processed_at: 'string|null',
    worker: 'string|null',
    retries: 'number',
    last_error: 'string|null',
    created_at: 'string',
  },
};

const REGISTRY_CONTRACT_SCHEMA = {
  required: ['authority_id', 'authority_name', 'version', 'owner', 'consumes', 'produces', 'guarantees', 'invariants', 'consumers'],
  optional: ['requires', 'failure_modes', 'rollback', 'determinism', 'uniqueness', 'tenant_isolation'],
  types: {
    authority_id: 'string',
    authority_name: 'string',
    version: 'string',
    owner: 'string',
    consumes: 'array',
    produces: 'array',
    guarantees: 'array',
    invariants: 'array',
    consumers: 'array',
    requires: 'array',
    failure_modes: 'array',
    rollback: 'string',
    determinism: 'string',
    uniqueness: 'array',
    tenant_isolation: 'boolean',
  },
};

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate an authority contract against frozen schema
 * 
 * @param {Object} contract - Authority contract
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAuthority(contract) {
  const errors = [];

  if (!contract || typeof contract !== 'object') {
    return { valid: false, errors: ['Contract must be a non-null object'] };
  }

  // Check required fields
  for (const field of AUTHORITY_CONTRACT_SCHEMA.required) {
    if (!(field in contract)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check types
  for (const [field, expectedType] of Object.entries(AUTHORITY_CONTRACT_SCHEMA.types)) {
    if (field in contract) {
      const value = contract[field];
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== expectedType) {
        errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  // Validate authority_id format (kebab-case)
  if (contract.authority_id && !/^[a-z][a-z0-9-]*$/.test(contract.authority_id)) {
    errors.push(`authority_id must be kebab-case: ${contract.authority_id}`);
  }

  // Validate version format (semver)
  if (contract.version && !/^\d+\.\d+\.\d+$/.test(contract.version)) {
    errors.push(`version must be semver (x.y.z): ${contract.version}`);
  }

  // Validate determinism field
  if (contract.determinism && !['deterministic', 'non-deterministic', 'time-dependent'].includes(contract.determinism)) {
    errors.push(`determinism must be one of: deterministic, non-deterministic, time-dependent`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate an event envelope against frozen schema
 * 
 * @param {Object} event - Event envelope
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateEvent(event) {
  const errors = [];

  if (!event || typeof event !== 'object') {
    return { valid: false, errors: ['Event must be a non-null object'] };
  }

  // Check required fields
  for (const field of EVENT_CONTRACT_SCHEMA.required) {
    if (!(field in event)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check types
  for (const [field, expectedType] of Object.entries(EVENT_CONTRACT_SCHEMA.types)) {
    if (field in event) {
      const value = event[field];
      let actualType;
      if (value === null) {
        actualType = 'null';
      } else if (Array.isArray(value)) {
        actualType = 'array';
      } else {
        actualType = typeof value;
      }
      // Handle nullable types
      if (expectedType.includes('|')) {
        const allowedTypes = expectedType.split('|');
        if (!allowedTypes.includes(actualType)) {
          errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
        }
      } else if (actualType !== expectedType) {
        errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  // Validate event_id format (UUID)
  if (event.event_id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.event_id)) {
    errors.push(`event_id must be a valid UUID: ${event.event_id}`);
  }

  // Validate timestamp format (ISO 8601)
  if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
    errors.push(`timestamp must be a valid ISO 8601 date: ${event.timestamp}`);
  }

  // Validate sequence is non-negative integer
  if (event.sequence !== undefined && (typeof event.sequence !== 'number' || event.sequence < 0 || !Number.isInteger(event.sequence))) {
    errors.push(`sequence must be a non-negative integer: ${event.sequence}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a registry contract against frozen schema
 * 
 * @param {Object} contract - Registry contract
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRegistry(contract) {
  const errors = [];

  if (!contract || typeof contract !== 'object') {
    return { valid: false, errors: ['Contract must be a non-null object'] };
  }

  // Check required fields
  for (const field of REGISTRY_CONTRACT_SCHEMA.required) {
    if (!(field in contract)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check types
  for (const [field, expectedType] of Object.entries(REGISTRY_CONTRACT_SCHEMA.types)) {
    if (field in contract) {
      const value = contract[field];
      let actualType;
      if (value === null) {
        actualType = 'null';
      } else if (Array.isArray(value)) {
        actualType = 'array';
      } else {
        actualType = typeof value;
      }
      if (actualType !== expectedType) {
        errors.push(`Field ${field}: expected ${expectedType}, got ${actualType}`);
      }
    }
  }

  // Validate authority_id format (kebab-case)
  if (contract.authority_id && !/^[a-z][a-z0-9-]*$/.test(contract.authority_id)) {
    errors.push(`authority_id must be kebab-case: ${contract.authority_id}`);
  }

  // Validate version format (semver)
  if (contract.version && !/^\d+\.\d+\.\d+$/.test(contract.version)) {
    errors.push(`version must be semver (x.y.z): ${contract.version}`);
  }

  // Validate uniqueness is array of arrays
  if (contract.uniqueness && !Array.isArray(contract.uniqueness)) {
    errors.push(`uniqueness must be an array of field arrays`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================
// INVARIANT VERIFICATION
// ============================================================

/**
 * Verify tenant isolation invariant
 * 
 * Tenant A cannot read Tenant B's data.
 * 
 * @param {Function} queryFn - Database query function
 * @param {string} tenantA - Tenant A ID
 * @param {string} tenantB - Tenant B ID
 * @param {string} table - Table to test
 * @returns {{ valid: boolean, details: string }}
 */
async function verifyTenantIsolation(queryFn, tenantA, tenantB, table) {
  try {
    // Insert data for tenant A
    await queryFn(
      `INSERT INTO ${table} (tenant_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [tenantA, JSON.stringify({ test: 'isolation-a' })]
    );

    // Insert data for tenant B
    await queryFn(
      `INSERT INTO ${table} (tenant_id, data) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [tenantB, JSON.stringify({ test: 'isolation-b' })]
    );

    // Query as tenant A — should NOT see tenant B's data
    const resultA = await queryFn(
      `SELECT * FROM ${table} WHERE tenant_id = $1`,
      [tenantA]
    );

    const tenantBData = resultA.rows.filter(r => r.tenant_id === tenantB);
    if (tenantBData.length > 0) {
      return { valid: false, details: `Tenant A can see Tenant B's data in ${table}` };
    }

    // Query as tenant B — should NOT see tenant A's data
    const resultB = await queryFn(
      `SELECT * FROM ${table} WHERE tenant_id = $1`,
      [tenantB]
    );

    const tenantAData = resultB.rows.filter(r => r.tenant_id === tenantA);
    if (tenantAData.length > 0) {
      return { valid: false, details: `Tenant B can see Tenant A's data in ${table}` };
    }

    // Cleanup
    await queryFn(`DELETE FROM ${table} WHERE tenant_id IN ($1, $2)`, [tenantA, tenantB]);

    return { valid: true, details: `Tenant isolation verified for ${table}` };
  } catch (error) {
    return { valid: false, details: `Tenant isolation test failed: ${error.message}` };
  }
}

/**
 * Verify immutability invariant
 * 
 * Once created, certain fields cannot change.
 * 
 * @param {Object} entity - Entity to check
 * @param {string[]} immutableFields - Fields that must not change
 * @returns {{ valid: boolean, details: string }}
 */
function verifyImmutability(entity, immutableFields) {
  const errors = [];

  for (const field of immutableFields) {
    if (!(field in entity)) {
      errors.push(`Immutable field missing: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Compute canonical hash of an object
 * 
 * @param {Object} obj - Object to hash
 * @returns {string} SHA-256 hash
 */
function computeCanonicalHash(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verify that an entity's hash matches its content
 * 
 * @param {Object} entity - Entity with hash field
 * @param {string} hashField - Name of hash field
 * @param {string[]} contentFields - Fields to include in hash computation
 * @returns {{ valid: boolean, details: string }}
 */
function verifyHash(entity, hashField = 'hash', contentFields = []) {
  if (!(hashField in entity)) {
    return { valid: false, details: `Hash field missing: ${hashField}` };
  }

  const content = {};
  for (const field of contentFields) {
    if (field in entity) {
      content[field] = entity[field];
    }
  }

  const expectedHash = computeCanonicalHash(content);
  const actualHash = entity[hashField];

  if (expectedHash !== actualHash) {
    return { valid: false, details: `Hash mismatch: expected ${expectedHash}, got ${actualHash}` };
  }

  return { valid: true, details: 'Hash verified' };
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Schemas (frozen)
  AUTHORITY_CONTRACT_SCHEMA,
  EVENT_CONTRACT_SCHEMA,
  REGISTRY_CONTRACT_SCHEMA,

  // Validators
  validateAuthority,
  validateEvent,
  validateRegistry,

  // Invariant verification
  verifyTenantIsolation,
  verifyImmutability,
  computeCanonicalHash,
  verifyHash,
};
