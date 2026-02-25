import type { User } from '@markstagram/shared-types';

export type SafeUser = Omit<User, 'password'>;

export const publicUserSelect = {
  id: true,
  createdAt: true,
  email: true,
  username: true,
  name: true,
  bio: true,
  image: true,
} as const;

export const publicUserWithCountsSelect = {
  ...publicUserSelect,
  _count: {
    select: {
      posts: true,
      givenFollows: true,
      receivedFollows: true,
    },
  },
} as const;

export const withoutPassword = <T extends { password: string }>(
  user: T,
): Omit<T, 'password'> => {
  const { password: _password, ...rest } = user;
  return rest;
};
