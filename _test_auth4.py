#!/usr/bin/env python3
"""Debug authority_search verification."""
import sys, os, json
os.environ['POSTGRES_HOST'] = 'postgres'
os.environ['POSTGRES_USER'] = 'postgres'
os.environ['POSTGRES_PASSWORD'] = 'postgres'
os.environ['POSTGRES_DB'] = 'crx_runtime'
os.environ['POSTGRES_PORT'] = '5432'

sys.path.insert(0, '/app/runtime')
from tools.authority_search import try_postgres_search, mechanical_verification

cands, sup = try_postgres_search('constitution')
for c in cands[:3]:
    v = mechanical_verification(c)
    print(f"\n  {c['title']}")
    print(f"    payload_hash={c.get('payload_hash','')[:16]}... sha256={c.get('sha256')}")
    print(f"    lineage_depth={c.get('lineage_depth')} witness_count={c.get('witness_count')}")
    print(f"    status={c.get('status')}")
    print(f"    verification={json.dumps(v, indent=4)}")
