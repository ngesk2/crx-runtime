# Secret Management Architecture

**Purpose:** Secure management of all secrets, credentials, and encryption keys

---

## Overview

Secret management is critical for system security. This architecture provides compatibility with multiple secret management systems while maintaining local-first principles.

---

## Design Principles

### 1. Environment Variable Based
- All secrets from environment variables
- No hardcoded secrets
- No secrets in code
- No secrets in configuration files

### 2. Multiple Provider Support
- HashiCorp Vault
- Docker Secrets
- Kubernetes Secrets
- SOPS
- age encryption
- File-based (development only)

### 3. Key Rotation
- Automated key rotation
- Zero-downtime rotation
- Graceful key transition
- Audit logging

### 4. Encryption
- Encryption at rest
- Encryption in transit
- Per-service encryption
- HSM compatibility

---

## Secret Categories

### Database Secrets
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_DB

### API Keys
- QDRANT_API_KEY
- VAULTWARDEN_ADMIN_TOKEN

### Authentication
- NEO4J_PASSWORD
- OPENSEARCH_PASSWORD
- JWT_SECRET

### Encryption Keys
- ENCRYPTION_MASTER_KEY
- BACKUP_ENCRYPTION_KEY

### Service Configuration
- TEMPORAL_HOST
- TEMPORAL_NAMESPACE
- KAFKA_BROKER

---

## Provider Compatibility

### HashiCorp Vault

#### Configuration
```bash
export VAULT_ADDR='http://vault:8200'
export VAULT_TOKEN='your-vault-token'
```

#### Usage
```python
import hvac

client = hvac.Client(url='http://vault:8200', token='your-vault-token')
secret = client.secrets.kv.v2.read_secret_version(path='brain/postgres')
password = secret['data']['data']['password']
```

#### Key Rotation
```bash
vault kv put brain/postgres password=new_password
```

### Docker Secrets

#### Configuration
```yaml
services:
  postgres:
    secrets:
      - postgres_password
secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

#### Usage
```bash
# Secret mounted at /run/secrets/postgres_password
export POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
```

### Kubernetes Secrets

#### Configuration
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  password: cGFzc3dvcmQ=  # base64 encoded
```

#### Usage
```yaml
env:
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-secret
        key: password
```

### SOPS

#### Configuration
```yaml
# .sops.yaml
creation_rules:
  - path_regex: secrets/.*
    kms: 'arn:aws:kms:...'
    gcp_kms: '...'
    azure_keyvault: '...'
    hc_vault: '...'
```

#### Usage
```bash
# Encrypt
sops --encrypt secrets.yaml > secrets.enc.yaml

# Decrypt
sops --decrypt secrets.enc.yaml > secrets.yaml
```

### age Encryption

#### Configuration
```bash
# Generate key
age-keygen -o key.txt

# Encrypt
age -r age1xyz... -o secrets.enc.yaml secrets.yaml

# Decrypt
age -d -i key.txt secrets.enc.yaml > secrets.yaml
```

---

## Key Rotation Procedures

### Database Password Rotation

#### Step 1: Generate New Password
```bash
openssl rand -base64 32
```

#### Step 2: Update Secret Store
```bash
# Vault
vault kv put brain/postgres password=new_password

# Kubernetes
kubectl create secret generic postgres-secret --from-literal=password=new_password
```

#### Step 3: Update Configuration
```bash
# Update environment variable
export POSTGRES_PASSWORD=new_password
```

#### Step 4: Restart Services
```bash
docker-compose restart postgres
```

#### Step 5: Verify
```bash
docker-compose exec postgres psql -U brain_user -d brain_db -c "SELECT 1"
```

### Encryption Key Rotation

#### Step 1: Generate New Key
```bash
openssl rand -base64 32
```

#### Step 2: Re-encrypt Data
```python
# Decrypt with old key
data = decrypt(old_key, encrypted_data)

# Encrypt with new key
new_encrypted_data = encrypt(new_key, data)
```

#### Step 3: Update Configuration
```bash
export ENCRYPTION_MASTER_KEY=new_key
```

#### Step 4: Restart Services
```bash
docker-compose restart
```

---

## Recovery Procedures

### Lost Vault Token

#### Step 1: Unseal Vault
```bash
vault operator unseal <unseal_key_1>
vault operator unseal <unseal_key_2>
vault operator unseal <unseal_key_3>
```

#### Step 2: Generate New Token
```bash
vault token create -policy=default
```

### Lost Kubernetes Secret

#### Step 1: Recreate Secret
```bash
kubectl create secret generic postgres-secret --from-literal=password=new_password
```

#### Step 2: Update Deployment
```bash
kubectl rollout restart deployment/postgres
```

