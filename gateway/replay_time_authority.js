/**
 * Replay Time Authority
 * 
 * Phase 36 PATCH 7 — Time Authority Split
 * 
 * Provides deterministic time for replay operations.
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
 * ReplayTimeAuthority is used exclusively during replay mode.
 * It provides time from the original execution timeline.
 */

class ReplayTimeAuthority {
  constructor() {
    this._currentTime = null;
    this._isReplayMode = false;
    this._authorityVersion = '1.0.0';
  }

  /**
   * Enter replay mode with fixed time
   * @param {string} timestamp - ISO timestamp to use during replay
   */
  enterReplayMode(timestamp) {
    this._currentTime = timestamp;
    this._isReplayMode = true;
  }

  /**
   * Exit replay mode
   */
  exitReplayMode() {
    this._currentTime = null;
    this._isReplayMode = false;
  }

  /**
   * Get current timestamp
   * @returns {string} ISO timestamp
   */
  now() {
    if (this._isReplayMode && this._currentTime) {
      return this._currentTime;
    }
    throw new Error('ReplayTimeAuthority: Not in replay mode. Use ConstitutionalTimeAuthority for runtime time.');
  }

  /**
   * Get current time as milliseconds
   * @returns {number} Milliseconds since epoch
   */
  nowAsMillis() {
    if (this._isReplayMode && this._currentTime) {
      return new Date(this._currentTime).getTime();
    }
    throw new Error('ReplayTimeAuthority: Not in replay mode. Use ConstitutionalTimeAuthority for runtime time.');
  }

  /**
   * Check if in replay mode
   * @returns {boolean} Replay mode status
   */
  isReplayMode() {
    return this._isReplayMode;
  }

  /**
   * Get authority version
   * @returns {string} Authority version
   */
  getAuthorityVersion() {
    return this._authorityVersion;
  }
}

// Singleton instance
const replayTimeAuthority = new ReplayTimeAuthority();

module.exports = {
  ReplayTimeAuthority,
  replayTimeAuthority
};
