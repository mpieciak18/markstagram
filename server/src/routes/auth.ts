import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import db from '../db.js';
import { comparePasswords, createJwt, hashPassword } from '../modules/auth.js';
import { DatabaseError } from 'pg';
import {
  publicUserWithCountsColumns,
  toPublicUserWithCounts,
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
import { users } from '../db/schema.js';

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

const userWithPasswordAndCountsColumns = {
  ...publicUserWithCountsColumns,
  password: users.password,
} as const;

const findUserWithCountsById = async (id: number) => {
  const row = await db
    .select(publicUserWithCountsColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return row[0] ? toPublicUserWithCounts(row[0]) : null;
};

const unwrapDatabaseError = (error: unknown): DatabaseError | null => {
  if (error instanceof DatabaseError) return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'cause' in error &&
    (error as { cause?: unknown }).cause instanceof DatabaseError
  ) {
    return (error as { cause: DatabaseError }).cause;
  }
  return null;
};

const extractNotUniqueUserFields = (error: unknown): Array<'email' | 'username'> | null => {
  const databaseError = unwrapDatabaseError(error);
  if (!databaseError || databaseError.code !== '23505') {
    return null;
  }

  const notUnique = new Set<'email' | 'username'>();

  if (databaseError.constraint === 'User_email_key') notUnique.add('email');
  if (databaseError.constraint === 'User_username_key') notUnique.add('username');

  const detail = `${databaseError.detail ?? ''} ${databaseError.message ?? ''}`.toLowerCase();
  if (detail.includes('email')) notUnique.add('email');
  if (detail.includes('username')) notUnique.add('username');

  if (notUnique.size === 0) {
    notUnique.add('email');
  }

  return (['email', 'username'] as const).filter((field): field is 'email' | 'username' =>
    notUnique.has(field),
  );
};

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
    const inserted = await db
      .insert(users)
      .values({ ...data, password: hashedPassword })
      .returning({ id: users.id });

    const user = await findUserWithCountsById(inserted[0].id);
    if (!user) throw new Error('Failed to load created user');

    const token = await createJwt(user);
    return c.json({ token, user });
  } catch (e) {
    const notUnique = extractNotUniqueUserFields(e);
    if (notUnique) {
      return c.json({ notUnique }, 400);
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

  const rows = await db
    .select(userWithPasswordAndCountsColumns)
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];

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
  const userWithoutPassword = withoutPassword(user);
  const token = await createJwt(userWithoutPassword);
  return c.json({ token, user: toPublicUserWithCounts(userWithoutPassword) });
});
