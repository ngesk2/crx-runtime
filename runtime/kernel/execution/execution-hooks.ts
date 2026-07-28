/**
 * Execution Hooks
 * Defines the hook interface for execution context plugins.
 */

import { ExecutionContext } from './execution-context';

export interface ExecutionHook {
  name: string;
  priority: number;
  
  before(context: ExecutionContext): Promise<void>;
  after(context: ExecutionContext, result: unknown): Promise<void>;
  onError(context: ExecutionContext, error: Error): Promise<void>;
  cleanup(context: ExecutionContext): void;
}

export abstract class BaseExecutionHook implements ExecutionHook {
  abstract name: string;
  priority: number = 0;
  
  async before(context: ExecutionContext): Promise<void> {
    // Default implementation: do nothing
  }
  
  async after(context: ExecutionContext, result: unknown): Promise<void> {
    // Default implementation: do nothing
  }
  
  async onError(context: ExecutionContext, error: Error): Promise<void> {
    // Default implementation: do nothing
  }
  
  cleanup(context: ExecutionContext): void {
    // Default implementation: do nothing
  }
}

export class HookRegistry {
  private hooks: Map<string, ExecutionHook> = new Map();
  
  registerHook(hook: ExecutionHook): void {
    this.hooks.set(hook.name, hook);
  }
  
  getHook(name: string): ExecutionHook | undefined {
    return this.hooks.get(name);
  }
  
  listHooks(): ExecutionHook[] {
    return Array.from(this.hooks.values()).sort((a, b) => a.priority - b.priority);
  }
  
  unregisterHook(name: string): boolean {
    return this.hooks.delete(name);
  }
}
