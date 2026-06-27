/**
 * Canonical Identity
 * Part of CanonicalObject decomposition.
 */

import { CanonicalID } from './canonical-id';

export interface CanonicalIdentity {
  id: CanonicalID;
  authority: string;
  namespace: string;
  kind: string;
  version: string;
  hash: string;
}
