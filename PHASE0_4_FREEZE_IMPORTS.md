# Phase 0.4 - Freeze Imports

**Objective:** Freeze canonical import paths based on verified inventory

**Classification:**
- ✅ Verified (directly observed in inspected source)
- 🟡 Inferred (architectural conclusion supported by evidence)
- 🔵 Requires Inspection (insufficient evidence to classify)
- ❓ Unverified Claim (claim made without supporting evidence)
- 💡 Recommendation (architectural convergence advice, not a defect)

**Confidence Scale:**
- High: Verified directly in code
- Medium: Strong architectural inference
- Low: Pattern match only
- Unknown: Repository not inspected

**Severity Scale:**
- P0 Constitutional Failure: Startup failure, canonical hash divergence, constitutional authority bypass
- P1 Runtime Failure: Authority duplication, configuration drift, infrastructure fragmentation
- P2 Drift: Architectural cleanup, façade delegation, helper duplication
- P3 Cleanup: Test construction, dev tools, CLI utilities

---

## Frozen Import Paths

### Constitutional Authority Imports

**Canonical Export Surface:** `constitution/authority/__init__.py`

**Frozen Import:**
```python
from constitution.authority import CanonicalAuthority
``'

**Prohibited Imports:**
```python
from constitution.authority.canonical import CanonicalAuthority  # Internal path
from constitution.authority.canonical_authority import CanonicalAuthority  # Internal path
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - Fixed to use canonical export surface
- `runtime/replay/replay_kernel.py` - Fixed to use canonical export surface

---

### Storage Imports

**Frozen Imports:**
```python
from storage.event_store import EventStore
from storage.postgres.database import get_session
from storage.repositories.postgres_event_reader import PostgresEventReader
from storage.repositories.event_reader import EventReader
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - All storage imports verified
- `runtime/replay/replay_kernel.py` - Direct PostgreSQL imports (flagged for Phase 5)

---

### Registry Imports

**Frozen Import:**
```python
from constitution.registry.capability_registry import CapabilityRegistry
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - CapabilityRegistry import verified

---

### Oracle Imports

**Frozen Import:**
```python
from runtime.oracle.oracle import Oracle
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - Oracle import verified

---

### Evidence Imports

**Frozen Import:**
```python
from runtime.evidence.evidence_compiler import EvidenceCompiler
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - EvidenceCompiler import verified

---

### Projection Imports

**Frozen Import:**
```python
from runtime.event_sourcing.projections import ProjectionStore
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/di_container.py` - ProjectionStore import verified

---

### Replay Imports (TypeScript)

**Frozen Imports:**
```typescript
import { ReplayEventStream } from './replay_event_stream';
import { ReplayStateMachine } from './replay_state_machine';
import { CanonicalHashAuthority } from './canonical_hash_authority';
import { InvariantRunner } from './invariant_runner';
import { ReplayInvariants } from './replay_invariants';
import { WitnessAuthority } from './witness_authority';
import { ReplayResult, CanonicalBytes, Fingerprint, LineageGraph, WitnessRoot, InvariantViolation } from './replay_types';
import { deepFreeze } from './utils/deep_freeze';
```

**Status:** ✅ FROZEN

**Evidence:**
- `runtime/kernel/replay/deterministic_replay_engine.ts` - All imports verified

---

### Replay Imports (Python)

**Frozen Import:**
```python
from constitution.authority import CanonicalAuthority
```

**Prohibited Imports (flagged for Phase 5):**
```python
from storage.postgres.database import get_session  # Direct infrastructure coupling
from storage.postgres.models import Event as EventModel  # Direct infrastructure coupling
```

**Status:** ⚠ PARTIALLY FROZEN

**Evidence:**
- `runtime/replay/replay_kernel.py` - Canonical authority import fixed
- `runtime/replay/replay_kernel.py` - Direct PostgreSQL imports flagged for Phase 5

---

## Executable Gate

### Phase 0.4 Freeze Imports Gate

**Gate:** Canonical import paths must be frozen before harvesting

**Test:** No import changes during Phase 0-7

**Verification:**
1. All constitutional authority imports use canonical export surface
2. All storage imports use verified paths
3. All registry imports use verified paths
4. All oracle imports use verified paths
5. All evidence imports use verified paths
6. All projection imports use verified paths
7. All replay imports use verified paths
8. No import changes permitted during harvesting
9. Implementation changes only, import changes prohibited

---

## Import Violations Summary

### P0 Constitutional Failures
- None (all fixed in Phase 0)

### P1 Runtime Failures
- `runtime/replay/replay_kernel.py` - Direct PostgreSQL imports (flagged for Phase 5)

### P2 Drift
- None

### P3 Cleanup
- None

---

## Acceptance Criteria Status

- [x] All constitutional authority imports frozen
- [x] All storage imports frozen
- [x] All registry imports frozen
- [x] All oracle imports frozen
- [x] All evidence imports frozen
- [x] All projection imports frozen
- [x] All replay imports frozen (TypeScript)
- [ ] All replay imports frozen (Python) - blocked on Phase 5
- [x] Executable gate defined
- [x] Import freeze policy established

---

## Disposition

**Finding:** Phase 0.4 - Freeze Imports
**Classification:** ✅ Verified
**Confidence:** High
**Severity:** P0
**Evidence:** Source inspection of all import paths from verified inventory
**Action:** Imports frozen based on verified inventory, proceed with Phase 0.5 - Begin harvesting

---

**Status:** Phase 0.4 Complete
**Next Step:** Phase 0.5 - Begin harvesting (with lock-step verification)
