/**
 * Constitutional Runtime - Provider Contracts
 * 
 * Shared provider interfaces and capability definitions.
 * Published by Constitutional Runtime, consumed by PING and HPP.
 */

export * from './capabilities';

/**
 * Health Status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastCheck: string;
}

/**
 * Connector Metrics
 */
export interface ConnectorMetrics {
  requests: number;
  errors: number;
  latency: number;
  uptime: number;
}

/**
 * Connector Config
 */
export interface ConnectorConfig {
  id: string;
  name: string;
  type: string;
  credentials: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

/**
 * Abstract Connector Interface
 * Base interface for all provider connectors.
 */
export interface AbstractConnector {
  initialize(config: unknown): Promise<void>;
  disconnect(): Promise<void>;
  metrics(): Promise<ConnectorMetrics>;
  healthCheck(): Promise<HealthStatus>;
  discover(): Promise<unknown>;
  getResourceSchema(resource: string): Promise<unknown>;
}

/**
 * Provider Type
 */
export type ProviderType = 
  | 'github'
  | 'google-drive'
  | 'google-sheets'
  | 'kit'
  | 'stripe'
  | 'openai'
  | 'custom';

/**
 * Provider Trait
 * Capabilities that providers can implement.
 */
export type ProviderTrait =
  | 'readable'
  | 'writable'
  | 'queryable'
  | 'discoverable'
  | 'webhookable'
  | 'streamable';

/**
 * Provider Requirements
 * Constraints for provider selection.
 */
export interface ProviderRequirements {
  traits: ProviderTrait[];
  maxLatency?: number;
  maxCost?: number;
  version?: string;
}

/**
 * Provider Filters
 * Filters for listing providers.
 */
export interface ProviderFilters {
  providerType?: ProviderType;
  traits?: ProviderTrait[];
  version?: string;
  maxLatency?: number;
  maxCost?: number;
}

/**
 * Execution Request
 * Request to execute a provider capability.
 */
export interface ExecutionRequest {
  requestId: string;
  capabilityId: string;
  input: unknown;
  parameters: Record<string, unknown>;
  timeout: number;
  priority: number;
}

/**
 * Execution Response
 * Response from provider execution.
 */
export interface ExecutionResponse {
  success: boolean;
  output?: unknown;
  error?: string;
  metadata: Record<string, unknown>;
  duration: number;
}

/**
 * Execution Provider
 * Interface for constitutional execution providers.
 */
export interface ExecutionProvider {
  providerId: string;
  providerType: ProviderType;
  version: string;
  traits: ProviderTrait[];
  name: string;
  description: string;
  
  execute(request: ExecutionRequest): Promise<ExecutionResponse>;
  estimateCost(request: ExecutionRequest): { amount: number; currency: string };
  estimateLatency(request: ExecutionRequest): { min: number; max: number; average: number };
}
