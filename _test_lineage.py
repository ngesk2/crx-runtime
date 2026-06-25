#!/usr/bin/env python3
"""Test lineage_search with the new data."""
import sys, json, subprocess

# Test lineage_search with PING CONSTITUTION event_id
p = subprocess.run(['python', '/app/runtime/tools/lineage_search.py'],
    input=json.dumps({'artifact_id': 'c8f12987-5915-5f3f-be9a-c35cdf1f451d'}),
    capture_output=True, text=True, timeout=15)
try:
    r = json.loads(p.stdout)
    print("=== LINEAGE SEARCH (PING CONSTITUTION) ===")
    print(f"Artifact: {r.get('artifact')}")
    print(f"Events: {len(r.get('events', []))}")
    print(f"Projections: {len(r.get('projections', []))}")
    print(f"Authorities: {len(r.get('authorities', []))}")
    for a in r.get('authorities', [])[:3]:
        print(f"  Lineage: ancestor={str(a.get('ancestor',''))[:8]} descendant={str(a.get('descendant',''))[:8]} relation={a.get('relation','')}")
except Exception as e:
    print(f"Error: {e}")
    print(f"Stdout: {p.stdout[:500]}")
    print(f"Stderr: {p.stderr[:500]}")
