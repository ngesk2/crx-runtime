/**
 * Runtime Clock
 * 
 * Phase 36 PATCH 7 — Time Authority Split
 * 
 * The ONLY place where runtime time is generated.
 * 
 * Constitutional Constraint:
 * Replay should never even know Date exists.
 * 
 * Architecture:
 * RuntimeClock
 *   ↓
 * ConstitutionalTimeAuthority
 *   ↓
 * ReplayTimeAuthority
 * 
 * RuntimeClock is the sole interface to system time.
 * All other authorities must go through this abstraction.
 */

class RuntimeClock {
  constructor() {
    this._clockVersion = '1.0.0';
  }

  /**
   * Get current timestamp as ISO string
   * @returns {string} ISO timestamp
   */
  now() {
    return new Date().toISOString();
  }

  /**
   * Get current timestamp as milliseconds
   * @returns {number} Milliseconds since epoch
   */
  nowAsMillis() {
    return Date.now();
  }

  /**
   * Get current timestamp as Date object
   * @returns {Date} Date object
   */
  nowAsDate() {
    return new Date();
  }

  /**
   * Get clock version
   * @returns {string} Clock version
   */
  getClockVersion() {
    return this._clockVersion;
  }
}

// Singleton instance
const runtimeClock = new RuntimeClock();

module.exports = {
  RuntimeClock,
  runtimeClock
};
