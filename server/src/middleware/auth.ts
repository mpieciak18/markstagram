import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import prisma from '../db.js';
import type { AppEnv } from '../app.js';

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const bearer = c.req.header('authorization');

  if (!bearer?.startsWith('Bearer ')) {
    return c.json({ message: 'Not Authorized' }, 401);
  }

  const token = bearer.slice(7);
  if (!token) {
    return c.json({ message: 'Invalid Token' }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const { id } = payload as { id: number; username: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return c.json({ message: 'User not found' }, 401);
    }

    c.set('user', user);
    await next();
  } catch (e) {
    return c.json({ message: 'Token Unverifiable' }, 401);
  }
});
