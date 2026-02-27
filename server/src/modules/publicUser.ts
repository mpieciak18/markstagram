import type { User } from '@markstagram/shared-types';
import { sql } from 'drizzle-orm';
import { follows, posts, users } from '../db/schema.js';

export type SafeUser = Omit<User, 'password'>;

export const publicUserColumns = {
  id: users.id,
  createdAt: users.createdAt,
  email: users.email,
  username: users.username,
  name: users.name,
  bio: users.bio,
  image: users.image,
} as const;

export const publicUserWithCountsColumns = {
  ...publicUserColumns,
  postsCount: sql<number>`(
    SELECT COUNT(*)::int
    FROM "Post"
    WHERE "Post"."userId" = ${users.id}
  )`.as('postsCount'),
  givenFollowsCount: sql<number>`(
    SELECT COUNT(*)::int
    FROM "Follow"
    WHERE "Follow"."giverId" = ${users.id}
  )`.as('givenFollowsCount'),
  receivedFollowsCount: sql<number>`(
    SELECT COUNT(*)::int
    FROM "Follow"
    WHERE "Follow"."receiverId" = ${users.id}
  )`.as('receivedFollowsCount'),
} as const;

export const withoutPassword = <T extends { password: string }>(
  user: T,
): Omit<T, 'password'> => {
  const { password: _password, ...rest } = user;
  return rest;
};

export type PublicUserRow = {
  id: number;
  createdAt: Date;
  email: string;
  username: string;
  name: string;
  bio: string | null;
  image: string | null;
};

export type PublicUserWithCountsRow = PublicUserRow & {
  postsCount: number;
  givenFollowsCount: number;
  receivedFollowsCount: number;
};

export const toPublicUser = (row: PublicUserRow): SafeUser => ({
  id: row.id,
  createdAt: row.createdAt,
  email: row.email,
  username: row.username,
  name: row.name,
  bio: row.bio,
  image: row.image,
});

export const toPublicUserWithCounts = (
  row: PublicUserWithCountsRow,
): SafeUser & {
  _count: { posts: number; givenFollows: number; receivedFollows: number };
} => ({
  ...toPublicUser(row),
  _count: {
    posts: row.postsCount,
    givenFollows: row.givenFollowsCount,
    receivedFollows: row.receivedFollowsCount,
  },
});
