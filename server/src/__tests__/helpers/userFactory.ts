import prisma from '../../db.js';
import { createJwt } from '../../modules/auth.js';

const BCRYPT_TEST_PASSWORD_HASH =
  '$2b$10$7EqJtq98hPqEX7fNZaFWoOHiA6f6S4WQ5lHppZArYrusS4x2QV/pW';

type SeedUserInput = {
  email: string;
  username: string;
  name: string;
  bio?: string;
  image?: string;
};

export const createSeededUserWithToken = async (input: SeedUserInput) => {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      name: input.name,
      bio: input.bio,
      image: input.image,
      password: BCRYPT_TEST_PASSWORD_HASH,
    },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      image: true,
    },
  });

  const token = await createJwt({ id: user.id, username: user.username });
  return { user, token };
};
