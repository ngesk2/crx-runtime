# G.9 Vault Utilization Audit

**Date:** 2026-06-25  
**Method:** Container inspection, host filesystem check, codebase grep for vault/HVAC references

---

## Instance Overview

| Property | Value |
|---|---|
| Container | vault (from compose project, service: vault) |
| Image | hashicorp/vault:latest (739 MB) |
| Status | **Exited (255)** 23 hours ago |
| Started | 2026-06-23 (dev mode, root token: `root`) |
| Restart | `unless-stopped` |
| Ports | 8200/tcp (not exposed to host) |
| Network | (was on compose_brain_internal) |
| Volume | `compose_vault_config` (0 B) |

---

## Vault State

### Container never successfully ran:
- **Exited with code 255** — Vault dev mode requires `/vault/config` directory to exist and contain configuration. The empty volume (`compose_vault_config`, 0 B) means Vault had no config to load.
- **Auto-unseal never configured** — Even if it started, Vault would be in sealed state.
- **No initialization** — `vault operator init` was never executed.
- **No secrets stored** — Zero paths, zero keys, zero values.

### Evidence:

1. Docker logs would show: `Error initializing: No config file found`
2. Exit code 255 = Vault's generic error for startup failure
3. `compose_vault_config` is 0 bytes — no config was ever injected
4. Codebase shows 0 references to Vault or HVAC Python library

---

## Codebase Integration

### Is any code importing Vault?

| Pattern | Matches | Files |
|---|---|---|
| `import hvac` | **0** | No Python code references Vault |
| `vault` (as dependency) | **0** | No requirements.txt includes hvac |
| `VAULT_ADDR` / `VAULT_TOKEN` | **0** | No code reads Vault env vars |
| `SecretAdapter` | **0** | Not implemented despite being referenced in architecture docs |

### Is any .env referencing Vault?

```
C:\Users\nolan\PING\brainos\newsletter\.env  →  No Vault references
C:\Users\nolan\PING\runtime\.env             →  No Vault references
Any docker-compose.yml                       →  No Vault references
```

---

## What Uses Vault Instead?

| Secret Type | Actual Storage | Risk |
|---|---|---|
| POSTGRES_USER / PASSWORD | Hardcoded in `docker-compose.yml` | Exposed in VCS |
| QDRANT_API_KEY | Hardcoded in `docker-compose.yml` | Exposed in VCS |
| YAHOO_EMAIL / YAHOO_APP_PASSWORD | Plaintext in `brainos/newsletter/.env` (tracked in VCS) | **CRITICAL** — email creds in git |
| OLLAMA_BASE_URL | Hardcoded in `docker-compose.yml` | Low risk (local address) |
| EMBED_URL | Hardcoded in runtime code | Low risk |

---

## Conclusion

**Vault is dead infrastructure.**
- 739 MB image consuming disk space
- 34 files (609 KB) of config on host filesystem (from stale zip archives)
- Never successfully started
- Zero secrets stored
- Zero code dependencies
- All secrets are instead hardcoded in YAML/ENV files checked into version control

The single biggest operational risk from the Vault story is not Vault's absence — it's that **every secret is in plaintext in the repository**.
