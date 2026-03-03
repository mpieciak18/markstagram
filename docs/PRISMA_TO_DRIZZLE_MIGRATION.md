# Prisma → Drizzle ORM Migration

This is the canonical tracker for migrating the server from Prisma ORM to Drizzle ORM.

Last updated: 2026-02-27

## Status Legend

- `[x]` done
- `[-]` in progress
- `[ ]` not started
- `[!]` blocked/risk to resolve

## Background

Prisma 7 spawns Node.js child processes during `prisma generate` and `prisma migrate`. Those processes use `@prisma/dev`, which depends on `zeptomatch@2.1.0` (ESM-only). Node.js 20 cannot `require()` ESM modules, causing build failures on Render.

Drizzle ORM is pure TypeScript with zero native binaries and no process spawning — the fundamental incompatibility disappears entirely. Secondary benefits: no code-generation step, simpler DB adapter setup, aligns with the Bun-first stack.

## Architecture Decisions

**Driver unification:** Replace `@prisma/adapter-neon` + `@prisma/adapter-pg` with `pg` as the single driver for both production (Neon via SSL connection string) and local Docker tests. `DATABASE_ADAPTER` env var is eliminated — connection target is determined solely by `DATABASE_URL`.

**Schema:** Written in TypeScript at `server/src/db/schema.ts`. The implicit Prisma many-to-many join table for `Conversation ↔ User` becomes an explicit `conversationsToUsers` table in Drizzle. The physical table name `_ConversationToUser` (columns `A`, `B`) must match exactly.

**Error handling:** Prisma `P2002` (unique constraint) → `pg` `DatabaseError` with SQLSTATE `23505`. Prisma `P2025` (record not found) → explicit `undefined` check on Drizzle result.

**Migration baseline:** A generated initial Drizzle migration now exists for clean/local databases. Existing Neon production DB rollout still requires a baseline/mark-applied strategy before enabling start-time migrations in production.

## Related Documentation

- `BUN_MIGRATION_PLAN.md` — prior runtime migration context
- `TEST_PERFORMANCE_PLAN.md` — test infrastructure context

---

## Stage 1: Package Changes

Goal: swap Prisma packages for Drizzle equivalents.

- [x] Remove from `server` `dependencies`:
  - `@prisma/adapter-neon`
  - `@prisma/client`
- [x] Remove from `server` `devDependencies`:
  - `@prisma/adapter-pg`
  - `prisma`
- [x] Add to `server` `dependencies`:
  - `drizzle-orm`
  - `pg` (promoted from devDependencies)
- [x] Add to `server` `devDependencies`:
  - `drizzle-kit`
  - `@types/pg`
- [x] Run `pnpm install` to apply changes.

---

## Stage 2: Drizzle Schema (`server/src/db/schema.ts`)

Goal: define all 9 models as Drizzle `pgTable` declarations.

- [x] Create `server/src/db/schema.ts` with all 9 tables:
  - `users` — `varchar` lengths matching existing DB constraints (`email` 254, `username` 15, `password` 60, `name` 30, `bio` 160, `image` 2200)
  - `posts`
  - `comments`
  - `likes` — composite unique on `(userId, postId)`
  - `saves` — composite unique on `(userId, postId)`
  - `follows` — composite unique `(giverId, receiverId)` + check constraint `giverId <> receiverId`
  - `conversations`
  - `conversationsToUsers` — explicit join table named `_ConversationToUser` with columns `A` (conversationId), `B` (userId), composite primary key
  - `messages`
  - `notifications`
- [x] Verify all `onDelete: 'cascade'` FK relations are preserved from the Prisma schema.
- [x] Create `server/drizzle.config.ts`:
  ```ts
  import { defineConfig } from 'drizzle-kit';
  export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle/migrations',
    dialect: 'postgresql',
  });
  ```

---

## Stage 3: DB Connection (`server/src/db.ts`)

Goal: replace the dual-adapter Prisma client with a single Drizzle + pg pool.

