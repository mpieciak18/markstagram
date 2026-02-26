# Server Test Performance Plan

This is the canonical tracker for reducing server test-suite runtime.

Last updated: 2026-02-26

## Status Legend

- `[x]` done
- `[-]` in progress
- `[ ]` not started
- `[!]` blocked/risk to resolve

## Current Findings

- [x] `create_new_user` / `sign_in` are used heavily across test files and repeatedly hit bcrypt.
- [x] Tests are currently forced serial by script flags (`--threads false`) in `server/package.json`.
- [x] Lowering `BCRYPT_SALT_ROUNDS` alone will not help below `8` because auth clamps to `MIN_BCRYPT_SALT_ROUNDS = 8`.
- [x] Major runtime contributors are likely a mix of bcrypt, DB round-trips, and request/log overhead.

## Baseline

- [x] Record baseline timings (3 runs each, median):
  - [x] Captured 1-run snapshots before and after Stage A.
  - [x] Captured 3-run medians for stricter comparison.
- [x] Capture slowest files to prioritize first-pass fixes.
  - Slowest files are consistently:
    - `delete-integrity.test.ts`
    - `user.test.ts`
    - `like.test.ts`
    - `notification.test.ts`
    - `comment.test.ts`

## Stage A: Low-Risk Quick Wins

- [x] Add a dedicated fast-test profile (local only) that permits lower bcrypt cost for tests (for example `4`).
- [x] Add parallel test scripts (keep current serial scripts intact for fallback):
  - `test:local:parallel`
  - `test:bun:parallel`
- [x] Disable HTTP request logging during tests to reduce noise and overhead.
- [x] Re-run baseline commands and record delta.

## Stage B: Medium-Risk, High-Impact

- [x] Remove avoidable network work from tests (stub/mock upload/storage paths where possible).
- [x] Consolidate repeated setup helpers (shared user factory/token helper) to reduce duplicated per-file setup costs.
- [x] Evaluate local dedicated test DB path (if current DB is remote/high-latency).
  - [x] Added local Docker Postgres plan + implementation track.
  - [x] Captured before/after timing against remote DB setup.
- [x] Re-measure and compare against Stage A.
  - [x] Captured local docker timing snapshot.
  - [x] Re-measured after Stage B storage-mock optimization.
  - [x] Re-measured after Stage B setup-helper optimizations.

## Stage C: Structural Optimization

- [x] Complete planned Stage 4 migration from `supertest` to Hono in-process requests.
- [x] Remove Node HTTP shim and related test-only compatibility dependencies.
- [x] Re-benchmark test times after harness migration.

## Post-Execution Cleanup

- [x] Remove temporary session-specific `*:codex` scripts from root, server, and client package manifests.
- [x] Prune redundant server test-script variants:
  - Removed `test:local:parallel` and `test:local:fast`.
  - Removed `test:bun:parallel` and `test:bun:fast`.
  - Removed Bun codex-only test variants (`test:bun:*:codex`).
- [x] Keep a minimal useful matrix:
  - Node/local: `test:local`, `test:local:fast:parallel`, `test:docker`
  - Bun: `test:bun`, `test:bun:fast:parallel`

## Proposed Changes Review (From External Suggestions)

- [x] Run tests in parallel: agree, this should be implemented with an explicit fallback serial script.
- [!] Lower bcrypt rounds to `4`: agree in principle, but requires auth/config change because current minimum is `8`.
- [x] No-test-code-change claim: partially true; script/config changes are enough for first pass, but deeper gains likely need test harness/setup changes.

## Success Criteria

- [x] Noticeable local speedup for full server suite (target: at least 30% faster wall time).
- [x] No test behavior regressions.
- [x] Keep one deterministic serial path available for debugging.

## Timing Snapshots

- Pre-Stage A (serial):
  - `pnpm --filter @markstagram/server test:local`: `42.54s`
  - `pnpm --filter @markstagram/server test:bun`: `42.25s`
- Post-Stage A (serial):
  - `pnpm --filter @markstagram/server test:local`: `41.16s` (about `3.2%` faster)
  - `pnpm --filter @markstagram/server test:bun`: `39.45s` (about `6.6%` faster)
- Post-Stage A (fast + parallel):
  - `pnpm --filter @markstagram/server test:local:fast:parallel`: `7.36s` (about `82.7%` faster vs pre-local serial)
  - `pnpm --filter @markstagram/server test:bun:fast:parallel`: `7.03s` (about `83.4%` faster vs pre-bun serial)
