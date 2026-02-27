import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { comments, posts, users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const createSchema = z.object({
  id: z.number().int(),
  message: z.string().trim().min(1).max(2200),
});

export const commentRoutes = new Hono<AppEnv>();

commentRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, message } = c.req.valid('json');
  const user = c.get('user');

  const post = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!post[0]) return c.json({ message: 'Post not found' }, 404);

  const inserted = await db
    .insert(comments)
    .values({ message, postId: id, userId: user.id })
    .returning();

  return c.json({
    comment: {
      ...inserted[0],
      user,
    },
  });
});

commentRoutes.post('/post', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const rows = await db
    .select({
      comment: {
        id: comments.id,
        createdAt: comments.createdAt,
        message: comments.message,
        userId: comments.userId,
        postId: comments.postId,
      },
      user: publicUserColumns,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, id))
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  const mapped = rows.map((row) => ({
    ...row.comment,
    user: toPublicUser(row.user),
  }));

  return c.json({ comments: mapped });
});

commentRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');

  const row = await db
    .select()
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  if (!row[0]) return c.json({ message: 'Comment not found' }, 404);
  return c.json({ comment: row[0] });
});

commentRoutes.put('/', zValidator('json', createSchema), async (c) => {
  const { id, message } = c.req.valid('json');
  const user = c.get('user');

  const existingComment = await db
    .select({ id: comments.id, userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  if (!existingComment[0]) return c.json({ message: 'Comment not found' }, 404);
  if (existingComment[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const updated = await db
    .update(comments)
    .set({ message })
    .where(eq(comments.id, id))
    .returning();

  return c.json({ comment: updated[0] });
});

commentRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingComment = await db
    .select({ id: comments.id, userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, id))
    .limit(1);

  if (!existingComment[0]) return c.json({ message: 'Comment not found' }, 404);
  if (existingComment[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(comments).where(eq(comments.id, id)).returning();
  return c.json({ comment: deleted[0] });
});
