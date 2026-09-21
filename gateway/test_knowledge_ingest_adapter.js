/**
 * Tests for the PING Knowledge Ingest Adapter (Lane B).
 * Pure unit tests: no Postgres, no gateway boot.
 * Run: node gateway/test_knowledge_ingest_adapter.js
 */
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');

const adapterPath = path.join(__dirname, 'knowledge_ingest_adapter.js');
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

/** Build a signed envelope exactly as the extractor signer does. */
function signEnvelope(privatePem, publicPem, type, payload, metadata) {
  const canonical = adapter.knowledgeCanonicalize({ type, payload, metadata });
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

const PROV = {
  provenance: {
    source_url: 'https://happy-place-platform.vercel.app/',
    source_type: 'website_text_extraction',
    observed_at: '2026-09-21T02:45:00.000Z',
    evidence_ref: 'lane-b-observation-001',
  },
};

(async () => {
  console.log('knowledge_ingest_adapter tests');

  const kp = freshKeypair();

  await ok('accepts a valid signed knowledge OBJECT_CREATED with deterministic id', async () => {
    const env = signEnvelope(
      kp.privatePem,
      kp.publicPem,
      'OBJECT_CREATED',
      {
        schema: 'ping.knowledge.business@1',
        controller: 'identity_nolan',
        key: 'happy-place-carpentry',
        content: { claim_basis: 'website_statement', name: 'Happy Place Carpentry' },
      },
      PROV
    );
    const a = await adapter.normalizeKnowledgeEnvelope(env);
    assert.strictEqual(a.eventType, 'OBJECT_CREATED');
    assert.strictEqual(a.aggregateType, 'ping_object');
    assert.ok(/^object_[0-9a-f]{16}$/.test(a.aggregateId), `bad object id ${a.aggregateId}`);
    const b = await adapter.normalizeKnowledgeEnvelope(env);
    assert.strictEqual(b.aggregateId, a.aggregateId, 'object id must be deterministic');
    assert.ok(/^[0-9a-f]{64}$/.test(a.eventData.payload_hash), 'payload_hash must be sha256 hex');
    assert.strictEqual(a.eventData.proof.signature_construction, 'knowledge-envelope@1');
    assert.strictEqual(a.eventData.proof.payload_hash, a.eventData.payload_hash);
    assert.strictEqual(a.eventData.metadata.provenance.source_url, PROV.provenance.source_url);
  });

  await ok('rejects tampered payload with INVALID_SIGNATURE', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_CREATED',
      { schema: 'ping.knowledge.business@1', controller: 'identity_nolan', content: { claim_basis: 'website_statement', name: 'X' } },
      PROV
    );
    env.payload.content.name = 'Tampered';
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /INVALID_SIGNATURE/);
  });

  await ok('rejects social schema with UNSUPPORTED_SCHEMA', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_CREATED',
      { schema: 'ping.social.post@1', controller: 'identity_nolan', content: { claim_basis: 'website_statement', text: 'hi' } },
      PROV
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /UNSUPPORTED_SCHEMA/);
  });

  await ok('rejects knowledge object without provenance (MISSING_PROVENANCE)', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_CREATED',
      { schema: 'ping.knowledge.business@1', controller: 'identity_nolan', content: { claim_basis: 'website_statement', name: 'X' } },
      { source: 'no-provenance' }
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /MISSING_PROVENANCE/);
  });

  await ok('rejects knowledge object without claim_basis (INVALID_CLAIM_BASIS)', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_CREATED',
      { schema: 'ping.knowledge.business@1', controller: 'identity_nolan', content: { name: 'X' } },
      PROV
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /INVALID_CLAIM_BASIS/);
  });

  await ok('rejects private-key-looking material (SECRET_REJECTED)', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_CREATED',
      {
        schema: 'ping.knowledge.business@1', controller: 'identity_nolan',
        content: { claim_basis: 'website_statement', name: 'X' },
        private_key: 'never-in-a-payload',
      },
      PROV
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /SECRET_REJECTED/);
  });

  await ok('accepts a valid knowledge RELATIONSHIP_CREATED with deterministic id', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'RELATIONSHIP_CREATED',
      { subject: 'object_b1', predicate: 'has_website', object: 'object_w1' },
      PROV
    );
    const a = await adapter.normalizeKnowledgeEnvelope(env);
    assert.strictEqual(a.eventType, 'RELATIONSHIP_CREATED');
    assert.ok(/^relationship_[0-9a-f]{16}$/.test(a.aggregateId), `bad relationship id ${a.aggregateId}`);
    const b = await adapter.normalizeKnowledgeEnvelope(env);
    assert.strictEqual(b.aggregateId, a.aggregateId, 'relationship id must be deterministic');
    assert.strictEqual(a.eventData.status, 'active');
  });

  await ok('accepts all seven knowledge predicates', async () => {
    for (const predicate of adapter.KNOWLEDGE_PREDICATES) {
      const env = signEnvelope(
        kp.privatePem, kp.publicPem, 'RELATIONSHIP_CREATED',
        { subject: 'object_b1', predicate, object: 'object_x' },
        PROV
      );
      const r = await adapter.normalizeKnowledgeEnvelope(env);
      assert.strictEqual(r.eventData.predicate, predicate);
    }
    assert.strictEqual(adapter.KNOWLEDGE_PREDICATES.length, 7);
  });

  await ok('rejects social predicate with PREDICATE_NOT_CANONICAL', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'RELATIONSHIP_CREATED',
      { subject: 'object_b1', predicate: 'follows', object: 'object_w1' },
      PROV
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /PREDICATE_NOT_CANONICAL/);
  });

  await ok('rejects negative predicates (unfollows/unlikes never exist)', async () => {
    for (const predicate of ['unfollows', 'unlikes']) {
      const env = signEnvelope(
        kp.privatePem, kp.publicPem, 'RELATIONSHIP_CREATED',
        { subject: 'object_b1', predicate, object: 'object_w1' },
        PROV
      );
      await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /PREDICATE_NOT_CANONICAL/);
    }
  });

  await ok('accepts revocation as status inactive on the same predicate', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'RELATIONSHIP_CREATED',
      { subject: 'object_b1', predicate: 'offers', object: 'object_s1', status: 'inactive' },
      PROV
    );
    const r = await adapter.normalizeKnowledgeEnvelope(env);
    assert.strictEqual(r.eventData.status, 'inactive');
    assert.strictEqual(r.eventData.predicate, 'offers');
  });

  await ok('rejects OBJECT_UPDATED (knowledge ingest is create/relate only)', async () => {
    const env = signEnvelope(
      kp.privatePem, kp.publicPem, 'OBJECT_UPDATED',
      { object_id: 'object_b1', changes: { name: 'Y' } },
      PROV
    );
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /UNSUPPORTED_EVENT_TYPE/);
  });

  await ok('rejects unknown event type', async () => {
    const env = signEnvelope(kp.privatePem, kp.publicPem, 'OBJECT_DELETED', {}, PROV);
    await assert.rejects(adapter.normalizeKnowledgeEnvelope(env), /UNKNOWN_EVENT_TYPE/);
  });

  console.log(`\n${passed} knowledge adapter tests passed${process.exitCode ? ' (WITH FAILURES)' : ''}`);
})();