### Lost Encryption Key

#### Step 1: Restore from Backup
```bash
# Decrypt backup with recovery key
age -d -i recovery_key.txt backup.enc > backup.tar
```

#### Step 2: Extract Keys
```bash
tar -xf backup.tar
```

#### Step 3: Update Configuration
```bash
export ENCRYPTION_MASTER_KEY=recovered_key
```

---

## Encrypted Backup Documentation

### Backup Encryption

#### Encryption Method
- AES-256-GCM
- Per-backup keys
- Key derivation from master key
- Authentication tags

#### Encryption Script
```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os

def encrypt_backup(data: bytes, master_key: bytes) -> bytes:
    """Encrypt backup with master key."""
    # Generate per-backup key
    backup_key = os.urandom(32)
    
    # Encrypt data with backup key
    aesgcm = AESGCM(backup_key)
    nonce = os.urandom(12)
    encrypted_data = aesgcm.encrypt(nonce, data, None)
    
    # Encrypt backup key with master key
    key_aesgcm = AESGCM(master_key)
    key_nonce = os.urandom(12)
    encrypted_key = key_aesgcm.encrypt(key_nonce, backup_key, None)
    
    # Return nonce + encrypted_key + nonce + encrypted_data
    return nonce + encrypted_key + key_nonce + encrypted_data
```

### Backup Decryption

#### Decryption Script
```python
def decrypt_backup(encrypted_data: bytes, master_key: bytes) -> bytes:
    """Decrypt backup with master key."""
    # Extract nonces and encrypted data
    data_nonce = encrypted_data[:12]
    encrypted_key = encrypted_data[12:44]
    key_nonce = encrypted_data[44:56]
    encrypted_backup = encrypted_data[56:]
    
    # Decrypt backup key with master key
    key_aesgcm = AESGCM(master_key)
    backup_key = key_aesgcm.decrypt(key_nonce, encrypted_key, None)
    
    # Decrypt data with backup key
    data_aesgcm = AESGCM(backup_key)
    data = data_aesgcm.decrypt(data_nonce, encrypted_backup, None)
    
    return data
```

---

## HSM Compatibility

### HSM Integration

#### Configuration
```python
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

def sign_with_hsm(data: bytes, hsm_slot: int):
    """Sign data with HSM."""
    # Initialize HSM
    hsm = initialize_hsm(slot=hsm_slot)
    
    # Sign data
    signature = hsm.sign(
        data,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    return signature
```

#### Key Generation
```python
def generate_key_in_hsm(hsm_slot: int):
    """Generate key in HSM."""
    hsm = initialize_hsm(slot=hsm_slot)
    
    key = hsm.generate_key(
        key_type='RSA',
        key_length=4096
    )
    
    return key
```

---

## Audit Logging

### Secret Access Logging

#### Log Format
```json
{
  "timestamp": "2026-06-14T18:00:00Z",
  "action": "secret_access",
  "secret_id": "postgres_password",
  "user": "service_account",
  "ip_address": "10.0.0.1",
  "success": true
}
```

#### Logging Script
```python
import json
from datetime import datetime

def log_secret_access(secret_id: str, user: str, success: bool):
    """Log secret access."""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "action": "secret_access",
        "secret_id": secret_id,
        "user": user,
        "ip_address": "10.0.0.1",
        "success": success
    }
    
    with open('/logs/security/secret_access.log', 'a') as f:
        f.write(json.dumps(log_entry) + '\n')
```

---

## Security Incident Recovery

### Compromised Secret

#### Step 1: Identify Scope
```bash
# Check access logs
grep "postgres_password" /logs/security/secret_access.log
```

#### Step 2: Rotate Secret
```bash
# Generate new password
openssl rand -base64 32

# Update secret store
vault kv put brain/postgres password=new_password
```

#### Step 3: Update Services
```bash
docker-compose restart postgres
```

#### Step 4: Monitor
```bash
# Watch for suspicious activity
tail -f /logs/security/secret_access.log
```

---

## Best Practices

### 1. Never Commit Secrets
- Use .gitignore
- Use environment variables
- Use secret management systems
- Audit code for secrets

### 2. Use Strong Secrets
- Minimum 32 characters
- Mix of character types
- No dictionary words
- No personal information

### 3. Rotate Regularly
- Database passwords: 90 days
- API keys: 180 days
- Encryption keys: 365 days
- JWT secrets: 90 days

### 4. Use Least Privilege
- Separate secrets per service
- Minimal access rights
- Time-limited tokens
- IP restrictions

### 5. Monitor Access
- Log all secret access
- Alert on unusual access
- Regular access reviews
- Audit trail verification
