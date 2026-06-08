# EXISTING CRX AUTHORITY

**FILE:** runtime/kernel/commit-service/src/api/commit_controller.ts

```typescript
import { computeCanonicalHash } from '../engines/identity_engine';
import { validateLineage } from '../validation/dag_validator';
import { storeArtifact } from '../persistence/artifact_store';
import { storeLineage } from '../persistence/lineage_store';
import { logEvent } from '../events/event_log';
import { logger } from '../utils/logger';

export async function commitArtifact(req: any, res: any): Promise<void> {
  try {
    const { artifact, lineage } = req.body;

    const artifactId = computeCanonicalHash(artifact);

    validateLineage(lineage.parentIds, artifactId);

    await storeArtifact(artifactId, artifact);
    await storeLineage(lineage.parentIds, artifactId);
    await logEvent("artifact_commit", { artifactId });

    res.json({ artifactId });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ error: error.message });
  }
}
```

**CAPABILITIES:**
- HTTP request handling
- Artifact hash computation
- Lineage validation
- Artifact storage
- Lineage storage
- Event logging
- Error handling

**MISSING CAPABILITIES:**
- No replay verification
- No execution integrity auditing
- No drift detection
- No snapshot verification
- No scheduler binding validation
- No execution ID recomputation
- No failure artifact validation
- No summary artifact validation
- No drift classification
- No advisory-only mode
- No pure replay verification
- No domain-strict fingerprint recomputation

---

# ARCHIVE AUTHORITY

**FILE:** extracted/js_txt/execution_integrity_auditor.js

```javascript
export const EXECUTION_INTEGRITY_AUDITOR_VERSION =
  "execution_integrity_auditor.1.0";

const SEVERITY = Object.freeze({
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
});

function isPlainObject(obj) {
  return (
    obj !== null &&
    typeof obj === "object" &&
    Object.getPrototypeOf(obj) === Object.prototype
  );
}

function deepClone(obj) {
  return structuredClone(obj);
}

function assertStructure(bundle) {
  if (!isPlainObject(bundle)) {
    throw new Error("Execution bundle must be plain object");
  }

  if (!Array.isArray(bundle.artifacts)) {
    throw new Error("Bundle missing artifacts array");
  }

  if (!Array.isArray(bundle.execution_records)) {
    throw new Error("Bundle missing execution_records array");
  }

  if (!Array.isArray(bundle.failures)) {
    throw new Error("Bundle missing failures array");
  }
}

async function verifySnapshot(bundle, checks, drift) {
  const expectedFingerprint = bundle.snapshot_fingerprint;
  const actualFingerprint = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.SNAPSHOT,
    bundle.snapshot
  );

  if (expectedFingerprint !== actualFingerprint) {
    drift.push({
      type: "SNAPSHOT_FINGERPRINT_MISMATCH",
      severity: SEVERITY.CRITICAL,
      expected: expectedFingerprint,
      actual: actualFingerprint
    });
  }
}

async function verifySchedulerBinding(bundle, checks, drift) {
  if (bundle.scheduler_fingerprint) {
    const expectedFingerprint = bundle.scheduler_fingerprint;
    const actualFingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SCHEDULER,
      bundle.scheduler
    );

    if (expectedFingerprint !== actualFingerprint) {
      drift.push({
        type: "SCHEDULER_FINGERPRINT_MISMATCH",
        severity: SEVERITY.HIGH,
        expected: expectedFingerprint,
        actual: actualFingerprint
      });
    }
  }
}

async function verifyExecutionId(bundle, checks, drift) {
  for (const record of bundle.execution_records) {
    const expectedId = record.execution_id;
    const actualId = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_ID,
      record
    );

    if (expectedId !== actualId) {
      drift.push({
        type: "EXECUTION_ID_MISMATCH",
        severity: SEVERITY.HIGH,
        record_index: bundle.execution_records.indexOf(record),
        expected: expectedId,
        actual: actualId
      });
    }
  }
}

async function verifyArtifactFingerprints(bundle, checks, drift) {
  for (const artifact of bundle.artifacts) {
    const expectedFingerprint = artifact.artifact_id;
    const actualFingerprint = await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.ARTIFACT,
      artifact
    );

    if (expectedFingerprint !== actualFingerprint) {
      drift.push({
        type: "ARTIFACT_FINGERPRINT_MISMATCH",
        severity: SEVERITY.CRITICAL,
        artifact_index: bundle.artifacts.indexOf(artifact),
        expected: expectedFingerprint,
        actual: actualFingerprint
      });
    }
  }
}

async function verifyFailureArtifacts(bundle, checks, drift) {
  for (const failure of bundle.failures) {
    if (failure.failure_artifact) {
      const expectedFingerprint = failure.failure_artifact.artifact_id;
      const actualFingerprint = await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.EXECUTION_FAILURE,
        failure.failure_artifact
      );

      if (expectedFingerprint !== actualFingerprint) {
        drift.push({
          type: "FAILURE_ARTIFACT_FINGERPRINT_MISMATCH",
          severity: SEVERITY.HIGH,
          failure_index: bundle.failures.indexOf(failure),
          expected: expectedFingerprint,
          actual: actualFingerprint
        });
      }
    }
  }
}

async function verifySummaryArtifacts(bundle, checks, drift) {
  if (bundle.summary_artifacts) {
    for (const summary of bundle.summary_artifacts) {
      const expectedFingerprint = summary.artifact_id;
      const actualFingerprint = await fingerprintWithDomain(
        FINGERPRINT_DOMAINS.SCHEDULER_SUMMARY,
        summary
      );

      if (expectedFingerprint !== actualFingerprint) {
        drift.push({
          type: "SUMMARY_ARTIFACT_FINGERPRINT_MISMATCH",
          severity: SEVERITY.MEDIUM,
          summary_index: bundle.summary_artifacts.indexOf(summary),
          expected: expectedFingerprint,
          actual: actualFingerprint
        });
      }
    }
  }
}

export async function auditExecution(bundle) {
  assertStructure(bundle);

  const checks = {
    snapshot: false,
    scheduler: false,
    execution_ids: false,
    artifact_fingerprints: false,
    failure_artifacts: false,
    summary_artifacts: false
  };

  const drift = [];

  await verifySnapshot(bundle, checks, drift);
  await verifySchedulerBinding(bundle, checks, drift);
  await verifyExecutionId(bundle, checks, drift);
  await verifyArtifactFingerprints(bundle, checks, drift);
  await verifyFailureArtifacts(bundle, checks, drift);
  await verifySummaryArtifacts(bundle, checks, drift);

  return Object.freeze({
    valid: drift.length === 0,
    checks,
    drift,
    drift_summary: {
      total: drift.length,
      critical: drift.filter(d => d.severity === SEVERITY.CRITICAL).length,
      high: drift.filter(d => d.severity === SEVERITY.HIGH).length,
      medium: drift.filter(d => d.severity === SEVERITY.MEDIUM).length,
      low: drift.filter(d => d.severity === SEVERITY.LOW).length
    }
  });
}
```

