# CRX Quarantine Environment Setup

**Phase 1:** Create CRX quarantine environment

---

## Overview

CRX Quarantine Environment establishes isolated directories for CRX import, audit, and analysis. CRX must initially remain isolated and never import directly into kernel/, runtime/, objects/, protocol/, or knowledge/ directories.

---

## Directory Structure

### Quarantine Directories
```
brain/
├── external/
│   ├── crx-audit/
│   ├── crx-runtime/
│   ├── crx-analysis/
│   └── crx-mirror.git/
```

### Protected Directories
The following directories must never receive direct CRX imports:
- `kernel/` - Constitutional Runtime Kernel
- `runtime/` - Runtime OS
- `objects/` - Object OS
- `protocol/` - Protocol implementations
- `knowledge/` - Knowledge Core

---

## Directory Creation

### Create External Directory
```bash
# Create external directory
mkdir -p brain/external
```

### Create Quarantine Subdirectories
```bash
# Create quarantine subdirectories
mkdir -p brain/external/crx-audit
mkdir -p brain/external/crx-runtime
mkdir -p brain/external/crx-analysis
```

---

## Quarantine Rules

### Import Rules
1. **No Direct Imports:** CRX must never import directly into protected directories
2. **Quarantine First:** All CRX code must first be imported into quarantine directories
3. **Audit Required:** CRX must pass all audits before integration
4. **Adapter Only:** CRX must interact through adapter layer only

### Access Rules
1. **Read-Only Access:** Quarantine directories are read-only for core systems
2. **API-Only Access:** CRX must access constitutional primitives through APIs only
3. **No Direct Database Access:** CRX must never access canonical database directly
4. **No Direct Object Store Access:** CRX must never access object store directly

---

## Quarantine Verification

### Verification Procedure
```bash
# Verify quarantine structure
ls -la brain/external/

# Verify no CRX code in protected directories
find kernel/ -name "*crx*" -type f
find runtime/ -name "*crx*" -type f
find objects/ -name "*crx*" -type f
find protocol/ -name "*crx*" -type f
find knowledge/ -name "*crx*" -type f
```

---

## Quarantine Best Practices

### 1. Isolation
- CRX remains isolated in quarantine
- No direct imports to protected directories
- No direct access to constitutional primitives
- API-only access

### 2. Audit First
- All CRX code must be audited
- All CRX code must be analyzed
- All CRX code must be verified
- No integration without audit completion

### 3. Adapter Layer
- CRX interacts through adapters only
- No direct modification of constitutional primitives
- No direct access to constitutional storage
- All access through constitutional APIs

### 4. Verification
- Verify quarantine structure
- Verify no CRX in protected directories
- Verify access rules enforced
- Verify API-only access

### 5. Documentation
- Document quarantine structure
- Document quarantine rules
- Document access rules
- Document verification procedures
