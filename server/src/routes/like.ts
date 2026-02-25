import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });

export const likeRoutes = new Hono<AppEnv>();

likeRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const like = await prisma.like.create({
    data: { postId: id, userId: user.id },
  });
  return c.json({ like });
});

likeRoutes.post('/post', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');
  const likes = await prisma.like.findMany({
    where: { postId: id },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });
  return c.json({ likes });
});

likeRoutes.post('/user', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const like = await prisma.like.findFirst({
    where: { postId: id, userId: user.id },
  });
  return c.json({ like });
});

likeRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const like = await prisma.like.delete({ where: { id } });
  return c.json({ like });
});
