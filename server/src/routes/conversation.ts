import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';
import { publicUserSelect } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const conversationRoutes = new Hono<AppEnv>();

conversationRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const otherUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const conversation = await prisma.conversation.create({
    data: {
      users: { connect: [{ id: user.id }, { id }] },
    },
    include: { users: { select: publicUserSelect }, messages: true },
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
      users: { select: publicUserSelect },
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
      users: { select: publicUserSelect },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  return c.json({ conversations });
});

conversationRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      id,
      users: { some: { id: user.id } },
    },
    select: { id: true },
  });
  if (!existingConversation) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  await prisma.message.deleteMany({ where: { conversationId: id } });
  const conversation = await prisma.conversation.delete({
    where: { id },
    include: { users: { select: publicUserSelect }, messages: true },
  });
  return c.json({ conversation });
});
