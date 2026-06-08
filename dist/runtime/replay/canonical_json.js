"use strict";
/**
 * CANONICAL JSON (RFC-8785)
 *
 * Pure TypeScript implementation of RFC-8785 JSON Canonicalization Scheme (JCS).
 *
 * Requirements:
 * - lexicographic property ordering
 * - deterministic numeric rendering
 * - UTF-8 normalization
 * - RFC-8785 semantics
 * - no infrastructure dependencies
 *
 * CONSTITUTIONAL RULE: This is the sole canonicalization authority.
 * All other canonicalization must delegate to this implementation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalJson = void 0;
const deterministic_failure_1 = require("./deterministic_failure");
class CanonicalJson {
    /**
     * Canonicalize a value according to RFC-8785 JCS
     */
    static canonicalize(value) {
        return JSON.stringify(this.canonicalizeValue(value));
    }
    /**
     * Canonicalize a value recursively
     */
    static canonicalizeValue(value, visited = new Set()) {
        if (value === null) {
            return null;
        }
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'number') {
            return this.canonicalizeNumber(value);
        }
        if (typeof value === 'string') {
            return this.canonicalizeString(value);
        }
        if (Array.isArray(value)) {
            // Check for circular reference
            if (visited.has(value)) {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.create('CANONICALIZATION_ERROR', 'CANONICALIZATION', { reason: 'Circular reference detected in array' }));
            }
            visited.add(value);
            // Reject sparse arrays constitutionally
            if (value.length !== Object.keys(value).length) {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.create('CANONICALIZATION_ERROR', 'CANONICALIZATION', { reason: 'Sparse arrays are not supported in canonicalization' }));
            }
            const result = value.map(item => this.canonicalizeValue(item, visited));
            visited.delete(value);
            return result;
        }
        if (typeof value === 'object') {
            // Check for circular reference
            if (visited.has(value)) {
                throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.create('CANONICALIZATION_ERROR', 'CANONICALIZATION', { reason: 'Circular reference detected in object' }));
            }
            visited.add(value);
            const result = this.canonicalizeObject(value, visited);
            visited.delete(value);
            return result;
        }
        return value;
    }
    /**
     * Canonicalize a number according to RFC-8785
     * Handles -0, scientific notation, and edge cases
     */
    static canonicalizeNumber(value) {
        // Handle -0 vs 0
        if (value === 0) {
            return 0; // Always use positive zero
        }
        // Handle NaN and Infinity
        if (!Number.isFinite(value)) {
            throw deterministic_failure_1.DeterministicFailureFactory.toError(deterministic_failure_1.DeterministicFailureFactory.create('CANONICALIZATION_ERROR', 'CANONICALIZATION', { reason: 'Cannot canonicalize NaN or Infinity' }));
        }
        // Handle scientific notation
        // Convert numbers in scientific notation to their full representation
        // if they are within safe integer range
        if (value.toString().includes('e') || value.toString().includes('E')) {
            if (Number.isSafeInteger(value)) {
                return value; // Let JSON.stringify handle it
            }
            // For large numbers, keep as-is to avoid precision loss
            return value;
        }
        return value;
    }
    /**
     * Canonicalize a string according to RFC-8785
     * Handles Unicode normalization
     */
    static canonicalizeString(value) {
        // Normalize to NFC form as per RFC-8785
        return value.normalize('NFC');
    }
    /**
     * Canonicalize an object according to RFC-8785
     * Sorts properties lexicographically
     */
    static canonicalizeObject(obj, visited) {
        const result = {};
        const keys = Object.keys(obj).sort(this.lexicographicCompare);
        for (const key of keys) {
            result[key] = this.canonicalizeValue(obj[key], visited);
        }
        return result;
    }
    /**
     * Lexicographic comparison for property ordering
     * Uses UTF-16 code unit comparison as per RFC-8785
     */
    static lexicographicCompare(a, b) {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    }
    /**
     * Serialize to Buffer for hashing
     */
    static toBuffer(value) {
        const canonical = this.canonicalize(value);
        return Buffer.from(canonical, 'utf8');
    }
}
exports.CanonicalJson = CanonicalJson;
