import { Hono } from 'hono';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { conversationsToUsers, messages } from '../db/schema.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const createSchema = z.object({
  id: z.number().int(),
  message: z.string().trim().min(1).max(2000),
});

export const messageRoutes = new Hono<AppEnv>();

const isParticipant = async (userId: number, conversationId: number) => {
  const rows = await db
    .select({ conversationId: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(
      and(
        eq(conversationsToUsers.conversationId, conversationId),
        eq(conversationsToUsers.userId, userId),
      ),
    )
    .limit(1);

  return rows.length > 0;
};

messageRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, message: messageText } = c.req.valid('json');
  const user = c.get('user');

  const conversationExists = await isParticipant(user.id, id);
  if (!conversationExists) return c.json({ message: 'Conversation not found' }, 404);

  const inserted = await db
    .insert(messages)
    .values({ conversationId: id, senderId: user.id, message: messageText })
    .returning();

  return c.json({ message: inserted[0] });
});

messageRoutes.post('/conversation', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const conversationExists = await isParticipant(user.id, id);
  if (!conversationExists) return c.json({ message: 'Conversation not found' }, 404);

  const conversationMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id));

  return c.json({ messages: conversationMessages });
});

messageRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingMessage = await db
    .select({ id: messages.id, senderId: messages.senderId })
    .from(messages)
    .where(eq(messages.id, id))
    .limit(1);

  if (!existingMessage[0]) return c.json({ message: 'Message not found' }, 404);
  if (existingMessage[0].senderId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db.delete(messages).where(eq(messages.id, id)).returning();
  return c.json({ message: deleted[0] });
});
