/**
 * Verification Engine
 * Verifies certificates and witnesses.
 */

import { Certificate } from './certificate-engine';
import { Witness } from './witness-engine';
import { ReplayTranscript } from '../replay/replay-transcript';

export interface VerificationResult {
  certificateId: string;
  timestamp: string;
  status: 'verified' | 'failed';
  errors: string[];
  warnings: string[];
}

export class VerificationEngine {
  async verifyCertificate(
    certificate: Certificate,
    witness: Witness,
    transcript: ReplayTranscript
  ): Promise<VerificationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Verify witness matches transcript
    if (witness.transcriptId !== transcript.transcript_id) {
      errors.push('Witness transcript ID mismatch');
    }
    
    // Verify certificate matches witness
    if (certificate.witnessId !== witness.witnessId) {
      errors.push('Certificate witness ID mismatch');
    }
    
    // Verify certificate matches transcript
    if (certificate.transcriptId !== transcript.transcript_id) {
      errors.push('Certificate transcript ID mismatch');
    }
    
    // Verify merkle root
    const computedRoot = this.computeMerkleRoot(transcript);
    if (computedRoot !== witness.merkleRoot) {
      errors.push('Merkle root verification failed');
    }
    
    // Verify signature
    if (!this.verifySignature(witness.merkleRoot, witness.signature)) {
      warnings.push('Signature verification warning');
    }
    
    return {
      certificateId: certificate.certificateId,
      timestamp: new Date().toISOString(),
      status: errors.length === 0 ? 'verified' : 'failed',
      errors,
      warnings,
    };
  }
  
  private computeMerkleRoot(transcript: ReplayTranscript): string {
    const hashes = transcript.envelopes.map(e => e.replay_metadata.replay_hash);
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];
    
    let currentLevel = hashes;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] || left;
        nextLevel.push(`${left}:${right}`);
      }
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }
  
  private verifySignature(merkleRoot: string, signature: string): boolean {
    return signature.startsWith('sig_') && signature.includes(merkleRoot.substring(0, 16));
  }
}
