/**
 * Identity Authority Characterization Tests
 * 
 * Tests to prove existing ID behavior is preserved after convergence
 */

import { IdentityAuthority } from './identity-authority';

describe('IdentityAuthority Characterization', () => {
  describe('generateDeterministicId', () => {
    it('should return same ID for same input', () => {
      const id1 = IdentityAuthority.generateDeterministicId('test', 'context1');
      const id2 = IdentityAuthority.generateDeterministicId('test', 'context1');
      
      expect(id1.hash).toBe(id2.hash);
      expect(id1.namespace).toBe('test');
      expect(id1.kind).toBe('deterministic');
    });

    it('should return different ID for different input', () => {
      const id1 = IdentityAuthority.generateDeterministicId('test', 'context1');
      const id2 = IdentityAuthority.generateDeterministicId('test', 'context2');
      
      expect(id1.hash).not.toBe(id2.hash);
    });

    it('should preserve namespace', () => {
      const id = IdentityAuthority.generateDeterministicId('my-namespace', 'context');
      
      expect(id.namespace).toBe('my-namespace');
    });
  });

  describe('generateId (compatibility method)', () => {
    it('should return {type}_{hash16} format for legacy compatibility', () => {
      const id = IdentityAuthority.generateId('artifact', { data: 'test' });
      
      expect(id).toMatch(/^[a-z_]+_[a-f0-9]{16}$/);
    });

    it('should preserve type prefix', () => {
      const id = IdentityAuthority.generateId('evidence', { data: 'test' });
      
      expect(id).toMatch(/^evidence_/);
    });

    it('should return different IDs for different types', () => {
      const id1 = IdentityAuthority.generateId('evidence', { data: 'test' });
      const id2 = IdentityAuthority.generateId('artifact', { data: 'test' });
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('generate_deterministic_id (compatibility alias)', () => {
    it('should alias to generateDeterministicId', () => {
      const id1 = IdentityAuthority.generateDeterministicId('test', 'context');
      const id2 = IdentityAuthority.generate_deterministic_id('test', 'context');
      
      expect(id1.hash).toBe(id2.hash);
    });
  });

  describe('generateFromCanonicalHash', () => {
    it('should generate ID from canonical bytes', () => {
      const bytes = Buffer.from('test data');
      const id = IdentityAuthority.generateFromCanonicalHash(bytes, 'test');
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  describe('generateEventId', () => {
    it('should generate event ID from event type and aggregate ID', () => {
      const id = IdentityAuthority.generateEventId('EVIDENCE_ACQUIRED', 'aggregate-123');
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id.length).toBe(64); // SHA-256 hex
    });
  });

  describe('getVersion', () => {
    it('should return constitutional version', () => {
      const version = IdentityAuthority.getVersion();
      
      expect(version).toBe('1.0.0');
    });
  });
});
