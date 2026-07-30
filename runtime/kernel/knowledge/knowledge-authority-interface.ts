/**
 * Knowledge Authority Interface
 * Public interface for knowledge subsystem.
 * Only this interface crosses subsystem boundaries.
 */

// Graph types (extended from relate operations)
export interface Node {
  id: string;
  type: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface NodeCreateInput {
  type: string;
  data: unknown;
}

export interface NodeUpdateInput {
  data?: unknown;
}

export interface NodeFilter {
  type?: string;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  data?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface EdgeCreateInput {
  sourceId: string;
  targetId: string;
  relation: string;
  data?: unknown;
}

export interface EdgeUpdateInput {
  data?: unknown;
}

export interface EdgeFilter {
  sourceId?: string;
  targetId?: string;
  relation?: string;
}

export interface Path {
  nodes: string[];
  edges: Edge[];
}

export interface Lineage {
  nodeId: string;
  ancestors: Node[];
  descendants: Node[];
  depth: number;
}

export interface IKnowledgeAuthority {
  // Knowledge operations (existing)
  ingest(artifact: Artifact): Promise<KnowledgeObject>;
  query(query: KnowledgeQuery): Promise<KnowledgeResult>;
  relate(sourceId: string, targetId: string, relation: string): Promise<void>;
  extract(knowledgeId: string, projection: string): Promise<Projection>;
  index(knowledgeId: string, embeddings: Embedding[]): Promise<void>;
  search(embedding: number[], limit: number): Promise<SearchResult[]>;

  // Graph operations (extended)
  createNode(data: NodeCreateInput): Promise<Node>;
  getNode(id: string): Promise<Node | null>;
  updateNode(id: string, updates: NodeUpdateInput): Promise<Node>;
  deleteNode(id: string): Promise<void>;
  listNodes(filter?: NodeFilter): Promise<Node[]>;

  createEdge(data: EdgeCreateInput): Promise<Edge>;
  getEdge(id: string): Promise<Edge | null>;
  updateEdge(id: string, updates: EdgeUpdateInput): Promise<Edge>;
  deleteEdge(id: string): Promise<void>;
  listEdges(filter?: EdgeFilter): Promise<Edge[]>;

  findPath(sourceId: string, targetId: string): Promise<Path | null>;
  findNeighbors(nodeId: string): Promise<Node[]>;
  findAncestors(nodeId: string): Promise<Node[]>;
  findDescendants(nodeId: string): Promise<Node[]>;

  getLineage(nodeId: string): Promise<Lineage>;
  traceLineage(nodeId: string, depth?: number): Promise<Lineage>;
}

export interface Artifact {
  artifactId: string;
  kind: string;
  data: unknown;
  metadata: ArtifactMetadata;
}

export interface ArtifactMetadata {
  createdAt: string;
  source: string;
  format: string;
}

export interface KnowledgeObject {
  knowledgeId: string;
  artifactId: string;
  kind: string;
  content: unknown;
  metadata: KnowledgeMetadata;
}

export interface KnowledgeMetadata {
  createdAt: string;
  updatedAt: string;
  confidence: number;
  source: string;
}

export interface KnowledgeQuery {
  query: string;
  kind?: string;
  filters: Record<string, unknown>;
  limit?: number;
}

export interface KnowledgeResult {
  results: KnowledgeObject[];
  total: number;
  metadata: Record<string, unknown>;
}

export interface Projection {
  projectionId: string;
  knowledgeId: string;
  targetKind: string;
  data: unknown;
  metadata: Record<string, unknown>;
}

export interface Embedding {
  vector: number[];
  dimension: number;
  model: string;
}

export interface SearchResult {
  knowledgeId: string;
  artifactId: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

// Stub implementation for pipeline wiring
export class InMemoryKnowledgeAuthority implements IKnowledgeAuthority {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private knowledgeObjects: Map<string, KnowledgeObject> = new Map();
  private embeddings: Map<string, Embedding[]> = new Map();

