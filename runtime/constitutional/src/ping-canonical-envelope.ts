/**
 * PING Canonical Journal Envelope (sprint continuation).
 *
 * RECOVERED 2026-09-21 from the live Oracle journal: this is the exact byte
 * construction the 18 Patch 7B proof events use. Lane A's submission script
 * was throwaway and never committed; this module makes the construction
 * canonical, documented, and testable. Verified by re-verifying live events
 * (Nolan identity 1396dd22, Nolan profile object_b033d599, P3 2c7a2123)
 * with the repo's own PingIdentityGenerator.
 *
 * Construction:
 *   1. stripped = payload minus proof minus payload_hash
 *   2. payload_hash = raw SHA-256 hex of canonicalBytes(stripped)
 *      (raw SHA-256, NOT HashAuthority.hashCanonical: no version envelope)
 *   3. signature = Ed25519 over canonicalBytes({ ...stripped, payload_hash })
 *      (the signed bytes COMMIT to the hash binding)
 *   4. proof = { verification_method: 'ed25519', signature, public_key }
 *      (public_key is SPKI DER hex; the proof is NEVER part of the signed bytes)
 *   5. Submission: POST /events with
 *      { event_type, aggregate_id, aggregate_type, event_data: fullPayload }
 *
 * canonicalBytes = JSON.stringify(HashAuthority.canonicalizeObject(v)),
 * UTF-8 encoded (PingIdentityGenerator.canonicalBytes).
 *
 * Key custody: this module never sees private keys. Callers pass a signing
 * function (or private key hex they already hold via dev-key-custody); the
 * module only shapes bytes.
 */

import { createHash } from 'crypto';
import { PingIdentityGenerator } from './ping-identity';

export interface CanonicalProof {
  verification_method: 'ed25519';
  signature: string;
  public_key: string;
}

export interface ObjectCreatedInput {
  schema: string;
  objectId: string;
  controller: string;
  content: Record<string, any>;
  refs?: string[];
  visibility?: string;
  status?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ObjectUpdatedInput {
  objectId: string;
  /** Shallow content patch merged into the object's content (right-wins). */
  changes: Record<string, any>;
  /** Signing identity; must equal the target object's controller. */
  updatedBy: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface RelationshipCreatedInput {
  relationshipId: string;
  subject: string;
  predicate: string;
  object: string;
  /** 'active' to relate, 'inactive' to revoke (last-wins, never a new predicate). */
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
  createdAt: string;
}

/**
 * WRONG_JOURNAL error - thrown when a journal event lacks required
 * overlay identity marker fields. This is a typed error for the Q-P0-04
 * contract: zero write, zero partial effect, zero fallback journal,
 * zero silent success.
 */
export class WrongJournalError extends Error {
  public readonly code = 'WRONG_JOURNAL';
  public readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'WrongJournalError';
    this.field = field;
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, WrongJournalError.prototype);
  }
}

export interface CanonicalProof {
  verification_method: 'ed25519';
  signature: string;
  public_key: string;
}

