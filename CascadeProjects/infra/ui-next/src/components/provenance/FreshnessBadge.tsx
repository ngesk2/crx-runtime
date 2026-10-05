'use client';

import React from 'react';
import { Timer, TimerOff, History } from 'lucide-react';
import type { FreshnessState } from './types';

export interface FreshnessPolicy {
  /** seconds before FRESH becomes AGING */
  freshSeconds: number;
  /** seconds before AGING becomes STALE */
  staleSeconds: number;
}

/** Conservative default. Backends can supply their own per-source policy. */
export const DEFAULT_FRESHNESS_POLICY: FreshnessPolicy = {
  freshSeconds: 15 * 60,
  staleSeconds: 2 * 60 * 60,
};

const STATE_META: Record<FreshnessState, { classes: string; label: string }> = {
  FRESH: {
    classes: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
    label: 'Fresh',
  },
  AGING: {
    classes: 'bg-constitutional-500/10 border-constitutional-500/30 text-constitutional-300',
    label: 'Aging',
  },
  STALE: {
    classes: 'bg-production-500/10 border-production-500/30 text-production-300',
    label: 'Stale',
  },
  UNKNOWN: {
    classes: 'bg-historical-500/10 border-historical-500/40 text-historical-500',
    label: 'Freshness unknown',
  },
};

interface FreshnessBadgeProps {
  /** ISO timestamp of last observation. Null/undefined → UNKNOWN. */
  observedAt?: string | null;
  policy?: FreshnessPolicy;
  className?: string;
}

/**
 * FreshnessBadge — one policy source, three states.
 * No arbitrary thresholds: the policy is explicit and overridable per source.
 * Without a timestamp we say UNKNOWN, never guess.
 */
export function FreshnessBadge({ observedAt, policy = DEFAULT_FRESHNESS_POLICY, className = '' }: FreshnessBadgeProps) {
  let state: FreshnessState = 'UNKNOWN';
  let ageSeconds: number | null = null;

  if (observedAt) {
    const t = Date.parse(observedAt);
    if (!Number.isNaN(t)) {
      ageSeconds = Math.max(0, (Date.now() - t) / 1000);
      state =
        ageSeconds <= policy.freshSeconds
          ? 'FRESH'
          : ageSeconds <= policy.staleSeconds
            ? 'AGING'
            : 'STALE';
    }
  }

  const { classes, label } = STATE_META[state];
  const Icon = state === 'UNKNOWN' ? TimerOff : state === 'STALE' ? History : Timer;
  const ageText =
    ageSeconds == null
      ? 'no observation timestamp'
      : ageSeconds < 60
        ? `${Math.round(ageSeconds)}s ago`
        : ageSeconds < 3600
          ? `${Math.round(ageSeconds / 60)}m ago`
          : `${(ageSeconds / 3600).toFixed(1)}h ago`;

  return (
    <span
      role="img"
      aria-label={`Freshness: ${label}, observed ${ageText}`}
      title={`${label}. Observed ${ageText}. Policy: fresh ≤${Math.round(policy.freshSeconds / 60)}m, stale >${Math.round(policy.staleSeconds / 60)}m.`}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        'px-2 py-0.5 text-[11px]',
        classes,
        className,
      ].join(' ')}
    >
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
