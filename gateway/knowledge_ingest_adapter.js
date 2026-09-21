/**
 * PING Knowledge Ingest Adapter (Lane B, 2026-09-21).
 *
 * Translates website-observation envelopes into canonical journal payloads.
 *
 * The extractor submits signed envelopes shaped as
 *   { type, payload, proof, metadata }
 * where proof.signature is base64 Ed25519 over the submitter's own canonical
 * bytes: sorted-key JSON of { type, payload, metadata } (the same BFF
 * construction the social adapter verifies; see
 * gateway/social_ingest_adapter.js).
 *
 * This adapter:
 *  - verifies the envelope signature (fail-closed on invalid proof),
 *  - rejects any private-key-looking material in the submission,
 *  - accepts ONLY the knowledge schemas/predicates registered in the ONE
 *    canonical vocabulary (runtime/constitutional/src/ping-vocabulary.ts,
 *    compiled to gateway/constitutional-dist at Docker build time; never
 *    reimplemented here),
 *  - mints object and relationship ids deterministically via the ONE
 *    IdentityAuthority,
 *  - computes payload_hash via the recovered Patch 7B construction
 *    (raw SHA-256 of canonical bytes of payload-minus-proof-minus-hash),
 *  - FAILS CLOSED when a knowledge object lacks provenance
 *    (metadata.provenance.{source_url, source_type, observed_at}): a fact
 *    without a source is not a PING fact. Knowledge content always carries
 *    claim_basis 'website_statement' (or the extractor's stated basis): the
 *    website SAID it, PING does not assert it as constitutional truth.
 *
 * Revocation: no negative predicates exist. Revocation is a second
 * RELATIONSHIP_CREATED with the same predicate and status 'inactive'.
 *
 * Social schemas/predicates stay in social_ingest_adapter.js; this module
 * never accepts them (and vice versa). gateway/routes/events.js dispatches
 * on the payload schema prefix.
 */

'use strict';

const crypto = require('crypto');

const { IdentityAuthority } = require('./constitutional-dist/identity-authority.js');
const { HashAuthority } = require('./constitutional-dist/hash-authority.js');
const {
  KNOWLEDGE_SCHEMAS,
  KNOWLEDGE_PREDICATES,
  isKnowledgePredicate,
  isKnowledgeSchema,
} = require('./constitutional-dist/ping-vocabulary.js');

const KNOWLEDGE_ENVELOPE = 'knowledge-envelope@1';

const EVENT_TYPES = ['OBJECT_CREATED', 'OBJECT_UPDATED', 'RELATIONSHIP_CREATED'];

/**
 * The submitter's dev canonicalization, identical to the social adapter's
 * BFF construction: sorted keys, recursive, undefined dropped.
 * Used ONLY to verify submitter-originated signatures.
 */