export interface ObjectCreatedInput {
  schema: string;
  objectId: string;
  controller: string;
  content: Record<string, any>;
  refs?: string[];
  visibility?: string;
  status?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ObjectUpdatedInput {
  objectId: string;
  /** Shallow content patch merged into the object's content (right-wins). */
  changes: Record<string, any>;
  /** Signing identity; must equal the target object's controller. */
  updatedBy: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface RelationshipCreatedInput {
  relationshipId: string;
  subject: string;
  predicate: string;
  object: string;
  /** 'active' to relate, 'inactive' to revoke (last-wins, never a new predicate). */
  status?: 'active' | 'inactive';
  metadata?: Record<string, any>;
  createdAt: string;
}

export class PingCanonicalEnvelope {
  /**
   * Raw SHA-256 hex of the canonical bytes of a stripped payload
   * (payload minus proof minus payload_hash).
   */
  static payloadHash(strippedPayload: Record<string, any>): string {
    const bytes = PingIdentityGenerator.canonicalBytes(strippedPayload);
    return createHash('sha256').update(bytes, 'utf8').digest('hex');
  }

  /** stripped payload + payload_hash. THIS is what gets signed. */
  static withPayloadHash(strippedPayload: Record<string, any>): Record<string, any> {
    return { ...strippedPayload, payload_hash: this.payloadHash(strippedPayload) };
  }

  /** Sign the hash-bound payload; returns the signature hex. */
  static signPayload(payloadWithHash: Record<string, any>, privateKeyHex: string): string {
    return PingIdentityGenerator.sign(
      PingIdentityGenerator.canonicalBytes(payloadWithHash),
      privateKeyHex
    );
  }

  /** Attach a proof to a hash-bound payload: the full journal payload. */
  static attachProof(
    payloadWithHash: Record<string, any>,
    proof: CanonicalProof
  ): Record<string, any> {
    return { ...payloadWithHash, proof };
  }

  /**
   * Verify a full journal payload's proof under the recovered construction:
   * the payload_hash must bind the stripped content AND the signature must
   * verify over the canonical bytes of the payload (minus proof, hash kept).
   * Returns false (never throws) on any malformation.
   */
  static verifyPayload(fullPayload: Record<string, any>): boolean {
    try {
      const proof = fullPayload.proof as CanonicalProof | undefined;
      if (
        !proof ||
        proof.verification_method !== 'ed25519' ||
        typeof proof.signature !== 'string' ||
        typeof proof.public_key !== 'string'
      ) {
        return false;
      }
      const noProof: Record<string, any> = { ...fullPayload };
      delete noProof.proof;
      const stripped: Record<string, any> = { ...noProof };
      delete stripped.payload_hash;
      if (this.payloadHash(stripped) !== (fullPayload as any).payload_hash) {
        return false;
      }
      return PingIdentityGenerator.verify(
        PingIdentityGenerator.canonicalBytes(noProof),
        proof.signature,
        proof.public_key
      );
    } catch {
      return false;
    }
  }

  /** Build the stripped OBJECT_CREATED payload (before hash/sign). */
  static objectCreated(input: ObjectCreatedInput): Record<string, any> {
    if (!input.schema) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectCreated: schema is required (overlay identity marker)', 'schema');
    if (!input.objectId) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectCreated: objectId is required (overlay identity marker)', 'objectId');
    if (!input.controller) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectCreated: controller is required (overlay identity marker)', 'controller');
    if (!input.content || typeof input.content !== 'object') throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectCreated: content is required (overlay identity marker)', 'content');
    if (!input.createdAt) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectCreated: createdAt is required (overlay identity marker)', 'createdAt');
    return {
      schema: input.schema,
      object_id: input.objectId,
      controller: input.controller,
      created_at: input.createdAt,
      content: input.content,
      refs: input.refs ?? [],
      visibility: input.visibility ?? 'public',
      status: input.status ?? 'active',
      metadata: input.metadata ?? {},
    };
  }

  /** Build the stripped OBJECT_UPDATED payload (before hash/sign). */
  static objectUpdated(input: ObjectUpdatedInput): Record<string, any> {
    if (!input.objectId) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectUpdated: objectId is required (overlay identity marker)', 'objectId');
    if (!input.changes || typeof input.changes !== 'object' || Array.isArray(input.changes)) {
      throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectUpdated: changes must be a non-array object (overlay identity marker)', 'changes');
    }
    if (!input.updatedBy) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectUpdated: updatedBy is required (overlay identity marker)', 'updatedBy');
    if (!input.createdAt) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.objectUpdated: createdAt is required (overlay identity marker)', 'createdAt');
    return {
      object_id: input.objectId,
      changes: input.changes,
      updated_by: input.updatedBy,
      created_at: input.createdAt,
      metadata: input.metadata ?? {},
    };
  }

  /** Build the stripped RELATIONSHIP_CREATED payload (before hash/sign). */
  static relationshipCreated(input: RelationshipCreatedInput): Record<string, any> {
    if (!input.relationshipId) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.relationshipCreated: relationshipId is required (overlay identity marker)', 'relationshipId');
    if (!input.subject) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.relationshipCreated: subject is required (overlay identity marker)', 'subject');
    if (!input.predicate) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.relationshipCreated: predicate is required (overlay identity marker)', 'predicate');
    if (!input.object) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.relationshipCreated: object is required (overlay identity marker)', 'object');
    if (!input.createdAt) throw new WrongJournalError('WRONG_JOURNAL: PingCanonicalEnvelope.relationshipCreated: createdAt is required (overlay identity marker)', 'createdAt');
    return {
      relationship_id: input.relationshipId,
      subject: input.subject,
      predicate: input.predicate,
      object: input.object,
      status: input.status ?? 'active',
      created_at: input.createdAt,
      metadata: input.metadata ?? {},
    };
  }

  /**
   * The POST /events submission body for a full canonical payload.
   * aggregate_id is the target (object_id / relationship_id); aggregate_type
   * names the aggregate kind for the journal's metadata.
   */
  static submissionBody(
    eventType: 'OBJECT_CREATED' | 'OBJECT_UPDATED' | 'RELATIONSHIP_CREATED',
    aggregateId: string,
    aggregateType: string,
    fullPayload: Record<string, any>
  ): Record<string, any> {
    return {
      event_type: eventType,
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
      event_data: fullPayload,
    };
  }
}
