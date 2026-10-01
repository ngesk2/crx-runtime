#!/usr/bin/env bash
# ladder_pr.sh — run every PR tier independently, report per-tier results.
# Tiers do NOT short-circuit: the BUG-0001 regression pins fail by design
# while the bug is open, and a && chain would hide every tier behind that
# one known failure. Each tier's result is evidence; UNKNOWN (skipped) is not
# a result. Exits non-zero if any tier failed.
set -u
cd "$(dirname "$0")/.."
TIERS="test:static test:unit test:property:pr test:metamorphic:pr test:model test:replay"
overall=0
summary=""
for t in $TIERS; do
  log="$(mktemp)"
  if npm run "$t" > "$log" 2>&1; then
    summary="${summary}PASS  $t
"
  else
    summary="${summary}FAIL  $t
"
    overall=1
    echo "--- $t FAILED (tail) ---"
    tail -15 "$log"
  fi
  rm -f "$log"
done
echo "=== LADDER PR SUMMARY ==="
printf "%s" "$summary"
echo "NOTE: T2 property FAIL is expected while the 2 BUG-0001 pins are open."
exit $overall
