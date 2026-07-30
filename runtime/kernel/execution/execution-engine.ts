/**
 * Constitutional Execution Engine
 * 
 * Canonical execution spine - all providers must route through this.
 * 
 * execute()
 *     ↓
 * Identity
 *     ↓
 * Policy
 *     ↓
 * Provider
 *     ↓
 * Evidence
 *     ↓
 * Knowledge Graph
 *     ↓
 * Replay
 *     ↓
 * Projection
 *     ↓
 * Presentation
 * 
 * No provider should bypass this execution spine.
 */

import { IIdentityAuthority } from '../identity/identity-authority';
import { IKnowledgeAuthority } from '../knowledge/knowledge-authority-interface';
import { ReplayAuthority } from '../replay/replay-authority';
import { IProviderAuthority, ExecutionProvider, ExecutionRequest, ExecutionResponse } from '../providers/provider-authority-interface';
import { ExecutionEventBus, ConstitutionalEventType, ExecutionEventBuilder } from './execution-event-bus';

/**
 * Constitutional Execution Context
 * Immutable execution object
 */
export interface ConstitutionalExecutionContext {
  executionId: string;
  actorId: string;
  authorities: string[];
  capabilities: string[];
  input: unknown;
  providerRequest: ExecutionRequest;
  providerResponse?: ExecutionResponse;
  evidenceIds: string[];
  knowledgeIds: string[];
  projectionIds: string[];
  replayTranscriptId: string;
  timestamp: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

/**
 * Execution Engine Options
 */
export interface ExecutionEngineOptions {
  enablePolicyCheck?: boolean;
  enableEvidenceStorage?: boolean;
  enableKnowledgeIndexing?: boolean;
  enableReplay?: boolean;
  enableProjection?: boolean;
}

/**
 * Constitutional Execution Engine
 * Central execution spine for all providers
 */
export class ExecutionEngine {
  private eventBus: ExecutionEventBus;
  private identityAuthority?: IIdentityAuthority;
  private knowledgeAuthority?: IKnowledgeAuthority;
  private replayAuthority?: ReplayAuthority;
  private providerAuthority?: IProviderAuthority;
  private options: ExecutionEngineOptions;

  constructor(options: ExecutionEngineOptions = {}) {
    this.eventBus = new ExecutionEventBus();
    this.options = {
      enablePolicyCheck: true,
      enableEvidenceStorage: true,
      enableKnowledgeIndexing: true,
      enableReplay: true,
      enableProjection: true,
      ...options,
    };
  }

  // Wire authorities
  setIdentityAuthority(authority: IIdentityAuthority): void {
    this.identityAuthority = authority;
    this.eventBus.setIdentityAuthority(authority);
  }

  setKnowledgeAuthority(authority: IKnowledgeAuthority): void {
    this.knowledgeAuthority = authority;
    this.eventBus.setKnowledgeAuthority(authority);
  }

  setReplayAuthority(authority: ReplayAuthority): void {
    this.replayAuthority = authority;
    this.eventBus.setReplayAuthority(authority);
  }

  setProviderAuthority(authority: IProviderAuthority): void {
    this.providerAuthority = authority;
    this.eventBus.setProviderAuthority(authority);
  }

