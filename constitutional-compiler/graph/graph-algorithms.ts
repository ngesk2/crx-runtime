/**
 * Graph Algorithms
 * 
 * You said 60-90 graphs.
 * Now they actually become useful.
 * 
 * Algorithms:
 * - Dominators
 * - SCC (Strongly Connected Components)
 * - Cycle detection
 * - Trust cycles
 * - Ownership cycles
 * - Capability leakage
 * - Minimal cut
 * - Strong connectivity
 * - Topological sort
 * - Shortest authority path
 * - Critical dependency analysis
 * - Graph coloring
 * - Community detection
 * - Influence analysis
 * - Reachability
 * - Transitive closure
 * - Impact analysis
 */

import { SymbolID } from '../ir/node-types';

/**
 * Graph Node
 */
export interface GraphNode {
  id: SymbolID;
  data?: any;
}

/**
 * Graph Edge
 */
export interface GraphEdge {
  from: SymbolID;
  to: SymbolID;
  weight?: number;
  data?: any;
}

/**
 * Graph
 */
export interface Graph {
  nodes: Map<SymbolID, GraphNode>;
  edges: Map<SymbolID, GraphEdge[]>;
  directed: boolean;
}

/**
 * Dominator Result
 */
export interface DominatorResult {
  dominators: Map<SymbolID, Set<SymbolID>>;
  immediateDominators: Map<SymbolID, SymbolID>;
  dominanceFrontier: Map<SymbolID, Set<SymbolID>>;
}

/**
 * SCC Result
 */
export interface SCCResult {
  components: Set<SymbolID>[];
  componentMap: Map<SymbolID, number>;
}

/**
 * Cycle Detection Result
 */
export interface CycleDetectionResult {
  hasCycles: boolean;
  cycles: SymbolID[][];
}

/**
 * Path Result
 */
export interface PathResult {
  path: SymbolID[];
  distance: number;
}

/**
 * Graph Algorithms Engine
 */
export class GraphAlgorithmsEngine {
  /**
   * Build graph from nodes and edges
   */
  buildGraph(
    nodes: GraphNode[],
    edges: GraphEdge[],
    directed: boolean = true
  ): Graph {
    const nodeMap = new Map<SymbolID, GraphNode>();
    const edgeMap = new Map<SymbolID, GraphEdge[]>();

    for (const node of nodes) {
      nodeMap.set(node.id, node);
      edgeMap.set(node.id, []);
    }

    for (const edge of edges) {
      if (!edgeMap.has(edge.from)) {
        edgeMap.set(edge.from, []);
      }
      edgeMap.get(edge.from)!.push(edge);

      if (!directed) {
        if (!edgeMap.has(edge.to)) {
          edgeMap.set(edge.to, []);
        }
        edgeMap.get(edge.to)!.push({ from: edge.to, to: edge.from, weight: edge.weight, data: edge.data });
      }
    }

    return {
      nodes: nodeMap,
      edges: edgeMap,
      directed,
    };
  }

