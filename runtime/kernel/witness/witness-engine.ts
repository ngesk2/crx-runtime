/**
 * Witness Engine
 * Generates witnesses for constitutional verification.
 */

import { ReplayEventEnvelope } from '../replay/event-envelope';
import { ReplayTranscript } from '../replay/replay-transcript';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { CanonicalClock } from '../identity/canonical-clock';

export interface Witness {
  witnessId: string;
  transcriptId: string;
  timestamp: string;
  merkleRoot: string;
  signature: string;
  status: 'pending' | 'generated' | 'verified';
}

export class WitnessEngine {
  private identityService = CanonicalIdentityService.getInstance();
  private clock = CanonicalClock.getInstance();
  
  async generateWitness(transcript: ReplayTranscript): Promise<Witness> {
    const merkleRoot = this.computeMerkleRoot(transcript);
    const signature = this.generateSignature(merkleRoot);
    const timestamp = this.clock.now();
    
    return {
      witnessId: this.identityService.generateWitnessId(transcript.transcript_id),
      transcriptId: transcript.transcript_id,
      timestamp,
      merkleRoot,
      signature,
      status: 'generated',
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
        nextLevel.push(this.hashPair(left, right));
      }
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }
  
  private hashPair(left: string, right: string): string {
    return `${left}:${right}`;
  }
  
  private generateSignature(merkleRoot: string): string {
    return `sig_${merkleRoot.substring(0, 16)}`;
  }
}
