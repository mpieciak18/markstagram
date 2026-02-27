import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { eq } from 'drizzle-orm';
import db from '../db.js';
import { users } from '../db/schema.js';
import type { AppEnv } from '../app.js';
import { publicUserColumns, toPublicUser } from '../modules/publicUser.js';

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
    const id = Number(payload.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return c.json({ message: 'Token Unverifiable' }, 401);
    }

    const rows = await db
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const user = rows[0] ? toPublicUser(rows[0]) : null;
    if (!user) {
      return c.json({ message: 'User not found' }, 401);
    }

    c.set('user', user);
    await next();
  } catch {
    return c.json({ message: 'Token Unverifiable' }, 401);
  }
});