  /**
   * Compute dominators (Lengauer-Tarjan algorithm)
   */
  computeDominators(graph: Graph, entry: SymbolID): DominatorResult {
    const dominators = new Map<SymbolID, Set<SymbolID>>();
    const immediateDominators = new Map<SymbolID, SymbolID>();
    const dominanceFrontier = new Map<SymbolID, Set<SymbolID>>();

    // Initialize dominators
    for (const nodeId of graph.nodes.keys()) {
      dominators.set(nodeId, new Set<SymbolID>());
    }
    dominators.set(entry, new Set([entry]));

    // Iterative dataflow analysis
    let changed = true;
    while (changed) {
      changed = false;

      for (const nodeId of graph.nodes.keys()) {
        if (nodeId === entry) continue;

        const predecessors = this.getPredecessors(graph, nodeId);
        if (predecessors.length === 0) continue;

        const newDominators = new Set<SymbolID>([nodeId]);
        
        for (const pred of predecessors) {
          const predDominators = dominators.get(pred);
          if (predDominators) {
            if (newDominators.size === 1 && newDominators.has(nodeId)) {
              predDominators.forEach(d => newDominators.add(d));
            } else {
              const intersection = new Set<SymbolID>();
              for (const d of newDominators) {
                if (predDominators.has(d)) {
                  intersection.add(d);
                }
              }
              newDominators.clear();
              intersection.forEach(d => newDominators.add(d));
            }
          }
        }

        const oldDominators = dominators.get(nodeId);
        if (!this.setsEqual(oldDominators!, newDominators)) {
          dominators.set(nodeId, newDominators);
          changed = true;
        }
      }
    }

    // Compute immediate dominators
    for (const nodeId of graph.nodes.keys()) {
      if (nodeId === entry) continue;

      const nodeDominators = dominators.get(nodeId)!;
      nodeDominators.delete(nodeId);

      let immediate: SymbolID | null = null;
      for (const dom of nodeDominators) {
        const domDominators = dominators.get(dom)!;
        domDominators.delete(dom);

        let isImmediate = true;
        for (const otherDom of nodeDominators) {
          if (otherDom !== dom && domDominators.has(otherDom)) {
            isImmediate = false;
            break;
          }
        }

        if (isImmediate) {
          immediate = dom;
          break;
        }
      }

      if (immediate) {
        immediateDominators.set(nodeId, immediate);
      }
    }

    // Compute dominance frontier
    for (const nodeId of graph.nodes.keys()) {
      dominanceFrontier.set(nodeId, new Set<SymbolID>());
    }

    for (const nodeId of graph.nodes.keys()) {
      const predecessors = this.getPredecessors(graph, nodeId);
      if (predecessors.length < 2) continue;

      for (const pred of predecessors) {
        let runner = pred;
        while (runner !== immediateDominators.get(nodeId)) {
          dominanceFrontier.get(runner)!.add(nodeId);
          runner = immediateDominators.get(runner)!;
        }
      }
    }

    return {
      dominators,
      immediateDominators,
      dominanceFrontier,
    };
  }

  /**
   * Compute Strongly Connected Components (Tarjan's algorithm)
   */
  computeSCC(graph: Graph): SCCResult {
    let index = 0;
    const stack: SymbolID[] = [];
    const onStack = new Set<SymbolID>();
    const indices = new Map<SymbolID, number>();
    const lowLinks = new Map<SymbolID, number>();
    const components: Set<SymbolID>[] = [];
    const componentMap = new Map<SymbolID, number>();

    const strongConnect = (nodeId: SymbolID): void => {
      indices.set(nodeId, index);
      lowLinks.set(nodeId, index);
      index++;
      stack.push(nodeId);
      onStack.add(nodeId);

      const successors = graph.edges.get(nodeId) || [];
      for (const edge of successors) {
        if (!indices.has(edge.to)) {
          strongConnect(edge.to);
          lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, lowLinks.get(edge.to)!));
        } else if (onStack.has(edge.to)) {
          lowLinks.set(nodeId, Math.min(lowLinks.get(nodeId)!, indices.get(edge.to)!));
        }
      }

