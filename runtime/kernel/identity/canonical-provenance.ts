/**
 * Canonical Provenance
 * Part of CanonicalObject decomposition.
 */

export interface CanonicalProvenance {
  source_id: string;
  parents: string[];
  lineage: string[];
  origin: string;
}
