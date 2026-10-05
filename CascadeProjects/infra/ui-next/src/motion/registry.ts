/**
 * Motion registry for Mission Control (ui-next) — harvest of the FYD
 * Motion 3.0 semantic registry, adapted to a CSS-first ui-next subset.
 *
 * Maps a semantic motion specification to a vetted implementation.
 * No framer-motion in ui-next: every resolution is CSS (transform/opacity
 * only) or "none". WAAPI is the sanctioned second tier for orchestrated
 * sequences; it is not needed by any current caller.
 *
 * Semantic axes (the only inputs):
 *   role          reveal | emphasis | feedback | ambient | transition | stream
 *   placement     content | edge | overlay
 *   intensity     subtle | standard | strong
 *   trigger       mount | hover | tap | scroll | none
 *   reducedMotion boolean (prefers-reduced-motion state)
 *
 * Hard constraints (inherited from the FYD registry):
 * - Transform and opacity only. Anything using filter/blur/layout is not
 *   vetted and is never returned.
 * - reducedMotion=true always resolves to no motion (instant state),
 *   regardless of the other axes.
 * - Ambient decoration lives on the edge only, is pointer-events-none,
 *   and never renders below 768px.
 * - Motion is presentation only. It never carries truth, evidence, or
 *   authority. Content must be visible/legible if the animation never runs
 *   (progressive enhancement).
 *
 * Determinism: resolveMotion is a pure function. Same spec -> same
 * resolution, always. No wall-clock, no randomness.
 */

export type MotionRole =
  | 'reveal' // element enters (mount)
  | 'emphasis' // draw attention on hover/focus
  | 'feedback' // press/toggle confirmation
  | 'ambient' // live-state pulse, never demands attention
  | 'transition' // view/route change
  | 'stream'; // new item entering a live stream (activity feed)

export type MotionPlacement = 'content' | 'edge' | 'overlay';
export type MotionIntensity = 'subtle' | 'standard' | 'strong';
export type MotionTrigger = 'mount' | 'hover' | 'tap' | 'scroll' | 'none';

export interface MotionSpec {
  role: MotionRole;
  placement: MotionPlacement;
  intensity: MotionIntensity;
  trigger: MotionTrigger;
  reducedMotion: boolean;
}

export interface MotionResolution {
  kind: 'css' | 'none';
  /** Space-separated classes to apply (kind === 'css'). Transform/opacity only. */
  cssClasses?: string;
  /** Constraints the caller must satisfy for the resolution to be valid. */
  requirements: string[];
  /** Why this implementation was chosen. */
  reason: string;
}

/* CSS-first trivial motion: hover/tap feedback on content. */
const CSS_FEEDBACK_SUBTLE =
  'transition-transform duration-[120ms] ease-out hover:scale-[1.02] active:scale-[0.98]';
const CSS_FEEDBACK_STANDARD =
  'transition-transform duration-[120ms] ease-out hover:scale-[1.03] active:scale-[0.97]';
const CSS_EMPHASIS_SUBTLE =
  'transition-transform duration-[220ms] ease-out hover:-translate-y-0.5';
const CSS_EMPHASIS_STANDARD =
  'transition-transform duration-[220ms] ease-out hover:-translate-y-1';

/**
 * Resolve a semantic motion spec to a vetted implementation.
 * Pure function: same spec -> same resolution, always.
 */
