import { RuntimeConfig, PostgresConfig, QdrantConfig, OllamaConfig, GoogleDriveConfig, InferenceConfig, VaultConfig } from './configuration-types';

export class ConfigurationProvider {
  private static instance: ConfigurationProvider;
  private config: RuntimeConfig | null = null;

  private constructor() {}

  static getInstance(): ConfigurationProvider {
    if (!ConfigurationProvider.instance) {
      ConfigurationProvider.instance = new ConfigurationProvider();
    }
    return ConfigurationProvider.instance;
  }

  load(): RuntimeConfig {
    if (this.config) return this.config;
    this.config = {
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'crx_runtime',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
      },
      qdrant: {
        url: process.env.QDRANT_URL || 'http://localhost:6333',
        apiKey: process.env.QDRANT_API_KEY || '',
        collection: process.env.QDRANT_COLLECTION || 'constitutional_memory',
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        chatModel: process.env.OLLAMA_CHAT_MODEL || 'qwen3:latest',
        embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
      },
      googleDrive: {
        credentialsPath: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || 'credentials.json',
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID || '',
      },
      inference: {
        provider: process.env.INFERENCE_PROVIDER || 'ollama',
        baseUrl: process.env.INFERENCE_BASE_URL || 'http://localhost:11434',
        embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
        chatModel: process.env.CHAT_MODEL || 'llama3',
      },
      vault: {
        url: process.env.VAULT_URL || 'http://localhost:8200',
        roleId: process.env.VAULT_ROLE_ID,
        secretId: process.env.VAULT_SECRET_ID,
        token: process.env.VAULT_TOKEN,
        mountPoint: process.env.VAULT_MOUNT_POINT || 'ping',
      },
    };
    return this.config;
  }

  getPostgresConfig(): PostgresConfig {
    return this.load().postgres;
  }

  getQdrantConfig(): QdrantConfig {
    return this.load().qdrant;
  }

  getOllamaConfig(): OllamaConfig {
    return this.load().ollama;
  }

  getGoogleDriveConfig(): GoogleDriveConfig {
    return this.load().googleDrive;
  }

  getInferenceConfig(): InferenceConfig {
    return this.load().inference;
  }

  getVaultConfig(): VaultConfig {
    return this.load().vault;
  }

  refresh(): void {
    this.config = null;
  }
}
