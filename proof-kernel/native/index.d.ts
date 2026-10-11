export type ProofOutcome = 'valid' | 'invalid_signature' | 'digest_mismatch' |
  'malformed_input' | 'missing_evidence_reference' | 'evidence_digest_mismatch';
/** Pure test/shadow verifier; does not establish authorization. */
export declare function verifyProof(requestJson: string): ProofOutcome;
export declare function verifyProofV2(requestJson: string): ProofOutcome;
