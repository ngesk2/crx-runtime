#!/usr/bin/env python3
import os
import runpy

# Load .env.qdrant from repo config if present
env_path = os.path.join('brainos', 'orchestration', 'config', 'environments', '.env.qdrant')
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' not in line:
                continue
            k, v = line.split('=', 1)
            v = v.strip().strip('"').strip("'")
            os.environ.setdefault(k.strip(), v)

# Run the audit script
runpy.run_path(os.path.join('tools','projection_sovereignty_audit.py'), run_name='__main__')
