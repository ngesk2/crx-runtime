import os
from pathlib import Path
from typing import Optional, Dict, Any


class ConfigurationAuthority:
    """SINGLE authority for all runtime configuration.

    Every runtime configuration value originates from exactly one place.
    No code outside this class should call os.getenv or access process.env.
    """

    _instance: Optional['ConfigurationAuthority'] = None

    def __init__(self):
        self._config: Dict[str, Any] = {}
        self._loaded = False

    @classmethod
    def get_instance(cls) -> 'ConfigurationAuthority':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def current(cls) -> 'ConfigurationAuthority':
        return cls.get_instance()

    def _ensure_loaded(self):
        if not self._loaded:
            self._load()
            self._loaded = True

    def _load_dotenv_files(self):
        repo_root = Path(__file__).resolve().parents[2]
        for candidate in (repo_root / '.env', repo_root / '.env.local', repo_root / '.env.base'):
            if not candidate.exists():
                continue
            try:
                with candidate.open('r', encoding='utf-8') as handle:
                    for raw_line in handle:
                        line = raw_line.strip()
                        if not line or line.startswith('#') or '=' not in line:
                            continue
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key and key not in os.environ:
                            os.environ[key] = value
            except Exception:
                continue

    def _load(self):
        self._load_dotenv_files()
        self._config = {
            'postgres': {
                'host': os.getenv('POSTGRES_HOST', 'localhost'),
                'port': int(os.getenv('POSTGRES_PORT', '5432')),
                'database': os.getenv('POSTGRES_DB', 'crx_runtime'),
                'user': os.getenv('POSTGRES_USER', 'postgres'),
                'password': os.getenv('POSTGRES_PASSWORD', 'postgres'),
                'container': os.getenv('POSTGRES_CONTAINER', 'brain-postgres'),
                'pgurl': os.getenv('DATABASE_URL', ''),
            },
            'qdrant': {
                'url': os.getenv('QDRANT_URL', 'http://localhost:6333'),
                'api_key': os.getenv('QDRANT_API_KEY', ''),
                'collection': os.getenv('QDRANT_COLLECTION', 'constitutional_memory'),
                'host': os.getenv('QDRANT_HOST', 'localhost'),
                'port': int(os.getenv('QDRANT_PORT', '6333')),
            },
            'ollama': {
                'base_url': os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
                'host': os.getenv('OLLAMA_HOST', 'localhost'),
                'port': os.getenv('OLLAMA_PORT', '11434'),
                'chat_model': os.getenv('OLLAMA_CHAT_MODEL', 'qwen3:latest'),
                'embed_model': os.getenv('OLLAMA_EMBED_MODEL', 'nomic-embed-text'),
                'num_parallel': int(os.getenv('OLLAMA_NUM_PARALLEL', '4')),
                'max_loaded_models': int(os.getenv('OLLAMA_MAX_LOADED_MODELS', '3')),
                'keep_alive': os.getenv('OLLAMA_KEEP_ALIVE', '5m'),
            },
            'google_drive': {
                'credentials_path': os.getenv('GOOGLE_DRIVE_CREDENTIALS_PATH', 'credentials.json'),
                'token_path': os.getenv('GOOGLE_DRIVE_TOKEN_PATH', 'token.json'),
                'folder_id': os.getenv('GOOGLE_DRIVE_FOLDER_ID', ''),
            },
            'inference': {
                'provider': os.getenv('INFERENCE_PROVIDER', 'ollama'),
                'base_url': os.getenv('INFERENCE_BASE_URL', 'http://localhost:11434'),
                'embedding_model': os.getenv('EMBEDDING_MODEL', 'nomic-embed-text'),
                'chat_model': os.getenv('CHAT_MODEL', 'llama3'),
                'embed_url': os.getenv('EMBED_URL', ''),
                'embed_model': os.getenv('EMBED_MODEL', 'nomic-embed-text'),
            },
            'vault': {
                'url': os.getenv('VAULT_URL', 'http://localhost:8200'),
                'role_id': os.getenv('VAULT_ROLE_ID'),
                'secret_id': os.getenv('VAULT_SECRET_ID'),
                'token': os.getenv('VAULT_TOKEN'),
                'mount_point': os.getenv('VAULT_MOUNT_POINT', 'ping'),
                'dev_root_token_id': os.getenv('VAULT_DEV_ROOT_TOKEN_ID', 'root'),
            },
            'github': {
                'owner': os.getenv('GITHUB_OWNER', ''),
                'repo': os.getenv('GITHUB_REPO', ''),
                'token': os.getenv('GITHUB_TOKEN', ''),
                'app_id': os.getenv('GITHUB_APP_ID', ''),
                'app_private_key_path': os.getenv('GITHUB_APP_PRIVATE_KEY_PATH', ''),
                'app_webhook_secret': os.getenv('GITHUB_APP_WEBHOOK_SECRET', ''),
                'workflow': os.getenv('GITHUB_WORKFLOW', 'local'),
                'sha': os.getenv('GITHUB_SHA', 'local'),
            },
            'yahoo': {
                'email': os.getenv('YAHOO_EMAIL', ''),
                'app_password': os.getenv('YAHOO_APP_PASSWORD', ''),
            },
            'secrets': {
                'openai_api_key': os.getenv('OPENAI_API_KEY'),
                'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
                'jwt_secret': os.getenv('JWT_SECRET', 'dev-signing-key-change-in-production'),
                'google_client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'hf_token': os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_HUB_TOKEN'),
            },
            'paths': {
                'vault_path': os.getenv('VAULT_PATH', ''),
                'memory_collection': os.getenv('MEMORY_COLLECTION', 'memory'),
                'repository_root': os.getenv('REPOSITORY_ROOT', ''),
                'gateway_url': os.getenv('GATEWAY_URL', 'http://gateway:8080'),
                'ping_primary_model': os.getenv('PING_PRIMARY_MODEL', 'qwen2.5-coder:7b'),
            },
            'workers': {
                'cycle_interval': int(os.getenv('CYCLE_INTERVAL', '900')),
                'min_word_count': int(os.getenv('MIN_WORD_COUNT', '500')),
                'dashboard_port': int(os.getenv('DASHBOARD_PORT', '5000')),
                'dashboard_host': os.getenv('DASHBOARD_HOST', '0.0.0.0'),
                'poll_interval_ms': int(os.getenv('PIPELINE_POLL_INTERVAL', '15000')),
            },
            'observability': {
                'otel_enabled': os.getenv('OTEL_ENABLED', 'false').lower() == 'true',
                'otel_exporter_endpoint': os.getenv('OTEL_EXPORTER_ENDPOINT', ''),
                'log_level': os.getenv('LOG_LEVEL', 'INFO'),
            },
            'service_urls': {
                'constitution': os.getenv('CONSTITUTION_SERVICE_URL', ''),
                'repository_runtime': os.getenv('REPOSITORY_RUNTIME_URL', ''),
                'retrieval': os.getenv('RETRIEVAL_SERVICE_URL', ''),
                'mission_control': os.getenv('MISSION_CONTROL_URL', ''),
                'ollama': os.getenv('OLLAMA_SERVICE_URL', ''),
                'vault': os.getenv('VAULT_URL', 'http://localhost:8200'),
            },
        }

    def get_postgres_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['postgres'])

    def get_qdrant_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['qdrant'])

    def get_ollama_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['ollama'])

    def get_google_drive_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['google_drive'])

    def get_inference_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['inference'])

    def get_vault_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['vault'])

    def get_github_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['github'])

    def get_yahoo_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['yahoo'])

    def get_path_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['paths'])

    def get_worker_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['workers'])

    def get_observability_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['observability'])

    def get_service_url(self, name: str) -> str:
        self._ensure_loaded()
        return self._config['service_urls'].get(name, '')

    def get_secret(self, key: str) -> Optional[str]:
        self._ensure_loaded()
        return self._config['secrets'].get(key)

    def get(self, key: str) -> Any:
        self._ensure_loaded()
        return self._config.get(key)

    def refresh(self):
        self._loaded = False
        self._config = {}
