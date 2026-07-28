/**
 * Artifact
 * Immutable representation of acquired information (snapshot).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface ArtifactPayload {
  artifact_type: string;
  content: string;
  content_hash: string;
  size: number;
  format: string;
  source_id: string;
}

export interface Artifact extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Artifact;
    version: string;
    hash: string;
  };
  payload: ArtifactPayload;
}
