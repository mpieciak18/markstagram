import { NextFunction, Response, Request } from 'express';
import prisma from '../db.js';
import { AuthReq } from '@/types/types.js';

// Creates a comment
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to create comment
    const comment = await prisma.comment.create({
      data: {
        message: req.body.message,
        postId: req.body.id,
        userId: (req as AuthReq).user.id,
      },
      include: { user: true },
    });
    // If no comment is created, handle it at the top-level (server.js) as 500 error
    if (!comment) throw new Error();

    // Second, send comment data back to client
    res.json({ comment });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets (limited number of) comments from post
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get all comments from post with limit
    // If no comments are found, handle it at the top-level (server.js) as 500 error
    const comments = await prisma.comment.findMany({
      where: { postId: req.body.id },
      take: req.body.limit,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!comments) throw new Error();

    // Second, return comments back to client
    res.json({ comments });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets a single comment by id
export const getSingleComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get commend by id
    // If no comment is found, handle it at the top-level (server.js) as 500 error
    const comment = await prisma.comment.findUnique({
      where: { id: req.body.id },
    });
    if (!comment) throw new Error();
    // Second, return comment back to client
    res.json({ comment });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Deletes a comment
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, attempt to delete the comment
    const comment = await prisma.comment.delete({
      where: { id: req.body.id },
    });
    // If no comment is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!comment) throw new Error();
    // Finally, send deleted comment back to client
    res.json({ comment });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Updates a comment
export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Attempt to update comment
    const comment = await prisma.comment.update({
      where: { id: req.body.id },
      data: { message: req.body.message },
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
    if (!comment) throw new Error();
    // Return updated comment
    res.json({ comment });
  } catch (e) {
    // If error, handle it as a 500 error
    next(e);
  }
};
