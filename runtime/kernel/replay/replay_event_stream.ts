/**
 * REPLAY EVENT STREAM
 *
 * CONSTITUTIONAL ROLE
 *
 * Authority: YES
 * Creates Truth: YES (Event Stream)
 * Derives Truth: NO
 * Stores Truth: NO (delegates to persistence adapter)
 * Presents Truth: NO
 *
 * Constitutional Authority Class: EVENT_STREAM
 *
 * Truth Source:
 * This component IS the constitutional event stream authority.
 *
 * Constitutional Flow:
 * 1. Accepts events via appendEvent() with admission policy
 * 2. Enforces admission policy (currently AllowAllAdmissionPolicy)
 * 3. Stores immutable event stream
 * 4. Provides events to ReplayStateMachine for state derivation
 *
 * This component DOES create constitutional truth.
 * It is the sole authority for event stream origination.
 *
 * Pure TypeScript implementation of replay event stream.
 *
 * Requirements:
 * - deterministic event streaming
 * - immutable event stream
 * - no side effects
 * - pure functional execution
 */

import { CanonicalEventEnvelope } from './canonical_event_envelope';
import { DeterministicFailureFactory } from './deterministic_failure';
import { REPLAY_LIMITS } from './replay_limits';
import { AdmissionPolicy, AllowAllAdmissionPolicy } from './policy';

export class ReplayEventStream {
  private readonly events: CanonicalEventEnvelope[];
  private readonly streamVersion: string;

  constructor(events: CanonicalEventEnvelope[], streamVersion: string = '1.0') {
    // Enforce MAX_EVENTS limit
    if (events.length > REPLAY_LIMITS.MAX_EVENTS) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.executionLimitExceeded(
          'MAX_EVENTS',
          REPLAY_LIMITS.MAX_EVENTS,
          events.length
        )
      );
    }

    // Enforce payload size limits
    for (const event of events) {
      const payloadSize = JSON.stringify(event.getPayload()).length;
      if (payloadSize > REPLAY_LIMITS.MAX_EVENT_PAYLOAD_SIZE) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.executionLimitExceeded(
            'MAX_EVENT_PAYLOAD_SIZE',
            REPLAY_LIMITS.MAX_EVENT_PAYLOAD_SIZE,
            payloadSize
          )
        );
      }
    }

    this.events = [...events]; // Immutable copy
    this.streamVersion = streamVersion;
  }

  /**
   * Get all events in stream
   */
  getEvents(): CanonicalEventEnvelope[] {
    return [...this.events]; // Immutable copy
  }

  /**
   * Get event by ID
   */
  getEventById(eventId: string): CanonicalEventEnvelope | null {
    return this.events.find(e => e.getEventId() === eventId) || null;
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: string): CanonicalEventEnvelope[] {
    return this.events.filter(e => e.getEventType() === eventType);
  }

  /**
   * Get events by actor
   */
  getEventsByActor(actorId: string): CanonicalEventEnvelope[] {
    return this.events.filter(e => e.getActorId() === actorId);
  }

  /**
   * Get events in lineage chain
   */
  getLineageChain(eventId: string): CanonicalEventEnvelope[] {
    const chain: CanonicalEventEnvelope[] = [];
    const visited = new Set<string>();
    
    const traverse = (currentId: string, depth: number = 0): void => {
      // Constitutional depth guard to prevent stack overflow
      if (depth > REPLAY_LIMITS.MAX_LINEAGE_DEPTH) {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.executionLimitExceeded(
            'MAX_LINEAGE_DEPTH',
            REPLAY_LIMITS.MAX_LINEAGE_DEPTH,
            depth
          )
        );
      }

      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const event = this.getEventById(currentId);
      if (event) {
        chain.push(event);
        const lineage = event.getLineage();
        for (const parentId of lineage.parent_event_ids) {
          traverse(parentId, depth + 1);
        }
      }
    };
    
    traverse(eventId);
    return chain.reverse(); // Return in chronological order
  }

  /**
   * Get stream version
   */
  getStreamVersion(): string {
    return this.streamVersion;
  }

  /**
   * Get stream size
   */
  getStreamSize(): number {
    return this.events.length;
  }

  /**
   * Append event to stream (returns new stream)
   * 
   * Constitutional admission boundary:
   * - Policy → AllowAll → appendEvent
   * - Future: Policy → Legality Rules → appendEvent
   */
  appendEvent(
    event: CanonicalEventEnvelope,
    policy: AdmissionPolicy = new AllowAllAdmissionPolicy()
  ): ReplayEventStream {
    policy.admit(event);
    return new ReplayEventStream([...this.events, event], this.streamVersion);
  }

  /**
   * Create stream from JSON
   */
  static fromJSON(json: unknown): ReplayEventStream {
    if (!Array.isArray(json)) {
      throw DeterministicFailureFactory.toError(
        DeterministicFailureFactory.create(
          'INVALID_EVENT_STREAM' as any,
          'CANONICALIZATION' as any,
          { reason: 'Invalid event stream JSON' }
        )
      );
    }

    const events = json.map((item: unknown) => {
      if (!item || typeof item !== 'object') {
        throw DeterministicFailureFactory.toError(
          DeterministicFailureFactory.create(
            'INVALID_EVENT' as any,
            'CANONICALIZATION' as any,
            { reason: 'Invalid event in stream' }
          )
        );
      }
      return new CanonicalEventEnvelope(item as any);
    });
    
    return new ReplayEventStream(events);
  }

  /**
   * Convert stream to JSON
   */
  toJSON(): unknown[] {
    return this.events.map(e => e.toJSON());
  }
}
