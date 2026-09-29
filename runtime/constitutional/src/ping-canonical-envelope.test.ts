/**
 * ping-canonical-envelope.test.ts
 *
 * Golden tests for the recovered Patch 7B canonical journal envelope:
 *
 * 1. GOLDEN payload_hash: rebuilding Nolan's live identity payload
 *    (identity_cc3383c868f96fc1) from its fields must reproduce the exact
 *    live payload_hash 475d252ff0d39fc3d56fb3de796111ae939dd1687009d8c63dfc35b68e2f7e52.
 * 2. GOLDEN signature: verifyPayload() on the live payload (embedded as a
 *    public-journal fixture) must return true.
 * 3. Roundtrip with a fresh keypair: build -> hash -> sign -> attach ->
 *    verify must hold for OBJECT_CREATED, OBJECT_UPDATED, RELATIONSHIP_CREATED.
 * 4. Tamper evidence: any mutation must fail verification.
 * 5. Input validation for objectUpdated.
 */

import { PingCanonicalEnvelope } from './ping-canonical-envelope';
import { PingIdentityGenerator } from './ping-identity';

/** Live public-journal fixture: Nolan's identity OBJECT_CREATED (Patch 7B). */
const NOLAN_IDENTITY_LIVE = {
  refs: [],
  schema: 'ping.identity@1',
  status: 'active',
  content: {
    public_key:
      '302a300506032b657003210037e0d678d346464bcee80c926633a6327a4e5c8c9cc0539ea81badaa6c083fc5',
    display_name: 'Nolan Geske',
  },
  metadata: { patch: '7B', proof_run_id: 'ping-7b-2026-09-21' },
  object_id: 'identity_cc3383c868f96fc1',
  controller: 'identity_cc3383c868f96fc1',
  created_at: '2026-09-21T01:49:17.037Z',
  visibility: 'public',
  payload_hash:
    '475d252ff0d39fc3d56fb3de796111ae939dd1687009d8c63dfc35b68e2f7e52',
  proof: {
    signature:
      '2525b31c4ee35d6162a2454ec373d4ed5df1670f71d784fee542472476fb6b8453c2113964c3fb83f32293624a834455573729d9ce338cf73779f765740ee804',
    public_key:
      '302a300506032b657003210037e0d678d346464bcee80c926633a6327a4e5c8c9cc0539ea81badaa6c083fc5',
    verification_method: 'ed25519',
  },
};

describe('PingCanonicalEnvelope golden vectors (live Patch 7B journal)', () => {
  test('rebuilding the stripped payload reproduces the live payload_hash', () => {
    const stripped = PingCanonicalEnvelope.objectCreated({
      schema: 'ping.identity@1',
      objectId: 'identity_cc3383c868f96fc1',
      controller: 'identity_cc3383c868f96fc1',
      content: {
        public_key:
          '302a300506032b657003210037e0d678d346464bcee80c926633a6327a4e5c8c9cc0539ea81badaa6c083fc5',
        display_name: 'Nolan Geske',
      },
      refs: [],
      visibility: 'public',
      status: 'active',
      metadata: { patch: '7B', proof_run_id: 'ping-7b-2026-09-21' },
      createdAt: '2026-09-21T01:49:17.037Z',
    });
    expect(PingCanonicalEnvelope.payloadHash(stripped)).toBe(
      '475d252ff0d39fc3d56fb3de796111ae939dd1687009d8c63dfc35b68e2f7e52'
    );
  });

  test('verifyPayload accepts the live signed payload', () => {
    expect(PingCanonicalEnvelope.verifyPayload(NOLAN_IDENTITY_LIVE)).toBe(true);
  });

  test('verifyPayload rejects a tampered payload', () => {
    const tampered = JSON.parse(JSON.stringify(NOLAN_IDENTITY_LIVE));
    tampered.content.display_name = 'Nolan Geske (tampered)';
    expect(PingCanonicalEnvelope.verifyPayload(tampered)).toBe(false);
  });

  test('verifyPayload rejects a re-signed-but-rehashed forgery', () => {
    // Attacker changes content and recomputes the hash but cannot re-sign.
    const forged: Record<string, any> = JSON.parse(JSON.stringify(NOLAN_IDENTITY_LIVE));
    delete forged.proof;
    forged.content.display_name = 'Mallory';
    const rehashed = PingCanonicalEnvelope.withPayloadHash(
      (() => {
        const s = { ...forged };
        delete s.payload_hash;
        return s;
      })()
    );
    rehashed.proof = (NOLAN_IDENTITY_LIVE as any).proof; // old signature
    expect(PingCanonicalEnvelope.verifyPayload(rehashed)).toBe(false);
  });
});

