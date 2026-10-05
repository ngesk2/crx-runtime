/**
 * Provenance visual language — shared primitives.
 * Never color-alone: every badge renders icon + text label + tooltip +
 * accessible text.
 */
export { ProvenanceBadge } from './ProvenanceBadge';
export { ConfidenceIndicator } from './ConfidenceIndicator';
export { EvidenceState } from './EvidenceState';
export type { EvidenceLifecycleStage } from './EvidenceState';
export { WitnessBadge } from './WitnessBadge';
export { ReplayBadge } from './ReplayBadge';
export { FreshnessBadge, DEFAULT_FRESHNESS_POLICY } from './FreshnessBadge';
export type { FreshnessPolicy } from './FreshnessBadge';
export { AgentBadge } from './AgentBadge';
export { CapabilityBadge } from './CapabilityBadge';
export {
  PROVENANCE_PALETTE,
  PROVENANCE_LABEL,
  PROVENANCE_DESCRIPTION,
} from './types';
export type {
  ProvenanceState,
  ConfidenceLevel,
  FreshnessState,
  ReplayState,
  WitnessState,
  AgentPresenceState,
} from './types';
