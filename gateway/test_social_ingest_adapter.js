/**
 * Tests for the PING Social Ingest Adapter.
 * Pure unit tests: no Postgres, no gateway boot.
 * Run: node gateway/test_social_ingest_adapter.js
 */
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

const adapterPath = path.join(__dirname, 'social_ingest_adapter.js');
const adapter = require(adapterPath);

let passed = 0;
function ok(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`  ok - ${name}`);
    })
    .catch((e) => {
      console.error(`  FAIL - ${name}: ${e.message}`);
      console.error(e.stack);
      process.exitCode = 1;
    });
}

/** Build a BFF-style signed envelope exactly as the website's dev-signer does. */
function signEnvelope(privatePem, publicPem, type, payload, metadata) {
  const canonical = adapter.bffCanonicalize({ type, payload, metadata });
  const sig = crypto.sign(null, Buffer.from(canonical, 'utf8'), crypto.createPrivateKey(privatePem));
  return {
    type,
    payload,
    metadata,
    proof: {
      algorithm: 'ed25519',
      signature: sig.toString('base64'),
      publicKey: publicPem,
    },
  };
}

function freshKeypair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
  return {
    privatePem: privateKey.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicPem: publicKey.export({ format: 'pem', type: 'spki' }).toString(),
  };
}

(async () => {
  console.log('social_ingest_adapter tests');

  const kp = freshKeypair();

  await ok('accepts a valid signed profile OBJECT_CREATED and mints a deterministic object id', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      { schema: 'ping.social.profile@1', identityId: 'identity_test', displayName: 'Test User', handle: 'testuser', bio: 'hi' },
      { source: 'practice-bff' }
    );
    const a = await adapter.normalizeBffEnvelope(env, null);
    assert.strictEqual(a.eventType, 'OBJECT_CREATED');
    assert.ok(/^object_[0-9a-f]{16}$/.test(a.aggregateId), `bad object id ${a.aggregateId}`);
    const b = await adapter.normalizeBffEnvelope(env, null);
    assert.strictEqual(b.aggregateId, a.aggregateId, 'object id must be deterministic');
    assert.strictEqual(a.eventData.content.display_name, 'Test User');
    assert.strictEqual(a.eventData.content.handle, 'testuser');
    assert.ok(/^[0-9a-f]{64}$/.test(a.eventData.payload_hash), 'payload_hash must be sha256 hex');
    assert.strictEqual(a.eventData.proof.signature_construction, 'bff-envelope@1');
    assert.strictEqual(a.eventData.proof.payload_hash, a.eventData.payload_hash);
  });

  await ok('rejects tampered payload with INVALID_SIGNATURE', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      { schema: 'ping.social.profile@1', identityId: 'identity_test', displayName: 'Test', handle: 'testuser' },
      {}
    );
    env.payload.handle = 'mallory';
    await assert.rejects(adapter.normalizeBffEnvelope(env, null), /INVALID_SIGNATURE/);
  });

  await ok('rejects wrong-key signature with INVALID_SIGNATURE', async () => {
    const other = freshKeypair();
    const env = signEnvelope(
      other.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      { schema: 'ping.social.profile@1', identityId: 'identity_test', displayName: 'Test', handle: 'testuser' },
      {}
    );
    await assert.rejects(adapter.normalizeBffEnvelope(env, null), /INVALID_SIGNATURE/);
  });

  await ok('rejects unfollows and unlikes as PREDICATE_NOT_CANONICAL', async () => {
    for (const bad of ['unfollows', 'unlikes']) {
      const env = signEnvelope(
        kp.privatePem,
        kp.publicPem,
        'RELATIONSHIP_CREATED',
        { subject: 'identity_a', predicate: bad, object: 'identity_b' },
        {}
      );
      await assert.rejects(adapter.normalizeBffEnvelope(env, null), /PREDICATE_NOT_CANONICAL/, bad);
    }
  });

  await ok('accepts canonical revocation via status inactive on the same predicate', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'RELATIONSHIP_CREATED',
      { subject: 'identity_a', predicate: 'follows', object: 'identity_b', status: 'inactive' },
      {}
    );
    const a = await adapter.normalizeBffEnvelope(env, null);
    assert.strictEqual(a.eventData.predicate, 'follows');
    assert.strictEqual(a.eventData.status, 'inactive');
    assert.ok(/^relationship_[0-9a-f]{16}$/.test(a.aggregateId));
  });

  await ok('accepts follows/likes/replies_to/approves/denies', async () => {
    for (const p of ['follows', 'likes', 'replies_to', 'approves', 'denies']) {
      const env = signEnvelope(
        kp.privatePem,
        kp.publicPem,
        'RELATIONSHIP_CREATED',
        { subject: 'identity_a', predicate: p, object: 'object_x' },
        {}
      );
      const a = await adapter.normalizeBffEnvelope(env, null);
      assert.strictEqual(a.eventData.predicate, p);
    }
  });

  await ok('rejects payloads containing private-key material', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      { schema: 'ping.social.profile@1', identityId: 'identity_test', displayName: 'Test', handle: 'testuser', privateKey: 'deadbeef' },
      {}
    );
    await assert.rejects(adapter.normalizeBffEnvelope(env, null), /SECRET_REJECTED/);
  });

  await ok('rejects unknown event types', async () => {
    const env = signEnvelope(kp.privatePem, kp.publicPem, 'OBJECT_DELETED', {}, {});
    await assert.rejects(adapter.normalizeBffEnvelope(env, null), /UNKNOWN_EVENT_TYPE/);
  });

  await ok('rejects invalid handles', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      { schema: 'ping.social.profile@1', identityId: 'identity_test', displayName: 'Test', handle: 'Bad Handle!' },
      {}
    );
    await assert.rejects(adapter.normalizeBffEnvelope(env, null), /INVALID_HANDLE/);
  });

  console.log(`\n${passed} passed`);
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
