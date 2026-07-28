/**
 * Certificate
 * Replay, Witness, Verification, Signature, Audit all become Certificates.
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface CertificatePayload {
  certificate_type: string;
  knowledge_id: string;
  certificate_data: {
    replay_id?: string;
    witness_id?: string;
    verification_id?: string;
    signature_id?: string;
    audit_id?: string;
    timestamp: string;
    hash: string;
    status: string;
  };
}

export interface Certificate extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Certificate;
    version: string;
    hash: string;
  };
  payload: CertificatePayload;
}
