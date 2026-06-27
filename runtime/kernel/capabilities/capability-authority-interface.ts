/**
 * Capability Authority Interface
 * Public interface for capability subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface ICapabilityAuthority {
  register(capability: Capability): void;
  unregister(capabilityId: string): void;
  get(capabilityId: string): Capability | null;
  resolve(requirements: CapabilityRequirements): Capability[];
  list(filters: CapabilityFilters): Capability[];
}

export interface Capability {
  capabilityId: string;
  name: string;
  description: string;
  inputs: CapabilityInput[];
  outputs: CapabilityOutput[];
  requirements: CapabilityRequirements;
  execution: ExecutionRequirements;
  governance: GovernanceRequirements;
}

export interface CapabilityInput {
  name: string;
  type: string;
  required: boolean;
}

export interface CapabilityOutput {
  name: string;
  type: string;
}

export interface CapabilityRequirements {
  inputTypes: string[];
  outputTypes: string[];
  policies: string[];
  maxLatency?: number;
  maxCost?: number;
  deterministic: boolean;
  replaySafe: boolean;
  executorClass: string;
}

export interface ExecutionRequirements {
  concurrency: ConcurrencyMode;
  priority: Priority;
  estimatedLatency: LatencyEstimate;
  estimatedCost: CostEstimate;
  resourceRequirements: ResourceRequirement[];
}

export enum ConcurrencyMode {
  Exclusive = 'exclusive',
  Shared = 'shared',
  Parallel = 'parallel',
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
}

export interface LatencyEstimate {
  min: number;
  max: number;
  unit: 'milliseconds' | 'seconds';
}

export interface CostEstimate {
  currency: string;
  amount: number;
  unit: 'per_execution' | 'per_second' | 'per_token' | 'per_operation';
}

export interface ResourceRequirement {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}

export interface GovernanceRequirements {
  authorities: string[];
  policies: string[];
  constraints: string[];
}

export interface CapabilityFilters {
  inputTypes?: string[];
  outputTypes?: string[];
  executorClass?: string;
  deterministic?: boolean;
  replaySafe?: boolean;
  maxLatency?: number;
  maxCost?: number;
}
