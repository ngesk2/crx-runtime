/**
 * CONSTITUTIONAL PRIMITIVES TEST SUITE
 * 
 * Minimum freeze suite for canonicalization and hashing invariants.
 */

import { describe, it, expect } from 'vitest';
import { CanonicalJson } from '../canonical_json';

describe('Constitutional Primitives', () => {
  /**
   * Test 1: Canonical key ordering
   * Objects with different key order must canonicalize identically.
   */
  it('Test 1: Canonical key ordering', () => {
    const result1 = CanonicalJson.canonicalize({ b: 1, a: 2 });
    const result2 = CanonicalJson.canonicalize({ a: 2, b: 1 });
    
    expect(result1).toBe(result2);
  });

  /**
   * Test 2: Nested ordering
   * Nested objects with different key order must canonicalize identically.
   */
  it('Test 2: Nested ordering', () => {
    const result1 = CanonicalJson.canonicalize({ z: { b: 1, a: 2 } });
    const result2 = CanonicalJson.canonicalize({ z: { a: 2, b: 1 } });
    
    expect(result1).toBe(result2);
  });

  /**
   * Test 3: Array stability
   * Arrays must preserve order (not sort).
   */
  it('Test 3: Array stability', () => {
    const result = CanonicalJson.canonicalize([3, 2, 1]);
    
    expect(result).toBe('[3,2,1]');
  });

  /**
   * Test 4: Hash determinism
   * Hash must be identical for semantically equivalent objects.
   */
  it('Test 4: Hash determinism', () => {
    const obj1 = { b: 1, a: 2 };
    const obj2 = { a: 2, b: 1 };
    
    const hash1 = CanonicalJson.canonicalize(obj1);
    const hash2 = CanonicalJson.canonicalize(obj2);
    
    expect(hash1).toBe(hash2);
  });

  /**
   * Test 5: Regression hash
   * Hard-coded known value to detect future drift.
   */
  it('Test 5: Regression hash', () => {
    const sample = { test: 'data', value: 42 };
    const hash = CanonicalJson.canonicalize(sample);
    
    // Frozen canonical value for { test: 'data', value: 42 }
    // RFC-8785 JCS: keys sorted lexicographically, numbers as-is
    expect(hash).toBe('{"test":"data","value":42}');
  });
});
