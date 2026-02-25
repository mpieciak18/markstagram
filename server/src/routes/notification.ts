import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';
import type { NewNotificationData } from '@markstagram/shared-types';

const idSchema = z.object({ id: z.number().int() });
const limitSchema = z.object({ limit: z.number().int() });
const createSchema = z.object({
  id: z.number().int(),
  type: z.string(),
  postId: z.number().int().optional(),
});

export const notificationRoutes = new Hono<AppEnv>();

notificationRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, type, postId } = c.req.valid('json');
  const user = c.get('user');

  const otherUser = await prisma.user.findUnique({ where: { id } });
  if (!otherUser) return c.json({ message: 'User not found' }, 404);

  const data: NewNotificationData = {
    userId: id,
    otherUserId: user.id,
    type,
    read: false,
  };
  if (postId) data.postId = postId;

  const notification = await prisma.notification.create({ data });
  return c.json({ notification });
});

notificationRoutes.post('/read', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, read: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { otherUser: true },
  });
  return c.json({ notifications });
});

notificationRoutes.post('/unread', zValidator('json', limitSchema), async (c) => {
  const { limit } = c.req.valid('json');
  const user = c.get('user');
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, read: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { otherUser: true },
  });
  return c.json({ notifications });
});

notificationRoutes.put('/read', async (c) => {
  const response = await prisma.notification.updateMany({
    data: { read: true },
  });
  return c.json({ count: response.count });
});

notificationRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const notification = await prisma.notification.delete({ where: { id } });
  return c.json({ notification });
});
