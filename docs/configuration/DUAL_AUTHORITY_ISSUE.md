# Dual Authority Issue: Configuration Architecture

**Date:** 2026-06-25
**Scope:** PING Cognitive Operating System
**Status:** DOCUMENTED FOR FUTURE SPRINT

---

## Problem Statement

**Constitutional Law:** Business logic must NEVER directly access environment variables or secrets.

**Current Violation:** The runtime configuration module still contains direct environment variable reads for non-secret configuration:

```python
# runtime/configuration.py
def get_postgres_config(self) -> Dict[str, Any]:
    return {
        "host": os.getenv("POSTGRES_HOST", "localhost"),      # Direct env read
        "port": int(os.getenv("POSTGRES_PORT", "5432")),      # Direct env read
        "database": os.getenv("POSTGRES_DB", "crx_runtime"),   # Direct env read
        "user": os.getenv("POSTGRES_USER", "postgres"),       # Direct env read
        "password": self.secret_adapter.get_postgres_password() or os.getenv("POSTGRES_PASSWORD", "postgres")  # Secret via SecretAdapter
    }
```

Similarly for Qdrant, Ollama, and other services.

---

## Current Authority Chain

### Secret Authority (Correct)
```
Worker
    ↓
Configuration
    ↓
SecretAdapter
    ↓
Vault
```

### Non-Secret Configuration Authority (Incorrect)
```
Worker
    ↓
Configuration
    ↓
os.getenv (direct environment access)
```

---

## The Issue

**Two Configuration Authorities Exist:**

1. **SecretAdapter** - Constitutional authority for secrets
2. **os.getenv** - Direct environment access for non-secret configuration

This violates the constitutional principle of **single authority** for all configuration access.

---

## Constitutional Recommendation

### Target Architecture

```
Business Logic
        ↓
ConfigurationAuthority
        ↓
SecretAuthority
        ↓
Vault

        ↓
ConfigurationStore
```

### Single Authority for All Configuration

**ConfigurationAuthority** should become the single authority for:
- Ports
- Hosts
- URLs
- Database names
- Collection names
- Feature flags
- API endpoints
- Secrets (delegated to SecretAuthority)

**Key Principle:** The authority owns every runtime decision. It merely asks the SecretAuthority for credentials.

### ConfigurationStore

**ConfigurationStore** should provide:
- Centralized configuration management
- Environment-specific overrides
- Configuration validation
- Type safety
- Runtime reconfiguration support
- Audit trail for configuration changes

---

## Implementation Strategy

### Phase 1: ConfigurationAuthority Creation
- Create `runtime/configuration_authority.py`
- Migrate all `os.getenv` calls to ConfigurationAuthority
- ConfigurationAuthority reads from ConfigurationStore
- ConfigurationAuthority delegates secrets to SecretAuthority

### Phase 2: ConfigurationStore Implementation
- Implement ConfigurationStore (could be Vault KV, database, or file-based)
- Migrate `.env.base` to ConfigurationStore
- Add configuration validation
- Add configuration change audit trail

### Phase 3: Remove Direct Environment Access
- Remove all `os.getenv` calls from business logic
- Remove all `os.getenv` calls from configuration module
- All configuration flows through ConfigurationAuthority

### Phase 4: SecretAdapter Dependency Injection
- Remove SecretAdapter's internal environment dependency
- SecretAdapter should receive fully-constructed configuration object
- ConfigurationAuthority constructs VaultConfig and passes to SecretAuthority
- Eliminates final hidden environment dependency

### Phase 5: Runtime Reconfiguration
- Add hot-reload support for configuration changes
- Add configuration change notifications
- Add configuration rollback support

---

## Benefits

1. **Single Authority** - All configuration flows through one authority
2. **Constitutional Compliance** - No direct environment access
3. **Audit Trail** - All configuration changes are tracked
4. **Validation** - Configuration is validated before use
5. **Type Safety** - Configuration types are enforced
6. **Runtime Reconfiguration** - Configuration can be changed without restart
7. **Environment Consistency** - Same configuration structure across environments
8. **Clear Hierarchy** - Authority owns decisions, SecretAuthority provides credentials

---

## Risks

1. **Complexity** - Additional layer of indirection
2. **Migration Effort** - Requires updating all configuration access
3. **Performance** - Additional lookup overhead (minimal)
4. **Debugging** - More layers to debug configuration issues

---

## Mitigation

1. **Complexity** - Keep ConfigurationAuthority simple, delegate to SecretAuthority and ConfigurationStore
2. **Migration Effort** - Gradual migration, maintain backward compatibility during transition
3. **Performance** - Cache configuration, lazy loading
4. **Debugging** - Add comprehensive logging, configuration inspection tools

---

## Current Status

**SecretAdapter Enforcement:** ✅ COMPLETE (95%)
- All secrets flow through SecretAdapter
- SecretAdapter has improved error handling
- Distinguishes Vault failure types (connection, authentication, missing secret)
- Raises PermissionError on authentication failures (no silent fallback)
- **Remaining Issue:** SecretAdapter still constructs VaultConfig from environment variables internally
- **Long-term Goal:** SecretAdapter should receive fully-constructed configuration object via dependency injection

