canonical_fingerprint_service.js
/* ============================================================
   canonical_fingerprint_service.js
   ------------------------------------------------------------
   Deterministic, versioned, domain-separated SHA-256 hashing.


   SCHEMA VERSION: fingerprint.schema.3.0


   Constitutional Guarantees:
   - Async-only hashing
   - Single hashing path preference (WebCrypto first)
   - Frozen domain registry (single authority)
   - Precomputed domain set (O(1) validation)
   - Strict structural canonicalization
   - Explicit BigInt rejection
   - Explicit Symbol rejection
   - Explicit Function rejection
   - Negative zero preserved
   - Scientific notation guard (optional strict mode)
   - Circular detection via WeakSet
   - No sparse arrays
   - No undefined anywhere
   - No non-plain objects
   - Optional maxDepth guard
   - UTF-8 NFC string normalization
   - Length-prefixed preimage construction
   - Explicit expected hash validation
   - Zero runtime heuristics
   - Replay purity across runtimes
   ============================================================ */


export const FINGERPRINT_SCHEMA_VERSION = "fingerprint.schema.3.0";
export const HASH_ALGORITHM = "SHA-256";


/* ============================================================
   Frozen Domain Registry (Single Authority)
   ============================================================ */


export const FINGERPRINT_DOMAINS = Object.freeze({
  SNAPSHOT: "SNAPSHOT",
  ARTIFACT: "ARTIFACT",
  DIFF: "DIFF",
  RELATIONSHIP: "RELATIONSHIP",
  ANCHOR: "ANCHOR",
  DRIFT_REPORT: "DRIFT_REPORT",


  EXECUTION_RECORD: "EXECUTION_RECORD",
  EXECUTION_FAILURE: "EXECUTION_FAILURE",
  EXECUTION_ID: "EXECUTION_ID",
  EXECUTION_ENVELOPE: "EXECUTION_ENVELOPE",


  SCHEDULER: "SCHEDULER",
  SCHEDULER_SUMMARY: "SCHEDULER_SUMMARY",


  PLUGIN_SEED: "PLUGIN_SEED",
  TIMEOUT: "TIMEOUT",
  CAPABILITY_DECLARATION: "CAPABILITY_DECLARATION",


  STRUCTURAL_NODE: "STRUCTURAL_NODE",
  PROJECTION: "PROJECTION",
  DIFF_ARTIFACT: "DIFF_ARTIFACT"
});


const DOMAIN_SET = new Set(Object.values(FINGERPRINT_DOMAINS));
Object.freeze(DOMAIN_SET);


/* ============================================================
   Errors
   ============================================================ */


export class CanonicalizationError extends Error {
  constructor(message) {
    super(message);
    this.name = "CanonicalizationError";
  }
}


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


function assertFiniteNumber(value) {
  if (!Number.isFinite(value)) {
    throw new CanonicalizationError(
      "Non-finite numbers are not allowed"
    );
  }
}


function validateExpectedHashFormat(hash) {
  if (typeof hash !== "string") {
    throw new CanonicalizationError("Expected hash must be string");
  }


  if (!/^[a-f0-9]{64}$/.test(hash)) {
    throw new CanonicalizationError(
      "Expected fingerprint must be 64 lowercase hex characters"
    );
  }
}


function validateDomain(domain) {
  if (!DOMAIN_SET.has(domain)) {
    throw new CanonicalizationError(
      `Invalid fingerprint domain: ${domain}`
    );
  }
}


/* ============================================================
   Canonicalization Engine
   ============================================================ */


