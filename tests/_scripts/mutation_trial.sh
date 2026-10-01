#!/usr/bin/env bash
# mutation_trial.sh — StrykerJS trial on ONE constitutional target.
#
# WHY AN ISOLATED COPY? Stryker sandboxes the project by copying it. Run from
# tests/, the sandbox breaks the test files' ../../ping-runtime requires.
# Run from the repo root, the sandbox chokes on worktree symlinks and copies
# 60k files. So this script builds a minimal isolated trial dir containing
# only the mutated file, its dependency, and the unit tests, preserving the
# tests/ + ping-runtime/ relative layout the requires expect.
# (Procedure proven 2026-09-30: 100% kill rate, 66/66, on namespace_binding.js.)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TRIAL="$(mktemp -d)"
trap 'rm -rf "$TRIAL"' EXIT

mkdir -p "$TRIAL/ping-runtime/canonicalization" "$TRIAL/ping-runtime/runtime" "$TRIAL/tests/unit"
cp "$ROOT/ping-runtime/canonicalization/namespace_binding.js" "$TRIAL/ping-runtime/canonicalization/"
cp "$ROOT/ping-runtime/runtime/tenant_capability_grant.js"           "$TRIAL/ping-runtime/runtime/"
cp "$ROOT/tests/unit/namespace_binding.test.js" "$ROOT/tests/unit/grant_validation.test.js" "$TRIAL/tests/unit/"
cp "$ROOT/tests/stryker.conf.json" "$TRIAL/"

# Baseline must be green or the trial is meaningless.
(cd "$TRIAL" && node --test tests/unit/namespace_binding.test.js tests/unit/grant_validation.test.js > /dev/null)

cd "$TRIAL" && "$ROOT/tests/node_modules/.bin/stryker" run stryker.conf.json
