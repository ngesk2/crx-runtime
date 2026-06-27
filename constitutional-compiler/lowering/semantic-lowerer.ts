/**
 * Semantic Lowerer
 * 
 * Transforms language-specific AST into canonical semantic IR.
 * AST nodes should disappear after lowering.
 * Everything downstream consumes semantic IR only.
 * 
 * This is the critical separation that enables:
 * - Multiple language frontends (TS, Python, Rust, Go, Java, C#, Solidity)
 * - Language-agnostic analysis
 * - Distributed execution (only semantic IR ships to workers)
 */

import { IRNode, IRNodeType, SymbolID } from '../ir/node-types';

/**
 * Canonical Symbol Kind
 */
export enum CanonicalSymbolKind {
  Authority = 'Authority',
  Repository = 'Repository',
  Capability = 'Capability',
  Identity = 'Identity',
  Worker = 'Worker',
  Projection = 'Projection',
  Service = 'Service',
  Event = 'Event',
  Provider = 'Provider',
  Factory = 'Factory',
  Builder = 'Builder',
  ValueObject = 'ValueObject',
  DTO = 'DTO',
  Root = 'Root',
}

/**
 * Canonical Symbol Path
 * 
 * Organization → Package → Module → Authority → Capability → Identity
 * 
 * Paths move. Organizations rename. Packages split.
 * Semantic ownership should survive refactors.
 */
export interface CanonicalSymbolPath {
  organization: string;
  package: string;
  module: string;
  authority?: string;
  capability?: string;
  identity?: string;
}

/**
 * Canonical Symbol
 * 
 * Every symbol becomes canonical regardless of source language.
 * TypeScript, Python, Rust, protobuf, OpenAPI, GraphQL → all become canonical.
 */
export interface CanonicalSymbol {
  id: SymbolID;
  kind: CanonicalSymbolKind;
  name: string;
  path: CanonicalSymbolPath;
  owner: SymbolID;
  constitutionalRoot: SymbolID;
  semanticFingerprint: string;
  sourceLanguage: string;
}

/**
 * Semantic IR Node
 * 
 * Canonical semantic representation.
 * No AST structure. Only architectural semantics.
 */
export interface SemanticIRNode {
  id: SymbolID;
  canonicalSymbol: SymbolID;
  type: IRNodeType;
  
  // Architectural semantics (not AST structure)
  authorityRequired?: SymbolID;
  capabilitiesConsumed: SymbolID[];
  capabilitiesProduced: SymbolID[];
  stateMutations: MutationEdge[];
  persistenceActions: PersistenceAction[];
  eventsEmitted: EventEdge[];
  trustTransitions: TrustTransition[];
  constitutionalObligations: ConstitutionalObligation[];
}

/**
 * Mutation Edge
 */
export interface MutationEdge {
  target: SymbolID;
  mutationType: 'field' | 'property' | 'collection' | 'repository' | 'cache' | 'filesystem';
  authority: SymbolID;
  capability: SymbolID;
}

/**
 * Persistence Action
 */
export interface PersistenceAction {
  target: SymbolID;
  actionType: 'commit' | 'save' | 'persist' | 'insert' | 'update' | 'delete';
  authority: SymbolID;
  repository: SymbolID;
}

/**
 * Event Edge
 */
export interface EventEdge {
  eventType: SymbolID;
  authority: SymbolID;
  payload: SymbolID[];
}

/**
 * Trust Transition
 */
export interface TrustTransition {
  from: SymbolID;
  to: SymbolID;
  trustLevel: 'full' | 'partial' | 'none';
  authority: SymbolID;
}

/**
 * Constitutional Obligation
 */
export interface ConstitutionalObligation {
  ruleId: SymbolID;
  obligation: string;
  authority: SymbolID;
  evidence: SymbolID[];
}

/**
 * Semantic Lowerer
 */
export class SemanticLowerer {
  private canonicalSymbols: Map<SymbolID, CanonicalSymbol> = new Map();
  private semanticIR: Map<SymbolID, SemanticIRNode> = new Map();

