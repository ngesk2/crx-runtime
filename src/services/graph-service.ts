/**
 * Graph Service
 *
 * Consumes events and produces nodes, edges, and relationships.
 * No business logic - purely structural graph building.
 */

import { EventService, Event } from "./event-service";

/**
 * Graph Node
 */
export interface Node {
  id: string;
  type: string;
  data: unknown;
  createdAt: string;
}

/**
 * Graph Edge
 */
export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  createdAt: string;
}

/**
 * Graph
 */
export interface Graph {
  nodes: Map<string, Node>;
  edges: Map<string, Edge>;
}

/**
 * Path
 */
export interface Path {
  nodes: string[];
  edges: Edge[];
}

/**
 * Graph Service Interface
 */
export interface GraphService {
  buildGraph(): Promise<Graph>;
  getNodes(type?: string): Promise<Node[]>;
  getEdges(sourceId?: string, targetId?: string): Promise<Edge[]>;
  getPath(sourceId: string, targetId: string): Promise<Path | null>;
  rebuildGraph(): Promise<void>;
}

/**
 * In-Memory Graph Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Graph is lost on restart.
 * Use only for development/testing.
 */
export class InMemoryGraphService implements GraphService {
  private graph: Graph = {
    nodes: new Map(),
    edges: new Map(),
  };

  constructor(private eventService: EventService) {}

  async buildGraph(): Promise<Graph> {
    // Get all events
    const allEvents = await this.eventService.getEventsAfter("");

    // Process events to build graph
    for (const event of allEvents) {
      await this.processEvent(event);
    }

    return this.graph;
  }

  async getNodes(type?: string): Promise<Node[]> {
    const nodes = Array.from(this.graph.nodes.values());
    if (type) {
      return nodes.filter((node) => node.type === type);
    }
    return nodes;
  }

  async getEdges(
    sourceId?: string,
    targetId?: string
  ): Promise<Edge[]> {
    const edges = Array.from(this.graph.edges.values());
    if (sourceId) {
      return edges.filter((edge) => edge.sourceId === sourceId);
    }
    if (targetId) {
      return edges.filter((edge) => edge.targetId === targetId);
    }
    return edges;
  }

  async getPath(
    sourceId: string,
    targetId: string
  ): Promise<Path | null> {
    // BFS for shortest path
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[] }[] = [
      { nodeId: sourceId, path: [sourceId] },
    ];

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === targetId) {
        // Build path with edges
        const edges: Edge[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const source = path[i];
          const target = path[i + 1];
          const edge = Array.from(this.graph.edges.values()).find(
            (e) => e.sourceId === source && e.targetId === target
          );
          if (edge) {
            edges.push(edge);
          }
        }
        return { nodes: path, edges };
      }

      if (visited.has(nodeId)) {
        continue;
      }
      visited.add(nodeId);

      // Get neighbors
      const neighbors = await this.getEdges(sourceId);
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId)) {
          queue.push({
            nodeId: edge.targetId,
            path: [...path, edge.targetId],
          });
        }
      }
    }

    return null;
  }

  async rebuildGraph(): Promise<void> {
    // Clear current graph
    this.graph = {
      nodes: new Map(),
      edges: new Map(),
    };

    // Rebuild from events
    await this.buildGraph();
  }

  private async processEvent(event: Event): Promise<void> {
    // Extract nodes and edges from events based on aggregate type
    switch (event.aggregateType) {
      case "Customer":
        this.addNode(event.aggregateId, "Customer", event.data);
        break;
      case "Property":
        this.addNode(event.aggregateId, "Property", event.data);
        break;
      case "Artifact":
        const artifactData = event.data as { artifactType: string };
        this.addNode(event.aggregateId, artifactData.artifactType, event.data);
        break;
      case "CrewMember":
        const crewData = event.data as { customerId: string; companyId: string };
        this.addNode(event.aggregateId, "CrewMember", event.data);
        this.addEdge(
          crewData.customerId,
          event.aggregateId,
          "hasCrewMember"
        );
        this.addEdge(
          event.aggregateId,
          crewData.companyId,
          "belongsTo"
        );
        break;
      case "OwnershipTransfer":
        const ownershipData = event.data as { propertyId: string; toOwnerId: string };
        this.addEdge(
          ownershipData.propertyId,
          ownershipData.toOwnerId,
          "ownedBy"
        );
        break;
      case "ArtifactLink":
        const linkData = event.data as { sourceId: string; targetId: string; relation: string };
        this.addEdge(
          linkData.sourceId,
          linkData.targetId,
          linkData.relation
        );
        break;
      default:
        // Unknown aggregate type, skip
        break;
    }
  }

  private addNode(id: string, type: string, data: unknown): void {
    if (!this.graph.nodes.has(id)) {
      this.graph.nodes.set(id, {
        id,
        type,
        data,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private addEdge(
    sourceId: string,
    targetId: string,
    relation: string
  ): void {
    const edgeId = `${sourceId}:${targetId}:${relation}`;
    if (!this.graph.edges.has(edgeId)) {
      this.graph.edges.set(edgeId, {
        id: edgeId,
        sourceId,
        targetId,
        relation,
        createdAt: new Date().toISOString(),
      });
    }
  }
}