- [x] Rewrite `server/src/db.ts`:
  ```ts
  import { drizzle } from 'drizzle-orm/node-postgres';
  import { Pool } from 'pg';
  import * as schema from './db/schema.js';

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  export default db;
  ```
- [x] Remove `DATABASE_ADAPTER` env var logic and the dynamic `@prisma/adapter-pg` import entirely.

---

## Stage 4: `publicUser.ts` — Select Object Replacement

Goal: replace Prisma select objects with Drizzle column sets and SQL subqueries.

- [x] Replace `publicUserSelect` with a plain column object:
  ```ts
  export const publicUserColumns = {
    id: users.id, createdAt: users.createdAt, email: users.email,
    username: users.username, name: users.name, bio: users.bio, image: users.image,
  };
  ```
- [x] Replace `publicUserWithCountsSelect` with subquery expressions:
  ```ts
  export const publicUserWithCountsColumns = {
    ...publicUserColumns,
    postsCount: sql<number>`(select count(*) from ${posts} where ${posts.userId} = ${users.id})::int`.as('postsCount'),
    followingCount: sql<number>`(select count(*) from ${follows} where ${follows.giverId} = ${users.id})::int`.as('followingCount'),
    followersCount: sql<number>`(select count(*) from ${follows} where ${follows.receiverId} = ${users.id})::int`.as('followersCount'),
  };
  ```
- [x] Update all callers while preserving response compatibility (`_count` payload shape maintained via mapper).

---

## Stage 5: Route Migration

Goal: rewrite all Prisma queries in routes, middleware, and modules.

### Error Handling (5 files)

- [x] `auth.ts` — replace `PrismaClientKnownRequestError P2002` with `DatabaseError` SQLSTATE `23505`
- [x] `user.ts` — same unique-constraint replacement; replace P2025 not-found with `undefined` check
- [x] `like.ts` — same
- [x] `save.ts` — same
- [x] `follow.ts` — same

### Query Translation Reference

| Prisma | Drizzle |
|---|---|
| `prisma.user.findUnique({ where: { id } })` | `db.query.users.findFirst({ where: eq(users.id, id) })` |
| `prisma.user.findMany({ where: { name: { contains: q, mode: 'insensitive' } } })` | `db.select().from(users).where(ilike(users.name, \`%${q}%\`))` |
| `prisma.post.create({ data })` | `db.insert(posts).values(data).returning()` |
| `prisma.post.update({ where: { id }, data })` | `db.update(posts).set(data).where(eq(posts.id, id)).returning()` |
| `prisma.post.delete({ where: { id } })` | `db.delete(posts).where(eq(posts.id, id))` |
| `prisma.notification.updateMany({ where, data })` | `db.update(notifications).set(data).where(...)` |
| `prisma.$transaction(async (tx) => ...)` | `db.transaction(async (tx) => ...)` |
| `_count: { select: { comments, likes } }` | SQL subquery count expressions |

### Route Checklist

- [x] `server/src/routes/auth.ts`
- [x] `server/src/routes/user.ts` — includes deletion transaction and orphan conversation cleanup
- [x] `server/src/routes/post.ts`
- [x] `server/src/routes/comment.ts`
- [x] `server/src/routes/like.ts`
- [x] `server/src/routes/save.ts`
- [x] `server/src/routes/follow.ts`
- [x] `server/src/routes/conversation.ts` — explicit join through `conversationsToUsers`
- [x] `server/src/routes/message.ts`
- [x] `server/src/routes/notification.ts`
- [x] `server/src/modules/websocket.ts` — Prisma queries replaced
- [x] `server/src/middleware/auth.ts` — DB call replaced

---

## Stage 6: Test Helper (`server/src/__tests__/helpers/userFactory.ts`)

Goal: replace Prisma insert with Drizzle.

- [x] Rewrite seed insert:
  ```ts
  const [user] = await db.insert(users).values({ ... }).returning({
    id: users.id, email: users.email, username: users.username,
    name: users.name, bio: users.bio, image: users.image,
  });
  ```

