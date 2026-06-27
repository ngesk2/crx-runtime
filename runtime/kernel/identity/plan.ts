/**
 * Plan
 * Plans consume Knowledge, Capabilities, Policies, Goals (executable intent).
 */

import { CanonicalObject, CanonicalObjectKind } from './canonical-object';
import { CanonicalID } from './canonical-id';

export interface PlanPayload {
  knowledge_ids: string[];
  capability_ids: string[];
  policy_ids: string[];
  goal_id: string;
  steps: Array<{
    step_id: string;
    action: string;
    inputs: string[];
    outputs: string[];
  }>;
  worker_assignments: Array<{
    worker_id: string;
    step_id: string;
  }>;
}

export interface Plan extends CanonicalObject {
  identity: {
    id: CanonicalID;
    authority: string;
    namespace: string;
    kind: CanonicalObjectKind.Plan;
    version: string;
    hash: string;
  };
  payload: PlanPayload;
}
