import * as bcrypt from 'bcrypt';
import { SignJWT } from 'jose';

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
  const result = await bcrypt.hash(password, 5);
  return result;
};
