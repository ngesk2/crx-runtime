/**
 * Evidence
 * Evidence is extracted from Artifacts (factual).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface EvidencePayload {
  evidence_type: string;
  artifact_id: string;
  content: unknown;
  location: Record<string, unknown>;
}

export interface Evidence extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Evidence;
    version: string;
    hash: string;
  };
  payload: EvidencePayload;
}
