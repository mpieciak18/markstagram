import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;
const MIN_BCRYPT_SALT_ROUNDS = 8;
const TEST_MIN_BCRYPT_SALT_ROUNDS = 4;
const MAX_BCRYPT_SALT_ROUNDS = 15;

const getMinBcryptSaltRounds = (): number => {
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.ENABLE_FAST_BCRYPT_FOR_TESTS === '1'
  ) {
    return TEST_MIN_BCRYPT_SALT_ROUNDS;
  }

  return MIN_BCRYPT_SALT_ROUNDS;
};

const getBcryptSaltRounds = (): number => {
  const minRounds = getMinBcryptSaltRounds();
  const parsed = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_BCRYPT_SALT_ROUNDS;
  }
  if (parsed < minRounds) {
    return minRounds;
  }
  if (parsed > MAX_BCRYPT_SALT_ROUNDS) {
    return MAX_BCRYPT_SALT_ROUNDS;
  }
  return parsed;
};

type BunPasswordApi = {
  hash: (
    password: string,
    options: { algorithm: 'bcrypt'; cost: number },
  ) => Promise<string>;
  verify: (password: string, hash: string) => Promise<boolean>;
};

const getBunPasswordApi = (): BunPasswordApi | null => {
  const bunGlobal = (globalThis as { Bun?: { password?: BunPasswordApi } }).Bun;
  if (!bunGlobal?.password) {
    return null;
  }

  return bunGlobal.password;
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
  const bunPassword = getBunPasswordApi();
  if (bunPassword) {
    return bunPassword.verify(password, hash);
  }

  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string): Promise<string> => {
  const bunPassword = getBunPasswordApi();
  if (bunPassword) {
    return bunPassword.hash(password, {
      algorithm: 'bcrypt',
      cost: getBcryptSaltRounds(),
    });
  }

  return bcrypt.hash(password, getBcryptSaltRounds());
};
