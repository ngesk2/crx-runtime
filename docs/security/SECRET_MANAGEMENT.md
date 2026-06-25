# Secret Management

## Overview

This document defines the canonical secret management strategy for the PING Cognitive Operating System.

**Version:** v1
**Stability:** Stable
**Last Updated:** 2026-06-25

---

## Canonical Secret Locations

### Directory Structure

```
C:\PING\secrets\
├── github\
│   └── github_app_private_key.pem
├── database\
│   ├── postgres_password.txt
│   └── qdrant_api_key.txt
├── api\
│   ├── openai_api_key.txt
│   └── anthropic_api_key.txt
└── .gitkeep
```

### Secret Types

| Secret Type | Location | Environment Variable |
|--------------|----------|---------------------|
| GitHub App Private Key | `secrets/github/github_app_private_key.pem` | `GITHUB_APP_PRIVATE_KEY_PATH` |
| PostgreSQL Password | `secrets/database/postgres_password.txt` | `POSTGRES_PASSWORD` |
| Qdrant API Key | `secrets/database/qdrant_api_key.txt` | `QDRANT_API_KEY` |
| OpenAI API Key | `secrets/api/openai_api_key.txt` | `OPENAI_API_KEY` |
| Anthropic API Key | `secrets/api/anthropic_api_key.txt` | `ANTHROPIC_API_KEY` |

---

## Secret Hygiene Rules

### Rule 1: No Secrets in Version Control

**Prohibited:**
- Secrets in `.env` files
- Secrets in code
- Secrets in configuration files
- Secrets in documentation
- Secrets in comments

**Required:**
- Secrets in canonical locations only
- Secrets referenced via environment variables
- `.env.example` contains placeholder values only
- `.gitignore` excludes all secret files

---

### Rule 2: No Secrets in Environment Files

**Prohibited:**
```env
# WRONG - secret in .env
POSTGRES_PASSWORD=mysecretpassword
GITHUB_APP_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
```

**Required:**
```env
# CORRECT - reference to secret location
POSTGRES_PASSWORD_FILE=secrets/database/postgres_password.txt
GITHUB_APP_PRIVATE_KEY_PATH=secrets/github/github_app_private_key.pem
```

---

### Rule 3: No Secrets in Code

**Prohibited:**
```python
# WRONG - secret in code
postgres_password = "mysecretpassword"
github_key = "-----BEGIN PRIVATE KEY-----"
```

**Required:**
```python
# CORRECT - secret from environment
import os

postgres_password = os.getenv("POSTGRES_PASSWORD")
github_key_path = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")

with open(github_key_path, "rb") as f:
    github_key = f.read()
```

---

### Rule 4: Secrets in Canonical Locations Only

**Prohibited:**
- Secrets in `Downloads/`
- Secrets in `Desktop/`
- Secrets in `Documents/`
- Secrets in user home directory
- Secrets in temporary directories

**Required:**
- Secrets in `C:\PING\secrets\`
- Secrets in subdirectories by type
- Secrets with descriptive filenames
- Secrets with restricted permissions

---

### Rule 5: Secrets Referenced via Environment Variables

**Prohibited:**
```python
# WRONG - hardcoded secret path
with open("C:\\Users\\nolan\\Downloads\\key.pem", "rb") as f:
    key = f.read()
```

**Required:**
```python
# CORRECT - environment variable
import os

key_path = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")
with open(key_path, "rb") as f:
    key = f.read()
```

---

## Secret Permissions

### File Permissions

**Windows:**
```powershell
# Owner: Full Control
# Group: No permissions
# Others: No permissions

icacls "C:\PING\secrets\github\github_app_private_key.pem" /inheritance:r
icacls "C:\PING\secrets\github\github_app_private_key.pem" /grant:r "%USERNAME%:F"
```

**Linux/WSL:**
```bash
# Owner: read-only
# Group: no permissions
# Others: no permissions

