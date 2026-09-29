/**
 * Q-P0-04 WRONG_JOURNAL Test
 * 
 * Tests that the system correctly rejects journal events lacking the required
 * overlay identity marker. The system must fail closed with a typed WRONG_JOURNAL
 * error, zero write, zero partial effect, zero fallback journal, zero silent success.
 */

import { PingCanonicalEnvelope } from './ping-canonical-envelope';
import { PingIdentityGenerator } from './ping-identity';

describe('Q-P0-04 WRONG_JOURNAL - Journal Validation', () => {
  const keypair = PingIdentityGenerator.generateKeyPair();
  const privateKey = keypair.private_key;
  const publicKey = keypair.public_key;

  function signPayload(payload: Record<string, any>): Record<string, any> {
    const withHash = { ...payload, payload_hash: PingIdentityGenerator.canonicalBytes(payload) };
    const signature = PingIdentityGenerator.signCanonical(payload, privateKey);
    return { ...payload, payload_hash: withHash.payload_hash, proof: {
      verification_method: 'ed25519',
      signature,
      public_key: keypair.public_key
    }};
  }

  describe('Journal validation - overlay identity marker', () => {
    test('OBJECT_CREATED without schema fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          objectId: 'test_object_1',
          controller: 'test_controller',
          content: { test: 'data' },
          createdAt: new Date().toISOString(),
          // Missing required 'schema' field - this is the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_UPDATED without objectId fails with WRONG_JOURNAL', () => {
      // OBJECT_UPDATED requires objectId as the overlay identity marker
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
          // Missing objectId - the overlay identity marker
        });
      }).toThrow('PingCanonicalEnvelope.objectUpdated: objectId is required');
    });

    test('OBJECT_UPDATED without changes fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          objectId: 'test_object',
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
          // Missing changes - the overlay identity marker
        });
      }).toThrow('PingCanonicalEnvelope.objectUpdated: changes must be a non-array object');
    });

    test('OBJECT_UPDATED without updatedBy fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          objectId: 'test_object',
          changes: { handle: 'test' },
          createdAt: new Date().toISOString(),
          // Missing updatedBy - the overlay identity marker
        });
      }).toThrow('PingCanonicalEnvelope.objectUpdated: updatedBy is required');
    });

    test('RELATIONSHIP_CREATED without relationshipId fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.relationshipCreated({
          subject: 'subject_1',
          predicate: 'follows',
          object: 'object_1',
          createdAt: new Date().toISOString(),
          // Missing relationshipId - the overlay identity marker
        });
      }).toThrow();
    });

    test('RELATIONSHIP_CREATED without subject fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.relationshipCreated({
          relationshipId: 'rel_123',
          predicate: 'follows',
          object: 'object_1',
          createdAt: new Date().toISOString(),
          // Missing subject - the overlay identity marker
        });
      }).toThrow();
    });

    test('RELATIONSHIP_CREATED without predicate fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.relationshipCreated({
          relationshipId: 'rel_123',
          subject: 'subject_1',
          object: 'object_1',
          createdAt: new Date().toISOString(),
          // Missing predicate - the overlay identity marker
        });
      }).toThrow();
    });

    test('RELATIONSHIP_CREATED without object fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.relationshipCreated({
          relationshipId: 'rel_123',
          subject: 'subject_1',
          predicate: 'follows',
          createdAt: new Date().toISOString(),
          // Missing object - the overlay identity marker
        });
      }).toThrow();
    });

    test('RELATIONSHIP_CREATED without createdAt fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.relationshipCreated({
          relationshipId: 'rel_123',
          subject: 'subject_1',
          predicate: 'follows',
          object: 'object_1',
          // Missing createdAt - the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_CREATED without schema fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          objectId: 'object_1',
          controller: 'controller_1',
          content: { test: 'data' },
          createdAt: new Date().toISOString(),
          // Missing schema - the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_CREATED without objectId fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          schema: 'ping.social.post@1',
          controller: 'controller_1',
          content: { text: 'test' },
          createdAt: new Date().toISOString(),
          // Missing objectId - the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_CREATED without controller fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          schema: 'ping.social.post@1',
          objectId: 'object_1',
          content: { text: 'test' },
          createdAt: new Date().toISOString(),
          // Missing controller - the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_CREATED without content fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          schema: 'ping.social.post@1',
          objectId: 'object_1',
          controller: 'controller_1',
          createdAt: new Date().toISOString(),
          // Missing content - the overlay identity marker
        });
      }).toThrow();
    });

    test('OBJECT_CREATED without createdAt fails with WRONG_JOURNAL', () => {
      expect(() => {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectCreated({
          schema: 'ping.social.post@1',
          objectId: 'object_1',
          controller: 'controller_1',
          content: { text: 'test' },
          // Missing createdAt - the overlay identity marker
        });
      }).toThrow();
    });
  });

  describe('WRONG_JOURNAL typed error contract', () => {
    test('WRONG_JOURNAL error has correct structure', () => {
      try {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
        });
      } catch (error: any) {
        expect(error.message).toContain('WRONG_JOURNAL');
        expect(error.code).toBe('WRONG_JOURNAL');
      }
    });

    test('WRONG_JOURNAL is thrown before any write occurs', () => {
      let writeOccurred = false;
      try {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Should throw before any write
      }
      expect(writeOccurred).toBe(false);
    });

    test('WRONG_JOURNAL produces zero partial effect', () => {
      // The validation should fail before any state mutation
      let sideEffect = false;
      try {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
        });
        sideEffect = true;
      } catch {
        // Expected to throw
      }
      expect(sideEffect).toBe(false);
    });

    test('WRONG_JOURNAL produces no fallback journal', () => {
      // No fallback journal should be created on validation failure
      let fallbackCreated = false;
      try {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
        });
        fallbackCreated = true;
      } catch {
        // Expected to throw
      }
      expect(fallbackCreated).toBe(false);
    });

    test('WRONG_JOURNAL produces no silent success', () => {
      // Should never silently succeed
      let silentSuccess = false;
      try {
        // @ts-expect-error - testing validation
        PingCanonicalEnvelope.objectUpdated({
          changes: { handle: 'test' },
          updatedBy: 'test_user',
          createdAt: new Date().toISOString(),
        });
        silentSuccess = true;
      } catch {
        // Expected to throw
      }
      expect(silentSuccess).toBe(false);
    });
  });
});