describe('PingCanonicalEnvelope roundtrips (fresh keypair)', () => {
  const keypair = PingIdentityGenerator.generateKeyPair();
  const pubkey = keypair.public_key;

  function seal(stripped: Record<string, any>): Record<string, any> {
    const withHash = PingCanonicalEnvelope.withPayloadHash(stripped);
    const signature = PingCanonicalEnvelope.signPayload(withHash, keypair.private_key);
    return PingCanonicalEnvelope.attachProof(withHash, {
      verification_method: 'ed25519',
      signature,
      public_key: pubkey,
    });
  }

  test('OBJECT_CREATED roundtrip', () => {
    const stripped = PingCanonicalEnvelope.objectCreated({
      schema: 'ping.social.post@1',
      objectId: 'object_test123',
      controller: 'identity_test',
      content: { text: 'hello' },
      createdAt: '2026-09-21T02:00:00.000Z',
      metadata: { t: 1 },
    });
    expect(PingCanonicalEnvelope.verifyPayload(seal(stripped))).toBe(true);
  });

  test('OBJECT_UPDATED roundtrip', () => {
    const stripped = PingCanonicalEnvelope.objectUpdated({
      objectId: 'object_test123',
      changes: { handle: 'alice' },
      updatedBy: 'identity_test',
      createdAt: '2026-09-21T02:01:00.000Z',
      metadata: { reason: 'test' },
    });
    expect(stripped).toMatchObject({
      object_id: 'object_test123',
      changes: { handle: 'alice' },
      updated_by: 'identity_test',
    });
    expect(PingCanonicalEnvelope.verifyPayload(seal(stripped))).toBe(true);
  });

  test('RELATIONSHIP_CREATED roundtrip', () => {
    const stripped = PingCanonicalEnvelope.relationshipCreated({
      relationshipId: 'rel_test123',
      subject: 'identity_a',
      predicate: 'likes',
      object: 'object_x',
      status: 'inactive',
      createdAt: '2026-09-21T02:02:00.000Z',
    });
    expect(PingCanonicalEnvelope.verifyPayload(seal(stripped))).toBe(true);
  });

  test('submissionBody shapes the POST /events body', () => {
    const body = PingCanonicalEnvelope.submissionBody(
      'OBJECT_UPDATED',
      'object_test123',
      'ping_object',
      { a: 1 }
    );
    expect(body).toEqual({
      event_type: 'OBJECT_UPDATED',
      aggregate_id: 'object_test123',
      aggregate_type: 'ping_object',
      event_data: { a: 1 },
    });
  });

  test('objectUpdated validates its inputs', () => {
    expect(() =>
      PingCanonicalEnvelope.objectUpdated({
        objectId: '',
        changes: { handle: 'x' },
        updatedBy: 'identity_test',
        createdAt: '2026-09-21T02:00:00.000Z',
      })
    ).toThrow();
    expect(() =>
      PingCanonicalEnvelope.objectUpdated({
        objectId: 'object_x',
        changes: [] as any,
        updatedBy: 'identity_test',
        createdAt: '2026-09-21T02:00:00.000Z',
      })
    ).toThrow();
  });
});
