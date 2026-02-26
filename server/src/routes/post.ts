import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { uploadImage } from '../middleware/upload.js';
import type { AppEnv } from '../app.js';
import { publicUserSelect } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const captionSchema = z.string().trim().min(1).max(2200);
const createSchema = z.object({ caption: captionSchema });
const updateSchema = z.object({ id: z.number().int(), caption: captionSchema });

export const postRoutes = new Hono<AppEnv>();

postRoutes.post('/', uploadImage, async (c) => {
  const user = c.get('user');
  const image = c.get('image' as never) as string;
  const body = await c.req.parseBody();
  const parsed = createSchema.safeParse({ caption: body['caption'] });

  if (!image) return c.json({ message: 'Image upload failed' }, 500);
  if (!parsed.success) return c.json({ message: 'Invalid input' }, 400);

  const post = await prisma.post.create({
    data: { image, caption: parsed.data.caption, userId: user.id },
  });
  return c.json({ post });
});

postRoutes.post('/all', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const posts = await prisma.post.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true, likes: true } },
      user: { select: publicUserSelect },
    },
  });
  return c.json({ posts });
});

postRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      _count: { select: { comments: true, likes: true } },
      user: { select: publicUserSelect },
    },
  });
  if (!post) return c.json({ message: 'Post not found' }, 404);
  return c.json({ post });
});

postRoutes.post('/user', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const posts = await prisma.post.findMany({
    where: { userId: id },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { comments: true, likes: true } },
    },
  });
  return c.json({ posts });
});

postRoutes.put('/', zValidator('json', updateSchema), async (c) => {
  const { id, caption } = c.req.valid('json');
  const user = c.get('user');
  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!existingPost) return c.json({ message: 'Post not found' }, 404);
  if (existingPost.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const post = await prisma.post.update({
    where: { id },
    data: { caption },
  });
  return c.json({ post });
});

postRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!existingPost) return c.json({ message: 'Post not found' }, 404);
  if (existingPost.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const post = await prisma.post.delete({ where: { id } });
  await deleteFileFromStorage(post.image);
  return c.json({ post });
});
