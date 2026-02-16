import prisma from '../db.js';
import { Response, NextFunction, Request } from 'express';
import { AuthReq } from '@/types/types.js';

// Creates a like
export const createLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to create like
    const like = await prisma.like.create({
      data: {
        postId: req.body.id,
        userId: (req as AuthReq).user.id,
      },
    });
    // If no like is created, handle it at the top-level (server.js) as 500 error
    if (!like) throw new Error();
    // Second, send like data back to client
    res.json({ like });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets (limited number of) likes from post
export const getLikes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get all likes from post with limit
    // If no likes are found, handle it at the top-level (server.js) as 500 error
    const likes = await prisma.like.findMany({
      where: { postId: req.body.id },
      take: req.body.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
    if (!likes) throw new Error();
    // Second, return likes back to client
    res.json({ likes });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Deletes a like
export const deleteLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to delete the like
    const like = await prisma.like.delete({
      where: { id: req.body.id },
    });
    // If no like is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!like) throw new Error();
    // Finally, send deleted like back to client
    res.json({ like });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets like from signed-in user (if it exists for a post)
export const getLikeUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get like from post based on user id
    const like = await prisma.like.findFirst({
      where: { postId: req.body.id, userId: (req as AuthReq).user.id },
    });
    // Second, return like (found or not) back to client
    res.json({ like });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};
