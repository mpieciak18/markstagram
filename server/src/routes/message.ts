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
  const message = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, message: messageText },
  });
  return c.json({ message });
});

messageRoutes.post('/conversation', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
  });
  return c.json({ messages });
});

messageRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const message = await prisma.message.delete({ where: { id } });
  return c.json({ message });
});
