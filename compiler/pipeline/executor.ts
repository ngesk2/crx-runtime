/**
 * Pipeline Executor
 * Executes the compiler pipeline stages in order.
 */

import { CanonicalObject } from '../../runtime/canonical/canonical-object';
import { Stage } from './stage';
import { ReplayEventEnvelopeBuilder } from '../../runtime/replay/event-envelope';
import { ReplayTranscriptBuilder } from '../../runtime/replay/replay-transcript';
import { InMemoryEventStore } from '../../runtime/replay/event-store';

export class PipelineExecutor {
  private stages: Map<string, Stage<CanonicalObject, CanonicalObject>> = new Map();
  private envelopeBuilder: ReplayEventEnvelopeBuilder;
  private transcriptBuilder: ReplayTranscriptBuilder;
  private eventStore: InMemoryEventStore;
  private transcript: ReplayTranscriptBuilder | null = null;
  
  constructor() {
    this.envelopeBuilder = new ReplayEventEnvelopeBuilder();
    this.transcriptBuilder = new ReplayTranscriptBuilder();
    this.eventStore = new InMemoryEventStore();
  }
  
  registerStage(stage: Stage<CanonicalObject, CanonicalObject>): void {
    this.stages.set(stage.name, stage);
  }
  
  getStage(name: string): Stage<CanonicalObject, CanonicalObject> | undefined {
    return this.stages.get(name);
  }
  
  async executePipeline(input: CanonicalObject, stageNames: string[]): Promise<CanonicalObject> {
    this.transcript = new ReplayTranscriptBuilder();
    let current: CanonicalObject = input;
    
    for (const stageName of stageNames) {
      current = await this.executeStageConstitutional(stageName, current);
    }
    
    return current;
  }
  
  async executeStage(stageName: string, input: CanonicalObject): Promise<CanonicalObject> {
    return await this.executeStageConstitutional(stageName, input);
  }
  
  private async executeStageConstitutional(stageName: string, input: CanonicalObject): Promise<CanonicalObject> {
    const stage = this.stages.get(stageName);
    if (!stage) {
      throw new Error(`Stage not found: ${stageName}`);
    }
    
    // Validate input family
    if (!stage.validateInput(input)) {
      throw new Error(`Input validation failed for stage: ${stageName}`);
    }
    
    // Execute stage
    const output = await stage.execute(input);
    
    // Validate output family
    if (!stage.validateOutput(output)) {
      throw new Error(`Output validation failed for stage: ${stageName}`);
    }
    
    // Emit replay event envelope
    const envelope = this.envelopeBuilder.buildEnvelope(
      `envelope_${Date.now()}`,
      stageName,
      input,
      output,
      new Date().toISOString()
    );
    
    await this.eventStore.storeEnvelope(envelope);
    
    // Add to transcript
    if (this.transcript) {
      this.transcript.addEnvelope(envelope);
    }
    
    return output;
  }
  
  getTranscript(): ReplayTranscriptBuilder | null {
    return this.transcript;
  }
  
  listStages(): string[] {
    return Array.from(this.stages.keys());
  }
}
