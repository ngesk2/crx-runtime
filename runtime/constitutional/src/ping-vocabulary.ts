/**
 * PING Social Vocabulary (sprint continuation).
 *
 * ONE canonical registry for the social surface vocabulary. This module is the
 * single source of truth that the TypeScript projector, the SQL schema, and
 * the website BFF adapter must all agree with. Nothing else in the repo may
 * define its own copy of these lists.
 *
 * Predicates (relationships):
 *   follows  - subject follows object        (revoke: status 'inactive')
 *   likes    - subject likes object          (revoke: status 'inactive')
 *   replies_to - subject replies to object   (immutable once active)
 *   approves - subject approves object       (governance workflow)
 *   denies   - subject denies object         (governance workflow)
 * There are NO `unfollows` or `unlikes` predicates. Revocation is a second
 * RELATIONSHIP_CREATED event with the same predicate and status 'inactive'
 * (last-wins by acceptance sequence). Verified live: the Patch 7B unlike is
 * a second `likes` event with status inactive.
 *
 * Object schemas:
 *   ping.identity@1, ping.social.profile@1, ping.social.post@1,
 *   ping.social.circle@1, ping.social.proposal@1
 *
 * Projector operations (ping_objects.operation / ping_transitions.operation):
 *   'create' - from OBJECT_CREATED
 *   'update' - from OBJECT_UPDATED (shallow content merge, right-wins)
 *   'relate' - from RELATIONSHIP_CREATED (current-state upsert, last-wins)
 *
 * Visibility (schema supports): 'public' | 'followers' | 'private'.
 * PING_ONLY is an explicit documented gap (no schema support yet).
 */

export const SOCIAL_PREDICATES = [
  'follows',
  'likes',
  'replies_to',
  'approves',
  'denies',
] as const;

export type SocialPredicate = (typeof SOCIAL_PREDICATES)[number];

/** Predicates whose rows are current-state (last-wins by sequence). */
export const REVOCABLE_PREDICATES: ReadonlySet<SocialPredicate> = new Set([
  'follows',
  'likes',
]);

/** Predicates that must never appear in any payload. */
export const FORBIDDEN_PREDICATES = ['unfollows', 'unlikes'] as const;

export const SOCIAL_SCHEMAS = [
  'ping.identity@1',
  'ping.social.profile@1',
  'ping.social.post@1',
  'ping.social.circle@1',
  'ping.social.proposal@1',
] as const;

export type SocialSchema = (typeof SOCIAL_SCHEMAS)[number];

export const PROJECTOR_OPERATIONS = ['create', 'update', 'relate'] as const;

export type ProjectorOperation = (typeof PROJECTOR_OPERATIONS)[number];

export const SUPPORTED_VISIBILITIES = ['public', 'followers', 'private'] as const;

/**
 * PING_ONLY has no schema support yet. The projector must fail closed
 * (refuse to project) any object whose visibility is not in
 * SUPPORTED_VISIBILITIES rather than silently downgrading it.
 */
export const VISIBILITY_GAP = 'PING_ONLY' as const;

export const JOURNAL_EVENT_TYPES = [
  'OBJECT_CREATED',
  'OBJECT_UPDATED',
  'RELATIONSHIP_CREATED',
] as const;

export type JournalEventType = (typeof JOURNAL_EVENT_TYPES)[number];

export function isSocialPredicate(p: string): p is SocialPredicate {
  return (SOCIAL_PREDICATES as readonly string[]).includes(p);
}

export function isForbiddenPredicate(p: string): boolean {
  return (FORBIDDEN_PREDICATES as readonly string[]).includes(p);
}

export function isRevocablePredicate(p: string): boolean {
  return REVOCABLE_PREDICATES.has(p as SocialPredicate);
}

export function isSupportedVisibility(v: string): boolean {
  return (SUPPORTED_VISIBILITIES as readonly string[]).includes(v);
}

/**
 * Assert the projector operation is one of the canonical three.
 * Throws on anything else (e.g. legacy 'create'/'relate' aliases are fine,
 * but nothing outside this list may reach the projection tables).
 */
