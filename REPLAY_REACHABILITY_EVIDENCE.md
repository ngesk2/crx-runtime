# REPLAY REACHABILITY EVIDENCE

## Target
`runtime/replay`

## Who Imports It
The following files import from `runtime/replay`:
* `runtime/adapters/config_adapter.ts`
* `runtime/adapters/express_commit_adapter.ts`
* `runtime/adapters/postgres_event_store.ts`
* `runtime/kernel/commit-service/src/validation/dag_validator.ts`
* Internal test and forensics files inside `runtime/replay/*`

## Who Builds It
No explicit build system builds it. There is no `package.json` inside `runtime/replay` or `runtime/adapters`, and there is no root workspace definition that compiles this package. It relies entirely on `ts-node` or dynamic execution by whatever imports it.

## Who Executes It
There is no configured runtime entrypoint that directly executes `runtime/adapters` or `runtime/replay`.
* The `gateway` service does not import it.
* The `kernel/commit-service` and `runtime/kernel/commit-service` entrypoints (`src/server.ts`) do not import it.
* The only known execution path is `npm run replay:test` in `runtime/kernel/commit-service`, which explicitly targets a test file (`../../tests/replay/replay.test.ts`), but not as a production service.

## Conclusion
The `runtime/replay` package is structurally imported by adapters, but these adapters are disconnected from all application entrypoints (`server.ts` or `server.js`). It is functionally unreachable at runtime outside of test execution.
