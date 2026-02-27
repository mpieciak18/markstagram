import db from '../../db.js';
import { users } from '../../db/schema.js';
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

  const inserted = await db
    .insert(users)
    .values({
      email: input.email,
      username: input.username,
      name: input.name,
      bio: input.bio,
      image: input.image,
      password: BCRYPT_TEST_PASSWORD_HASH,
    })
    .returning({
      id: users.id,
      email: users.email,
      username: users.username,
      name: users.name,
      bio: users.bio,
      image: users.image,
    });

  const user = inserted[0];
  const token = await createJwt({ id: user.id, username: user.username });
  return { user, token };
};