export function assertProjectorOperation(op: string): asserts op is ProjectorOperation {
  if (!(PROJECTOR_OPERATIONS as readonly string[]).includes(op)) {
    throw new Error(`PingVocabulary: unknown projector operation '${op}'`);
  }
}

/* ============================================================================
 * PING Knowledge Vocabulary (Lane B, 2026-09-21; ADDITIVE).
 *
 * Website -> object-graph ingest predicates and schemas. This section only
 * ADDS to the canonical vocabulary; every social predicate, schema,
 * operation, and visibility above is untouched.
 *
 * Predicates (relationships):
 *   has_website       - business has_website website        (the site itself)
 *   located_at        - business located_at location        (service area / address)
 *   offers            - business offers service             (services/products)
 *   employs           - business employs person             (role carried in metadata)
 *   member_of         - person member_of business           (inverse view of employs)
 *   published         - business/website published article  (content authored)
 *   external_identity - business external_identity profile (social/other-platform claim)
 *
 * Revocation rule (unchanged, extended): there are NO negative predicates.
 * Revocation is a second RELATIONSHIP_CREATED with the same predicate and
 * status 'inactive' (last-wins by acceptance sequence in the projector).
 * 'unfollows'/'unlikes' remain forbidden and are not knowledge predicates.
 *
 * Object schemas:
 *   ping.knowledge.business@1, ping.knowledge.website@1,
 *   ping.knowledge.location@1, ping.knowledge.service@1,
 *   ping.knowledge.person@1, ping.knowledge.article@1,
 *   ping.knowledge.external_identity@1
 *
 * Provenance rule: knowledge objects are CLAIMS made by the observed source
 * (e.g. "website says X"), never constitutional truth. Every knowledge
 * object carries metadata.provenance { source_url, source_type, observed_at,
 * evidence_ref } and content carries claim_basis: 'website_statement'.
 * ========================================================================== */

export const KNOWLEDGE_PREDICATES = [
  'has_website',
  'located_at',
  'offers',
  'employs',
  'member_of',
  'published',
  'external_identity',
] as const;

export type KnowledgePredicate = (typeof KNOWLEDGE_PREDICATES)[number];

/**
 * Every predicate the projector may write to ping_relationships.
 * database/ping_objects.sql's predicate CHECK must mirror exactly this list
 * (enforced by ping-vocabulary.test.ts, same as the social list before it).
 */
export const CANONICAL_PREDICATES = [
  ...SOCIAL_PREDICATES,
  ...KNOWLEDGE_PREDICATES,
] as const;

export type CanonicalPredicate = (typeof CANONICAL_PREDICATES)[number];

export const KNOWLEDGE_SCHEMAS = [
  'ping.knowledge.business@1',
  'ping.knowledge.website@1',
  'ping.knowledge.location@1',
  'ping.knowledge.service@1',
  'ping.knowledge.person@1',
  'ping.knowledge.article@1',
  'ping.knowledge.external_identity@1',
] as const;

export type KnowledgeSchema = (typeof KNOWLEDGE_SCHEMAS)[number];

/** Every object schema the ingest path may accept. */
export const CANONICAL_SCHEMAS = [
  ...SOCIAL_SCHEMAS,
  ...KNOWLEDGE_SCHEMAS,
] as const;

export type CanonicalSchema = (typeof CANONICAL_SCHEMAS)[number];

export function isKnowledgePredicate(p: string): p is KnowledgePredicate {
  return (KNOWLEDGE_PREDICATES as readonly string[]).includes(p);
}

export function isCanonicalPredicate(p: string): p is CanonicalPredicate {
  return (CANONICAL_PREDICATES as readonly string[]).includes(p);
}

export function isKnowledgeSchema(s: string): s is KnowledgeSchema {
  return (KNOWLEDGE_SCHEMAS as readonly string[]).includes(s);
}

export function isCanonicalSchema(s: string): s is CanonicalSchema {
  return (CANONICAL_SCHEMAS as readonly string[]).includes(s);
}
