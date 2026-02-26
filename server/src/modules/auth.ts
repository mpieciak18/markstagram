import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;
const MIN_BCRYPT_SALT_ROUNDS = 8;
const MAX_BCRYPT_SALT_ROUNDS = 15;

const getBcryptSaltRounds = (): number => {
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BCRYPT_SALT_ROUNDS;
  }
  if (parsed < MIN_BCRYPT_SALT_ROUNDS) {
    return MIN_BCRYPT_SALT_ROUNDS;
  }
  if (parsed > MAX_BCRYPT_SALT_ROUNDS) {
    return MAX_BCRYPT_SALT_ROUNDS;
  }
  return parsed;
};

export const createJwt = async (user: {
  id: number;
  username: string;
}): Promise<string> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const token = await new SignJWT({
    id: user.id,
    username: user.username,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
};

export const comparePasswords = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  const result = await bcrypt.compare(password, hash);
  return result;
};

export const hashPassword = async (password: string): Promise<string> => {
  const result = await bcrypt.hash(password, getBcryptSaltRounds());
  return result;
};
