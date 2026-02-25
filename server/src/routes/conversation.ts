import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const conversationRoutes = new Hono<AppEnv>();

conversationRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const conversation = await prisma.conversation.create({
    data: {
      users: { connect: [{ id: user.id }, { id }] },
    },
    include: { users: true, messages: true },
  });
  return c.json({ conversation });
});

conversationRoutes.post('/otherUser', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');
  const user = c.get('user');
  const conversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { users: { some: { id: user.id } } },
        { users: { some: { id } } },
      ],
    },
    include: {
      users: true,
      messages: { orderBy: { createdAt: 'desc' }, take: limit },
    },
  });
  if (!conversation) return c.json({ message: 'Conversation not found' }, 404);
  return c.json({ conversation });
});

conversationRoutes.post('/user', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');
  const conversations = await prisma.conversation.findMany({
    where: { users: { some: { id: user.id } } },
    take: limit,
    include: {
      users: true,
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  return c.json({ conversations });
});

conversationRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const conversation = await prisma.conversation.delete({
    where: { id },
    include: { users: true, messages: true },
  });
  return c.json({ conversation });
});
