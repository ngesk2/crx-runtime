/**
 * Patch 7B fail-before tests: canonicalization, identity binding, feed determinism.
 *
 * These tests FAIL on the pre-7B code (raw JSON.stringify in generateId,
 * identity ID from display name only, feed ordered by timestamp alone) and
 * PASS after the 7B canonicalization fixes. Written before the fix.
 */

import { IdentityAuthority } from './identity-authority';
import { HashAuthority } from './hash-authority';
import { PingIdentityManager, PingIdentityGenerator } from './ping-identity';
import { PingFeedProjection } from './ping-feed-projection';
import { PingObject, PingRelationship } from './schemas/ping-objects';

describe('Patch 7B canonicalization (fail-before)', () => {
  it('nested canonical equivalence: key order does not change the ID', () => {
    const a = IdentityAuthority.generateId('object', {
      schema: 'ping.social.post@1',
      controller: 'alice',
      content: { text: 'hi', tags: ['a', 'b'], meta: { z: 1, a: 2 } },
    });
    const b = IdentityAuthority.generateId('object', {
      content: { meta: { a: 2, z: 1 }, tags: ['a', 'b'], text: 'hi' },
      controller: 'alice',
      schema: 'ping.social.post@1',
    });
    expect(a).toBe(b);
  });

  it('nested semantic difference: one nested value changes the ID', () => {
    const a = IdentityAuthority.generateId('object', { content: { meta: { a: 2 } } });
    const b = IdentityAuthority.generateId('object', { content: { meta: { a: 3 } } });
    expect(a).not.toBe(b);
  });

  it('array order is semantically significant', () => {
    const a = IdentityAuthority.generateId('object', { tags: ['a', 'b'] });
    const b = IdentityAuthority.generateId('object', { tags: ['b', 'a'] });
    expect(a).not.toBe(b);
  });

  it('golden vector: canonical bytes are stable and key-sorted', () => {
    expect(
      PingIdentityGenerator.canonicalBytes({ b: 2, a: 1, nested: { z: 3, y: [2, 1] } })
    ).toBe('{"a":1,"b":2,"nested":{"y":[2,1],"z":3}}');
  });

  it('golden vector: generateId output is stable (contract lock)', () => {
    // Locked 2026-09-21 on refactored generateId (HashAuthority.canonicalizeObject).
    // If this value changes without an intentional contract migration, the
    // change is a replay-compatibility break and must be treated as such.
    expect(IdentityAuthority.generateId('object', { a: 1 })).toBe('object_d717e8f218bf2f69');
  });

  it('hashCanonical is order-independent for nested objects', () => {
    const h1 = HashAuthority.hashCanonical({ x: { b: 1, a: 2 }, y: [3, 2, 1] });
    const h2 = HashAuthority.hashCanonical({ y: [3, 2, 1], x: { a: 2, b: 1 } });
    expect(h1).toBe(h2);
  });

  it('signatures cover canonical bytes, not key order', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const body1 = { text: 'Hello PING', n: 1 };
    const body2 = { n: 1, text: 'Hello PING' };
    const sig = PingIdentityManager.signCanonical(alice, body1);
    expect(PingIdentityManager.verifyCanonical(alice, body2, sig)).toBe(true);
    // A different body must not verify against the same signature.
    expect(PingIdentityManager.verifyCanonical(alice, { text: 'Hello PING', n: 2 }, sig)).toBe(false);
  });

  it('independent verification with a bare public key works on canonical bytes', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const body = { text: 'Hello PING' };
    const sig = PingIdentityManager.signCanonical(alice, body);
    expect(PingIdentityManager.verifyCanonicalWithPublicKey(body, sig, alice.public_key)).toBe(true);
  });

  it('identity IDs bind the public key: same display name still yields distinct identities', () => {
    const a = PingIdentityManager.createIdentity('Alice');
    const b = PingIdentityManager.createIdentity('Alice');
    expect(a.identity_id).not.toBe(b.identity_id);
    expect(a.public_key).not.toBe(b.public_key);
  });

  it('Bob cannot forge Alice: cross-identity canonical verification fails', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const bob = PingIdentityManager.createIdentity('Bob');
    const sig = PingIdentityManager.signCanonical(bob, { text: 'Hello PING' });
    expect(PingIdentityManager.verifyCanonical(alice, { text: 'Hello PING' }, sig)).toBe(false);
  });
});

describe('Patch 7B feed determinism (fail-before)', () => {
  const T0 = '2026-09-21T00:00:00.000Z';
  const mkPost = (id: string, controller: string, createdAt: string, visibility = 'public'): PingObject => ({
    id,
    schema: 'ping.social.post@1',
    controller,
    created_at: createdAt,
    content: { text: id },
    refs: [],
    visibility,
    status: 'active',
  });
  const follows = (subject: string, object: string): PingRelationship => ({
    id: `relationship_${subject}_${object}`,
    subject,
    predicate: 'follows',
    object,
    created_at: T0,
    status: 'active',
  });

  it('feed order is deterministic with object_id DESC tiebreak on equal timestamps', () => {
    const objs = [mkPost('object_b', 'alice', T0), mkPost('object_a', 'alice', T0), mkPost('object_c', 'alice', T0)];
    const feed = PingFeedProjection.deriveFeed('bob', objs, [follows('bob', 'alice')]);
    expect(feed.map((e) => e.object.id)).toEqual(['object_c', 'object_b', 'object_a']);
    // A second derivation over a differently-ordered input gives the same order.
    const feed2 = PingFeedProjection.deriveFeed('bob', [objs[2], objs[0], objs[1]], [follows('bob', 'alice')]);
    expect(feed2.map((e) => e.object.id)).toEqual(['object_c', 'object_b', 'object_a']);
  });

  it('feed is reverse chronological across timestamps', () => {
    const objs = [
      mkPost('object_old', 'alice', '2026-09-20T00:00:00.000Z'),
      mkPost('object_new', 'alice', '2026-09-21T00:00:00.000Z'),
    ];
    const feed = PingFeedProjection.deriveFeed('bob', objs, [follows('bob', 'alice')]);
    expect(feed.map((e) => e.object.id)).toEqual(['object_new', 'object_old']);
  });

  it('feed hides private objects of followed actors from non-controllers', () => {
    const objs = [
      mkPost('object_pub', 'alice', T0, 'public'),
      mkPost('object_priv', 'alice', T0, 'private'),
    ];
    const feed = PingFeedProjection.deriveFeed('bob', objs, [follows('bob', 'alice')]);
    expect(feed.map((e) => e.object.id)).toEqual(['object_pub']);
    // The controller still sees their own private objects.
    const ownFeed = PingFeedProjection.deriveFeed('alice', objs, []);
    expect(ownFeed.map((e) => e.object.id).sort()).toEqual(['object_priv', 'object_pub']);
  });

  it('feed shows followers-visibility objects to followers only', () => {
    const objs = [mkPost('object_fol', 'alice', T0, 'followers')];
    const bobFeed = PingFeedProjection.deriveFeed('bob', objs, [follows('bob', 'alice')]);
    expect(bobFeed.map((e) => e.object.id)).toEqual(['object_fol']);
    const carolFeed = PingFeedProjection.deriveFeed('carol', objs, []);
    expect(carolFeed).toEqual([]);
  });
});
