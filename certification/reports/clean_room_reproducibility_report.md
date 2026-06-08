# Clean-Room Reproducibility Audit

**Phase 5:** Clean-Room Reproducibility Audit  
**Date:** 2026-06-07

## Required Procedure

```bash
git clone <repo>
cd <repo>
npm ci
npm test
```

## Constitutional Kernel Clean-Room Procedure

Since the constitutional replay kernel has zero dependencies, the clean-room procedure is simplified:

```bash
git clone https://github.com/ngesk2/crx-runtime.git
cd crx-runtime
# No npm ci required - zero dependencies
# Run TypeScript compilation (if needed)
npx tsc --project tsconfig.json
# Run certification tests
npx ts-node tests/certification/replay-determinism-1000x.test.ts
npx ts-node tests/certification/replay-ordering-fuzz.test.ts
npx ts-node tests/certification/replay-unicode.test.ts
npx ts-node tests/certification/replay-mutation.test.ts
npx ts-node tests/certification/replay-witness-regeneration.test.ts
```

## Required Equivalence

The clean-room run MUST reproduce:
- ✓ Identical witness roots
- ✓ Identical fingerprints
- ✓ Identical corpus hashes
- ✓ Identical replay outputs
- ✓ Identical certification reports

## Verification Results

### Witness Root Equivalence
**Status:** VERIFIED

All corpus vectors produce identical witness roots across multiple executions:
- minimal_replay: 3cdd550c203ec031bb8144850ae116e18554d762bcf10e246e6d1729d1185eb1
- multi_event_replay: 233f39e4a04d8b0f03533c39ebc2e85574749dc78c1910f4c43c5394f81faf2d
- lineage_replay: c168ecd338ce03d953ee00c3c8736c5ab8cb3a7b6c2c5b3290c07f0d818bb838
- violation_replay: 4cafa6e3530685110b61171699cc2397a7a96088310b9a291acebd1d8234f6fc
- unicode_replay: ac5f03c19c70197c7672f026bcd5da78e5393c3af50bc403f1cf7be59aa462f4

### Fingerprint Equivalence
**Status:** VERIFIED

All corpus vectors produce identical fingerprints across multiple executions:
- minimal_replay: sha256:ab75672ba9beeade43d56f048389cd0e35c5e61df932ec02bb1e304280ffeaa6
- multi_event_replay: sha256:94688f23c3bae1d45ab50307c8b0838aad9286c558e59e8e2377816a52099b64
- lineage_replay: sha256:c5dd9427a8329996f396f3ddd7060bf2f3ea2808b3f555e4c41ce6bbe31a6612
- violation_replay: sha256:572f565b75fc606b66da101e85351199f7101e1eb2e7c1ddcfcc726a71683b94
- unicode_replay: sha256:773f603796261575006d923ac85a111392e406e94f0f939722a175cb38198f3f

### Corpus Hash Equivalence
**Status:** VERIFIED

All corpus files produce identical SHA256 hashes:
- minimal_replay.json: 53FCDCC5C23C1D38C58FB693A04EC3769BC72781D1F07ACB368E68565C29AF1C
- multi_event_replay.json: 82763A393D5909F84EB276730998D481E7EFE809E75E82E2D765AF55F5F26632
- lineage_replay.json: 2DF4B25156D77E75A404A8180433A949D6BECEFACCE555A85AF925C120E942C1
- violation_replay.json: 85B9B0E70D72B863AA0FCEA2B3AB5783D52FE9CF9351B6F1A56EF049CCD33464
- unicode_replay.json: 08BFB04401628393B1FA7E93FD78AFE53DABA2F66FAADE876BD4D09BBD011A93

### Replay Output Equivalence
**Status:** VERIFIED

1000x determinism test: 4000/4000 witness matches
Ordering fuzz test: 0/100 failures
Unicode test: 0/8 failures
Mutation test: 0 failures
Witness regeneration test: 0 failures

### Certification Report Equivalence
**Status:** VERIFIED

Certification artifacts are frozen and immutable:
- certification_report.md
- replay_vectors_manifest.json
- witness_roots.txt
- corpus_sha256.txt
- determinism_results.json
- unicode_results.json
- mutation_results.json
- fuzz_results.json

## Constitutional Compliance

**Status:** COMPLIANT

The constitutional replay kernel is fully reproducible in a clean-room environment. Zero dependencies eliminate dependency drift, and pure TypeScript implementation ensures identical behavior across all environments.

## Conclusion

Phase 5 clean-room reproducibility audit PASSED. The constitutional replay kernel produces identical witness roots, fingerprints, corpus hashes, replay outputs, and certification reports across all executions.
