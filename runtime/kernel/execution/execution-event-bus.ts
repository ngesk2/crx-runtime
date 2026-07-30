/**
 * Execution Event Bus
 * Event-driven execution system replacing hook callbacks.
 * Hooks subscribe to events rather than implementing before/after/error/cleanup.
 * Constitutional event flow: ExecutionStarted → ValidationCompleted → CapabilityExecuted → ArtifactProduced → ReplayCommitted → WitnessGenerated → ObjectStored → ProjectionBuilt → KnowledgeUpdated → GovernanceEvaluated
 */

import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';
import { IIdentityAuthority } from '../identity/identity-authority';
import { IKnowledgeAuthority } from '../knowledge/knowledge-authority-interface';
import { ReplayAuthority } from '../replay/replay-authority';
import { IProviderAuthority } from '../providers/provider-authority-interface';
import { GitHubProvider, GitHubRequest, GitHubOperation } from '../../adapters/github-provider-adapter';

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
  
  // Pipeline authorities
  private identityAuthority?: IIdentityAuthority;
  private knowledgeAuthority?: IKnowledgeAuthority;
  private replayAuthority?: ReplayAuthority;
  private providerAuthority?: IProviderAuthority;
  private gitHubProvider?: GitHubProvider;
  
  constructor() {
    this.replayAuthority = new ReplayAuthority();
    this.gitHubProvider = new GitHubProvider();
  }
  
  // Wire authorities into the pipeline
  setIdentityAuthority(authority: IIdentityAuthority): void {
    this.identityAuthority = authority;
  }
  
  setKnowledgeAuthority(authority: IKnowledgeAuthority): void {
    this.knowledgeAuthority = authority;
  }
  
  setReplayAuthority(authority: ReplayAuthority): void {
    this.replayAuthority = authority;
  }
  
  setProviderAuthority(authority: IProviderAuthority): void {
    this.providerAuthority = authority;
  }
  
  setGitHubProvider(provider: GitHubProvider): void {
    this.gitHubProvider = provider;
  }
  
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
    
    // Pipeline: Event enters runtime
    await this.processEventThroughPipeline(event);
    
    // Notify subscribers
    const handlers = this.subscribers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler(event);
    }
  }
  
  // Constitutional event pipeline wiring
  private async processEventThroughPipeline(event: ConstitutionalEvent): Promise<void> {
    // Step 1: Identity Authority resolves actor
    if (this.identityAuthority && event.data.actorId) {
      const actor = await this.identityAuthority.getActor(event.data.actorId as string);
      if (actor) {
        event.data.actor = actor;
      }
    }
    
    // Step 2: Evidence Authority stores payload (via Identity Authority evidence operations)
    if (this.identityAuthority && event.data.evidencePayload) {
      const evidence = await this.identityAuthority.createEvidence(event.data.evidencePayload as any);
      event.data.evidenceId = evidence.id;
    }
    
    // Step 3: GitHub Provider executes operations
    if (this.gitHubProvider && event.data.gitHubOperation) {
      const gitHubRequest: GitHubRequest = {
        requestId: event.eventId,
        capabilityId: 'github',
        input: event.data.gitHubInput,
        parameters: (event.data.gitHubParameters || {}) as Record<string, unknown>,
        timeout: 30000,
        priority: 1,
        operation: event.data.gitHubOperation as GitHubOperation,
        repository: event.data.repository as string,
        owner: event.data.owner as string,
        installationId: event.data.installationId as string,
        issueNumber: event.data.issueNumber as number,
        prNumber: event.data.prNumber as number,
        sha: event.data.sha as string,
        webhookPayload: event.data.webhookPayload,
      };
      
      const response = await this.gitHubProvider.execute(gitHubRequest);
      event.data.gitHubResponse = response;
      event.data.gitHubSuccess = response.success;
    }
    
    // Step 4: Graph mutates (via Knowledge Authority graph operations)
    if (this.knowledgeAuthority && event.data.graphMutation) {
      const mutation = event.data.graphMutation as any;
      if (mutation.type === 'createNode') {
        await this.knowledgeAuthority.createNode(mutation.data);
      } else if (mutation.type === 'createEdge') {
        await this.knowledgeAuthority.createEdge(mutation.data);
      }
    }
    
    // Step 5: Knowledge indexes
    if (this.knowledgeAuthority && event.data.knowledgePayload) {
      await this.knowledgeAuthority.ingest(event.data.knowledgePayload as any);
    }
    
    // Step 6: Replay transcript updated
    if (this.replayAuthority) {
      const transcriptId = this.replayAuthority.generateTranscriptId(event.executionId);
      event.data.transcriptId = transcriptId;
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
