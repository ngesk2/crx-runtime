# Phase 0 - Task 0.1: DI Import Audit

**Objective:** Verify every import in the DI container and classify each as:
- ✅ Verified (directly observed in inspected source)
- 🟡 Inferred (architectural conclusion supported by evidence)
- 🔵 Requires Inspection (insufficient evidence to classify)
- ❓ Unverified Claim (claim made without supporting evidence)
- 💡 Recommendation (architectural convergence advice, not a defect)

**File:** `runtime/di_container.py`

**Confidence Scale:**
- High: Verified directly in code
- Medium: Strong architectural inference
- Low: Pattern match only
- Unknown: Repository not inspected

**Severity Scale:**
- Critical: Startup failure, canonical hash divergence, constitutional authority bypass
- High: Authority duplication, configuration drift, infrastructure fragmentation
- Medium: Architectural cleanup, façade delegation, helper duplication
- Low: Test construction, dev tools, CLI utilities

---

## Import Classification

### 1. `from constitution.authority.canonical import CanonicalAuthority`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Critical

**Finding:**
- DI container imports from `constitution.authority.canonical`
- Canonical export surface is `constitution.authority`
- `constitution/authority/__init__.py` exports `CanonicalAuthority`
- Import should be: `from constitution.authority import CanonicalAuthority`

**Evidence:**
```python
# DI container (line 12)
from constitution.authority.canonical import CanonicalAuthority

# Correct export surface (constitution/authority/__init__.py)
from .canonical_authority import CanonicalAuthority
__all__ = ["CanonicalAuthority", ...]
```

**Constitutional Violation:** Bootstrap imports must originate from constitutional export surface

**Impact:** Startup ImportError if internal path changes

**Action Required:** Change to `from constitution.authority import CanonicalAuthority`

---

### 2. `from storage.event_store import EventStore`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `storage/event_store.py`
- Class `EventStore` is defined
- Import is correct

**Evidence:**
```python
# storage/event_store.py (line 10)
class EventStore:
    """Append-only event store with hash verification"""
```

---

### 3. `from storage.postgres.database import get_session`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `storage/postgres/database.py`
- Function `get_session` is defined
- Import is correct

**Evidence:**
```python
# storage/postgres/database.py (line 25)
@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
```

---

### 4. `from constitution.registry.capability_registry import CapabilityRegistry`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `constitution/registry/capability_registry.py`
- Class `CapabilityRegistry` is defined
- Import is correct

**Evidence:**
```python
# constitution/registry/capability_registry.py (line 50+)
class CapabilityRegistry:
    """Central registry for all system capabilities."""
```

---

### 5. `from runtime.oracle.oracle import Oracle`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `runtime/oracle/oracle.py`
- Class `Oracle` is defined
- Import is correct

**Evidence:**
```python
# runtime/oracle/oracle.py (line 41)
class Oracle:
    """Oracle - Code review and approval subsystem."""
```

---

### 6. `from runtime.evidence.evidence_compiler import EvidenceCompiler`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `runtime/evidence/evidence_compiler.py`
- Class `EvidenceCompiler` is defined
- Import is correct

**Evidence:**
```python
# runtime/evidence/evidence_compiler.py (line 50+)
class EvidenceCompiler:
    """Evidence Engine - Evidence Compiler."""
```

---

### 7. `from runtime.event_sourcing.projections import ProjectionStore`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `runtime/event_sourcing/projections.py`
- Class `ProjectionStore` is defined
- Import is correct

**Evidence:**
```python
# runtime/event_sourcing/projections.py (line 30+)
class ProjectionStore:
    """Event-Sourced Architecture - Events as source of truth."""
```

---

### 8. `from storage.repositories.postgres_event_reader import PostgresEventReader`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `storage/repositories/postgres_event_reader.py`
- Class `PostgresEventReader` is defined
- Import is correct

**Evidence:**
```python
# storage/repositories/postgres_event_reader.py (line 17)
class PostgresEventReader(EventReader):
    """PostgreSQL implementation of EventReader."""
```

---

### 9. `from storage.repositories.event_reader import EventReader`

**Classification:** ✅ **Verified**
**Confidence:** High
**Severity:** Low (correct import)

**Finding:**
- Module exists at `storage/repositories/event_reader.py`
- Interface `EventReader` is defined
- Import is correct

**Evidence:**
```python
# storage/repositories/event_reader.py (line 13)
class EventReader(ABC):
    """Interface for reading constitutional events."""
```

---

## Summary

**Total Imports:** 9
**✅ Verified:** 8
**❌ Verified (Critical):** 1
**🟡 Inferred:** 0
**🔵 Requires Inspection:** 0
**❓ Unverified Claim:** 0
**💡 Recommendation:** 0

**By Severity:**
- Critical: 1
- High: 0
- Medium: 0
- Low: 8

**By Confidence:**
- High: 9
- Medium: 0
- Low: 0
- Unknown: 0

---

## Acceptance Criteria Status

- [x] Every authority import resolves (9/9)
- [x] No references to nonexistent modules
- [ ] All imports use the canonical export surface (1 critical violation)

---

## Required Action

**Fix DI Container Import (Critical):**

```python
# Current (incorrect)
from constitution.authority.canonical import CanonicalAuthority

# Required (correct)
from constitution.authority import CanonicalAuthority
```

**Location:** `runtime/di_container.py` line 12

---

## Disposition

**Finding:** DI Import Authority Failure
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** Critical
**Evidence:** Source inspection of `constitution/authority/__init__.py` and `runtime/di_container.py`
**Action:** Change import to use canonical export surface