**Configuration Authority:** ❌ DUAL AUTHORITY (75%)
- Secrets: SecretAdapter (constitutional)
- Non-secrets: os.getenv (non-constitutional)
- Violates single authority principle
- Configuration is split between two authorities

**Import Authority:** ✅ FIXED (100%)
- Removed sys.path.append drift
- All imports use proper package paths
- No hidden runtime import behavior

**Deployment Authority:** ✅ GOOD (90%)
- Docker Compose consolidation complete
- Canonical environment file (.env.base) established
- All services use env_file injection

**Runtime Determinism Impact:** VERY LOW RISK
- Configuration changes do not affect replay determinism
- SecretAdapter fallback behavior is consistent across environments

---

## Recommended Next Sprint

**Sprint Name:** Configuration Authority Unification

**Priority:** MEDIUM (after pipeline verification complete)

**Scope:**
1. Create ConfigurationAuthority
2. Implement ConfigurationStore
3. Migrate non-secret configuration to ConfigurationAuthority
4. Remove direct os.getenv calls
5. Add configuration validation
6. Add configuration audit trail
7. SecretAdapter dependency injection (remove internal environment dependency)

**Success Criteria:**
- All configuration flows through ConfigurationAuthority
- No direct os.getenv calls in business logic
- No direct os.getenv calls in configuration module
- ConfigurationAuthority delegates secrets to SecretAuthority
- ConfigurationAuthority reads non-secrets from ConfigurationStore
- Configuration changes are audited
- Configuration is validated before use
- SecretAdapter receives VaultConfig via dependency injection (no internal environment construction)

---

## Related Documents

- `CONFIGURATION_CONSOLIDATION_PLAN.md` - Configuration consolidation strategy
- `CONFIGURATION_DRIFT_RESOLVED.md` - Configuration drift resolution
- `SECURITY_CONFIGURATION_REPORT.md` - Security validation
- `runtime/configuration.py` - Current configuration module
- `runtime/constitutional/secret_adapter.py` - Secret authority adapter

---

## Constitutional Maturity Assessment

| Area | Status | Score | Notes |
|------|--------|-------|-------|
| Secret Authority | ✅ Good | 95% | All secrets flow through SecretAdapter, improved error handling, PermissionError on auth failures. Remaining: SecretAdapter still constructs VaultConfig from environment internally. |
| Configuration Authority | ⚠️ Partial | 75% | Secrets centralized, but configuration split between SecretAdapter and os.getenv. Violates single authority principle. |
| Import Authority | ✅ Complete | 100% | Removed sys.path.append drift, all imports use proper package paths, no hidden runtime import behavior. |
| Deployment Authority | ✅ Good | 90% | Docker Compose consolidation complete, canonical environment file established, all services use env_file injection. |
| Runtime Determinism Impact | ✅ Low Risk | Very Low | Configuration changes do not affect replay determinism, SecretAdapter fallback behavior is consistent. |

**Overall Constitutional Maturity: 87%**

---

## Constitutional Law Reference

**Law:** Business logic must NEVER directly access environment variables or secrets.

**Current Status:** PARTIALLY COMPLIANT
- Secrets: COMPLIANT (via SecretAdapter)
- Non-secrets: NON-COMPLIANT (direct os.getenv)

**Target Status:** FULLY COMPLIANT
- All configuration via ConfigurationAuthority
- ConfigurationAuthority delegates to SecretAuthority and ConfigurationStore
- No direct environment access anywhere in business logic
- SecretAdapter receives VaultConfig via dependency injection (no internal environment construction)

---

## Long-term Goal: Eliminate SecretAdapter Environment Dependency

**Current Issue:**
```python
# SecretAdapter.__init__() still constructs VaultConfig from environment
config = VaultConfig(
    url=os.getenv('VAULT_URL', 'http://localhost:8200'),
    role_id=os.getenv('VAULT_ROLE_ID'),
    secret_id=os.getenv('VAULT_SECRET_ID'),
    token=os.getenv('VAULT_TOKEN'),
    mount_point=os.getenv('VAULT_MOUNT_POINT', 'ping')
)
```

**Target Architecture:**
```python
# ConfigurationAuthority constructs VaultConfig and passes to SecretAuthority
vault_config = VaultConfig(
    url=configuration_store.get_vault_url(),
    role_id=configuration_store.get_vault_role_id(),
    secret_id=configuration_store.get_vault_secret_id(),
    token=configuration_store.get_vault_token(),
    mount_point=configuration_store.get_vault_mount_point()
)
secret_adapter = SecretAdapter(config=vault_config)
```

**Benefits:**
- Removes final hidden environment dependency
- ConfigurationAuthority owns all configuration decisions
- SecretAuthority only provides credential access
- Clear separation of concerns
- Easier testing (mock VaultConfig without environment)
- Consistent with constitutional authority hierarchy