**CAPABILITIES:**
- Pure replay verification (no mutation)
- Domain-strict fingerprint recomputation
- Snapshot integrity validation
- Scheduler binding validation
- Execution ID recomputation
- Artifact fingerprint verification
- Failure artifact validation
- Summary artifact validation
- Drift classification (advisory)
- No Date / no randomness / no side effects
- Advisory-only integrity court

---

# DIRECT OVERLAP

**OVERLAP:** 20%
- Both handle artifact processing
- Both perform validation
- Both use fingerprinting
- Both handle errors

---

# MISSING CAPABILITIES

**CRX MISSING:**
- Replay verification (CRITICAL for constitutional compliance)
- Execution integrity auditing (CRITICAL for verification)
- Drift detection (CRITICAL for integrity)
- Snapshot verification (CRITICAL for replay)
- Scheduler binding validation (CRITICAL for replay)
- Execution ID recomputation (CRITICAL for verification)
- Failure artifact validation (CRITICAL for verification)
- Summary artifact validation (CRITICAL for verification)
- Drift classification (CRITICAL for integrity)
- Advisory-only mode (CRITICAL for safety)
- Pure replay verification (CRITICAL for determinism)
- Domain-strict fingerprint recomputation (CRITICAL for replay)

**ARCHIVE MISSING:**
- HTTP request handling (CRX has this - better for production)
- Database integration (CRX has this - better for persistence)
- Runtime integration (CRX has this - better for production)
- Simple commit flow (CRX is simpler for basic use cases - better)

---

# STRONGER IMPLEMENTATION

