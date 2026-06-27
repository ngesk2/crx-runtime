"""
Secret Authority Adapter

Constitutional: Central secret authority through HashiCorp Vault.
Business logic must NEVER directly access environment variables or secrets.

Architecture:
Business Logic
      ↓
SecretAdapter
      ↓
Vault Client
      ↓
Vault (AppRole Auth)
      ↓
Short-lived Token
      ↓
Fetch Secret

Forbidden:
os.getenv("OPENAI_API_KEY")
os.getenv("DATABASE_PASSWORD")
os.getenv("JWT_SECRET")

Required:
secret_adapter.get_openai_key()
secret_adapter.get_postgres_password()
secret_adapter.get_jwt_signing_key()
"""

import os
import hvac
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class VaultConfig:
    """Vault configuration."""
    url: str
    role_id: Optional[str] = None
    secret_id: Optional[str] = None
    token: Optional[str] = None
    mount_point: str = "ping"


class SecretAdapter:
    """
    Secret Authority Adapter.
    
    Constitutional: Single authority layer for all secret access.
    All secrets flow through this adapter, never directly from environment.
    """
    
    def __init__(self, config: Optional[VaultConfig] = None):
        """
        Initialize SecretAdapter.
        
        Args:
            config: Vault configuration. If None, uses environment variables.
        """
        if config is None:
            config = VaultConfig(
                url=os.getenv('VAULT_URL', 'http://localhost:8200'),
                role_id=os.getenv('VAULT_ROLE_ID'),
                secret_id=os.getenv('VAULT_SECRET_ID'),
                token=os.getenv('VAULT_TOKEN'),
                mount_point=os.getenv('VAULT_MOUNT_POINT', 'ping')
            )
        
        self.config = config
        self.client = None
        self._authenticated = False
    
    def _get_client(self) -> hvac.Client:
        """Get authenticated Vault client."""
        if self.client is None:
            self.client = hvac.Client(url=self.config.url)
        
        if not self._authenticated:
            self._authenticate()
        
        return self.client
    
    def _authenticate(self):
        """Authenticate with Vault using AppRole or token."""
        if self.config.token:
            # Token authentication
            self.client.token = self.config.token
            self._authenticated = True
        elif self.config.role_id and self.config.secret_id:
            # AppRole authentication
            auth_response = self.client.auth.approle.login(
                role_id=self.config.role_id,
                secret_id=self.config.secret_id
            )
            self.client.token = auth_response['auth']['client_token']
            self._authenticated = True
        else:
            # Fallback to root token for development (NOT FOR PRODUCTION)
            root_token = os.getenv('VAULT_DEV_ROOT_TOKEN_ID', 'root')
            self.client.token = root_token
            self._authenticated = True
    
    def _get_secret(self, path: str) -> dict:
        """
        Get secret from Vault.

        Args:
            path: Secret path (e.g., "openai", "postgres")

        Returns:
            Secret data dictionary

        Raises:
            ConnectionError: Vault is unavailable
            PermissionError: Authentication failed
            KeyError: Secret not found
        """
        try:
            client = self._get_client()
        except Exception as e:
            logger.warning(f"Vault connection failed for path '{path}': {e}")
            logger.warning("Falling back to environment variables (development mode)")
            return self._fallback_to_env(path)

        try:
            # KV v2 path format: /v1/{mount_point}/data/{path}
            full_path = f"{self.config.mount_point}/data/{path}"
            response = client.secrets.kv.v2.read_secret_version(path=full_path)

            if response and 'data' in response and 'data' in response['data']:
                return response['data']['data']
            else:
                logger.warning(f"Secret not found at path: {path}")
                logger.warning("Falling back to environment variables (development mode)")
                return self._fallback_to_env(path)
        except hvac.exceptions.Forbidden:
            logger.error(f"Vault authentication failed for path '{path}': Forbidden")
            raise PermissionError(f"Vault authentication failed for path: {path}")
        except hvac.exceptions.InvalidPath:
            logger.warning(f"Invalid Vault path: {path}")
            logger.warning("Falling back to environment variables (development mode)")
            return self._fallback_to_env(path)
        except Exception as e:
            logger.warning(f"Vault read failed for path '{path}': {e}")
            logger.warning("Falling back to environment variables (development mode)")
            return self._fallback_to_env(path)
    
    def _fallback_to_env(self, path: str) -> dict:
        """
        Fallback to environment variables for development.
        
        Constitutional: This is temporary for migration. Remove after Vault migration complete.
        """
        env_mapping = {
            'openai': {'api_key': os.getenv('OPENAI_API_KEY')},
            'anthropic': {'api_key': os.getenv('ANTHROPIC_API_KEY')},
            'postgres': {
                'password': os.getenv('POSTGRES_PASSWORD'),
                'user': os.getenv('POSTGRES_USER'),
                'host': os.getenv('POSTGRES_HOST'),
                'port': os.getenv('POSTGRES_PORT'),
                'database': os.getenv('POSTGRES_DB')
            },
            'qdrant': {'api_key': os.getenv('QDRANT_API_KEY')},
            'jwt': {'signing_key': os.getenv('JWT_SECRET')},
            'google-drive': {'client_secret': os.getenv('GOOGLE_CLIENT_SECRET')}
        }
        
        return env_mapping.get(path, {})
    
    # LLM Provider Secrets
    def get_openai_key(self) -> Optional[str]:
        """Get OpenAI API key."""
        secret = self._get_secret('openai')
        return secret.get('api_key')
    
    def get_anthropic_key(self) -> Optional[str]:
        """Get Anthropic API key."""
        secret = self._get_secret('anthropic')
        return secret.get('api_key')
    
    def get_google_api_key(self) -> Optional[str]:
        """Get Google API key."""
        secret = self._get_secret('google')
        return secret.get('api_key')
    
    # Database Secrets
    def get_postgres_password(self) -> Optional[str]:
        """Get PostgreSQL password."""
        secret = self._get_secret('postgres')
        return secret.get('password')
    
    def get_postgres_config(self) -> dict:
        """Get full PostgreSQL configuration."""
        secret = self._get_secret('postgres')
        return {
            'user': secret.get('user'),
            'password': secret.get('password'),
            'host': secret.get('host'),
            'port': secret.get('port'),
            'database': secret.get('database')
        }
    
    # Vector Database Secrets
    def get_qdrant_key(self) -> Optional[str]:
        """Get Qdrant API key."""
        secret = self._get_secret('qdrant')
        return secret.get('api_key')
    
    # Authentication Secrets
    def get_jwt_signing_key(self) -> Optional[str]:
        """Get JWT signing key."""
        secret = self._get_secret('jwt')
        return secret.get('signing_key')
    
    # Google Drive Secrets
    def get_google_drive_secret(self) -> Optional[str]:
        """Get Google Drive client secret."""
        secret = self._get_secret('google-drive')
        return secret.get('client_secret')
    
    # Generic Secret Access
    def get_secret(self, path: str, key: str) -> Optional[str]:
        """
        Get specific secret key from path.
        
        Args:
            path: Secret path
            key: Secret key
        
        Returns:
            Secret value
        """
        secret = self._get_secret(path)
        return secret.get(key)
    
    def health(self) -> dict:
        """Check Vault health status."""
        try:
            client = self._get_client()
            status = client.sys.read_health_status()
            
            return {
                'status': 'healthy',
                'initialized': status.get('initialized', False),
                'sealed': status.get('sealed', True),
                'standby': status.get('standby', False),
                'authenticated': self._authenticated
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'authenticated': self._authenticated
            }


# Global secret adapter instance
_secret_adapter: Optional[SecretAdapter] = None


def get_secret_adapter() -> SecretAdapter:
    """
    Get global SecretAdapter instance.
    
    Constitutional: Single source of truth for secret access.
    """
    global _secret_adapter
    
    if _secret_adapter is None:
        _secret_adapter = SecretAdapter()
    
    return _secret_adapter


def main():
    """Test SecretAdapter."""
    adapter = SecretAdapter()
    
    print("Secret Adapter Health Check:")
    health = adapter.health()
    print(f"  Status: {health['status']}")
    print(f"  Authenticated: {health['authenticated']}")
    
    print("\nTesting secret access:")
    print(f"  OpenAI Key: {adapter.get_openai_key()[:10] if adapter.get_openai_key() else 'None'}...")
    print(f"  Postgres Password: {adapter.get_postgres_password()[:5] if adapter.get_postgres_password() else 'None'}...")
    print(f"  Qdrant Key: {adapter.get_qdrant_key()[:10] if adapter.get_qdrant_key() else 'None'}...")
    print(f"  JWT Signing Key: {adapter.get_jwt_signing_key()[:10] if adapter.get_jwt_signing_key() else 'None'}...")


if __name__ == '__main__':
    main()
