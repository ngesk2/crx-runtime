/**
 * Standard Event Schema
 * 
 * Phase A1.4 — Constitutional Standard Event Schema
 * 
 * Every persisted event must conform to one immutable constitutional schema.
 * 
 * Minimum fields:
 * - event_id
 * - event_type
 * - aggregate_id
 * - aggregate_type
 * - aggregate_version
 * - sequence
 * - authority
 * - authority_version
 * - causation_id
 * - correlation_id
 * - timestamp
 * - payload_version
 * - payload
 * - witness_hash
 * - schema_hash
 * - canonical_hash
 * 
 * No authority may define custom envelopes.
 * 
 * PATCH_011: Moved to runtime/kernel/authorities/
 * StandardEventSchema is the single owner of replay-visible fields and derives through kernel authorities.
 */

const { CanonicalAuthority, CanonicalBytes } = require('./canonical_authority');
const { constitutionalTimeAuthority } = require('./constitutional_time_authority');
const { witnessAuthority } = require('./witness_authority');
const { identityAuthority } = require('./identity_authority');
const { runtimeIdentityAuthority } = require('./runtime_identity_authority');
const { replayIdentityAuthority } = require('./replay_identity_authority');

class StandardEventSchema {
  /**
   * Create standard event
   * @param {string} eventType - Event type
   * @param {string} aggregateId - Aggregate ID
   * @param {string} aggregateType - Aggregate type
   * @param {Object} payload - Event payload
   * @param {string} authority - Authority name
   * @param {Object} options - Optional fields (aggregate_version, sequence, etc.)
   * @returns {Object} Standard event
   */
  static create(eventType, aggregateId, aggregateType, payload, authority = 'default', options = {}) {
    const eventId = this._generateEventId(eventType, aggregateId);
    const timestamp = constitutionalTimeAuthority.nowAsMillis();
    const aggregateVersion = options.aggregate_version || 1;
    const sequence = options.sequence || 1;

    // Priority 3: Runtime Identity Separation
    // RuntimeID is provenance only (from RuntimeIdentityAuthority)
    const runtimeId = runtimeIdentityAuthority.getRuntimeId();
    
    // ReplayID influences replay hashes (from ReplayIdentityAuthority)
    const replayId = replayIdentityAuthority.getReplayId();
    
    const previousHash = options.previous_hash || null;
    const reducerHash = options.reducer_hash || null;

    const event = {
      event_id: eventId,
      event_type: eventType,
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
      aggregate_version: aggregateVersion,
      sequence: sequence,
      authority: authority,
      authority_version: options.authority_version || '1.0.0',
      causation_id: options.causation_id || null,
      correlation_id: options.correlation_id || eventId,
      parent_event_id: options.parent_event_id || null,
      timestamp: timestamp,
      payload_version: options.payload_version || 1,
      payload: payload,
      witness: null,
      witness_hash: null,
      schema_hash: this._computeSchemaHash(),
      canonical_hash: null,
      // Priority 3: Runtime Identity Separation
      RuntimeID: runtimeId, // Provenance only
      ReplayID: replayId, // Influences replay hashes
      PreviousEventHash: previousHash,
      CanonicalEventHash: null,
      ReducerHash: reducerHash,
      WitnessHash: null,
      ReplayHash: null
    };

    // Phase 36 PATCH 2 Refinement: Compute CanonicalEventHash BEFORE witness to avoid circular authority
    event.CanonicalEventHash = this._computeCanonicalEventHash(event);

    // Create witness (WitnessAuthority handles hashing internally)
    event.witness = witnessAuthority.createWitness(event, {
      authority: authority,
      authority_version: event.authority_version,
      event_type: eventType
    });

    // Extract witness hash from witness
    event.WitnessHash = event.witness.witness_metadata?.hash || CanonicalAuthority.hash(event.witness);

    // Compute replay hash (includes witness)
    event.ReplayHash = this._computeReplayHash(event);

    // Compute canonical hash
    event.canonical_hash = this._computeCanonicalHash(event);

    Object.freeze(event);
    return event;
  }

