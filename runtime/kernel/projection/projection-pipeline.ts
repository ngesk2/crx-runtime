/**
 * PROJECTION PIPELINE
 * 
 * Constitutional projection orchestration authority.
 * 
 * Responsibilities:
 * - Projection orchestration
 * - Evidence-to-projection transformation
 * - Projection sink management
 * 
 * Constitutional Law:
 * - ProjectionPipeline owns projection
 * - Git is merely one projection sink
 * - Projection never creates constitutional state
 * - Projection consumes Witness only
 */

export interface ProjectionSink {
  project(witness: Witness): Promise<void>;
  sinkName: string;
}

export interface Witness {
  witnessRoot: string;
  lineageGraph: LineageGraph;
  stateVersion: string;
  artifactCount: number;
}

export interface LineageGraph {
  nodes: Map<string, LineageNode>;
  edges: Map<string, LineageEdge>;
}

export interface LineageNode {
  nodeId: string;
  nodeType: string;
  stateHash: string;
  parentHashes: string[];
}

export interface LineageEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  edgeType: string;
}

export class ProjectionPipeline {
  private sinks: Map<string, ProjectionSink> = new Map();
  private witnessVersion: string;
  private frozen: boolean = false;

  constructor(witnessVersion: string = 'v1') {
    this.witnessVersion = witnessVersion;
  }

  /**
   * Register a projection sink
   */
  registerSink(sink: ProjectionSink): void {
    if (this.frozen) {
      throw new Error('ProjectionPipeline is frozen, cannot register new sinks');
    }
    this.sinks.set(sink.sinkName, sink);
  }

  /**
   * Unregister a projection sink
   */
  unregisterSink(sinkName: string): void {
    if (this.frozen) {
      throw new Error('ProjectionPipeline is frozen, cannot unregister sinks');
    }
    this.sinks.delete(sinkName);
  }

  /**
   * Freeze the pipeline to prevent further sink mutations
   */
  freeze(): void {
    this.frozen = true;
  }

  /**
   * Check if pipeline is frozen
   */
  isFrozen(): boolean {
    return this.frozen;
  }

  /**
   * Project witness to all registered sinks in deterministic order
   */
  async project(witness: Witness): Promise<void> {
    // Sort sink IDs for deterministic execution order
    const sortedSinkNames = Array.from(this.sinks.keys()).sort();
    
    // Project sequentially in deterministic order
    for (const sinkName of sortedSinkNames) {
      const sink = this.sinks.get(sinkName);
      if (sink) {
        await sink.project(witness);
      }
    }
  }

  /**
   * Get registered sinks
   */
  getSinks(): ProjectionSink[] {
    return Array.from(this.sinks.values());
  }

  /**
   * Get sink count
   */
  getSinkCount(): number {
    return this.sinks.size;
  }
}
