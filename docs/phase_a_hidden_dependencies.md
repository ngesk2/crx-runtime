# Phase A: Hidden Dependencies Analysis

**Status:** In Progress
**Last Updated:** 2026-07-13
**Purpose:** Repository Understanding - Hidden Dependency Identification

---

## Hidden Dependency Definition

A hidden dependency is:
1. An implicit dependency not declared in requirements.txt or pyproject.toml
2. A runtime dependency not visible in import statements
3. A configuration dependency not documented
4. An infrastructure dependency not specified
5. A data dependency not tracked

---

## Hidden Dependencies Found

### 1. Database Schema Dependencies
**Status:** High Risk
**Location:** `storage/postgres/models.py`, `api/main.py`

**Hidden Dependency:** PostgreSQL table structure
**Description:** Code assumes specific PostgreSQL table structure without explicit schema management

**Impact:**
- Schema changes require manual database updates
- No migration automation
- Potential data loss on schema changes
- No version control for database schema

**Evidence:**
```python
# api/main.py
event_record = EventModel(
    event_id=event.event_id,
    event_type=event.event_type,
    # ... assumes specific table structure
)
```

**Recommendation:** Implement automated schema migration with Alembic

---

### 2. NATS Subject Naming Dependencies
**Status:** Medium Risk
**Location:** `transport/nats/transport.py`, `api/main.py`

**Hidden Dependency:** Hardcoded NATS subject names
**Description:** Subject names are hardcoded without configuration

**Impact:**
- Subject name changes require code updates
- No dynamic subject configuration
- Difficult to test with different subject names

**Evidence:**
```python
# api/main.py
await nats_transport.publish(
    f"constitutional.events.{event_type}",  # Hardcoded subject pattern
    event.model_dump(mode='json'),
)
```

**Recommendation:** Move subject names to configuration

---

### 3. Environment Variable Dependencies
**Status:** Medium Risk
**Location:** `config/settings.py`, `infra/.env.example`

**Hidden Dependency:** Environment variable naming conventions
**Description:** Environment variables are assumed without explicit documentation

**Impact:**
- Environment changes require configuration updates
- No validation of required environment variables
- Difficult to debug missing environment variables

**Evidence:**
```python
# config/settings.py
class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    # ... assumes specific environment variable names
```

**Recommendation:** Add environment variable validation and documentation

---

### 4. File Path Dependencies
**Status:** Medium Risk
**Location:** Multiple modules

**Hidden Dependency:** Hardcoded file paths
**Description:** File paths are hardcoded without configuration

**Impact:**
- File system changes require code updates
- Difficult to test with different file structures
- Platform-specific path issues

**Evidence:**
```python
# constitution/registry/capability_registry.py
# No explicit file path dependencies found, but may exist in other modules

# runtime/security/capability_broker.py
def __init__(self, db_path: str = "runtime/security/capability_broker.db"):
    self.db_path = Path(db_path)
    # Hardcoded default path
```

**Recommendation:** Move file paths to configuration

---

### 5. Database Connection Pool Dependencies
**Status:** Low Risk
**Location:** `storage/postgres/database.py`

**Hidden Dependency:** SQLAlchemy connection pool configuration
**Description:** Connection pool settings are assumed without explicit configuration

**Impact:**
- Connection pool issues may cause performance problems
- No visibility into connection pool state
- Difficult to tune for different workloads

**Evidence:**
```python
# storage/postgres/database.py
# Connection pool configuration not explicitly shown
# May use SQLAlchemy defaults
```

**Recommendation:** Add explicit connection pool configuration

---

### 6. AsyncIO Event Loop Dependencies
**Status:** Low Risk
**Location:** Multiple async modules

**Hidden Dependency:** AsyncIO event loop behavior
**Description:** Code assumes specific event loop behavior without explicit configuration

**Impact:**
- Event loop differences across platforms
- Difficult to test with different event loop implementations
- Potential race conditions

**Evidence:**
```python
# Multiple async modules use asyncio without explicit event loop configuration
async def start(self) -> None:
    # Assumes default event loop behavior
```

