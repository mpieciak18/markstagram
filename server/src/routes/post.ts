import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { posts, users } from '../db/schema.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { uploadImage } from '../middleware/upload.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const captionSchema = z.string().trim().min(1).max(2200);
const createSchema = z.object({ caption: captionSchema });
const updateSchema = z.object({ id: z.number().int(), caption: captionSchema });

export const postRoutes = new Hono<AppEnv>();

const postWithCountsColumns = {
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
} as const;

const toPostWithCounts = (row: {
  id: number;
  createdAt: Date;
  image: string;
  caption: string;
  userId: number;
  commentsCount: number;
  likesCount: number;
}) => ({
  id: row.id,
  createdAt: row.createdAt,
  image: row.image,
  caption: row.caption,
  userId: row.userId,
  _count: {
    comments: row.commentsCount,
    likes: row.likesCount,
  },
});

postRoutes.post('/', uploadImage, async (c) => {
  const user = c.get('user');
  const image = c.get('image' as never) as string;
  const body = await c.req.parseBody();
  const parsed = createSchema.safeParse({ caption: body['caption'] });

  if (!image) return c.json({ message: 'Image upload failed' }, 500);
  if (!parsed.success) return c.json({ message: 'Invalid input' }, 400);

  const inserted = await db
    .insert(posts)
    .values({ image, caption: parsed.data.caption, userId: user.id })
    .returning();

  return c.json({ post: inserted[0] });
});

postRoutes.post('/all', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');

  const rows = await db
    .select({
      post: postWithCountsColumns,
      user: publicUserColumns,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  const mapped = rows.map((row) => ({
    ...toPostWithCounts(row.post),
    user: toPublicUser(row.user),
  }));

  return c.json({ posts: mapped });
});

postRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');

  const rows = await db
    .select({
      post: postWithCountsColumns,
      user: publicUserColumns,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return c.json({ message: 'Post not found' }, 404);

  return c.json({
    post: {
      ...toPostWithCounts(row.post),
      user: toPublicUser(row.user),
    },
  });
});

postRoutes.post('/user', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const rows = await db
    .select(postWithCountsColumns)
    .from(posts)
    .where(eq(posts.userId, id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  return c.json({ posts: rows.map((row) => toPostWithCounts(row)) });
});

postRoutes.put('/', zValidator('json', updateSchema), async (c) => {
  const { id, caption } = c.req.valid('json');
  const user = c.get('user');

  const existingPost = await db
    .select({ id: posts.id, userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!existingPost[0]) return c.json({ message: 'Post not found' }, 404);
  if (existingPost[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const updated = await db
    .update(posts)
    .set({ caption })
    .where(eq(posts.id, id))
    .returning();

  return c.json({ post: updated[0] });
});

postRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingPost = await db
    .select({ id: posts.id, userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);

  if (!existingPost[0]) return c.json({ message: 'Post not found' }, 404);
  if (existingPost[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(posts).where(eq(posts.id, id)).returning();
  const post = deleted[0];

  if (post) {
    await deleteFileFromStorage(post.image);
  }

  return c.json({ post });
});
