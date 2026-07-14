# Secrets Management Guide

## Overview

This document describes how to manage secrets for PING infrastructure across Oracle Cloud and Fly.io.

## Principles

1. **Never commit secrets to git**
2. **Use environment variables for runtime secrets**
3. **Use Vault for sensitive data (optional)**
4. **Rotate secrets regularly**
5. **Use least privilege access**

## Required Secrets

### Oracle Cloud

**Database:**
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password

**Grafana:**
- `GRAFANA_USER` - Admin username
- `GRAFANA_PASSWORD` - Admin password

**SSL/TLS:**
- `ACME_EMAIL` - Email for Let's Encrypt

**API Keys (optional):**
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key

### Fly.io

**Oracle Connection:**
- `ORACLE_POSTGRES_URL` - Postgres connection string
- `ORACLE_QDRANT_URL` - Qdrant connection string
- `ORACLE_TEMPORAL_URL` - Temporal connection string

### Optional

**GitHub:**
- `GITHUB_PAT` - Personal access token for repository operations

**Vault:**
- `VAULT_ADDR` - Vault server address
- `VAULT_TOKEN` - Vault authentication token

**Oracle Cloud SDK:**
- `OCI_TENANCY_ID` - Oracle Cloud tenancy ID
- `OCI_USER_ID` - Oracle Cloud user ID
- `OCI_FINGERPRINT` - SSH key fingerprint
- `OCI_PRIVATE_KEY_PATH` - Path to private key
- `OCI_REGION` - Oracle Cloud region

## Secret Management Methods

### Method 1: Environment Variables (.env)

**For Oracle Cloud:**

```bash
# On Oracle instance
cd /opt/ping
cp .env.example .env
vim .env
```

**For Local Development:**

```bash
cp infra/.env.example .env
vim .env
```

**For Fly.io:**

```bash
flyctl secrets set POSTGRES_PASSWORD="your-password" --app ping-api-gateway
flyctl secrets set POSTGRES_PASSWORD="your-password" --app ping-omniroute
flyctl secrets set POSTGRES_PASSWORD="your-password" --app ping-webhook
flyctl secrets set POSTGRES_PASSWORD="your-password" --app ping-worker
```

### Method 2: Vault (Optional)

**Install Vault:**

```bash
# On Oracle
sudo apt install vault
```

**Configure Vault:**

```bash
# Set VAULT_ADDR and VAULT_TOKEN in .env
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=your-token
```

**Store Secrets:**

```bash
# Write secrets to Vault
vault kv put secret/ping/postgres \
    db=ping \
    user=ping \
    password="your-password"

vault kv put secret/ping/grafana \
    user=admin \
    password="your-password"

vault kv put secret/ping/api-keys \
    openai="sk-..." \
    anthropic="sk-ant-..."
```

**Retrieve Secrets:**

```bash
# In application startup
vault kv get -field=password secret/ping/postgres
vault kv get -field=password secret/ping/grafana
```

### Method 3: Oracle Cloud Vault (Optional)

Use Oracle Cloud Vault for Oracle-specific secrets:

```bash
# Install OCI CLI
sudo apt install python3-pip
pip3 install oci-cli

# Configure
oci setup config

# Store secrets
oci secrets secret-base create --compartment-id $COMPARTMENT_ID \
    --secret-name "PING_POSTGRES_PASSWORD" \
    --secret-description "Postgres password for PING" \
    --secret-content-content "your-password"
```

## Secret Rotation

### Database Passwords

```bash
# On Oracle
docker-compose exec postgres psql -U ping -d ping -c "ALTER USER ping WITH PASSWORD 'new-password';"

# Update .env
vim /opt/ping/.env

# Restart services
systemctl restart ping-runtime
```

### API Keys

Rotate API keys through provider dashboards:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/settings/keys

Update in .env or Vault, then restart services.

### Grafana Password

```bash
# On Oracle
docker-compose exec grafana grafana-cli admin reset-admin-password new-password

# Update .env
vim /opt/ping/.env
```

## Secret Generation

### Generate Strong Passwords

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using pwgen
sudo apt install pwgen
pwgen -s 32 1
```

### Generate SSH Keys

```bash
# Generate new key pair
ssh-keygen -t ed25519 -C "ping@oracle" -f ~/.ssh/ping_oracle

# Copy public key to Oracle
ssh-copy-id -i ~/.ssh/ping_oracle.pub ubuntu@<oracle-ip>
```

### Generate API Tokens

**GitHub PAT:**
1. Go to https://github.com/settings/tokens
2. Generate new token with required scopes
3. Store in .env or Vault

**Fly.io Token:**
1. Go to https://fly.io/user/personal_access_tokens
2. Generate new token
3. Use with `flyctl auth token`

## Secret Validation

### Validate .env

```bash
# Check for required secrets
grep -q "POSTGRES_PASSWORD" .env || echo "Missing POSTGRES_PASSWORD"
grep -q "GRAFANA_PASSWORD" .env || echo "Missing GRAFANA_PASSWORD"
```

### Test Database Connection

```bash
# On Oracle
docker-compose exec postgres pg_isready -U ping -d ping
```

### Test API Keys

```bash
# Test OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test GitHub
curl -H "Authorization: token $GITHUB_PAT" \
  https://api.github.com/user
```

## Security Best Practices

1. **Use different passwords for each service**
2. **Rotate secrets every 90 days**
3. **Use read-only API keys where possible**
4. **Limit API key scopes to minimum required**
5. **Monitor for secret leaks in logs**
6. **Use secret scanning tools (e.g., truffleHog)**
7. **Never share secrets via email/chat**
8. **Use encrypted communication for secret transfer**

## Emergency Procedures

### Compromised Secrets

If a secret is compromised:

1. **Immediately rotate the secret**
2. **Audit access logs**
3. **Check for unauthorized access**
4. **Review other secrets for compromise**
5. **Document the incident**
6. **Update security procedures**

### Lost Secrets

If you lose access to secrets:

1. **Database:** Reset via Docker Compose
2. **Grafana:** Reset via CLI
3. **API Keys:** Regenerate from provider
4. **SSH Keys:** Generate new key pair
5. **Vault:** Use recovery procedures

## Secret Backup

### Backup .env

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 .env > .env.gpg

# Decrypt backup
gpg --decrypt .env.gpg > .env
```

### Backup Vault

```bash
# Seal Vault
vault operator seal

# Unseal Vault
vault operator unseal
```

## Compliance

Ensure secret management complies with:
- GDPR (if handling EU data)
- SOC 2 (if required)
- Your organization's security policies

## Monitoring

Monitor for:
- Failed authentication attempts
- Unusual API usage
- Secret access patterns
- Configuration changes

Set up alerts in Grafana for:
- Failed login attempts
- API rate limits exceeded
- Unusual access patterns
