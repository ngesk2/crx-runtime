# AXIOM COVERAGE MATRIX

## STATUS LEGEND
CURRENTLY PROVEN: ✅
BROKEN: ❌
PATCH SPECIFIED: 📝
EXECUTION READY: ✅
IMPLEMENTED: 🔧
TESTED: 🧪
CRASH TESTED: 💥
CONCURRENCY TESTED: 🏁
RUNTIME VERIFIED: 🌐

## AXIOM ROWS

| AXIOM | CURRENTLY PROVEN | BROKEN | PATCH SPECIFIED | EXECUTION READY | IMPLEMENTED | TESTED | CRASH TESTED | CONCURRENCY TESTED | RUNTIME VERIFIED |
|-------|-----------------|--------|-----------------|-----------------|-------------|--------|--------------|---------------------|-------------------|
| canonical event persistence | ✅ | ❌ | 📝 | ❌ | ✅ | 🧪 | ❌ | ❌ | ❌ |
| event collision | ❌ | ✅ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| event→mission eventual existence | ❌ | ✅ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| mission identity | ✅ | ❌ | 📝 | ❌ | ✅ | 🧪 | ❌ | ❌ | ❌ |
| mission retry identity | ❌ | ✅ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| context identity | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| authorization | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| effect identity | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| effect outcome | 📝 | ❌ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| result identity | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| verification | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| completion | ❌ | ✅ | 📝 | ❌ | ✅ | 🧪 | ❌ | ❌ | ❌ |
| witness binding | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| lineage | 📝 | ❌ | 📝 | ❌ | 📝 | 🧪 | ❌ | ❌ | ❌ |
| projection rebuild | 📝 | ❌ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| release provenance | 📝 | ❌ | 📝 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## NOTES

✅ CURRENTLY PROVEN: Already implemented and verifiable
❌ BROKEN: Known violation in current HEAD
📝 PATCH SPECIFIED: Repair direction identified but not yet execution-ready
✅ EXECUTION_READY: All 17 dimensions proven, ready for surgical work
🔧 IMPLEMENTED: Code exists but may not be live
🧪 TESTED: Tests exist but may not cover adversarial cases
💥 CRASH TESTED: Crash/restart behavior verified
🏁 CONCURRENCY TESTED: Race behavior verified
🌐 RUNTIME VERIFIED: Running in production with telemetry

## EXECUTION READY COUNT
0 patches currently marked EXECUTION_READY

## BLOCKING QUESTIONS

1. ROUTING VERSION: Required for event→mission reconciliation families
2. EFFECT IDENTITY PREIMAGE: Namespace/mission/attempt inclusion decisions
3. CONTEXT COMPILER: Namespace/completeness/source_version decisions
4. MISSION COMPLETION: State machine definition, Attempt/ResultEnvelope dependency
5. WORKORDER/ATTEMPT/RESULT: Harvest codex branch or new implementation decision

## PATH TO EXECUTION

Complete archaeology in codex/feature-context-compilation branches
→ Resolve open questions
→ Re-evaluate patch families
→ Mark EXECUTION_READY patches
→ Generate patch handoff cards
