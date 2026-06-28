"""RepositoryAuthority — single authority for all database queries.

Every database query in the system routes through this class.
No worker or tool executes raw SQL against Postgres.
"""

from typing import Optional, Dict, Any, List
from runtime.adapters.repository_adapter import get_repository_connection


class RepositoryAuthority:
    """Typed database authority. All methods are static for stateless routing."""

    @staticmethod
    def search_authorities(query: str) -> Optional[tuple]:
        """Search authority_objects table with ILIKE. Returns (candidates, superseded_ids)."""
        import psycopg2.extras
        try:
            conn = get_repository_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            q = "%" + query + "%"
            cur.execute("""
                SELECT ao.*,
                       (SELECT COUNT(*) FROM authority_lineage al
                        WHERE al.ancestor = ao.artifact_id OR al.descendant = ao.artifact_id) as lineage_depth,
                       (SELECT COUNT(*) FROM authority_witness aw WHERE aw.artifact_id = ao.artifact_id) as witness_count
                FROM authority_objects ao
                WHERE ao.title ILIKE %s OR ao.description ILIKE %s
                ORDER BY ao.authority_level DESC
                LIMIT 50
            """, (q, q))
            cands = [dict(r) for r in cur.fetchall()]
            superseded = set()
            try:
                cur.execute("SELECT superseded, superseded_by FROM authority_supersession")
                for r in cur.fetchall():
                    s, by = r
                    if by:
                        superseded.add(s)
            except Exception:
                pass
            cur.close()
            return cands, superseded
        except Exception:
            return None

    @staticmethod
    def search_events_by_payload(query: str) -> List[Dict[str, Any]]:
        """Search events table by payload text content."""
        import psycopg2.extras
        try:
            conn = get_repository_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            q = '%' + query + '%'
            cur.execute(
                "SELECT id, stream, event_type, payload, created_at FROM events WHERE payload::text ILIKE %s LIMIT 200",
                (q,))
            results = [dict(r) for r in cur.fetchall()]
            cur.close()
            return results
        except Exception:
            return []

    @staticmethod
    def search_projections_by_payload(query: str) -> List[Dict[str, Any]]:
        """Search projections table by payload text content."""
        import psycopg2.extras
        try:
            conn = get_repository_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            q = '%' + query + '%'
            cur.execute(
                "SELECT id, payload, payload_hash, projection_hash, created_at FROM projections WHERE payload::text ILIKE %s LIMIT 200",
                (q,))
            results = [dict(r) for r in cur.fetchall()]
            cur.close()
            return results
        except Exception:
            return []

    @staticmethod
    def fetch_relationships(node: str) -> List[Dict[str, Any]]:
        """Fetch object_relationships where node appears as source or target."""
        try:
            conn = get_repository_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT source, target, relation_type, metadata FROM object_relationships WHERE source=%s OR target=%s",
                (node, node))
            rows = cur.fetchall()
            edges = []
            for r in rows:
                source, target, reltype, meta = r
                edges.append({'source': source, 'target': target, 'type': reltype if reltype else 'related', 'meta': meta})
            cur.close()
            return edges
        except Exception:
            return []

    @staticmethod
    def fetch_authority_lineage(node: str) -> List[Dict[str, Any]]:
        """Fetch authority_lineage where node appears as ancestor or descendant."""
        try:
            conn = get_repository_connection()
            cur = conn.cursor()
            cur.execute(
                "SELECT ancestor, descendant, relation, metadata FROM authority_lineage WHERE ancestor=%s OR descendant=%s",
                (node, node))
            rows = cur.fetchall()
            edges = []
            for r in rows:
                anc, desc, rel, meta = r
                edges.append({'source': anc, 'target': desc, 'type': rel if rel else 'authority_lineage', 'meta': meta})
            cur.close()
            return edges
        except Exception:
            return []

    @staticmethod
    def fetch_lineage_data(artifact_id: str) -> Dict[str, Any]:
        """Fetch full lineage data for an artifact: artifact, events, projections, authorities, witnesses."""
        import psycopg2.extras
        try:
            conn = get_repository_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

            cur.execute("SELECT * FROM authority_objects WHERE artifact_id = %s", (artifact_id,))
            artifact = dict(cur.fetchone()) if cur.rowcount else None

            cur.execute("SELECT id, event_type, payload, created_at FROM events WHERE payload->>'artifact_id' = %s LIMIT 50", (artifact_id,))
            events = [dict(r) for r in cur.fetchall()]

            cur.execute("SELECT id, payload_hash, projection_hash, created_at FROM projections WHERE payload->>'artifact_id' = %s LIMIT 50", (artifact_id,))
            projections = [dict(r) for r in cur.fetchall()]

            cur.execute("SELECT * FROM authority_objects WHERE artifact_id IN (SELECT descendant FROM authority_lineage WHERE ancestor = %s) LIMIT 20", (artifact_id,))
            authorities = [dict(r) for r in cur.fetchall()]

            cur.close()
            return {'artifact': artifact, 'events': events, 'projections': projections, 'authorities': authorities, 'witness_roots': []}
        except Exception:
            return {'artifact': None, 'events': [], 'projections': [], 'authorities': [], 'witness_roots': []}
