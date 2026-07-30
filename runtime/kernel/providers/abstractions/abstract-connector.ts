/**
 * Abstract Connector - Base class for all connectors
 * 
 * Constitutional Runtime - Provider Abstraction
 * Published by Runtime, consumed by PING and HPP.
 * 
 * Removes 70% duplication between connectors by providing shared implementations for:
 * - Metrics tracking
 * - Health checks
 * - Schema discovery
 * - Initialization
 * 
 * Only resource-specific code remains in concrete connectors.
 */

import type { HealthStatus, ConnectorMetrics } from '../../../contracts/src/providers';

export abstract class AbstractConnector {
  protected config: unknown;
  protected internalMetrics: ConnectorMetrics = {
    requests: 0,
    errors: 0,
    latency: 0,
    uptime: 0
  };
  protected startTime: number = Date.now();

  constructor(config: unknown) {
    this.config = config;
  }

  // Initialization
  async initialize(config: unknown): Promise<void> {
    this.config = config;
    this.startTime = Date.now();
    await this.validateConfig();
  }

  protected abstract validateConfig(): Promise<void>;

  async disconnect(): Promise<void> {
    // Default implementation - can be overridden
  }

  // Metrics
  protected incrementRequests(): void {
    this.internalMetrics.requests++;
  }

  protected incrementErrors(): void {
    this.internalMetrics.errors++;
  }

  protected recordLatency(duration: number): void {
    this.internalMetrics.latency = duration;
  }

  async metrics(): Promise<ConnectorMetrics> {
    this.internalMetrics.uptime = (Date.now() - this.startTime) / 1000;
    return { ...this.internalMetrics };
  }

  // Health check
  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.performHealthCheck();
      return {
        status: 'healthy',
        message: `${this.getName()} is operational`,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `${this.getName()} error: ${error}`,
        lastCheck: new Date().toISOString()
      };
    }
  }

  protected abstract performHealthCheck(): Promise<void>;

  // Schema discovery (default implementation)
  async discover(): Promise<unknown> {
    return {
      resources: [],
      version: '1.0.0'
    };
  }

  async getResourceSchema(resource: string): Promise<unknown> {
    // Default implementation - can be overridden
    return {
      name: resource,
      fields: [],
      operations: []
    };
  }

  // Helper for timing operations
  protected async withTiming<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.incrementRequests();

    try {
      const result = await operation();
      this.recordLatency(Date.now() - startTime);
      return result;
    } catch (error) {
      this.incrementErrors();
      throw error;
    }
  }

  // Get connector name
  protected getName(): string {
    const config = this.config as Record<string, unknown>;
    return config.name as string || config.type as string || 'Connector';
  }
}