  // Knowledge operations
  async ingest(artifact: Artifact): Promise<KnowledgeObject> {
    const knowledgeId = `knowledge-${artifact.artifactId}`;
    const now = new Date().toISOString();
    const knowledgeObject: KnowledgeObject = {
      knowledgeId,
      artifactId: artifact.artifactId,
      kind: artifact.kind,
      content: artifact.data,
      metadata: {
        createdAt: now,
        updatedAt: now,
        confidence: 1.0,
        source: artifact.metadata.source,
      },
    };
    this.knowledgeObjects.set(knowledgeId, knowledgeObject);
    return knowledgeObject;
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeResult> {
    const results = Array.from(this.knowledgeObjects.values()).filter(ko => {
      if (query.kind && ko.kind !== query.kind) return false;
      return true;
    });
    return { results, total: results.length, metadata: {} };
  }

  async relate(sourceId: string, targetId: string, relation: string): Promise<void> {
    const edgeId = `edge-${sourceId}-${targetId}-${relation}`;
    const now = new Date().toISOString();
    const edge: Edge = {
      id: edgeId,
      sourceId,
      targetId,
      relation,
      createdAt: now,
      updatedAt: now,
    };
    this.edges.set(edgeId, edge);
  }

  async extract(knowledgeId: string, projection: string): Promise<Projection> {
    const knowledgeObject = this.knowledgeObjects.get(knowledgeId);
    if (!knowledgeObject) throw new Error(`Knowledge object not found: ${knowledgeId}`);
    return {
      projectionId: `projection-${knowledgeId}-${projection}`,
      knowledgeId,
      targetKind: projection,
      data: knowledgeObject.content,
      metadata: {},
    };
  }

  async index(knowledgeId: string, embeddings: Embedding[]): Promise<void> {
    this.embeddings.set(knowledgeId, embeddings);
  }

  async search(embedding: number[], limit: number): Promise<SearchResult[]> {
    // Stub: return empty results
    return [];
  }

  // Graph operations
  async createNode(data: NodeCreateInput): Promise<Node> {
    const id = `node-${Date.now()}-${Math.random()}`;
    const now = new Date().toISOString();
    const node: Node = { id, ...data, createdAt: now, updatedAt: now };
    this.nodes.set(id, node);
    return node;
  }

  async getNode(id: string): Promise<Node | null> {
    return this.nodes.get(id) || null;
  }

  async updateNode(id: string, updates: NodeUpdateInput): Promise<Node> {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Node not found: ${id}`);
    const updated = { ...node, ...updates, updatedAt: new Date().toISOString() };
    this.nodes.set(id, updated);
    return updated;
  }

  async deleteNode(id: string): Promise<void> {
    this.nodes.delete(id);
  }

  async listNodes(filter?: NodeFilter): Promise<Node[]> {
    let nodes = Array.from(this.nodes.values());
    if (filter?.type) {
      nodes = nodes.filter(n => n.type === filter.type);
    }
    return nodes;
  }

  async createEdge(data: EdgeCreateInput): Promise<Edge> {
    const id = `edge-${data.sourceId}-${data.targetId}-${data.relation}`;
    const now = new Date().toISOString();
    const edge: Edge = { id, ...data, createdAt: now, updatedAt: now };
    this.edges.set(id, edge);
    return edge;
  }

  async getEdge(id: string): Promise<Edge | null> {
    return this.edges.get(id) || null;
  }

  async updateEdge(id: string, updates: EdgeUpdateInput): Promise<Edge> {
    const edge = this.edges.get(id);
    if (!edge) throw new Error(`Edge not found: ${id}`);
    const updated = { ...edge, ...updates, updatedAt: new Date().toISOString() };
    this.edges.set(id, updated);
    return updated;
  }

  async deleteEdge(id: string): Promise<void> {
    this.edges.delete(id);
  }

  async listEdges(filter?: EdgeFilter): Promise<Edge[]> {
    let edges = Array.from(this.edges.values());
    if (filter?.sourceId) edges = edges.filter(e => e.sourceId === filter.sourceId);
    if (filter?.targetId) edges = edges.filter(e => e.targetId === filter.targetId);
    if (filter?.relation) edges = edges.filter(e => e.relation === filter.relation);
    return edges;
  }

  async findPath(sourceId: string, targetId: string): Promise<Path | null> {
    // Stub: simple BFS
    const visited = new Set<string>();
    const queue: Array<{ nodeId: string; path: string[] }> = [{ nodeId: sourceId, path: [sourceId] }];
    
    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;
      if (nodeId === targetId) {
        return { nodes: path, edges: [] };
      }
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      const neighbors = await this.findNeighbors(nodeId);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          queue.push({ nodeId: neighbor.id, path: [...path, neighbor.id] });
        }
      }
    }
    return null;
  }

  async findNeighbors(nodeId: string): Promise<Node[]> {
    const edges = await this.listEdges({ sourceId: nodeId });
    const neighborIds = edges.map(e => e.targetId);
    return Promise.all(neighborIds.map(id => this.getNode(id))).then(nodes => nodes.filter(n => n !== null) as Node[]);
  }

  async findAncestors(nodeId: string): Promise<Node[]> {
    const edges = await this.listEdges({ targetId: nodeId });
    const ancestorIds = edges.map(e => e.sourceId);
    return Promise.all(ancestorIds.map(id => this.getNode(id))).then(nodes => nodes.filter(n => n !== null) as Node[]);
  }

  async findDescendants(nodeId: string): Promise<Node[]> {
    const edges = await this.listEdges({ sourceId: nodeId });
    const descendantIds = edges.map(e => e.targetId);
    return Promise.all(descendantIds.map(id => this.getNode(id))).then(nodes => nodes.filter(n => n !== null) as Node[]);
  }

  async getLineage(nodeId: string): Promise<Lineage> {
    const ancestors = await this.findAncestors(nodeId);
    const descendants = await this.findDescendants(nodeId);
    return {
      nodeId,
      ancestors,
      descendants,
      depth: ancestors.length + descendants.length,
    };
  }

  async traceLineage(nodeId: string, depth?: number): Promise<Lineage> {
    return this.getLineage(nodeId);
  }
}
