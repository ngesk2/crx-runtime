'use client';

import React from 'react';
import { Fingerprint, FileQuestion, FileX2 } from 'lucide-react';
import type { WitnessState } from './types';

const STATE_META: Record<WitnessState, { classes: string; label: string; hint: string }> = {
  PRESENT: {
    classes: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
    label: 'Witnessed',
    hint: 'A witness record exists for this artifact.',
  },
  UNVERIFIED: {
    classes: 'bg-constitutional-500/10 border-constitutional-500/30 text-constitutional-300',
    label: 'Witness unverified',
    hint: 'A witness record exists but has not been checked.',
  },
  ABSENT: {
    classes: 'bg-production-500/10 border-production-500/30 text-production-300',
    label: 'No witness',
    hint: 'No witness record exists. Nothing to reproduce against.',
  },
  UNKNOWN: {
    classes: 'bg-historical-500/10 border-historical-500/40 text-historical-500',
    label: 'Witness unknown',
    hint: 'Witness state has not been established.',
  },
};

interface WitnessBadgeProps {
  state: WitnessState;
  /** Witness digest; shown truncated, full value in tooltip. */
  digest?: string | null;
  className?: string;
}

/**
 * WitnessBadge — is there a witness, and has it been checked?
 * A witness is the artifact a replay compares against. Absent witnesses
 * are shown as a warning, never hidden.
 */
export function WitnessBadge({ state, digest, className = '' }: WitnessBadgeProps) {
  const { classes, label, hint } = STATE_META[state];
  const Icon = state === 'ABSENT' ? FileX2 : state === 'UNKNOWN' ? FileQuestion : Fingerprint;
  const short = digest && digest.length > 14 ? `${digest.slice(0, 10)}…` : digest;
  const tooltip = digest
    ? `${label}. ${hint} Digest: ${digest}`
    : `${label}. ${hint}`;

  return (
    <span
      role="img"
      aria-label={tooltip}
      title={tooltip}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        'px-2 py-0.5 text-[11px]',
        classes,
        className,
      ].join(' ')}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
      {short && (
        <span className="font-mono opacity-80" aria-hidden="true">
          {short}
        </span>
      )}
    </span>
  );
}
