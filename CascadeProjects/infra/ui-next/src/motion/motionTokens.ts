/**
 * Motion tokens for Mission Control (ui-next).
 *
 * Harvested from the FYD website motion registry (src/motion/motionTokens.ts) —
 * CSS-first subset only. No framer-motion, no GSAP, no Lottie.
 * No hardcoded animation values should exist outside this file.
 * All durations in milliseconds.
 */

/**
 * Duration tokens — directive categories:
 *   MICRO      80–160ms   hover, press, badge, icon response
 *   STRUCTURAL 160–280ms  drawers, cards, tabs, filters, table mutations
 *   NAVIGATION 200–400ms  route/view transitions
 *   PROCESS    variable   event/mission/execution visualization
 *   AMBIENT    subtle     live-state pulses, active agents, streaming activity
 */
export const duration = {
  micro: 120,
  structural: 220,
  navigation: 350,
  process: 500,
  ambient: 2000,
  // Raw scale (harvested from FYD motionTokens, seconds → ms)
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  stagger: 100,
} as const;

/** Delay tokens, ms. */
export const delay = {
  none: 0,
  instant: 50,
  fast: 100,
  normal: 200,
  slow: 300,
  stagger: 100,
} as const;

/**
 * Easing tokens — CSS cubic-bezier strings.
 * `standard` is the FYD "premium" ease-out: fast attack, gentle settle.
 */
export const easing = {
  standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  entrance: 'cubic-bezier(0, 0, 0.2, 1)',
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  linear: 'linear',
} as const;

/** Opacity tokens for fade animations. */
export const opacity = {
  hidden: 0,
  visible: 1,
  subtle: 0.8,
  muted: 0.6,
  faint: 0.4,
  ghost: 0.2,
} as const;

/** Distance tokens (px) for translate animations. */
export const distance = {
  none: 0,
  tiny: 4,
  small: 8,
  normal: 12,
  medium: 20,
  large: 32,
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
