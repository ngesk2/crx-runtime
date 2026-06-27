const fs = require('node:fs');
const path = require('node:path');

function lintGovernance(repoRoot) {
  const errors = [];
  const specRoot = path.join(repoRoot, 'specs');
  const adrRoot = path.join(repoRoot, 'adr');
  const authoritiesPath = path.join(repoRoot, 'constitutional-authorities.yaml');
  const capabilitiesPath = path.join(repoRoot, 'constitutional-capabilities.yaml');

  const requiredSpecDirs = [
    'parser-boundary',
    'replay-authority',
    'witness-authority',
    'capability',
    'governance',
    'constitutional-ir',
    'compiler-ir',
    'overlay-graph',
    'evidence',
    'scheduler',
    'execution',
    'ownership',
    'hashing',
  ];

  const requiredFiles = [
    'purpose.md',
    'requirements.md',
    'ownership.md',
    'invariants.md',
    'verification.md',
  ];

  if (!fs.existsSync(specRoot)) {
    errors.push('Missing /specs directory');
  }

  for (const dir of requiredSpecDirs) {
    const dirPath = path.join(specRoot, dir);
    if (!fs.existsSync(dirPath)) {
      errors.push(`Missing spec directory: ${dir}`);
      continue;
    }

    for (const file of requiredFiles) {
      const filePath = path.join(dirPath, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing spec artifact: ${dir}/${file}`);
      }
    }
  }

  if (!fs.existsSync(adrRoot)) {
    errors.push('Missing /adr directory');
  }

  if (!fs.existsSync(authoritiesPath)) {
    errors.push('Missing constitutional-authorities.yaml');
  }

  if (!fs.existsSync(capabilitiesPath)) {
    errors.push('Missing constitutional-capabilities.yaml');
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: `Governance scaffold checked: ${requiredSpecDirs.length} spec directories, ADR directory, authority registry, capability registry.`,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { lintGovernance };
}
