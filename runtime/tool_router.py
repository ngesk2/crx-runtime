#!/usr/bin/env python3
"""
Simple tool router for Ollama supervisor.
Input JSON: {"tool": "authority_search", "args": { ... }}
Output JSON: {"success": true, "data": {...}} or {"success": false, "error": "..."}
"""
import sys
import os
import json
import subprocess

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TOOLS_DIR = os.path.join(ROOT, 'runtime', 'tools')

TOOL_MAP = {
    'authority_search': os.path.join(TOOLS_DIR, 'authority_search.py'),
    'contradiction_search': os.path.join(TOOLS_DIR, 'contradiction_search.py'),
    'graph_expand': os.path.join(TOOLS_DIR, 'graph_expand.py'),
    'lineage_search': os.path.join(TOOLS_DIR, 'lineage_search.py'),
    'repository_symbols': os.path.join(TOOLS_DIR, 'repository_symbols.py'),
    'repository_relationships': os.path.join(TOOLS_DIR, 'repository_relationships.py')
}


def run_script(path, args, timeout=15):
    if not os.path.exists(path):
        return {'error': f'missing tool script: {path}'}
    try:
        proc = subprocess.run(['python', path], input=json.dumps(args).encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
        if proc.returncode != 0:
            return {'error': proc.stderr.decode('utf-8')}
        try:
            return json.loads(proc.stdout.decode('utf-8'))
        except Exception:
            return {'error': 'invalid JSON from tool'}
    except Exception as e:
        return {'error': str(e)}


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'success': False, 'error': 'invalid input'}))
        sys.exit(1)
    tool = data.get('tool')
    args = data.get('args', {})
    path = TOOL_MAP.get(tool)
    if not path:
        print(json.dumps({'success': False, 'error': f'unknown tool: {tool}'}))
        sys.exit(1)
    res = run_script(path, args)
    if res.get('error'):
        print(json.dumps({'success': False, 'error': res.get('error')}))
    else:
        print(json.dumps({'success': True, 'data': res}))


if __name__ == '__main__':
    main()
