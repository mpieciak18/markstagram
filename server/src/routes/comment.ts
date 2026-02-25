import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

const idSchema = z.object({ id: z.number().int() });
const idLimitSchema = z.object({ id: z.number().int(), limit: z.number().int() });
const createSchema = z.object({ id: z.number().int(), message: z.string() });

export const commentRoutes = new Hono<AppEnv>();

commentRoutes.post('/', zValidator('json', createSchema), async (c) => {
  const { id, message } = c.req.valid('json');
  const user = c.get('user');
  const comment = await prisma.comment.create({
    data: { message, postId: id, userId: user.id },
    include: { user: true },
  });
  return c.json({ comment });
});

commentRoutes.post('/post', zValidator('json', idLimitSchema), async (c) => {
  const { id, limit } = c.req.valid('json');
  const comments = await prisma.comment.findMany({
    where: { postId: id },
    take: limit,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return c.json({ comments });
});

commentRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return c.json({ message: 'Comment not found' }, 404);
  return c.json({ comment });
});

commentRoutes.put('/', zValidator('json', createSchema), async (c) => {
  const { id, message } = c.req.valid('json');
  const comment = await prisma.comment.update({
    where: { id },
    data: { message },
  });
  return c.json({ comment });
});

commentRoutes.delete('/', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const comment = await prisma.comment.delete({ where: { id } });
  return c.json({ comment });
});
