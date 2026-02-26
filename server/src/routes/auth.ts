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
import {
  applySignInRateLimit,
  applySignUpRateLimit,
  checkSignInLock,
  clearFailedSignIns,
  getAuthClientId,
  getSignInAttemptKey,
  recordFailedSignIn,
} from '../modules/authAbuse.js';

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
  const clientId = getAuthClientId(c);
  const signUpLimit = applySignUpRateLimit(clientId);
  if (signUpLimit.limited) {
    c.header('Retry-After', String(signUpLimit.retryAfterSeconds));
    return c.json({ message: 'Too many sign-up attempts. Please try again later.' }, 429);
  }

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
    if (err.code === 'P2002') {
      const notUnique = new Set<string>();
      if (Array.isArray(err.meta?.target)) {
        err.meta.target.forEach((field) => {
          if (field === 'email' || field === 'username') notUnique.add(field);
        });
      }

      if (notUnique.size === 0) {
        const existingUsers = await prisma.user.findMany({
          where: {
            OR: [{ email: data.email }, { username: data.username }],
          },
          select: { email: true, username: true },
        });

        if (existingUsers.some((user) => user.email === data.email)) {
          notUnique.add('email');
        }
        if (existingUsers.some((user) => user.username === data.username)) {
          notUnique.add('username');
        }
      }

      // Fallback for adapters that omit `meta.target`
      const message = String(err.message).toLowerCase();
      if (message.includes('email')) notUnique.add('email');
      if (message.includes('username')) notUnique.add('username');

      if (notUnique.size === 0) notUnique.add('email');

      const orderedFields = ['email', 'username'].filter((field) =>
        notUnique.has(field),
      );
      return c.json({ notUnique: orderedFields }, 400);
    }
    throw e;
  }
});

authRoutes.post('/sign_in', zValidator('json', signInSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const clientId = getAuthClientId(c);
  const signInRateLimit = applySignInRateLimit(clientId);
  if (signInRateLimit.limited) {
    c.header('Retry-After', String(signInRateLimit.retryAfterSeconds));
    return c.json(
      { message: 'Too many sign-in attempts. Please try again later.' },
      429,
    );
  }

  const attemptKey = getSignInAttemptKey(clientId, email);
  const lockStatus = checkSignInLock(attemptKey);
  if (lockStatus.limited) {
    c.header('Retry-After', String(lockStatus.retryAfterSeconds));
    return c.json(
      { message: 'Too many sign-in attempts. Please try again later.' },
      429,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      ...publicUserWithCountsSelect,
      password: true,
    },
  });

  if (!user) {
    const failedAttempt = recordFailedSignIn(attemptKey);
    if (failedAttempt.limited) {
      c.header('Retry-After', String(failedAttempt.retryAfterSeconds));
      return c.json(
        { message: 'Too many sign-in attempts. Please try again later.' },
        429,
      );
    }
    return c.json({ message: 'Invalid Username or Password' }, 401);
  }

  const isValid = await comparePasswords(password, user.password);
  if (!isValid) {
    const failedAttempt = recordFailedSignIn(attemptKey);
    if (failedAttempt.limited) {
      c.header('Retry-After', String(failedAttempt.retryAfterSeconds));
      return c.json(
        { message: 'Too many sign-in attempts. Please try again later.' },
        429,
      );
    }
    return c.json({ message: 'Invalid Username or Password' }, 401);
  }

  clearFailedSignIns(attemptKey);
  const token = await createJwt(user);
  return c.json({ token, user: withoutPassword(user) });
});
