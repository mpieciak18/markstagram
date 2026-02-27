import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { DatabaseError } from 'pg';
import db from '../db.js';
import { posts, saves } from '../db/schema.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const saveRoutes = new Hono<AppEnv>();

const findExistingSave = async (postId: number, userId: number) => {
  const rows = await db
    .select()
    .from(saves)
    .where(and(eq(saves.postId, postId), eq(saves.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
};

saveRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post[0]) return c.json({ message: 'Post not found' }, 404);

  const existingSave = await findExistingSave(id, user.id);
  if (existingSave) return c.json({ save: existingSave });

  try {
    const inserted = await db
      .insert(saves)
      .values({ postId: id, userId: user.id })
      .returning();

    return c.json({ save: inserted[0] });
  } catch (e) {
    if (e instanceof DatabaseError && e.code === '23505') {
      const conflictSave = await findExistingSave(id, user.id);
      if (conflictSave) return c.json({ save: conflictSave });
      return c.json({ message: 'Save already exists' }, 409);
    }
    throw e;
  }
});

saveRoutes.post('/user', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');

  const rows = await db
    .select({
      save: {
        id: saves.id,
        createdAt: saves.createdAt,
        userId: saves.userId,
        postId: saves.postId,
      },
      post: {
        id: posts.id,
        createdAt: posts.createdAt,
        image: posts.image,
        caption: posts.caption,
        userId: posts.userId,
        commentsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM "Comment"
          WHERE "Comment"."postId" = ${posts.id}
        )`.as('commentsCount'),
        likesCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM "Like"
          WHERE "Like"."postId" = ${posts.id}
        )`.as('likesCount'),
      },
    })
    .from(saves)
    .innerJoin(posts, eq(saves.postId, posts.id))
    .where(eq(saves.userId, user.id))
    .orderBy(desc(saves.createdAt))
    .limit(limit);

  return c.json({
    saves: rows.map((row) => ({
      ...row.save,
      post: {
        id: row.post.id,
        createdAt: row.post.createdAt,
        image: row.post.image,
        caption: row.post.caption,
        userId: row.post.userId,
        _count: {
          comments: row.post.commentsCount,
          likes: row.post.likesCount,
        },
      },
    })),
  });
});

saveRoutes.post('/post', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const save = await findExistingSave(id, user.id);
  return c.json({ save });
});

saveRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingSave = await db
    .select({ id: saves.id, userId: saves.userId })
    .from(saves)
    .where(eq(saves.id, id))
    .limit(1);

  if (!existingSave[0]) return c.json({ message: 'Save not found' }, 404);
  if (existingSave[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(saves).where(eq(saves.id, id)).returning();
  return c.json({ save: deleted[0] });
});
