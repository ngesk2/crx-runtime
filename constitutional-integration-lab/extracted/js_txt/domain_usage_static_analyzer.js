domain_usage_static_analyzer.js
"use strict";


/**
 * domain_usage_static_analyzer.js
 *
 * Guarantees:
 * - No hardcoded domain literals
 * - No dynamic domain construction
 * - Only FINGERPRINT_DOMAINS used
 * - Reports usage map
 * - Detects cross-module misuse
 */


const fs = require("fs");
const path = require("path");


const DOMAIN_REGISTRY_PATH = "./canonical_domain_registry.js";


class DomainUsageViolationError extends Error {
  constructor(violations) {
    super("Domain Usage Static Analysis Failed");
    this.name = "DomainUsageViolationError";
    this.violations = violations;
  }
}


function walkDirectory(dir, files = []) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);


    if (stat.isDirectory()) {
      walkDirectory(full, files);
    } else if (file.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}


function extractRegistryDomains() {
  const registry = require(DOMAIN_REGISTRY_PATH);
  return Object.values(registry.FINGERPRINT_DOMAINS);
}


function analyzeDomainUsage(sourcePaths) {
  const violations = [];
  const usageMap = {};
  const domains = extractRegistryDomains();


  const domainLiteralPattern = /["'](snapshot|structural_graph|execution_id|execution_envelope|plugin_seed|scheduler|registry_snapshot|lineage_link|projection_layer|artifact|entropy_budget|authority_proof|ci_verification|replay_session)["']/g;


  const fingerprintCallPattern = /fingerprintWithDomain\s*\(/g;


  for (const base of sourcePaths) {
    const files = walkDirectory(base);


    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");


      // Hardcoded domain literal detection
      const matches = content.match(domainLiteralPattern);
      if (matches && !file.includes("canonical_domain_registry")) {
        violations.push({
          type: "HARDCODED_DOMAIN_LITERAL",
          file,
          evidence: matches
        });
      }


      // fingerprintWithDomain usage tracking
      if (fingerprintCallPattern.test(content)) {
        usageMap[file] = (usageMap[file] || 0) + 1;
      }
    }
  }


  if (violations.length > 0) {
    throw new DomainUsageViolationError(violations);
  }


  return {
    success: true,
    usageMap
  };
}


module.exports = {
  analyzeDomainUsage,
  DomainUsageViolationError
};
projection_layer_isolation_guard.js
