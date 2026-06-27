/**
 * Execution Provider Interface
 * Abstraction for all execution providers (Ollama, Claude, Regex, SQL, Python, Filesystem, Git).
 * Mission Control never dispatches to providers directly, only through capabilities.
 * 
 * Concrete implementations are in execution-provider-implementations.ts (internal).
 * Only ProviderAuthority should import and instantiate concrete implementations.
 * Capabilities should never know concrete implementations exist.
 */

import { CapabilityReference, ProviderReference } from '../identity/typed-references';

export interface ExecutionProvider {
  providerId: ProviderReference;
  providerType: ProviderType;
  version: string;
  
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
  validate(request: ExecutionRequest): ValidationResult;
  estimateCost(request: ExecutionRequest): CostEstimate;
  estimateLatency(request: ExecutionRequest): LatencyEstimate;
}

export enum ProviderType {
  LLM = 'llm',
  Regex = 'regex',
  SQL = 'sql',
  Python = 'python',
  Filesystem = 'filesystem',
  Git = 'git',
  AST = 'ast',
  Hasher = 'hasher',
  Parser = 'parser',
}

export interface ExecutionRequest {
  requestId: string;
  capabilityId: CapabilityReference;
  input: unknown;
  parameters: Record<string, unknown>;
  timeout: number;
  priority: number;
}

export interface ExecutionResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  metadata: Record<string, unknown>;
  duration: number;
  tokensUsed?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CostEstimate {
  currency: string;
  amount: number;
  unit: 'per_execution' | 'per_second' | 'per_token' | 'per_operation';
}

export interface LatencyEstimate {
  min: number;
  max: number;
  unit: 'milliseconds' | 'seconds';
}
