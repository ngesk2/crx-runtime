/**
 * Knowledge Authority Interface
 * Public interface for knowledge subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IKnowledgeAuthority {
  ingest(artifact: Artifact): Promise<KnowledgeObject>;
  query(query: KnowledgeQuery): Promise<KnowledgeResult>;
  relate(sourceId: string, targetId: string, relation: string): Promise<void>;
  extract(knowledgeId: string, projection: string): Promise<Projection>;
  index(knowledgeId: string, embeddings: Embedding[]): Promise<void>;
  search(embedding: number[], limit: number): Promise<SearchResult[]>;
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