  /**
   * Lower AST IR to canonical semantic IR
   */
  lower(astIR: Map<SymbolID, IRNode>): Map<SymbolID, SemanticIRNode> {
    for (const [id, node] of astIR) {
      const canonicalSymbol = this.canonicalizeSymbol(node);
      const semanticNode = this.lowerNode(node, canonicalSymbol);
      
      this.canonicalSymbols.set(id, canonicalSymbol);
      this.semanticIR.set(id, semanticNode);
    }

    // AST is now deleted - only semantic IR remains
    return this.semanticIR;
  }

  /**
   * Canonicalize a symbol
   */
  private canonicalizeSymbol(node: IRNode): CanonicalSymbol {
    const kind = this.determineCanonicalKind(node);
    const path = this.extractCanonicalPath(node);
    const owner = this.determineOwner(node);
    const constitutionalRoot = this.determineConstitutionalRoot(node);
    const semanticFingerprint = this.computeSemanticFingerprint(node);

    return {
      id: node.id,
      kind,
      name: node.name,
      path,
      owner,
      constitutionalRoot,
      semanticFingerprint,
      sourceLanguage: (node.metadata?.sourceLanguage as string) || 'unknown',
    };
  }

  /**
   * Lower a single IR node to semantic IR
   */
  private lowerNode(node: IRNode, canonicalSymbol: CanonicalSymbol): SemanticIRNode {
    return {
      id: node.id,
      canonicalSymbol: canonicalSymbol.id,
      type: node.type,
      authorityRequired: this.extractAuthority(node),
      capabilitiesConsumed: this.extractCapabilitiesConsumed(node),
      capabilitiesProduced: this.extractCapabilitiesProduced(node),
      stateMutations: this.extractMutations(node),
      persistenceActions: this.extractPersistence(node),
      eventsEmitted: this.extractEvents(node),
      trustTransitions: this.extractTrustTransitions(node),
      constitutionalObligations: this.extractObligations(node),
    };
  }

  /**
   * Determine canonical symbol kind
   */
  private determineCanonicalKind(node: IRNode): CanonicalSymbolKind {
    const name = node.name.toLowerCase();
    
    if (name.includes('authority')) return CanonicalSymbolKind.Authority;
    if (name.includes('repository')) return CanonicalSymbolKind.Repository;
    if (name.includes('capability')) return CanonicalSymbolKind.Capability;
    if (name.includes('identity')) return CanonicalSymbolKind.Identity;
    if (name.includes('worker')) return CanonicalSymbolKind.Worker;
    if (name.includes('projection')) return CanonicalSymbolKind.Projection;
    if (name.includes('service')) return CanonicalSymbolKind.Service;
    if (name.includes('event')) return CanonicalSymbolKind.Event;
    if (name.includes('provider')) return CanonicalSymbolKind.Provider;
    if (name.includes('factory')) return CanonicalSymbolKind.Factory;
    if (name.includes('builder')) return CanonicalSymbolKind.Builder;
    if (name.includes('valueobject') || name.includes('vo')) return CanonicalSymbolKind.ValueObject;
    if (name.includes('dto')) return CanonicalSymbolKind.DTO;
    
    // Default based on node type
    switch (node.type) {
      case IRNodeType.Authority:
        return CanonicalSymbolKind.Authority;
      case IRNodeType.Repository:
        return CanonicalSymbolKind.Repository;
      case IRNodeType.Capability:
        return CanonicalSymbolKind.Capability;
      case IRNodeType.Event:
        return CanonicalSymbolKind.Event;
      case IRNodeType.Provider:
        return CanonicalSymbolKind.Provider;
      case IRNodeType.Factory:
        return CanonicalSymbolKind.Factory;
      case IRNodeType.Builder:
        return CanonicalSymbolKind.Builder;
      case IRNodeType.Service:
        return CanonicalSymbolKind.Service;
      case IRNodeType.Worker:
        return CanonicalSymbolKind.Worker;
      case IRNodeType.Mission:
        return CanonicalSymbolKind.Root;
      default:
        return CanonicalSymbolKind.Service;
    }
  }

