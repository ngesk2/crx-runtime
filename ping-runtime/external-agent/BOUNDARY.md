# ExternalAgentAdapter: exact surface and external boundary

Sprint 2026-09-16/17, Phase 9/10. Proven live 2026-09-17 ~02:24 UTC.

## The decision this module owns

"May PING issue work order W delegating capability C to external agent A
under constraints K?" -> `authorizeWorkOrder()`, fail-closed. Nothing else.

Decisions it explicitly does NOT own (single-authority-per-decision):

- "May agent A invoke capability C against PING?" (agent-initiated):
  live `CapabilityAuthority.authorize` (/app/gateway/capability_authority.js:230),
  wired at live gateway_runtime.js:416-418, profiles at :185-217.
- "Is this Bearer token a valid exterior agent?" (credential validity):
  live `ExteriorAuthMiddleware` (live gateway_runtime.js:420-421).
- "May source S emit into namespace N?" (namespace emission):
  `CanonicalizationService.authorizeNamespace`
  (ping-runtime/canonicalization/canonicalization_service.js:76-83), enforced
  on POST /ingest and POST /events (live events.js:96-103, B2 fix 2026-09-17).
- "Which registered workers handle event E?" (routing, not authorization):
  live `WorkerRuntime.dispatch` (/app/ping-runtime/workers/worker_runtime.js:69-93).
- "Is capability X registered with well-formed metadata?" (read-time check):
  `CapabilityResolver.resolve` (ping-runtime/runtime/capability_resolver.js:62-90).

## Precise external boundary

The exterior agent's sandbox boundary is its authority boundary. The agent:

- MUST NOT emit canonical events (PING emits `WORKER_COMPLETED` or
  `WORKER_FAILED` through its canonical event runtime after validation).
- MUST NOT write mission state or touch event storage.
- MUST NOT decide promotion (retry/fail, worker selection, next mission).
- MUST NOT self-assert principal, namespace, or capability: identity comes from
  the issued WorkOrder, and PING cross-checks `result.agent_id` against the
  invoked agent.
- May only emit ONE thing: the final result envelope (RESULT_SCHEMA.json)
  on stdout (subprocess transport) or as a result file (file-drop transport).

PING-side ordering (contract EXECUTION_CONTRACT.md:221-255, verified live):

1. `issueWorkOrder` -> authorization (fail-closed) -> deterministic
   work_order_id = sha256("workorder:" + task_id)[0:16] (idempotent re-issue),
   bound to the immutable `context_pack_id` selected by PING.
2. Transport invokes exactly one agent with the work order. Windows-native
   agents (Hermes) run in their own filesystem: they CANNOT see WSL paths
   (verified 2026-09-17: FIXTURE.txt unreadable from WSL scratch). Input that
   must be read goes inline in the work order, never by path.
3. `verifyResultEnvelope` binds authorized agent = invoked agent = result agent
   and authorized context = WorkOrder context = result context, then validates
   work order, capability, status/output/error, and deadline.
   Failure is non-retryable and cannot reach canonical event authority.
4. Caller-supplied semantic verification (e.g. exact output match) runs next.
5. `recordVerifiedResult` computes one deterministic result identity per issued
   WorkOrder attempt and asks the
   injected PING event runtime to emit `WORKER_COMPLETED` or `WORKER_FAILED`.
   Retries use that identity as `logical_id`; the agent never receives runtime
   access or event credentials.

## Transports (observed 2026-09-17, Pig)

- hermes: `hermes.exe -z <prompt> --safe-mode -t <toolsets> < /dev/null`
  (Hermes Agent v0.21.2). Free model, no quota risk. CWD is C:\Users\nolan.
  Inline input only. Proven live: work_order_id 0d598aef352b9a8a, exit 0,
  exact uppercase transform verified PASS, result sha256
  f0b021848c2ddc7d6e07b8f8e186c78259454a935153804c7b4c574ec5bb1eed.
- codex: `codex exec --ignore-user-config -s read-only --ephemeral
  --skip-git-repo-check -C <dir> <prompt>` with
  CODEX_HOME=/mnt/c/Users/nolan/.codex (ELF v0.154.0-alpha.6.2). Hard OS-level
  read-only sandbox. BLOCKED_EXTERNAL until 2026-09-17 12:01 AM (ChatGPT plan
  usage exhausted; gpt-5-mini unsupported on that plan).
- opencode: no headless CLI; desktop Electron only. No safe invocation path.

## Namespace rule

Work orders carry canonical namespaces (`core::<name>` or `tenant::<id>`)
because canonicalization rejects anything else at emission. Test isolation is
carried in `correlation_id` (e.g. sprint-2026-09-16), payload fields, and the
`allowed_workspace` constraint, not in the canonical namespace. The live run
emitted under `core::owner` (source `api:muse-level-2`) with `test.agent-exec`
preserved in payload and WorkOrder.

## Files

- WORKORDER_SCHEMA.json / RESULT_SCHEMA.json: the two envelopes.
- external_agent_adapter.js: AGENT_PROFILES (data), authorizeWorkOrder (the
  one decision), issueWorkOrder, verifyResultEnvelope, recordVerifiedResult,
  canonicalEventId.
- external_agent_adapter.test.js: fail-closed binding and canonical re-entry
  assertions.
