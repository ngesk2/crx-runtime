/**
 * Ed25519 identity and signing behavior
 * PATCH 7A: Real Cryptographic Identity (originally a self-running console script)
 * PATCH 7B: converted to a real jest suite. Private key material is never logged.
 */

import { PingIdentityManager } from './ping-identity';

describe('Ed25519 identity and signing', () => {
  it('generates a key pair with a deterministic identity ID', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    expect(alice.identity_id).toMatch(/^identity_[0-9a-f]{16}$/);
    expect(alice.public_key).toHaveLength(88); // 44-byte SPKI DER, hex
    expect(alice.private_key).toHaveLength(96); // 48-byte PKCS8 DER, hex
  });

  it('signs data and verifies with the same identity', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const data = 'Hello PING';
    const signature = PingIdentityManager.sign(alice, data);
    expect(signature).toHaveLength(128); // 64-byte Ed25519 signature, hex
    expect(PingIdentityManager.verify(alice, data, signature)).toBe(true);
  });

  it('creates independent identities for Alice and Bob', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const bob = PingIdentityManager.createIdentity('Bob');
    expect(alice.identity_id).not.toBe(bob.identity_id);
    expect(alice.public_key).not.toBe(bob.public_key);
  });

  it('rejects Bob signing as Alice', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const bob = PingIdentityManager.createIdentity('Bob');
    const data = 'Hello PING';
    const bobSignature = PingIdentityManager.sign(bob, data);
    expect(PingIdentityManager.verifyWithPublicKey(data, bobSignature, alice.public_key)).toBe(false);
  });

  it('lets Bob verify Alice independently with her public key', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const data = 'Hello PING';
    const signature = PingIdentityManager.sign(alice, data);
    expect(PingIdentityManager.verifyWithPublicKey(data, signature, alice.public_key)).toBe(true);
  });

  it('rejects a signature over the wrong data', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const wrongSignature = PingIdentityManager.sign(alice, 'Wrong data');
    expect(PingIdentityManager.verify(alice, 'Hello PING', wrongSignature)).toBe(false);
  });

  it('rejects a tampered message', () => {
    const alice = PingIdentityManager.createIdentity('Alice');
    const signature = PingIdentityManager.sign(alice, 'Hello PING');
    expect(PingIdentityManager.verify(alice, 'Hello PING!', signature)).toBe(false);
  });
});
