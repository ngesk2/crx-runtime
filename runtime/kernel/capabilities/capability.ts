/**
 * Capability
 * Represents an abstract ability that can be derived from Knowledge.
 * This becomes the package manager of the OS.
 */

export type CapabilityID = string & { readonly __brand: unique symbol };
export type EntityReference = string & { readonly __brand: unique symbol };
export type ArtifactReference = string & { readonly __brand: unique symbol };
export type KnowledgeReference = string & { readonly __brand: unique symbol };
export type RelationshipReference = string & { readonly __brand: unique symbol };
export type AssessmentReference = string & { readonly __brand: unique symbol };
export type PolicyReference = string & { readonly __brand: unique symbol };

export interface Capability {
  identity: CapabilityID;
  version: string;
  
  // I/O
  inputs: readonly CapabilityInput[];
  outputs: readonly CapabilityOutput[];
  
  // Consumption/Production
  consumes: readonly Consumable[];
  produces: readonly Producible[];
  
  // Governance
  policies: readonly PolicyReference[];
  requiredAuthorities: readonly string[];
  
  // Dependencies
  requiredModels: readonly ModelReference[];
  requiredMCP: readonly MCPReference[];
  requiredResources: readonly ResourceRequirement[];
  
  // Execution
  concurrency: ConcurrencyMode;
  priority: Priority;
  latencyClass: LatencyClass;
  cost: CostEstimate;
  timeout: number;
  
  // Constitutional
  replaySafe: boolean;
  deterministic: boolean;
  executorClass: ExecutorClass;
}

export interface CapabilityInput {
  name: string;
  type: 'entity' | 'artifact' | 'knowledge' | 'relationship' | 'assessment';
  required: boolean;
  schema?: string;
}

export interface CapabilityOutput {
  name: string;
  type: 'entity' | 'artifact' | 'knowledge' | 'relationship' | 'assessment';
  schema?: string;
}

export interface Consumable {
  type: 'artifact' | 'knowledge' | 'capability';
  reference: string;
}

export interface Producible {
  type: 'knowledge' | 'capability' | 'assessment';
  reference: string;
}

export interface ModelReference {
  provider: string;
  model: string;
  version: string;
}

export interface MCPReference {
  server: string;
  capability: string;
  version: string;
}

export interface ResourceRequirement {
  type: 'cpu' | 'gpu' | 'memory' | 'storage' | 'network';
  amount: number;
  unit: string;
}

export enum ConcurrencyMode {
  Exclusive = 'exclusive',
  Shared = 'shared',
  Parallel = 'parallel',
  Sequential = 'sequential',
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Normal = 'normal',
  Low = 'low',
  Background = 'background',
}

export enum LatencyClass {
  Realtime = 'realtime',
  Interactive = 'interactive',
  Batch = 'batch',
  Background = 'background',
}

export interface CostEstimate {
  currency: string;
  amount: number;
  unit: 'per_execution' | 'per_second' | 'per_token';
}

export enum ExecutorClass {
  CPU = 'cpu',
  GPU = 'gpu',
  Hybrid = 'hybrid',
  Distributed = 'distributed',
}
