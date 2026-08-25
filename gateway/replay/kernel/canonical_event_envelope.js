"use strict";
/**
 * CANONICAL EVENT ENVELOPE
 *
 * Pure TypeScript implementation of canonical event envelope.
 * No infrastructure dependencies.
 * No environment variable access.
 * No process/global mutation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalEventEnvelope = void 0;
const canonical_json_1 = require("./canonical_json");
class CanonicalEventEnvelope {
    envelope;
    constructor(envelope) {
        this.validateEnvelope(envelope);
        this.envelope = this.immutableCopy(envelope);
    }
    validateEnvelope(envelope) {
        if (!envelope.event_id || typeof envelope.event_id !== 'string') {
            throw new Error('Invalid event_id');
        }
        if (!envelope.event_type || typeof envelope.event_type !== 'string') {
            throw new Error('Invalid event_type');
        }
        if (!envelope.actor_id || typeof envelope.actor_id !== 'string') {
            throw new Error('Invalid actor_id');
        }
        if (!envelope.timestamp || typeof envelope.timestamp !== 'string') {
            throw new Error('Invalid timestamp');
        }
        if (!envelope.lineage || typeof envelope.lineage !== 'object') {
            throw new Error('Invalid lineage');
        }
        if (!Array.isArray(envelope.lineage.parent_event_ids)) {
            throw new Error('Invalid parent_event_ids');
        }
        if (!envelope.schema_version || typeof envelope.schema_version !== 'string') {
            throw new Error('Invalid schema_version');
        }
        if (!envelope.replay_version || typeof envelope.replay_version !== 'string') {
            throw new Error('Invalid replay_version');
        }
        if (!envelope.policy_version || typeof envelope.policy_version !== 'string') {
            throw new Error('Invalid policy_version');
        }
    }
    immutableCopy(envelope) {
        return JSON.parse(canonical_json_1.CanonicalJson.stringify(envelope));
    }
    getEventId() {
        return this.envelope.event_id;
    }
    getEventType() {
        return this.envelope.event_type;
    }
    getActorId() {
        return this.envelope.actor_id;
    }
    getTimestamp() {
        return this.envelope.timestamp;
    }
    getPayload() {
        return this.envelope.payload;
    }
    getLineage() {
        return this.envelope.lineage;
    }
    getSchemaVersion() {
        return this.envelope.schema_version;
    }
    getReplayVersion() {
        return this.envelope.replay_version;
    }
    getPolicyVersion() {
        return this.envelope.policy_version;
    }
    toJSON() {
        return this.immutableCopy(this.envelope);
    }
    toBytes() {
        return Buffer.from(canonical_json_1.CanonicalJson.stringify(this.envelope)).toString('base64');
    }
}
exports.CanonicalEventEnvelope = CanonicalEventEnvelope;
