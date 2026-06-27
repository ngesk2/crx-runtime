/**
 * Projection Authority Interface
 * Public interface for projection subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IProjectionAuthority {
  create(projection: ProjectionDefinition): Projection;
  execute(projectionId: string, sourceId: string): ProjectionResult;
  list(filters: ProjectionFilters): Projection[];
  update(projectionId: string, definition: ProjectionDefinition): Projection;
  delete(projectionId: string): boolean;
}

export interface ProjectionDefinition {
  projectionId: string;
  name: string;
  description: string;
  sourceKind: string;
  targetKind: string;
  transform: TransformDefinition;
  parameters: Record<string, unknown>;
}

export interface TransformDefinition {
  type: TransformType;
  configuration: Record<string, unknown>;
}

export enum TransformType {
  Embedding = 'embedding',
  Indexing = 'indexing',
  Summarization = 'summarization',
  Extraction = 'extraction',
  Aggregation = 'aggregation',
  Filtering = 'filtering',
  Mapping = 'mapping',
}

export interface Projection {
  projectionId: string;
  definition: ProjectionDefinition;
  status: ProjectionStatus;
  metadata: ProjectionMetadata;
}

export enum ProjectionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Failed = 'failed',
}

export interface ProjectionMetadata {
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionCount: number;
}

export interface ProjectionResult {
  projectionId: string;
  sourceId: string;
  result: unknown;
  metadata: Record<string, unknown>;
  duration: number;
}

export interface ProjectionFilters {
  sourceKind?: string;
  targetKind?: string;
  transformType?: TransformType;
  status?: ProjectionStatus;
}
