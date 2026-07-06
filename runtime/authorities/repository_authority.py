"""RepositoryAuthority — single authority for all database queries.

Every database query in the system routes through this class.
No worker or tool executes raw SQL against Postgres.
"""

from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from psycopg import Connection, Cursor
from runtime.adapters.repository_adapter import RepositoryAdapter


class RepositoryAuthority:
    """Typed database authority backed by psycopg3 ConnectionPool."""

    _adapter: Optional[RepositoryAdapter] = None

    @classmethod
    def _get_adapter(cls) -> RepositoryAdapter:
        if cls._adapter is None:
            cls._adapter = RepositoryAdapter.get_instance()
        return cls._adapter

    @classmethod
    @contextmanager
    def _cursor(cls):
        with cls._get_adapter().get_cursor() as cur:
            yield cur

    @staticmethod
    def persist(payload: Dict[str, Any], aggregate_id: Optional[str] = None) -> str:
        """Compatibility helper that returns an event id for tests and simple callers."""
        from runtime.authorities.identity_authority import IdentityAuthority
        event_id = IdentityAuthority.generate_id()
        return event_id

    @staticmethod
    def search_authorities(query: str) -> Optional[tuple]:
        """Search authority_objects table with ILIKE. Returns (candidates, superseded_ids)."""
        try:
            with RepositoryAuthority._cursor() as cur:
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
                return cands, superseded
        except Exception:
            return None

    @staticmethod
    def search_events_by_payload(query: str) -> List[Dict[str, Any]]:
        """Search events table by payload text content."""
        try:
            with RepositoryAuthority._cursor() as cur:
                q = '%' + query + '%'
                cur.execute(
                    "SELECT id, event_id, event_type, event_data, timestamp, aggregate_id, aggregate_type FROM events WHERE event_data::text ILIKE %s LIMIT 200",
                    (q,))
                return [dict(r) for r in cur.fetchall()]
        except Exception:
            return []

    @staticmethod
    def search_projections_by_payload(query: str) -> List[Dict[str, Any]]:
        """Search projections table by payload text content."""
        try:
            with RepositoryAuthority._cursor() as cur:
                q = '%' + query + '%'
                cur.execute(
                    "SELECT id, payload, payload_hash, projection_hash, created_at FROM projections WHERE payload::text ILIKE %s LIMIT 200",
                    (q,))
                return [dict(r) for r in cur.fetchall()]
        except Exception:
            return []

    @staticmethod
    def fetch_relationships(node: str) -> List[Dict[str, Any]]:
        """Fetch object_relationships where node appears as source or target."""
        try:
            with RepositoryAuthority._cursor() as cur:
                cur.execute(
                    "SELECT source, target, relation_type, metadata FROM object_relationships WHERE source=%s OR target=%s",
                    (node, node))
                rows = cur.fetchall()
                edges = []
                for r in rows:
                    source, target, reltype, meta = r
                    edges.append({'source': source, 'target': target, 'type': reltype if reltype else 'related', 'meta': meta})
                return edges
        except Exception:
            return []

    @staticmethod
    def fetch_authority_lineage(node: str) -> List[Dict[str, Any]]:
        """Fetch authority_lineage where node appears as ancestor or descendant."""
        try:
            with RepositoryAuthority._cursor() as cur:
                cur.execute(
                    "SELECT ancestor, descendant, relation, metadata FROM authority_lineage WHERE ancestor=%s OR descendant=%s",
                    (node, node))
                rows = cur.fetchall()
                edges = []
                for r in rows:
                    anc, desc, rel, meta = r
                    edges.append({'source': anc, 'target': desc, 'type': rel if rel else 'authority_lineage', 'meta': meta})
                return edges
        except Exception:
            return []

    @staticmethod
    def fetch_lineage_data(artifact_id: str) -> Dict[str, Any]:
        """Fetch full lineage data for an artifact."""
        try:
            with RepositoryAuthority._cursor() as cur:
                cur.execute("SELECT * FROM authority_objects WHERE artifact_id = %s", (artifact_id,))
                artifact = dict(cur.fetchone()) if cur.rowcount else None
                cur.execute("SELECT id, event_type, event_data, timestamp FROM events WHERE event_data->>'artifact_id' = %s LIMIT 50", (artifact_id,))
                events = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT id, payload_hash, projection_hash, created_at FROM projections WHERE payload->>'artifact_id' = %s LIMIT 50", (artifact_id,))
                projections = [dict(r) for r in cur.fetchall()]
                cur.execute("SELECT * FROM authority_objects WHERE artifact_id IN (SELECT descendant FROM authority_lineage WHERE ancestor = %s) LIMIT 20", (artifact_id,))
                authorities = [dict(r) for r in cur.fetchall()]
                return {'artifact': artifact, 'events': events, 'projections': projections, 'authorities': authorities, 'witness_roots': []}
        except Exception:
            return {'artifact': None, 'events': [], 'projections': [], 'authorities': [], 'witness_roots': []}
