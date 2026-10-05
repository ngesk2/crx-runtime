'use client';

import React from 'react';
import { Gauge, ShieldAlert } from 'lucide-react';
import type { ConfidenceLevel } from './types';

const LEVELS: Record<ConfidenceLevel, { classes: string; label: string; hint: string }> = {
  HIGH: {
    classes: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
    label: 'High confidence',
    hint: 'Calibrated score 0.8 or above.',
  },
  MEDIUM: {
    classes: 'bg-constitutional-500/10 border-constitutional-500/30 text-constitutional-300',
    label: 'Medium confidence',
    hint: 'Calibrated score between 0.5 and 0.8.',
  },
  LOW: {
    classes: 'bg-production-500/10 border-production-500/30 text-production-300',
    label: 'Low confidence',
    hint: 'Calibrated score below 0.5. Verify before acting.',
  },
  UNKNOWN: {
    classes: 'bg-historical-500/10 border-historical-500/40 text-historical-500',
    label: 'Confidence unknown',
    hint: 'No calibrated confidence available.',
  },
};

interface ConfidenceIndicatorProps {
  /** Calibrated 0–1 score. Null/undefined → UNKNOWN. */
  value?: number | null;
  /** Set false when the score is heuristic, not calibrated. */
  calibrated?: boolean;
  className?: string;
}

/**
 * ConfidenceIndicator — categorical confidence, never fake precision.
 * We render the category label, not the raw number: a raw number implies
 * calibration we may not have. The raw value (when calibrated) is in the
 * tooltip for engineers who want it.
 */
export function ConfidenceIndicator({ value, calibrated = false, className = '' }: ConfidenceIndicatorProps) {
  const level: ConfidenceLevel =
    !calibrated || value == null || Number.isNaN(value)
      ? 'UNKNOWN'
      : value >= 0.8
        ? 'HIGH'
        : value >= 0.5
          ? 'MEDIUM'
          : 'LOW';

  const { classes, label, hint } = LEVELS[level];
  const tooltip =
    level === 'UNKNOWN'
      ? `${label}. ${hint}`
      : `${label}. ${hint} Raw: ${value!.toFixed(2)}.`;

  return (
    <span
      role="img"
      aria-label={label}
      title={tooltip}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        'px-2 py-0.5 text-[11px]',
        classes,
        className,
      ].join(' ')}
    >
      {level === 'UNKNOWN' ? (
        <ShieldAlert className="w-3 h-3" aria-hidden="true" />
      ) : (
        <Gauge className="w-3 h-3" aria-hidden="true" />
      )}
      <span>{label}</span>
    </span>
  );
}
