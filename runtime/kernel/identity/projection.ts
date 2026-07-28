/**
 * Projection
 * Projection is always reproducible (Knowledge + Relationship).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface ProjectionPayload {
  projection_type: string;
  knowledge_ids: string[];
  relationship_ids: string[];
  projection_data: unknown;
}

export interface Projection extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Projection;
    version: string;
    hash: string;
  };
  payload: ProjectionPayload;
}
