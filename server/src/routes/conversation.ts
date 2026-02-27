import { Hono } from 'hono';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { conversations, conversationsToUsers, messages, users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });

export const conversationRoutes = new Hono<AppEnv>();

const loadConversation = async (conversationId: number, messageLimit?: number) => {
  const conversationRows = await db
    .select({ id: conversations.id, createdAt: conversations.createdAt })
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  const conversation = conversationRows[0];
  if (!conversation) {
    return null;
  }

  const userRows = await db
    .select(publicUserColumns)
    .from(conversationsToUsers)
    .innerJoin(users, eq(conversationsToUsers.userId, users.id))
    .where(eq(conversationsToUsers.conversationId, conversationId));

  const messagesQuery = db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt));

  const conversationMessages =
    typeof messageLimit === 'number' ? await messagesQuery.limit(messageLimit) : await messagesQuery;

  return {
    ...conversation,
    users: userRows.map((row) => toPublicUser(row)),
    messages: conversationMessages,
  };
};

const findConversationIdBetweenUsers = async (userIdA: number, userIdB: number) => {
  const userAConversations = await db
    .select({ id: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(eq(conversationsToUsers.userId, userIdA));

  const candidateConversationIds = userAConversations.map((row) => row.id);
  if (candidateConversationIds.length === 0) {
    return null;
  }

  const sharedConversation = await db
    .select({ id: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(
      and(
        eq(conversationsToUsers.userId, userIdB),
        inArray(conversationsToUsers.conversationId, candidateConversationIds),
      ),
    )
    .limit(1);

  return sharedConversation[0]?.id ?? null;
};

conversationRoutes.post('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const insertedConversation = await db.transaction(async (tx) => {
    const created = await tx.insert(conversations).values({}).returning({ id: conversations.id });
    const conversationId = created[0].id;

    await tx.insert(conversationsToUsers).values([
      { conversationId, userId: user.id },
      { conversationId, userId: id },
    ]);

    return conversationId;
  });

  const conversation = await loadConversation(insertedConversation);
  return c.json({ conversation });
});

conversationRoutes.post('/otherUser', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const conversationId = await findConversationIdBetweenUsers(user.id, id);
  if (!conversationId) return c.json({ message: 'Conversation not found' }, 404);

  const conversation = await loadConversation(conversationId, limit);
  if (!conversation) return c.json({ message: 'Conversation not found' }, 404);

  return c.json({ conversation });
});

conversationRoutes.post('/user', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');

  const conversationRows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .innerJoin(
      conversationsToUsers,
      eq(conversationsToUsers.conversationId, conversations.id),
    )
    .where(eq(conversationsToUsers.userId, user.id))
    .orderBy(desc(conversations.createdAt))
    .limit(limit);

  const conversationsWithRelations = await Promise.all(
    conversationRows.map((row) => loadConversation(row.id, 1)),
  );

  return c.json({
    conversations: conversationsWithRelations.filter((conversation) => Boolean(conversation)),
  });
});

conversationRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const membership = await db
    .select({ conversationId: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(
      and(
        eq(conversationsToUsers.conversationId, id),
        eq(conversationsToUsers.userId, user.id),
      ),
    )
    .limit(1);

  if (!membership[0]) {
    return c.json({ message: 'Conversation not found' }, 404);
  }

  const conversation = await loadConversation(id);

  await db.delete(conversations).where(eq(conversations.id, id));

  return c.json({ conversation });
});
