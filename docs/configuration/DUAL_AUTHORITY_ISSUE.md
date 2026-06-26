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
Worker
     ↓
ConfigurationAdapter
     ↓
SecretAdapter → Vault
     ↓
ConfigurationStore
```

### Single Authority for All Configuration

**ConfigurationAdapter** should become the single authority for:
- Ports
- Hosts
- URLs
- Database names
- Collection names
- Feature flags
- API endpoints
- Secrets (delegated to SecretAdapter)

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

### Phase 1: ConfigurationAdapter Creation
- Create `runtime/configuration_adapter.py`
- Migrate all `os.getenv` calls to ConfigurationAdapter
- ConfigurationAdapter reads from ConfigurationStore
- ConfigurationAdapter delegates secrets to SecretAdapter

### Phase 2: ConfigurationStore Implementation
- Implement ConfigurationStore (could be Vault KV, database, or file-based)
- Migrate `.env.base` to ConfigurationStore
- Add configuration validation
- Add configuration change audit trail

### Phase 3: Remove Direct Environment Access
- Remove all `os.getenv` calls from business logic
- Remove all `os.getenv` calls from configuration module
- All configuration flows through ConfigurationAdapter

### Phase 4: Runtime Reconfiguration
- Add hot-reload support for configuration changes
- Add configuration change notifications
- Add configuration rollback support

---

## Benefits

1. **Single Authority** - All configuration flows through one adapter
2. **Constitutional Compliance** - No direct environment access
3. **Audit Trail** - All configuration changes are tracked
4. **Validation** - Configuration is validated before use
5. **Type Safety** - Configuration types are enforced
6. **Runtime Reconfiguration** - Configuration can be changed without restart
7. **Environment Consistency** - Same configuration structure across environments

---

## Risks

1. **Complexity** - Additional layer of indirection
2. **Migration Effort** - Requires updating all configuration access
3. **Performance** - Additional lookup overhead (minimal)
4. **Debugging** - More layers to debug configuration issues

---

## Mitigation

1. **Complexity** - Keep ConfigurationAdapter simple, delegate to SecretAdapter and ConfigurationStore
2. **Migration Effort** - Gradual migration, maintain backward compatibility during transition
3. **Performance** - Cache configuration, lazy loading
4. **Debugging** - Add comprehensive logging, configuration inspection tools

---

## Current Status

**SecretAdapter Enforcement:** ✅ COMPLETE
- All secrets flow through SecretAdapter
- SecretAdapter has improved error handling
- Distinguishes Vault failure types (connection, authentication, missing secret)

**Configuration Authority:** ❌ DUAL AUTHORITY
- Secrets: SecretAdapter (constitutional)
- Non-secrets: os.getenv (non-constitutional)
- Violates single authority principle

**Import Authority:** ✅ FIXED
- Removed sys.path.append drift
- All imports use proper package paths
- No hidden runtime import behavior

---

## Recommended Next Sprint

**Sprint Name:** Configuration Authority Unification

**Priority:** MEDIUM (after pipeline verification complete)

**Scope:**
1. Create ConfigurationAdapter
2. Implement ConfigurationStore
3. Migrate non-secret configuration to ConfigurationAdapter
4. Remove direct os.getenv calls
5. Add configuration validation
6. Add configuration audit trail

**Success Criteria:**
- All configuration flows through ConfigurationAdapter
- No direct os.getenv calls in business logic
- No direct os.getenv calls in configuration module
- ConfigurationAdapter delegates secrets to SecretAdapter
- ConfigurationAdapter reads non-secrets from ConfigurationStore
- Configuration changes are audited
- Configuration is validated before use

---

## Related Documents

- `CONFIGURATION_CONSOLIDATION_PLAN.md` - Configuration consolidation strategy
- `CONFIGURATION_DRIFT_RESOLVED.md` - Configuration drift resolution
- `SECURITY_CONFIGURATION_REPORT.md` - Security validation
- `runtime/configuration.py` - Current configuration module
- `runtime/constitutional/secret_adapter.py` - Secret authority adapter

---

## Constitutional Law Reference

**Law:** Business logic must NEVER directly access environment variables or secrets.

**Current Status:** PARTIALLY COMPLIANT
- Secrets: COMPLIANT (via SecretAdapter)
- Non-secrets: NON-COMPLIANT (direct os.getenv)

**Target Status:** FULLY COMPLIANT
- All configuration via ConfigurationAdapter
- ConfigurationAdapter delegates to SecretAdapter and ConfigurationStore
- No direct environment access anywhere in business logic
