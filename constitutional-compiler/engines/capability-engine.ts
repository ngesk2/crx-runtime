/**
 * Capability Engine
 * 
 * READ, WRITE, DELETE, EXECUTE, VERIFY, SIGN, HASH, PERSIST, EMIT, SUBSCRIBE
 * 
 * The compiler must track:
 * - Capabilities consumed by operations
 * - Capabilities produced by operations
 * - Capability boundaries
 * - Capability delegation
 * - Capability violations
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';

/**
 * Capability Type
 */
export enum CapabilityType {
  Read = 'Read',
  Write = 'Write',
  Delete = 'Delete',
  Execute = 'Execute',
  Verify = 'Verify',
  Sign = 'Sign',
  Hash = 'Hash',
  Persist = 'Persist',
  Emit = 'Emit',
  Subscribe = 'Subscribe',
  Create = 'Create',
  Mutate = 'Mutate',
  Destroy = 'Destroy',
}

/**
 * Capability
 */
export interface Capability {
  id: SymbolID;
  type: CapabilityType;
  owner: SymbolID;
  authority: SymbolID;
  target: SymbolID;
  grantedAt: string;
  expiresAt?: string;
  conditions: CapabilityCondition[];
  delegatable: boolean;
  delegatedFrom?: SymbolID;
}

/**
 * Capability Condition
 */
export interface CapabilityCondition {
  type: string;
  value: any;
  authority: SymbolID;
}

/**
 * Capability Consumption
 */
export interface CapabilityConsumption {
  id: SymbolID;
  capability: SymbolID;
  consumer: SymbolID;
  operation: SymbolID;
  timestamp: string;
  evidence: SymbolID[];
}

/**
 * Capability Production
 */
export interface CapabilityProduction {
  id: SymbolID;
  capability: SymbolID;
  producer: SymbolID;
  operation: SymbolID;
  timestamp: string;
  evidence: SymbolID[];
}

/**
 * Capability Boundary
 */
export interface CapabilityBoundary {
  id: SymbolID;
  name: string;
  authority: SymbolID;
  capabilities: SymbolID[];
  allowedConsumers: SymbolID[];
  allowedProducers: SymbolID[];
  strict: boolean;
}

/**
 * Capability Delegation
 */
export interface CapabilityDelegation {
  id: SymbolID;
  from: SymbolID;
  to: SymbolID;
  capability: SymbolID;
  authority: SymbolID;
  timestamp: string;
  expiresAt?: string;
  conditions: CapabilityCondition[];
  evidence: SymbolID[];
}

/**
 * Capability Engine
 */
export class CapabilityEngine {
  private capabilities: Map<SymbolID, Capability> = new Map();
  private capabilityIndex: Map<SymbolID, SymbolID[]> = new Map(); // owner -> capabilities
  private authorityIndex: Map<SymbolID, SymbolID[]> = new Map(); // authority -> capabilities
  private typeIndex: Map<CapabilityType, SymbolID[]> = new Map(); // type -> capabilities
  
  private capabilityConsumptions: Map<SymbolID, CapabilityConsumption> = new Map();
  private capabilityProductions: Map<SymbolID, CapabilityProduction> = new Map();
  
  private capabilityBoundaries: Map<SymbolID, CapabilityBoundary> = new Map();
  private capabilityDelegations: Map<SymbolID, CapabilityDelegation> = new Map();

  /**
   * Grant capability
   */
  grantCapability(
    type: CapabilityType,
    owner: SymbolID,
    authority: SymbolID,
    target: SymbolID,
    delegatable: boolean = false,
    conditions: CapabilityCondition[] = [],
    delegatedFrom?: SymbolID
  ): Capability {
    const id = this.generateCapabilityId(type, owner, target);
    const capability: Capability = {
      id,
      type,
      owner,
      authority,
      target,
      grantedAt: new Date().toISOString(),
      conditions,
      delegatable,
      delegatedFrom,
    };

    this.capabilities.set(id, capability);
    
    // Index by owner
    if (!this.capabilityIndex.has(owner)) {
      this.capabilityIndex.set(owner, []);
    }
    this.capabilityIndex.get(owner)!.push(id);
    
    // Index by authority
    if (!this.authorityIndex.has(authority)) {
      this.authorityIndex.set(authority, []);
    }
    this.authorityIndex.get(authority)!.push(id);
    
    // Index by type
    if (!this.typeIndex.has(type)) {
      this.typeIndex.set(type, []);
    }
    this.typeIndex.get(type)!.push(id);

    return capability;
  }