---

## Stage 7: Migration Tooling + Render Deploy

Goal: establish Drizzle migrations and update all scripts.

### `server/package.json` scripts
- [x] Remove `prisma:generate` (no code-generation step in Drizzle)
- [x] Rename `prisma:migrate:test` → `db:migrate`: `drizzle-kit migrate`
- [x] Add `db:migrate:generate`: `drizzle-kit generate`

### Root `package.json`
- [x] Update `db:generate` to shared-types build only (Prisma generation removed)

### Docker shell script (`scripts/test-server-docker.sh`)
- [x] Replace `pnpm prisma:migrate:test` with `pnpm db:migrate`
- [x] Remove `DATABASE_ADAPTER` export

### Render build command
- Before: `pnpm install && pnpm db:generate && pnpm --filter @markstagram/server build`
- After: `pnpm install && pnpm --filter @markstagram/shared-types build && pnpm --filter @markstagram/server build`
- [ ] Update Render build command (no migration step — moved to Start) *(deployment config change)*

### Render start command
- Before: `node dist/index.js`
- After: `pnpm --filter @markstagram/server db:migrate && bun run dist/index.bun.js`
- [ ] Update Render start command (migration runs here, before server starts) *(deployment config change)*

### Existing production DB rollout
- [x] Run `drizzle-kit generate` locally to create initial migration + `meta/_journal.json`.
- [ ] Decide production baseline strategy before enabling migration-on-start in Render:
  - Option A: mark initial migration as applied in production without executing DDL.
  - Option B: make initial migration idempotent (`IF NOT EXISTS` where needed) and validate on a production clone.
- [ ] Run `drizzle-kit migrate` against the Neon DB according to chosen strategy.
- [ ] Verify future incremental migrations (`drizzle-kit generate` → `drizzle-kit migrate`) apply only new changes.

---

## Stage 8: Cleanup

Goal: remove all Prisma artifacts.

- [x] Delete `server/prisma/` (entire directory — schema + migration SQL files)
- [x] Delete `server/src/generated/` (entire directory — Prisma client output)
- [x] Remove `DATABASE_ADAPTER` from `server/.env.test.sample`
- [x] Run `pnpm install` to prune obsolete direct Prisma packages.
  - Note: `prisma` / `@prisma/client` can still appear as transitive optional peers from `drizzle-orm`; this is expected unless peer auto-install behavior is disabled.

---

## Verification

- [x] `pnpm --filter @markstagram/server typecheck` — passes clean.
- [x] `pnpm --filter @markstagram/server build` — compiles without errors.
- [x] `pnpm test:server:docker` — all 231 tests pass.
- [ ] Smoke test: `pnpm dev:server`, verify `/health_status` returns 200
- [ ] Render deploy: build completes without the Node.js ESM `zeptomatch` error; migration runs at start

---

## Progress Log

- 2026-02-27:
  - Drafted migration plan after two failed attempts to fix the Prisma 7 + Node.js 20 ESM incompatibility on Render.
  - Confirmed Drizzle as the correct replacement (pure TS, no child process spawning, first-class pg + Neon support).
  - Selected `pg` as unified driver (eliminates `DATABASE_ADAPTER` env var; `pg.Pool` + SSL connection string works identically for Neon and local Docker).
  - Identified production baseline strategy as a required follow-up before enabling start-time migrations in Render.
  - Set migration timing to Render Start Command (not Build Command) for semantic correctness.
  - Implemented runtime migration from Prisma to Drizzle across all server routes, auth middleware, websocket module, and direct-DB tests/helpers.
  - Removed Prisma artifacts (`server/prisma`, `server/src/generated`, `server/prisma.config.ts`) and switched scripts to Drizzle migration commands.
  - Generated initial Drizzle migration artifacts (`server/drizzle/migrations/0000_lively_black_knight.sql` + `meta/_journal.json`).
  - Verified post-migration stability: `typecheck`, `build`, and `pnpm test:server:docker` all pass.
