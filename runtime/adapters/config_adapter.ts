/**
 * CONFIG ADAPTER
 * 
 * Infrastructure adapter for configuration injection.
 * Depends on replay/ for configuration.
 * replay/ NEVER depends on this adapter.
 */

import { DeterministicReplayConfig } from '../replay/replay_types';

export class ConfigAdapter {
  private config: Map<string, any>;

  constructor() {
    this.config = new Map();
  }

  setConfig(key: string, value: any): void {
    this.config.set(key, value);
  }

  getConfig(key: string): any {
    return this.config.get(key);
  }

  getReplayConfig(): DeterministicReplayConfig {
    return {
      canonicalization_version: this.getConfig('canonicalization_version') || '1.0',
      hash_algorithm: this.getConfig('hash_algorithm') || 'sha256',
      hash_version: this.getConfig('hash_version') || '1.0',
      replay_version: this.getConfig('replay_version') || '1.0',
      policy_version: this.getConfig('policy_version') || '1.0'
    };
  }

  loadFromEnvironment(): void {
    // Load configuration from environment variables (infrastructure layer only)
    // This is the ONLY place where process.env should be accessed
    if (process.env.CANONICALIZATION_VERSION) {
      this.setConfig('canonicalization_version', process.env.CANONICALIZATION_VERSION);
    }
    if (process.env.HASH_ALGORITHM) {
      this.setConfig('hash_algorithm', process.env.HASH_ALGORITHM);
    }
    if (process.env.HASH_VERSION) {
      this.setConfig('hash_version', process.env.HASH_VERSION);
    }
    if (process.env.REPLAY_VERSION) {
      this.setConfig('replay_version', process.env.REPLAY_VERSION);
    }
    if (process.env.POLICY_VERSION) {
      this.setConfig('policy_version', process.env.POLICY_VERSION);
    }
  }
}
