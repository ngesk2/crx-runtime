/**
 * Event Service
 *
 * Core event sourcing service.
 * Provides append, replay, snapshot, witness, and verify operations.
 *
 * This is the foundation for all PING services.
 */

/**
 * Event Interface
 */
export interface Event {
  id: string;
  aggregateId: string;
  aggregateType: string;
  type: string;
  data: unknown;
  metadata?: Record<string, unknown>;
  timestamp: string;
  version: number;
}

/**
 * Snapshot Interface
 */
export interface Snapshot {
  aggregateId: string;
  aggregateType: string;
  state: unknown;
  version: number;
  timestamp: string;
}

/**
 * Witness Interface
 * Proof of event integrity
 */
export interface Witness {
  eventId: string;
  hash: string;
  signature: string;
  timestamp: string;
}

/**
 * Event Service Interface
 */
export interface EventService {
  /**
   * Append an event to the event store
   */
  appendEvent(event: Event): Promise<void>;

  /**
   * Append multiple events atomically
   */
  appendEvents(events: Event[]): Promise<void>;

  /**
   * Replay events for an aggregate
   */
  replay(aggregateId: string): Promise<Event[]>;

  /**
   * Create a snapshot of an aggregate
   */
  snapshot(aggregateId: string): Promise<Snapshot>;

  /**
   * Load a snapshot of an aggregate
   */
  loadSnapshot(aggregateId: string): Promise<Snapshot | null>;

  /**
   * Witness an event (create proof of integrity)
   */
  witness(event: Event): Promise<Witness>;

  /**
   * Verify an event against its witness
   */
  verify(event: Event, witness: Witness): Promise<boolean>;

  /**
   * Get events after a cursor (for replay)
   */
  getEventsAfter(cursor: string): Promise<Event[]>;
}

/**
 * In-Memory Event Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Events are lost on restart.
 * Use only for development/testing.
 */
export class InMemoryEventService implements EventService {
  private events: Map<string, Event[]> = new Map();
  private snapshots: Map<string, Snapshot> = new Map();
  private witnesses: Map<string, Witness> = new Map();

  async appendEvent(event: Event): Promise<void> {
    const aggregateEvents = this.events.get(event.aggregateId) || [];
    aggregateEvents.push(event);
    this.events.set(event.aggregateId, aggregateEvents);
  }

  async appendEvents(events: Event[]): Promise<void> {
    for (const event of events) {
      await this.appendEvent(event);
    }
  }

  async replay(aggregateId: string): Promise<Event[]> {
    return this.events.get(aggregateId) || [];
  }

  async snapshot(aggregateId: string): Promise<Snapshot> {
    const events = await this.replay(aggregateId);
    const latestEvent = events[events.length - 1];

    if (!latestEvent) {
      throw new Error(`No events found for aggregate ${aggregateId}`);
    }

    const snapshot: Snapshot = {
      aggregateId,
      aggregateType: latestEvent.aggregateType,
      state: this.buildState(events),
      version: latestEvent.version,
      timestamp: new Date().toISOString(),
    };

    this.snapshots.set(aggregateId, snapshot);
    return snapshot;
  }

  async loadSnapshot(aggregateId: string): Promise<Snapshot | null> {
    return this.snapshots.get(aggregateId) || null;
  }

  async witness(event: Event): Promise<Witness> {
    const hash = this.computeHash(event);
    const signature = this.computeSignature(hash);

    const witness: Witness = {
      eventId: event.id,
      hash,
      signature,
      timestamp: new Date().toISOString(),
    };

    this.witnesses.set(event.id, witness);
    return witness;
  }

  async verify(event: Event, witness: Witness): Promise<boolean> {
    const computedHash = this.computeHash(event);
    return computedHash === witness.hash;
  }

  async getEventsAfter(cursor: string): Promise<Event[]> {
    // For in-memory, treat cursor as event ID
    const allEvents = Array.from(this.events.values()).flat();
    const cursorIndex = allEvents.findIndex(e => e.id === cursor);
    if (cursorIndex === -1) {
      return allEvents;
    }
    return allEvents.slice(cursorIndex + 1);
  }

  private buildState(events: Event[]): unknown {
    // Simple state building - in production, this would use aggregate-specific logic
    return {
      events: events.length,
      lastEvent: events[events.length - 1],
    };
  }

  private computeHash(event: Event): string {
    // Simple hash computation - in production, use cryptographic hash
    const data = JSON.stringify(event);
    return Buffer.from(data).toString('base64');
  }

  private computeSignature(hash: string): string {
    // Simple signature - in production, use cryptographic signature
    return `signed:${hash}`;
  }
}

/**
 * Singleton instance
 */
export const eventService = new InMemoryEventService();
