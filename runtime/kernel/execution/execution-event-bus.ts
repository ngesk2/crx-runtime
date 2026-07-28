/**
 * Execution Event Bus
 * Event-driven execution system replacing hook callbacks.
 * Hooks subscribe to events rather than implementing before/after/error/cleanup.
 * Constitutional event flow: ExecutionStarted → ValidationCompleted → CapabilityExecuted → ArtifactProduced → ReplayCommitted → WitnessGenerated → ObjectStored → ProjectionBuilt → KnowledgeUpdated → GovernanceEvaluated
 */

import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ConstitutionalEvent {
  eventId: string;
  eventType: ConstitutionalEventType;
  timestamp: string;
  executionId: string;
  data: Record<string, unknown>;
}

export enum ConstitutionalEventType {
  ExecutionStarted = 'ExecutionStarted',
  ValidationCompleted = 'ValidationCompleted',
  CapabilityExecuted = 'CapabilityExecuted',
  ArtifactProduced = 'ArtifactProduced',
  ReplayCommitted = 'ReplayCommitted',
  WitnessGenerated = 'WitnessGenerated',
  ObjectStored = 'ObjectStored',
  ProjectionBuilt = 'ProjectionBuilt',
  KnowledgeUpdated = 'KnowledgeUpdated',
  GovernanceEvaluated = 'GovernanceEvaluated',
}

export type EventHandler = (event: ConstitutionalEvent) => void | Promise<void>;

export class ExecutionEventBus {
  private subscribers: Map<ConstitutionalEventType, EventHandler[]> = new Map();
  private eventHistory: ConstitutionalEvent[] = [];
  private maxHistorySize: number = 1000;
  
  subscribe(eventType: ConstitutionalEventType, handler: EventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(handler);
  }
  
  unsubscribe(eventType: ConstitutionalEventType, handler: EventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  async publish(event: ConstitutionalEvent): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
    
    // Notify subscribers
    const handlers = this.subscribers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
  
  getHistory(): ConstitutionalEvent[] {
    return [...this.eventHistory];
  }
  
  getHistoryByExecution(executionId: string): ConstitutionalEvent[] {
    return this.eventHistory.filter(e => e.executionId === executionId);
  }
  
  getHistoryByType(eventType: ConstitutionalEventType): ConstitutionalEvent[] {
    return this.eventHistory.filter(e => e.eventType === eventType);
  }
  
  clearHistory(): void {
    this.eventHistory = [];
  }
}

export class ExecutionEventBuilder {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  buildEvent(
    eventType: ConstitutionalEventType,
    executionId: string,
    data: Record<string, unknown> = {}
  ): ConstitutionalEvent {
    const timestamp = this.clock.now();
    return {
      eventId: this.identityService.generateEventId(eventType, timestamp),
      eventType,
      timestamp,
      executionId,
      data,
    };
  }
}
