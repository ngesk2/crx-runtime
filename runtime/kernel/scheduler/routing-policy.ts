/**
 * Routing Policy
 * Defines how artifacts are routed to capabilities.
 */

import { CapabilityID } from '../capability/capability';
import { WorkerID } from '../workers/worker';
import { ExecutionRequest } from './execution-request';
import { ExecutionResult } from './execution-result';

export interface RoutingPolicy {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  targetCapability: CapabilityID;
  targetWorker?: WorkerID;
  
  matches(request: ExecutionRequest): boolean;
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

export interface RoutingCondition {
  type: 'artifact_type' | 'capability' | 'region' | 'priority' | 'custom';
  field: string;
  operator: 'equals' | 'contains' | 'matches' | 'in';
  value: unknown;
}

export class DefaultRoutingPolicy implements RoutingPolicy {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  targetCapability: CapabilityID;
  targetWorker?: WorkerID;
  
  constructor(
    id: string,
    name: string,
    targetCapability: CapabilityID,
    priority: number = 0
  ) {
    this.id = id;
    this.name = name;
    this.targetCapability = targetCapability;
    this.priority = priority;
    this.conditions = [];
  }
  
  matches(request: ExecutionRequest): boolean {
    if (this.conditions.length === 0) return true;
    
    return this.conditions.every(condition => {
      const value = this.getFieldValue(request, condition.field);
      return this.evaluateCondition(value, condition);
    });
  }
  
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // Placeholder for actual execution
    return {
      success: true,
      requestId: request.requestId,
      output: request.input,
      metadata: {
        policy: this.id,
        capability: this.targetCapability,
        worker: this.targetWorker,
      },
    };
  }
  
  private getFieldValue(request: ExecutionRequest, field: string): unknown {
    const parts = field.split('.');
    let value: any = request;
    
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return undefined;
    }
    
    return value;
  }
  
  private evaluateCondition(value: unknown, condition: RoutingCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'contains':
        return Array.isArray(value) && value.includes(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'matches':
        return typeof value === 'string' && 
               new RegExp(condition.value as string).test(value);
      default:
        return false;
    }
  }
}
