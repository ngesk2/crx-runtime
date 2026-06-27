#!/usr/bin/env python3
"""
repository_relationships tool
Input via STDIN JSON: {"symbol":"Name"}
Output JSON to STDOUT: {"imports":[], "calls":[], "writes":[]}

Heuristic analysis: finds files that reference the symbol and extracts import lines, call sites (symbol followed by '('), and write-like operations in those files.
"""
import sys
import os
import json
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv'}
FILE_EXTS = ('.py', '.js', '.ts', '.jsx', '.tsx')


def analyze_file(path, symbol):
    imports = []
    calls = []
    writes = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception:
        return imports, calls, writes

    for i, line in enumerate(lines, start=1):
        if 'import' in line or 'from ' in line:
            if symbol in line or re.search(r"from\s+.*{}\b".format(re.escape(symbol)), line):
                imports.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': i, 'text': line.strip()})
        if re.search(r"\b"+re.escape(symbol)+r"\s*\(|\b"+re.escape(symbol)+r"\.|\bnew\s+"+re.escape(symbol)+r"\b", line):
            calls.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': i, 'text': line.strip()})
        # heuristic writes
        if any(tok in line for tok in ('INSERT INTO', 'emit_event(', '.insert(', '.save(', 'fs.write', 'open(')):
            if symbol in line or re.search(re.escape(symbol), ''.join(lines[max(0, i-3):i+3])):
                writes.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': i, 'text': line.strip()})

    return imports, calls, writes


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input, expected JSON on stdin'})); sys.exit(1)
    symbol = data.get('symbol')
    if not symbol:
        print(json.dumps({'error': 'missing symbol'})); sys.exit(1)

    imports = []
    calls = []
    writes = []

    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for fname in files:
            if not fname.endswith(FILE_EXTS):
                continue
            path = os.path.join(root, fname)
            # quick textual filter
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except Exception:
                continue
            if symbol not in content:
                continue
            imp, cal, wri = analyze_file(path, symbol)
            imports.extend(imp)
            calls.extend(cal)
            writes.extend(wri)

    out = {'imports': imports, 'calls': calls, 'writes': writes}
    print(json.dumps(out, indent=2))


if __name__ == '__main__':
    main()
