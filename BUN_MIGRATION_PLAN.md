# Bun Migration Plan

This is the canonical Bun migration tracker for this repo.

Last updated: 2026-02-26

## Status Legend

- `[x]` done
- `[-]` in progress
- `[ ]` not started
- `[!]` blocked/risk to resolve

## Stage 0: Baseline + Safety Rails

Goal: prepare Bun migration without breaking existing Node runtime.

- [x] Keep current Node runtime behavior as default.
- [x] Add Bun scripts without removing Node scripts.
- [x] Add runtime-safe env bootstrap (`dotenv` for Node path, Bun auto-env when on Bun).
- [x] Keep rollback path to Node.
- [x] Re-validate existing Node path after changes (`typecheck`, `server test:local`).

## Stage 1: Bun Runtime Parity

Goal: run current app under Bun with no behavior regressions.

- [x] Add workspace-level Bun dev scripts.
- [x] Add server Bun scripts (`dev:bun`, `test:bun`, `startbuilt:bun`).
- [x] Add client Bun dev script.
- [x] Verify Bun executable is available in shell path used by scripts.
- [x] Run `pnpm dev:bun`.
- [x] Run `pnpm --filter @markstagram/server test:bun`.
- [x] Smoke test under Bun (integration coverage via `test:bun`):
  - auth flows (`/create_new_user`, `/sign_in`)
  - upload/create/delete post
  - comments/likes/saves/follows
  - notifications
  - websocket chat flow

## Stage 2: Bun-Native Server Path

Goal: move from Node server adapter to Bun-native serving while keeping Hono.

- [x] Create `server/src/index.bun.ts` using `Bun.serve({ fetch: app.fetch })`.
- [x] Keep Node entrypoint (`index.ts`) until Bun-native path is proven stable.
- [x] Decide realtime strategy:
  - keep Socket.IO on compatible adapter path via a dedicated compatibility port (`SOCKET_PORT`),
  - keep native WebSocket migration as a later optional step.
- [x] Re-run full regression suite + websocket-specific validation.

## Stage 3: Cleanup + Consolidation

Goal: remove Node-only runtime overhead after Bun is stable.

- [x] Remove `tsx` (Bun runs TS directly).
- [x] Remove `dotenv` from runtime path; use Bun env loading and Node native env loader fallback.
- [x] Remove `@hono/node-server` from runtime dependencies (kept in dev dependencies while Node compat entrypoint still exists).
- [x] Evaluate replacing `supertest` with fetch-style tests for runtime-agnostic coverage (promoted to Stage 4).

## Stage 4: Runtime-Agnostic Test Harness

Goal: replace `supertest` and remove the Node test shim.

- [x] Migrate HTTP tests from `supertest` to Hono in-process requests (`app.request` / `app.fetch`) via shared helper.
- [x] Add test helper for request building, auth headers, response parsing, and multipart uploads.
- [x] Remove `server/src/server.ts` shim once tests no longer require Node `http.Server`.
- [x] Remove `supertest` and `@types/supertest` dev dependencies.
- [x] Re-run full server test suite and ensure Bun parity remains `14/14` files and `227/227` tests.

## Stage 5: Bun-Native Password Hashing

Goal: replace `bcryptjs` with Bun-native hashing after rollback is retired.

- [ ] Implement Bun-native hashing/verification (`Bun.password`) for auth module.
- [ ] Validate compatibility strategy for existing stored bcrypt hashes.
- [ ] Remove `bcryptjs` dependency.
- [ ] Re-run auth-focused tests and full suite under Bun.

## Stage 6: Retire Node Rollback Path

Goal: remove Node fallback after stability criteria are met.

- [ ] Wait for two stable Bun deploy cycles (per exit criteria).
- [ ] Remove `server/src/index.ts` and Bun compat script variants once no longer needed.
- [ ] Remove remaining Bun/Node branching that only exists for rollback support.
- [ ] Confirm deployment docs and runtime defaults are Bun-only.

## Stage 7: Test Runner Modernization

Goal: upgrade test tooling independently of runtime migration.

- [ ] Upgrade Vitest from `0.34.x` to current major.
- [ ] Address config/runtime differences introduced by the upgrade.
- [ ] Re-run full suite and validate no regressions.

## Stage 8: Replace Socket.IO with Native Bun/Hono WebSockets

Goal: remove Socket.IO and move realtime chat to native WebSocket transport on Bun/Hono.

- [ ] Define and document a transport-agnostic event contract (client -> server and server -> client):
  - client: `auth`, `join_conversation`, `send_message`
  - server: `auth_ok`, `auth_error`, `input_error`, `new_message`, `receive_new_message`, `server_error`
- [ ] Add shared runtime validation schemas for all WS frames (Zod + shared types package).
- [ ] Implement Bun-native WebSocket hub:
  - in-memory connection registry keyed by `conversationId`
  - per-connection auth state and joined conversation set
  - bounded payload size and malformed-frame handling
- [ ] Implement WS auth flow with explicit `auth` message and timeout-based disconnect if not authenticated.
- [ ] Implement `join_conversation` + `send_message` using existing DB authorization logic from `modules/websocket.ts`.
- [ ] Expose native WS endpoint on the Bun API server (`/ws`) and keep same-origin/single-port behavior by default.
- [ ] Add client transport adapter and migrate conversation UI from `socket.io-client` to browser `WebSocket`:
  - reconnect with backoff
  - event dispatch by `type`
  - clean connect/disconnect lifecycle on route changes
