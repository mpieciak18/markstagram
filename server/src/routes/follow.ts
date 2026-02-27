import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { DatabaseError } from 'pg';
import db from '../db.js';
import { follows, users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });

export const followRoutes = new Hono<AppEnv>();

const findFollow = async (giverId: number, receiverId: number) => {
  const rows = await db
    .select()
    .from(follows)
    .where(and(eq(follows.giverId, giverId), eq(follows.receiverId, receiverId)))
    .limit(1);

  return rows[0] ?? null;
};

followRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  if (id === user.id) return c.json({ message: 'Cannot follow yourself' }, 400);

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const existingFollow = await findFollow(user.id, id);
  if (existingFollow) return c.json({ follow: existingFollow });

  try {
    const inserted = await db
      .insert(follows)
      .values({ giverId: user.id, receiverId: id })
      .returning();

    return c.json({ follow: inserted[0] });
  } catch (e) {
    if (e instanceof DatabaseError && e.code === '23505') {
      const conflictFollow = await findFollow(user.id, id);
      if (conflictFollow) return c.json({ follow: conflictFollow });
      return c.json({ message: 'Follow already exists' }, 409);
    }
    throw e;
  }
});

followRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingFollow = await db
    .select({ id: follows.id, giverId: follows.giverId })
    .from(follows)
    .where(eq(follows.id, id))
    .limit(1);

  if (!existingFollow[0]) return c.json({ message: 'Follow not found' }, 404);
  if (existingFollow[0].giverId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(follows).where(eq(follows.id, id)).returning();
  return c.json({ follow: deleted[0] });
});

followRoutes.post('/user', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const [givenFollow, receivedFollow] = await Promise.all([
    findFollow(user.id, id),
    findFollow(id, user.id),
  ]);

  return c.json({ givenFollow, receivedFollow });
});

followRoutes.post('/given', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const rows = await db
    .select({
      follow: {
        id: follows.id,
        createdAt: follows.createdAt,
        giverId: follows.giverId,
        receiverId: follows.receiverId,
      },
      otherUser: publicUserColumns,
    })
    .from(follows)
    .innerJoin(users, eq(follows.receiverId, users.id))
    .where(eq(follows.giverId, id))
    .limit(limit);

  return c.json({
    follows: rows.map((row) => ({
      ...row.follow,
      otherUser: toPublicUser(row.otherUser),
    })),
  });
});

followRoutes.post('/received', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const rows = await db
    .select({
      follow: {
        id: follows.id,
        createdAt: follows.createdAt,
        giverId: follows.giverId,
        receiverId: follows.receiverId,
      },
      otherUser: publicUserColumns,
    })
    .from(follows)
    .innerJoin(users, eq(follows.giverId, users.id))
    .where(eq(follows.receiverId, id))
    .limit(limit);

  return c.json({
    follows: rows.map((row) => ({
      ...row.follow,
      otherUser: toPublicUser(row.otherUser),
    })),
  });
});