  /**
   * Validate event schema
   * @param {Object} event - Event to validate
   * @returns {Object} Validated event
   * @throws {Error} If validation fails
   */
  static validate(event) {
    // Priority 3: Runtime Identity Separation - include ReplayID
    const required = ['event_id', 'event_type', 'aggregate_id', 'aggregate_type', 'aggregate_version', 'sequence', 'authority', 'authority_version', 'timestamp', 'payload_version', 'payload', 'witness_hash', 'schema_hash', 'canonical_hash', 'RuntimeID', 'ReplayID', 'CanonicalEventHash', 'WitnessHash'];
    const errors = [];

    for (const field of required) {
      if (!(field in event)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    if (event.event_id && typeof event.event_id !== 'string') {
      errors.push('event_id must be a string');
    }
    if (event.event_type && typeof event.event_type !== 'string') {
      errors.push('event_type must be a string');
    }
    if (event.aggregate_id && typeof event.aggregate_id !== 'string') {
      errors.push('aggregate_id must be a string');
    }
    if (event.aggregate_type && typeof event.aggregate_type !== 'string') {
      errors.push('aggregate_type must be a string');
    }
    if (event.aggregate_version && typeof event.aggregate_version !== 'number') {
      errors.push('aggregate_version must be a number');
    }
    if (event.sequence && typeof event.sequence !== 'number') {
      errors.push('sequence must be a number');
    }
    if (event.authority && typeof event.authority !== 'string') {
      errors.push('authority must be a string');
    }
    if (event.authority_version && typeof event.authority_version !== 'string') {
      errors.push('authority_version must be a string');
    }
    if (event.timestamp && typeof event.timestamp !== 'number') {
      errors.push('timestamp must be a number');
    }
    if (event.payload_version && typeof event.payload_version !== 'number') {
      errors.push('payload_version must be a number');
    }
    if (event.payload && typeof event.payload !== 'object') {
      errors.push('payload must be an object');
    }
    if (event.witness_hash && typeof event.witness_hash !== 'string') {
      errors.push('witness_hash must be a string');
    }
    if (event.schema_hash && typeof event.schema_hash !== 'string') {
      errors.push('schema_hash must be a string');
    }
    if (event.canonical_hash && typeof event.canonical_hash !== 'string') {
      errors.push('canonical_hash must be a string');
    }
    // Priority 3: Runtime Identity Separation - Validate ReplayID
    if (event.RuntimeID && typeof event.RuntimeID !== 'string') {
      errors.push('RuntimeID must be a string');
    }
    if (event.ReplayID && typeof event.ReplayID !== 'string') {
      errors.push('ReplayID must be a string');
    }
    if (event.PreviousEventHash && typeof event.PreviousEventHash !== 'string') {
      errors.push('PreviousEventHash must be a string');
    }
    if (event.CanonicalEventHash && typeof event.CanonicalEventHash !== 'string') {
      errors.push('CanonicalEventHash must be a string');
    }
    if (event.ReducerHash && typeof event.ReducerHash !== 'string') {
      errors.push('ReducerHash must be a string');
    }
    if (event.WitnessHash && typeof event.WitnessHash !== 'string') {
      errors.push('WitnessHash must be a string');
    }
    if (event.ReplayHash && typeof event.ReplayHash !== 'string') {
      errors.push('ReplayHash must be a string');
    }

    if (errors.length > 0) {
      throw new Error(`Event validation failed: ${errors.join(', ')}`);
    }

    return event;
  }

  /**
   * Serialize event for storage/transmission (deterministic)
   * @param {Object} event - Event to serialize
   * @returns {string} Serialized event
   */
  static serialize(event) {
    // Serialize in deterministic order
    const ordered = {
      event_id: event.event_id,
      event_type: event.event_type,
      aggregate_id: event.aggregate_id,
      aggregate_type: event.aggregate_type,
      aggregate_version: event.aggregate_version,
      sequence: event.sequence,
      authority: event.authority,
      authority_version: event.authority_version,
      causation_id: event.causation_id,
      correlation_id: event.correlation_id,
      timestamp: event.timestamp,
      payload_version: event.payload_version,
      payload: event.payload,
      witness_hash: event.witness_hash,
      schema_hash: event.schema_hash,
      canonical_hash: event.canonical_hash,
      // Priority 3: Runtime Identity Separation
      RuntimeID: event.RuntimeID,
      ReplayID: event.ReplayID,
      PreviousEventHash: event.PreviousEventHash,
      CanonicalEventHash: event.CanonicalEventHash,
      ReducerHash: event.ReducerHash,
      WitnessHash: event.WitnessHash,
      ReplayHash: event.ReplayHash
    };
    return CanonicalBytes.serialize(ordered);
  }

  /**
   * Deserialize event
   * @param {string} serialized - Serialized event
   * @returns {Object} Event
   */
  static deserialize(serialized) {
    const event = CanonicalBytes.deserialize(serialized);
    return this.validate(event);
  }

  /**
   * Generate event ID (delegated to IdentityAuthority)
   * @param {string} eventType - Event type
   * @param {string} aggregateId - Aggregate ID
   * @returns {string} Event ID
   */
  static _generateEventId(eventType, aggregateId) {
    return identityAuthority.generateEventId(eventType, aggregateId);
  }

  /**
   * Compute schema hash (delegated to CanonicalAuthority)
   * Phase 36 PATCH 5 Refinement: Updated schema version to include uppercase constitutional fields
   * @returns {string} Schema hash
   */
  static _computeSchemaHash() {
    // Priority 3: Runtime Identity Separation - include ReplayID
    const fields = ['event_id', 'event_type', 'aggregate_id', 'aggregate_type', 'aggregate_version', 'sequence', 'authority', 'authority_version', 'causation_id', 'correlation_id', 'timestamp', 'payload_version', 'payload', 'witness_hash', 'schema_hash', 'canonical_hash', 'RuntimeID', 'ReplayID', 'PreviousEventHash', 'CanonicalEventHash', 'ReducerHash', 'WitnessHash', 'ReplayHash'];
    return CanonicalAuthority.hashEventSchema(fields, '5.0.0');
  }

  /**
   * Compute canonical event hash (BEFORE witness to avoid circular authority)
   * Phase 36 PATCH 2 Refinement
   * @param {Object} event - Event to hash
   * @returns {string} Canonical event hash
   */
  static _computeCanonicalEventHash(event) {
    // Priority 3: Runtime Identity Separation - Use ReplayID for replay hashes
    const canonicalEvent = {
      event_id: event.event_id,
      event_type: event.event_type,
      aggregate_id: event.aggregate_id,
      aggregate_type: event.aggregate_type,
      aggregate_version: event.aggregate_version,
      sequence: event.sequence,
      authority: event.authority,
      authority_version: event.authority_version,
      timestamp: event.timestamp,
      payload_version: event.payload_version,
      payload: event.payload,
      ReplayID: event.ReplayID, // Influences replay hashes
      PreviousEventHash: event.PreviousEventHash,
      ReducerHash: event.ReducerHash
    };
    return CanonicalAuthority.hash(canonicalEvent);
  }

  /**
   * Compute replay hash (includes witness)
   * Priority 3: Runtime Identity Separation - Use ReplayID for replay hashes
   * @param {Object} event - Event to hash
   * @returns {string} Replay hash
   */
  static _computeReplayHash(event) {
    const replayData = {
      CanonicalEventHash: event.CanonicalEventHash,
      WitnessHash: event.WitnessHash,
      ReplayID: event.ReplayID // Influences replay hashes
    };
    return CanonicalAuthority.hash(replayData);
  }

  /**
   * Compute canonical hash (delegated to CanonicalAuthority)
   * @param {Object} event - Event to hash
   * @returns {string} Canonical hash
   */
  static _computeCanonicalHash(event) {
    return CanonicalAuthority.hashEventCanonical(event);
  }
}

module.exports = { StandardEventSchema };
