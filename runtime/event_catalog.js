/**
 * Event Catalog
 * 
 * Phase 3.15 — Event Catalog
 * 
 * Event schema validation.
 * ExecutionRuntime validates events through EventCatalog.
 * Only Runtime publishes.
 */

class EventCatalog {
  constructor() {
    this._schemas = new Map(); // event_type → schema
    this._registerDefaultSchemas();
  }

  /**
   * Register event schema
   * 
   * @param {string} eventType - Event type
   * @param {Object} schema - Event schema
   */
  register(eventType, schema) {
    this._schemas.set(eventType, schema);
    console.log(`[EventCatalog] Registered event schema: ${eventType}`);
  }

  /**
   * Validate event
   * 
   * @param {Object} event - Event to validate
   * @returns {Object} Validation result
   */
  validate(event) {
    const errors = [];

    if (!event.type) {
      errors.push('Missing event type');
      return { valid: false, errors: errors };
    }

    const schema = this._schemas.get(event.type);
    
    if (!schema) {
      errors.push(`Unknown event type: ${event.type}`);
      return { valid: false, errors: errors };
    }

    // Validate required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!event.payload || !(field in event.payload)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate field types
    if (schema.fields) {
      for (const [field, fieldType] of Object.entries(schema.fields)) {
        if (event.payload && field in event.payload) {
          const value = event.payload[field];
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          
          if (actualType !== fieldType) {
            errors.push(`Field ${field} has type ${actualType}, expected ${fieldType}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  /**
   * Check if event type is registered
   * 
   * @param {string} eventType - Event type
   * @returns {boolean} True if registered
   */
  has(eventType) {
    return this._schemas.has(eventType);
  }

  /**
   * Get event schema
   * 
   * @param {string} eventType - Event type
   * @returns {Object} Event schema
   */
  getSchema(eventType) {
    return this._schemas.get(eventType);
  }

  /**
   * Get all registered event types
   * 
   * @returns {Array} Event types
   */
  getEventTypes() {
    return Array.from(this._schemas.keys());
  }

  /**
   * Register default event schemas
   */
  _registerDefaultSchemas() {
    // EmbeddingCreated
    this.register('EmbeddingCreated', {
      required: ['artifact_id', 'source_artifact_id', 'chunks', 'dimension'],
      fields: {
        artifact_id: 'string',
        source_artifact_id: 'string',
        chunks: 'number',
        dimension: 'number',
      },
    });

    // InferenceCompleted
    this.register('InferenceCompleted', {
      required: ['artifact_id', 'model', 'tokens', 'latency'],
      fields: {
        artifact_id: 'string',
        model: 'string',
        tokens: 'number',
        latency: 'number',
      },
    });

    // VerificationPassed
    this.register('VerificationPassed', {
      required: ['artifact_id', 'verification_id'],
      fields: {
        artifact_id: 'string',
        verification_id: 'string',
      },
    });

    // VerificationFailed
    this.register('VerificationFailed', {
      required: ['artifact_id', 'verification_id', 'errors'],
      fields: {
        artifact_id: 'string',
        verification_id: 'string',
        errors: 'array',
      },
    });

    // LineageRegistered
    this.register('LineageRegistered', {
      required: ['edge_id', 'parent_artifact_id', 'child_artifact_id'],
      fields: {
        edge_id: 'string',
        parent_artifact_id: 'string',
        child_artifact_id: 'string',
        authority: 'string',
        execution_id: 'string',
      },
    });

    // WitnessGenerated
    this.register('WitnessGenerated', {
      required: ['witness_id', 'execution_id', 'authority', 'hash'],
      fields: {
        witness_id: 'string',
        execution_id: 'string',
        authority: 'string',
        hash: 'string',
      },
    });

    // ExecutionStarted
    this.register('ExecutionStarted', {
      required: ['execution_id', 'authority_id', 'node_id'],
      fields: {
        execution_id: 'string',
        authority_id: 'string',
        node_id: 'string',
      },
    });

    // ExecutionCompleted
    this.register('ExecutionCompleted', {
      required: ['execution_id', 'authority_id', 'node_id'],
      fields: {
        execution_id: 'string',
        authority_id: 'string',
        node_id: 'string',
        success: 'boolean',
        artifact_ids: 'array',
      },
    });

    // ExecutionFailed
    this.register('ExecutionFailed', {
      required: ['execution_id', 'authority_id', 'node_id', 'error'],
      fields: {
        execution_id: 'string',
        authority_id: 'string',
        node_id: 'string',
        error: 'string',
      },
    });

    // CertificationCompleted
    this.register('CertificationCompleted', {
      required: ['certification_id', 'artifact_id', 'certified'],
      fields: {
        certification_id: 'string',
        artifact_id: 'string',
        certified: 'boolean',
      },
    });

    // ArtifactPublished
    this.register('ArtifactPublished', {
      required: ['publication_id', 'artifact_id', 'artifact_type'],
      fields: {
        publication_id: 'string',
        artifact_id: 'string',
        artifact_type: 'string',
      },
    });

    // PublicationRejected
    this.register('PublicationRejected', {
      required: ['publication_id', 'artifact_id'],
      fields: {
        publication_id: 'string',
        artifact_id: 'string',
        errors: 'array',
        warnings: 'array',
      },
    });
  }

  /**
   * Check health
   */
  async health() {
    return {
      healthy: true,
      message: 'Event catalog operational',
      registered_events: this._schemas.size,
    };
  }
}

module.exports = { EventCatalog };
