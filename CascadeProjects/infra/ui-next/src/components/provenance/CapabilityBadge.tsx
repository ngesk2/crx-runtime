'use client';

import React from 'react';
import { KeyRound } from 'lucide-react';

interface CapabilityBadgeProps {
  /** Capability name, e.g. "website.render" or "evidence.read". */
  capability: string;
  /** When false the chip reads as not-granted (still shown, never hidden). */
  granted?: boolean;
  className?: string;
}

/**
 * CapabilityBadge — which authority/capability backs this action.
 * Ungranted capabilities are shown dimmed with "not granted", never hidden:
 * the user should see what they lack, not wonder why an action is missing.
 */
export function CapabilityBadge({ capability, granted = true, className = '' }: CapabilityBadgeProps) {
  return (
    <span
      role="img"
      aria-label={granted ? `Capability: ${capability}` : `Capability not granted: ${capability}`}
      title={granted ? `Capability: ${capability}` : `Not granted: ${capability}. This action cannot run without it.`}
      className={[
        'inline-flex items-center gap-1.5 rounded-md border font-mono font-medium whitespace-nowrap',
        'px-2 py-0.5 text-[11px]',
        granted
          ? 'bg-agents-500/10 border-agents-500/30 text-historical-300'
          : 'bg-historical-500/10 border-historical-500/40 text-historical-500',
        className,
      ].join(' ')}
    >
      <KeyRound className="w-3 h-3" aria-hidden="true" />
      <span>{capability}</span>
      {!granted && <span className="font-sans">(not granted)</span>}
    </span>
  );
}
