/**
 * PING Transition to Canonical Event Mapper
 * PATCH 4: Immutable Transitions
 * 
 * Maps PING object transitions to canonical events in the existing events table
 */

import { PingTransition } from './schemas/ping-objects';

/**
 * Canonical Event Format (from database/events.sql)
 */
export interface CanonicalEvent {
  stream: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}

/**
 * PING Transition to Canonical Event Mapper
 */
export class PingTransitionMapper {
  private static readonly PING_STREAM_PREFIX = 'ping';

  /**
   * Convert PING transition to canonical event
   */
  static toCanonicalEvent(transition: PingTransition): CanonicalEvent {
    const stream = `${this.PING_STREAM_PREFIX}.${transition.object_id}`;
    const event_type = `ping.${transition.operation}`;
    const created_at = transition.timestamp;

    const payload = {
      transition_id: transition.id,
      object_id: transition.object_id,
      operation: transition.operation,
      actor_id: transition.actor_id,
      sequence: transition.sequence,
      previous_transition: transition.previous_transition,
      payload_hash: transition.payload_hash,
      proof: transition.proof,
      metadata: transition.metadata
    };

    return {
      stream,
      event_type,
      payload,
      created_at
    };
  }

  /**
   * Generate stream name for object
   */
  static generateStream(objectId: string): string {
    return `${this.PING_STREAM_PREFIX}.${objectId}`;
  }

  /**
   * Generate event type for operation
   */
  static generateEventType(operation: string): string {
    return `ping.${operation}`;
  }

  /**
   * Convert canonical event back to PING transition
   */
  static fromCanonicalEvent(event: CanonicalEvent): PingTransition {
    const payload = event.payload as any;

    return {
      id: payload.transition_id,
      object_id: payload.object_id,
      operation: payload.operation,
      actor_id: payload.actor_id,
      sequence: payload.sequence,
      previous_transition: payload.previous_transition,
      payload_hash: payload.payload_hash,
      timestamp: event.created_at,
      proof: payload.proof,
      metadata: payload.metadata
    };
  }

  /**
   * Validate that canonical event contains required PING transition fields
   */
  static validateEvent(event: CanonicalEvent): boolean {
    const payload = event.payload as any;
    return !!(
      payload.transition_id &&
      payload.object_id &&
      payload.operation &&
      payload.actor_id &&
      payload.sequence !== undefined &&
      payload.payload_hash
    );
  }
}
