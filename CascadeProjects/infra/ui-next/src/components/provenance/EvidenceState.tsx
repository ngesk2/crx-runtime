'use client';

import React from 'react';
import { ProvenanceBadge } from './ProvenanceBadge';
import type { ProvenanceState } from './types';

/**
 * The evidence lifecycle as the backend reports it:
 * recorded → machine-interpreted → checked → human-confirmed.
 * Stages the backend does not expose render as UNKNOWN, never as
 * an invented earlier stage.
 */
export type EvidenceLifecycleStage =
  | 'RECORDED'
  | 'INTERPRETED'
  | 'CHECKED'
  | 'HUMAN_CONFIRMED'
  | 'UNKNOWN';

const STAGE_TO_PROVENANCE: Record<EvidenceLifecycleStage, ProvenanceState> = {
  RECORDED: 'OBSERVED',
  INTERPRETED: 'INFERRED',
  CHECKED: 'VERIFIED',
  HUMAN_CONFIRMED: 'HUMAN_CONFIRMED',
  UNKNOWN: 'UNKNOWN',
};

interface EvidenceStateProps {
  stage: EvidenceLifecycleStage;
  detail?: string;
  className?: string;
}

/**
 * EvidenceState — where a piece of evidence stands in its lifecycle.
 * Thin over ProvenanceBadge so the whole app speaks one vocabulary.
 */
export function EvidenceState({ stage, detail, className = '' }: EvidenceStateProps) {
  return (
    <ProvenanceBadge
      state={STAGE_TO_PROVENANCE[stage]}
      detail={detail}
      className={className}
    />
  );
}
