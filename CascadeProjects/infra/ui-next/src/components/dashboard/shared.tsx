'use client';

import React from 'react';

/**
 * PulsedValue — a number that subtly pulses when it changes.
 * Change is communicated by motion (opacity dip, transform-free) AND by
 * the value itself changing, so reduced-motion users lose nothing.
 * The .motion-change-pulse class is CSS-gated on prefers-reduced-motion.
 */
export function PulsedValue({
  value,
  className = '',
  ariaLabel,
}: {
  value: string | number;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <span
      key={String(value)}
      className={`motion-change-pulse inline-block ${className}`}
      aria-label={ariaLabel}
    >
      {value}
    </span>
  );
}

/**
 * StatusDot — live-state indicator. NEVER color-alone: the parent must
 * always pair it with a text status label (aria-label on the dot too).
 */
export function StatusDot({ healthy }: { healthy: boolean }) {
  return (
    <span
      role="img"
      aria-label={healthy ? 'healthy' : 'unhealthy'}
      title={healthy ? 'healthy' : 'unhealthy'}
      className={[
        'inline-block w-2 h-2 rounded-full',
        healthy ? 'bg-learning-400 motion-pulse-subtle' : 'bg-production-400',
      ].join(' ')}
    />
  );
}
