capability_scope_auditor.js
/* ============================================================
   capability_scope_auditor.js
   ------------------------------------------------------------
   Advisory Capability Compliance Court


   Version: capability_scope_auditor.1.0


   Guarantees:
   - Pure analysis (no mutation)
   - Deterministic evaluation
   - No runtime modification
   - No authority inference
   - Structural capability compliance validation
   ============================================================ */


export const CAPABILITY_SCOPE_AUDITOR_VERSION =
  "capability_scope_auditor.1.0";


/* ============================================================
   Severity Taxonomy
   ============================================================ */


const SEVERITY = Object.freeze({
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low"
});


/* ============================================================
   Utilities
   ============================================================ */


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


function assertAuditInput(plugin, auditResult) {
  if (!isPlainObject(plugin)) {
    throw new Error("Invalid plugin object");
  }


  if (!isPlainObject(auditResult)) {
    throw new Error("Invalid audit result object");
  }


  if (!isPlainObject(auditResult.audit_log)) {
    throw new Error("Missing audit_log");
  }
}


/* ============================================================
   Main Auditor
   ============================================================ */


export function auditCapabilityScope(
  plugin,
  auditResult
) {
  const pluginClone = deepClone(plugin);
  const resultClone = deepClone(auditResult);


  assertAuditInput(pluginClone, resultClone);


  const violations = [];
  const caps = pluginClone.capability_scope || {};
  const determinism = pluginClone.determinism_class;


  const log = resultClone.audit_log;


  /* ============================================================
     Console Usage
     ============================================================ */


  if (log.console_calls > 0 && caps.console !== true) {
    violations.push({
      type: "UNDECLARED_CONSOLE_USAGE",
      severity: SEVERITY.HIGH
    });
  }


  /* ============================================================
     structuredClone Usage
     ============================================================ */


  if (
    log.structured_clone_calls > 0 &&
    caps.structured_clone !== true
  ) {
    violations.push({
      type: "UNDECLARED_STRUCTURED_CLONE_USAGE",
      severity: SEVERITY.HIGH
    });
  }


  /* ============================================================
     Random Usage
     ============================================================ */


  if (
    log.random_calls > 0 &&
    determinism === "deterministic"
  ) {
    violations.push({
      type: "NONDETERMINISTIC_RANDOM_USAGE",
      severity: SEVERITY.CRITICAL
    });
  }


  if (
    log.random_calls === 0 &&
    determinism === "probabilistic_bounded"
  ) {
    violations.push({
      type: "DECLARED_PROBABILISTIC_BUT_NO_RANDOM_USAGE",
      severity: SEVERITY.LOW
    });
  }


  /* ============================================================
     Forbidden Access Attempts
     ============================================================ */


  if (
    Array.isArray(log.forbidden_access_attempts) &&
    log.forbidden_access_attempts.length > 0
  ) {
    violations.push({
      type: "FORBIDDEN_GLOBAL_ACCESS_ATTEMPT",
      severity: SEVERITY.CRITICAL,
      details: log.forbidden_access_attempts
    });
  }


  /* ============================================================
     Capability Over-Declaration (optional discipline rule)
     ============================================================ */


  if (
    caps.console === true &&
    log.console_calls === 0
  ) {
    violations.push({
      type: "UNUSED_CONSOLE_CAPABILITY",
      severity: SEVERITY.LOW
    });
  }


  if (
    caps.structured_clone === true &&
    log.structured_clone_calls === 0
  ) {
    violations.push({
      type: "UNUSED_STRUCTURED_CLONE_CAPABILITY",
      severity: SEVERITY.LOW
    });
  }


  /* ============================================================
     Final Verdict
     ============================================================ */


  const compliant = violations.length === 0;


  return Object.freeze({
    compliant,
    violation_count: violations.length,
    violations,
    auditor_version:
      CAPABILITY_SCOPE_AUDITOR_VERSION
  });
}
worker_runtime_adapter.js
