/**
 * Replay Service
 *
 * Provides replay capabilities for aggregates, properties, customers, artifacts, and timelines.
 * This is where Constitutional Runtime starts proving itself.
 */

import { EventService, Event } from "./event-service";
import { IdentityService, Customer } from "./identity-service";
import { PropertyService, Property } from "./property-service";
import { ArtifactService, Artifact } from "./artifact-service";

/**
 * Aggregate State
 */
export interface AggregateState {
  aggregateId: string;
  aggregateType: string;
  state: unknown;
  version: number;
  timestamp: string;
}

/**
 * Property State
 */
export interface PropertyState {
  propertyId: string;
  property: Property;
  ownershipHistory: Array<{
    ownerId: string;
    transferredAt: string;
  }>;
  version: number;
  timestamp: string;
}

/**
 * Customer State
 */
export interface CustomerState {
  customerId: string;
  customer: Customer;
  roleAssignments: Array<{
    role: string;
    assignedAt: string;
  }>;
  version: number;
  timestamp: string;
}

/**
 * Artifact State
 */
export interface ArtifactState {
  artifactId: string;
  artifact: Artifact;
  linkedArtifacts: Artifact[];
  version: number;
  timestamp: string;
}

/**
 * Timeline
 */
export interface Timeline {
  events: Event[];
  cursor: string;
  hasMore: boolean;
}

/**
 * Replay Certificate
 * Proof that the entire pipeline reproduced the same outcome
 */
export interface ReplayCertificate {
  replayId: string;
  aggregateId?: string;
  eventStreamHash: string;
  classifierVersions: Record<string, string>;
  policyVersions: Record<string, string>;
  publisherVersion: string;
  outcomeHash: string;
  replayedAt: string;
}

/**
 * Replay Service Interface
 */
export interface ReplayService {
  replayAggregate(aggregateId: string): Promise<AggregateState>;
  replayProperty(propertyId: string): Promise<PropertyState>;
  replayCustomer(customerId: string): Promise<CustomerState>;
  replayArtifact(artifactId: string): Promise<ArtifactState>;
  replayTimeline(cursor: string): Promise<Timeline>;
  generateCertificate(
    aggregateId: string,
    outcome: unknown
  ): Promise<ReplayCertificate>;
  verifyCertificate(
    certificate: ReplayCertificate,
    outcome: unknown
  ): Promise<boolean>;
}

/**
 * In-Memory Replay Service
 *
 * WARNING: NOT SUITABLE FOR PRODUCTION
 * Replay is lost on restart.
 * Use only for development/testing.
 */
export class InMemoryReplayService implements ReplayService {
  private certificates: Map<string, ReplayCertificate> = new Map();

  constructor(
    private eventService: EventService,
    private identityService: IdentityService,
    private propertyService: PropertyService,
    private artifactService: ArtifactService
  ) {}

  async replayAggregate(aggregateId: string): Promise<AggregateState> {
    const events = await this.eventService.replay(aggregateId);

    if (events.length === 0) {
      throw new Error(`No events found for aggregate: ${aggregateId}`);
    }

    const latestEvent = events[events.length - 1];

    // Build state from events
    const state = this.buildAggregateState(events);

    return {
      aggregateId,
      aggregateType: latestEvent.aggregateType,
      state,
      version: latestEvent.version,
      timestamp: latestEvent.timestamp,
    };
  }

  async replayProperty(propertyId: string): Promise<PropertyState> {
    const property = await this.propertyService.getProperty(propertyId);
    if (!property) {
      throw new Error(`Property not found: ${propertyId}`);
    }

    const events = await this.eventService.replay(propertyId);

    // Extract ownership history from events
    const ownershipHistory: Array<{
      ownerId: string;
      transferredAt: string;
    }> = [];

    for (const event of events) {
      if (event.type === "OwnershipTransferred") {
        const data = event.data as {
          propertyId: string;
          toOwnerId: string;
          transferredAt: string;
        };
        ownershipHistory.push({
          ownerId: data.toOwnerId,
          transferredAt: data.transferredAt,
        });
      }
    }

    return {
      propertyId,
      property,
      ownershipHistory,
      version: events.length > 0 ? events[events.length - 1].version : 0,
      timestamp: new Date().toISOString(),
    };
  }

  async replayCustomer(customerId: string): Promise<CustomerState> {
    const customer = await this.identityService.getCustomer(customerId);
    if (!customer) {
      throw new Error(`Customer not found: ${customerId}`);
    }

    const events = await this.eventService.replay(customerId);

    // Extract role assignments from events
    const roleAssignments: Array<{
      role: string;
      assignedAt: string;
    }> = [];

    for (const event of events) {
      if (event.type === "RoleAssigned") {
        const data = event.data as {
          userId: string;
          role: string;
          assignedAt: string;
        };
        roleAssignments.push({
          role: data.role,
          assignedAt: data.assignedAt,
        });
      }
    }

    return {
      customerId,
      customer,
      roleAssignments,
      version: events.length > 0 ? events[events.length - 1].version : 0,
      timestamp: new Date().toISOString(),
    };
  }

  async replayArtifact(artifactId: string): Promise<ArtifactState> {
    const artifact = await this.artifactService.getArtifact(artifactId);
    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactId}`);
    }

    const events = await this.eventService.replay(artifactId);

    // Get linked artifacts
    const linkedArtifacts =
      await this.artifactService.getLinkedArtifacts(artifactId);

    return {
      artifactId,
      artifact,
      linkedArtifacts,
      version: events.length > 0 ? events[events.length - 1].version : 0,
      timestamp: new Date().toISOString(),
    };
  }

  async replayTimeline(cursor: string): Promise<Timeline> {
    const events = await this.eventService.getEventsAfter(cursor);

    return {
      events,
      cursor: events.length > 0 ? events[events.length - 1].id : cursor,
      hasMore: false, // In-memory, no pagination
    };
  }

  async generateCertificate(
    aggregateId: string,
    outcome: unknown
  ): Promise<ReplayCertificate> {
    const replayId = this.generateId();

    // Get event stream hash
    let eventStreamHash = "";
    if (aggregateId) {
      const events = await this.eventService.replay(aggregateId);
      eventStreamHash = this.computeHash(events);
    }

    // Compute outcome hash
    const outcomeHash = this.computeHash(outcome);

    const certificate: ReplayCertificate = {
      replayId,
      aggregateId,
      eventStreamHash,
      classifierVersions: {}, // TODO: Track classifier versions
      policyVersions: {}, // TODO: Track policy versions
      publisherVersion: "1.0.0", // TODO: Track publisher version
      outcomeHash,
      replayedAt: new Date().toISOString(),
    };

    this.certificates.set(replayId, certificate);

    return certificate;
  }

  async verifyCertificate(
    certificate: ReplayCertificate,
    outcome: unknown
  ): Promise<boolean> {
    const computedOutcomeHash = this.computeHash(outcome);
    return computedOutcomeHash === certificate.outcomeHash;
  }

  private buildAggregateState(events: Event[]): unknown {
    // Simple state building - in production, use aggregate-specific logic
    return {
      events: events.length,
      lastEvent: events[events.length - 1],
    };
  }

  private computeHash(data: unknown): string {
    // Simple hash computation - in production, use cryptographic hash
    return Buffer.from(JSON.stringify(data)).toString("base64");
  }

  private generateId(): string {
    return crypto.randomUUID();
  }
}
