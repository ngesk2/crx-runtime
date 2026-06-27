/**
 * Provider Authority Interface
 * Public interface for provider subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IProviderAuthority {
  register(provider: ExecutionProvider): void;
  unregister(providerId: string): void;
  get(providerId: string): ExecutionProvider | null;
  resolve(requirements: ProviderRequirements): ExecutionProvider[];
  list(filters: ProviderFilters): ExecutionProvider[];
}

export interface ExecutionProvider {
  providerId: string;
  providerType: ProviderType;
  version: string;
  traits: ProviderTrait[];
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

export enum ProviderTrait {
  Embedding = 'embedding',
  Chat = 'chat',
  Filesystem = 'filesystem',
  Python = 'python',
  SQL = 'sql',
  Regex = 'regex',
  Git = 'git',
  AST = 'ast',
  Hashing = 'hashing',
  Parsing = 'parsing',
}

export interface ExecutionRequest {
  requestId: string;
  capabilityId: string;
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

export interface ProviderRequirements {
  traits: ProviderTrait[];
  maxLatency?: number;
  maxCost?: number;
}

export interface ProviderFilters {
  providerType?: ProviderType;
  traits?: ProviderTrait[];
  version?: string;
  maxLatency?: number;
  maxCost?: number;
}
