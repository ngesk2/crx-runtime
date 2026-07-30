/**
 * Artifact Service
 *
 * Universal abstraction for all business artifacts.
 * Everything becomes an Artifact with a type.
 *
 * Artifact Types:
 * - Estimate
 * - Inspection
 * - Review
 * - Photo
 * - Invoice
 * - Permit
 * - Warranty
 * - Maintenance
 * - Conversation
 * - Document
 */

import { EventService, Event } from "./event-service";

/**
 * Artifact Types
 */
export type ArtifactType =
  | "Estimate"
  | "Inspection"
  | "Review"
  | "Photo"
  | "Invoice"
  | "Permit"
  | "Warranty"
  | "Maintenance"
  | "Conversation"
  | "Document";

/**
 * Artifact Entity
 */
export interface Artifact {
  id: string;
  type: ArtifactType;
  data: unknown;
  linkedArtifacts: string[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Artifact Link
 */
export interface ArtifactLink {
  sourceId: string;
  targetId: string;
  relation: string;
  createdAt: string;
}

/**
 * Artifact Events
 */
export type ArtifactEvent =
  | ArtifactCreated
  | ArtifactUpdated
  | ArtifactDeleted
  | ArtifactLinked;

export interface ArtifactCreated extends Event {
  type: "ArtifactCreated";
  aggregateType: "Artifact";
  data: {
    artifactType: ArtifactType;
    data: unknown;
  };
}

export interface ArtifactUpdated extends Event {
  type: "ArtifactUpdated";
  aggregateType: "Artifact";
  data: {
    artifactType: ArtifactType;
    data: unknown;
  };
}

export interface ArtifactDeleted extends Event {
  type: "ArtifactDeleted";
  aggregateType: "Artifact";
  data: {
    artifactId: string;
  };
}

export interface ArtifactLinked extends Event {
  type: "ArtifactLinked";
  aggregateType: "ArtifactLink";
  data: {
    sourceId: string;
    targetId: string;
    relation: string;
  };
}

/**
 * Artifact Service Interface
 */
export interface ArtifactService {
  createArtifact(
    type: ArtifactType,
    data: unknown
  ): Promise<Artifact>;

  updateArtifact(
    id: string,
    data: unknown
  ): Promise<Artifact>;

  linkArtifacts(
    sourceId: string,
    targetId: string,
    relation: string
  ): Promise<void>;

  getArtifact(id: string): Promise<Artifact | null>;
  getArtifactsByType(type: ArtifactType): Promise<Artifact[]>;
  getLinkedArtifacts(artifactId: string): Promise<Artifact[]>;
}

/**
 * In-Memory Artifact Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Data is lost on restart.
 * Use only for development/testing.
 */
export class InMemoryArtifactService implements ArtifactService {
  private artifacts: Map<string, Artifact> = new Map();
  private artifactLinks: Map<string, ArtifactLink> = new Map();

  constructor(private eventService: EventService) {}

  async createArtifact(
    type: ArtifactType,
    data: unknown
  ): Promise<Artifact> {
    const id = this.generateId();
    const now = new Date().toISOString();

    const artifact: Artifact = {
      id,
      type,
      data,
      linkedArtifacts: [],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    this.artifacts.set(id, artifact);

    const event: ArtifactCreated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Artifact",
      type: "ArtifactCreated",
      data: {
        artifactType: type,
        data,
      },
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);

    return artifact;
  }

  async updateArtifact(
    id: string,
    data: unknown
  ): Promise<Artifact> {
    const artifact = this.artifacts.get(id);
    if (!artifact) {
      throw new Error(`Artifact not found: ${id}`);
    }

    // Artifacts are immutable - create new version
    const newArtifact: Artifact = {
      ...artifact,
      data,
      updatedAt: new Date().toISOString(),
      version: artifact.version + 1,
    };

    this.artifacts.set(id, newArtifact);

    const event: ArtifactUpdated = {
      id: this.generateId(),
      aggregateId: id,
      aggregateType: "Artifact",
      type: "ArtifactUpdated",
      data: {
        artifactType: artifact.type,
        data,
      },
      timestamp: new Date().toISOString(),
      version: newArtifact.version,
    };

    await this.eventService.appendEvent(event);

    return newArtifact;
  }

  async linkArtifacts(
    sourceId: string,
    targetId: string,
    relation: string
  ): Promise<void> {
    const sourceArtifact = this.artifacts.get(sourceId);
    const targetArtifact = this.artifacts.get(targetId);

    if (!sourceArtifact) {
      throw new Error(`Source artifact not found: ${sourceId}`);
    }
    if (!targetArtifact) {
      throw new Error(`Target artifact not found: ${targetId}`);
    }

    const now = new Date().toISOString();

    const link: ArtifactLink = {
      sourceId,
      targetId,
      relation,
      createdAt: now,
    };

    this.artifactLinks.set(`${sourceId}:${targetId}:${relation}`, link);

    // Update linked artifacts
    sourceArtifact.linkedArtifacts.push(targetId);
    targetArtifact.linkedArtifacts.push(sourceId);

    const event: ArtifactLinked = {
      id: this.generateId(),
      aggregateId: `${sourceId}:${targetId}:${relation}`,
      aggregateType: "ArtifactLink",
      type: "ArtifactLinked",
      data: {
        sourceId,
        targetId,
        relation,
      },
      timestamp: now,
      version: 1,
    };

    await this.eventService.appendEvent(event);
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    return this.artifacts.get(id) || null;
  }

  async getArtifactsByType(type: ArtifactType): Promise<Artifact[]> {
    return Array.from(this.artifacts.values()).filter(
      (artifact) => artifact.type === type
    );
  }

  async getLinkedArtifacts(artifactId: string): Promise<Artifact[]> {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) {
      return [];
    }

    const linkedArtifacts: Artifact[] = [];
    for (const linkedId of artifact.linkedArtifacts) {
      const linkedArtifact = this.artifacts.get(linkedId);
      if (linkedArtifact) {
        linkedArtifacts.push(linkedArtifact);
      }
    }

    return linkedArtifacts;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}
