/**
 * PING Social Ingest Adapter (sprint continuation).
 *
 * Translates website-BFF practice envelopes into canonical journal payloads.
 *
 * The practice BFF submits signed envelopes shaped as
 *   { type, payload, proof, metadata }
 * where proof.signature is base64 Ed25519 over the BFF's own canonical
 * bytes: sorted-key JSON of { type, payload, metadata }
 * (see website src/lib/ping/dev-signer.ts; that canonicalization is a dev
 * stand-in, NOT the constitutional path, and is verified here exactly as
 * the BFF constructs it).
 *
 * This adapter:
 *  - verifies the BFF signature (fail-closed on invalid proof),
 *  - rejects any private-key-looking material in the submission,
 *  - normalizes the payload into the canonical journal shape:
 *      object_id / relationship_id minted deterministically via the ONE
 *      IdentityAuthority (compiled from runtime/constitutional/src at
 *      Docker build time; never reimplemented here),
 *      payload_hash via the recovered Patch 7B construction
 *      (raw SHA-256 of canonical bytes of payload-minus-proof-minus-hash),
 *  - preserves the client's proof and flat fields, adding
 *      signature_construction: 'bff-envelope@1' so verifiers know which
 *      bytes were signed,
 *  - resolves OBJECT_UPDATED objectId references that point at journal
 *      event IDs (the BFF uses event IDs as object handles),
 *  - resolves the signing identity from its public key for updated_by.
 *
 * Vocabulary is enforced, not translated: 'unfollows'/'unlikes' are
 * REJECTED (PREDICATE_NOT_CANONICAL). Revocation is status 'inactive' on
 * the same predicate. The client must send the canonical form.
 */

'use strict';

const crypto = require('crypto');

const { IdentityAuthority } = require('./constitutional-dist/identity-authority.js');
const { HashAuthority } = require('./constitutional-dist/hash-authority.js');

const BFF_ENVELOPE = 'bff-envelope@1';

const EVENT_TYPES = ['OBJECT_CREATED', 'OBJECT_UPDATED', 'RELATIONSHIP_CREATED'];

const SOCIAL_PREDICATES = ['follows', 'likes', 'replies_to', 'approves', 'denies'];

const PROFILE_SCHEMA = 'ping.social.profile@1';
const POST_SCHEMA = 'ping.social.post@1';

const HANDLE_RE = /^[a-z0-9_]{2,24}$/;

/**
 * The BFF's dev canonicalization, ported verbatim from the website's
 * src/lib/ping/dev-signer.ts canonicalizeJson. Sorted keys, recursive,
 * undefined dropped (NOT nullified: this differs from the constitutional
 * canonicalizeObject, which is why the construction is labeled and kept
 * separate). Used ONLY to verify BFF-originated signatures.
 */
function bffCanonicalize(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) return `[${value.map(bffCanonicalize).join(',')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${bffCanonicalize(v)}`);
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
 * Verify the BFF envelope proof. Returns the signer's public key as
 * { keyObject, spkiDerHex }.
 */
