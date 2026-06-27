/**
 * Fact
 * Facts are extracted from Evidence (immutable).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface FactPayload {
  fact_type: string;
  subject: string;
  predicate: string;
  object: string;
  evidence_ids: string[];
}

export interface Fact extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Fact;
    version: string;
    hash: string;
  };
  payload: FactPayload;
}
