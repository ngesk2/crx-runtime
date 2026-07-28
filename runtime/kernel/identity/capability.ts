/**
 * Capability
 * Capability is compiled from Knowledge (abstract, not code).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface CapabilityPayload {
  capability_type: string;
  knowledge_ids: string[];
  requirements: string[];
  dependencies: string[];
}

export interface Capability extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Capability;
    version: string;
    hash: string;
  };
  payload: CapabilityPayload;
}
