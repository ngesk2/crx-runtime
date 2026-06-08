#!/bin/bash

# CI ENFORCEMENT SCRIPT
# Enforces replay kernel dependency rules in CI pipeline

set -e

REPLAY_DIR="runtime/replay"
VIOLATIONS=0

echo "Checking replay kernel dependencies..."

# Run dependency validator
if [ -f "tools/dependency-guard/dependency-validator.ts" ]; then
  npx ts-node tools/dependency-guard/dependency-validator.ts "$REPLAY_DIR"
  if [ $? -ne 0 ]; then
    echo "ERROR: Replay kernel dependency violations found"
    VIOLATIONS=1
  fi
fi

# Run ESLint with replay rules
if [ -f ".eslintrc.json" ]; then
  npx eslint "$REPLAY_DIR/**/*.ts" --rule 'no-replay-forbidden-imports: error'
  if [ $? -ne 0 ]; then
    echo "ERROR: ESLint violations found in replay kernel"
    VIOLATIONS=1
  fi
fi

if [ $VIOLATIONS -eq 1 ]; then
  echo "FAILED: Replay kernel dependency enforcement failed"
  exit 1
fi

echo "PASSED: Replay kernel dependency enforcement passed"
exit 0
