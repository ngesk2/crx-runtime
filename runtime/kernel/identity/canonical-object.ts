/**
 * Canonical Object
 * Base class for all canonical objects.
 * Decomposed into identity, metadata, provenance, lifecycle, and payload.
 */

import { CanonicalIdentity } from './canonical-identity';
import { CanonicalMetadata } from './canonical-metadata';
import { CanonicalProvenance } from './canonical-provenance';
import { CanonicalLifecycle } from './canonical-lifecycle';

export interface CanonicalObject {
  identity: CanonicalIdentity;
  metadata: CanonicalMetadata;
  provenance: CanonicalProvenance;
  lifecycle: CanonicalLifecycle;
  payload: unknown;
}

export enum CanonicalObjectKind {
  Source = 'source',
  Artifact = 'artifact',
  Evidence = 'evidence',
  Fact = 'fact',
  Relationship = 'relationship',
  Knowledge = 'knowledge',
  Assessment = 'assessment',
  Capability = 'capability',
  Plan = 'plan',
  Projection = 'projection',
  Certificate = 'certificate',
}
