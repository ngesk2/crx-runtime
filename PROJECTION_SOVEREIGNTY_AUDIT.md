PROJECTION SOVEREIGNTY AUDIT
=============================

Purpose
-------
Collect metrics to demonstrate Projection ← Event lineage guarantees.

Metrics to report
-----------------
- projection_count: total number of projection points in Qdrant collection
- verified_count: number of projections whose `payload_hash` matches the canonical event payload hash in Postgres
- mismatch_count: number of projections with a different `payload_hash` than Postgres (stale or tampered)
- orphan_count: number of projections referencing an `event_id` not present in Postgres

Quick-run script
----------------
Run the companion script `tools/projection_sovereignty_audit.py` which connects to Qdrant and Postgres using environment variables and prints the metrics.

Environment variables used
--------------------------
- QDRANT_URL (e.g., https://...cloud.qdrant.io)
- QDRANT_API_KEY
- QDRANT_COLLECTION (default: constitutional_memory)
- POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

Example usage
-------------
Set env vars, then run:

```bash
python tools/projection_sovereignty_audit.py
```

Notes
-----
- The script will iterate projection points in batches and compute the comparison using the canonical JSON sha256 of the Postgres `payload` column.
- If Qdrant or Postgres are inaccessible or require tunneling, run the script from an environment with network access to both services.

Output format
-------------
The script prints a concise summary and a CSV with per-projection details when run.
