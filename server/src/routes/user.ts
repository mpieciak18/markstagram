import { Hono } from 'hono';
import { and, eq, ilike, inArray, ne, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { DatabaseError } from 'pg';
import db from '../db.js';
import {
  comments,
  conversations,
  conversationsToUsers,
  follows,
  likes,
  messages,
  notifications,
  posts,
  saves,
  users,
} from '../db/schema.js';
import { hashPassword } from '../modules/auth.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { uploadImage } from '../middleware/upload.js';
import type { AppEnv } from '../app.js';
import type { UserUpdateData } from '@markstagram/shared-types';
import {
  publicUserColumns,
  publicUserWithCountsColumns,
  toPublicUser,
  toPublicUserWithCounts,
} from '../modules/publicUser.js';

const idSchema = z.object({ id: z.number().int() });
const searchSchema = z.object({ name: z.string() });
const emailSchema = z.object({ email: z.string() });
const usernameSchema = z.object({ username: z.string() });
const updateSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).max(15).optional(),
  name: z.string().min(3).max(30).optional(),
  bio: z.string().optional(),
  password: z.string().min(4).optional(),
});

export const userRoutes = new Hono<AppEnv>();

const findUserWithCountsById = async (id: number) => {
  const rows = await db
    .select(publicUserWithCountsColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  const row = rows[0];
  return row ? toPublicUserWithCounts(row) : null;
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

const extractNotUniqueFields = (error: unknown): Set<'email' | 'username'> | null => {
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

  return notUnique;
};

userRoutes.put('/', uploadImage, async (c) => {
  const user = c.get('user');
  const image = c.get('image' as never) as string | undefined;
  const body = await c.req.parseBody();

  const rawData: Record<string, string> = {};
  for (const key of ['email', 'username', 'name', 'bio'] as const) {
    const val = body[key];
    if (typeof val === 'string' && val) rawData[key] = val;
  }

  const password = body['password'];
  if (typeof password === 'string' && password) {
    rawData.password = password;
  }

  const parsed = updateSchema.safeParse(rawData);
  if (!parsed.success) {
    return c.json({ message: 'Invalid input' }, 400);
  }

  const data: UserUpdateData = {
    email: parsed.data.email,
    username: parsed.data.username,
    name: parsed.data.name,
    bio: parsed.data.bio,
  };

  if (parsed.data.password) {
    data.password = await hashPassword(parsed.data.password);
  }

  try {
    let oldImage: string | null | undefined;

    if (image) {
      data.image = image;
      const oldData = await db
        .select({ image: users.image })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      oldImage = oldData[0]?.image;
    }

    const updatedIds = await db
      .update(users)
      .set(data)
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    if (!updatedIds[0]) {
      return c.json({ message: 'User not found' }, 404);
    }

    const updatedUser = await findUserWithCountsById(updatedIds[0].id);
    if (!updatedUser) {
      return c.json({ message: 'User not found' }, 404);
    }

    if (oldImage && oldImage !== process.env.DEFAULT_IMG) {
      await deleteFileFromStorage(oldImage);
    }

    return c.json({ user: updatedUser });
  } catch (error) {
    const notUnique = extractNotUniqueFields(error);

    if (notUnique) {
      if (notUnique.size === 0 && (data.email || data.username)) {
        const orConditions = [];
        if (data.email) orConditions.push(eq(users.email, data.email));
        if (data.username) orConditions.push(eq(users.username, data.username));

        if (orConditions.length > 0) {
          const existingUser = await db
            .select({ email: users.email, username: users.username })
            .from(users)
            .where(and(ne(users.id, user.id), or(...orConditions)))
            .limit(1);

          if (existingUser[0]?.email === data.email) notUnique.add('email');
          if (existingUser[0]?.username === data.username) notUnique.add('username');
        }
      }

      if (notUnique.has('email')) return c.json({ message: 'email in use' }, 400);
      if (notUnique.has('username')) return c.json({ message: 'username in use' }, 400);
      return c.json({ message: 'unique constraint violation' }, 400);
    }

    throw error;
  }
});

userRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');

  const user = await findUserWithCountsById(id);
  if (!user) return c.json({ message: 'User not found' }, 404);
  return c.json({ user });
});

userRoutes.post('/search', zValidator('json', searchSchema), async (c) => {
  const { name } = c.req.valid('json');

  const foundUsers = await db
    .select(publicUserColumns)
    .from(users)
    .where(or(ilike(users.name, `%${name}%`), ilike(users.username, `%${name}%`)));

  return c.json({ users: foundUsers.map((row) => toPublicUser(row)) });
});

userRoutes.post('/is-email-unique', zValidator('json', emailSchema), async (c) => {
  const { email } = c.req.valid('json');

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return c.json({ isEmailUnique: !user[0] });
});

userRoutes.post('/is-username-unique', zValidator('json', usernameSchema), async (c) => {
  const { username } = c.req.valid('json');

  const user = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return c.json({ isUsernameUnique: !user[0] });
});

userRoutes.delete('/', async (c) => {
  const user = c.get('user');

  const baseUser = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!baseUser[0]) return c.json({ message: 'User not found' }, 404);

  const userPosts = await db
    .select({ id: posts.id, image: posts.image })
    .from(posts)
    .where(eq(posts.userId, user.id));

  const conversationRows = await db
    .select({ conversationId: conversationsToUsers.conversationId })
    .from(conversationsToUsers)
    .where(eq(conversationsToUsers.userId, user.id));

  const imagesToDelete = Array.from(
    new Set(
      [baseUser[0].image, ...userPosts.map((post) => post.image)].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ).filter((url) => url !== process.env.DEFAULT_IMG);

  const postIds = userPosts.map((post) => post.id);
  const conversationIds = conversationRows.map((row) => row.conversationId);

  const deletedUsers = await db.transaction(async (tx) => {
    if (postIds.length > 0) {
      await tx.delete(notifications).where(inArray(notifications.postId, postIds));
    }

    await tx
      .delete(notifications)
      .where(or(eq(notifications.userId, user.id), eq(notifications.otherUserId, user.id)));

    await tx
      .delete(follows)
      .where(or(eq(follows.giverId, user.id), eq(follows.receiverId, user.id)));

    await tx.delete(messages).where(eq(messages.senderId, user.id));
    await tx.delete(comments).where(eq(comments.userId, user.id));
    await tx.delete(likes).where(eq(likes.userId, user.id));
    await tx.delete(saves).where(eq(saves.userId, user.id));

    if (postIds.length > 0) {
      await tx.delete(posts).where(inArray(posts.id, postIds));
    }

    return tx
      .delete(users)
      .where(eq(users.id, user.id))
      .returning(publicUserColumns);
  });

  const deletedUser = deletedUsers[0];
  if (!deletedUser) return c.json({ message: 'User not found' }, 404);

  if (conversationIds.length > 0) {
    await db
      .delete(conversations)
      .where(
        and(
          inArray(conversations.id, conversationIds),
          sql`NOT EXISTS (
            SELECT 1
            FROM "_ConversationToUser" ctu
            WHERE ctu."A" = ${conversations.id}
          )`,
        ),
      );
  }

  await Promise.allSettled(imagesToDelete.map((imageUrl) => deleteFileFromStorage(imageUrl)));

  return c.json({ user: toPublicUser(deletedUser) });
});
