# PING Constitutional Test Ladder

Hostile tests around very few semantic owners. This directory holds the
PING-side property/metamorphic/model/replay/integration tiers for the PING
repo. The FYD compiler/product tests live in the FYD repo (sibling owner).

Authority rule: tests never define truth. They falsify claims made by
`ping-runtime/`, `runtime/kernel/`, and `gateway/replay/`. Every test file
carries the falsifiability header: WHAT INVARIANT? WHO OWNS IT? HOW CAN IT
FAIL? WHAT ATTACK DISPROVES IT? WHAT EVIDENCE PROVES IT? CAN IT BE REPLAYED?
DOES THE FAILURE BECOME PERMANENT REGRESSION KNOWLEDGE? plus the
"why can existing runner + library + existing PING authority not express
this?" disposition.

## Tiers and scripts (run from this directory)

| Tier | Script | What it runs |
|---|---|---|
| T0 static | `npm run test:static` | no-duplicate-owners, TS-corpus wiring, corpus fixture presence, mission-type namespace hygiene |
| T1 unit | `npm run test:unit` | namespace binding policy, grant validation (pure functions; PBT adds nothing) |
| T2 property | `npm run test:property:pr` / `:deep` | (a)-(j): canonicalization, identity, replay determinism, projection invariance, event round-trip, authority uniqueness, mission causation, principal preservation, retry idempotency |
| T3 metamorphic | `npm run test:metamorphic:pr` / `:deep` | (k) restart convergence, (l) semantics mutation pairs |
| T4 replay | `npm run test:replay` / `:full` | golden corpus verify; full adds the standalone certification js runners |
| T5 model | `npm run test:model` | mission lifecycle state model (fast-check model commands) |
| T6 integration | `npm run test:integration` | real Postgres round trip, env-gated (`PING_TEST_PG=1`), throwaway schema, dropped after |
| Python | `npm run test:python` | Hypothesis worker contracts + JS/Python differential |

`npm run ladder:pr` runs the PR gate (T0-T5 fast). `npm run ladder:deep` sets
`LADDER_DEEP=1` (500 cases instead of 100) for nightly.

## Budgets

- PR: 100 cases per property, fixed seeds (`_support/budget.js`). Total PR
  property load is bounded and deterministic: same seed + same code = same run.
- Deep: 500 cases via `LADDER_DEEP=1`. Never raise the PR budget to make a
  flaky property pass; fix the property or the code.
- JEV: at most 30 shadow evaluations per run (`nightly/jev_shadow_triage.js`).

## Support files (`_support/`)

- `budget.js` — PR/deep case counts, fixed seeds, fast-check options.
- `arbitraries.js` — domain-object generators, key-permutation, valid replay
  streams (lineage the engine accepts), capability grants.
- `pg_stub.js` — DOCUMENTED pg-protocol test double ONLY. It implements
  exactly the SQL shapes `UnifiedEventRuntime.emit` and `MissionRuntime`
  issue; it certifies the RUNTIME's logic, never the database's. It is not a
  second event store, not a fixture truth, not an authority.
- `regression.js` — `withRegressionLedger`: on property failure, writes a
  `BUG-XXXX-<slug>.json` record (property, seed, path, minimized
  counterexample, invariant, failure, owner) into
  `regression/generated/`, then rethrows. Knowledge compounds.

## Regression ledger

`regression/generated/BUG-*.json` is permanent. Query with
`tools/regression_cli.js list|show|count`. Debug a record with
`tools/ping-causal-debug.js <id>` (prints the causal chain + replay command;
optional `--trace <trace.zip>` opens in the Playwright trace viewer — that is
the sanctioned failure artifact; no custom browser debugger was built).
`BUG-0000-schema-example.json` documents the schema and is excluded from counts.

## JEV shadow seam

JEV JUDGES. TESTS FALSIFY. PING AUTHORIZES. SOFTWARE EXECUTES. EVIDENCE
VERIFIES. PING RECORDS.

