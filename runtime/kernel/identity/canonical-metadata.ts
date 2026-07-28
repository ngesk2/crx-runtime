/**
 * Canonical Metadata
 * Part of CanonicalObject decomposition.
 */

export interface CanonicalMetadata {
  schema_version: string;
  created_at: string;
  modified_at: string;
  tags: string[];
  annotations: Record<string, string>;
}
