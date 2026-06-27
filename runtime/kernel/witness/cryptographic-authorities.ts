/**
 * Cryptographic Authorities
 * Separates Witness Builder, Hash Authority, Merkle Authority, Signing Authority, Certificate Authority.
 */

import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

/**
 * Hash Authority
 * Computes canonical hashes using SHA256/BLAKE3.
 * Hashes are for integrity, UUIDs are for identities - separate authorities.
 */
export class HashAuthority {
  /**
   * Compute SHA256 hash (placeholder - use crypto library in production)
   */
  computeSHA256(data: unknown): string {
    const serialized = JSON.stringify(data);
    // Placeholder for actual SHA256 implementation
    // In production, use crypto.createHash('sha256').update(serialized).digest('hex')
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
  
  /**
   * Compute BLAKE3 hash (placeholder - use blake3 library in production)
   */
  computeBLAKE3(data: unknown): string {
    const serialized = JSON.stringify(data);
    // Placeholder for actual BLAKE3 implementation
    // In production, use blake3 library
    let hash = 0;
    for (let i = 0; i < serialized.length; i++) {
      const char = serialized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
  
  /**
   * Compute hash from bytes
   */
  computeHashFromBytes(bytes: Uint8Array, algorithm: 'sha256' | 'blake3' = 'sha256'): string {
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    if (algorithm === 'sha256') {
      return this.computeSHA256(hex);
    }
    return this.computeBLAKE3(hex);
  }
}

/**
 * Merkle Authority
 * Computes Merkle trees using H(H(left) || H(right))
 */
export class MerkleAuthority {
  private hashAuthority: HashAuthority;
  
  constructor(hashAuthority: HashAuthority) {
    this.hashAuthority = hashAuthority;
  }
  
  computeMerkleRoot(hashes: string[]): string {
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    let currentLevel = hashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push(this.hashPair(left, right));
      }
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }
  
  private hashPair(left: string, right: string): string {
    // H(H(left) || H(right))
    const leftHash = this.hashAuthority.computeSHA256(left);
    const rightHash = this.hashAuthority.computeSHA256(right);
    const combined = `${leftHash}:${rightHash}`;
    return this.hashAuthority.computeSHA256(combined);
  }
  
  computeMerkleProof(hashes: string[], index: number): string[] {
    const proof: string[] = [];
    let currentLevel = hashes;
    let currentIndex = index;
    
    while (currentLevel.length > 1) {
      const isLeft = currentIndex % 2 === 0;
      const siblingIndex = isLeft ? currentIndex + 1 : currentIndex - 1;
      
      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
      currentLevel = this.computeNextLevel(currentLevel);
    }
    
    return proof;
  }
  
  private computeNextLevel(hashes: string[]): string[] {
    const nextLevel: string[] = [];
    for (let i = 0; i < hashes.length; i += 2) {
      const left = hashes[i];
      const right = hashes[i + 1] || left;
      nextLevel.push(this.hashPair(left, right));
    }
    return nextLevel;
  }
}

/**
 * Signing Authority
 * Signs data using Ed25519 (or future HSM/TPM/PKI)
 */
export class SigningAuthority {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  /**
   * Sign data (placeholder for Ed25519)
   */
  sign(data: string): string {
    // Placeholder for actual Ed25519 signature
    const signature = this.identityService.generateUUIDv5('signature', data);
    return `ed25519_${signature}`;
  }
  
  /**
   * Verify signature (placeholder)
   */
  verify(data: string, signature: string): boolean {
    // Placeholder for actual Ed25519 verification
    return signature.startsWith('ed25519_');
  }
  
  /**
   * Generate key pair (placeholder for Ed25519)
   * Uses canonical timestamp instead of Date.now()
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyId = this.identityService.generateUUIDv5('keypair', this.clock.now());
    return {
      publicKey: `pub_${keyId}`,
      privateKey: `priv_${keyId}`,
    };
  }
}

/**
 * Certificate Authority
 * Issues and manages certificates
 * Certificate issuance time must be replay time, not runtime time.
 */
export class CertificateAuthority {
  private identityService = CanonicalIdentityService.getInstance();
  private signingAuthority: SigningAuthority;
  
  constructor(signingAuthority: SigningAuthority) {
    this.signingAuthority = signingAuthority;
  }
  
  /**
   * Issue certificate
   * canonicalTimestamp must come from CanonicalClock, not runtime
   */
  issueCertificate(
    knowledgeId: string,
    witnessId: string,
    merkleRoot: string,
    canonicalTimestamp: string
  ): string {
    const certificateId = this.identityService.generateCertificateId(knowledgeId, witnessId);
    const data = JSON.stringify({ certificateId, knowledgeId, witnessId, merkleRoot });
    const signature = this.signingAuthority.sign(data);
    
    return JSON.stringify({
      certificateId,
      knowledgeId,
      witnessId,
      merkleRoot,
      signature,
      issuedAt: canonicalTimestamp,
    });
  }
  
  /**
   * Verify certificate
   */
  verifyCertificate(certificate: string): boolean {
    try {
      const cert = JSON.parse(certificate);
      const data = JSON.stringify({
        certificateId: cert.certificateId,
        knowledgeId: cert.knowledgeId,
        witnessId: cert.witnessId,
        merkleRoot: cert.merkleRoot,
      });
      return this.signingAuthority.verify(data, cert.signature);
    } catch {
      return false;
    }
  }
}

/**
 * Witness Builder
 * Combines all authorities to build witnesses
 */
export class WitnessBuilder {
  private hashAuthority: HashAuthority;
  private merkleAuthority: MerkleAuthority;
  private signingAuthority: SigningAuthority;
  private certificateAuthority: CertificateAuthority;
  
  constructor() {
    this.hashAuthority = new HashAuthority();
    this.merkleAuthority = new MerkleAuthority(this.hashAuthority);
    this.signingAuthority = new SigningAuthority();
    this.certificateAuthority = new CertificateAuthority(this.signingAuthority);
  }
  
  /**
   * Build witness from transcript
   */
  buildWitness(transcriptId: string, hashes: string[]): {
    witnessId: string;
    merkleRoot: string;
    signature: string;
  } {
    const merkleRoot = this.merkleAuthority.computeMerkleRoot(hashes);
    const signature = this.signingAuthority.sign(merkleRoot);
    const witnessId = CanonicalIdentityService.getInstance().generateWitnessId(transcriptId);
    
    return {
      witnessId,
      merkleRoot,
      signature,
    };
  }
  
  /**
   * Build certificate
   * canonicalTimestamp must come from CanonicalClock
   */
  buildCertificate(
    knowledgeId: string,
    witnessId: string,
    merkleRoot: string,
    canonicalTimestamp: string
  ): string {
    return this.certificateAuthority.issueCertificate(knowledgeId, witnessId, merkleRoot, canonicalTimestamp);
  }
  
  /**
   * Verify witness
   */
  verifyWitness(hashes: string[], merkleRoot: string, signature: string): boolean {
    const computedRoot = this.merkleAuthority.computeMerkleRoot(hashes);
    if (computedRoot !== merkleRoot) return false;
    return this.signingAuthority.verify(merkleRoot, signature);
  }
}
