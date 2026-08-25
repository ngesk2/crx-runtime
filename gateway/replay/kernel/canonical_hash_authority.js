"use strict";
/**
 * CANONICAL HASH AUTHORITY
 *
 * Pure TypeScript implementation of canonical hash authority.
 * Ported from constitutional-integration-lab/extracted/js_txt/canonical_fingerprint_service.js
 *
 * Requirements:
 * - deterministic canonicalization
 * - stable object ordering
 * - circular reference protection
 * - BigInt rejection
 * - Symbol rejection
 * - Function rejection
 * - NaN normalization
 * - scientific notation normalization
 * - byte-stable hashing
 * - SHA-256 cryptographic hashing
 *
 * CONSTITUTIONAL RULE: Delegates canonicalization to CanonicalJson (sole canonicalization authority)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanonicalHashAuthority = void 0;
const crypto = __importStar(require("crypto"));
const canonical_json_1 = require("./canonical_json");
class CanonicalHashAuthority {
    hashAlgorithm;
    hashVersion;
    canonicalizationVersion;
    constructor(hashAlgorithm = 'sha256', hashVersion = '1.0', canonicalizationVersion = 'v1') {
        this.hashAlgorithm = hashAlgorithm;
        this.hashVersion = hashVersion;
        this.canonicalizationVersion = canonicalizationVersion;
    }
    /**
     * Canonicalize an object to deterministic bytes
     * Constitutional rule: delegates to CanonicalJson (sole canonicalization authority)
     */
    canonicalize(obj) {
        const canonical = canonical_json_1.CanonicalJson.canonicalize(obj);
        const bytes = Buffer.from(canonical, 'utf8').toString('base64url');
        return {
            bytes,
            canonicalization_version: this.canonicalizationVersion
        };
    }
    /**
     * Compute fingerprint of canonical bytes
     */
    computeFingerprint(canonicalBytes) {
        const hash = this.hashBytes(canonicalBytes.bytes);
        return {
            hash,
            hash_algorithm: this.hashAlgorithm,
            hash_version: this.hashVersion
        };
    }
    /**
     * Hash bytes using SHA-256
     */
    hashBytes(bytes) {
        const buffer = Buffer.from(bytes, 'base64url');
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        return `${this.hashAlgorithm}:${hash}`;
    }
}
exports.CanonicalHashAuthority = CanonicalHashAuthority;
