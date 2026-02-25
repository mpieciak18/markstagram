import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const createSchema = z.object({ id: z.number().int(), message: z.string() });

export const messageRoutes = new Hono<AppEnv>();

messageRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, message: messageText } = c.req.valid('json');
  const user = c.get('user');
  const conversation = await prisma.conversation.findFirst({
    where: { id, users: { some: { id: user.id } } },
    select: { id: true },
  });
  if (!conversation) return c.json({ message: 'Conversation not found' }, 404);

  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, message: messageText },
  });
  return c.json({ message });
});

messageRoutes.post('/conversation', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const conversation = await prisma.conversation.findFirst({
    where: { id, users: { some: { id: user.id } } },
    select: { id: true },
  });
  if (!conversation) return c.json({ message: 'Conversation not found' }, 404);

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
  });
  return c.json({ messages });
});

messageRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');
  const existingMessage = await prisma.message.findUnique({
    where: { id },
    select: { id: true, senderId: true },
  });
  if (!existingMessage) return c.json({ message: 'Message not found' }, 404);
  if (existingMessage.senderId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const message = await prisma.message.delete({ where: { id } });
  return c.json({ message });
});