  // Canonical execute function - all providers must route through this
  async execute(
    providerId: string,
    operation: string,
    input: unknown,
    actorId?: string,
    parameters: Record<string, unknown> = {}
  ): Promise<ConstitutionalExecutionContext> {
    // Step 1: Identity Resolution
    const actor = await this.resolveIdentity(actorId);
    
    // Step 2: Create execution context
    const executionId = this.generateExecutionId(providerId, operation);
    const context: ConstitutionalExecutionContext = {
      executionId,
      actorId: actor?.id || 'system',
      authorities: [],
      capabilities: [],
      input,
      providerRequest: {
        requestId: executionId,
        capabilityId: operation,
        input,
        parameters,
        timeout: 30000,
        priority: 1,
      },
      evidenceIds: [],
      knowledgeIds: [],
      projectionIds: [],
      replayTranscriptId: '',
      timestamp: new Date().toISOString(),
      status: 'executing',
    };

    try {
      // Step 3: Policy Check
      if (this.options.enablePolicyCheck) {
        await this.checkPolicy(context);
      }

      // Step 4: Provider Execution
      const provider = await this.resolveProvider(providerId);
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      context.providerResponse = await provider.execute(context.providerRequest);
      context.status = context.providerResponse.success ? 'completed' : 'failed';

      // Step 5: Evidence Storage
      if (this.options.enableEvidenceStorage && this.identityAuthority) {
        const evidence = await this.identityAuthority.createEvidence({
          type: 'Execution',
          data: {
            executionId,
            providerId,
            operation,
            input,
            response: context.providerResponse,
          },
          metadata: {
            actorId: context.actorId,
            timestamp: context.timestamp,
          },
        });
        context.evidenceIds.push(evidence.id);
      }

      // Step 6: Knowledge Graph
      if (this.options.enableKnowledgeIndexing && this.knowledgeAuthority) {
        const knowledge = await this.knowledgeAuthority.ingest({
          artifactId: executionId,
          kind: 'Execution',
          data: context.providerResponse.output,
          metadata: {
            source: providerId,
            format: 'json',
            createdAt: context.timestamp,
          },
        });
        context.knowledgeIds.push(knowledge.knowledgeId);

        // Create execution node in graph
        const node = await this.knowledgeAuthority.createNode({
          type: 'Execution',
          data: {
            executionId,
            providerId,
            operation,
            status: context.status,
            timestamp: context.timestamp,
          },
        });
      }

      // Step 7: Replay Transcript
      if (this.options.enableReplay && this.replayAuthority) {
        context.replayTranscriptId = this.replayAuthority.generateTranscriptId(executionId);
      }

      // Step 8: Projection
      if (this.options.enableProjection && this.knowledgeAuthority) {
        const projection = await this.knowledgeAuthority.extract(
          context.knowledgeIds[0],
          'ExecutionSummary'
        );
        context.projectionIds.push(projection.projectionId);
      }

      // Step 9: Publish constitutional event
      const eventBuilder = new ExecutionEventBuilder();
      const event = eventBuilder.buildEvent(
        ConstitutionalEventType.CapabilityExecuted,
        executionId,
        {
          actorId: context.actorId,
          providerId,
          operation,
          input,
          response: context.providerResponse,
          evidenceIds: context.evidenceIds,
          knowledgeIds: context.knowledgeIds,
          projectionIds: context.projectionIds,
          transcriptId: context.replayTranscriptId,
        }
      );
      await this.eventBus.publish(event);

    } catch (error) {
      context.status = 'failed';
      context.providerResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {},
        duration: 0,
      };
    }

    return context;
  }

  // Identity Resolution
  private async resolveIdentity(actorId?: string): Promise<{ id: string } | null> {
    if (!actorId || !this.identityAuthority) {
      return { id: 'system' };
    }
    return await this.identityAuthority.getActor(actorId);
  }

  // Policy Check
  private async checkPolicy(context: ConstitutionalExecutionContext): Promise<void> {
    // In production, this would check governance policies
    // For now, stub implementation
    context.authorities = ['IdentityAuthority', 'ProviderAuthority'];
    context.capabilities = [context.providerRequest.capabilityId];
  }

  // Provider Resolution
  private async resolveProvider(providerId: string): Promise<ExecutionProvider | null> {
    if (this.providerAuthority) {
      return this.providerAuthority.get(providerId);
    }
    return null;
  }

  // Execution ID Generation
  private generateExecutionId(providerId: string, operation: string): string {
    return `exec-${providerId}-${operation}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  // Get event bus for external subscriptions
  getEventBus(): ExecutionEventBus {
    return this.eventBus;
  }

  // Replay execution from evidence
  async replayExecution(executionId: string): Promise<ConstitutionalExecutionContext | null> {
    // In production, this would reconstruct execution entirely from evidence
    // For now, stub implementation
    const history = this.eventBus.getHistoryByExecution(executionId);
    if (history.length === 0) {
      return null;
    }

    const event = history[0];
    return {
      executionId,
      actorId: event.data.actorId as string,
      authorities: [],
      capabilities: [],
      input: event.data.input,
      providerRequest: event.data.providerRequest as ExecutionRequest,
      providerResponse: event.data.response as ExecutionResponse,
      evidenceIds: event.data.evidenceIds as string[],
      knowledgeIds: event.data.knowledgeIds as string[],
      projectionIds: event.data.projectionIds as string[],
      replayTranscriptId: event.data.transcriptId as string,
      timestamp: event.timestamp,
      status: 'completed',
    };
  }
}