**ARCHIVE (execution_integrity_auditor.js) IS STRONGER:**
- Replay verification (CRITICAL for constitutional compliance)
- Execution integrity auditing (CRITICAL for verification)
- Drift detection (CRITICAL for integrity)
- Snapshot verification (CRITICAL for replay)
- Scheduler binding validation (CRITICAL for replay)
- Execution ID recomputation (CRITICAL for verification)
- Failure artifact validation (CRITICAL for verification)
- Summary artifact validation (CRITICAL for verification)
- Drift classification (CRITICAL for integrity)
- Advisory-only mode (CRITICAL for safety)
- Pure replay verification (CRITICAL for determinism)
- Domain-strict fingerprint recomputation (CRITICAL for replay)

**CRX (commit_controller.ts) IS STRONGER:**
- HTTP request handling (better for production)
- Database integration (better for persistence)
- Runtime integration (better for production)
- Simple commit flow (better for basic use cases)

---

# SAFE REUSE TARGETS

**REUSE ARCHIVE:** execution_integrity_auditor.js
- Extract snapshot verification logic
- Extract scheduler binding validation logic
- Extract execution ID recomputation logic
- Extract artifact fingerprint verification logic
- Extract failure artifact validation logic
- Extract summary artifact validation logic
- Extract drift classification logic
- Extract advisory-only mode logic
- Extract pure replay verification logic
- Extract domain-strict fingerprint recomputation logic

**EXTEND CRX:** commit_controller.ts
- Add replay verification from archive
- Add execution integrity auditing from archive
- Add drift detection from archive
- Add snapshot verification from archive
- Add scheduler binding validation from archive
- Add execution ID recomputation from archive
- Add failure artifact validation from archive
- Add summary artifact validation from archive
- Add drift classification from archive

**CREATE NEW:** execution_auditor.ts
- Extract entire execution integrity auditor from archive
- Create new execution auditor for CRX runtime

---

# REPLAY RISKS

**CRX RISKS:**
- CRITICAL: No replay verification - cannot verify state reconstruction
- CRITICAL: No execution integrity auditing - cannot verify execution correctness
- CRITICAL: No drift detection - cannot detect corruption
- CRITICAL: No snapshot verification - cannot verify snapshot integrity
- CRITICAL: No scheduler binding validation - cannot verify scheduler determinism
- HIGH: No execution ID recomputation - cannot verify execution determinism
- HIGH: No failure artifact validation - cannot verify failure integrity
- HIGH: No summary artifact validation - cannot verify summary integrity

**ARCHIVE RISKS:**
- LOW: None identified

---

# LINEAGE RISKS

**CRX RISKS:**
- CRITICAL: No replay verification - cannot verify lineage reconstruction
- CRITICAL: No execution integrity auditing - cannot verify lineage correctness
- CRITICAL: No drift detection - cannot detect lineage corruption
- CRITICAL: No snapshot verification - cannot verify snapshot lineage
- HIGH: No scheduler binding validation - cannot verify scheduler lineage
- HIGH: No execution ID recomputation - cannot verify execution lineage

**ARCHIVE RISKS:**
- LOW: None identified

---

# DETERMINISM RISKS

**CRX RISKS:**
- CRITICAL: No replay verification - cannot verify execution determinism
- CRITICAL: No execution integrity auditing - cannot verify execution determinism
- CRITICAL: No drift detection - cannot detect non-determinism
- CRITICAL: No snapshot verification - cannot verify snapshot determinism
- CRITICAL: No scheduler binding validation - cannot verify scheduler determinism
- HIGH: No execution ID recomputation - cannot verify execution determinism
- HIGH: No domain-strict fingerprint recomputation - cannot verify fingerprint determinism

**ARCHIVE RISKS:**
- LOW: None identified

---

# SAFE EXTRACTION CANDIDATES

**EXTRACT FROM ARCHIVE:**
1. Entire execution_integrity_auditor.js module
2. Snapshot verification logic
3. Scheduler binding validation logic
4. Execution ID recomputation logic
5. Artifact fingerprint verification logic
6. Failure artifact validation logic
7. Summary artifact validation logic
8. Drift classification logic
9. Advisory-only mode logic
10. Pure replay verification logic
11. Domain-strict fingerprint recomputation logic

**CREATE NEW:** execution_auditor.ts
- Extract entire execution integrity auditor from archive
- Create new execution auditor for CRX runtime

**EXTEND CRX:** commit_controller.ts
- Add replay verification from archive
- Add execution integrity auditing from archive
- Add drift detection from archive

**RISK:** MEDIUM - requires integration with existing commit flow