- Stage B (3-run serial medians, with mock cloud storage in tests):
  - `pnpm --filter @markstagram/server test:local`: median `31.69s` (about `25.5%` faster vs pre-Stage A local)
  - `pnpm --filter @markstagram/server test:bun`: median `32.21s` (about `23.8%` faster vs pre-Stage A bun)
- Stage B (3-run serial medians after setup-helper consolidation):
  - `pnpm --filter @markstagram/server test:local`: median `31.26s` (about `26.5%` faster vs pre-Stage A local)
  - `pnpm --filter @markstagram/server test:bun`: median `31.95s` (about `24.4%` faster vs pre-Stage A bun)
- Local Docker Postgres path:
  - `pnpm test:server:docker` end-to-end (container + migrations + tests): about `6.8s`
  - Vitest phase within docker run: about `2.2s`
- Post-Stage C (single-run snapshot, local Docker Postgres path):
  - `pnpm test:server:docker` end-to-end (container + migrations + tests): about `5.8s`
  - Vitest phase within docker run: about `1.5s`

## Local Docker Test DB Track (Implemented Scope)

- [x] Add root `docker-compose.test.yml` for Postgres 16 with healthcheck.
- [x] Add `server/.env.test.sample` with local DB defaults.
- [x] Add one-command local flow to boot DB, run migrations, run server tests, and tear DB down.
- [x] Add DB adapter mode for tests to use direct Postgres (`DATABASE_ADAPTER=direct`) while keeping Neon default behavior.
- [x] Document one-time dependency requirement for direct adapter mode:
  - `pnpm --filter @markstagram/server add @prisma/adapter-pg pg`

## CI/CD Note (Documentation Only for Now)

- [x] Document CI strategy (GitHub Actions service container + migrate + test).
  - Use a Postgres service container (`postgres:16`) with health checks.
  - Set `DATABASE_URL` to the service host/port.
  - Set `DATABASE_ADAPTER=direct` for CI test jobs using local Postgres service.
  - Run `pnpm --filter @markstagram/server prisma:migrate:test` then `pnpm --filter @markstagram/server test:docker`.
- [ ] Implement CI workflow file (deferred by request).

## Future Scope: Bun Test Rewrite

- [ ] Plan full migration from Vitest to Bun's built-in test runner (`bun test`).
- [ ] Before rewriting, audit all current `227` server tests:
  - identify duplicates and overlap,
  - consolidate repetitive cases and setup patterns,
  - eliminate low-value or redundant tests.
- [ ] Rewrite only the retained/optimized suite to `bun test`.
- [ ] Re-benchmark and compare against current Vitest + Bun-runtime execution.

## Progress Log

- 2026-02-26:
  - Created this performance tracker.
  - Captured key constraints affecting the suggested bcrypt + parallelization approach.
  - Aligned this plan with Bun migration stages so performance work can proceed independently.
  - Added local Docker Postgres test-track requirements and execution strategy.
  - Added CI/CD approach notes while deferring workflow implementation.
  - Implemented Stage A scripts for fast bcrypt and parallel execution (Node + Bun).
  - Disabled request logging under test to reduce overhead/noise.
  - Captured before/after timing snapshots for local and Bun serial runs.
  - Validated fast parallel profiles for local and Bun with `227/227` passing.
  - Captured local Docker Postgres timing and validated full suite in docker.
  - Fixed `websocket-auth.test.ts` to satisfy password hash integrity constraints under fresh local migrations.
  - Fixed env restoration in `upload-hardening.test.ts` to prevent cross-test pollution when running against fresh local databases.
  - Added test-mode cloud storage mocking to avoid external storage network calls.
  - Re-ran serial suites for 3-run medians (`test:local` and `test:bun`) and updated measured deltas.
  - Added a shared seeded-user helper for non-auth integration tests and migrated repeated setup flows away from `/create_new_user`.
  - Re-ran serial suites for 3-run medians after helper consolidation and updated measured deltas.
  - Completed Stage C migration from `supertest` to Hono in-process request helper.
  - Removed `server/src/server.ts` supertest shim and removed `supertest` + `@types/supertest` from server dev dependencies.
  - Re-ran docker-backed server suite with `227/227` passing after migration.
  - Pruned temporary and duplicate test/dev scripts across root/server/client package manifests to reduce command sprawl.
  - Added future-scope Bun test rewrite track with a required pre-migration audit of all `227` tests for consolidation/elimination.
