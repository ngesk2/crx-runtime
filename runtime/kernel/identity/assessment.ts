/**
 * Assessment
 * Assessment never mutates Knowledge (mutable, contains subjective fields).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface AssessmentPayload {
  knowledge_id: string;
  confidence: number;
  trust: number;
  freshness: number;
  risk: number;
  priority: number;
  quality: number;
  complexity: number;
  security: number;
  coverage: number;
}

export interface Assessment extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Assessment;
    version: string;
    hash: string;
  };
  payload: AssessmentPayload;
}
