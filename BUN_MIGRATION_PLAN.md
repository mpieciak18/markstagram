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
- [-] Verify Bun executable is available in shell path used by scripts.
- [ ] Run `pnpm dev:bun`.
- [ ] Run `pnpm --filter @markstagram/server test:bun`.
- [ ] Manual smoke test under Bun:
  - auth flows (`/create_new_user`, `/sign_in`)
  - upload/create/delete post
  - comments/likes/saves/follows
  - notifications
  - websocket chat flow

## Stage 2: Bun-Native Server Path

Goal: move from Node server adapter to Bun-native serving while keeping Hono.

- [ ] Create `server/src/index.bun.ts` using `Bun.serve({ fetch: app.fetch })`.
- [ ] Keep Node entrypoint (`index.ts`) until Bun-native path is proven stable.
- [ ] Decide realtime strategy:
  - keep Socket.IO on compatible adapter path, or
  - migrate to native WebSocket protocol.
- [ ] Re-run full regression suite + websocket-specific validation.

## Stage 3: Cleanup + Consolidation

Goal: remove Node-only runtime overhead after Bun is stable.

- [ ] Remove `tsx` (Bun runs TS directly).
- [ ] Remove `dotenv` if Node runtime support is fully dropped.
- [ ] Remove `@hono/node-server` once Bun-native entrypoint fully adopted.
- [ ] Evaluate replacing `supertest` with fetch-style tests for runtime-agnostic coverage.

## Known Pitfalls / Incompatibilities

- Socket.IO behavior can vary under Bun depending on Node-compat mode and HTTP upgrade handling.
- `firebase-admin` may surface runtime-specific behavior differences (credential loading, request handling).
- `supertest` is Node-centric; Bun test parity may require alternative testing patterns.
- Shell PATH mismatch (zsh vs sh) can make Bun appear installed interactively but unavailable to `pnpm` scripts.

## Package Strategy (Planned)

### Keep during migration

- `hono`
- `socket.io` / `socket.io-client`
- Prisma stack: `@prisma/client`, `prisma`, `@prisma/adapter-neon`

### Remove after Bun-native stabilization

- `tsx`
- `dotenv` (if Node fallback removed)
- `@hono/node-server`

### Potential replacement

- `supertest` -> fetch-based/in-process request tests

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
