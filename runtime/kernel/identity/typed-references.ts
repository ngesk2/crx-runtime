/**
 * Typed References
 * Central location for all typed reference types.
 * Prevents mixing of different ID types at compile time.
 */

// Canonical Object References
export type SourceReference = string & { readonly __brand: unique symbol };
export type ArtifactReference = string & { readonly __brand: unique symbol };
export type EvidenceReference = string & { readonly __brand: unique symbol };
export type KnowledgeReference = string & { readonly __brand: unique symbol };
export type AssessmentReference = string & { readonly __brand: unique symbol };
export type PlanReference = string & { readonly __brand: unique symbol };
export type ProjectionReference = string & { readonly __brand: unique symbol };
export type CertificateReference = string & { readonly __brand: unique symbol };

// CIR References
export type EntityReference = string & { readonly __brand: unique symbol };
export type FactReference = string & { readonly __brand: unique symbol };
export type RelationshipReference = string & { readonly __brand: unique symbol };
export type PropertyReference = string & { readonly __brand: unique symbol };
export type ObservationReference = string & { readonly __brand: unique symbol };
export type ConstraintReference = string & { readonly __brand: unique symbol };
export type BehaviorReference = string & { readonly __brand: unique symbol };
export type InterfaceReference = string & { readonly __brand: unique symbol };
export type AuthorityReference = string & { readonly __brand: unique symbol };
export type DecisionReference = string & { readonly __brand: unique symbol };
export type PolicyReference = string & { readonly __brand: unique symbol };
export type EventReference = string & { readonly __brand: unique symbol };

// Runtime References
export type CapabilityReference = string & { readonly __brand: unique symbol };
export type WorkerReference = string & { readonly __brand: unique symbol };
export type LeaseReference = string & { readonly __brand: unique symbol };
export type ContextReference = string & { readonly __brand: unique symbol };
export type WitnessReference = string & { readonly __brand: unique symbol };
export type SpanReference = string & { readonly __brand: unique symbol };
export type AuditReference = string & { readonly __brand: unique symbol };

// Mission References
export type ProgramReference = string & { readonly __brand: unique symbol };
export type EpicReference = string & { readonly __brand: unique symbol };
export type MissionReference = string & { readonly __brand: unique symbol };
export type TaskReference = string & { readonly __brand: unique symbol };

// Provider References
export type ProviderReference = string & { readonly __brand: unique symbol };
export type ModelReference = string & { readonly __brand: unique symbol };
export type MCPReference = string & { readonly __brand: unique symbol };

// Runtime Identity References
export type ExecutionReference = string & { readonly __brand: unique symbol };
export type ReplayReference = string & { readonly __brand: unique symbol };
export type TranscriptReference = string & { readonly __brand: unique symbol };
export type CheckpointReference = string & { readonly __brand: unique symbol };
export type EnvelopeReference = string & { readonly __brand: unique symbol };

/**
 * Reference builder for creating typed references from strings
 */
export class ReferenceBuilder {
  static buildSourceReference(id: string): SourceReference {
    return id as SourceReference;
  }
  
  static buildArtifactReference(id: string): ArtifactReference {
    return id as ArtifactReference;
  }
  
  static buildEvidenceReference(id: string): EvidenceReference {
    return id as EvidenceReference;
  }
  
  static buildKnowledgeReference(id: string): KnowledgeReference {
    return id as KnowledgeReference;
  }
  
  static buildAssessmentReference(id: string): AssessmentReference {
    return id as AssessmentReference;
  }
  
  static buildPlanReference(id: string): PlanReference {
    return id as PlanReference;
  }
  
  static buildProjectionReference(id: string): ProjectionReference {
    return id as ProjectionReference;
  }
  
  static buildCertificateReference(id: string): CertificateReference {
    return id as CertificateReference;
  }
  
  static buildEntityReference(id: string): EntityReference {
    return id as EntityReference;
  }
  
  static buildFactReference(id: string): FactReference {
    return id as FactReference;
  }
  
  static buildRelationshipReference(id: string): RelationshipReference {
    return id as RelationshipReference;
  }
  
  static buildCapabilityReference(id: string): CapabilityReference {
    return id as CapabilityReference;
  }
  
  static buildWorkerReference(id: string): WorkerReference {
    return id as WorkerReference;
  }
  
  static buildLeaseReference(id: string): LeaseReference {
    return id as LeaseReference;
  }
  
  static buildContextReference(id: string): ContextReference {
    return id as ContextReference;
  }
  
  static buildWitnessReference(id: string): WitnessReference {
    return id as WitnessReference;
  }
  
  static buildSpanReference(id: string): SpanReference {
    return id as SpanReference;
  }
  
  static buildAuditReference(id: string): AuditReference {
    return id as AuditReference;
  }
  
  static buildProgramReference(id: string): ProgramReference {
    return id as ProgramReference;
  }
  
  static buildEpicReference(id: string): EpicReference {
    return id as EpicReference;
  }
  
  static buildMissionReference(id: string): MissionReference {
    return id as MissionReference;
  }
  
  static buildTaskReference(id: string): TaskReference {
    return id as TaskReference;
  }
  
  static buildPolicyReference(id: string): PolicyReference {
    return id as PolicyReference;
  }
  
  static buildProviderReference(id: string): ProviderReference {
    return id as ProviderReference;
  }
  
  static buildExecutionReference(id: string): ExecutionReference {
    return id as ExecutionReference;
  }
  
  static buildReplayReference(id: string): ReplayReference {
    return id as ReplayReference;
  }
  
  static buildTranscriptReference(id: string): TranscriptReference {
    return id as TranscriptReference;
  }
  
  static buildCheckpointReference(id: string): CheckpointReference {
    return id as CheckpointReference;
  }
  
  static buildEnvelopeReference(id: string): EnvelopeReference {
    return id as EnvelopeReference;
  }
}
