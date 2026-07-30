/**
 * Identity Authority
 * Public interface for identity subsystem.
 * Only this interface crosses subsystem boundaries.
 */

import { CanonicalIdentityService } from './canonical-identity-service';

// Actor types
export interface Actor {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActorCreateInput {
  type: string;
  attributes: Record<string, unknown>;
}

export interface ActorUpdateInput {
  attributes?: Record<string, unknown>;
}

export interface ActorFilter {
  type?: string;
  attributes?: Record<string, unknown>;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  type: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationCreateInput {
  name: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface OrganizationUpdateInput {
  name?: string;
  attributes?: Record<string, unknown>;
}

export interface OrganizationFilter {
  type?: string;
  name?: string;
}

// Membership types
export interface Membership {
  id: string;
  actorId: string;
  organizationId: string;
  role: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipCreateInput {
  actorId: string;
  organizationId: string;
  role: string;
  attributes?: Record<string, unknown>;
}

export interface MembershipUpdateInput {
  role?: string;
  attributes?: Record<string, unknown>;
}

export interface MembershipFilter {
  actorId?: string;
  organizationId?: string;
  role?: string;
}

// Claim types
export interface Claim {
  id: string;
  type: string;
  value: unknown;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
}

// Evidence types (extended from existing evidence.ts)
export interface Evidence {
  id: string;
  type: string;
  data: unknown;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceCreateInput {
  type: string;
  data: unknown;
  metadata?: Record<string, unknown>;
}

export interface EvidenceUpdateInput {
  data?: unknown;
  metadata?: Record<string, unknown>;
}

export interface EvidenceFilter {
  type?: string;
  metadata?: Record<string, unknown>;
}

export interface Blob {
  id: string;
  hash: string;
  size: number;
  mimeType: string;
  location: string;
  createdAt: string;
}

export interface BlobCreateInput {
  data: Buffer;
  mimeType: string;
}

export interface Witness {
  id: string;
  evidenceId: string;
  witness: string;
  signature: string;
  timestamp: string;
}

export interface WitnessCreateInput {
  evidenceId: string;
  witness: string;
  signature: string;
}

export interface Attachment {
  id: string;
  evidenceId: string;
  blobId: string;
  attachedAt: string;
}

export interface IIdentityAuthority {
  // ID Generation Methods (existing)
  generateUUIDv5(namespace: string, name: string): string;
  generateContextId(executionId: string, stage: string): string;
  generateWitnessId(transcriptId: string): string;
  generateCertificateId(knowledgeId: string, witnessId: string): string;
  generateAuditId(executionId: string, action: string): string;
  generateLeaseId(workerId: string, capabilityId: string): string;
  generateSpanId(traceId: string, spanName: string): string;
  generateEventId(source: string, canonicalTimestamp: string): string;
  generateReplayId(stage: string, outputHash: string): string;
  generateEnvelopeId(executionId: string, sequence: number): string;
  generateMissionId(programId: string, epicId: string): string;
  generateEpicId(programId: string, epicName: string): string;
  generateTaskId(missionId: string, sequence: number): string;

  // Actor Management Methods (new)
  createActor(data: ActorCreateInput): Promise<Actor>;
  getActor(id: string): Promise<Actor | null>;
  updateActor(id: string, updates: ActorUpdateInput): Promise<Actor>;
  deleteActor(id: string): Promise<void>;
  listActors(filter?: ActorFilter): Promise<Actor[]>;

  // Organization Management Methods (new)
  createOrganization(data: OrganizationCreateInput): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | null>;
  updateOrganization(id: string, updates: OrganizationUpdateInput): Promise<Organization>;
  deleteOrganization(id: string): Promise<void>;
  listOrganizations(filter?: OrganizationFilter): Promise<Organization[]>;

  // Membership Management Methods (new)
  createMembership(data: MembershipCreateInput): Promise<Membership>;
  getMembership(id: string): Promise<Membership | null>;
  updateMembership(id: string, updates: MembershipUpdateInput): Promise<Membership>;
  deleteMembership(id: string): Promise<void>;
  listMemberships(filter?: MembershipFilter): Promise<Membership[]>;

  // Claims Management Methods (new)
  addClaim(actorId: string, claim: Claim): Promise<void>;
  removeClaim(actorId: string, claimId: string): Promise<void>;
  getClaims(actorId: string): Promise<Claim[]>;
  hasClaim(actorId: string, claimType: string): Promise<boolean>;

  // Roles Management Methods (new)
  assignRole(actorId: string, role: string): Promise<void>;
  removeRole(actorId: string, role: string): Promise<void>;
  getRoles(actorId: string): Promise<string[]>;
  hasRole(actorId: string, role: string): Promise<boolean>;

  // Evidence Management Methods (extended)
  createEvidence(data: EvidenceCreateInput): Promise<Evidence>;
  getEvidence(id: string): Promise<Evidence | null>;
  updateEvidence(id: string, updates: EvidenceUpdateInput): Promise<Evidence>;
  deleteEvidence(id: string): Promise<void>;
  listEvidence(filter?: EvidenceFilter): Promise<Evidence[]>;

  // Blob Management Methods (extended)
  createBlob(data: BlobCreateInput): Promise<Blob>;
  getBlob(id: string): Promise<Blob | null>;
  deleteBlob(id: string): Promise<void>;

  // Witness Management Methods (extended)
  createWitness(data: WitnessCreateInput): Promise<Witness>;
  getWitness(id: string): Promise<Witness | null>;
  listWitnesses(evidenceId: string): Promise<Witness[]>;

  // Attachment Management Methods (extended)
  attach(evidenceId: string, attachmentId: string): Promise<void>;
  detach(evidenceId: string, attachmentId: string): Promise<void>;
  getAttachments(evidenceId: string): Promise<Attachment[]>;
}

// Stub implementation for pipeline wiring
export class InMemoryIdentityAuthority implements IIdentityAuthority {
  private actors: Map<string, Actor> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private memberships: Map<string, Membership> = new Map();
  private claims: Map<string, Claim[]> = new Map();
  private roles: Map<string, string[]> = new Map();
  private evidence: Map<string, Evidence> = new Map();
  private blobs: Map<string, Blob> = new Map();
  private witnesses: Map<string, Witness> = new Map();
  private attachments: Map<string, Attachment[]> = new Map();
  private identityService = CanonicalIdentityService.getInstance();

  // ID Generation Methods
  generateUUIDv5(namespace: string, name: string): string {
    return this.identityService.generateUUIDv5(namespace, name);
  }
  generateContextId(executionId: string, stage: string): string {
    return this.identityService.generateContextId(executionId, stage);
  }
  generateWitnessId(transcriptId: string): string {
    return this.identityService.generateWitnessId(transcriptId);
  }
  generateCertificateId(knowledgeId: string, witnessId: string): string {
    return this.identityService.generateCertificateId(knowledgeId, witnessId);
  }
  generateAuditId(executionId: string, action: string): string {
    return this.identityService.generateAuditId(executionId, action);
  }
  generateLeaseId(workerId: string, capabilityId: string): string {
    return this.identityService.generateLeaseId(workerId, capabilityId);
  }
  generateSpanId(traceId: string, spanName: string): string {
    return this.identityService.generateSpanId(traceId, spanName);
  }
  generateEventId(source: string, canonicalTimestamp: string): string {
    return this.identityService.generateEventId(source, canonicalTimestamp);
  }
  generateReplayId(stage: string, outputHash: string): string {
    return this.identityService.generateReplayId(stage, outputHash);
  }
  generateEnvelopeId(executionId: string, sequence: number): string {
    return this.identityService.generateEnvelopeId(executionId, sequence);
  }
  generateMissionId(programId: string, epicId: string): string {
    return this.identityService.generateMissionId(programId, epicId);
  }
  generateEpicId(programId: string, epicName: string): string {
    return this.identityService.generateEpicId(programId, epicName);
  }
  generateTaskId(missionId: string, sequence: number): string {
    return this.identityService.generateTaskId(missionId, sequence);
  }

  // Actor Management Methods
  async createActor(data: ActorCreateInput): Promise<Actor> {
    const id = this.generateUUIDv5('actor', data.type);
    const now = new Date().toISOString();
    const actor: Actor = { id, ...data, createdAt: now, updatedAt: now };
    this.actors.set(id, actor);
    return actor;
  }
  async getActor(id: string): Promise<Actor | null> {
    return this.actors.get(id) || null;
  }
  async updateActor(id: string, updates: ActorUpdateInput): Promise<Actor> {
    const actor = this.actors.get(id);
    if (!actor) throw new Error(`Actor not found: ${id}`);
    const updated = { ...actor, ...updates, updatedAt: new Date().toISOString() };
    this.actors.set(id, updated);
    return updated;
  }
  async deleteActor(id: string): Promise<void> {
    this.actors.delete(id);
  }
  async listActors(filter?: ActorFilter): Promise<Actor[]> {
    return Array.from(this.actors.values());
  }

  // Organization Management Methods
  async createOrganization(data: OrganizationCreateInput): Promise<Organization> {
    const id = this.generateUUIDv5('organization', data.name);
    const now = new Date().toISOString();
    const organization: Organization = { id, ...data, createdAt: now, updatedAt: now };
    this.organizations.set(id, organization);
    return organization;
  }
  async getOrganization(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }
  async updateOrganization(id: string, updates: OrganizationUpdateInput): Promise<Organization> {
    const org = this.organizations.get(id);
    if (!org) throw new Error(`Organization not found: ${id}`);
    const updated = { ...org, ...updates, updatedAt: new Date().toISOString() };
    this.organizations.set(id, updated);
    return updated;
  }
  async deleteOrganization(id: string): Promise<void> {
    this.organizations.delete(id);
  }
  async listOrganizations(filter?: OrganizationFilter): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  // Membership Management Methods
  async createMembership(data: MembershipCreateInput): Promise<Membership> {
    const id = this.generateUUIDv5('membership', `${data.actorId}:${data.organizationId}`);
    const now = new Date().toISOString();
    const membership: Membership = { id, ...data, attributes: data.attributes || {}, createdAt: now, updatedAt: now };
    this.memberships.set(id, membership);
    return membership;
  }
  async getMembership(id: string): Promise<Membership | null> {
    return this.memberships.get(id) || null;
  }
  async updateMembership(id: string, updates: MembershipUpdateInput): Promise<Membership> {
    const membership = this.memberships.get(id);
    if (!membership) throw new Error(`Membership not found: ${id}`);
    const updated = { ...membership, ...updates, updatedAt: new Date().toISOString() };
    this.memberships.set(id, updated);
    return updated;
  }
  async deleteMembership(id: string): Promise<void> {
    this.memberships.delete(id);
  }
  async listMemberships(filter?: MembershipFilter): Promise<Membership[]> {
    return Array.from(this.memberships.values());
  }

  // Claims Management Methods
  async addClaim(actorId: string, claim: Claim): Promise<void> {
    if (!this.claims.has(actorId)) {
      this.claims.set(actorId, []);
    }
    this.claims.get(actorId)!.push(claim);
  }
  async removeClaim(actorId: string, claimId: string): Promise<void> {
    const claims = this.claims.get(actorId);
    if (claims) {
      const index = claims.findIndex(c => c.id === claimId);
      if (index > -1) claims.splice(index, 1);
    }
  }
  async getClaims(actorId: string): Promise<Claim[]> {
    return this.claims.get(actorId) || [];
  }
  async hasClaim(actorId: string, claimType: string): Promise<boolean> {
    const claims = this.claims.get(actorId) || [];
    return claims.some(c => c.type === claimType);
  }

  // Roles Management Methods
  async assignRole(actorId: string, role: string): Promise<void> {
    if (!this.roles.has(actorId)) {
      this.roles.set(actorId, []);
    }
    this.roles.get(actorId)!.push(role);
  }
  async removeRole(actorId: string, role: string): Promise<void> {
    const roles = this.roles.get(actorId);
    if (roles) {
      const index = roles.indexOf(role);
      if (index > -1) roles.splice(index, 1);
    }
  }
  async getRoles(actorId: string): Promise<string[]> {
    return this.roles.get(actorId) || [];
  }
  async hasRole(actorId: string, role: string): Promise<boolean> {
    const roles = this.roles.get(actorId) || [];
    return roles.includes(role);
  }

  // Evidence Management Methods
  async createEvidence(data: EvidenceCreateInput): Promise<Evidence> {
    const id = this.generateUUIDv5('evidence', data.type);
    const now = new Date().toISOString();
    const evidence: Evidence = { id, type: data.type, data: data.data, metadata: data.metadata || {}, createdAt: now, updatedAt: now };
    this.evidence.set(id, evidence);
    return evidence;
  }
  async getEvidence(id: string): Promise<Evidence | null> {
    return this.evidence.get(id) || null;
  }
  async updateEvidence(id: string, updates: EvidenceUpdateInput): Promise<Evidence> {
    const evidence = this.evidence.get(id);
    if (!evidence) throw new Error(`Evidence not found: ${id}`);
    const updated = { ...evidence, ...updates, updatedAt: new Date().toISOString() };
    this.evidence.set(id, updated);
    return updated;
  }
  async deleteEvidence(id: string): Promise<void> {
    this.evidence.delete(id);
  }
  async listEvidence(filter?: EvidenceFilter): Promise<Evidence[]> {
    return Array.from(this.evidence.values());
  }

  // Blob Management Methods
  async createBlob(data: BlobCreateInput): Promise<Blob> {
    const id = this.generateUUIDv5('blob', data.mimeType);
    const now = new Date().toISOString();
    const blob: Blob = { id, hash: 'stub-hash', size: data.data.length, mimeType: data.mimeType, location: 'memory', createdAt: now };
    this.blobs.set(id, blob);
    return blob;
  }
  async getBlob(id: string): Promise<Blob | null> {
    return this.blobs.get(id) || null;
  }
  async deleteBlob(id: string): Promise<void> {
    this.blobs.delete(id);
  }

  // Witness Management Methods
  async createWitness(data: WitnessCreateInput): Promise<Witness> {
    const id = this.generateUUIDv5('witness', data.evidenceId);
    const now = new Date().toISOString();
    const witness: Witness = { id, evidenceId: data.evidenceId, witness: data.witness, signature: data.signature, timestamp: now };
    this.witnesses.set(id, witness);
    return witness;
  }
  async getWitness(id: string): Promise<Witness | null> {
    return this.witnesses.get(id) || null;
  }
  async listWitnesses(evidenceId: string): Promise<Witness[]> {
    return Array.from(this.witnesses.values()).filter(w => w.evidenceId === evidenceId);
  }

  // Attachment Management Methods
  async attach(evidenceId: string, attachmentId: string): Promise<void> {
    if (!this.attachments.has(evidenceId)) {
      this.attachments.set(evidenceId, []);
    }
    this.attachments.get(evidenceId)!.push({ id: attachmentId, evidenceId, blobId: attachmentId, attachedAt: new Date().toISOString() });
  }
  async detach(evidenceId: string, attachmentId: string): Promise<void> {
    const attachments = this.attachments.get(evidenceId);
    if (attachments) {
      const index = attachments.findIndex(a => a.id === attachmentId);
      if (index > -1) attachments.splice(index, 1);
    }
  }
  async getAttachments(evidenceId: string): Promise<Attachment[]> {
    return this.attachments.get(evidenceId) || [];
  }
}

export interface IClockAuthority {
  now(): string;
  advance(milliseconds: number): void;
  set(timestamp: string): void;
  nextSequence(): number;
  resetSequence(): void;
  resetToWallTime(): void;
}
