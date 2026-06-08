domain_lockfile_fingerprint_guard.js
"use strict";


const fs = require("fs");
const path = require("path");
const {
  fingerprintWithDomain
} = require("./canonical_fingerprint_service");
const {
  FINGERPRINT_DOMAINS
} = require("./canonical_domain_registry");


class LockfileFingerprintViolation extends Error {
  constructor(message) {
    super(message);
    this.name = "LockfileFingerprintViolation";
  }
}


async function verifyLockfileFingerprint(lockfilePath) {
  const raw = fs.readFileSync(lockfilePath, "utf8");
  const parsed = JSON.parse(raw);


  if (!parsed.lockfile_fingerprint) {
    throw new LockfileFingerprintViolation("Missing lockfile fingerprint");
  }


  const computed = await fingerprintWithDomain(
    FINGERPRINT_DOMAINS.CI_VERIFICATION,
    parsed.domains
  );


  if (computed !== parsed.lockfile_fingerprint) {
    throw new LockfileFingerprintViolation(
      "Lockfile fingerprint mismatch"
    );
  }


  return true;
}


module.exports = {
  verifyLockfileFingerprint
};
domain_usage_static_analyzer.js
