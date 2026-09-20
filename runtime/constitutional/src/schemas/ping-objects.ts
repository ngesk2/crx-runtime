/**
 * PING Social Object Schemas
 * PATCH 3: Object Kernel
 * 
 * Protocol-neutral PING primitives for social object flow
 */

/**
 * Canonical PING Object
 */
export interface PingObject {
  id: string;  // Deterministic: object_<type_hash16>
  schema: string;  // e.g., "ping.social.post@1"
  controller: string;  // Actor who controls this object
  created_at: string;  // ISO timestamp
  content: Record<string, any>;  // Object-specific content
  refs: string[];  // References to other object IDs
}

/**
 * PING Post Object
 */
export interface PingPost extends PingObject {
  schema: 'ping.social.post@1';
  content: {
    text: string;
  };
}

/**
 * PING Profile Object
 */
export interface PingProfile extends PingObject {
  schema: 'ping.social.profile@1';
  content: {
    display_name: string;
    bio?: string;
  };
}

/**
 * PING Relationship
 */
export interface PingRelationship {
  id: string;  // Deterministic: relationship_<type_hash16>
  subject: string;  // Who is relating (e.g., "bob")
  predicate: string;  // Type of relationship (e.g., "follows", "replies_to", "references")
  object: string;  // What is being related to (e.g., "alice", object ID)
  created_at: string;  // ISO timestamp
  status: 'active' | 'inactive';
  metadata?: Record<string, any>;
}

/**
 * PING Transition (immutable state change)
 */
export interface PingTransition {
  id: string;  // Deterministic: transition_<type_hash16>
  object_id: string;  // Target object
  operation: 'create' | 'relate' | 'unrelate' | 'propose' | 'approve' | 'publish' | 'tombstone';
  actor_id: string;  // Who performed the operation
  sequence: number;  // Sequence number per object
  previous_transition: string | null;  // Previous transition ID for chaining
  payload_hash: string;  // SHA-256 of operation payload
  timestamp: string;  // ISO timestamp
  proof: {
    verification_method?: string;
    signature?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * Create Transition Payload
 */
export interface CreateTransitionPayload {
  schema: string;
  controller: string;
  content: Record<string, any>;
  refs?: string[];
}

/**
 * Relate Transition Payload
 */
export interface RelateTransitionPayload {
  subject: string;
  predicate: string;
  object: string;
}