**Recommendation:** Add explicit event loop configuration

---

### 7. Time Zone Dependencies
**Status:** Medium Risk
**Location:** Multiple modules using datetime

**Hidden Dependency:** Time zone handling
**Description:** Code uses datetime without explicit time zone handling

**Impact:**
- Time zone inconsistencies across systems
- Difficult to debug time-related issues
- Potential data corruption

**Evidence:**
```python
# api/main.py
timestamp=datetime.utcnow(),  # No time zone handling
```

**Recommendation:** Add explicit time zone handling

---

### 8. Serialization Format Dependencies
**Status:** Low Risk
**Location:** Multiple modules

**Hidden Dependency:** JSON serialization behavior
**Description:** Code assumes specific JSON serialization behavior

**Impact:**
- Serialization differences across libraries
- Potential data corruption
- Difficult to debug serialization issues

**Evidence:**
```python
# Multiple modules use model_dump(mode='json') without explicit serialization configuration
event.model_dump(mode='json')
```

**Recommendation:** Add explicit serialization configuration

---

### 9. Logging Configuration Dependencies
**Status:** Low Risk
**Location:** `config/logging.py`

**Hidden Dependency:** Logging configuration behavior
**Description:** Logging assumes specific configuration without explicit setup

**Impact:**
- Logging inconsistencies across environments
- Difficult to debug logging issues
- Potential log loss

**Evidence:**
```python
# config/logging.py
# Logging configuration may assume specific behavior
```

**Recommendation:** Add explicit logging configuration

---

### 10. HTTP Client Dependencies
**Status:** Medium Risk
**Location:** `requirements.txt`

**Hidden Dependency:** HTTP client library
**Description:** httpx is specified but not explicitly used in main code paths

**Impact:**
- Unused dependency
- Potential security vulnerabilities
- Maintenance burden

**Evidence:**
```python
# requirements.txt
httpx>=0.24.0  # Specified but not actively used in main code paths
```

**Recommendation:** Remove unused dependency or integrate HTTP client

---

### 11. Docker Compose Service Dependencies
**Status:** Medium Risk
**Location:** `infra/docker/docker-compose.yml`

**Hidden Dependency:** Docker Compose service configuration
**Description:** Services assume specific Docker Compose configuration

**Impact:**
- Docker Compose changes require service updates
- Difficult to test with different configurations
- Potential service startup failures

**Evidence:**
```yaml
# infra/docker/docker-compose.yml
# Services assume specific network, volume, and environment configuration
```

**Recommendation:** Document Docker Compose dependencies

---

### 12. Build Tool Dependencies
**Status:** Low Risk
**Location:** `Makefile`, `pyproject.toml`

**Hidden Dependency:** Build tool behavior
**Description:** Build tools assume specific behavior without explicit configuration

**Impact:**
- Build inconsistencies across environments
- Difficult to debug build issues
- Potential build failures

**Evidence:**
```makefile
# Makefile
uv sync --dev  # Assumes uv behavior
```

**Recommendation:** Add explicit build tool configuration

---

### 13. Test Framework Dependencies
**Status:** Low Risk
**Location:** `pyproject.toml`, `requirements.txt`

**Hidden Dependency:** Test framework behavior
**Description:** Test frameworks assume specific behavior without explicit configuration

**Impact:**
- Test inconsistencies across environments
- Difficult to debug test issues
- Potential test failures

**Evidence:**
```python
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"  # Assumes specific pytest-asyncio behavior
```

**Recommendation:** Add explicit test framework configuration

---

### 14. Singleton Pattern Dependencies
**Status:** High Risk
**Location:** Multiple modules

**Hidden Dependency:** Global state via singletons
**Description:** Code relies on global state without explicit dependency injection

**Impact:**
- Difficult to test
- Hidden dependencies between modules
- Potential race conditions

**Evidence:**
```python
# constitution/registry/capability_registry.py
_global_registry: Optional[CapabilityRegistry] = None

def get_registry() -> CapabilityRegistry:
    global _global_registry
    if _global_registry is None:
        _global_registry = CapabilityRegistry()
    return _global_registry
```

