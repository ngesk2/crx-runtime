'use client';

import React from 'react';
import {
  Eye, Brain, BadgeCheck, UserCheck, Clock, AlertTriangle,
  RotateCcw, HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import {
  PROVENANCE_LABEL, PROVENANCE_DESCRIPTION,
  type ProvenanceState,
} from './types';

const STATE_ICON: Record<ProvenanceState, LucideIcon> = {
  OBSERVED: Eye,
  INFERRED: Brain,
  VERIFIED: BadgeCheck,
  HUMAN_CONFIRMED: UserCheck,
  STALE: Clock,
  CONFLICTED: AlertTriangle,
  REPLAY_VERIFIED: RotateCcw,
  UNKNOWN: HelpCircle,
};

/**
 * Static class map — Tailwind v3 JIT needs full literal class names.
 * (Dynamic `bg-${palette}-500` would never be generated.)
 */
const STATE_CLASSES: Record<ProvenanceState, string> = {
  OBSERVED: 'bg-observability-500/10 border-observability-500/30 text-observability-300',
  INFERRED: 'bg-retrieval-500/10 border-retrieval-500/30 text-retrieval-300',
  VERIFIED: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
  HUMAN_CONFIRMED: 'bg-constitutional-500/10 border-constitutional-500/30 text-constitutional-300',
  STALE: 'bg-historical-500/10 border-historical-500/30 text-historical-400',
  CONFLICTED: 'bg-production-500/10 border-production-500/30 text-production-300',
  REPLAY_VERIFIED: 'bg-learning-500/10 border-learning-500/30 text-learning-300',
  UNKNOWN: 'bg-historical-500/10 border-historical-500/40 text-historical-500',
};

interface ProvenanceBadgeProps {
  state: ProvenanceState;
  /** Optional custom text shown after the state label. */
  detail?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * ProvenanceBadge — the shared trust primitive.
 * Never color-alone: icon + text label + tooltip + accessible text.
 */
export function ProvenanceBadge({ state, detail, size = 'sm', className = '' }: ProvenanceBadgeProps) {
  const label = PROVENANCE_LABEL[state];
  const description = PROVENANCE_DESCRIPTION[state];
  const Icon = STATE_ICON[state];
  const tooltip = detail ? `${label}. ${description} ${detail}` : `${label}. ${description}`;

  return (
    <span
      role="img"
      aria-label={`Provenance: ${label}${detail ? `. ${detail}` : ''}`}
      title={tooltip}
      className={[
        'inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        STATE_CLASSES[state],
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className,
      ].join(' ')}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