function verifyBffProof(type, payload, metadata, proof) {
  if (!proof || typeof proof !== 'object') throw new Error('INVALID_PROOF: envelope proof is required');
  if (proof.algorithm !== 'ed25519') throw new Error('INVALID_PROOF: proof.algorithm must be ed25519');
  if (!proof.signature || !proof.publicKey) {
    throw new Error('INVALID_PROOF: proof must carry signature (base64) and publicKey (PEM)');
  }
  const bytes = bffCanonicalize({ type, payload, metadata });
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

/** Resolve a signer's identity id from its SPKI DER hex public key. */
async function resolveIdentityByPublicKey(pool, spkiDerHex) {
  if (!pool) throw new Error('SIGNER_UNKNOWN: no database handle to resolve the signing identity');
  const r = await pool.query(
    `SELECT payload->>'object_id' AS identity_id FROM ping_events
     WHERE event_type = 'OBJECT_CREATED' AND payload->>'schema' = 'ping.identity@1'
       AND payload->'content'->>'public_key' = $1
     ORDER BY sequence ASC NULLS LAST LIMIT 1`,
    [spkiDerHex]
  );
  if (!r.rows.length || !r.rows[0].identity_id) {
    throw new Error('SIGNER_UNKNOWN: no PING identity binds this public key; create it via POST /identities first');
  }
  return r.rows[0].identity_id;
}

/** Resolve an OBJECT_UPDATED target: journal event_id -> canonical object_id. */
async function resolveObjectId(pool, objectRef) {
  if (/^[0-9a-f]{64}$/i.test(objectRef) && pool) {
    const r = await pool.query(`SELECT payload->>'object_id' AS object_id FROM ping_events WHERE event_id = $1`, [objectRef]);
    if (r.rows.length && r.rows[0].object_id) return r.rows[0].object_id;
  }
  return objectRef;
}

function normalizeObjectCreated(payload, baseMetadata, createdAt) {
  const schema = payload.schema;
  if (schema === PROFILE_SCHEMA) {
    const identityId = payload.identityId || payload.controller;
    const displayName = payload.displayName || payload.name;
    const handle = payload.handle;
    if (!identityId) throw new Error('MISSING_FIELD: profile OBJECT_CREATED requires identityId');
    if (!displayName || !displayName.trim()) throw new Error('MISSING_FIELD: profile OBJECT_CREATED requires displayName');
    if (!handle || !HANDLE_RE.test(handle)) throw new Error('INVALID_HANDLE: handle must match /^[a-z0-9_]{2,24}$/');
    const objectId =
      payload.object_id ||
      payload.objectId ||
      IdentityAuthority.generateId('object', { schema, controller: identityId, handle });
    const bio = typeof payload.bio === 'string' ? payload.bio : '';
    if (bio.length > 280) throw new Error('INVALID_BIO: bio must be 280 characters or fewer');
    const normalized = {
      schema,
      object_id: objectId,
      controller: identityId,
      created_at: createdAt,
      content: { display_name: displayName.trim(), handle, bio: bio.trim() },
      refs: [],
      visibility: payload.visibility || 'public',
      status: 'active',
      metadata: baseMetadata,
      // BFF-reader compatibility: the website BFF reads flat fields at the
      // payload root. Preserved verbatim from the client's submission;
      // the canonical content above is what the projector consumes.
      identityId,
      displayName: displayName.trim(),
      handle,
      bio: bio.trim(),
      verified: payload.verified === true,
    };
    return { normalized, aggregateId: objectId, aggregateType: 'ping_object' };
  }
  if (schema === POST_SCHEMA) {
    const authorId = payload.authorId || payload.identityId || payload.controller;
    const text = payload.text || payload.body;
    if (!authorId) throw new Error('MISSING_FIELD: post OBJECT_CREATED requires authorId');
    if (!text || !text.trim()) throw new Error('MISSING_FIELD: post OBJECT_CREATED requires text');
    const objectId =
      payload.object_id ||
      payload.objectId ||
      IdentityAuthority.generateId('object', { schema, controller: authorId, text: text.trim().slice(0, 80) });
    const normalized = {
      schema,
      object_id: objectId,
      controller: authorId,
      created_at: createdAt,
      content: { text: text.trim() },
      refs: Array.isArray(payload.refs) ? payload.refs : [],
      visibility: payload.visibility || 'public',
      status: 'active',
      metadata: baseMetadata,
      authorId,
      text: text.trim(),
    };
    return { normalized, aggregateId: objectId, aggregateType: 'ping_object' };
  }
  throw new Error(`UNSUPPORTED_SCHEMA: social ingest supports ${PROFILE_SCHEMA} and ${POST_SCHEMA}, got '${schema}'`);
}

function normalizeRelationshipCreated(payload, baseMetadata, createdAt) {
  const { subject, predicate, object } = payload;
  if (!subject) throw new Error('MISSING_FIELD: RELATIONSHIP_CREATED requires subject');
  if (!object) throw new Error('MISSING_FIELD: RELATIONSHIP_CREATED requires object');
  if (!SOCIAL_PREDICATES.includes(predicate)) {
    throw new Error(
      `PREDICATE_NOT_CANONICAL: '${predicate}' is not a canonical predicate. ` +
        `Canonical: ${SOCIAL_PREDICATES.join(', ')}. ` +
        `Revocation is status 'inactive' on the same predicate; 'unfollows'/'unlikes' do not exist.`
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

const CAMEL_TO_SNAKE = { displayName: 'display_name', authorDisplayName: 'display_name' };

async function normalizeObjectUpdated(payload, baseMetadata, createdAt, pool, signerSpkiDerHex) {
  const objectRef = payload.objectId || payload.object_id;
  if (!objectRef) throw new Error('MISSING_FIELD: OBJECT_UPDATED requires objectId');
  const changes = payload.changes || payload.patch;
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    throw new Error('INVALID_CHANGES: OBJECT_UPDATED requires a changes object');
  }
  const objectId = await resolveObjectId(pool, objectRef);
  const signerId = await resolveIdentityByPublicKey(pool, signerSpkiDerHex);
  const canonicalChanges = {};
  for (const [k, v] of Object.entries(changes)) {
    canonicalChanges[CAMEL_TO_SNAKE[k] || k] = v;
  }
  const normalized = {
    object_id: objectId,
    objectId: objectRef,
    changes: canonicalChanges,
    updated_by: signerId,
    created_at: createdAt,
    metadata: baseMetadata,
  };
  return { normalized, aggregateId: objectId, aggregateType: 'ping_object' };
}

/**
 * Normalize a BFF practice envelope into a canonical journal submission.
 * Returns { eventType, aggregateId, aggregateType, eventData } ready for
 * eventRuntime.emit, or throws a typed Error (message prefixed with a
 * machine-readable code).
 */
async function normalizeBffEnvelope(body, pool) {
  const { type, payload, proof, metadata } = body || {};
  if (!EVENT_TYPES.includes(type)) {
    throw new Error(`UNKNOWN_EVENT_TYPE: '${type}' is not one of ${EVENT_TYPES.join(', ')}`);
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('INVALID_ENVELOPE: envelope payload must be an object');
  }
  rejectSecrets(payload, 'payload');
  const { spkiDerHex } = verifyBffProof(type, payload, metadata || {}, proof);

  const createdAt = new Date().toISOString();
  const baseMetadata = {
    ...(metadata || {}),
    _ingest: { adapter: BFF_ENVELOPE, received_at: createdAt },
  };

  let normalized, aggregateId, aggregateType;
  if (type === 'OBJECT_CREATED') {
    ({ normalized, aggregateId, aggregateType } = normalizeObjectCreated(payload, baseMetadata, createdAt));
  } else if (type === 'RELATIONSHIP_CREATED') {
    ({ normalized, aggregateId, aggregateType } = normalizeRelationshipCreated(payload, baseMetadata, createdAt));
  } else {
    ({ normalized, aggregateId, aggregateType } = await normalizeObjectUpdated(payload, baseMetadata, createdAt, pool, spkiDerHex));
  }

  normalized.payload_hash = computePayloadHash(normalized);
  normalized.proof = {
    ...proof,
    signature_construction: BFF_ENVELOPE,
    signed_bytes: 'canonical-json(type,payload,metadata)',
    payload_hash: normalized.payload_hash,
  };

  return { eventType: type, aggregateId, aggregateType, eventData: normalized };
}

module.exports = {
  BFF_ENVELOPE,
  bffCanonicalize,
  computePayloadHash,
  normalizeBffEnvelope,
  verifyBffProof,
  rejectSecrets,
};
