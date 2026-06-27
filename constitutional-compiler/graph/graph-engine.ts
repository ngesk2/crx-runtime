/**
 * Graph Engine
 * 
 * Eventually 60-90 independent graph types.
 * Every graph should be independently computable.
 * 
 * Examples:
 * - Construction Graph
 * - Mutation Graph
 * - Persistence Graph
 * - Trust Graph
 * - Ownership Graph
 * - Capability Graph
 * - Reflection Graph
 * - Dynamic Import Graph
 * - Inheritance Graph
 * - Generic Instantiation Graph
 * - Dependency Injection Graph
 * - Factory Graph
 * - Builder Graph
 * - Repository Graph
 * - Identity Graph
 * - Witness Graph
 * - Replay Graph
 * - Projection Graph
 * - Knowledge Graph
 * - Governance Graph
 * - Scheduler Graph
 * - Worker Graph
 * - Mission Graph
 * - Provider Graph
 * - Service Graph
 * - Authority Graph
 * - Constitutional Root Graph
 * - Boundary Crossing Graph
 * - Illegal Transition Graph
 * - State Machine Graph
 * - Lifecycle Graph
 * - Cryptographic Trust Graph
 * - Data Flow Graph
 * - Control Flow Graph
 * - Version Graph
 * - Ownership Transfer Graph
 * - Authorization Graph
 * - Capability Consumption Graph
 * - Capability Production Graph
 * - Rule Dependency Graph
 * - Rule Provenance Graph
 * - Violation Lineage Graph
 * - Counter Evidence Graph
 * - Compilation Dependency Graph
 * - Module Federation Graph
 * - Package Evolution Graph
 * - Trust Delegation Graph
 * - Identity Resolution Graph
 * - Replay Determinism Graph
 * - Cryptographic Chain Graph
 * - Distributed Worker Graph
 * - Cluster Graph
 * - Consensus Graph
 * - Replication Graph
 */

import { SymbolID } from '../ir/node-types';
import { SemanticIRNode } from '../lowering/semantic-lowerer';
import { CanonicalSymbol } from '../lowering/semantic-lowerer';

/**
 * Graph Type
 */
export enum GraphType {
  // Core graphs
  Construction = 'Construction',
  Mutation = 'Mutation',
  Persistence = 'Persistence',
  Trust = 'Trust',
  Ownership = 'Ownership',
  Capability = 'Capability',
  
  // Structural graphs
  Reflection = 'Reflection',
  DynamicImport = 'DynamicImport',
  Inheritance = 'Inheritance',
  GenericInstantiation = 'GenericInstantiation',
  DependencyInjection = 'DependencyInjection',
  
  // Pattern graphs
  Factory = 'Factory',
  Builder = 'Builder',
  Repository = 'Repository',
  Identity = 'Identity',
  Witness = 'Witness',
  Replay = 'Replay',
  Projection = 'Projection',
  Knowledge = 'Knowledge',
  
  // Constitutional graphs
  Governance = 'Governance',
  Scheduler = 'Scheduler',
  Worker = 'Worker',
  Mission = 'Mission',
  Provider = 'Provider',
  Service = 'Service',
  Authority = 'Authority',
  ConstitutionalRoot = 'ConstitutionalRoot',
  
  // Boundary graphs
  BoundaryCrossing = 'BoundaryCrossing',
  IllegalTransition = 'IllegalTransition',
  StateMachine = 'StateMachine',
  Lifecycle = 'Lifecycle',
  
  // Cryptographic graphs
  CryptographicTrust = 'CryptographicTrust',
  
  // Flow graphs
  DataFlow = 'DataFlow',
  ControlFlow = 'ControlFlow',
  
  // Evolution graphs
  Version = 'Version',
  OwnershipTransfer = 'OwnershipTransfer',
  PackageEvolution = 'PackageEvolution',
  
  // Capability graphs
  CapabilityConsumption = 'CapabilityConsumption',
  CapabilityProduction = 'CapabilityProduction',
  
  // Rule graphs
  RuleDependency = 'RuleDependency',
  RuleProvenance = 'RuleProvenance',
  ViolationLineage = 'ViolationLineage',
  CounterEvidence = 'CounterEvidence',
  
  // System graphs
  CompilationDependency = 'CompilationDependency',
  ModuleFederation = 'ModuleFederation',
  TrustDelegation = 'TrustDelegation',
  IdentityResolution = 'IdentityResolution',
  ReplayDeterminism = 'ReplayDeterminism',
  CryptographicChain = 'CryptographicChain',
  DistributedWorker = 'DistributedWorker',
  Cluster = 'Cluster',
  Consensus = 'Consensus',
  Replication = 'Replication',
  Authorization = 'Authorization',
}

/**
 * Graph Node
 */
