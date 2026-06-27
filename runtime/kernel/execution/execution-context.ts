/**
 * Execution Context
 * Provides context for execution with pluggable hooks.
 * This replaces direct coupling between Executor and Replay/Metrics/Telemetry.
 */

import { ExecutionHook } from './execution-hooks';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface ExecutionContext {
  contextId: string;
  executionId: string;
  startTime: string;
  metadata: Record<string, unknown>;
  hooks: ExecutionHook[];
}

export interface ExecutionMetadata {
  stage: string;
  inputId: string;
  outputId: string;
  workerId?: string;
  capabilityId?: string;
  [key: string]: unknown;
}

export class ExecutionContextBuilder {
  private hooks: ExecutionHook[] = [];
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  addHook(hook: ExecutionHook): void {
    this.hooks.push(hook);
  }
  
  buildContext(executionId: string, metadata: ExecutionMetadata): ExecutionContext {
    return {
      contextId: this.identityService.generateUUIDv5('context', `${executionId}:${this.clock.now()}`),
      executionId,
      startTime: this.clock.now(),
      metadata,
      hooks: this.hooks,
    };
  }
}

export class ExecutionContextManager {
  private contexts: Map<string, ExecutionContext> = new Map();
  
  createContext(context: ExecutionContext): void {
    this.contexts.set(context.contextId, context);
  }
  
  getContext(contextId: string): ExecutionContext | undefined {
    return this.contexts.get(contextId);
  }
  
  async executeWithHooks<T>(
    contextId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const context = this.contexts.get(contextId);
    if (!context) {
      throw new Error(`Context not found: ${contextId}`);
    }
    
    // Execute before hooks
    for (const hook of context.hooks) {
      await hook.before(context);
    }
    
    try {
      // Execute operation
      const result = await operation();
      
      // Execute after hooks
      for (const hook of context.hooks) {
        await hook.after(context, result);
      }
      
      return result;
    } catch (error) {
      // Execute error hooks
      for (const hook of context.hooks) {
        await hook.onError(context, error as Error);
      }
      throw error;
    }
  }
  
  cleanupContext(contextId: string): void {
    const context = this.contexts.get(contextId);
    if (!context) return;
    
    // Execute cleanup hooks
    for (const hook of context.hooks) {
      hook.cleanup(context);
    }
    
    this.contexts.delete(contextId);
  }
}