- `nightly/jev_shadow_triage.js` — the ONLY JEV call site. Stub courier by
  default (committed CI passes offline). Live mode only via `--live`
  (nightly/weekly): calls the sanctioned `~/workspace/fyd-intel/jev_ask.py`
  with the real CLI (`--profile TYPESAFE_JEV --purpose ambiguity-triage
  --type choice ...`), budget <= 30, shadow only — JEV never marks anything
  fixed, JEV never turns "I think this passes" into PASS. Deterministic
  purposes (hashing, schema, replay, ...) are refused before any call.
  Attestation rejection -> DO NOT CONSUME -> error, never silent.
- `nightly/jev_shadow_triage.test.js` + `nightly/fixtures/failures.json` —
  committed self-test of the seam shape (stub only).

Taxonomies used verbatim from the order: FAILURE_CLASS,
COUNTEREXAMPLE_CLASS, CLAIM_SUPPORT_CLASS, EVIDENCE_RELEVANCE,
TEST_GAP_CLASS, MUTANT_SEVERITY, FAILURE_CLUSTER, REGRESSION_PRIORITY.

## Python / Hypothesis

Why Hypothesis exists here: the repo genuinely contains a second
implementation of the canonical-hash primitive in Python
(`runtime/authorities/canonical_hash_authority.py`). fast-check is a JS
library and cannot generate/shrink Python objects; driving Python properties
through node subprocesses would be slower, lossier, and would not shrink in
the Python domain. Hypothesis is the mature standard Python property
library — the fast-check counterpart — so this is "existing runner +
library + existing PING authority" for the Python surface, not a new
framework. Seeds fixed (`derandomize=True`), PR bounded (30 examples),
nightly 300.

- `python/test_worker_runtime_contracts.py` — Python CanonicalHashAuthority
  laws: determinism, key-order invariance, type separation, unicode stability.
- `python/test_js_python_differential.py` — same logical object -> same
  digest in JS and Python. The Python side is normalized to the JS canonical
  form (no spaces, UTF-8, sorted keys); floats are excluded with the
  divergence DOCUMENTED (`test_documented_divergences`), not hidden.

## Mutation testing

StrykerJS 10, pinned. Trial scoped to ONE small constitutional target
(`ping-runtime/canonicalization/namespace_binding.js`) via
`stryker.conf.json`; the command test runner drives `npm run test:unit`
because no Stryker node:test runner exists. Never run against the full repo
initially. Surviving mutants are reported honestly.

## Schemathesis

PENDING: no trustworthy gateway OpenAPI spec exists in the repo tree
(checked 2026-09-30). The weekly workflow checks for one and skips loudly
until the gateway publishes it. No spec will be reverse-engineered.

## Testcontainers

Candidate for the nightly integration lane (Node 12 needs Node >= 22.22;
repo runs 22.23.2). The PR/integration gate uses the existing
ping-postgres container with `PING_TEST_PG=1` — no image pull, fast,
deterministic. Docker-socket compat on the Pig verified 2026-09-30.

## ADOPTED / ADAPTED / REJECTED (capability dispositions)

- fast-check 4.9: ADOPTED — shrinkable property testing over domain objects.
- node:test: ADOPTED — the existing runner; nothing new.
- StrykerJS 10: ADOPTED as a trial on one small target; full-repo mutation is REJECTED until the trial proves value.
- Hypothesis: ADOPTED for the Python surface (justified above).
- Testcontainers Node 12: ADAPTED — nightly candidate; PR uses the existing container.
- Schemathesis 4.24.x: ADOPTED in principle, PENDING on a real OpenAPI spec.
- Playwright trace viewer: ADOPTED as the failure artifact; custom browser debugger REJECTED.
- OTel JS: REJECTED for now — observability only, never truth; no current failing need.
- Custom fuzz/mutation frameworks, TestingAuthority, TestEventStore,
  TestKnowledgeGraph, second replay runtime, second fixture truth, dozens of
  test repos: REJECTED per the CEO order (hostile tests, few semantic owners).
- `tests/certification/*.test.ts`: NOT wired into gates — they import from
  `../../runtime/replay/*`, which does not exist in the main tree, and no TS
  runner is configured. Their ordering-fuzz claim is ADAPTED into
  `properties/replay_determinism.test.js` (fast-check, same engine).
  Reactivation is a recorded follow-up.
