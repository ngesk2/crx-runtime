#!/usr/bin/env python3
import sys, json, os
sys.path.insert(0, '/app/runtime')
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

from tools.lineage_search import try_postgres_lineage, load_local

# Direct test
import psycopg2, psycopg2.extras
conn = psycopg2.connect(host='postgres', port=5432, database='crx_runtime', user='postgres', password='postgres')
cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

aid = 'c8f12987-5915-5f3f-be9a-c35cdf1f451d'

# Test 1: direct SQL
cur.execute("SELECT * FROM authority_lineage WHERE ancestor=%s OR descendant=%s", (aid, aid))
rows = cur.fetchall()
print(f"Direct SQL: {len(rows)} rows")
for r in rows:
    print(f"  dict ok: {dict(r).get('ancestor')}")

# Test 2: same via try_postgres_lineage
cur.close()
conn.close()

res = try_postgres_lineage(aid)
if res:
    print(f"\ntry_postgres_lineage: artifact={res['artifact'] is not None}, events={len(res['events'])}, auth={len(res['authorities'])}")
    if res['authorities']:
        for a in res['authorities']:
            print(f"  {a.get('relation')} ancestor={str(a.get('ancestor',''))[:8]} → {str(a.get('descendant',''))[:8]}")
    else:
        print("  authorities list is empty")
else:
    print("\ntry_postgres_lineage returned None")
