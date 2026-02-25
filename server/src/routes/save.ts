import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const saveRoutes = new Hono<AppEnv>();

saveRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const save = await prisma.save.create({
    data: { postId: id, userId: user.id },
  });
  return c.json({ save });
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
  const save = await prisma.save.delete({ where: { id } });
  return c.json({ save });
});
