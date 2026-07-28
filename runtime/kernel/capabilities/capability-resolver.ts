/**
 * Capability Resolver
 * Resolves capabilities based on requirements and constraints.
 */

import { Capability, CapabilityID, ConcurrencyMode, Priority, LatencyClass } from './capability';
import { CapabilityRegistry } from './capability-registry';

export interface CapabilityRequest {
  inputTypes: string[];
  outputTypes: string[];
  requiredPolicies: string[];
  maxLatency?: LatencyClass;
  maxCost?: number;
  deterministic?: boolean;
  replaySafe?: boolean;
  executorClass?: string;
}

export class CapabilityResolver {
  private registry: CapabilityRegistry;
  
  constructor(registry: CapabilityRegistry) {
    this.registry = registry;
  }
  
  resolve(request: CapabilityRequest): Capability[] {
    let candidates = this.registry.listCapabilities();
    
    // Filter by input/output types
    candidates = candidates.filter(cap => {
      const hasInputs = request.inputTypes.every(reqInput =>
        cap.inputs.some(input => input.type === reqInput)
      );
      const hasOutputs = request.outputTypes.every(reqOutput =>
        cap.outputs.some(output => output.type === reqOutput)
      );
      return hasInputs && hasOutputs;
    });
    
    // Filter by policies
    if (request.requiredPolicies.length > 0) {
      candidates = candidates.filter(cap =>
        request.requiredPolicies.every(policy =>
          cap.policies.includes(policy as any)
        )
      );
    }
    
    // Filter by latency
    if (request.maxLatency) {
      candidates = candidates.filter(cap =>
        this.compareLatency(cap.latencyClass, request.maxLatency!) <= 0
      );
    }
    
    // Filter by cost
    if (request.maxCost !== undefined) {
      candidates = candidates.filter(cap =>
        cap.cost.amount <= request.maxCost!
      );
    }
    
    // Filter by determinism
    if (request.deterministic !== undefined) {
      candidates = candidates.filter(cap =>
        cap.deterministic === request.deterministic
      );
    }
    
    // Filter by replay safety
    if (request.replaySafe !== undefined) {
      candidates = candidates.filter(cap =>
        cap.replaySafe === request.replaySafe
      );
    }
    
    // Filter by executor class
    if (request.executorClass) {
      candidates = candidates.filter(cap =>
        cap.executorClass === request.executorClass
      );
    }
    
    // Sort by priority
    candidates.sort((a, b) => this.comparePriority(a.priority, b.priority));
    
    return candidates;
  }
  
  private compareLatency(a: LatencyClass, b: LatencyClass): number {
    const order = [LatencyClass.Realtime, LatencyClass.Interactive, LatencyClass.Batch, LatencyClass.Background];
    return order.indexOf(a) - order.indexOf(b);
  }
  
  private comparePriority(a: Priority, b: Priority): number {
    const order = [Priority.Critical, Priority.High, Priority.Normal, Priority.Low, Priority.Background];
    return order.indexOf(a) - order.indexOf(b);
  }
}
