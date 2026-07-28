/**
 * Stage Interface
 * Defines the contract for all compiler stages.
 */

import { CanonicalObject } from '../../runtime/canonical/canonical-object';
import { StageContract } from './contracts';

export interface Stage<Input extends CanonicalObject, Output extends CanonicalObject> {
  name: string;
  inputKind: string;
  outputKind: string;
  contract: StageContract;
  
  execute(input: Input): Promise<Output>;
  
  validateInput(input: CanonicalObject): boolean;
  validateOutput(output: CanonicalObject): boolean;
  
  purity: boolean;
  determinism: boolean;
  replayable: boolean;
  locality: boolean;
  completeness: boolean;
}

export interface StageConfig {
  name: string;
  inputKind: string;
  outputKind: string;
  purity: boolean;
  determinism: boolean;
  replayable: boolean;
  locality: boolean;
  completeness: boolean;
}
