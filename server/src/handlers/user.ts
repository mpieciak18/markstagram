import prisma from '../db.js';
import { comparePasswords, createJwt, hashPassword } from '../modules/auth.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { NextFunction, Request, Response } from 'express';
import {
  MayHaveImage,
  UserStatsCount,
  UserUpdateData,
} from '@markstagram/shared-types';
import { AuthReq } from '@/types/types.js';
import { NewUserBody } from '@markstagram/shared-types';
import type { User } from '@markstagram/shared-types';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

// Creates a new user in the database and returns a signed JWT to the client.
// Any error is assumed to be related to user input and is returned to the client as such.
export const createNewUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const data: NewUserBody = req.body;
  data.password = await hashPassword(req.body.password);
  try {
    const userData = await prisma.user.create({
      data: data,
    });
    const token: string = await createJwt(userData);
    const user: User & UserStatsCount = {
      ...userData,
      _count: {
        posts: 0,
        receivedFollows: 0,
        givenFollows: 0,
      },
    };
    res.json({ token, user });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    // Checks if error is a 'unique constraint failure'
    if (err.code == 'P2002' && err.meta?.target) {
      const notUnique: string[] = [];
      if (Array.isArray(err.meta?.target)) {
        err.meta.target.forEach((field: string) => notUnique.push(field));
      }
      res.status(400).json({ notUnique });
    } else {
      (e as { type: string }).type = 'input';
      next(e);
    }
  }
};

// Verifies sign-in attempt by checking if username exists and if passwords match.
// If both conditions don't pass, then an error message is returned to the client.
// Otherwise, a signed JWT is returned back to the client.
export const signIn = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // First, find user in database by username.
  const user = await prisma.user.findUnique({
    where: {
      email: req.body.email,
    },
    include: {
      _count: {
        select: {
          givenFollows: true,
          receivedFollows: true,
          posts: true,
        },
      },
    },
  });
  if (!user) {
    res.status(401).json({ message: 'Invalid Username or Password' });
    return;
  }
  // Second, compare passwords (ie, user input vs database value).
  const isValid = await comparePasswords(req.body.password, user.password);
  if (!isValid) {
    res.status(401).json({ message: 'Invalid Username or Password' });
    return;
  }
  // Third, return auth token to client.
  const token = await createJwt(user);
  res.json({ token, user });
};

// Deletes a user's account from the database
// NOTE: Currently only used for testing purposes
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Delete user
    const user = await prisma.user.delete({
      where: { id: (req as AuthReq).user.id },
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the deletion 'runs' but nothing is returned).
    if (!user) throw new Error();
    // Return deleted user data
    res.json({ user });
  } catch (e) {
    // Error handled at top-level (ie, server.js) as 500 error
    next(e);
    return;
  }
};

// Updates a user's account fields
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const request = req as AuthReq & MayHaveImage;
  // Format data needed for update
  const keys = ['email', 'username', 'name', 'bio'];
  const data: UserUpdateData = {};
  keys.forEach((key) => {
    // @ts-ignore
    if (request.body[key]) data[key] = req.body[key];
  });
  if (req.body.password) {
    data.password = await hashPassword(req.body.password);
  }

  try {
    // If an image was uploaded, add it to the data
    // Also, get the user's old image
    let oldImage: string | undefined | null;
    if (request.image) {
      data.image = request.image;
      const oldData = await prisma.user.findUnique({
        where: { id: request.user.id },
        select: {
          image: true,
        },
      });
      oldImage = oldData?.image;
    }
    // Update user
    const user = await prisma.user.update({
      where: { id: request.user.id },
      data,
      include: {
        _count: {
          select: {
            givenFollows: true,
            receivedFollows: true,
            posts: true,
          },
        },
      },
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
    if (!user) throw new Error();
    // Delete old image
    if (oldImage && oldImage !== process.env.DEFAULT_IMG) {
      await deleteFileFromStorage(oldImage);
    }
    // Return updated user data
    res.json({ user });
  } catch (e) {
    const err = e as PrismaClientKnownRequestError;
    // Checks if there's a 'unique constraint failure' & handles it as a 401 error
    if (err.code == 'P2002') {
      if (Array.isArray(err.meta?.target)) {
        if (err.meta?.target?.includes('email')) {
          res.status(400).json({ message: 'email in use' });
        } else if (err.meta?.target?.includes('username')) {
          res.status(400).json({ message: 'username in use' });
        } else {
          next(err);
        }
      } else {
        next(err);
      }
    }
    // Else, is handled as a 500 error
    else {
      next(e);
    }
  }
};

// Attempts to find user by id
export const getSingleUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, find user in database by id.
    const user = await prisma.user.findUnique({
      where: {
        id: req.body.id,
      },
      include: {
        _count: {
          select: {
            givenFollows: true,
            receivedFollows: true,
            posts: true,
          },
        },
      },
    });
    if (!user) throw new Error();
    // Second, return user record to client.
    res.json({ user });
  } catch (e) {
    // Error handled at top-level (ie, server.js) as 500 error
    next(e);
    return;
  }
};

// Attempts to find user(s) by name or username
export const getUsersByName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, search users by name in database
    const users = await prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: `%${req.body.name}%`,
              mode: 'insensitive',
            },
          },
          {
            username: {
              contains: `%${req.body.name}%`,
              mode: 'insensitive',
            },
          },
        ],
      },
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the search 'runs' but nothing returns
    if (!users) throw new Error();
    // Second, return users array to client.
    res.json({ users });
  } catch (e) {
    // Error handled at top-level (ie, server.js) as 500 error
    next(e);
    return;
  }
};

// Checks if an email is unique (ie, not taken by another user)
export const isEmailUnique = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let isEmailUnique = false;
    // First, search for a user by email
    const user = await prisma.user.findUnique({
      where: {
        email: req.body.email,
      },
    });
    if (!user) isEmailUnique = true;
    // Second, return result (bool) to client.
    res.json({ isEmailUnique });
  } catch (e) {
    // Error handled at top-level (ie, server.js) as 500 error
    next(e);
    return;
  }
};

// Checks if an username is unique (ie, not taken by another user)
export const isUsernameUnique = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let isUsernameUnique = false;
    // First, search for a user by username
    const user = await prisma.user.findUnique({
      where: {
        username: req.body.username,
      },
    });
    if (!user) isUsernameUnique = true;
    // Second, return result (bool) to client.
    res.json({ isUsernameUnique });
  } catch (e) {
    // Error handled at top-level (ie, server.js) as 500 error
    next(e);
    return;
  }
};
