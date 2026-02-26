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

- [ ] Record baseline timings (3 runs each, median):
  - `cd server && pnpm test:local`
  - `cd server && pnpm test:bun`
- [ ] Capture slowest files to prioritize first-pass fixes.

## Stage A: Low-Risk Quick Wins

- [ ] Add a dedicated fast-test profile (local only) that permits lower bcrypt cost for tests (for example `4`).
- [ ] Add parallel test scripts (keep current serial scripts intact for fallback):
  - `test:local:parallel`
  - `test:bun:parallel`
- [ ] Disable HTTP request logging during tests to reduce noise and overhead.
- [ ] Re-run baseline commands and record delta.

## Stage B: Medium-Risk, High-Impact

- [ ] Remove avoidable network work from tests (stub/mock upload/storage paths where possible).
- [ ] Consolidate repeated setup helpers (shared user factory/token helper) to reduce duplicated per-file setup costs.
- [-] Evaluate local dedicated test DB path (if current DB is remote/high-latency).
  - [x] Added local Docker Postgres plan + implementation track.
  - [ ] Capture before/after timing against remote DB setup.
- [ ] Re-measure and compare against Stage A.

## Stage C: Structural Optimization

- [ ] Complete planned Stage 4 migration from `supertest` to Hono in-process requests.
- [ ] Remove Node HTTP shim and related test-only compatibility dependencies.
- [ ] Re-benchmark Node/Bun test times after harness migration.

## Proposed Changes Review (From External Suggestions)

- [x] Run tests in parallel: agree, this should be implemented with an explicit fallback serial script.
- [!] Lower bcrypt rounds to `4`: agree in principle, but requires auth/config change because current minimum is `8`.
- [x] No-test-code-change claim: partially true; script/config changes are enough for first pass, but deeper gains likely need test harness/setup changes.

## Success Criteria

- [ ] Noticeable local speedup for full server suite (target: at least 30% faster wall time).
- [ ] No test behavior regressions.
- [ ] Keep one deterministic serial path available for debugging.

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

## Progress Log

- 2026-02-26:
  - Created this performance tracker.
  - Captured key constraints affecting the suggested bcrypt + parallelization approach.
  - Aligned this plan with Bun migration stages so performance work can proceed independently.
  - Added local Docker Postgres test-track requirements and execution strategy.
  - Added CI/CD approach notes while deferring workflow implementation.
