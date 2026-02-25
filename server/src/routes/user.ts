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

const idSchema = z.object({ id: z.number().int() });
const searchSchema = z.object({ name: z.string() });
const emailSchema = z.object({ email: z.string() });
const usernameSchema = z.object({ username: z.string() });

export const userRoutes = new Hono<AppEnv>();

userRoutes.put('/', uploadImage, async (c) => {
  const user = c.get('user');
  const image = c.get('image' as never) as string | undefined;
  const body = await c.req.parseBody();

  const data: UserUpdateData = {};
  for (const key of ['email', 'username', 'name', 'bio'] as const) {
    const val = body[key];
    if (typeof val === 'string' && val) data[key] = val;
  }
  const password = body['password'];
  if (typeof password === 'string' && password) {
    data.password = await hashPassword(password);
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
      include: {
        _count: {
          select: { givenFollows: true, receivedFollows: true, posts: true },
        },
      },
    });

    if (oldImage && oldImage !== process.env.DEFAULT_IMG) {
      await deleteFileFromStorage(oldImage);
    }

    return c.json({ user: updatedUser });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    if (err.code === 'P2002' && Array.isArray(err.meta?.target)) {
      if (err.meta.target.includes('email')) {
        return c.json({ message: 'email in use' }, 400);
      }
      if (err.meta.target.includes('username')) {
        return c.json({ message: 'username in use' }, 400);
      }
    }
    throw e;
  }
});

userRoutes.post('/single', zValidator('json', idSchema), async (c) => {
  const { id } = c.req.valid('json');
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: { givenFollows: true, receivedFollows: true, posts: true },
      },
    },
  });
  if (!user) return c.json({ message: 'User not found' }, 404);
  return c.json({ user });
});

userRoutes.post('/search', zValidator('json', searchSchema), async (c) => {
  const { name } = c.req.valid('json');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: `%${name}%`, mode: 'insensitive' } },
        { username: { contains: `%${name}%`, mode: 'insensitive' } },
      ],
    },
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
  const deletedUser = await prisma.user.delete({ where: { id: user.id } });
  return c.json({ user: deletedUser });
});
