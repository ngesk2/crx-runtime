export interface OwnershipAuditReport {
  commodityPaths: string[];
  constitutionalPaths: string[];
  deferredPaths: string[];
  summary: string;
}

const commodityPrefixes = [
  'frontends/',
  'graph/',
  'lsp/',
  'repair/',
  'fuzzing/',
  'query/',
  'execution/',
  'cli/',
];

const constitutionalPrefixes = [
  'engines/',
  'ir/',
  'lowering/',
  'proof/',
  'diagnostics/',
  'optimizer/',
  'reasoning/',
  'registry/',
  'evidence/',
  'rules/',
  'solver/',
  'canonical/',
];

export function auditRepositoryOwnership(paths: string[]): OwnershipAuditReport {
  const commodityPaths: string[] = [];
  const constitutionalPaths: string[] = [];
  const deferredPaths: string[] = [];

  for (const path of paths) {
    const normalized = path.replace(/\\/g, '/');
    const isCommodity = commodityPrefixes.some((prefix) => normalized.startsWith(prefix));
    const isConstitutional = constitutionalPrefixes.some((prefix) => normalized.startsWith(prefix));

    if (isCommodity && !isConstitutional) {
      commodityPaths.push(path);
    } else if (isConstitutional) {
      constitutionalPaths.push(path);
    } else {
      deferredPaths.push(path);
    }
  }

  return {
    commodityPaths,
    constitutionalPaths,
    deferredPaths,
    summary: `Commodity: ${commodityPaths.length}; Constitutional: ${constitutionalPaths.length}; Deferred: ${deferredPaths.length}`,
  };
}
