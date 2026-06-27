/**
 * Event Store
 * Stores replay events and transcripts.
 */

import { ReplayEventEnvelope } from './event-envelope';

export interface EventStore {
  storeEnvelope(envelope: ReplayEventEnvelope): Promise<void>;
  getEnvelope(envelopeId: string): Promise<ReplayEventEnvelope | null>;
  listEnvelopes(stage?: string): Promise<ReplayEventEnvelope[]>;
}

export class InMemoryEventStore implements EventStore {
  private envelopes: Map<string, ReplayEventEnvelope> = new Map();
  
  async storeEnvelope(envelope: ReplayEventEnvelope): Promise<void> {
    this.envelopes.set(envelope.envelope_id, envelope);
  }
  
  async getEnvelope(envelopeId: string): Promise<ReplayEventEnvelope | null> {
    return this.envelopes.get(envelopeId) || null;
  }
  
  async listEnvelopes(stage?: string): Promise<ReplayEventEnvelope[]> {
    const allEnvelopes = Array.from(this.envelopes.values());
    
    if (stage) {
      return allEnvelopes.filter(e => e.stage === stage);
    }
    
    return allEnvelopes;
  }
}
