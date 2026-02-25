import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import { comparePasswords, createJwt, hashPassword } from '../modules/auth.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import {
  publicUserWithCountsSelect,
  withoutPassword,
} from '../modules/publicUser.js';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(15),
  password: z.string().min(4),
  name: z.string().min(3).max(30),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes = new Hono();

authRoutes.post('/create_new_user', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  const hashedPassword = await hashPassword(data.password);

  try {
    const user = await prisma.user.create({
      data: { ...data, password: hashedPassword },
      select: publicUserWithCountsSelect,
    });
    const token = await createJwt(user);
    return c.json({ token, user });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    if (err.code === 'P2002' && err.meta?.target) {
      const notUnique: string[] = [];
      if (Array.isArray(err.meta.target)) {
        err.meta.target.forEach((field: string) => notUnique.push(field));
      }
      return c.json({ notUnique }, 400);
    }
    throw e;
  }
});

authRoutes.post('/sign_in', zValidator('json', signInSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...publicUserWithCountsSelect,
      password: true,
    },
  });

  if (!user) {
    return c.json({ message: 'Invalid Username or Password' }, 401);
  }

  const isValid = await comparePasswords(password, user.password);
  if (!isValid) {
    return c.json({ message: 'Invalid Username or Password' }, 401);
  }

  const token = await createJwt(user);
  return c.json({ token, user: withoutPassword(user) });
});
