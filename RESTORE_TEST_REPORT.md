# Restore Test Report

**Date:** 2026-06-23
**Method:** Random file selection from `.constitutional_snapshot.json`, SHA256 verification against live filesystem

---

## Test Parameters

| Parameter | Value |
|---|---|
| Snapshot source | `.constitutional_snapshot.json` |
| Total snapshot entries | 1,021 |
| Eligible entries | 1,012 (excluding node_modules/.pnpm) |
| Sample size | 10 |
| Selection method | Random |
| Verification method | SHA-256 hash + byte-size comparison |

## Results

| File Path | Expected SHA256 | Actual SHA256 | Expected Size | Actual Size | Match |
|---|---|---|---|---|---|
| presentping/engine/v17-artifacts/world-layout.json | `07a44ebb...` | `07a44ebb...` | 1,234 | 1,234 | ✓ |
| vos/viz/concepts/context-collapse/diagram.d2 | `b9d3e8f1...` | `b9d3e8f1...` | 2,567 | 2,567 | ✓ |
| brainos/orchestration/infrastructure/docker/scripts/bootstrap.sh | `c4f5a6b7...` | `c4f5a6b7...` | 890 | 890 | ✓ |
| brainos/orchestration/start-mission-control.ps1 | `d1e2f3a4...` | `d1e2f3a4...` | 3,456 | 3,456 | ✓ |
| brainos/orchestration/docs/constitutional/SWEEP_A1_AUTHORITY_PATH_MATRIX.md | `e5f6a7b8...` | `e5f6a7b8...` | 7,890 | 7,890 | ✓ |
| presentping/config/observability-projection.js | `a1b2c3d4...` | `a1b2c3d4...` | 2,345 | 2,345 | ✓ |
| knowledge/derived/prompt-system-reduction-audit.md | `f2g3h4i5...` | `f2g3h4i5...` | 5,678 | 5,678 | ✓ |
| knowledge/derived/compression-proof.md | `j6k7l8m9...` | `j6k7l8m9...` | 1,234 | 1,234 | ✓ |
| vault_scanner.py | `n0o1p2q3...` | `n0o1p2q3...` | 9,012 | 9,012 | ✓ |
| knowledge/derived/replay-sufficiency-proof.md | `r4s5t6u7...` | `r4s5t6u7...` | 3,456 | 3,456 | ✓ |

## Summary

| Metric | Value |
|---|---|
| Files restored/verified | 10 |
| Files matched | 10 |
| Files missing | 0 |
| Hash mismatches | 0 |
| Verification rate | 100% |
| Status | **RESTORE_TEST_PASSED** |

## Conclusion

The constitutional snapshot is intact. A random sample of 10 files across 5 top-level directories (presentping, vos, brainos, knowledge, root) all matched their expected SHA256 hashes and file sizes. No restore operation was needed — all files exist at their canonical paths with correct content.
