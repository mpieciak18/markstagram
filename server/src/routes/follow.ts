import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });

export const followRoutes = new Hono<AppEnv>();

followRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const follow = await prisma.follow.create({
    data: { giverId: user.id, receiverId: id },
  });
  return c.json({ follow });
});

followRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const follow = await prisma.follow.delete({ where: { id } });
  return c.json({ follow });
});

followRoutes.post('/user', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const [givenFollow, receivedFollow] = await Promise.all([
    prisma.follow.findFirst({ where: { giverId: user.id, receiverId: id } }),
    prisma.follow.findFirst({ where: { giverId: id, receiverId: user.id } }),
  ]);

  return c.json({ givenFollow, receivedFollow });
});

followRoutes.post('/given', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const givenFollows = await prisma.follow.findMany({
    where: { giverId: id },
    take: limit,
    include: { receiver: true },
  });

  const follows = givenFollows.map(({ receiver, ...rest }) => ({
    ...rest,
    otherUser: receiver,
  }));
  return c.json({ follows });
});

followRoutes.post('/received', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const receivedFollows = await prisma.follow.findMany({
    where: { receiverId: id },
    take: limit,
    include: { giver: {} },
  });

  const follows = receivedFollows.map(({ giver, ...rest }) => ({
    ...rest,
    otherUser: giver,
  }));
  return c.json({ follows });
});