chmod 400 secrets/github/github_app_private_key.pem
```

### Directory Permissions

**Windows:**
```powershell
# Owner: Full Control
# Group: Read and Execute
# Others: No permissions

icacls "C:\PING\secrets" /inheritance:r
icacls "C:\PING\secrets" /grant:r "%USERNAME%:F"
icacls "C:\PING\secrets" /grant:r "SYSTEM:RX"
```

**Linux/WSL:**
```bash
# Owner: read, write, execute
# Group: no permissions
# Others: no permissions

chmod 700 secrets
```

---

## Secret Rotation

### Rotation Strategy

**Frequency:**
- GitHub App Keys: Every 90 days
- Database Passwords: Every 180 days
- API Keys: Every 90 days

**Process:**
1. Generate new secret
2. Update secret file
3. Update environment variables
4. Restart services
5. Verify services work
6. Archive old secret (encrypted)

### Rotation Checklist

- [ ] Generate new secret
- [ ] Update secret file in canonical location
- [ ] Update environment variables
- [ ] Restart affected services
- [ ] Verify service health
- [ ] Archive old secret
- [ ] Update documentation
- [ ] Notify team

---

## Secret Backup

### Backup Strategy

**Location:** Encrypted backup storage

**Frequency:** Daily

**Retention:** 90 days

**Encryption:** AES-256

**Process:**
```bash
# Encrypt secrets
tar -czf secrets.tar.gz secrets/
openssl enc -aes-256-cbc -salt -in secrets.tar.gz -out secrets.tar.gz.enc

# Upload to secure storage
aws s3 cp secrets.tar.gz.enc s3://secure-backup/secrets/
```

---

## Secret Audit

### Audit Frequency

**Automated:** Daily

**Manual:** Weekly

### Audit Checklist

- [ ] No secrets in version control
- [ ] No secrets in environment files
- [ ] No secrets in code
- [ ] All secrets in canonical locations
- [ ] All secrets referenced via environment variables
- [ ] All secrets have correct permissions
- [ ] No expired secrets
- [ ] No unused secrets

---

## Secret Access Control

### Access Principles

**Principle of Least Privilege:**
- Services access only secrets they need
- Developers access only secrets for their services
- No shared secrets between services

**Access Logging:**
- All secret access logged
- Failed access attempts logged
- Regular access log review

**Access Revocation:**
- Immediate revocation on personnel departure
- Immediate revocation on key compromise
- Immediate revocation on service decommission

---

## GitHub App Secret Management

### Private Key Storage

**Location:** `C:\PING\secrets\github\github_app_private_key.pem`

**Environment Variable:** `GITHUB_APP_PRIVATE_KEY_PATH`

**Usage:**
```python
import os
from cryptography.hazmat.primitives import serialization

private_key_path = os.getenv("GITHUB_APP_PRIVATE_KEY_PATH")

with open(private_key_path, "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None
    )
```

### GitHub App Configuration

**Environment Variables:**
```env
GITHUB_APP_ID=your_app_id
GITHUB_APP_PRIVATE_KEY_PATH=C:\PING\secrets\github\github_app_private_key.pem
GITHUB_APP_WEBHOOK_SECRET=your_webhook_secret
```

---

## Database Secret Management

### PostgreSQL

**Location:** `C:\PING\secrets\database\postgres_password.txt`

**Environment Variable:** `POSTGRES_PASSWORD`

**Usage:**
```python
import os

postgres_password = os.getenv("POSTGRES_PASSWORD")

postgres_config = {
    "host": os.getenv("POSTGRES_HOST", "localhost"),
    "port": int(os.getenv("POSTGRES_PORT", "5432")),
    "database": os.getenv("POSTGRES_DB", "crx_runtime"),
    "user": os.getenv("POSTGRES_USER", "postgres"),
    "password": postgres_password
}
```

### Qdrant

**Location:** `C:\PING\secrets\database\qdrant_api_key.txt`

**Environment Variable:** `QDRANT_API_KEY`

**Usage:**
```python
import os

