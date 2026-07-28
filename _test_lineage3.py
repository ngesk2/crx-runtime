#!/usr/bin/env python3
import sys, json, os, traceback
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

import psycopg2, psycopg2.extras
conn = psycopg2.connect(host='postgres', port=5432, database='crx_runtime', user='postgres', password='postgres')

# Show all tables
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
cur.execute("""
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema='public' ORDER BY table_name
""")
print("Tables:", [r[0] for r in cur])
cur.close()
conn.close()

# Now test step by step like lineage_search does
conn2 = psycopg2.connect(host='postgres', port=5432, database='crx_runtime', user='postgres', password='postgres')
cur2 = conn2.cursor(cursor_factory=psycopg2.extras.DictCursor)
aid = 'c8f12987-5915-5f3f-be9a-c35cdf1f451d'

# Step 1: artifact
try:
    cur2.execute("SELECT * FROM artifact_registry WHERE artifact_id=%s", (aid,))
    r = cur2.fetchone()
    print(f"Artifact: {r is not None}")
except Exception as e:
    print(f"Artifact error: {e}")
    traceback.print_exc()

# Step 2: events
try:
    cur2.execute("SELECT event_id AS id, aggregate_type AS stream, event_type, event_data AS payload, timestamp AS created_at FROM events WHERE event_data::text ILIKE %s ORDER BY timestamp", (f'%{aid}%',))
    evs = cur2.fetchall()
    print(f"Events: {len(evs)}")
except Exception as e:
    print(f"Events error: {e}")
    traceback.print_exc()

# Step 3: authority_lineage
try:
    cur2.execute("SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", (aid, aid))
    auths = cur2.fetchall()
    print(f"Authority: {len(auths)}")
    for a in auths:
        print(f"  {dict(a)}")
except Exception as e:
    print(f"Authority error: {e}")
    traceback.print_exc()

cur2.close()
conn2.close()
