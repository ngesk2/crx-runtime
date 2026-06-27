/**
 * Canonical Lifecycle
 * Part of CanonicalObject decomposition.
 */

export interface CanonicalLifecycle {
  state: string;
  state_history: Array<{
    state: string;
    timestamp: string;
  }>;
  valid_from: string;
  valid_until: string | null;
}
