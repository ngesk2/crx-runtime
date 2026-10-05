'use client';

import React from 'react';
import {
  resolveMotion,
  type MotionSpec,
  type MotionResolution,
} from './registry';
import { useReducedMotion } from './useReducedMotion';

/** Spec without the reducedMotion axis — the hook fills it in. */
export type MotionSpecInput = Omit<MotionSpec, 'reducedMotion'>;

/**
 * useMotionClasses — resolve a semantic motion spec to CSS classes,
 * honoring the user's prefers-reduced-motion setting.
 * Returns the classes ('' when motion resolves to none) and the full
 * resolution for debugging/requirements.
 */
export function useMotionClasses(spec: MotionSpecInput): {
  classes: string;
  resolution: MotionResolution;
} {
  const reducedMotion = useReducedMotion();
  const resolution = resolveMotion({ ...spec, reducedMotion });
  return {
    classes: resolution.kind === 'css' ? (resolution.cssClasses ?? '') : '',
    resolution,
  };
}

interface MotionProps extends MotionSpecInput {
  as?: 'div' | 'span' | 'li' | 'section';
  className?: string;
  children: React.ReactNode;
  /** Passed through for a11y (e.g. aria-live regions wrapping streams). */
  [key: string]: unknown;
}

/**
 * Motion — semantic motion wrapper. Declares ROLE/TRIGGER/INTENSITY in JSX;
 * the registry decides the vetted implementation (or none, under
 * prefers-reduced-motion). Content is always rendered; motion is enhancement.
 */
export function Motion({
  role,
  placement = 'content',
  intensity = 'standard',
  trigger,
  as = 'div',
  className = '',
  children,
  ...rest
}: MotionProps) {
  const { classes } = useMotionClasses({ role, placement, intensity, trigger });
  const Tag = as as 'div';
  return (
    <Tag className={`${classes} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

export { resolveMotion };
export type { MotionSpec, MotionResolution };
