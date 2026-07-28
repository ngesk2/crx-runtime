/**
 * Source
 * Represents where information originates (long-lived).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface SourcePayload {
  source_type: string;
  location: string;
  configuration: Record<string, unknown>;
}

export interface Source extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Source;
    version: string;
    hash: string;
  };
  payload: SourcePayload;
}
