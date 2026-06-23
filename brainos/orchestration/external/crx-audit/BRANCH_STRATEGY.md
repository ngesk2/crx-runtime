# Branch Strategy

**Phase 11:** Create main, constitutional-core, crx-integration, crx-experimental branches

---

## Overview

Branch Strategy establishes separate branches for core development, CRX integration, and experimental protocol work. Never develop protocol code directly on core branches.

---

## Branch Structure

### 1. main
**Purpose:** Production-ready code
**Contents:**
- Merged constitutional-core
- Merged crx-integration (when stable)
- Production-ready features only

**Rules:**
- Only production-ready code
- No experimental features
- No protocol code
- No CRX code (until stable)

### 2. constitutional-core
**Purpose:** Core constitutional development
**Contents:**
- Layer 0: Constitutional Storage
- Layer 1: Constitutional Ingestion
- Layer 2: Replay-Compatible Knowledge Core
- Layer 3: Constitutional Runtime Kernel
- Layer 4: Constitutional Object Substrate
- Layer 4A: Object Hardening
- Layer 4B: Protocol Readiness
- Layer 4C: Schema Governance
- Layer 4D: Constitutional Query Layer
- Layer 4E: Replication Verification

**Rules:**
- Core development only
- No protocol code
- No CRX code
- No experimental features

### 3. crx-integration
**Purpose:** CRX integration work
**Contents:**
- CRX adapter layer
- CRX compatibility layer
- CRX containerization
- CRX audit results
- CRX mapping documents

**Rules:**
- CRX work only
- No core modifications
- No experimental protocol code
- Adapter layer only

### 4. crx-experimental
**Purpose:** Experimental protocol work
**Contents:**
- Experimental protocol implementations
- Future protocol research
- Protocol experiments
- Protocol testing

**Rules:**
- Experimental protocol work only
- No core modifications
- No production CRX code
- Experimental features only

---

## Branch Rules

### Core Development Rules
**Branch:** constitutional-core
**Rules:**
- Core development on constitutional-core only
- No protocol code on constitutional-core
- No CRX code on constitutional-core
- No experimental features on constitutional-core
- Merge to main only when production-ready

### CRX Integration Rules
**Branch:** crx-integration
**Rules:**
- CRX work on crx-integration only
- No core modifications on crx-integration
- No experimental protocol code on crx-integration
- Adapter layer only
- Merge to main only when stable

### Experimental Protocol Rules
**Branch:** crx-experimental
**Rules:**
- Experimental protocol work on crx-experimental only
- No core modifications on crx-experimental
- No production CRX code on crx-experimental
- Experimental features only
- Never merge to main

### Main Branch Rules
**Branch:** main
**Rules:**
- Production-ready code only
- Merged from constitutional-core
- Merged from crx-integration (when stable)
- No experimental features
- No protocol code
- No CRX code (until stable)

---

## Branch Workflow

### Core Development Workflow
```
1. Create feature branch from constitutional-core
2. Develop core feature
3. Test core feature
4. Create pull request to constitutional-core
5. Review and merge to constitutional-core
6. Merge constitutional-core to main when production-ready
```

### CRX Integration Workflow
```
1. Create feature branch from crx-integration
2. Develop CRX adapter
3. Test CRX adapter
4. Create pull request to crx-integration
5. Review and merge to crx-integration
6. Merge crx-integration to main when stable
```

### Experimental Protocol Workflow
```
1. Create feature branch from crx-experimental
2. Develop experimental protocol
3. Test experimental protocol
4. Create pull request to crx-experimental
5. Review and merge to crx-experimental
6. Never merge to main
```

---

## Branch Protection

### Protected Branches
- **main:** Protected, requires approval
- **constitutional-core:** Protected, requires approval
- **crx-integration:** Protected, requires approval
- **crx-experimental:** Open for experimentation

### Protection Rules
```yaml
# Branch protection rules
branches:
  main:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 2
      required_status_checks:
        strict: true
  constitutional-core:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 2
      required_status_checks:
        strict: true
  crx-integration:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 1
      required_status_checks:
        strict: false
  crx-experimental:
    protection:
      required_pull_request_reviews:
        required_approving_review_count: 0
      required_status_checks:
        strict: false
```

---

## Branch Best Practices

### 1. Separation of Concerns
- Core development on constitutional-core
- CRX work on crx-integration
- Experimental protocol work on crx-experimental
- Never mix concerns

### 2. No Protocol on Core
- No protocol code on constitutional-core
- No CRX code on constitutional-core
- No experimental features on constitutional-core
- Core only

### 3. Adapter Layer Only
- CRX work uses adapter layer only
- No direct constitutional modifications
- No direct database access
- API-only access

### 4. Experimental Isolation
- Experimental protocol work isolated
- Never merge experimental to main
- Experimental features only on crx-experimental
- No production code on experimental

### 5. Review Process
- All merges require review
- Core merges require 2 approvals
- CRX merges require 1 approval
- Experimental merges require 0 approvals
