/**
 * Repository Authority Interface
 * Public interface for repository subsystem.
 * Only this interface crosses subsystem boundaries.
 * Every runtime subsystem writes through RepositoryAuthority.
 */

export interface IRepositoryAuthority {
  append(object: CanonicalObject): Promise<void>;
  load(id: string): Promise<CanonicalObject | null>;
  loadMany(ids: string[]): Promise<CanonicalObject[]>;
  snapshot(): Promise<Snapshot>;
  restore(snapshot: Snapshot): Promise<void>;
  project(projection: Projection): Promise<ProjectionResult>;
  merge(merge: Merge): Promise<MergeResult>;
  index(index: Index): Promise<void>;
  search(query: SearchQuery): Promise<SearchResult>;
}

export interface CanonicalObject {
  id: string;
  kind: string;
  data: unknown;
  metadata: Record<string, unknown>;
}

export interface Snapshot {
  snapshotId: string;
  timestamp: string;
  objects: CanonicalObject[];
}

export interface Projection {
  projectionId: string;
  sourceId: string;
  targetKind: string;
  parameters: Record<string, unknown>;
}

export interface ProjectionResult {
  projectionId: string;
  result: unknown;
  metadata: Record<string, unknown>;
}

export interface Merge {
  mergeId: string;
  sourceIds: string[];
  targetKind: string;
  strategy: MergeStrategy;
}

export enum MergeStrategy {
  Union = 'union',
  Intersection = 'intersection',
  Latest = 'latest',
  Constitutional = 'constitutional',
}

export interface MergeResult {
  mergeId: string;
  result: CanonicalObject;
  conflicts: Conflict[];
}

export interface Conflict {
  field: string;
  sourceValues: unknown[];
  resolution?: unknown;
}

export interface Index {
  indexId: string;
  field: string;
  kind: string;
}

export interface SearchQuery {
  query: string;
  kind?: string;
  filters: Record<string, unknown>;
  limit?: number;
}

export interface SearchResult {
  results: CanonicalObject[];
  total: number;
  metadata: Record<string, unknown>;
}