qdrant_api_key = os.getenv("QDRANT_API_KEY")

qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL", "http://localhost:6333"),
    api_key=qdrant_api_key
)
```

---

## API Key Secret Management

### OpenAI

**Location:** `C:\PING\secrets\api\openai_api_key.txt`

**Environment Variable:** `OPENAI_API_KEY`

**Usage:**
```python
import os

openai_api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=openai_api_key)
```

### Anthropic

**Location:** `C:\PING\secrets\api\anthropic_api_key.txt`

**Environment Variable:** `ANTHROPIC_API_KEY`

**Usage:**
```python
import os

anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

client = Anthropic(api_key=anthropic_api_key)
```

---

## Secret Generation

### Password Generation

**Requirements:**
- Minimum 32 characters
- Mix of uppercase, lowercase, numbers, symbols
- No dictionary words
- No predictable patterns

**Tool:** `openssl rand -base64 32`

### API Key Generation

**Requirements:**
- Minimum 64 characters
- Cryptographically random
- Base64 encoded
- No predictable patterns

**Tool:** `openssl rand -base64 48`

### SSH Key Generation

**Requirements:**
- ED25519 or RSA 4096+
- No passphrase for automated use
- Passphrase for manual use

**Tool:** `ssh-keygen -t ed25519 -C "comment"`

---

## Secret Compromise Response

### Immediate Actions

1. **Identify Compromise Scope**
   - Determine which secrets are compromised
   - Determine time window of compromise
   - Determine affected services

2. **Rotate Compromised Secrets**
   - Generate new secrets
   - Update secret files
   - Update environment variables
   - Restart services

3. **Audit Access Logs**
   - Review access logs during compromise window
   - Identify unauthorized access
   - Document findings

4. **Notify Stakeholders**
   - Notify security team
   - Notify service owners
   - Notify users if data exposure

5. **Post-Mortem**
   - Document root cause
   - Document timeline
   - Document remediation steps
   - Update prevention measures

---

## Secret Documentation

### Documentation Requirements

**For Each Secret:**
- Purpose
- Owner
- Rotation schedule
- Access requirements
- Dependencies

**Example:**
```markdown
## GitHub App Private Key

**Purpose:** Authenticate GitHub App for repository access

**Owner:** Platform Team

**Rotation Schedule:** Every 90 days

**Access Requirements:**
- Repository Runtime Service
- Repository Indexer

**Dependencies:**
- GitHub App ID
- GitHub App Webhook Secret
```

---

## Secret Testing

### Testing Strategy

**Unit Tests:**
- Test secret loading from environment
- Test secret file reading
- Test secret permission validation

**Integration Tests:**
- Test service authentication with secrets
- Test secret rotation process
- Test secret backup/restore

**Security Tests:**
- Test secret access control
- Test secret encryption
- Test secret audit compliance

---

## Compliance

### Regulatory Requirements

**GDPR:**
- Secret access logging
- Data breach notification
- Right to be forgotten

**SOC 2:**
- Secret access controls
- Secret rotation procedures
- Secret audit trails

**PCI DSS:**
- Secret encryption at rest
- Secret encryption in transit
- Secret access monitoring

---

## References

- `docs/security/SECRET_AUDIT.md` - Secret audit results
- `docs/security/HARDCODED_PATH_AUDIT.md` - Hardcoded path audit results
- `scripts/audit_secret_references.py` - Secret audit script
- `scripts/audit_hardcoded_paths.py` - Hardcoded path audit script
- `.gitignore` - Git ignore rules for secrets

---

## Summary

Secret management is critical for platform security. All secrets must:
- Reside in canonical locations only
- Be referenced via environment variables
- Have restricted permissions
- Be rotated regularly
- Be audited frequently
- Never appear in version control

This policy is constitutional and must be followed without exception.
