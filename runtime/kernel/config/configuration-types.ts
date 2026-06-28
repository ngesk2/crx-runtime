export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export interface QdrantConfig {
  url: string;
  apiKey: string;
  collection: string;
}

export interface OllamaConfig {
  baseUrl: string;
  chatModel: string;
  embedModel: string;
}

export interface GoogleDriveConfig {
  credentialsPath: string;
  folderId: string;
}

export interface InferenceConfig {
  provider: string;
  baseUrl: string;
  embeddingModel: string;
  chatModel: string;
}

export interface VaultConfig {
  url: string;
  roleId?: string;
  secretId?: string;
  token?: string;
  mountPoint: string;
}

export interface RuntimeConfig {
  postgres: PostgresConfig;
  qdrant: QdrantConfig;
  ollama: OllamaConfig;
  googleDrive: GoogleDriveConfig;
  inference: InferenceConfig;
  vault: VaultConfig;
}