  /**
   * Consume capability
   */
  consumeCapability(
    capability: SymbolID,
    consumer: SymbolID,
    operation: SymbolID,
    evidence: SymbolID[] = []
  ): CapabilityConsumption {
    const id = this.generateConsumptionId(capability, consumer, operation);
    const consumption: CapabilityConsumption = {
      id,
      capability,
      consumer,
      operation,
      timestamp: new Date().toISOString(),
      evidence,
    };

    this.capabilityConsumptions.set(id, consumption);
    return consumption;
  }

  /**
   * Produce capability
   */
  produceCapability(
    capability: SymbolID,
    producer: SymbolID,
    operation: SymbolID,
    evidence: SymbolID[] = []
  ): CapabilityProduction {
    const id = this.generateProductionId(capability, producer, operation);
    const production: CapabilityProduction = {
      id,
      capability,
      producer,
      operation,
      timestamp: new Date().toISOString(),
      evidence,
    };

    this.capabilityProductions.set(id, production);
    return production;
  }

  /**
   * Delegate capability
   */
  delegateCapability(
    from: SymbolID,
    to: SymbolID,
    capability: SymbolID,
    authority: SymbolID,
    conditions: CapabilityCondition[] = [],
    evidence: SymbolID[] = []
  ): CapabilityDelegation {
    const id = this.generateDelegationId(from, to, capability);
    const delegation: CapabilityDelegation = {
      id,
      from,
      to,
      capability,
      authority,
      timestamp: new Date().toISOString(),
      conditions,
      evidence,
    };

    this.capabilityDelegations.set(id, delegation);

    // Create new capability for delegatee
    const originalCapability = this.capabilities.get(capability);
    if (originalCapability) {
      this.grantCapability(
        originalCapability.type,
        to,
        authority,
        originalCapability.target,
        originalCapability.delegatable,
        conditions,
        capability
      );
    }

    return delegation;
  }

  /**
   * Create capability boundary
   */
  createCapabilityBoundary(
    name: string,
    authority: SymbolID,
    capabilities: SymbolID[],
    allowedConsumers: SymbolID[],
    allowedProducers: SymbolID[],
    strict: boolean = true
  ): CapabilityBoundary {
    const id = this.generateBoundaryId(name, authority);
    const boundary: CapabilityBoundary = {
      id,
      name,
      authority,
      capabilities,
      allowedConsumers,
      allowedProducers,
      strict,
    };

    this.capabilityBoundaries.set(id, boundary);
    return boundary;
  }

  /**
   * Get capability by ID
   */
  getCapability(id: SymbolID): Capability | undefined {
    return this.capabilities.get(id);
  }

  /**
   * Get capabilities by owner
   */
  getCapabilitiesByOwner(owner: SymbolID): Capability[] {
    const ids = this.capabilityIndex.get(owner) || [];
    return ids.map(id => this.capabilities.get(id)!).filter(c => c !== undefined);
  }

  /**
   * Get capabilities by authority
   */
  getCapabilitiesByAuthority(authority: SymbolID): Capability[] {
    const ids = this.authorityIndex.get(authority) || [];
    return ids.map(id => this.capabilities.get(id)!).filter(c => c !== undefined);
  }

  /**
   * Get capabilities by type
   */
  getCapabilitiesByType(type: CapabilityType): Capability[] {
    const ids = this.typeIndex.get(type) || [];
    return ids.map(id => this.capabilities.get(id)!).filter(c => c !== undefined);
  }

  /**
   * Get capabilities by target
   */
  getCapabilitiesByTarget(target: SymbolID): Capability[] {
    const results: Capability[] = [];
    
    for (const capability of this.capabilities.values()) {
      if (capability.target === target) {
        results.push(capability);
      }
    }
    
    return results;
  }

