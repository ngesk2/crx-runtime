/**
 * PING Object Kernel
 * PATCH 3: Object Kernel
 * 
 * Protocol-neutral PING object operations using existing constitutional authorities
 */

import { IdentityAuthority } from './identity-authority';
import { HashAuthority } from './hash-authority';
import { TimeAuthority } from './time-authority';
import {
  PingObject,
  PingPost,
  PingProfile,
  PingRelationship,
  PingTransition,
  CreateTransitionPayload,
  RelateTransitionPayload
} from './schemas/ping-objects';

/**
 * Proof structure (inline to avoid circular dependency)
 */
interface PingProof {
  verification_method: string;
  signature: string;
  public_key?: string;
}

/**
 * PING Object Kernel
 * 
 * Uses existing constitutional authorities:
 * - IdentityAuthority for deterministic object IDs (type_hash16 format)
 * - HashAuthority for content hashing
 * - TimeAuthority for timestamps
 */
export class PingObjectKernel {
  private static readonly SCHEMA_VERSION = '1';

  /**
   * Generate deterministic object ID
   * Uses existing IdentityAuthority with type_hash16 format
   */
  static generateObjectId(schema: string, controller: string, content: any): string {
    const context = {
      schema,
      controller,
      content
    };
    return IdentityAuthority.generateId('object', context);
  }

  /**
   * Generate deterministic relationship ID
   */
  static generateRelationshipId(subject: string, predicate: string, object: string): string {
    const context = {
      subject,
      predicate,
      object
    };
    return IdentityAuthority.generateId('relationship', context);
  }

  /**
   * Generate deterministic transition ID
   */
  static generateTransitionId(objectId: string, operation: string, sequence: number): string {
    const context = {
      object_id: objectId,
      operation,
      sequence
    };
    return IdentityAuthority.generateId('transition', context);
  }

  /**
   * Compute content hash for verification
   * Uses existing HashAuthority
   */
  static computeContentHash(data: any): string {
    return HashAuthority.hashCanonical(data);
  }

  /**
   * Create a canonical PING object
   */
  static createObject(
    schema: string,
    controller: string,
    content: Record<string, any>,
    refs: string[] = []
  ): PingObject {
    const objectId = this.generateObjectId(schema, controller, content);
    const createdAt = TimeAuthority.now();

    return {
      id: objectId,
      schema,
      controller,
      created_at: createdAt,
      content,
      refs
    };
  }

  /**
   * Create a PING post
   */
  static createPost(controller: string, text: string, refs: string[] = []): PingPost {
    return this.createObject(
      'ping.social.post@1',
      controller,
      { text },
      refs
    ) as PingPost;
  }

  /**
   * Create a PING profile
   */
  static createProfile(controller: string, displayName: string, bio?: string): PingProfile {
    return this.createObject(
      'ping.social.profile@1',
      controller,
      { display_name: displayName, bio },
      []
    ) as PingProfile;
  }

  /**
   * Create a PING relationship
   */
  static createRelationship(
    subject: string,
    predicate: string,
    object: string
  ): PingRelationship {
    const relationshipId = this.generateRelationshipId(subject, predicate, object);
    const createdAt = TimeAuthority.now();

    return {
      id: relationshipId,
      subject,
      predicate,
      object,
      created_at: createdAt,
      status: 'active'
    };
  }

  /**
   * Create a create transition
   */
  static createCreateTransition(
    objectId: string,
    actorId: string,
    payload: CreateTransitionPayload,
    proof?: { verification_method: string; signature: string; public_key?: string }
  ): PingTransition {
    const payloadHash = this.computeContentHash(payload);
    const transitionId = this.generateTransitionId(objectId, 'create', 1);
    const timestamp = TimeAuthority.now();

    return {
      id: transitionId,
      object_id: objectId,
      operation: 'create',
      actor_id: actorId,
      sequence: 1,
      previous_transition: null,
      payload_hash: payloadHash,
      timestamp,
      proof: proof || {}
    };
  }

  /**
   * Create a relate transition
   */
  static createRelateTransition(
    objectId: string,
    actorId: string,
    sequence: number,
    payload: RelateTransitionPayload,
    previousTransition: string | null,
    proof?: { verification_method: string; signature: string; public_key?: string }
  ): PingTransition {
    const payloadHash = this.computeContentHash(payload);
    const transitionId = this.generateTransitionId(objectId, 'relate', sequence);
    const timestamp = TimeAuthority.now();

    return {
      id: transitionId,
      object_id: objectId,
      operation: 'relate',
      actor_id: actorId,
      sequence,
      previous_transition: previousTransition,
      payload_hash: payloadHash,
      timestamp,
      proof: proof || {}
    };
  }

  /**
   * Verify transition integrity
   */
  static verifyTransition(transition: PingTransition, expectedPayload: any): boolean {
    const computedHash = this.computeContentHash(expectedPayload);
    return transition.payload_hash === computedHash;
  }
}
