entropy_budget_guard.js
/* ============================================================
   entropy_budget_guard.js (Hardened Constitutional)
   ------------------------------------------------------------
   Guarantees:
   - Deterministic entropy derivation (PLUGIN_SEED domain)
   - Bounded entropy usage
   - Reseed prevention
   - Cross-plugin isolation
   - Replay-bound entropy fingerprint
   - No entropy amplification
   - Integer-first deterministic PRNG
   ============================================================ */


import {
  fingerprintWithDomain,
  FINGERPRINT_DOMAINS
} from "../core/canonical_fingerprint_service.js";


/* ============================================================ */


export const ENTROPY_GUARD_VERSION = "entropy.2.0";


/* ============================================================ */


export class EntropyBudgetViolationError extends Error {
  constructor(message) {
    super(message);
    this.name = "EntropyBudgetViolationError";
  }
}


/* ============================================================
   Guard Registry (Prevents Reseeding)
   ============================================================ */


const ACTIVE_GUARDS = new Map();


/* ============================================================
   Deterministic 128-bit XOR-Shift PRNG
   ============================================================ */


function createDeterministicPRNG(seedHex) {


  if (typeof seedHex !== "string" || seedHex.length < 64) {
    throw new EntropyBudgetViolationError(
      "Seed must be 64+ char hex string"
    );
  }


  const seedA = BigInt("0x" + seedHex.slice(0, 32));
  const seedB = BigInt("0x" + seedHex.slice(32, 64));


  let s0 = seedA || 1n;
  let s1 = seedB || 2n;


  let callCount = 0;


  function nextUint64() {
    callCount++;


    let x = s0;
    let y = s1;


    s0 = y;


    x ^= x << 23n;
    x ^= x >> 17n;
    x ^= y ^ (y >> 26n);


    s1 = x;


    return (s0 + s1) & ((1n << 64n) - 1n);
  }


  return {
    nextUint64,
    getCallCount: () => callCount
  };
}


/* ============================================================
   Public Factory
   ============================================================ */


export async function createEntropyGuard({
  plugin_id,
  version,
  snapshot_fingerprint,
  scheduler_fingerprint,
  execution_id,
  declared_max_entropy_calls = 100
}) {


  if (!plugin_id || !snapshot_fingerprint) {
    throw new EntropyBudgetViolationError(
      "Missing required entropy binding inputs"
    );
  }


  if (declared_max_entropy_calls <= 0) {
    throw new EntropyBudgetViolationError(
      "declared_max_entropy_calls must be positive"
    );
  }


  /* ------------------------------------------------------------
     1?? Reseed Protection
     ------------------------------------------------------------ */


  const guardKey = `${plugin_id}:${execution_id}`;


  if (ACTIVE_GUARDS.has(guardKey)) {
    throw new EntropyBudgetViolationError(
      "Reseeding attempt detected"
    );
  }


  /* ------------------------------------------------------------
     2?? Deterministic Seed (PLUGIN_SEED Domain)
     ------------------------------------------------------------ */


  const deterministic_seed = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.PLUGIN_SEED,
    {
      plugin_id,
      version,
      snapshot_fingerprint,
      scheduler_fingerprint,
      execution_id,
      guard_version: ENTROPY_GUARD_VERSION
    }
  );


  /* ------------------------------------------------------------
     3?? PRNG Construction
     ------------------------------------------------------------ */


  const prng = createDeterministicPRNG(deterministic_seed);


  let exhausted = false;


  function consumeUint64() {


    if (exhausted) {
      throw new EntropyBudgetViolationError(
        "Entropy budget exhausted"
      );
    }


    if (prng.getCallCount() >= declared_max_entropy_calls) {
      exhausted = true;
      throw new EntropyBudgetViolationError(
        "Entropy budget exceeded"
      );
    }


    return prng.nextUint64();
  }


  /* Optional float adapter (derived, not primary) */
  function consumeFloat53() {
    const value = consumeUint64();
    const max = (1n << 53n) - 1n;
    return Number(value & max) / Number(max);
  }


  function getEntropyReport() {
    return Object.freeze({
      plugin_id,
      version,
      snapshot_fingerprint,
      scheduler_fingerprint,
      execution_id,
      seed: deterministic_seed,
      calls_used: prng.getCallCount(),
      calls_allowed: declared_max_entropy_calls,
      exhausted
    });
  }


  /* ------------------------------------------------------------
     4?? Replay-Bound Entropy Fingerprint
     ------------------------------------------------------------ */


  async function computeEntropyFingerprint() {
    return fingerprintWithDomain(
      FINGERPRINT_DOMAINS.ENTROPY_BUDGET,
      {
        plugin_id,
        execution_id,
        snapshot_fingerprint,
        scheduler_fingerprint,
        calls_used: prng.getCallCount(),
        calls_allowed: declared_max_entropy_calls,
        guard_version: ENTROPY_GUARD_VERSION
      }
    );
  }


  /* Register guard */
  ACTIVE_GUARDS.set(guardKey, true);


  return Object.freeze({
    consumeUint64,
    consumeFloat53,
    getEntropyReport,
    computeEntropyFingerprint
  });
}
isolated_execution_adapter.js