function knowledgeCanonicalize(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(knowledgeCanonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${knowledgeCanonicalize(v)}`);
    return `{${entries.join(',')}}`;
  }
  const s = JSON.stringify(value);
  return s === undefined ? 'null' : s;
}

function sha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes, 'utf8').digest('hex');
}

/** Canonical bytes per the recovered Patch 7B construction. */
function canonicalBytes(value) {
  return JSON.stringify(HashAuthority.canonicalizeObject(value));
}

/** payload_hash = raw SHA-256 hex of canonical bytes of (payload - proof - payload_hash). */
function computePayloadHash(normalized) {
  const stripped = { ...normalized };
  delete stripped.proof;
  delete stripped.payload_hash;
  return sha256Hex(canonicalBytes(stripped));
}

const SECRET_KEY_RE = /private_?key|privatepem|BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i;

function rejectSecrets(value, path) {
  if (Array.isArray(value)) {
    value.forEach((v, i) => rejectSecrets(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY_RE.test(k)) {
        throw new Error(`SECRET_REJECTED: private-key-looking field '${path}.${k}' is never accepted by the ingest path`);
      }
      rejectSecrets(v, `${path}.${k}`);
    }
    return;
  }
  if (typeof value === 'string' && SECRET_KEY_RE.test(value)) {
    throw new Error(`SECRET_REJECTED: private-key-looking value at '${path}' is never accepted by the ingest path`);
  }
}

/**
 * Verify the envelope proof. Returns the signer's public key as
 * { keyObject, spkiDerHex }.
 */
function verifyKnowledgeProof(type, payload, metadata, proof) {
  if (!proof || typeof proof !== 'object') throw new Error('INVALID_PROOF: envelope proof is required');
  if (proof.algorithm !== 'ed25519') throw new Error('INVALID_PROOF: proof.algorithm must be ed25519');
  if (!proof.signature || !proof.publicKey) {
    throw new Error('INVALID_PROOF: proof must carry signature (base64) and publicKey (PEM)');
  }
  const bytes = knowledgeCanonicalize({ type, payload, metadata });
  let keyObject;
  try {
    keyObject = crypto.createPublicKey({ key: proof.publicKey, format: 'pem' });
  } catch (e) {
    throw new Error(`INVALID_PROOF: publicKey is not a parseable PEM public key: ${e.message}`);
  }
  let ok = false;
  try {
    ok = crypto.verify(null, Buffer.from(bytes, 'utf8'), keyObject, Buffer.from(proof.signature, 'base64'));
  } catch (e) {
    ok = false;
  }
  if (!ok) throw new Error('INVALID_SIGNATURE: envelope signature does not verify over canonical-json(type,payload,metadata)');
  return { keyObject, spkiDerHex: keyObject.export({ format: 'der', type: 'spki' }).toString('hex') };
}

/** Provenance is mandatory for knowledge: a fact without a source is not a PING fact. */
function assertProvenance(baseMetadata) {
  const prov = baseMetadata && baseMetadata.provenance;
  if (!prov || typeof prov !== 'object') {
    throw new Error('MISSING_PROVENANCE: knowledge ingest requires metadata.provenance {source_url, source_type, observed_at}');
  }
  for (const f of ['source_url', 'source_type', 'observed_at']) {
    if (typeof prov[f] !== 'string' || !prov[f].trim()) {
      throw new Error(`MISSING_PROVENANCE: metadata.provenance.${f} is required`);
    }
  }
}

function normalizeKnowledgeObjectCreated(payload, baseMetadata, createdAt) {
  const schema = payload.schema;
  if (!isKnowledgeSchema(schema)) {
    throw new Error(
      `UNSUPPORTED_SCHEMA: knowledge ingest supports ${[...KNOWLEDGE_SCHEMAS].join(', ')}, got '${schema}'`
    );
  }
  const controller = payload.controller;
  if (!controller || typeof controller !== 'string') {
    throw new Error('MISSING_FIELD: knowledge OBJECT_CREATED requires controller (ingest identity id)');
  }
  const content = payload.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    throw new Error('MISSING_FIELD: knowledge OBJECT_CREATED requires content object');
  }
  if (content.claim_basis !== 'website_statement' && content.claim_basis !== 'extractor_inference') {
    throw new Error("INVALID_CLAIM_BASIS: knowledge content.claim_basis must be 'website_statement' or 'extractor_inference'");
  }
  // Stable dedup key: explicit key, else the observed source URL, else a
  // hash of the canonical content. Deterministic either way.
  const key =
    (typeof payload.key === 'string' && payload.key.trim()) ||
    (baseMetadata.provenance && baseMetadata.provenance.source_url) ||
    sha256Hex(canonicalBytes(content));
  const objectId =
    payload.object_id ||
    payload.objectId ||
    IdentityAuthority.generateId('object', { schema, controller, key });
  const normalized = {
    schema,
    object_id: objectId,
    controller,
    created_at: createdAt,
    content,
    refs: Array.isArray(payload.refs) ? payload.refs : [],
    visibility: payload.visibility || 'public',
    status: 'active',
    metadata: baseMetadata,
  };
  return { normalized, aggregateId: objectId, aggregateType: 'ping_object' };
}

function normalizeKnowledgeRelationshipCreated(payload, baseMetadata, createdAt) {
  const { subject, predicate, object } = payload;
  if (!subject) throw new Error('MISSING_FIELD: RELATIONSHIP_CREATED requires subject');
  if (!object) throw new Error('MISSING_FIELD: RELATIONSHIP_CREATED requires object');
  if (!isKnowledgePredicate(predicate)) {
    throw new Error(
      `PREDICATE_NOT_CANONICAL: '${predicate}' is not a canonical knowledge predicate. ` +
        `Canonical: ${[...KNOWLEDGE_PREDICATES].join(', ')}. ` +
        `Revocation is status 'inactive' on the same predicate; negative predicates do not exist.`
    );
  }
  const status = payload.status || 'active';
  if (!['active', 'inactive'].includes(status)) throw new Error(`INVALID_STATUS: '${status}' must be 'active' or 'inactive'`);
  const relationshipId =
    payload.relationship_id ||
    payload.relationshipId ||
    IdentityAuthority.generateId('relationship', { subject, predicate, object });
  const normalized = {
    relationship_id: relationshipId,
    subject,
    predicate,
    object,
    status,
    created_at: createdAt,
    metadata: baseMetadata,
  };
  return { normalized, aggregateId: relationshipId, aggregateType: 'ping_relationship' };
}

/**
 * Normalize a knowledge envelope into a canonical journal submission.
 * Returns { eventType, aggregateId, aggregateType, eventData } ready for
 * eventRuntime.emit, or throws a typed Error (message prefixed with a
 * machine-readable code).
 */
async function normalizeKnowledgeEnvelope(body) {
  const { type, payload, proof, metadata } = body || {};
  if (!EVENT_TYPES.includes(type)) {
    throw new Error(`UNKNOWN_EVENT_TYPE: '${type}' is not one of ${EVENT_TYPES.join(', ')}`);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('INVALID_ENVELOPE: envelope payload must be an object');
  }
  rejectSecrets(payload, 'payload');
  verifyKnowledgeProof(type, payload, metadata || {}, proof);

  const createdAt = new Date().toISOString();
  const baseMetadata = {
    ...(metadata || {}),
    _ingest: { adapter: KNOWLEDGE_ENVELOPE, received_at: createdAt },
  };
  assertProvenance(baseMetadata);

  let normalized, aggregateId, aggregateType;
  if (type === 'OBJECT_CREATED') {
    ({ normalized, aggregateId, aggregateType } = normalizeKnowledgeObjectCreated(payload, baseMetadata, createdAt));
  } else if (type === 'RELATIONSHIP_CREATED') {
    ({ normalized, aggregateId, aggregateType } = normalizeKnowledgeRelationshipCreated(payload, baseMetadata, createdAt));
  } else {
    throw new Error('UNSUPPORTED_EVENT_TYPE: knowledge ingest accepts OBJECT_CREATED and RELATIONSHIP_CREATED only');
  }

  normalized.payload_hash = computePayloadHash(normalized);
  normalized.proof = {
    ...proof,
    signature_construction: KNOWLEDGE_ENVELOPE,
    signed_bytes: 'canonical-json(type,payload,metadata)',
    payload_hash: normalized.payload_hash,
  };

  return { eventType: type, aggregateId, aggregateType, eventData: normalized };
}

module.exports = {
  KNOWLEDGE_ENVELOPE,
  knowledgeCanonicalize,
  computePayloadHash,
  normalizeKnowledgeEnvelope,
  verifyKnowledgeProof,
  rejectSecrets,
  KNOWLEDGE_SCHEMAS: [...KNOWLEDGE_SCHEMAS],
  KNOWLEDGE_PREDICATES: [...KNOWLEDGE_PREDICATES],
};
