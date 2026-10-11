'use strict';

// Pure checks for TenantRegistry commands. No identity issuer, storage or writer.
const crypto = require('node:crypto');
const { CanonicalBytes, CanonicalAuthority } = require('../authorities/canonical_authority');
const { identityAuthority } = require('../authorities/identity_authority');
const { isSmallOrder } = require('./commissioning_key_policy');

const SCOPE = Object.freeze(['tenant_id', 'controller_id', 'commissioning_project_id', 'site_id', 'resource_id']);
const PROTOCOL = 'commissioning-admission@2';
const INTENT = Object.freeze(['protocol_version', 'authenticated_actor', 'authorized_signer', 'grant_id', 'grant_revision',
  ...SCOPE, 'operation', 'purpose', 'payload_digest', 'logical_operation_id']);
const OPERATIONS = new Set(['OBJECT_CREATED', 'OBJECT_UPDATED']);
function deny(code) { const e = new Error(code); e.code = code; throw e; }
function requireThat(condition, code) { if (!condition) deny(code); }
function text(value) { return typeof value === 'string' && value.length > 0 && value.length <= 255; }
function digest(bytes) { return CanonicalAuthority.hashBytes(Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)); }
function bytes(value) { return CanonicalBytes.serialize(value); }
function assertJson(value, depth=0) {
  requireThat(depth<=128, 'invalid_json_payload');
  if(value===null || typeof value==='string' || typeof value==='boolean')return;
  if(typeof value==='number'){requireThat(Number.isFinite(value), 'invalid_json_payload');return;}
  requireThat(value && typeof value==='object' && (Array.isArray(value) || Object.getPrototypeOf(value)===Object.prototype || Object.getPrototypeOf(value)===null), 'invalid_json_payload');
  for(const key of Object.keys(value)){
    requireThat(key!=='__proto__', 'invalid_json_payload');
    assertJson(value[key],depth+1);
  }
}
function payloadDigest(payload, metadata) {
  assertJson({payload,metadata});
  // Reuse the existing knowledge payload-hash construction. The historical
  // kernel serializer has delimiter-free arrays; it is preserved for history,
  // but must not permit [1,23] -> [12,3] substitution in NEW signed intents.
  const { HashAuthority } = require('../../gateway/constitutional-dist/hash-authority');
  return digest(Buffer.from(JSON.stringify(HashAuthority.canonicalizeObject({payload,metadata}))));
}
function id(kind, value) { return identityAuthority.generateFromCanonicalHash(bytes(value), kind); }
function keyId(pem) {
  const key = crypto.createPublicKey(pem);
  requireThat(key.asymmetricKeyType === 'ed25519', 'invalid_signer');
  const der = key.export({ format: 'der', type: 'spki' });
  requireThat(!isSmallOrder(der.subarray(-32)), 'weak_signer');
  return digest(der);
}
function verify(pem, signature, signedBytes) {
  try {
    requireThat(typeof signature === 'string' && /^[A-Za-z0-9+/]{86}==$/.test(signature), 'invalid_signature');
    requireThat(Buffer.from(signature,'base64').toString('base64')===signature,'invalid_signature');
    const key = crypto.createPublicKey(pem);
    requireThat(key.asymmetricKeyType === 'ed25519', 'invalid_signature');
    requireThat(!isSmallOrder(key.export({format:'der',type:'spki'}).subarray(-32)), 'weak_signer');
    requireThat(crypto.verify(null, signedBytes, key, Buffer.from(signature, 'base64')), 'invalid_signature');
  } catch (_) { deny('invalid_signature'); }
}
function checkScope(scope) {
  for (const field of SCOPE) requireThat(text(scope[field]), 'invalid_scope');
  requireThat(/^[A-Za-z0-9][A-Za-z0-9-]{0,63}$/.test(scope.tenant_id) && scope.tenant_id !== 'UNKNOWN', 'invalid_scope');
  requireThat(new Set([scope.commissioning_project_id, scope.site_id, scope.resource_id]).size === 3, 'aliased_scope');
}
async function actor(trust, context) {
  requireThat(trust && typeof trust.resolveActor === 'function', 'trust_root_unconfigured');
  const a = await trust.resolveActor(context);
  requireThat(a && a.verified === true && text(a.actor_id), 'unauthenticated_actor');
  return a.actor_id;
}
async function issuer(trust, context, action, command) {
  const a = await actor(trust, context);
  requireThat(command && text(command.issuer_id) && command.body, 'invalid_command');
  // This allowlist is installed by a trusted administrative procedure, never an HTTP body.
  const designated = trust.issuers && trust.issuers.get(command.issuer_id);
  requireThat(designated && designated.active === true && designated.actor_id === a, 'untrusted_issuer');
  verify(designated.public_key, command.signature, bytes({ action, issuer_id: command.issuer_id, body: command.body }));
  return command.issuer_id;
}
function activeIssuer(trust, issuerId) {
  requireThat(trust && trust.issuers && trust.issuers.get(issuerId)?.active === true, 'untrusted_issuer');
}
function checkIntent(intent) {
  requireThat(intent && Object.keys(intent).length === INTENT.length && INTENT.every(k => Object.hasOwn(intent, k)), 'invalid_intent');
  for (const f of INTENT.filter(k => k !== 'grant_revision')) requireThat(text(intent[f]), 'invalid_intent');
  requireThat(Number.isSafeInteger(intent.grant_revision) && intent.grant_revision > 0, 'invalid_revision');
  requireThat(/^[a-f0-9]{64}$/.test(intent.payload_digest) && /^[a-f0-9]{64}$/.test(intent.authorized_signer), 'invalid_digest');
  checkScope(intent);
  requireThat(intent.protocol_version === PROTOCOL, 'unsupported_protocol_version');
  requireThat(OPERATIONS.has(intent.operation), 'invalid_operation');
}
module.exports = { PROTOCOL, SCOPE, INTENT, OPERATIONS, deny, requireThat, text, bytes, digest, payloadDigest, assertJson, id, keyId, verify,
  checkScope, actor, issuer, activeIssuer, checkIntent };