- [ ] Add websocket integration tests for:
  - auth success/failure
  - unauthorized conversation join rejection
  - successful broadcast to conversation participants
  - malformed message handling
- [ ] Introduce a short dual-transport transition flag (`REALTIME_TRANSPORT=socketio|native-ws`) for rollout and rollback.
- [ ] Remove Socket.IO artifacts after native transport is stable:
  - delete `server/src/socketServer.ts`
  - remove `socket.io` and `socket.io-client`
  - remove `SOCKET_PORT` and simplify `VITE_SOCKET_URL` defaults

## Separate Scope Backlog (Lower Priority)

- [ ] Optional runtime-agnostic cleanup:
  - replace `import { randomUUID } from 'crypto'` with `globalThis.crypto.randomUUID()`

## Recommended Execution Order

- [ ] Stage 6 (retire rollback path)
- [ ] Stage 7 (Vitest upgrade)
- [ ] Stage 5 (Bun-native password hashing)
- [ ] Stage 8 (native Bun/Hono websocket replacement)

## Known Pitfalls / Incompatibilities

- Browser WebSockets cannot send arbitrary auth headers; auth needs to be an explicit message or query strategy.
- Native WebSocket transport does not provide Socket.IO features (rooms/reconnect/acks) out of the box; all must be implemented explicitly.
- Multi-instance scaling requires a pub/sub fanout backend (for example Redis) if realtime rooms move beyond a single server instance.
- Bun-native API mode currently uses a dedicated Socket.IO compatibility server (`SOCKET_PORT`, default `PORT + 1`) until Stage 8 completes.
- `firebase-admin` may surface runtime-specific behavior differences (credential loading, request handling).
- Shell PATH mismatch (zsh vs sh) can make Bun appear installed interactively but unavailable to `pnpm` scripts.
- Stale processes on `3001` / `5173` can produce false startup failures during Bun parity checks.
- Shared test DB state can introduce flakiness when tests reuse static identities; keep per-run unique IDs.

## Package Strategy (Planned)

### Keep during migration

- `hono`
- `socket.io` / `socket.io-client` (until Stage 8)
- Prisma stack: `@prisma/client`, `prisma`, `@prisma/adapter-neon`

### Remove after Bun-native stabilization

- `tsx`
- `dotenv` (runtime dependency removed)
- `@hono/node-server` (remove after Stage 6 when Node compat path is retired)
- `supertest` + `@types/supertest` (removed in Stage 4)
- `bcryptjs` (after Stage 5)
- `socket.io` + `socket.io-client` (after Stage 8)

### Potential replacement

- `supertest` -> fetch-based/in-process request tests
- `socket.io` -> Bun native `WebSocket` + Hono/Bun route upgrade + JSON event protocol

## Exit Criteria

- All critical flows pass under Bun in staging.
- No auth/upload/websocket regressions.
- Node rollback path maintained until at least two stable Bun deploy cycles.

## Progress Log

- 2026-02-26:
  - Added Bun scripts in root/client/server package manifests.
  - Added runtime env loader to support Node and Bun paths.
  - Kept Hono backend architecture unchanged.
  - Revalidated Node baseline (`pnpm typecheck`, `cd server && pnpm run test:local` with 227 passing tests).
  - Updated Bun scripts to prepend `PATH="$HOME/.bun/bin:$PATH"` for non-interactive shell compatibility.
  - Restored default Bun scripts for normal local use and temporarily added PATH-fallback script variants for non-interactive environments.
  - Validated Bun test parity (`pnpm --filter @markstagram/server test:bun`: 14 files, 227 tests passed).
  - Validated Bun local startup parity (`pnpm dev:bun`: client + server both booted successfully).
  - Re-ran workspace typecheck successfully after Bun Stage 1 adjustments.
  - Added shared Socket.IO bootstrap module and refactored Node entrypoint to use it.
  - Added Bun-native entrypoint (`server/src/index.bun.ts`) with `Bun.serve` for API traffic.
  - Selected Stage 2 realtime strategy: Socket.IO stays on compatibility server at `SOCKET_PORT` (default `PORT + 1`).
  - Added Bun-native scripts (`dev:bun:native`) and client socket URL override support (`VITE_SOCKET_URL`).
  - Re-ran Bun test suite (`pnpm --filter @markstagram/server test:bun`) with 14 files / 227 tests passing.
  - Verified Bun native startup (`pnpm dev:bun:native`) with API on `3001` and Socket.IO on `3002`.
  - Made Bun native-first for dev/start scripts and added explicit `compat` script variants for comparison/debug.
  - Removed `tsx` dependency and removed `dotenv` runtime dependency.
  - Moved `@hono/node-server` from runtime dependencies to dev dependencies.
  - Hardened flaky tests for shared DB environments by increasing Vitest timeout and adding unique IDs in user/notification tests.
  - Re-validated Stage 3 with workspace typecheck + full Bun test suite (`14/14 files`, `227/227 tests`) + Bun native dev startup.
  - Completed Stage 4 by migrating away from supertest to in-process request testing and removing test shim/dependencies.
  - Pruned temporary `*:codex` scripts and redundant test-script variants from package manifests.
  - Added Stage 8 native websocket replacement plan for Socket.IO retirement.