export interface GraphNode {
  id: SymbolID;
  type: GraphType;
  data: any;
}

/**
 * Graph Edge
 */
export interface GraphEdge {
  from: SymbolID;
  to: SymbolID;
  type: string;
  data: any;
}

/**
 * Graph
 */
export interface Graph {
  id: SymbolID;
  type: GraphType;
  nodes: Map<SymbolID, GraphNode>;
  edges: GraphEdge[];
  metadata: any;
}

/**
 * Graph Computation Result
 */
export interface GraphComputationResult {
  graph: Graph;
  statistics: {
    nodeCount: number;
    edgeCount: number;
    computationTime: number;
  };
}

/**
 * Graph Engine
 */
export class GraphEngine {
  private graphs: Map<GraphType, Graph> = new Map();
  private graphComputers: Map<GraphType, GraphComputer> = new Map();

  /**
   * Register graph computer
   */
  registerGraphComputer(type: GraphType, computer: GraphComputer): void {
    this.graphComputers.set(type, computer);
  }

  /**
   * Compute graph
   */
  async computeGraph(
    type: GraphType,
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<GraphComputationResult> {
    const computer = this.graphComputers.get(type);
    if (!computer) {
      throw new Error(`No graph computer registered for type: ${type}`);
    }

    const startTime = Date.now();
    const graph = await computer.compute(semanticIR, canonicalSymbols);
    const computationTime = Date.now() - startTime;

    this.graphs.set(type, graph);

    return {
      graph,
      statistics: {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.length,
        computationTime,
      },
    };
  }

  /**
   * Get graph by type
   */
  getGraph(type: GraphType): Graph | undefined {
    return this.graphs.get(type);
  }

  /**
   * Get all graphs
   */
  getAllGraphs(): Map<GraphType, Graph> {
    return new Map(this.graphs);
  }

  /**
   * Compute all graphs in parallel
   */
  async computeAllGraphs(
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<Map<GraphType, GraphComputationResult>> {
    const results = new Map<GraphType, GraphComputationResult>();
    
    const computations = Array.from(this.graphComputers.entries()).map(
      async ([type, computer]) => {
        const result = await this.computeGraph(type, semanticIR, canonicalSymbols);
        results.set(type, result);
      }
    );

    await Promise.all(computations);
    return results;
  }

  /**
   * Clear all graphs
   */
  clear(): void {
    this.graphs.clear();
  }

  /**
   * Get graph statistics
   */
  getGraphStatistics(): Map<GraphType, { nodeCount: number; edgeCount: number }> {
    const stats = new Map<GraphType, { nodeCount: number; edgeCount: number }>();
    
    for (const [type, graph] of this.graphs) {
      stats.set(type, {
        nodeCount: graph.nodes.size,
        edgeCount: graph.edges.length,
      });
    }
    
    return stats;
  }

  /**
   * Export graph to DOT format
   */
  exportGraphToDOT(type: GraphType): string {
    const graph = this.graphs.get(type);
    if (!graph) {
      throw new Error(`Graph not found: ${type}`);
    }

    let dot = `digraph ${type} {\n`;
    
    // Add nodes
    for (const [id, node] of graph.nodes) {
      dot += `  "${id}" [label="${node.data.label || id}"];\n`;
    }
    
    // Add edges
    for (const edge of graph.edges) {
      dot += `  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];\n`;
    }
    
    dot += '}';
    return dot;
  }

  /**
   * Export all graphs to DOT format
   */
  exportAllGraphsToDOT(): Map<GraphType, string> {
    const dotGraphs = new Map<GraphType, string>();
    
    for (const type of this.graphs.keys()) {
      dotGraphs.set(type, this.exportGraphToDOT(type));
    }
    
    return dotGraphs;
  }
}

/**
 * Graph Computer Interface
 */
export interface GraphComputer {
  compute(
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<Graph>;
}

/**
 * Base Graph Computer
 */
export abstract class BaseGraphComputer implements GraphComputer {
  abstract compute(
    semanticIR: Map<SymbolID, SemanticIRNode>,
    canonicalSymbols: Map<SymbolID, CanonicalSymbol>
  ): Promise<Graph>;

  protected createGraph(type: GraphType): Graph {
    return {
      id: `graph-${type}-${Date.now()}`,
      type,
      nodes: new Map(),
      edges: [],
      metadata: {},
    };
  }

  protected addNode(graph: Graph, id: SymbolID, data: any): void {
    graph.nodes.set(id, {
      id,
      type: graph.type,
      data,
    });
  }

  protected addEdge(graph: Graph, from: SymbolID, to: SymbolID, edgeType: string, data: any = {}): void {
    graph.edges.push({
      from,
      to,
      type: edgeType,
      data,
    });
  }
}
