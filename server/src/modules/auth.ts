import * as bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';
import prisma from '@/db.js';
import { User } from '@markstagram/shared-types';

// Receives a user object, passes it along with the jwt_secret to the 'jwt' libary,
// and returns a signed JWT token.
export const createJwt = async (user: {
  id: number;
  username: string;
}): Promise<string> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  
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
// Validates a JWT token sent from the client and sends the verified token back.
// If there's no bearer inside the headers, no token inside the bearer, or the JWT token is unverified,
// then an error is sent back to the client instead.
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  const bearer = req.headers.authorization;

  if (!bearer?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not Authorized' });
    return;
  }

  const token = bearer.slice(7);
  if (!token) {
    res.status(401).json({ message: 'Invalid Token' });
    return;
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const { id, username } = payload as { id: number; username: string };

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    (req as Request & { user: User }).user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: 'Token Unverifiable' });
    return;
  }
};

// Compares a password string (e.g., user input) to a password hash (e.g., database value)
// and returns a 'salt' if it passes or an error if it doesn't pass.
export const comparePasswords = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  const result = await bcrypt.compare(password, hash);
  return result;
};

// Uses bcrypt to create a hash of a password (e.g., to then be stored in the database).
export const hashPassword = async (password: string): Promise<string> => {
  const result = await bcrypt.hash(password, 5);
  return result;
};