**Recommendation:** Replace with dependency injection

---

### 15. SQLite Database Dependencies
**Status:** Medium Risk
**Location:** `hermes/hermes_runtime.py`

**Hidden Dependency:** SQLite database file
**Description:** Code assumes SQLite database file exists and is accessible

**Impact:**
- Database file issues cause runtime failures
- Difficult to test with different databases
- Potential data corruption

**Evidence:**
```python
# hermes/hermes_runtime.py
def __init__(self, db_path: str = "hermes_missions.db"):
    self.db_path = db_path
    # Assumes SQLite database file exists
```

**Recommendation:** Add database initialization and validation

---

## Hidden Dependency Summary

### High Risk Hidden Dependencies
1. **Database Schema Dependencies** - No automated schema migration
2. **Singleton Pattern Dependencies** - Global state via singletons

### Medium Risk Hidden Dependencies
3. **NATS Subject Naming Dependencies** - Hardcoded subject names
4. **Environment Variable Dependencies** - No validation or documentation
5. **File Path Dependencies** - Hardcoded file paths
6. **Time Zone Dependencies** - No explicit time zone handling
7. **HTTP Client Dependencies** - Unused dependency
8. **Docker Compose Service Dependencies** - Undocumented service configuration
9. **SQLite Database Dependencies** - No database initialization

### Low Risk Hidden Dependencies
10. **Database Connection Pool Dependencies** - No explicit configuration
11. **AsyncIO Event Loop Dependencies** - No explicit configuration
12. **Serialization Format Dependencies** - No explicit configuration
13. **Logging Configuration Dependencies** - No explicit configuration
14. **Build Tool Dependencies** - No explicit configuration
15. **Test Framework Dependencies** - No explicit configuration

---

## Mitigation Strategies

### Immediate Actions (High Priority)
1. **Implement Schema Migration:** Add Alembic migrations for database schema
2. **Eliminate Singletons:** Replace with dependency injection

### Medium-Term Actions (Medium Priority)
3. **Configure NATS Subjects:** Move subject names to configuration
4. **Validate Environment Variables:** Add environment variable validation
5. **Configure File Paths:** Move file paths to configuration
6. **Handle Time Zones:** Add explicit time zone handling
7. **Remove Unused Dependencies:** Remove httpx or integrate HTTP client
8. **Document Docker Compose:** Document service dependencies
9. **Initialize Database:** Add database initialization and validation

### Long-Term Actions (Low Priority)
10. **Configure Connection Pool:** Add explicit connection pool configuration
11. **Configure Event Loop:** Add explicit event loop configuration
12. **Configure Serialization:** Add explicit serialization configuration
13. **Configure Logging:** Add explicit logging configuration
14. **Configure Build Tools:** Add explicit build tool configuration
15. **Configure Test Framework:** Add explicit test framework configuration

---

## Dependency Documentation Recommendations

### 1. Create Dependency Manifest
**File:** `docs/DEPENDENCIES.md`

**Content:**
- All external dependencies with versions
- All infrastructure dependencies
- All configuration dependencies
- All data dependencies

### 2. Add Dependency Validation
**Location:** `config/settings.py`

**Implementation:**
- Validate required environment variables
- Validate required infrastructure
- Validate required configuration

### 3. Add Dependency Health Checks
**Location:** `api/main.py`

**Implementation:**
- Check database connectivity
- Check NATS connectivity
- Check file system accessibility

### 4. Add Dependency Documentation
**Location:** Code comments and docstrings

**Implementation:**
- Document all external dependencies
- Document all infrastructure dependencies
- Document all configuration dependencies

---

## Next Steps

- Implement Alembic schema migrations
- Replace singleton pattern with dependency injection
- Move NATS subject names to configuration
- Add environment variable validation
- Move file paths to configuration
- Add explicit time zone handling
- Remove unused dependencies
- Document Docker Compose dependencies
- Add database initialization
