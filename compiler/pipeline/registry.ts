/**
 * Stage Registry
 * Registry of all available compiler stages.
 */

import { CanonicalObject } from '../../runtime/canonical/canonical-object';
import { Stage } from './stage';
import { PipelineExecutor } from './executor';

export class StageRegistry {
  private executor: PipelineExecutor;
  
  constructor() {
    this.executor = new PipelineExecutor();
  }
  
  registerStage(stage: Stage<CanonicalObject, CanonicalObject>): void {
    this.executor.registerStage(stage);
  }
  
  getExecutor(): PipelineExecutor {
    return this.executor;
  }
  
  getStage(name: string): Stage<CanonicalObject, CanonicalObject> | undefined {
    return this.executor.getStage(name);
  }
  
  listStages(): string[] {
    return this.executor.listStages();
  }
}
