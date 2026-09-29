#!/usr/bin/env python3
"""
Qdrant Access Sovereignty Test (Python path)

Guards the convergence: exactly ONE module in the enforced Python tree may
construct a Qdrant client -- runtime/authorities/projection_authority.py
(ProjectionAuthority.get_client()).

The enforced Python tree is the canonical runtime/ package. Every Python
worker or tool under runtime/ that touches Qdrant must consume
ProjectionAuthority.get_client() instead of calling QdrantClient(...) itself.

This is the Python counterpart of gateway/test_qdrant_access_sovereignty.js.
The Node path owns its own construction site because a Python module cannot
own the Node runtime; symmetrically no Node module can own this path.

Modules off the enforced path (dead code, harnesses, one-off root scripts)
are out of scope by design; they cannot serve live traffic.

Run: python3 runtime/authorities/test_qdrant_access_sovereignty.py
Exit code: 0 on PASS, 1 on FAIL.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
ENFORCED_TREE = REPO_ROOT / "runtime"
AUTHORITY_REL = Path("runtime/authorities/projection_authority.py")

# Matches direct client construction: QdrantClient( or QdrantClient (
# (the escaped \s keeps this source line itself from matching the pattern)
CONSTRUCT_RE = re.compile(r"QdrantClient\s*\(")


def strip_comments(src: str) -> str:
    # Drop full-line comments only; trailing-# stripping would corrupt
    # string literals, and a construction always starts on its own line.
    return "\n".join(
        line for line in src.splitlines() if not line.lstrip().startswith("#")
    )


def count_constructions(path: Path) -> int:
    src = strip_comments(path.read_text(encoding="utf-8", errors="replace"))
    return len(CONSTRUCT_RE.findall(src))


def main() -> int:
    failures = 0
    print("=== Qdrant Access Sovereignty (Python) ===\n")
    print("Enforced tree: runtime/")

    authority_abs = REPO_ROOT / AUTHORITY_REL

    # 1. The authority module must exist and contain exactly one construction.
    if not authority_abs.exists():
        print(f"  FAIL: authority module missing: {AUTHORITY_REL}")
        failures += 1
    else:
        n = count_constructions(authority_abs)
        if n != 1:
            print(f"  FAIL: {AUTHORITY_REL} constructs QdrantClient {n}x (expected exactly 1)")
            failures += 1
        else:
            print(f"  OK: {AUTHORITY_REL} is the single construction site")

    # 2. No other module in the enforced tree may construct a Qdrant client.
    violations = 0
    py_files = sorted(ENFORCED_TREE.rglob("*.py"))
    print(f"Enforced-tree modules scanned: {len(py_files)}")
    for mod in py_files:
        if mod == authority_abs:
            continue
        if mod.name == Path(__file__).name:
            continue  # this guard test itself
        if "__pycache__" in mod.parts:
            continue
        n = count_constructions(mod)
        if n > 0:
            violations += 1
            print(f"  FAIL: {mod.relative_to(REPO_ROOT)} constructs QdrantClient {n}x in the enforced tree")
            failures += 1
    if violations == 0:
        print("  OK: no other enforced-tree module constructs a Qdrant client")

    result = "PASS" if failures == 0 else "FAIL"
    print("=== Result: " + result + " (" + str(failures) + " failure(s)) ===")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
