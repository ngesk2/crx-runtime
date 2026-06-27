/**
 * Relationship
 * Relationship is also factual.
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface RelationshipPayload {
  relationship_type: string;
  source: string;
  target: string;
  properties: Record<string, unknown>;
}

export interface Relationship extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Relationship;
    version: string;
    hash: string;
  };
  payload: RelationshipPayload;
}