  /**
   * Check if owner has capability
   */
  hasCapability(
    owner: SymbolID,
    type: CapabilityType,
    target?: SymbolID
  ): boolean {
    const capabilities = this.getCapabilitiesByOwner(owner);
    
    for (const capability of capabilities) {
      if (capability.type === type) {
        if (target === undefined || capability.target === target) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Validate capability consumption
   */
  validateCapabilityConsumption(
    consumer: SymbolID,
    type: CapabilityType,
    target: SymbolID,
    boundary?: SymbolID
  ): { valid: boolean; reason?: string } {
    // Check if consumer has capability
    if (!this.hasCapability(consumer, type, target)) {
      return {
        valid: false,
        reason: `Consumer ${consumer} does not have capability ${type} for target ${target}`,
      };
    }

    // Check boundary if specified
    if (boundary) {
      const boundaryObj = this.capabilityBoundaries.get(boundary);
      if (boundaryObj) {
        if (boundaryObj.strict) {
          if (!boundaryObj.allowedConsumers.includes(consumer)) {
            return {
              valid: false,
              reason: `Consumer ${consumer} is not allowed to consume capabilities within boundary ${boundary}`,
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Resolve capabilities from semantic IR
   */
  resolveCapabilitiesFromSemanticIR(semanticIR: Map<SymbolID, SemanticIRNode>): void {
    for (const [id, node] of semanticIR) {
      // Grant capabilities consumed
      for (const consumed of node.capabilitiesConsumed) {
        this.grantCapability(
          this.inferCapabilityType(node),
          id,
          node.authorityRequired || id,
          consumed,
          false
        );
      }

      // Grant capabilities produced
      for (const produced of node.capabilitiesProduced) {
        this.grantCapability(
          this.inferCapabilityType(node),
          id,
          node.authorityRequired || id,
          produced,
          false
        );
      }
    }
  }

  /**
   * Infer capability type from node
   */
  private inferCapabilityType(node: SemanticIRNode): CapabilityType {
    // TODO: Infer based on node type and metadata
    return CapabilityType.Execute;
  }

  /**
   * Get capability consumption by ID
   */
  getCapabilityConsumption(id: SymbolID): CapabilityConsumption | undefined {
    return this.capabilityConsumptions.get(id);
  }

  /**
   * Get capability consumptions by consumer
   */
  getCapabilityConsumptionsByConsumer(consumer: SymbolID): CapabilityConsumption[] {
    const results: CapabilityConsumption[] = [];
    
    for (const consumption of this.capabilityConsumptions.values()) {
      if (consumption.consumer === consumer) {
        results.push(consumption);
      }
    }
    
    return results;
  }

  /**
   * Get capability production by ID
   */
  getCapabilityProduction(id: SymbolID): CapabilityProduction | undefined {
    return this.capabilityProductions.get(id);
  }

  /**
   * Get capability productions by producer
   */
  getCapabilityProductionsByProducer(producer: SymbolID): CapabilityProduction[] {
    const results: CapabilityProduction[] = [];
    
    for (const production of this.capabilityProductions.values()) {
      if (production.producer === producer) {
        results.push(production);
      }
    }
    
    return results;
  }

  /**
   * Get capability boundary by ID
   */
  getCapabilityBoundary(id: SymbolID): CapabilityBoundary | undefined {
    return this.capabilityBoundaries.get(id);
  }

  /**
   * Get capability boundaries by authority
   */
  getCapabilityBoundariesByAuthority(authority: SymbolID): CapabilityBoundary[] {
    const results: CapabilityBoundary[] = [];
    
    for (const boundary of this.capabilityBoundaries.values()) {
      if (boundary.authority === authority) {
        results.push(boundary);
      }
    }
    
    return results;
  }

  /**
   * Get capability delegation by ID
   */
  getCapabilityDelegation(id: SymbolID): CapabilityDelegation | undefined {
    return this.capabilityDelegations.get(id);
  }

  /**
   * Get capability delegations by from
   */
  getCapabilityDelegationsByFrom(from: SymbolID): CapabilityDelegation[] {
    const results: CapabilityDelegation[] = [];
    
    for (const delegation of this.capabilityDelegations.values()) {
      if (delegation.from === from) {
        results.push(delegation);
      }
    }
    
    return results;
  }

  /**
   * Get capability delegations by to
   */
  getCapabilityDelegationsByTo(to: SymbolID): CapabilityDelegation[] {
    const results: CapabilityDelegation[] = [];
    
    for (const delegation of this.capabilityDelegations.values()) {
      if (delegation.to === to) {
        results.push(delegation);
      }
    }
    
    return results;
  }

  /**
   * Get all capabilities
   */
  getAllCapabilities(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Get all capability consumptions
   */
  getAllCapabilityConsumptions(): CapabilityConsumption[] {
    return Array.from(this.capabilityConsumptions.values());
  }

  /**
   * Get all capability productions
   */
  getAllCapabilityProductions(): CapabilityProduction[] {
    return Array.from(this.capabilityProductions.values());
  }

  /**
   * Get all capability boundaries
   */
  getAllCapabilityBoundaries(): CapabilityBoundary[] {
    return Array.from(this.capabilityBoundaries.values());
  }

  /**
   * Get all capability delegations
   */
  getAllCapabilityDelegations(): CapabilityDelegation[] {
    return Array.from(this.capabilityDelegations.values());
  }

  /**
   * Merge capabilities from another engine
   */
  merge(other: CapabilityEngine): void {
    for (const capability of other.getAllCapabilities()) {
      this.capabilities.set(capability.id, capability);
      
      // Update indexes
      if (!this.capabilityIndex.has(capability.owner)) {
        this.capabilityIndex.set(capability.owner, []);
      }
      this.capabilityIndex.get(capability.owner)!.push(capability.id);
      
      if (!this.authorityIndex.has(capability.authority)) {
        this.authorityIndex.set(capability.authority, []);
      }
      this.authorityIndex.get(capability.authority)!.push(capability.id);
      
      if (!this.typeIndex.has(capability.type)) {
        this.typeIndex.set(capability.type, []);
      }
      this.typeIndex.get(capability.type)!.push(capability.id);
    }
    
    for (const consumption of other.getAllCapabilityConsumptions()) {
      this.capabilityConsumptions.set(consumption.id, consumption);
    }
    
    for (const production of other.getAllCapabilityProductions()) {
      this.capabilityProductions.set(production.id, production);
    }
    
    for (const boundary of other.getAllCapabilityBoundaries()) {
      this.capabilityBoundaries.set(boundary.id, boundary);
    }
    
    for (const delegation of other.getAllCapabilityDelegations()) {
      this.capabilityDelegations.set(delegation.id, delegation);
    }
  }

  /**
   * Clear all capabilities
   */
  clear(): void {
    this.capabilities.clear();
    this.capabilityIndex.clear();
    this.authorityIndex.clear();
    this.typeIndex.clear();
    this.capabilityConsumptions.clear();
    this.capabilityProductions.clear();
    this.capabilityBoundaries.clear();
    this.capabilityDelegations.clear();
  }

  /**
   * Generate capability ID
   */
  private generateCapabilityId(type: CapabilityType, owner: SymbolID, target: SymbolID): SymbolID {
    return `capability:${type}:${owner}:${target}`;
  }

  /**
   * Generate consumption ID
   */
  private generateConsumptionId(capability: SymbolID, consumer: SymbolID, operation: SymbolID): SymbolID {
    return `consumption:${capability}:${consumer}:${operation}:${Date.now()}`;
  }

  /**
   * Generate production ID
   */
  private generateProductionId(capability: SymbolID, producer: SymbolID, operation: SymbolID): SymbolID {
    return `production:${capability}:${producer}:${operation}:${Date.now()}`;
  }

  /**
   * Generate delegation ID
   */
  private generateDelegationId(from: SymbolID, to: SymbolID, capability: SymbolID): SymbolID {
    return `delegation:${from}:${to}:${capability}:${Date.now()}`;
  }

  /**
   * Generate boundary ID
   */
  private generateBoundaryId(name: string, authority: SymbolID): SymbolID {
    return `boundary:${name}:${authority}`;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalCapabilities: number;
    totalConsumptions: number;
    totalProductions: number;
    totalBoundaries: number;
    totalDelegations: number;
    byType: Record<CapabilityType, number>;
    byAuthority: Map<SymbolID, number>;
  } {
    const byType: Record<CapabilityType, number> = {} as any;
    const byAuthority = new Map<SymbolID, number>();

    for (const capability of this.capabilities.values()) {
      byType[capability.type] = (byType[capability.type] || 0) + 1;
      byAuthority.set(capability.authority, (byAuthority.get(capability.authority) || 0) + 1);
    }

    return {
      totalCapabilities: this.capabilities.size,
      totalConsumptions: this.capabilityConsumptions.size,
      totalProductions: this.capabilityProductions.size,
      totalBoundaries: this.capabilityBoundaries.size,
      totalDelegations: this.capabilityDelegations.size,
      byType,
      byAuthority,
    };
  }
}