export function resolveMotion(spec: MotionSpec): MotionResolution {
  // Reduced motion wins over every other axis. Instant state, no motion.
  if (spec.reducedMotion) {
    return {
      kind: 'none',
      requirements: [],
      reason: 'prefers-reduced-motion: motion resolved to instant state',
    };
  }

  // Ambient live-state: edge only, pointer-transparent, desktop-only.
  if (spec.role === 'ambient' && spec.placement === 'edge') {
    return {
      kind: 'css',
      cssClasses: 'motion-ambient-drift pointer-events-none hidden md:block',
      requirements: [
        'pointer-events-none: decorative layer must not intercept input',
        'hidden md:block: no edge ornaments below 768px',
        '.motion-ambient-drift: transform/opacity keyframes only, reduced-motion gated',
      ],
      reason: 'ambient edge decoration: CSS drift, pointer-transparent, desktop-only',
    };
  }

  // Ambient pulse on content (status dots, live indicators): opacity only.
  if (spec.role === 'ambient' && spec.placement === 'content') {
    return {
      kind: 'css',
      cssClasses: 'motion-pulse-subtle',
      requirements: [
        'opacity-only keyframes; never use for text that must stay legible',
        'pair with a non-color indicator (label or icon) — status is never color-alone',
      ],
      reason: 'ambient content pulse: opacity-only, subtle',
    };
  }

  // Mount reveals: transform + opacity, progressive enhancement
  // (element is visible in final state if the animation never runs).
  if (spec.role === 'reveal' && spec.trigger === 'mount') {
    return {
      kind: 'css',
      cssClasses:
        spec.intensity === 'strong'
          ? 'motion-reveal-up-strong'
          : spec.intensity === 'subtle'
            ? 'motion-reveal-subtle'
            : 'motion-reveal-up',
      requirements: [
        'content must be visible if the animation never runs (keyframes end at opacity 1)',
      ],
      reason: 'mount reveal: CSS keyframes, transform+opacity only',
    };
  }

  // New item entering a live stream (activity feed, event log).
  if (spec.role === 'stream' && spec.trigger === 'mount') {
    return {
      kind: 'css',
      cssClasses: 'motion-stream-in',
      requirements: [
        'apply once on insertion; settled records never re-animate',
        'respect reduced-motion: with reducedMotion=true this resolves to none',
      ],
      reason: 'stream insertion: short enter keyframe, transform+opacity only',
    };
  }

  // Trivial feedback: CSS first. No JS animation needed.
  if (spec.role === 'feedback' && (spec.trigger === 'hover' || spec.trigger === 'tap')) {
    return {
      kind: 'css',
      cssClasses:
        spec.intensity === 'subtle' ? CSS_FEEDBACK_SUBTLE : CSS_FEEDBACK_STANDARD,
      requirements: ['transform/opacity only; no layout property transitions'],
      reason: 'trivial feedback: CSS transition, transform+opacity only',
    };
  }

  // Emphasis on hover: CSS lift.
  if (spec.role === 'emphasis' && spec.trigger === 'hover') {
    return {
      kind: 'css',
      cssClasses:
        spec.intensity === 'subtle' ? CSS_EMPHASIS_SUBTLE : CSS_EMPHASIS_STANDARD,
      requirements: ['transform/opacity only'],
      reason: 'hover emphasis: CSS translate, no JS',
    };
  }

  // View/route transitions: opacity only, under 400ms.
  if (spec.role === 'transition') {
    return {
      kind: 'css',
      cssClasses: 'motion-view-fade',
      requirements: ['opacity only; keep under 400ms'],
      reason: 'view transition: opacity fade, no slide (avoids layout jank)',
    };
  }

  // Closed world: anything not mapped above has no vetted implementation.
  // Callers must not invent motion for unmapped specs.
  return {
    kind: 'none',
    requirements: [],
    reason: `no vetted implementation for ${spec.role}/${spec.placement}/${spec.intensity}/${spec.trigger}; motion omitted rather than invented`,
  };
}

/**
 * Vetting ledger. Every implementation the registry can return, with reasons.
 * Harvest-only: nothing here was invented for the registry.
 */
export const VETTING_LEDGER = {
  vetted: [
    {
      impl: 'motion-reveal-up / motion-reveal-up-strong / motion-reveal-subtle',
      from: 'ui-next src/app/globals.css (new)',
      why: 'transform+opacity keyframes, ends at opacity 1 (progressive enhancement)',
    },
    {
      impl: 'motion-stream-in',
      from: 'ui-next src/app/globals.css (new)',
      why: 'short enter keyframe for live-stream insertion; settled records never re-animate',
    },
    {
      impl: 'motion-ambient-drift',
      from: 'ui-next src/app/globals.css (new)',
      why: 'transform/opacity keyframes only, reduced-motion gated, edge-only + pointer-events-none',
    },
    {
      impl: 'motion-pulse-subtle',
      from: 'ui-next src/app/globals.css (new)',
      why: 'opacity-only pulse for live indicators; must pair with non-color status signal',
    },
    {
      impl: 'motion-view-fade',
      from: 'ui-next src/app/globals.css (new)',
      why: 'opacity-only view transition under 400ms',
    },
    {
      impl: 'CSS feedback/emphasis classes',
      from: 'registry (Tailwind primitives)',
      why: 'trivial motion belongs in CSS; transform/opacity only, zero JS',
    },
  ],
  excluded: [
    {
      impl: 'framer-motion / Motion One / GSAP / Lottie',
      why: 'not installed in ui-next; CSS-first subset covers all vetted specs. Revisit only with measured need.',
    },
    {
      impl: 'filter/blur/layout-property animation',
      why: 'violates transform-and-opacity-only; never returned by the registry',
    },
    {
      impl: 'scroll-triggered reveals (JS)',
      why: 'no vetted implementation in the CSS-first subset; CSS scroll-driven animations are a future progressive enhancement',
    },
  ],
} as const;

/** Re-export the token scale so callers stay on tokens, not magic numbers. */
export { duration, easing, delay } from './motionTokens';
