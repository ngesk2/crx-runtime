/**
 * CANONICAL EVENT ENVELOPE
 * 
 * Pure TypeScript implementation of canonical event envelope.
 * No infrastructure dependencies.
 * No environment variable access.
 * No process/global mutation.
 */

import { CanonicalEventEnvelope as CanonicalEventEnvelopeType } from './replay_types';
import { CanonicalJson } from './canonical_json';
import { DeterministicFailureFactory } from './deterministic_failure';
import { deepFreeze } from './utils/deep_freeze';
import { utf8Encode, base64UrlEncode } from './byte_utils';

export class CanonicalEventEnvelope {
  private readonly envelope: CanonicalEventEnvelopeType;

  constructor(envelope: CanonicalEventEnvelopeType) {
    this.validateEnvelope(envelope);
    this.envelope = this.immutableCopy(envelope);
  }

  private validateEnvelope(envelope: CanonicalEventEnvelopeType): void {
    if (!envelope.event_id || typeof envelope.event_id !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidEventId()
      );
    }
    if (!envelope.event_type || typeof envelope.event_type !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidEventType()
      );
    }
    if (!envelope.actor_id || typeof envelope.actor_id !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidActorId()
      );
    }
    if (!envelope.timestamp || typeof envelope.timestamp !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidTimestamp()
      );
    }
    if (!envelope.lineage || typeof envelope.lineage !== 'object') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidLineageStructure()
      );
    }
    if (!Array.isArray(envelope.lineage.parent_event_ids)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidParentEventIds()
      );
    }
    if (!envelope.schema_version || typeof envelope.schema_version !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidSchemaVersion()
      );
    }
    if (!envelope.replay_version || typeof envelope.replay_version !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidReplayVersion()
      );
    }
    if (!envelope.policy_version || typeof envelope.policy_version !== 'string') {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.invalidPolicyVersion()
      );
    }
  }

  private immutableCopy(envelope: CanonicalEventEnvelopeType): CanonicalEventEnvelopeType {
    return JSON.parse(CanonicalJson.canonicalize(envelope));
  }

  getEventId(): string {
    return this.envelope.event_id;
  }

  getEventType(): string {
    return this.envelope.event_type;
  }

  getActorId(): string {
    return this.envelope.actor_id;
  }

  getTimestamp(): string {
    return this.envelope.timestamp;
  }

  getPayload(): unknown {
    return deepFreeze(JSON.parse(JSON.stringify(this.envelope.payload)));
  }

  getLineage(): { parent_event_ids: string[] } {
    return {
      parent_event_ids: [...this.envelope.lineage.parent_event_ids]
    };
  }

  getSchemaVersion(): string {
    return this.envelope.schema_version;
  }

  getReplayVersion(): string {
    return this.envelope.replay_version;
  }

  getPolicyVersion(): string {
    return this.envelope.policy_version;
  }

  toJSON(): CanonicalEventEnvelopeType {
    return this.immutableCopy(this.envelope);
  }

  toBytes(): string {
    const canonical = CanonicalJson.canonicalize(this.envelope);
    const bytes = utf8Encode(canonical);
    return base64UrlEncode(bytes);
  }
}
