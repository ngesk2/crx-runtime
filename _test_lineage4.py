#!/usr/bin/env python3
"""Test lineage_search with visible exception handling."""
import sys, os, traceback
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

sys.path.insert(0, '/app/runtime')
import tools.lineage_search as LS

aid = 'c8f12987-5915-5f3f-be9a-c35cdf1f451d'
res = LS.try_postgres_lineage(aid)
if res:
    print(f"artifact: {res['artifact'] is not None}")
    print(f"events: {len(res['events'])}")
    print(f"auth: {len(res['authorities'])}")
    if res['authorities']:
        print("  OK - has data")
    else:
        print("  EMPTY")
        # Now let's debug by re-running with visible errors
        import psycopg2, psycopg2.extras
        conn = psycopg2.connect(**LS.POSTGRES_DSN)
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Step through each query
        for step_name, query, params in [
            ("artifact", "SELECT * FROM artifact_registry WHERE artifact_id=%s", (aid,)),
            ("events", "SELECT event_id AS id, aggregate_type AS stream, event_type, event_data AS payload, timestamp AS created_at FROM events WHERE event_data::text ILIKE %s ORDER BY timestamp", (f'%{aid}%',)),
            ("projections", "SELECT id, payload, payload_hash, projection_hash, created_at FROM projections WHERE payload::text ILIKE %s ORDER BY created_at", (f'%{aid}%',)),
            ("authority", "SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", (aid, aid)),
        ]:
            try:
                cur.execute(query, params)
                rows = cur.fetchall()
                print(f"  {step_name}: {len(rows)} rows from direct test")
            except Exception as e:
                print(f"  {step_name} ERROR: {e}")
                traceback.print_exc()
        cur.close()
        conn.close()
else:
    print("returned None")
    traceback.print_exc()