  /**
   * Extract canonical path
   */
  private extractCanonicalPath(node: IRNode): CanonicalSymbolPath {
    // TODO: Extract from source file structure
    // For now, use source file as proxy
    const sourceFile = node.sourceFile;
    const parts = sourceFile.split(/[/\\]/);
    
    return {
      organization: parts[0] || 'default',
      package: parts[1] || 'default',
      module: parts[2] || 'default',
      authority: (node.metadata?.authority as string) || undefined,
      capability: (node.metadata?.capability as string) || undefined,
      identity: (node.metadata?.identity as string) || undefined,
    };
  }

  /**
   * Determine owner
   */
  private determineOwner(node: IRNode): SymbolID {
    // TODO: Resolve from authority hierarchy
    return node.metadata?.owner as SymbolID || node.id;
  }

  /**
   * Determine constitutional root
   */
  private determineConstitutionalRoot(node: IRNode): SymbolID {
    // TODO: Resolve from constitutional registry
    return node.metadata?.constitutionalRoot as SymbolID || node.id;
  }

  /**
   * Compute semantic fingerprint
   */
  private computeSemanticFingerprint(node: IRNode): string {
    // TODO: Compute based on semantic properties, not syntax
    const fingerprint = {
      type: node.type,
      name: node.name,
      authority: node.metadata?.authority,
      capabilities: node.metadata?.capabilities,
    };
    return JSON.stringify(fingerprint);
  }

  /**
   * Extract authority required
   */
  private extractAuthority(node: IRNode): SymbolID | undefined {
    return node.metadata?.resolvedAuthority as SymbolID;
  }

  /**
   * Extract capabilities consumed
   */
  private extractCapabilitiesConsumed(node: IRNode): SymbolID[] {
    const capabilities: SymbolID[] = [];
    
    if (node.metadata?.capabilityEdge) {
      capabilities.push(node.metadata.capabilityEdge as SymbolID);
    }
    
    return capabilities;
  }

  /**
   * Extract capabilities produced
   */
  private extractCapabilitiesProduced(node: IRNode): SymbolID[] {
    const capabilities: SymbolID[] = [];
    
    // Method calls produce capabilities
    if (node.type === IRNodeType.MethodCalls && node.metadata?.methodName) {
      capabilities.push(node.id);
    }
    
    return capabilities;
  }

  /**
   * Extract mutations
   */
  private extractMutations(node: IRNode): MutationEdge[] {
    const mutations: MutationEdge[] = [];
    
    if (node.type === IRNodeType.Assignments) {
      const mutationType = node.metadata?.mutationType as 'field' | 'property' | 'collection' | 'repository' | 'cache' | 'filesystem' || 'field';
      mutations.push({
        target: node.id,
        mutationType,
        authority: (node.metadata?.authority as SymbolID) || node.id,
        capability: (node.metadata?.capability as SymbolID) || node.id,
      });
    }
    
    return mutations;
  }

  /**
   * Extract persistence actions
   */
  private extractPersistence(node: IRNode): PersistenceAction[] {
    const actions: PersistenceAction[] = [];
    
    if (node.type === IRNodeType.Assignments && node.metadata?.isRepositoryCommit) {
      actions.push({
        target: node.id,
        actionType: 'commit',
        authority: node.metadata?.authority as SymbolID || node.id,
        repository: node.id,
      });
    }
    
    return actions;
  }

  /**
   * Extract events
   */
  private extractEvents(node: IRNode): EventEdge[] {
    const events: EventEdge[] = [];
    
    if (node.type === IRNodeType.MethodCalls && node.metadata?.isEventAppend) {
      events.push({
        eventType: node.id,
        authority: node.metadata?.authority as SymbolID || node.id,
        payload: [],
      });
    }
    
    return events;
  }

  /**
   * Extract trust transitions
   */
  private extractTrustTransitions(node: IRNode): TrustTransition[] {
    // TODO: Extract from authority delegation patterns
    return [];
  }

  /**
   * Extract constitutional obligations
   */
  private extractObligations(node: IRNode): ConstitutionalObligation[] {
    // TODO: Extract from constitutional registry
    return [];
  }

  /**
   * Get canonical symbols
   */
  getCanonicalSymbols(): Map<SymbolID, CanonicalSymbol> {
    return this.canonicalSymbols;
  }

  /**
   * Get semantic IR
   */
  getSemanticIR(): Map<SymbolID, SemanticIRNode> {
    return this.semanticIR;
  }
}
