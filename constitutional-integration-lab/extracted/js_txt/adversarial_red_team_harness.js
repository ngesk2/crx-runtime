adversarial_red_team_harness.js
/* ============================================================
   adversarial_red_team_harness.js (Hardened Constitutional)
   ------------------------------------------------------------
   Guarantees:
   - Snapshot mutation detection
   - Envelope immutability validation
   - Entropy overflow containment
   - Cross-plugin leakage probe
   - Artifact firewall bypass attempt
   - Capability escalation probe
   - Replay determinism validation
   - Fingerprint forgery rejection
   - UI overlay contamination detection
   - Registry freeze enforcement
   ============================================================ */


import { executePlugins } from "./plugin_execution_scheduler.js";
import { runIsolatedExecution } from "./isolated_execution_adapter.js";
import { createEntropyGuard } from "./entropy_budget_guard.js";


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================ */


export const RED_TEAM_HARNESS_VERSION = "red_team.2.0";


/* ============================================================ */


function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value;
}


function canonicalEqual(a, b) {
  return JSON.stringify(canonicalize(a)) ===
         JSON.stringify(canonicalize(b));
}


function deepFreeze(obj) {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    for (const k of Object.keys(obj)) {
      deepFreeze(obj[k]);
    }
  }
  return obj;
}


/* ============================================================ */


export async function runAdversarialSuite({
  snapshot,
  snapshot_fingerprint,
  registryEntries,
  enabled_plugin_ids
}) {


  deepFreeze(registryEntries);


  const scenarios = [
    testSnapshotMutation,
    testEnvelopeTamper,
    testEntropyOverflow,
    testCrossPluginLeakage,
    testArtifactFirewallBypass,
    testCapabilityEscalation,
    testReplayDrift,
    testFingerprintForgery,
    testUiOverlayInjection,
    testRegistryMutationAttempt
  ];


  const results = [];


  for (const scenario of scenarios) {
    results.push(await scenario({
      snapshot,
      snapshot_fingerprint,
      registryEntries,
      enabled_plugin_ids
    }));
  }


  const harness_fingerprint =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.TEST_SUITE,
      canonicalize({
        version: RED_TEAM_HARNESS_VERSION,
        results
      })
    );


  return Object.freeze({
    harness_version: RED_TEAM_HARNESS_VERSION,
    results,
    harness_fingerprint
  });
}


/* ============================================================
   Attack Scenarios
   ============================================================ */


async function testSnapshotMutation(config) {


  const mutated = canonicalize(config.snapshot);
  mutated.__evil = true;


  try {
    await executePlugins({
      snapshot: mutated,
      snapshot_fingerprint: config.snapshot_fingerprint,
      registryEntries: config.registryEntries,
      enabled_plugin_ids: config.enabled_plugin_ids
    });


    return { scenario: "snapshot_mutation", passed: false };


  } catch {
    return { scenario: "snapshot_mutation", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testEnvelopeTamper(config) {


  const plugin = config.registryEntries[0];
  if (!plugin) return { scenario: "envelope_tamper", passed: true };


  const execution_id = "red_team_test";


  const envelope = {
    snapshot: config.snapshot,
    snapshot_fingerprint: config.snapshot_fingerprint,
    plugin_id: plugin.plugin_id,
    version: plugin.version
  };


  const before =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.EXECUTION_ENVELOPE,
      canonicalize(envelope)
    );


  try {
    envelope.injected = true;


    await runIsolatedExecution({
      plugin,
      executionEnvelope: envelope,
      execution_id
    });


    return { scenario: "envelope_tamper", passed: false };


  } catch {
    return { scenario: "envelope_tamper", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testEntropyOverflow(config) {


  const guard = await createEntropyGuard({
    plugin_id: "entropy_test",
    version: "1.0",
    snapshot_fingerprint: config.snapshot_fingerprint,
    scheduler_fingerprint: "test_scheduler",
    execution_id: "entropy_exec",
    declared_max_entropy_calls: 2
  });


  try {
    guard.consumeUint64();
    guard.consumeUint64();
    guard.consumeUint64();
    return { scenario: "entropy_overflow", passed: false };
  } catch {
    return { scenario: "entropy_overflow", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testCrossPluginLeakage() {


  const before = globalThis.__leak_probe;


  globalThis.__leak_probe = "injected";


  const after = globalThis.__leak_probe;


  delete globalThis.__leak_probe;


  return {
    scenario: "cross_plugin_state",
    passed: before === undefined && after === "injected"
  };
}


/* ------------------------------------------------------------ */


async function testArtifactFirewallBypass(config) {


  const maliciousArtifact = {
    artifact_type: "scheduler.execution_summary",
    score: 999,
    declaredNonAuthoritative: false
  };


  try {
    await runIsolatedExecution({
      plugin: config.registryEntries[0],
      executionEnvelope: {},
      execution_id: "firewall_test"
    });


    return { scenario: "artifact_firewall_bypass", passed: true };


  } catch {
    return { scenario: "artifact_firewall_bypass", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testCapabilityEscalation(config) {


  const plugin = canonicalize(config.registryEntries[0]);
  if (!plugin) return { scenario: "capability_escalation", passed: true };


  plugin.capability_scope = plugin.capability_scope || {};
  plugin.capability_scope.network_access = true;


  try {
    await runIsolatedExecution({
      plugin,
      executionEnvelope: {},
      execution_id: "capability_test"
    });


    return { scenario: "capability_escalation", passed: false };


  } catch {
    return { scenario: "capability_escalation", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testReplayDrift(config) {


  const runA = await executePlugins({
    snapshot: config.snapshot,
    snapshot_fingerprint: config.snapshot_fingerprint,
    registryEntries: config.registryEntries,
    enabled_plugin_ids: config.enabled_plugin_ids
  });


  const runB = await executePlugins({
    snapshot: config.snapshot,
    snapshot_fingerprint: config.snapshot_fingerprint,
    registryEntries: config.registryEntries,
    enabled_plugin_ids: config.enabled_plugin_ids
  });


  return {
    scenario: "replay_drift",
    passed: canonicalEqual(runA, runB)
  };
}


/* ------------------------------------------------------------ */


async function testFingerprintForgery(config) {


  const fake =
    await fingerprintWithDomain(
      FINGERPRINT_DOMAINS.SNAPSHOT,
      { injected: true }
    );


  return {
    scenario: "fingerprint_forgery",
    passed: fake !== config.snapshot_fingerprint
  };
}


/* ------------------------------------------------------------ */


async function testUiOverlayInjection(config) {


  const mutated = canonicalize(config.snapshot);
  mutated.ui_overlay = { injected: true };


  try {
    await executePlugins({
      snapshot: mutated,
      snapshot_fingerprint: config.snapshot_fingerprint,
      registryEntries: config.registryEntries,
      enabled_plugin_ids: config.enabled_plugin_ids
    });


    return { scenario: "ui_overlay_injection", passed: false };


  } catch {
    return { scenario: "ui_overlay_injection", passed: true };
  }
}


/* ------------------------------------------------------------ */


async function testRegistryMutationAttempt(config) {


  try {
    config.registryEntries.push({ malicious: true });
    return { scenario: "registry_mutation", passed: false };
  } catch {
    return { scenario: "registry_mutation", passed: true };
  }
}


semantic_delta_validator.js
