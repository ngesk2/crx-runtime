/**
 * Replay Event Envelope
 * Deterministic replay envelope for constitutional events.
 */

import { CanonicalObject } from '../identity/canonical-object';
import { CanonicalIdentityService } from '../identity/canonical-identity-service';
import { IReplayAuthority } from './replay-authority-interface';

export interface ReplayEventEnvelope {
  envelope_id: string;
  timestamp: string;
  stage: string;
  input_id: string;
  output_id: string;
  input_family: string;
  output_family: string;
  replay_metadata: ReplayMetadata;
  witness_metadata: WitnessMetadata;
}

export interface ReplayMetadata {
  replay_id: string;
  replay_timestamp: string;
  replay_hash: string;
  replay_state: string;
  verification_status: string;
}

export interface WitnessMetadata {
  witness_id: string;
  witness_timestamp: string;
  witness_hash: string;
  witness_root: string;
  signature: string;
}

export class ReplayEventEnvelopeBuilder {
  private identityService = CanonicalIdentityService.getInstance();
  private replayAuthority: IReplayAuthority;
  
  constructor(replayAuthority: IReplayAuthority) {
    this.replayAuthority = replayAuthority;
  }
  
  buildEnvelope(
    envelope_id: string,
    stage: string,
    input: CanonicalObject,
    output: CanonicalObject,
    canonicalTimestamp: string
  ): ReplayEventEnvelope {
    const transcriptId = this.identityService.generateUUIDv5('transcript', envelope_id);
    const replayMetadata = this.replayAuthority.generateReplayMetadata(
      stage,
      this.computeHash(output),
      transcriptId,
      canonicalTimestamp
    );
    
    return {
      envelope_id,
      timestamp: canonicalTimestamp,
      stage,
      input_id: output.identity.id.hash,
      output_id: output.identity.id.hash,
      input_family: input.identity.kind,
      output_family: output.identity.kind,
      replay_metadata: {
        replay_id: replayMetadata.replayId,
        replay_timestamp: replayMetadata.timestamp,
        replay_hash: replayMetadata.replayHash,
        replay_state: replayMetadata.state,
        verification_status: 'pending',
      },
      witness_metadata: {
        witness_id: this.identityService.generateWitnessId(transcriptId),
        witness_timestamp: canonicalTimestamp,
        witness_hash: this.computeHash(output),
        witness_root: this.computeMerkleRoot(output),
        signature: '',
      },
    };
  }
  
  private computeHash(object: CanonicalObject): string {
    return JSON.stringify(object.identity.id.hash);
  }
  
  private computeMerkleRoot(object: CanonicalObject): string {
    return `merkle_${object.identity.id.hash.substring(0, 16)}`;
  }
}
