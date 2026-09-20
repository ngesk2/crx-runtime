/**
 * Constitutional Time Authority
 * 
 * Centralized time authority for all timestamps.
 * All timestamps must come from this authority to ensure replay determinism.
 * Supports runtime mode (system time) and replay mode (injected time).
 * 
 * All failures use constitutional failure envelopes (deterministic, replay-safe).
 */

import { FailureAuthority, FailureCode, FailurePhase, FailureSource } from './failure-authority';

/**
 * Time mode for constitutional replay safety
 */
export enum TimeMode {
  RUNTIME = 'runtime',
  REPLAY = 'replay',
}

/**
 * Constitutional Time Authority
 */
export class ConstitutionalTimeAuthority {
  private static mode: TimeMode = TimeMode.RUNTIME;
  private static injectedTimestamp: number | null = null;

  /**
   * Set time mode (runtime or replay)
   * 
   * @param mode - Time mode
   * @param injectedTimestamp - Optional injected timestamp for replay mode (Unix millis)
   */
  static setMode(mode: TimeMode, injectedTimestamp?: number): void {
    this.mode = mode;
    if (mode === TimeMode.REPLAY && injectedTimestamp !== undefined) {
      this.injectedTimestamp = injectedTimestamp;
    }
  }

  /**
   * Reset to runtime mode
   */
  static resetMode(): void {
    this.mode = TimeMode.RUNTIME;
    this.injectedTimestamp = null;
  }

  /**
   * Get current timestamp in ISO 8601 format
   * 
   * @returns ISO 8601 timestamp
   */
  static now(): string {
    const millis = this.nowMillis();
    return new Date(millis).toISOString();
  }

  /**
   * Get current timestamp as Unix timestamp in milliseconds
   * 
   * @returns Unix timestamp in milliseconds
   */
  static nowMillis(): number {
    if (this.mode === TimeMode.REPLAY && this.injectedTimestamp !== null) {
      return this.injectedTimestamp;
    }
    return Date.now();
  }

  /**
   * Get current timestamp as Unix timestamp in seconds
   * 
   * @returns Unix timestamp in seconds
   */
  static nowSeconds(): number {
    return Math.floor(this.nowMillis() / 1000);
  }

  /**
   * Convert Unix timestamp to ISO 8601
   * 
   * @param timestamp - Unix timestamp in milliseconds
   * @returns ISO 8601 timestamp
   */
  static fromMillis(timestamp: number): string {
    return new Date(timestamp).toISOString();
  }

  /**
   * Convert Unix timestamp to ISO 8601
   * 
   * @param timestamp - Unix timestamp in seconds
   * @returns ISO 8601 timestamp
   */
  static fromSeconds(timestamp: number): string {
    return new Date(timestamp * 1000).toISOString();
  }

  /**
   * Validate ISO 8601 timestamp
   * 
   * @param timestamp - Timestamp to validate
   * @returns True if valid ISO 8601
   */
  static isValidISO8601(timestamp: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
    return iso8601Regex.test(timestamp);
  }

  /**
   * Normalize timestamp to ISO 8601
   * 
   * @param timestamp - Timestamp to normalize
   * @returns ISO 8601 timestamp
   */
  static normalize(timestamp: string): string {
    if (this.isValidISO8601(timestamp)) {
      return timestamp;
    }
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      const failure = FailureAuthority.createFailure({
        code: FailureCode.INVALID_INPUT,
        phase: FailurePhase.NORMALIZATION,
        authority: FailureSource.CONSTITUTIONAL,
        occurredAt: this.now(),
        retryClassification: 'non_retryable',
      });
      
      throw new Error(failure.code);
    }
    
    return date.toISOString();
  }
}
