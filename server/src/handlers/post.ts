import prisma from '../db.js';
import { deleteFileFromStorage } from '../config/gcloud.js';
import { MayHaveImage, PostUpdateData } from '@markstagram/shared-types';
import { AuthReq } from '@/types/types.js';
import { NextFunction, Response, Request } from 'express';

// Creates a post
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // If no image url is passed from the upload middleware, handle it at the top-level (server.js) as 500 error
  if (!(req as Request & MayHaveImage).image) {
    const e = new Error();
    next(e);
    return;
  }

  try {
    // First, create post
    const post = await prisma.post.create({
      data: {
        image: (req as Request & MayHaveImage).image,
        caption: req.body.caption,
        userId: (req as AuthReq).user.id,
      },
    });
    // If no post is created, handle it at the top-level (server.js) as 500 error
    if (!post) throw new Error();
    // Second, send post data back to client
    res.json({ post });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets a post based on a single post's id (if it exists)
export const getSinglePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get post by id
    // If no post is found, handle it at the top-level (server.js) as 500 error
    const post = await prisma.post.findUnique({
      where: { id: req.body.id },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        user: true,
      },
    });
    if (!post) throw new Error();
    // Second, return data back to client
    res.json({ post });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets all posts from a single user by id
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, get all posts with limit
    // If no posts are found, handle it at the top-level (server.js) as 500 error
    const posts = await prisma.post.findMany({
      take: req.body.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        user: true,
      },
    });
    if (!posts) throw new Error();
    // Second, return data back to client
    res.json({ posts });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Gets all posts from a single user by id
export const getUserPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, confirm if provided user exists
    // If no user is found, handle it at the top-level (server.js) as 500 error
    const otherUser = await prisma.user.findUnique({
      where: { id: req.body.id },
    });
    if (!otherUser) throw new Error();
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }

  try {
    // Second, get posts by user id
    // If no post is found, handle it at the top-level (server.js) as 500 error
    const posts = await prisma.post.findMany({
      where: { userId: req.body.id },
      take: req.body.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });
    if (!posts) throw new Error();
    // Second, return data back to client
    res.json({ posts });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Deletes a post
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // First, delete the post
    const post = await prisma.post.delete({
      where: { id: req.body.id },
    });
    // If no post is found-and-deleted, handle it at the top-level (server.js) as 500 error
    if (!post) throw new Error();
    // Second, delete file of deleted post from storage
    await deleteFileFromStorage(post.image);
    // Finally, send deleted follow data back to client
    res.json({ post });
  } catch (e) {
    // DB errors are handled at top-level (server.js) as 500 error
    next(e);
    return;
  }
};

// Updates a post
export const updatePost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Format data needed for update
  const keys = ['caption'];
  const data: PostUpdateData = {};
  keys.forEach((key) => {
    // @ts-ignore
    if (req.body[key]) data[key] = req.body[key];
  });

  try {
    // Update post
    const post = await prisma.post.update({
      where: { id: req.body.id },
      data,
    });
    // While the previous try/catch (along with the 'protect' middleware) should catch all errors,
    // this is added as an extra step of error handling (in case the update 'runs' but nothing is returned).
    if (!post) throw new Error();
    // Return updated user data
    res.json({ post });
  } catch (e) {
    // If error, handle it as a 500 error
    next(e);
    return;
  }
};
