/**
 * Knowledge
 * Knowledge is compiled from Facts (immutable, zero subjective fields).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface KnowledgePayload {
  derived_facts: string[];
  supporting_evidence: string[];
  relationships: string[];
  lineage: Array<{
    stage: string;
    input_id: string;
    output_id: string;
    timestamp: string;
  }>;
  authority: string;
  replay_proof: {
    replay_id: string;
    replay_timestamp: string;
    replay_hash: string;
    verification_status: string;
  };
  constitution_version: string;
  schema_version: string;
}

export interface Knowledge extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Knowledge;
    version: string;
    hash: string;
  };
  payload: KnowledgePayload;
}