export function canonicalize(value, options = {}) {
  const {
    rejectUnknownFields = false,
    allowedTopLevelFields = null,
    strictNumberMode = false,
    maxDepth = 100
  } = options;


  const seen = new WeakSet();


  function _canonicalize(val, depth) {
    if (depth > maxDepth) {
      throw new CanonicalizationError(
        "Maximum canonicalization depth exceeded"
      );
    }


    if (val === null) return "null";


    const type = typeof val;


    /* ========================
       Primitive Handling
       ======================== */


    if (type === "boolean") {
      return val ? "true" : "false";
    }


    if (type === "number") {
      assertFiniteNumber(val);


      if (Object.is(val, -0)) return "-0";


      const asString = val.toString();


      if (strictNumberMode && /e/i.test(asString)) {
        throw new CanonicalizationError(
          "Scientific notation not allowed in strictNumberMode"
        );
      }


      return JSON.stringify(val);
    }


    if (type === "string") {
      const normalized = val.normalize("NFC");
      return JSON.stringify(normalized);
    }


    if (type === "bigint") {
      throw new CanonicalizationError("BigInt not supported");
    }


    if (type === "undefined") {
      throw new CanonicalizationError("Undefined not allowed");
    }


    if (type === "symbol") {
      throw new CanonicalizationError("Symbol not supported");
    }


    if (type === "function") {
      throw new CanonicalizationError("Function not supported");
    }


    /* ========================
       Array Handling
       ======================== */


    if (Array.isArray(val)) {
      if (seen.has(val)) {
        throw new CanonicalizationError(
          "Circular reference detected"
        );
      }


      seen.add(val);


      const items = [];


      for (let i = 0; i < val.length; i++) {
        if (!(i in val)) {
          throw new CanonicalizationError(
            "Sparse arrays not allowed"
          );
        }


        const item = val[i];


        if (item === undefined) {
          throw new CanonicalizationError(
            "Undefined not allowed in arrays"
          );
        }


        items.push(_canonicalize(item, depth + 1));
      }


      seen.delete(val);


      return "[" + items.join(",") + "]";
    }


    /* ========================
       Plain Object Handling
       ======================== */


    if (isPlainObject(val)) {
      if (seen.has(val)) {
        throw new CanonicalizationError(
          "Circular reference detected"
        );
      }


      seen.add(val);


      const keys = Object.keys(val).sort();
      const entries = [];


      for (const key of keys) {
        if (typeof key !== "string") {
          throw new CanonicalizationError(
            "Non-string object key detected"
          );
        }


        if (
          depth === 0 &&
          rejectUnknownFields &&
          allowedTopLevelFields &&
          !allowedTopLevelFields.includes(key)
        ) {
          throw new CanonicalizationError(
            `Unknown top-level field: ${key}`
          );
        }


        const fieldValue = val[key];


        if (fieldValue === undefined) {
          throw new CanonicalizationError(
            `Undefined value not allowed for key: ${key}`
          );
        }


        entries.push(
          JSON.stringify(key) +
            ":" +
            _canonicalize(fieldValue, depth + 1)
        );
      }


      seen.delete(val);


      return "{" + entries.join(",") + "}";
    }


    /* ========================
       Everything Else Rejected
       ======================== */


    throw new CanonicalizationError(
      `Unsupported type in canonicalization: ${type}`
    );
  }


  return _canonicalize(value, 0);
}


/* ============================================================
   Async SHA-256 Hashing
   ============================================================ */


async function sha256Hex(inputString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(inputString);


  if (
    typeof globalThis.crypto !== "undefined" &&
    globalThis.crypto.subtle
  ) {
    const buffer = await globalThis.crypto.subtle.digest(
      HASH_ALGORITHM,
      data
    );


    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }


  try {
    const nodeCrypto = await import("crypto");


    return nodeCrypto
      .createHash("sha256")
      .update(inputString, "utf8")
      .digest("hex");
  } catch {
    throw new Error(
      "No compatible crypto implementation available"
    );
  }
}


/* ============================================================
   Length-Prefixed Preimage Construction
   ============================================================ */


function lengthPrefix(str) {
  return str.length + "|" + str;
}


function buildPreimage(domain, canonicalString) {
  validateDomain(domain);


  const schemaPart = lengthPrefix(FINGERPRINT_SCHEMA_VERSION);
  const domainPart = lengthPrefix(domain);
  const payloadPart = lengthPrefix(canonicalString);


  return schemaPart + domainPart + payloadPart;
}


/* ============================================================
   Public API (Async Only)
   ============================================================ */


export async function fingerprint(value, options = {}) {
  const domain =
    options.domain || FINGERPRINT_DOMAINS.SNAPSHOT;


  validateDomain(domain);


  const canonical = canonicalize(value, options);
  const preimage = buildPreimage(domain, canonical);


  return await sha256Hex(preimage);
}


export async function fingerprintWithDomain(
  domain,
  value,
  options = {}
) {
  validateDomain(domain);


  const canonical = canonicalize(value, options);
  const preimage = buildPreimage(domain, canonical);


  return await sha256Hex(preimage);
}


export async function verifyFingerprint(
  value,
  expectedHash,
  options = {}
) {
  validateExpectedHashFormat(expectedHash);


  const computed = await fingerprint(value, options);


  return computed === expectedHash;
}


/* ============================================================
   Freeze Public API
   ============================================================ */


Object.freeze(canonicalize);
Object.freeze(fingerprint);
Object.freeze(fingerprintWithDomain);
Object.freeze(verifyFingerprint);
plugin_execution_scheduler.js
