/**
 * Witness Authority Interface
 * Public interface for witness subsystem.
 * Only this interface crosses subsystem boundaries.
 */

export interface IWitnessAuthority {
  generateWitness(transcriptId: string, hashes: string[]): Witness;
  generateCertificate(knowledgeId: string, witnessId: string, merkleRoot: string, canonicalTimestamp: string): string;
  verifyWitness(hashes: string[], merkleRoot: string, signature: string): boolean;
  verifyCertificate(certificate: string): boolean;
}

export interface Witness {
  witnessId: string;
  transcriptId: string;
  timestamp: string;
  merkleRoot: string;
  signature: string;
  status: 'pending' | 'generated' | 'verified';
}
