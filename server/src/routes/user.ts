import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import prisma from '../db.js';
import { hashPassword } from '../modules/auth.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { uploadImage } from '../middleware/upload.js';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { AppEnv } from '../app.js';
import type { UserUpdateData } from '@markstagram/shared-types';
import {
  publicUserSelect,
  publicUserWithCountsSelect,
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
      const oldData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { image: true },
      });
      oldImage = oldData?.image;
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: publicUserWithCountsSelect,
    });

    if (oldImage && oldImage !== process.env.DEFAULT_IMG) {
      await deleteFileFromStorage(oldImage);
    }

    return c.json({ user: updatedUser });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    if (err.code === 'P2002') {
      const notUnique = new Set<string>();

      if (Array.isArray(err.meta?.target)) {
        if (err.meta.target.includes('email')) notUnique.add('email');
        if (err.meta.target.includes('username')) notUnique.add('username');
      }

      if (notUnique.size === 0) {
        const where = [];
        if (data.email) where.push({ email: data.email });
        if (data.username) where.push({ username: data.username });

        if (where.length > 0) {
          const existingUser = await prisma.user.findFirst({
            where: { id: { not: user.id }, OR: where },
            select: { email: true, username: true },
          });

          if (existingUser?.email === data.email) notUnique.add('email');
          if (existingUser?.username === data.username) notUnique.add('username');
        }
      }

      // Fallback for adapters that omit `meta.target`
      const message = String(err.message).toLowerCase();
      if (message.includes('email')) notUnique.add('email');
      if (message.includes('username')) notUnique.add('username');

      if (notUnique.has('email')) return c.json({ message: 'email in use' }, 400);
      if (notUnique.has('username')) return c.json({ message: 'username in use' }, 400);
      return c.json({ message: 'unique constraint violation' }, 400);
    }
    throw e;
  }
});

userRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserWithCountsSelect,
  });
  if (!user) return c.json({ message: 'User not found' }, 404);
  return c.json({ user });
});

userRoutes.post('/search', zValidator('json', searchSchema), async (c) => {
  const { name } = c.req.valid('json');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: name, mode: 'insensitive' } },
        { username: { contains: name, mode: 'insensitive' } },
      ],
    },
    select: publicUserSelect,
  });
  return c.json({ users });
});

userRoutes.post('/is-email-unique', zValidator('json', emailSchema), async (c) => {
  const { email } = c.req.valid('json');
  const user = await prisma.user.findUnique({ where: { email } });
  return c.json({ isEmailUnique: !user });
});

userRoutes.post('/is-username-unique', zValidator('json', usernameSchema), async (c) => {
  const { username } = c.req.valid('json');
  const user = await prisma.user.findUnique({ where: { username } });
  return c.json({ isUsernameUnique: !user });
});

userRoutes.delete('/', async (c) => {
  const user = c.get('user');
  const userAssets = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      image: true,
      posts: { select: { id: true, image: true } },
      conversations: { select: { id: true } },
    },
  });

  if (!userAssets) return c.json({ message: 'User not found' }, 404);

  const imagesToDelete = Array.from(
    new Set(
      [userAssets.image, ...userAssets.posts.map((post) => post.image)].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  ).filter((url) => url !== process.env.DEFAULT_IMG);
  const postIds = userAssets.posts.map((post) => post.id);

  const conversationIds = userAssets.conversations.map((conversation) => conversation.id);

  try {
    const deletedUser = await prisma.$transaction(async (tx) => {
      if (postIds.length > 0) {
        await tx.notification.deleteMany({ where: { postId: { in: postIds } } });
        await tx.comment.deleteMany({ where: { postId: { in: postIds } } });
        await tx.like.deleteMany({ where: { postId: { in: postIds } } });
        await tx.save.deleteMany({ where: { postId: { in: postIds } } });
      }

      await tx.notification.deleteMany({
        where: {
          OR: [{ userId: user.id }, { otherUserId: user.id }],
        },
      });
      await tx.follow.deleteMany({
        where: {
          OR: [{ giverId: user.id }, { receiverId: user.id }],
        },
      });
      await tx.message.deleteMany({ where: { senderId: user.id } });
      await tx.comment.deleteMany({ where: { userId: user.id } });
      await tx.like.deleteMany({ where: { userId: user.id } });
      await tx.save.deleteMany({ where: { userId: user.id } });

      if (postIds.length > 0) {
        await tx.post.deleteMany({ where: { id: { in: postIds } } });
      }

      return tx.user.delete({
        where: { id: user.id },
        select: publicUserSelect,
      });
    });

    if (conversationIds.length > 0) {
      await prisma.conversation.deleteMany({
        where: {
          id: { in: conversationIds },
          users: { none: {} },
        },
      });
    }

    await Promise.allSettled(imagesToDelete.map((imageUrl) => deleteFileFromStorage(imageUrl)));
    return c.json({ user: deletedUser });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    if (err.code === 'P2025') return c.json({ message: 'User not found' }, 404);
    throw e;
  }
});
