import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { DatabaseError } from 'pg';
import db from '../db.js';
import { likes, posts, users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });

export const likeRoutes = new Hono<AppEnv>();

const findExistingLike = async (postId: number, userId: number) => {
  const rows = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
};

likeRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post[0]) return c.json({ message: 'Post not found' }, 404);

  const existingLike = await findExistingLike(id, user.id);
  if (existingLike) return c.json({ like: existingLike });

  try {
    const inserted = await db
      .insert(likes)
      .values({ postId: id, userId: user.id })
      .returning();

    return c.json({ like: inserted[0] });
  } catch (e) {
    if (e instanceof DatabaseError && e.code === '23505') {
      const conflictLike = await findExistingLike(id, user.id);
      if (conflictLike) return c.json({ like: conflictLike });
      return c.json({ message: 'Like already exists' }, 409);
    }
    throw e;
  }
});

likeRoutes.post('/post', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const rows = await db
    .select({
      like: {
        id: likes.id,
        createdAt: likes.createdAt,
        userId: likes.userId,
        postId: likes.postId,
      },
      user: publicUserColumns,
    })
    .from(likes)
    .innerJoin(users, eq(likes.userId, users.id))
    .where(eq(likes.postId, id))
    .orderBy(desc(likes.createdAt))
    .limit(limit);

  return c.json({
    likes: rows.map((row) => ({
      ...row.like,
      user: toPublicUser(row.user),
    })),
  });
});

likeRoutes.post('/user', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const like = await findExistingLike(id, user.id);
  return c.json({ like });
});

likeRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingLike = await db
    .select({ id: likes.id, userId: likes.userId })
    .from(likes)
    .where(eq(likes.id, id))
    .limit(1);

  if (!existingLike[0]) return c.json({ message: 'Like not found' }, 404);
  if (existingLike[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(likes).where(eq(likes.id, id)).returning();
  return c.json({ like: deleted[0] });
});
