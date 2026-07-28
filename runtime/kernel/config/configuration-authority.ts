import { ConfigurationProvider } from './configuration-provider';
import { RuntimeConfig, PostgresConfig, QdrantConfig, OllamaConfig, GoogleDriveConfig, InferenceConfig, VaultConfig } from './configuration-types';

export class ConfigurationAuthority {
  private static instance: ConfigurationAuthority;
  private provider: ConfigurationProvider;

  private constructor() {
    this.provider = ConfigurationProvider.getInstance();
  }

  static getInstance(): ConfigurationAuthority {
    if (!ConfigurationAuthority.instance) {
      ConfigurationAuthority.instance = new ConfigurationAuthority();
    }
    return ConfigurationAuthority.instance;
  }

  static current(): ConfigurationAuthority {
    return ConfigurationAuthority.getInstance();
  }

  load(): RuntimeConfig {
    return this.provider.load();
  }

  getPostgresConfig(): PostgresConfig {
    return this.provider.getPostgresConfig();
  }

  getQdrantConfig(): QdrantConfig {
    return this.provider.getQdrantConfig();
  }

  getOllamaConfig(): OllamaConfig {
    return this.provider.getOllamaConfig();
  }

  getGoogleDriveConfig(): GoogleDriveConfig {
    return this.provider.getGoogleDriveConfig();
  }

  getInferenceConfig(): InferenceConfig {
    return this.provider.getInferenceConfig();
  }

  getVaultConfig(): VaultConfig {
    return this.provider.getVaultConfig();
  }

  refresh(): void {
    this.provider.refresh();
  }
}
