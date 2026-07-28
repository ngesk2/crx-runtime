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
            },
            'qdrant': {
                'url': os.getenv('QDRANT_URL', 'http://localhost:6333'),
                'api_key': os.getenv('QDRANT_API_KEY', ''),
                'collection': os.getenv('QDRANT_COLLECTION', 'constitutional_memory'),
                'host': os.getenv('QDRANT_HOST', 'localhost'),
                'port': int(os.getenv('QDRANT_PORT', 6333)),
            },
            'ollama': {
                'base_url': os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434'),
                'chat_model': os.getenv('OLLAMA_CHAT_MODEL', 'qwen3:latest'),
                'embed_model': os.getenv('OLLAMA_EMBED_MODEL', 'nomic-embed-text'),
            },
            'google_drive': {
                'credentials_path': os.getenv('GOOGLE_DRIVE_CREDENTIALS_PATH', 'credentials.json'),
                'folder_id': os.getenv('GOOGLE_DRIVE_FOLDER_ID', ''),
            },
            'inference': {
                'provider': os.getenv('INFERENCE_PROVIDER', 'ollama'),
                'base_url': os.getenv('INFERENCE_BASE_URL', 'http://localhost:11434'),
                'embedding_model': os.getenv('EMBEDDING_MODEL', 'nomic-embed-text'),
                'chat_model': os.getenv('CHAT_MODEL', 'llama3'),
            },
            'vault': {
                'url': os.getenv('VAULT_URL', 'http://localhost:8200'),
                'role_id': os.getenv('VAULT_ROLE_ID'),
                'secret_id': os.getenv('VAULT_SECRET_ID'),
                'token': os.getenv('VAULT_TOKEN'),
                'mount_point': os.getenv('VAULT_MOUNT_POINT', 'ping'),
                'dev_root_token_id': os.getenv('VAULT_DEV_ROOT_TOKEN_ID', 'root'),
            },
            'paths': {
                'vault_path': os.getenv('VAULT_PATH', ''),
                'memory_collection': os.getenv('MEMORY_COLLECTION', 'memory'),
            },
            'secrets': {
                'openai_api_key': os.getenv('OPENAI_API_KEY'),
                'anthropic_api_key': os.getenv('ANTHROPIC_API_KEY'),
                'jwt_secret': os.getenv('JWT_SECRET', 'dev-signing-key-change-in-production'),
                'google_client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                'hf_token': os.getenv('HF_TOKEN') or os.getenv('HUGGINGFACE_HUB_TOKEN'),
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

    def get_path_config(self) -> Dict[str, Any]:
        self._ensure_loaded()
        return dict(self._config['paths'])

    def get_secret(self, key: str) -> Optional[str]:
        self._ensure_loaded()
        return self._config['secrets'].get(key)

    def get(self, key: str) -> Any:
        self._ensure_loaded()
        return self._config.get(key)

    def refresh(self):
        self._loaded = False
        self._config = {}