      if (lowLinks.get(nodeId) === indices.get(nodeId)) {
        const component = new Set<SymbolID>();
        let w: SymbolID | undefined;
        do {
          w = stack.pop();
          onStack.delete(w!);
          component.add(w!);
          componentMap.set(w!, components.length);
        } while (w !== nodeId);
        components.push(component);
      }
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!indices.has(nodeId)) {
        strongConnect(nodeId);
      }
    }

    return { components, componentMap };
  }

  /**
   * Detect cycles
   */
  detectCycles(graph: Graph): CycleDetectionResult {
    const visited = new Set<SymbolID>();
    const recursionStack = new Set<SymbolID>();
    const cycles: SymbolID[][] = [];

    const dfs = (nodeId: SymbolID, path: SymbolID[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const successors = graph.edges.get(nodeId) || [];
      for (const edge of successors) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, [...path]);
        } else if (recursionStack.has(edge.to)) {
          const cycleStart = path.indexOf(edge.to);
          cycles.push(path.slice(cycleStart));
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return {
      hasCycles: cycles.length > 0,
      cycles,
    };
  }

  /**
   * Detect trust cycles
   */
  detectTrustCycles(graph: Graph): CycleDetectionResult {
    // Filter edges to trust transitions only
    const trustEdges: GraphEdge[] = [];
    
    for (const [fromId, edges] of graph.edges) {
      for (const edge of edges) {
        if (edge.data?.type === 'trust') {
          trustEdges.push(edge);
        }
      }
    }

    const trustGraph = this.buildGraph(
      Array.from(graph.nodes.values()),
      trustEdges,
      true
    );

    return this.detectCycles(trustGraph);
  }

  /**
   * Detect ownership cycles
   */
  detectOwnershipCycles(graph: Graph): CycleDetectionResult {
    // Filter edges to ownership transitions only
    const ownershipEdges: GraphEdge[] = [];
    
    for (const [fromId, edges] of graph.edges) {
      for (const edge of edges) {
        if (edge.data?.type === 'ownership') {
          ownershipEdges.push(edge);
        }
      }
    }

    const ownershipGraph = this.buildGraph(
      Array.from(graph.nodes.values()),
      ownershipEdges,
      true
    );

    return this.detectCycles(ownershipGraph);
  }

  /**
   * Detect capability leakage
   */
  detectCapabilityLeakage(graph: Graph): SymbolID[] {
    const leaked: SymbolID[] = [];

    // Find capabilities that are granted to unauthorized entities
    for (const [nodeId, edges] of graph.edges) {
      for (const edge of edges) {
        if (edge.data?.type === 'capability' && edge.data?.leaked) {
          leaked.push(edge.to);
        }
      }
    }

    return leaked;
  }

  /**
   * Compute minimal cut
   */
  computeMinimalCut(graph: Graph, source: SymbolID, sink: SymbolID): { edges: GraphEdge[]; capacity: number } {
    // TODO: Implement max-flow min-cut algorithm (e.g., Edmonds-Karp)
    return { edges: [], capacity: 0 };
  }

  /**
   * Check strong connectivity
   */
  isStronglyConnected(graph: Graph): boolean {
    const scc = this.computeSCC(graph);
    return scc.components.length === 1;
  }

  /**
   * Topological sort (Kahn's algorithm)
   */
  topologicalSort(graph: Graph): SymbolID[] {
    const inDegree = new Map<SymbolID, number>();
    const queue: SymbolID[] = [];
    const result: SymbolID[] = [];

    // Initialize in-degrees
    for (const nodeId of graph.nodes.keys()) {
      inDegree.set(nodeId, 0);
    }

    // Compute in-degrees
    for (const [fromId, edges] of graph.edges) {
      for (const edge of edges) {
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      }
    }

    // Find nodes with in-degree 0
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const successors = graph.edges.get(nodeId) || [];
      for (const edge of successors) {
        inDegree.set(edge.to, inDegree.get(edge.to)! - 1);
        if (inDegree.get(edge.to) === 0) {
          queue.push(edge.to);
        }
      }
    }

    // Check for cycle
    if (result.length !== graph.nodes.size) {
      throw new Error('Graph has a cycle, cannot perform topological sort');
    }

    return result;
  }

  /**
   * Compute shortest path (Dijkstra's algorithm)
   */
  shortestPath(graph: Graph, source: SymbolID, target: SymbolID): PathResult | null {
    const distances = new Map<SymbolID, number>();
    const previous = new Map<SymbolID, SymbolID>();
    const visited = new Set<SymbolID>();

    // Initialize distances
    for (const nodeId of graph.nodes.keys()) {
      distances.set(nodeId, Infinity);
    }
    distances.set(source, 0);

    // Dijkstra
    while (visited.size < graph.nodes.size) {
      // Find unvisited node with minimum distance
      let minDistance = Infinity;
      let currentNode: SymbolID | null = null;

      for (const [nodeId, distance] of distances) {
        if (!visited.has(nodeId) && distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (currentNode === null || minDistance === Infinity) {
        break;
      }

      visited.add(currentNode);

      if (currentNode === target) {
        break;
      }

      const successors = graph.edges.get(currentNode) || [];
      for (const edge of successors) {
        const alt = distances.get(currentNode)! + (edge.weight || 1);
        if (alt < distances.get(edge.to)!) {
          distances.set(edge.to, alt);
          previous.set(edge.to, currentNode);
        }
      }
    }

    // Reconstruct path
    if (distances.get(target) === Infinity) {
      return null;
    }

    const path: SymbolID[] = [];
    let current: SymbolID | undefined = target;
    while (current !== undefined) {
      path.unshift(current);
      current = previous.get(current);
    }

    return {
      path,
      distance: distances.get(target)!,
    };
  }

  /**
   * Compute shortest authority path
   */
  shortestAuthorityPath(graph: Graph, source: SymbolID, target: SymbolID): PathResult | null {
    // Filter edges to authority transitions only
    const authorityEdges: GraphEdge[] = [];
    
    for (const [fromId, edges] of graph.edges) {
      for (const edge of edges) {
        if (edge.data?.type === 'authority') {
          authorityEdges.push(edge);
        }
      }
    }

    const authorityGraph = this.buildGraph(
      Array.from(graph.nodes.values()),
      authorityEdges,
      true
    );

    return this.shortestPath(authorityGraph, source, target);
  }

  /**
   * Critical dependency analysis
   */
  criticalDependencyAnalysis(graph: Graph): SymbolID[] {
    const critical: SymbolID[] = [];
    const scc = this.computeSCC(graph);

    // Find nodes that, if removed, would disconnect the graph
    for (const nodeId of graph.nodes.keys()) {
      const tempGraph = this.buildGraph(
        Array.from(graph.nodes.values()).filter(n => n.id !== nodeId),
        Array.from(graph.edges.entries())
          .filter(([fromId]) => fromId !== nodeId)
          .flatMap(([_, edges]) => edges.filter(e => e.to !== nodeId)),
        graph.directed
      );

      const tempSCC = this.computeSCC(tempGraph);
      if (tempSCC.components.length > scc.components.length) {
        critical.push(nodeId);
      }
    }

    return critical;
  }

  /**
   * Graph coloring
   */
  graphColoring(graph: Graph): Map<SymbolID, number> {
    const colors = new Map<SymbolID, number>();
    const nodes = Array.from(graph.nodes.keys());

    // Simple greedy coloring
    for (const nodeId of nodes) {
      const usedColors = new Set<number>();

      const neighbors = this.getNeighbors(graph, nodeId);
      for (const neighborId of neighbors) {
        const color = colors.get(neighborId);
        if (color !== undefined) {
          usedColors.add(color);
        }
      }

      let color = 0;
      while (usedColors.has(color)) {
        color++;
      }

      colors.set(nodeId, color);
    }

    return colors;
  }

  /**
   * Community detection (Louvain algorithm)
   */
  communityDetection(graph: Graph): Map<SymbolID, number> {
    // TODO: Implement Louvain algorithm for community detection
    const communities = new Map<SymbolID, number>();
    let communityId = 0;

    for (const nodeId of graph.nodes.keys()) {
      communities.set(nodeId, communityId++);
    }

    return communities;
  }

  /**
   * Influence analysis (PageRank)
   */
  influenceAnalysis(graph: Graph, dampingFactor: number = 0.85, iterations: number = 100): Map<SymbolID, number> {
    let influence = new Map<SymbolID, number>();
    const n = graph.nodes.size;

    // Initialize
    for (const nodeId of graph.nodes.keys()) {
      influence.set(nodeId, 1 / n);
    }

    // PageRank iterations
    for (let i = 0; i < iterations; i++) {
      const newInfluence = new Map<SymbolID, number>();

      for (const nodeId of graph.nodes.keys()) {
        let sum = 0;
        const predecessors = this.getPredecessors(graph, nodeId);

        for (const predId of predecessors) {
          const predEdges = graph.edges.get(predId) || [];
          const outDegree = predEdges.length;
          if (outDegree > 0) {
            sum += influence.get(predId)! / outDegree;
          }
        }

        newInfluence.set(nodeId, (1 - dampingFactor) / n + dampingFactor * sum);
      }

      influence = newInfluence;
    }

    return influence;
  }

  /**
   * Reachability analysis
   */
  reachability(graph: Graph, source: SymbolID): Set<SymbolID> {
    const reachable = new Set<SymbolID>();
    const visited = new Set<SymbolID>();
    const queue: SymbolID[] = [source];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      reachable.add(nodeId);

      const successors = graph.edges.get(nodeId) || [];
      for (const edge of successors) {
        if (!visited.has(edge.to)) {
          queue.push(edge.to);
        }
      }
    }

    return reachable;
  }

  /**
   * Transitive closure
   */
  transitiveClosure(graph: Graph): Map<SymbolID, Set<SymbolID>> {
    const closure = new Map<SymbolID, Set<SymbolID>>();

    for (const nodeId of graph.nodes.keys()) {
      closure.set(nodeId, this.reachability(graph, nodeId));
    }

    return closure;
  }

  /**
   * Impact analysis
   */
  impactAnalysis(graph: Graph, nodeId: SymbolID): {
    upstream: Set<SymbolID>;
    downstream: Set<SymbolID>;
    total: number;
  } {
    const upstream = new Set<SymbolID>();
    const downstream = new Set<SymbolID>();

    // Compute upstream (ancestors)
    const visitedUp = new Set<SymbolID>();
    const queueUp: SymbolID[] = [nodeId];

    while (queueUp.length > 0) {
      const current = queueUp.shift()!;
      if (visitedUp.has(current)) continue;

      visitedUp.add(current);
      const predecessors = this.getPredecessors(graph, current);
      for (const pred of predecessors) {
        if (!visitedUp.has(pred)) {
          queueUp.push(pred);
          upstream.add(pred);
        }
      }
    }

    // Compute downstream (descendants)
    const visitedDown = new Set<SymbolID>();
    const queueDown: SymbolID[] = [nodeId];

    while (queueDown.length > 0) {
      const current = queueDown.shift()!;
      if (visitedDown.has(current)) continue;

      visitedDown.add(current);
      const successors = graph.edges.get(current) || [];
      for (const edge of successors) {
        if (!visitedDown.has(edge.to)) {
          queueDown.push(edge.to);
          downstream.add(edge.to);
        }
      }
    }

    return {
      upstream,
      downstream,
      total: upstream.size + downstream.size,
    };
  }

  /**
   * Get predecessors of a node
   */
  private getPredecessors(graph: Graph, nodeId: SymbolID): SymbolID[] {
    const predecessors: SymbolID[] = [];

    for (const [fromId, edges] of graph.edges) {
      for (const edge of edges) {
        if (edge.to === nodeId) {
          predecessors.push(fromId);
        }
      }
    }

    return predecessors;
  }

  /**
   * Get neighbors of a node
   */
  private getNeighbors(graph: Graph, nodeId: SymbolID): SymbolID[] {
    const neighbors: SymbolID[] = [];

    const successors = graph.edges.get(nodeId) || [];
    for (const edge of successors) {
      neighbors.push(edge.to);
    }

    const predecessors = this.getPredecessors(graph, nodeId);
    for (const pred of predecessors) {
      neighbors.push(pred);
    }

    return neighbors;
  }

  /**
   * Check if two sets are equal
   */
  private setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
}
