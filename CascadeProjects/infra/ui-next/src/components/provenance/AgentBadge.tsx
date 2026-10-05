'use client';

import React from 'react';
import { Bot, CircleDashed, Loader2, CheckCircle2, XCircle, Hourglass, PauseCircle } from 'lucide-react';
import type { AgentPresenceState } from './types';

const STATE_META: Record<AgentPresenceState, { classes: string; label: string; icon: typeof Bot; pulse: boolean }> = {
  idle: {
    classes: 'bg-historical-500/10 border-historical-500/30 text-historical-400',
    label: 'Idle',
    icon: PauseCircle,
    pulse: false,
  },
  queued: {
    classes: 'bg-observability-500/10 border-observability-500/30 text-observability-300',
    label: 'Queued',
    icon: Hourglass,
    pulse: false,
  },
  working: {
    classes: 'bg-runtime-500/10 border-runtime-500/30 text-runtime-300',
    label: 'Working',
    icon: Loader2,
    pulse: true,
  },
  waiting: {
    classes: 'bg-constitutional-500/10 border-constitutional-500/30 text-constitutional-300',
    label: 'Waiting',
    icon: CircleDashed,
    pulse: false,
  },
  verifying: {
    classes: 'bg-retrieval-500/10 border-retrieval-500/30 text-retrieval-300',
    label: 'Verifying',
    icon: Loader2,
    pulse: true,
  },
  failed: {
    classes: 'bg-production-500/10 border-production-500/30 text-production-300',
    label: 'Failed',
    icon: XCircle,
    pulse: false,
  },
  complete: {
    classes: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
    label: 'Complete',
    icon: CheckCircle2,
    pulse: false,
  },
};

interface AgentBadgeProps {
  /** Display name of the agent/worker. */
  name: string;
  state: AgentPresenceState;
  /** Optional current task summary, shown in tooltip. */
  task?: string | null;
  className?: string;
}

/**
 * AgentBadge — who is acting, and what are they doing.
 * Working/verifying states get the subtle opacity pulse from the motion
 * registry (ambient/content) — paired with the text label, never
 * color-alone. Respects prefers-reduced-motion via the motion system.
 */
export function AgentBadge({ name, state, task, className = '' }: AgentBadgeProps) {
  const { classes, label, icon: Icon, pulse } = STATE_META[state];
  const tooltip = task
    ? `${name} — ${label}. ${task}`
    : `${name} — ${label}.`;

  return (
    <span
      role="status"
      aria-label={tooltip}
      title={tooltip}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        'px-2 py-0.5 text-[11px]',
        classes,
        pulse ? 'motion-pulse-subtle' : '',
        className,
      ].join(' ')}
    >
      <Bot className="w-3 h-3" aria-hidden="true" />
      <span className="font-semibold">{name}</span>
      <Icon className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
