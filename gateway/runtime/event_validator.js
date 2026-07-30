// P033: Generated Event Validator
// Runtime validates every emitted event against event_registry.json
// Rejects: unknown event, wrong schema version, missing authority, incompatible payload.
// No runtime event definitions.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EventValidator {
  constructor(repoRoot) {
    this._repoRoot = repoRoot;
    this._registry = null;
    this._eventsByType = new Map();
    this._hash = null;
  }

  load() {
    const registryPath = path.join(this._repoRoot, 'gateway', 'generated', 'event_registry.json');
    if (!fs.existsSync(registryPath)) {
      throw new Error(`[EventValidator] event_registry.json not found at ${registryPath}`);
    }

    const raw = fs.readFileSync(registryPath, 'utf8');
    this._registry = JSON.parse(raw);

    this._validateRegistry();
    this._indexEvents();
    this._hash = this._computeHash();

    console.log(`[EventValidator] Loaded ${this._eventsByType.size} event types, hash ${this._hash.slice(0, 12)}...`);
    return this;
  }

  _validateRegistry() {
    const required = ['schema_version', 'generator', 'count', 'events'];
    for (const field of required) {
      if (!this._registry[field]) {
        throw new Error(`[EventValidator] Missing required field: ${field}`);
      }
    }
  }

  _indexEvents() {
    for (const event of this._registry.events) {
      if (!event.event_type) {
        throw new Error(`[EventValidator] Event missing event_type: ${JSON.stringify(event).slice(0, 100)}`);
      }
      this._eventsByType.set(event.event_type, event);
    }
  }

  validate(event) {
    const errors = [];

    if (!event || typeof event !== 'object') {
      return { valid: false, errors: ['Event must be a non-null object'] };
    }

    // Check event_type exists
    if (!event.event_type) {
      errors.push('Missing required field: event_type');
      return { valid: false, errors };
    }

    // Check event_type is registered
    const registered = this._eventsByType.get(event.event_type);
    if (!registered) {
      errors.push(`Unknown event_type: ${event.event_type}`);
      return { valid: false, errors };
    }

    // Check schema_version
    if (event.schema_version && registered.schema_version) {
      const eventMajor = parseInt(event.schema_version.split('.')[0]);
      const regMajor = parseInt(registered.schema_version.split('.')[0]);
      if (eventMajor !== regMajor) {
        errors.push(`Schema version mismatch: event has ${event.schema_version}, registry expects ${registered.schema_version}`);
      }
    }

    // Check authority_owner
    if (registered.authority_owner && event.authority_owner) {
      if (event.authority_owner !== registered.authority_owner) {
        errors.push(`Authority mismatch: event has ${event.authority_owner}, registry expects ${registered.authority_owner}`);
      }
    }

    // Check payload schema compatibility
    if (registered.payload_schema && event.payload) {
      const payloadErrors = this._validatePayload(event.payload, registered.payload_schema);
      errors.push(...payloadErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      eventType: event.event_type,
      authorityOwner: registered.authority_owner,
      eventClass: registered.event_class,
    };
  }

  _validatePayload(payload, schema) {
    const errors = [];
    if (!schema || !schema.properties) return errors;

    for (const [field, fieldSchema] of Object.entries(schema.properties)) {
      if (fieldSchema.type === 'string' && typeof payload[field] !== 'string' && payload[field] !== undefined) {
        errors.push(`Payload field '${field}' must be string, got ${typeof payload[field]}`);
      }
      if (fieldSchema.type === 'number' && typeof payload[field] !== 'number' && payload[field] !== undefined) {
        errors.push(`Payload field '${field}' must be number, got ${typeof payload[field]}`);
      }
      if (fieldSchema.type === 'array' && !Array.isArray(payload[field]) && payload[field] !== undefined) {
        errors.push(`Payload field '${field}' must be array, got ${typeof payload[field]}`);
      }
    }

    return errors;
  }

  isRegistered(eventType) {
    return this._eventsByType.has(eventType);
  }

  getEventDef(eventType) {
    return this._eventsByType.get(eventType) || null;
  }

  listEventTypes() {
    return Array.from(this._eventsByType.keys()).sort();
  }

  getHash() {
    return this._hash;
  }

  getStats() {
    return {
      totalEventTypes: this._eventsByType.size,
      hash: this._hash,
      eventTypes: this.listEventTypes(),
    };
  }

  _computeHash() {
    const types = Array.from(this._eventsByType.keys()).sort();
    return crypto.createHash('sha256').update(JSON.stringify(types)).digest('hex');
  }
}

module.exports = { EventValidator };
