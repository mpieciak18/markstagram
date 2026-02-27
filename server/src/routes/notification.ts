import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { notifications, posts, users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import type { NewNotificationData } from '@markstagram/shared-types';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });
const createSchema = z.object({
  id: z.number().int(),
  type: z.string().trim().min(1).max(30),
  postId: z.number().int().optional(),
});

export const notificationRoutes = new Hono<AppEnv>();

const loadNotificationsForUser = async (userId: number, read: boolean, limit: number) => {
  const rows = await db
    .select({
      notification: {
        id: notifications.id,
        createdAt: notifications.createdAt,
        userId: notifications.userId,
        otherUserId: notifications.otherUserId,
        postId: notifications.postId,
        type: notifications.type,
        read: notifications.read,
      },
      otherUser: publicUserColumns,
    })
    .from(notifications)
    .innerJoin(users, eq(notifications.otherUserId, users.id))
    .where(and(eq(notifications.userId, userId), eq(notifications.read, read)))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    ...row.notification,
    otherUser: toPublicUser(row.otherUser),
  }));
};

notificationRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, type, postId } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!otherUser[0]) return c.json({ message: 'User not found' }, 404);

  const data: NewNotificationData = {
    userId: id,
    otherUserId: user.id,
    type,
    read: false,
  };

  if (typeof postId === 'number') {
    const post = await db
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post[0]) return c.json({ message: 'Post not found' }, 404);
    data.postId = postId;
  }

  const inserted = await db.insert(notifications).values(data).returning();
  return c.json({ notification: inserted[0] });
});

notificationRoutes.post('/read', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');

  const loaded = await loadNotificationsForUser(user.id, true, limit);
  return c.json({ notifications: loaded });
});

notificationRoutes.post('/unread', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');

  const loaded = await loadNotificationsForUser(user.id, false, limit);
  return c.json({ notifications: loaded });
});

notificationRoutes.put('/read', async (c) => {
  const user = c.get('user');

  const updated = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
    .returning({ id: notifications.id });

  return c.json({ count: updated.length });
});

notificationRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = c.get('user');

  const existingNotification = await db
    .select({ id: notifications.id, userId: notifications.userId })
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);

  if (!existingNotification[0]) return c.json({ message: 'Notification not found' }, 404);
  if (existingNotification[0].userId !== user.id) return c.json({ message: 'Forbidden' }, 403);

  const deleted = await db
    .delete(notifications)
    .where(eq(notifications.id, id))
    .returning();

  return c.json({ notification: deleted[0] });
});
