/**
 * PING Identity and Signing
 * PATCH 5: Two Actually Independent Identities
 * 
 * Creates independent identities with signing keys for Alice and Bob
 * Uses real Ed25519 via Node.js crypto module (no external dependency)
 */

import { IdentityAuthority } from './identity-authority';
import { HashAuthority } from './hash-authority';
import * as crypto from 'crypto';

/**
 * PING Identity with signing key
 */
export interface PingIdentity {
  identity_id: string;  // Deterministic: identity_<type_hash16>
  display_name: string;
  public_key: string;  // Ed25519 public key (hex)
  private_key: string;  // Ed25519 private key (hex) - NEVER PERSIST
  created_at: string;
}

/**
 * Real Ed25519 key pair generator using Node.js crypto module
 * Production: uses built-in crypto.generateKeyPairSync with ed25519
 */
export class PingIdentityGenerator {
  /**
   * Generate real Ed25519 key pair using Node.js crypto module
   */
  static generateKeyPair(): { public_key: string; private_key: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    
    return {
      public_key: publicKey.export({ type: 'spki', format: 'der' }).toString('hex'),
      private_key: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('hex')
    };
  }

  /**
   * Sign data with private key using real Ed25519
   */
  static sign(data: string, privateKeyHex: string): string {
    const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
    const privateKey = crypto.createPrivateKey({
      key: privateKeyBuffer,
      format: 'der',
      type: 'pkcs8'
    });
    
    const dataBuffer = Buffer.from(data, 'utf8');
    const signature = crypto.sign(null, dataBuffer, privateKey);
    
    return signature.toString('hex');
  }

  /**
   * Verify signature with public key using real Ed25519
   */
  static verify(data: string, signatureHex: string, publicKeyHex: string): boolean {
    try {
      const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
      const publicKey = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki'
      });
      
      const dataBuffer = Buffer.from(data, 'utf8');
      const signatureBuffer = Buffer.from(signatureHex, 'hex');
      
      return crypto.verify(null, dataBuffer, publicKey, signatureBuffer);
    } catch (error) {
      return false;
    }
  }
}

/**
 * PING Identity Manager
 */
export class PingIdentityManager {
  /**
   * Create a new PING identity
   */
  static createIdentity(displayName: string): PingIdentity {
    const identityId = IdentityAuthority.generateId('identity', { display_name: displayName });
    const keyPair = PingIdentityGenerator.generateKeyPair();
    const createdAt = new Date().toISOString();

    return {
      identity_id: identityId,
      display_name: displayName,
      public_key: keyPair.public_key,
      private_key: keyPair.private_key,
      created_at: createdAt
    };
  }

  /**
   * Sign data as identity
   */
  static sign(identity: PingIdentity, data: string): string {
    return PingIdentityGenerator.sign(data, identity.private_key);
  }

  /**
   * Verify signature from identity
   */
  static verify(identity: PingIdentity, data: string, signature: string): boolean {
    return PingIdentityGenerator.verify(data, signature, identity.public_key);
  }

  /**
   * Verify signature with public key directly (independent verification)
   */
  static verifyWithPublicKey(data: string, signature: string, publicKey: string): boolean {
    return PingIdentityGenerator.verify(data, signature, publicKey);
  }

  /**
   * Create proof structure for transition
   */
  static createProof(identity: PingIdentity, data: string): {
    verification_method: string;
    signature: string;
    public_key: string;
  } {
    const signature = this.sign(identity, data);
    return {
      verification_method: 'ed25519',
      signature,
      public_key: identity.public_key
    };
  }
}
