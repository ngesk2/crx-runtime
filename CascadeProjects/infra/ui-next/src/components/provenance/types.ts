/**
 * Provenance state model for Mission Control.
 *
 * One shared vocabulary for "where did this come from and can I trust it".
 * States are never communicated by color alone: every badge renders
 * icon + text label + tooltip + accessible text.
 */

export type ProvenanceState =
  | 'OBSERVED' // recorded from a source, not yet interpreted
  | 'INFERRED' // machine-derived; not human-verified
  | 'VERIFIED' // checked against evidence and confirmed
  | 'HUMAN_CONFIRMED' // a human explicitly verified it
  | 'STALE' // past its freshness window
  | 'CONFLICTED' // sources disagree; not silently resolved
  | 'REPLAY_VERIFIED' // an execution reproduced and matched
  | 'UNKNOWN'; // provenance not established — never hidden

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type FreshnessState = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';

export type ReplayState = 'VERIFIED' | 'DIVERGED' | 'NOT_RUN' | 'UNKNOWN';

export type WitnessState = 'PRESENT' | 'UNVERIFIED' | 'ABSENT' | 'UNKNOWN';

export type AgentPresenceState =
  | 'idle'
  | 'queued'
  | 'working'
  | 'waiting'
  | 'verifying'
  | 'failed'
  | 'complete';

/**
 * Semantic palette mapping onto ui-next's existing token system.
 * constitutional=authority · runtime=execution · observability=live state ·
 * learning=healthy/verified · retrieval=knowledge · agents=workers ·
 * production=warning · historical=neutral/past
 */
export const PROVENANCE_PALETTE: Record<ProvenanceState, string> = {
  OBSERVED: 'observability',
  INFERRED: 'retrieval',
  VERIFIED: 'learning',
  HUMAN_CONFIRMED: 'constitutional',
  STALE: 'historical',
  CONFLICTED: 'production',
  REPLAY_VERIFIED: 'learning',
  UNKNOWN: 'historical',
};

export const PROVENANCE_LABEL: Record<ProvenanceState, string> = {
  OBSERVED: 'Observed',
  INFERRED: 'Inferred',
  VERIFIED: 'Verified',
  HUMAN_CONFIRMED: 'Human confirmed',
  STALE: 'Stale',
  CONFLICTED: 'Conflicted',
  REPLAY_VERIFIED: 'Replay verified',
  UNKNOWN: 'Unknown provenance',
};

export const PROVENANCE_DESCRIPTION: Record<ProvenanceState, string> = {
  OBSERVED: 'Recorded from a source. Not yet interpreted.',
  INFERRED: 'Derived by the machine. Not human-verified.',
  VERIFIED: 'Checked against evidence and confirmed.',
  HUMAN_CONFIRMED: 'A human explicitly verified this.',
  STALE: 'Past its freshness window. Treat with caution.',
  CONFLICTED: 'Sources disagree. Nothing was silently chosen.',
  REPLAY_VERIFIED: 'Execution reproduced and matched its witness.',
  UNKNOWN: 'Provenance has not been established.',
};
