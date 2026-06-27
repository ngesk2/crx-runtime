#!/usr/bin/env python3
"""
repository_symbols tool
Input via STDIN JSON: {"symbol": "Name"}
Output JSON to STDOUT: {"definitions": [{"file": "path","line": 10,"type":"class|function|variable","snippet":"..."}]}

Searches the workspace for symbol definitions across Python/JS/TS files using AST (for Python) and heuristics for other languages.
"""
import sys
import os
import json
import ast
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', '.venv', 'venv'}
FILE_EXTS = ('.py', '.js', '.ts', '.jsx', '.tsx')


def search_python(path, symbol):
    defs = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            src = f.read()
        tree = ast.parse(src)
    except Exception:
        return defs
    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef) and node.name == symbol:
            lineno = getattr(node, 'lineno', 0)
            snippet = '\n'.join(src.splitlines()[lineno-1:lineno+4])
            defs.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': lineno, 'type': 'class', 'snippet': snippet})
        if isinstance(node, ast.FunctionDef) and node.name == symbol:
            lineno = getattr(node, 'lineno', 0)
            snippet = '\n'.join(src.splitlines()[lineno-1:lineno+4])
            defs.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': lineno, 'type': 'function', 'snippet': snippet})
    return defs


def search_textual(path, symbol):
    defs = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, start=1):
                if re.search(r"\b(class|function|def)\s+" + re.escape(symbol) + r"\b", line):
                    snippet = line.strip()
                    defs.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': i, 'type': 'definition', 'snippet': snippet})
                elif re.search(r"\bconst\s+"+re.escape(symbol)+r"\b|\blet\s+"+re.escape(symbol)+r"\b|\bvar\s+"+re.escape(symbol)+r"\b", line):
                    defs.append({'file': os.path.relpath(path, ROOT).replace('\\', '/'), 'line': i, 'type': 'variable', 'snippet': line.strip()})
    except Exception:
        pass
    return defs


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        print(json.dumps({'error': 'invalid input, expected JSON on stdin'})); sys.exit(1)
    symbol = data.get('symbol')
    if not symbol:
        print(json.dumps({'error': 'missing symbol'})); sys.exit(1)

    results = []
    for root, dirs, files in os.walk(ROOT):
        # prune
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for fname in files:
            if not fname.endswith(FILE_EXTS):
                continue
            path = os.path.join(root, fname)
            if fname.endswith('.py'):
                results.extend(search_python(path, symbol))
            else:
                results.extend(search_textual(path, symbol))

    print(json.dumps({'definitions': results}, indent=2))


if __name__ == '__main__':
    main()
