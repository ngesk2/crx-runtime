"""
Vault Setup Script

Initializes HashiCorp Vault with KV v2 secrets engine and stores initial secrets.

Usage:
    python setup_vault.py

This script:
1. Enables KV v2 secrets engine at /ping
2. Creates AppRole for authentication
3. Stores initial secrets (development mode)
4. Outputs role_id and secret_id for AppRole
"""

import os
import hvac
from typing import Dict


def setup_vault():
    """Setup Vault with KV v2 and initial secrets."""
    
    # Vault configuration
    vault_url = os.getenv('VAULT_URL', 'http://localhost:8200')
    root_token = os.getenv('VAULT_DEV_ROOT_TOKEN_ID', 'root')
    
    print(f"Connecting to Vault at {vault_url}")
    
    # Initialize client
    client = hvac.Client(url=vault_url, token=root_token)
    
    # Check Vault status
    health = client.sys.read_health_status()
    print(f"Vault Status: {health}")
    
    # Enable KV v2 secrets engine at /ping
    print("\nEnabling KV v2 secrets engine at /ping...")
    try:
        client.secrets.kv.v2.configure(
            mount_point='ping',
            options={'version': '2'}
        )
        print("KV v2 secrets engine enabled at /ping")
    except Exception as e:
        print(f"KV v2 may already be enabled: {e}")
    
    # Enable AppRole authentication
    print("\nEnabling AppRole authentication...")
    try:
        client.auth.approle.configure()
        print("AppRole authentication enabled")
    except Exception as e:
        print(f"AppRole may already be enabled: {e}")
    
    # Create AppRole for PING application
    print("\nCreating AppRole 'ping-app'...")
    try:
        client.auth.approle.create_or_update_role(
            role_name='ping-app',
            token_ttl='1h',
            token_max_ttl='4h',
            token_policies=['default']
        )
        print("AppRole 'ping-app' created")
    except Exception as e:
        print(f"AppRole may already exist: {e}")
    
    # Get role_id and secret_id
    print("\nGetting AppRole credentials...")
    role_id_response = client.auth.approle.read_role_id(role_name='ping-app')
    role_id = role_id_response['data']['role_id']
    
    secret_id_response = client.auth.approle.create_secret_id(role_name='ping-app')
    secret_id = secret_id_response['data']['secret_id']
    
    print(f"Role ID: {role_id}")
    print(f"Secret ID: {secret_id}")
    print("\nIMPORTANT: Store these credentials securely!")
    print("Add to environment:")
    print(f"  VAULT_ROLE_ID={role_id}")
    print(f"  VAULT_SECRET_ID={secret_id}")
    
    # Store initial secrets from environment (development mode)
    print("\nStoring initial secrets from environment...")
    
    secrets_to_store = {
        'openai': {
            'api_key': os.getenv('OPENAI_API_KEY', 'dev-key-placeholder')
        },
        'anthropic': {
            'api_key': os.getenv('ANTHROPIC_API_KEY', 'dev-key-placeholder')
        },
        'postgres': {
            'password': os.getenv('POSTGRES_PASSWORD', 'dev-password'),
            'user': os.getenv('POSTGRES_USER', 'postgres'),
            'host': os.getenv('POSTGRES_HOST', 'localhost'),
            'port': os.getenv('POSTGRES_PORT', '5432'),
            'database': os.getenv('POSTGRES_DB', 'crx_runtime')
        },
        'qdrant': {
            'api_key': os.getenv('QDRANT_API_KEY', 'dev-key-placeholder')
        },
        'jwt': {
            'signing_key': os.getenv('JWT_SECRET', 'dev-signing-key-placeholder')
        },
        'google-drive': {
            'client_secret': os.getenv('GOOGLE_CLIENT_SECRET', 'dev-secret-placeholder')
        }
    }
    
    for path, secret_data in secrets_to_store.items():
        try:
            client.secrets.kv.v2.create_or_update_secret(
                path=path,
                secret=secret_data,
                mount_point='ping'
            )
            print(f"  Stored secret at: ping/{path}")
        except Exception as e:
            print(f"  Error storing secret at {path}: {e}")
    
    print("\nVault setup complete!")
    print("\nNext steps:")
    print("1. Add VAULT_ROLE_ID and VAULT_SECRET_ID to your environment")
    print("2. Update applications to use SecretAdapter")
    print("3. Remove secrets from .env files")
    print("4. For production: disable dev mode and use proper Vault configuration")


if __name__ == '__main__':
    setup_vault()
