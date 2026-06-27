/**
 * Canonical Clock
 * SINGLE authority for all time in the constitutional runtime.
 * No subsystem should observe wall-clock time directly.
 * All timestamps come from this authority.
 */

export class CanonicalClock {
  private static instance: CanonicalClock;
  private currentTime: string;
  private sequence: number = 0;
  
  private constructor() {
    this.currentTime = new Date().toISOString();
  }
  
  static getInstance(): CanonicalClock {
    if (!CanonicalClock.instance) {
      CanonicalClock.instance = new CanonicalClock();
    }
    return CanonicalClock.instance;
  }
  
  /**
   * Get current canonical timestamp
   */
  now(): string {
    return this.currentTime;
  }
  
  /**
   * Add duration to a timestamp and return result
   */
  addDuration(timestamp: string, durationMs: number): string {
    const current = new Date(timestamp);
    current.setMilliseconds(current.getMilliseconds() + durationMs);
    return current.toISOString();
  }
  
  /**
   * Advance the clock (for replay)
   */
  advance(milliseconds: number): void {
    const current = new Date(this.currentTime);
    current.setMilliseconds(current.getMilliseconds() + milliseconds);
    this.currentTime = current.toISOString();
  }
  
  /**
   * Set the clock to a specific time (for replay)
   */
  set(timestamp: string): void {
    this.currentTime = timestamp;
  }
  
  /**
   * Get next sequence number
   */
  nextSequence(): number {
    return ++this.sequence;
  }
  
  /**
   * Reset sequence (for testing)
   */
  resetSequence(): void {
    this.sequence = 0;
  }
  
  /**
   * Reset clock to current wall time (for testing)
   */
  resetToWallTime(): void {
    this.currentTime = new Date().toISOString();
  }
}

/**
 * Canonical Timestamp context
 * Passed to subsystems instead of allowing them to observe clock directly
 */
export interface CanonicalTimestampContext {
  timestamp: string;
  sequence: number;
  clock: CanonicalClock;
}

export class CanonicalTimestampContextBuilder {
  static build(clock: CanonicalClock): CanonicalTimestampContext {
    return {
      timestamp: clock.now(),
      sequence: clock.nextSequence(),
      clock,
    };
  }
}
