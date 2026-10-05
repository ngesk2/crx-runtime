'use client';

import React from 'react';
import { RotateCcw, GitCompareArrows, CircleDashed, HelpCircle } from 'lucide-react';
import type { ReplayState } from './types';

const STATE_META: Record<ReplayState, { classes: string; label: string; hint: string; icon: typeof RotateCcw }> = {
  VERIFIED: {
    classes: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
    label: 'Replay verified',
    hint: 'Re-execution reproduced the recorded result.',
    icon: RotateCcw,
  },
  DIVERGED: {
    classes: 'bg-production-500/10 border-production-500/30 text-production-300',
    label: 'Replay diverged',
    hint: 'Re-execution produced a different result. Investigate.',
    icon: GitCompareArrows,
  },
  NOT_RUN: {
    classes: 'bg-historical-500/10 border-historical-500/30 text-historical-400',
    label: 'Not replayed',
    hint: 'This execution has not been replayed yet.',
    icon: CircleDashed,
  },
  UNKNOWN: {
    classes: 'bg-historical-500/10 border-historical-500/40 text-historical-500',
    label: 'Replay unknown',
    hint: 'Replay state has not been established.',
    icon: HelpCircle,
  },
};

interface ReplayBadgeProps {
  state: ReplayState;
  /** Optional run id, shown truncated with full value in tooltip. */
  runId?: string | null;
  className?: string;
}

/**
 * ReplayBadge — did the recorded execution reproduce?
 * Per the directive, replay is never faked: NOT_RUN and UNKNOWN are
 * honest states, and DIVERGED is shown as important, not hidden.
 */
export function ReplayBadge({ state, runId, className = '' }: ReplayBadgeProps) {
  const { classes, label, hint, icon: Icon } = STATE_META[state];
  const tooltip = runId ? `${label}. ${hint} Run: ${runId}` : `${label}. ${hint}`;

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
    </span>
  );
}
