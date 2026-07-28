/**
 * Canonical ID
 * Uniform identity structure for all canonical objects.
 */

export interface CanonicalID {
  authority: string;
  namespace: string;
  kind: string;
  version: string;
  hash: string;
}

export function formatCanonicalID(id: CanonicalID): string {
  return `${id.authority}.${id.namespace}.${id.kind}.v${id.version}.${id.hash}`;
}

export function parseCanonicalID(str: string): CanonicalID {
  const parts = str.split('.');
  if (parts.length < 5) {
    throw new Error(`Invalid Canonical ID format: ${str}`);
  }
  const versionPart = parts[3];
  const versionMatch = versionPart.match(/^v(\d+)$/);
  if (!versionMatch) {
    throw new Error(`Invalid version format: ${versionPart}`);
  }
  return {
    authority: parts[0],
    namespace: parts[1],
    kind: parts[2],
    version: versionMatch[1],
    hash: parts[4],
  };
}
