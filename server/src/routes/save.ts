import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const saveRoutes = new Hono<AppEnv>();

saveRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!post) return c.json({ message: 'Post not found' }, 404);

  const existingSave = await prisma.save.findFirst({
    where: { postId: id, userId: user.id },
  });
  if (existingSave) return c.json({ save: existingSave });

  try {
    const save = await prisma.save.create({
      data: { postId: id, userId: user.id },
    });
    return c.json({ save });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    if (err.code === 'P2002') {
      const conflictSave = await prisma.save.findFirst({
        where: { postId: id, userId: user.id },
      });
      if (conflictSave) return c.json({ save: conflictSave });
      return c.json({ message: 'Save already exists' }, 409);
    }
    throw e;
  }
});

saveRoutes.post('/user', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');
  const saves = await prisma.save.findMany({
    where: { userId: user.id },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          _count: { select: { comments: true, likes: true } },
        },
      },
    },
  });
  return c.json({ saves });
});

saveRoutes.post('/post', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const save = await prisma.save.findFirst({
    where: { postId: id, userId: user.id },
  });
  return c.json({ save });
});

saveRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const existingSave = await prisma.save.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!existingSave) return c.json({ message: 'Save not found' }, 404);
  if (existingSave.userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const save = await prisma.save.delete({ where: { id } });
  return c.json({ save });
});
